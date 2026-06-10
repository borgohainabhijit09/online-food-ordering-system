"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const prisma_1 = __importDefault(require("../services/prisma"));
const getDashboardStats = async (req, res, next) => {
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
        const [todaysOrders, ordersThisWeek, ordersThisMonth, sixMonthsOrders, recentOrders] = await Promise.all([
            prisma_1.default.order.findMany({
                where: { tenantId, createdAt: { gte: today } }
            }),
            prisma_1.default.order.count({
                where: { tenantId, createdAt: { gte: sevenDaysAgo } }
            }),
            prisma_1.default.order.count({
                where: { tenantId, createdAt: { gte: thirtyDaysAgo } }
            }),
            prisma_1.default.order.findMany({
                where: { tenantId, createdAt: { gte: sixMonthsAgo } },
                select: { createdAt: true, total: true, status: true }
            }),
            prisma_1.default.order.findMany({
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
        res.status(200).json({
            revenueToday,
            ordersToday: todaysOrders.length,
            ordersThisWeek,
            ordersThisMonth,
            trendData,
            recentOrders
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardStats = getDashboardStats;
//# sourceMappingURL=dashboard.controller.js.map