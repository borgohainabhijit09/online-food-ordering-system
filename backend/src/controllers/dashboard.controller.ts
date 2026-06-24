import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma';

interface TenantReq extends Request { tenantId?: string; }

export const getDashboardStats = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const tenantId = req.tenantId;

    const [
      todaysOrders,
      ordersThisWeek,
      ordersThisMonth,
      sixMonthsOrders,
      recentOrders
    ] = await Promise.all([
      prisma.order.findMany({
        where: { tenantId, createdAt: { gte: today } },
        select: { total: true, status: true }
      }),
      prisma.order.count({
        where: { tenantId, createdAt: { gte: sevenDaysAgo } }
      }),
      prisma.order.count({
        where: { tenantId, createdAt: { gte: thirtyDaysAgo } }
      }),
      prisma.order.findMany({
        where: { tenantId, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, total: true, status: true }
      }),
      prisma.order.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const revenueToday = todaysOrders
      .filter(o => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.total, 0);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const trendMap = new Map();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today);
      d.setMonth(today.getMonth() - i);
      const key = `${monthNames[d.getMonth()]}`;
      trendMap.set(key, { orders: 0, revenue: 0 });
    }

    sixMonthsOrders.forEach(o => {
      const d = new Date(o.createdAt);
      const key = `${monthNames[d.getMonth()]}`;
      if (trendMap.has(key)) {
        const current = trendMap.get(key);
        current.orders += 1;
        if (o.status !== 'CANCELLED') {
          current.revenue += o.total;
        }
        trendMap.set(key, current);
      }
    });

    const trendData = Array.from(trendMap.entries()).map(([name, data]) => ({ name, ...data }));

    const getOrdersByType = async (fromDate?: Date) => {
      const group = await prisma.order.groupBy({
        by: ['orderType'],
        where: {
          tenantId,
          status: { not: 'CANCELLED' },
          ...(fromDate ? { createdAt: { gte: fromDate } } : {})
        },
        _count: { id: true },
        _sum: { total: true }
      });
      return [
        { name: 'Delivery', value: group.find(g => g.orderType === 'DELIVERY')?._count.id || 0, revenue: group.find(g => g.orderType === 'DELIVERY')?._sum.total || 0 },
        { name: 'Takeaway', value: group.find(g => g.orderType === 'TAKEAWAY')?._count.id || 0, revenue: group.find(g => g.orderType === 'TAKEAWAY')?._sum.total || 0 },
        { name: 'Dine In', value: group.find(g => g.orderType === 'DINE_IN')?._count.id || 0, revenue: group.find(g => g.orderType === 'DINE_IN')?._sum.total || 0 }
      ];
    };

    const getTopProducts = async (fromDate?: Date) => {
      const orderItems = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            tenantId,
            status: { not: 'CANCELLED' },
            ...(fromDate ? { createdAt: { gte: fromDate } } : {})
          }
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      });
      const productIds = orderItems.map(i => i.productId);
      const products = await prisma.product.findMany({ where: { id: { in: productIds } }});
      return orderItems.map(item => ({
        name: products.find(p => p.id === item.productId)?.name || 'Unknown',
        quantity: item._sum?.quantity || 0,
        revenue: 0
      }));
    };

    const getUpcomingBirthdays = async () => {
      const customers = await prisma.customer.findMany({
        where: { tenantId, dob: { not: null } },
        select: { id: true, name: true, phone: true, dob: true }
      });

      const start = new Date();
      start.setHours(0,0,0,0);
      const end = new Date(start);
      end.setDate(start.getDate() + 3);
      end.setHours(23,59,59,999);

      return customers.filter(c => {
        if (!c.dob) return false;
        const bdayThisYear = new Date(c.dob);
        bdayThisYear.setFullYear(start.getFullYear());
        
        if (bdayThisYear < start) {
          bdayThisYear.setFullYear(start.getFullYear() + 1);
        }
        
        return bdayThisYear >= start && bdayThisYear <= end;
      }).map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        dob: c.dob
      })).sort((a,b) => {
        const d1 = new Date(a.dob!); d1.setFullYear(start.getFullYear()); if (d1 < start) d1.setFullYear(start.getFullYear() + 1);
        const d2 = new Date(b.dob!); d2.setFullYear(start.getFullYear()); if (d2 < start) d2.setFullYear(start.getFullYear() + 1);
        return d1.getTime() - d2.getTime();
      });
    };

    const [topProducts1M, topProducts6M, topProductsAll, ordersByType1M, ordersByType6M, ordersByTypeAll, upcomingBirthdays] = await Promise.all([
      getTopProducts(thirtyDaysAgo),
      getTopProducts(sixMonthsAgo),
      getTopProducts(),
      getOrdersByType(thirtyDaysAgo),
      getOrdersByType(sixMonthsAgo),
      getOrdersByType(),
      getUpcomingBirthdays()
    ]);

    res.status(200).json({
      revenueToday,
      ordersToday: todaysOrders.length,
      ordersThisWeek,
      ordersThisMonth,
      trendData,
      recentOrders,
      ordersByType: {
        '1m': ordersByType1M,
        '6m': ordersByType6M,
        'all': ordersByTypeAll
      },
      topProducts: {
        '1m': topProducts1M,
        '6m': topProducts6M,
        'all': topProductsAll
      },
      upcomingBirthdays
    });
  } catch (error) {
    next(error);
  }
};
