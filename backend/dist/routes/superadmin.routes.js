"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../services/prisma"));
const superAdmin_middleware_1 = require("../middlewares/superAdmin.middleware");
const support_controller_1 = require("../controllers/support.controller");
const superadmin_security_controller_1 = require("../controllers/superadmin.security.controller");
const superadmin_marketplace_routes_1 = __importDefault(require("./superadmin.marketplace.routes"));
const router = (0, express_1.Router)();
// -----------------------------------------------------
// PUBLIC / HIDDEN ROUTES
// -----------------------------------------------------
// Hidden setup route - realistically you'd restrict this or delete it after use
router.post('/setup', async (req, res) => {
    try {
        const { phone, password, name, adminKey } = req.body;
        if (adminKey !== 'SUPER_SECRET_SETUP_KEY_2026') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const existing = await prisma_1.default.user.findFirst({
            where: { role: 'SUPER_ADMIN' }
        });
        if (existing) {
            res.status(400).json({ message: 'Super admin already exists' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                name,
                phone,
                password: hashedPassword,
                role: 'SUPER_ADMIN'
            }
        });
        // Seed packages
        await prisma_1.default.subscriptionPackage.upsert({
            where: { name: 'App Only' },
            update: {},
            create: { name: 'App Only', price: 499, features: 'Only the app via web and mobile browser' }
        });
        await prisma_1.default.subscriptionPackage.upsert({
            where: { name: 'App + Landing Page' },
            update: {},
            create: { name: 'App + Landing Page', price: 599, features: 'App + Restaurant Landing page maintained by us' }
        });
        await prisma_1.default.subscriptionPackage.upsert({
            where: { name: 'App + Landing Page + SMM' },
            update: {},
            create: { name: 'App + Landing Page + SMM', price: 1499, features: 'App + landing page + Social Media Marketing' }
        });
        res.json({ message: 'Super Admin and default packages successfully created!', user: { id: user.id, name: user.name, phone: user.phone } });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});
// -----------------------------------------------------
// PROTECTED SUPER ADMIN ROUTES
// -----------------------------------------------------
router.use(superAdmin_middleware_1.isSuperAdmin);
// Get Dashboard Stats
router.get('/dashboard', async (req, res) => {
    try {
        const totalTenants = await prisma_1.default.tenant.count();
        // Sum prices of active plans
        const tenantsWithPlans = await prisma_1.default.tenant.findMany({
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
        const recentTenants = await prisma_1.default.tenant.findMany({
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
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
// Get All Tenants with Subscription Info
router.get('/tenants', async (req, res) => {
    try {
        const tenants = await prisma_1.default.tenant.findMany({
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
    }
    catch (err) {
        console.error('Super Admin Tenants Error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
// Impersonate Tenant
router.post('/tenants/:id/impersonate', async (req, res) => {
    try {
        const tenantId = req.params.id;
        const tenant = await prisma_1.default.tenant.findUnique({
            where: { id: tenantId }
        });
        if (!tenant) {
            res.status(404).json({ message: 'Tenant not found' });
            return;
        }
        // Find the first ADMIN of this tenant
        const adminAccess = await prisma_1.default.tenantAccess.findFirst({
            where: { tenantId },
            include: { user: true }
        });
        if (!adminAccess || !adminAccess.user) {
            res.status(404).json({ message: 'Tenant has no assigned user' });
            return;
        }
        const admin = adminAccess.user;
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
        const token = jsonwebtoken_1.default.sign({
            id: admin.id,
            role: admin.role,
            phone: admin.phone,
            tenantId: tenantId,
            tenantSlug: tenant.slug,
            isImpersonated: true
        }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ token, tenantSlug: tenant.slug });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
// Get all subscription packages (deprecating, returning plans for compatibility)
router.get('/packages', async (req, res) => {
    try {
        const plans = await prisma_1.default.subscriptionPlan.findMany();
        res.json(plans);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
// Update a Tenant (Active Status, Plan)
router.patch('/tenants/:id', async (req, res) => {
    try {
        const tenantId = req.params.id;
        const { isActive, currentPlanId } = req.body;
        const tenant = await prisma_1.default.tenant.findUnique({
            where: { id: tenantId }
        });
        if (!tenant) {
            res.status(404).json({ message: 'Tenant not found' });
            return;
        }
        // Update Tenant
        await prisma_1.default.$transaction(async (tx) => {
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
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
// Delete a Tenant (Full cleanup)
router.delete('/tenants/:id', async (req, res) => {
    try {
        const tenantId = req.params.id;
        const tenant = await prisma_1.default.tenant.findUnique({
            where: { id: tenantId }
        });
        if (!tenant) {
            res.status(404).json({ message: 'Tenant not found' });
            return;
        }
        // Delete in dependency order
        await prisma_1.default.$transaction([
            // Orders and relations
            prisma_1.default.orderItemAddon.deleteMany({ where: { orderItem: { order: { tenantId } } } }),
            prisma_1.default.orderItem.deleteMany({ where: { order: { tenantId } } }),
            prisma_1.default.order.deleteMany({ where: { tenantId } }),
            // Products and relations
            prisma_1.default.productVariant.deleteMany({ where: { product: { tenantId } } }),
            prisma_1.default.productImage.deleteMany({ where: { product: { tenantId } } }),
            prisma_1.default.inventory.deleteMany({ where: { product: { tenantId } } }),
            prisma_1.default.productAddon.deleteMany({ where: { product: { tenantId } } }),
            prisma_1.default.product.deleteMany({ where: { tenantId } }),
            prisma_1.default.addon.deleteMany({ where: { tenantId } }),
            prisma_1.default.category.deleteMany({ where: { tenantId } }),
            // Other entities
            prisma_1.default.customer.deleteMany({ where: { tenantId } }),
            prisma_1.default.restaurantTable.deleteMany({ where: { tenantId } }),
            prisma_1.default.settings.deleteMany({ where: { tenantId } }),
            prisma_1.default.billingRecord.deleteMany({ where: { tenantId } }),
            prisma_1.default.tenantSubscription.deleteMany({ where: { tenantId } }),
            prisma_1.default.tenantAccess.deleteMany({ where: { tenantId } }),
            // Finally the tenant
            prisma_1.default.tenant.delete({ where: { id: tenantId } })
        ]);
        res.json({ message: 'Tenant and all associated data deleted successfully' });
    }
    catch (err) {
        console.error('Delete Tenant Error:', err);
        res.status(500).json({ message: 'Server error during deletion', error: err.message });
    }
});
// Get all billing records for automated billing module
router.get('/billing', async (req, res) => {
    try {
        const records = await prisma_1.default.billingRecord.findMany({
            include: {
                tenant: {
                    select: { businessName: true, slug: true, email: true }
                }
            },
            orderBy: { date: 'desc' }
        });
        res.json(records);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
// Get Tenant Performance
router.get('/performance', async (req, res) => {
    try {
        const tenants = await prisma_1.default.tenant.findMany({
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
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
// Support Tickets
router.get('/support/tickets', support_controller_1.getAllTickets);
router.get('/support/tickets/unread-count', support_controller_1.getSuperAdminUnreadCount);
router.get('/support/tickets/:id', support_controller_1.getTicketDetails);
router.patch('/support/tickets/:id/status', support_controller_1.updateTicketStatus);
router.post('/support/tickets/:id/messages', support_controller_1.addMessage);
// Security & Auditing
router.post('/restaurants/:id/reset-password', superadmin_security_controller_1.resetRestaurantPassword);
router.get('/restaurants/:id/security', superadmin_security_controller_1.getSecurityInfo);
router.get('/restaurants/:id/audit-logs', superadmin_security_controller_1.getAuditLogs);
// ─── Trial Management ────────────────────────────────────────────────────────
// POST /api/super-admin/tenants/:id/start-trial — activate trial for a restaurant
router.post('/tenants/:id/start-trial', async (req, res) => {
    try {
        const tenantId = req.params.id;
        const { trialDays = 14 } = req.body;
        const tenant = await prisma_1.default.tenant.findUnique({ where: { id: tenantId } });
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
        const updated = await prisma_1.default.$transaction(async (tx) => {
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
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
// POST /api/super-admin/tenants/:id/move-to-paid — force move to paid phase and generate invoice
router.post('/tenants/:id/move-to-paid', async (req, res) => {
    try {
        const tenantId = req.params.id;
        const tenant = await prisma_1.default.tenant.findUnique({
            where: { id: tenantId },
            include: { currentPlan: true }
        });
        if (!tenant) {
            res.status(404).json({ message: 'Tenant not found' });
            return;
        }
        if (tenant.trialStatus === 'SUBSCRIBED') {
            res.status(400).json({ message: 'Tenant is already subscribed' });
            return;
        }
        // Find cheapest plan as fallback
        const allPlans = await prisma_1.default.subscriptionPlan.findMany({
            orderBy: { monthlyPrice: 'asc' }
        });
        const cheapestPlan = allPlans.length > 0 ? allPlans[0] : null;
        let planId = tenant.currentPlanId;
        let amount = tenant.currentPlan?.monthlyPrice || 0;
        if (!planId && cheapestPlan) {
            planId = cheapestPlan.id;
            amount = cheapestPlan.monthlyPrice;
        }
        const updated = await prisma_1.default.$transaction(async (tx) => {
            // 1. Mark as TRIAL_ENDED and update plan if it was missing
            const t = await tx.tenant.update({
                where: { id: tenantId },
                data: {
                    trialStatus: 'TRIAL_ENDED',
                    trialEndDate: new Date(), // End trial immediately
                    ...(!tenant.currentPlanId && planId ? { currentPlanId: planId } : {})
                }
            });
            // 2. Generate Invoice (BillingRecord) if not exists
            if (planId) {
                const existingPending = await tx.billingRecord.findFirst({
                    where: { tenantId, status: 'PENDING' }
                });
                if (!existingPending) {
                    await tx.billingRecord.create({
                        data: {
                            tenantId: tenantId,
                            planId: planId,
                            amount: amount,
                            status: 'PENDING'
                        }
                    });
                }
            }
            await tx.auditLog.create({
                data: {
                    businessId: tenantId,
                    action: 'MOVED_TO_PAID_PHASE',
                    performedBy: 'SUPER_ADMIN',
                    metadata: { planId, amount, previousStatus: tenant.trialStatus }
                }
            });
            return t;
        });
        res.json({
            message: `Successfully moved ${tenant.businessName} to paid phase. Invoice generated.`,
            trialStatus: updated.trialStatus
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
// GET /api/super-admin/trial-extension-requests — list all extension requests
router.get('/trial-extension-requests', async (req, res) => {
    try {
        const { status } = req.query;
        const requests = await prisma_1.default.trialExtensionRequest.findMany({
            where: status ? { status: status } : undefined,
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
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
// PATCH /api/super-admin/trial-extension-requests/:id — approve or reject
router.patch('/trial-extension-requests/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { status, reviewNote } = req.body; // status: 'APPROVED' | 'REJECTED'
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            res.status(400).json({ message: 'status must be APPROVED or REJECTED' });
            return;
        }
        const extensionReq = await prisma_1.default.trialExtensionRequest.findUnique({
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
        const updated = await prisma_1.default.$transaction(async (tx) => {
            const updatedReq = await tx.trialExtensionRequest.update({
                where: { id },
                data: {
                    status,
                    reviewedBy: req.user?.id,
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
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
router.use('/marketplace', superadmin_marketplace_routes_1.default);
exports.default = router;
//# sourceMappingURL=superadmin.routes.js.map