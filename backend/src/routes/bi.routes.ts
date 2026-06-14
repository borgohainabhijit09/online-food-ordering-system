import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { isSuperAdmin, SuperAdminRequest } from '../middlewares/superAdmin.middleware';
import { calculateHealthScore, calculateChurnRisk, getOnboardingStatus } from '../services/bi.service';

const router = Router();
router.use(isSuperAdmin);

// 1. CEO Dashboard Metrics
router.get('/ceo', async (req: SuperAdminRequest, res: Response) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        subscription: { include: { package: true } },
        orders: { select: { id: true, total: true, createdAt: true, status: true } },
        customers: { select: { id: true, createdAt: true } }
      }
    });

    let mrr = 0;
    let totalRevenue = 0;
    let pendingRevenue = 0;
    let ordersToday = 0;
    let ordersThisWeek = 0;
    let ordersThisMonth = 0;
    let totalOrders = 0;
    let gmv = 0;
    let totalCustomers = 0;

    const activeRestaurants = tenants.filter(t => t.subscription?.status === 'ACTIVE').length;
    const trialRestaurants = tenants.filter(t => t.subscription?.status === 'TRIAL').length;
    const cancelledRestaurants = tenants.filter(t => t.subscription?.status === 'CANCELLED').length;
    const suspendedRestaurants = tenants.filter(t => !t.isActive).length;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(startOfToday - now.getDay() * 24 * 60 * 60 * 1000).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    for (const t of tenants) {
      if (t.subscription?.status === 'ACTIVE') {
        mrr += t.subscription.package.price;
      }
      if (t.subscription?.status === 'PAST_DUE') {
        pendingRevenue += t.subscription.package.price;
      }

      totalCustomers += t.customers.length;

      for (const o of t.orders) {
        if (o.status !== 'CANCELLED') {
          totalOrders++;
          gmv += o.total;
          totalRevenue += o.total; // Treating total GMV as revenue for now, could be app revenue

          const oTime = new Date(o.createdAt).getTime();
          if (oTime >= startOfToday) ordersToday++;
          if (oTime >= startOfWeek) ordersThisWeek++;
          if (oTime >= startOfMonth) ordersThisMonth++;
        }
      }
    }

    const arr = mrr * 12;
    const aov = totalOrders > 0 ? gmv / totalOrders : 0;

    res.json({
      revenueMetrics: { mrr, arr, totalRevenue, pendingRevenue, overdueRevenue: pendingRevenue, revenueGrowth: 15.5 }, // mocked growth
      subscriptionMetrics: { totalRestaurants: tenants.length, activeRestaurants, trialRestaurants, suspendedRestaurants, cancelledRestaurants },
      orderMetrics: { ordersToday, ordersThisWeek, ordersThisMonth, totalOrders, gmv, aov },
      customerMetrics: { totalCustomers, newCustomersThisMonth: Math.round(totalCustomers * 0.1), returningCustomersPct: 45 } // mocked
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 2. Health Dashboard
router.get('/health', async (req: SuperAdminRequest, res: Response) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        users: { select: { lastLoginAt: true } },
        subscription: true,
        orders: {
          where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          select: { total: true }
        },
        customers: { select: { id: true } }
      }
    });

    const healthData = tenants.map(t => {
      const { score, category } = calculateHealthScore(t);
      return {
        id: t.id,
        restaurantName: t.businessName,
        slug: t.slug,
        healthScore: score,
        status: category,
        ordersLast30: t.orders.length,
        revenueLast30: t.orders.reduce((sum, o) => sum + o.total, 0),
        customers: t.customers.length,
        subscriptionStatus: t.subscription?.status || 'NONE',
        isActive: t.isActive
      };
    });

    res.json(healthData);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 3. Churn Dashboard
router.get('/churn', async (req: SuperAdminRequest, res: Response) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        users: { select: { lastLoginAt: true } },
        subscription: true,
        orders: { select: { createdAt: true } },
        products: { select: { id: true } }
      }
    });

    const churnData = tenants.map(t => {
      const { score, level, reasons, actions } = calculateChurnRisk(t);
      
      let maxLogin = 0;
      if (t.users.length > 0) {
        maxLogin = Math.max(...t.users.map(u => u.lastLoginAt ? new Date(u.lastLoginAt).getTime() : 0));
      }

      return {
        id: t.id,
        restaurantName: t.businessName,
        slug: t.slug,
        riskScore: score,
        riskLevel: level,
        lastLoginAt: maxLogin > 0 ? new Date(maxLogin) : null,
        reasons,
        actions,
        subscriptionExpiry: t.subscription?.nextBillingDate || null
      };
    }).filter(c => c.riskScore > 0).sort((a, b) => b.riskScore - a.riskScore);

    res.json(churnData);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 4. Onboarding Tracker
router.get('/onboarding', async (req: SuperAdminRequest, res: Response) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        categories: { select: { id: true } },
        settings: true,
        products: { select: { isActive: true } },
        orders: { select: { id: true }, take: 1 },
        subscription: true
      }
    });

    const onboardingData = tenants.map(t => {
      const status = getOnboardingStatus(t);
      return {
        id: t.id,
        restaurantName: t.businessName,
        slug: t.slug,
        ...status
      };
    });

    res.json(onboardingData);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
