import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../services/prisma';
import { isSuperAdmin, SuperAdminRequest } from '../middlewares/superAdmin.middleware';
import { getAllTickets, getTicketDetails, updateTicketStatus, addMessage, getSuperAdminUnreadCount } from '../controllers/support.controller';
import { resetRestaurantPassword, getSecurityInfo, getAuditLogs } from '../controllers/superadmin.security.controller';

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
    
    // Sum prices of active plans
    const tenantsWithPlans = await prisma.tenant.findMany({
      where: { isActive: true, currentPlanId: { not: null } },
      include: { currentPlan: true }
    });

    const mrr = tenantsWithPlans.reduce((sum, t) => sum + (t.currentPlan?.monthlyPrice || 0), 0);
    const activeSubsCount = tenantsWithPlans.length;
    const pastDueCount = 0; // Placeholder for now

    // Calculate 6-month trends
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const recentTenants = await prisma.tenant.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      include: { currentPlan: true }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap = new Map();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today);
      d.setMonth(today.getMonth() - i);
      const key = `${monthNames[d.getMonth()]}`;
      trendMap.set(key, { signups: 0, newMrr: 0 });
    }

    recentTenants.forEach(t => {
      const d = new Date(t.createdAt);
      const key = `${monthNames[d.getMonth()]}`;
      if (trendMap.has(key)) {
        const current = trendMap.get(key);
        current.signups += 1;
        if (t.currentPlan) {
          current.newMrr += t.currentPlan.monthlyPrice;
        }
        trendMap.set(key, current);
      }
    });

    const trendData = Array.from(trendMap.entries()).map(([name, data]) => ({ name, ...data }));

    res.json({
      totalTenants,
      mrr,
      pastDueCount,
      activeSubsCount,
      trendData
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
        currentPlan: true,
        featureOverrides: {
          include: { feature: true }
        },
        tenantAccess: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tenants);
  } catch (err: any) {
    console.error('Super Admin Tenants Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
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

// Get all subscription packages (deprecating, returning plans for compatibility)
router.get('/packages', async (req: SuperAdminRequest, res: Response) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany();
    res.json(plans);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a Tenant (Active Status, Plan)
router.patch('/tenants/:id', async (req: SuperAdminRequest, res: Response) => {
  try {
    const tenantId = req.params.id as string;
    const { isActive, currentPlanId } = req.body;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    // Update Tenant
    await prisma.$transaction(async (tx) => {
      if (typeof isActive === 'boolean') {
        await tx.tenant.update({
          where: { id: tenantId },
          data: { isActive }
        });
      }

      if (currentPlanId !== undefined) {
        const fromPlanId = tenant.currentPlanId;
        
        await tx.tenant.update({
          where: { id: tenantId },
          data: { currentPlanId: currentPlanId || null }
        });

        if (fromPlanId !== currentPlanId) {
          // Log Restaurant Upgraded
          await tx.auditLog.create({
            data: {
              businessId: tenantId,
              action: 'RESTAURANT_UPGRADED',
              performedBy: 'SUPER_ADMIN',
              metadata: { fromPlanId, toPlanId: currentPlanId }
            }
          });
        }
      }
    });

    res.json({ message: 'Tenant updated successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a Tenant (Full cleanup)
router.delete('/tenants/:id', async (req: SuperAdminRequest, res: Response) => {
  try {
    const tenantId = req.params.id as string;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    // Delete in dependency order
    await prisma.$transaction([
      // Orders and relations
      prisma.orderItemAddon.deleteMany({ where: { orderItem: { order: { tenantId } } } }),
      prisma.orderItem.deleteMany({ where: { order: { tenantId } } }),
      prisma.order.deleteMany({ where: { tenantId } }),

      // Products and relations
      prisma.productVariant.deleteMany({ where: { product: { tenantId } } }),
      prisma.productImage.deleteMany({ where: { product: { tenantId } } }),
      prisma.inventory.deleteMany({ where: { product: { tenantId } } }),
      prisma.productAddon.deleteMany({ where: { product: { tenantId } } }),
      prisma.product.deleteMany({ where: { tenantId } }),
      prisma.addon.deleteMany({ where: { tenantId } }),
      prisma.category.deleteMany({ where: { tenantId } }),

      // Other entities
      prisma.customer.deleteMany({ where: { tenantId } }),
      prisma.restaurantTable.deleteMany({ where: { tenantId } }),
      prisma.settings.deleteMany({ where: { tenantId } }),
      prisma.billingRecord.deleteMany({ where: { tenantId } }),
      prisma.tenantSubscription.deleteMany({ where: { tenantId } }),
      prisma.tenantAccess.deleteMany({ where: { tenantId } }),

      // Finally the tenant
      prisma.tenant.delete({ where: { id: tenantId } })
    ]);

    res.json({ message: 'Tenant and all associated data deleted successfully' });
  } catch (err: any) {
    console.error('Delete Tenant Error:', err);
    res.status(500).json({ message: 'Server error during deletion', error: err.message });
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

// Security & Auditing
router.post('/restaurants/:id/reset-password', resetRestaurantPassword);
router.get('/restaurants/:id/security', getSecurityInfo);
router.get('/restaurants/:id/audit-logs', getAuditLogs);

// ─── Trial Management ────────────────────────────────────────────────────────

// POST /api/super-admin/tenants/:id/start-trial — activate trial for a restaurant
router.post('/tenants/:id/start-trial', async (req: SuperAdminRequest, res: Response) => {
  try {
    const tenantId = req.params.id as string;
    const { trialDays = 14 } = req.body;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    if (tenant.trialStatus !== 'TESTING') {
      res.status(400).json({ message: `Trial cannot be started — current status is ${tenant.trialStatus}` });
      return;
    }

    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + Number(trialDays));

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          trialStatus: 'TRIAL_ACTIVE',
          trialStartDate,
          trialEndDate,
          trialDays: Number(trialDays),
        }
      });

      await tx.auditLog.create({
        data: {
          businessId: tenantId,
          action: 'TRIAL_STARTED',
          performedBy: 'SUPER_ADMIN',
          metadata: { trialDays, trialStartDate, trialEndDate }
        }
      });

      return t;
    });

    res.json({
      message: `Trial started successfully for ${tenant.businessName}`,
      trialStartDate: updated.trialStartDate,
      trialEndDate: updated.trialEndDate,
      trialDays: updated.trialDays,
      trialStatus: updated.trialStatus,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/super-admin/trial-extension-requests — list all extension requests
router.get('/trial-extension-requests', async (req: SuperAdminRequest, res: Response) => {
  try {
    const { status } = req.query;
    const requests = await prisma.trialExtensionRequest.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        tenant: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            trialStatus: true,
            trialStartDate: true,
            trialEndDate: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/super-admin/trial-extension-requests/:id — approve or reject
router.patch('/trial-extension-requests/:id', async (req: SuperAdminRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, reviewNote } = req.body; // status: 'APPROVED' | 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ message: 'status must be APPROVED or REJECTED' });
      return;
    }

    const extensionReq = await prisma.trialExtensionRequest.findUnique({
      where: { id },
      include: { tenant: true }
    });

    if (!extensionReq) {
      res.status(404).json({ message: 'Extension request not found' });
      return;
    }

    if (extensionReq.status !== 'PENDING') {
      res.status(400).json({ message: `Request already ${extensionReq.status.toLowerCase()}` });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedReq = await tx.trialExtensionRequest.update({
        where: { id },
        data: {
          status,
          reviewedBy: (req as any).user?.id,
          reviewNote,
        }
      });

      if (status === 'APPROVED') {
        // Extend the trial end date
        const currentEnd = extensionReq.tenant.trialEndDate
          ? new Date(extensionReq.tenant.trialEndDate)
          : new Date();
        currentEnd.setDate(currentEnd.getDate() + extensionReq.daysRequested);

        await tx.tenant.update({
          where: { id: extensionReq.tenantId },
          data: {
            trialEndDate: currentEnd,
            // If trial had ended, reactivate it
            ...(extensionReq.tenant.trialStatus === 'TRIAL_ENDED'
              ? { trialStatus: 'TRIAL_ACTIVE' }
              : {})
          }
        });

        await tx.auditLog.create({
          data: {
            businessId: extensionReq.tenantId,
            action: 'TRIAL_EXTENDED',
            performedBy: 'SUPER_ADMIN',
            metadata: {
              daysAdded: extensionReq.daysRequested,
              newTrialEndDate: currentEnd,
              requestId: id
            }
          }
        });
      }

      return updatedReq;
    });

    res.json({ message: `Request ${status.toLowerCase()}`, request: updated });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.use('/marketplace', superadminMarketplaceRoutes);

export default router;
