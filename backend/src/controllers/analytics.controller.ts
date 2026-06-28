import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma';

interface TenantReq extends Request { tenantId?: string; }

export const getAdvancedAnalytics = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

    const range = req.query.range as string || '7d';
    let startDate = new Date();
    let endDate = new Date(startDate);
    
    // Fetch custom thresholds
    const settings = await prisma.settings.findFirst({
      where: { tenantId }
    });
    const repeatThreshold = settings?.repeatOrderThreshold || 5;
    const vipThreshold = settings?.vipSpendThreshold || 3000;

    startDate.setHours(0, 0, 0, 0);

    if (range === 'today') {
      // startDate is already today
    } else if (range === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (range === 'ytd') {
      startDate.setMonth(0, 1);
    }

    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
        status: { notIn: ['CANCELLED'] } // Consider non-cancelled orders
      },
      include: {
        items: true
      }
    });

    // Extract all unique product IDs from these orders
    const productIds = new Set<string>();
    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        if (item.productId) {
          productIds.add(item.productId);
        }
      });
    });

    // Fetch the products along with their recipes
    const products = await prisma.product.findMany({
      where: {
        id: { in: Array.from(productIds) }
      },
      include: {
        recipe: {
          include: {
            ingredients: {
              include: {
                rawMaterial: true
              }
            }
          }
        }
      }
    });

    // Create a map for quick product COGS lookup and name
    const productDataMap = new Map<string, { cogs: number; name: string }>();
    products.forEach((product: any) => {
      let itemCOGS = 0;
      const recipe = product.recipe;
      
      if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach((ri: any) => {
          itemCOGS += (ri.quantity * (ri.rawMaterial?.costPerUnit || 0));
        });
      } else {
        // Fallback COGS: assume 30% of the price if no recipe defined
        itemCOGS = product.basePrice * 0.3;
      }
      productDataMap.set(product.id, { cogs: itemCOGS, name: product.name });
    });

    let grossRevenue = 0;
    let totalCOGS = 0;

    // For Top Margin Contributors and Menu Matrix
    const productProfitMap = new Map<string, { name: string, quantity: number, revenue: number, totalCOGS: number }>();

    // For Peak Hours (Counts)
    let lunchRushOrders = 0; // 12-15
    let dinnerPeakOrders = 0; // 19-22
    let lateNightOrders = 0; // 22-24

    // For Customer Retention
    const uniquePhones = Array.from(new Set(orders.filter((o: any) => o.phone).map((o: any) => o.phone))) as string[];
    const firstOrders = await prisma.order.groupBy({
      by: ['phone'],
      where: { tenantId, phone: { in: uniquePhones }, status: { notIn: ['CANCELLED'] } },
      _min: { createdAt: true },
      _count: { id: true },
      _sum: { total: true }
    });
    
    const customerStatsMap = new Map<string, { firstDate: Date, isVIP: boolean, isRepeat: boolean }>();
    firstOrders.forEach((fo) => {
      if (fo.phone && fo._min.createdAt) {
        const isRepeat = fo._count.id >= repeatThreshold;
        const isVIP = fo._sum.total !== null && fo._sum.total >= vipThreshold;
        customerStatsMap.set(fo.phone, { firstDate: fo._min.createdAt, isVIP, isRepeat });
      }
    });

    let newCustomerRevenue = 0;
    let returningCustomerRevenue = 0;
    let vipCustomerRevenue = 0;
    let newCustomerOrders = 0;
    let returningCustomerOrders = 0;
    let vipCustomerOrders = 0;

    orders.forEach((order: any) => {
      grossRevenue += order.total;

      const hour = new Date(order.createdAt).getHours();
      if (hour >= 12 && hour < 15) lunchRushOrders++;
      else if (hour >= 19 && hour < 22) dinnerPeakOrders++;
      else if (hour >= 22 || hour < 4) lateNightOrders++;

      order.items.forEach((item: any) => {
        const prodData = productDataMap.get(item.productId);
        let itemCOGS = prodData ? prodData.cogs : (item.price * 0.3);
        const name = prodData ? prodData.name : 'Unknown Product';
        
        const lineCOGS = (itemCOGS * item.quantity);
        const lineRevenue = (item.price * item.quantity);
        
        totalCOGS += lineCOGS;

        const existing = productProfitMap.get(item.productId) || { name, quantity: 0, revenue: 0, totalCOGS: 0 };
        existing.quantity += item.quantity;
        existing.revenue += lineRevenue;
        existing.totalCOGS += lineCOGS;
        productProfitMap.set(item.productId, existing);
      });

      // Track Customer Retention
      if (order.phone) {
         const stats = customerStatsMap.get(order.phone);
         if (stats && stats.isVIP) {
            vipCustomerOrders++;
            vipCustomerRevenue += order.total;
         } else if (stats && stats.firstDate >= startDate) {
            newCustomerOrders++;
            newCustomerRevenue += order.total;
         } else {
            returningCustomerOrders++;
            returningCustomerRevenue += order.total;
         }
      } else {
        // Assume walkin without phone is new customer
        newCustomerOrders++;
        newCustomerRevenue += order.total;
      }
    });

    const totalOrders = orders.length;
    const netProfit = grossRevenue - totalCOGS;
    
    // Calculate COGS margin percentage
    let cogsMargin = 0;
    if (grossRevenue > 0) {
      cogsMargin = (totalCOGS / grossRevenue) * 100;
    }

    // Prepare Top Margin Items
    const topMarginItems = Array.from(productProfitMap.values())
      .map(item => {
        const profit = item.revenue - item.totalCOGS;
        const cogsPercentage = item.revenue > 0 ? (item.totalCOGS / item.revenue) * 100 : 0;
        return {
          name: item.name,
          quantity: item.quantity,
          profit,
          cogsPercentage: Math.round(cogsPercentage)
        };
      })
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 3); // top 3

    // Prepare Peak Hours (relative to max bucket to simulate "Capacity %")
    const maxOrders = Math.max(lunchRushOrders, dinnerPeakOrders, lateNightOrders, 1);
    const peakHours = {
      lunch: Math.round((lunchRushOrders / maxOrders) * 100) || 0,
      dinner: Math.round((dinnerPeakOrders / maxOrders) * 100) || 0,
      late: Math.round((lateNightOrders / maxOrders) * 100) || 0,
    };

    // Menu Engineering Matrix
    const allItems = Array.from(productProfitMap.values()).map(item => ({
      name: item.name,
      quantity: item.quantity,
      profit: item.revenue - item.totalCOGS,
      cogsPercentage: item.revenue > 0 ? Math.round((item.totalCOGS / item.revenue) * 100) : 0
    }));

    const totalQuantity = allItems.reduce((acc, item) => acc + item.quantity, 0);
    const totalItemProfit = allItems.reduce((acc, item) => acc + item.profit, 0);
    const avgQuantity = allItems.length > 0 ? totalQuantity / allItems.length : 0;
    const avgProfit = allItems.length > 0 ? totalItemProfit / allItems.length : 0;

    const stars: any[] = [];
    const plowhorses: any[] = [];
    const puzzles: any[] = [];
    const dogs: any[] = [];

    allItems.forEach(item => {
      const highVol = item.quantity >= avgQuantity;
      const highMargin = item.profit >= avgProfit;
      
      if (highVol && highMargin) stars.push(item);
      else if (highVol && !highMargin) plowhorses.push(item);
      else if (!highVol && highMargin) puzzles.push(item);
      else dogs.push(item);
    });

    const sortDesc = (a: any, b: any) => b.profit - a.profit;
    stars.sort(sortDesc);
    plowhorses.sort(sortDesc);
    puzzles.sort(sortDesc);
    dogs.sort(sortDesc);

    res.json({
      grossRevenue,
      totalOrders,
      cogsMargin: Number(cogsMargin.toFixed(1)),
      netProfit,
      // Pass a dummy trend for now
      revenueTrend: 12.5,
      ordersTrend: 8.3,
      cogsTrend: -1.2,
      profitTrend: 15.4,
      topMarginItems,
      peakHours,
      customerRetention: {
        newCustomerRevenue,
        returningCustomerRevenue,
        vipCustomerRevenue,
        newCustomerOrders,
        returningCustomerOrders,
        vipCustomerOrders
      },
      menuMatrix: {
        stars,
        plowhorses,
        puzzles,
        dogs
      }
    });
  } catch (error) {
    console.error('Advanced Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch advanced analytics' });
  }
};
