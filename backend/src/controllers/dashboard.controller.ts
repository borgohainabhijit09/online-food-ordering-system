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
      recentOrders,
      ordersByTypeGroup
    ] = await Promise.all([
      prisma.order.findMany({
        where: { tenantId, createdAt: { gte: today } }
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
      }),
      prisma.order.groupBy({
        by: ['orderType'],
        where: { tenantId },
        _count: { id: true }
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

    const ordersByType = [
      { name: 'Delivery', value: ordersByTypeGroup?.find((g: any) => g.orderType === 'DELIVERY')?._count.id || 0 },
      { name: 'Takeaway', value: ordersByTypeGroup?.find((g: any) => g.orderType === 'TAKEAWAY')?._count.id || 0 },
      { name: 'Dine In', value: ordersByTypeGroup?.find((g: any) => g.orderType === 'DINE_IN')?._count.id || 0 }
    ];

    res.status(200).json({
      revenueToday,
      ordersToday: todaysOrders.length,
      ordersThisWeek,
      ordersThisMonth,
      trendData,
      recentOrders,
      ordersByType
    });
  } catch (error) {
    next(error);
  }
};
