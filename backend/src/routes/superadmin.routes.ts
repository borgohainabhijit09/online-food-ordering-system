import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../services/prisma';
import { isSuperAdmin, SuperAdminRequest } from '../middlewares/superAdmin.middleware';
import { getAllTickets, getTicketDetails, updateTicketStatus, addMessage, getSuperAdminUnreadCount } from '../controllers/support.controller';

import superadminMarketplaceRoutes from './superadmin.marketplace.routes';

const router = Router();

// -----------------------------------------------------
// PUBLIC / HIDDEN ROUTES
// -----------------------------------------------------

// Hidden setup route - realistically you'd restrict this or delete it after use
router.post('/setup', async (req: Request, res: Response) => {
  try {
    const { phone, password, name, adminKey } = req.body;

    if (adminKey !== 'SUPER_SECRET_SETUP_KEY_2026') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const existing = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (existing) {
      res.status(400).json({ message: 'Super admin already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        role: 'SUPER_ADMIN'
      }
    });

    // Seed packages
    await prisma.subscriptionPackage.upsert({
      where: { name: 'App Only' },
      update: {},
      create: { name: 'App Only', price: 499, features: 'Only the app via web and mobile browser' }
    });

    await prisma.subscriptionPackage.upsert({
      where: { name: 'App + Landing Page' },
      update: {},
      create: { name: 'App + Landing Page', price: 599, features: 'App + Restaurant Landing page maintained by us' }
    });

    await prisma.subscriptionPackage.upsert({
      where: { name: 'App + Landing Page + SMM' },
      update: {},
      create: { name: 'App + Landing Page + SMM', price: 1499, features: 'App + landing page + Social Media Marketing' }
    });

    res.json({ message: 'Super Admin and default packages successfully created!', user: { id: user.id, name: user.name, phone: user.phone } });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// -----------------------------------------------------
// PROTECTED SUPER ADMIN ROUTES
// -----------------------------------------------------
router.use(isSuperAdmin);

// Get Dashboard Stats
router.get('/dashboard', async (req: SuperAdminRequest, res: Response) => {
  try {
    const totalTenants = await prisma.tenant.count();
    
    // In a real app, you'd aggregate revenue, but for now we'll sum the prices of active subscriptions
    const activeSubs = await prisma.tenantSubscription.findMany({
      where: { status: 'ACTIVE' },
      include: { package: true }
    });

    const mrr = activeSubs.reduce((sum, sub) => sum + sub.package.price, 0);

    const pastDueCount = await prisma.tenantSubscription.count({
      where: { status: 'PAST_DUE' }
    });

    res.json({
      totalTenants,
      mrr,
      pastDueCount,
      activeSubsCount: activeSubs.length
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get All Tenants with Subscription Info
router.get('/tenants', async (req: SuperAdminRequest, res: Response) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        subscription: {
          include: { package: true }
        },
        tenantAccess: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tenants);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Impersonate Tenant
router.post('/tenants/:id/impersonate', async (req: SuperAdminRequest, res: Response) => {
  try {
    const tenantId = req.params.id as string;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });
    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    // Find the first ADMIN of this tenant
    const adminAccess = await prisma.tenantAccess.findFirst({
      where: { tenantId },
      include: { user: true }
    });

    if (!adminAccess || !adminAccess.user) {
      res.status(404).json({ message: 'Tenant has no assigned user' });
      return;
    }

    const admin = adminAccess.user;

    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign(
      { 
        id: admin.id, 
        role: admin.role, 
        phone: admin.phone, 
        tenantId: tenantId, 
        tenantSlug: tenant.slug,
        isImpersonated: true 
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token, tenantSlug: tenant.slug });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all subscription packages
router.get('/packages', async (req: SuperAdminRequest, res: Response) => {
  try {
    const packages = await prisma.subscriptionPackage.findMany();
    res.json(packages);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a Tenant (Active Status, Package)
router.patch('/tenants/:id', async (req: SuperAdminRequest, res: Response) => {
  try {
    const tenantId = req.params.id as string;
    const { isActive, packageId } = req.body;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: true }
    });

    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    // Update Tenant base settings
    if (typeof isActive === 'boolean') {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { isActive }
      });
    }

    // Update Subscription Package if provided
    if (packageId && tenant.subscription) {
      await prisma.tenantSubscription.update({
        where: { id: tenant.subscription.id },
        data: { packageId }
      });
    }

    res.json({ message: 'Tenant updated successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all billing records for automated billing module
router.get('/billing', async (req: SuperAdminRequest, res: Response) => {
  try {
    const records = await prisma.billingRecord.findMany({
      include: {
        tenant: {
          select: { businessName: true, slug: true, email: true }
        }
      },
      orderBy: { date: 'desc' }
    });
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get Tenant Performance
router.get('/performance', async (req: SuperAdminRequest, res: Response) => {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        businessName: true,
        slug: true,
        orders: {
          where: { status: { not: 'CANCELLED' } },
          select: {
            id: true,
            total: true,
            orderType: true
          }
        }
      }
    });

    const performance = tenants.map(t => {
      const totalOrders = t.orders.length;
      const totalRevenue = t.orders.reduce((sum, o) => sum + o.total, 0);
      const deliveryOrders = t.orders.filter(o => o.orderType === 'DELIVERY').length;
      const takeawayOrders = t.orders.filter(o => o.orderType === 'TAKEAWAY').length;
      const dineInOrders = t.orders.filter(o => o.orderType === 'DINE_IN').length;
      
      return {
        id: t.id,
        businessName: t.businessName,
        slug: t.slug,
        totalOrders,
        totalRevenue,
        source: {
          delivery: deliveryOrders,
          takeaway: takeawayOrders,
          dineIn: dineInOrders
        }
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json(performance);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Support Tickets
router.get('/support/tickets', getAllTickets);
router.get('/support/tickets/unread-count', getSuperAdminUnreadCount);
router.get('/support/tickets/:id', getTicketDetails);
router.patch('/support/tickets/:id/status', updateTicketStatus);
router.post('/support/tickets/:id/messages', addMessage);

router.use('/marketplace', superadminMarketplaceRoutes);

export default router;
