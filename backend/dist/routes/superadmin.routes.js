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
        // In a real app, you'd aggregate revenue, but for now we'll sum the prices of active subscriptions
        const activeSubs = await prisma_1.default.tenantSubscription.findMany({
            where: { status: 'ACTIVE' },
            include: { package: true }
        });
        const mrr = activeSubs.reduce((sum, sub) => sum + sub.package.price, 0);
        const pastDueCount = await prisma_1.default.tenantSubscription.count({
            where: { status: 'PAST_DUE' }
        });
        res.json({
            totalTenants,
            mrr,
            pastDueCount,
            activeSubsCount: activeSubs.length
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
                subscription: {
                    include: { package: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tenants);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
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
        const admin = await prisma_1.default.user.findFirst({
            where: { tenantId, role: 'ADMIN' }
        });
        if (!admin) {
            res.status(404).json({ message: 'Tenant has no admin user' });
            return;
        }
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
        const token = jsonwebtoken_1.default.sign({
            id: admin.id,
            role: admin.role,
            phone: admin.phone,
            tenantId: admin.tenantId,
            tenantSlug: tenant.slug,
            isImpersonated: true
        }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ token, tenantSlug: tenant.slug });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
// Get all subscription packages
router.get('/packages', async (req, res) => {
    try {
        const packages = await prisma_1.default.subscriptionPackage.findMany();
        res.json(packages);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
// Update a Tenant (Active Status, Package)
router.patch('/tenants/:id', async (req, res) => {
    try {
        const tenantId = req.params.id;
        const { isActive, packageId } = req.body;
        const tenant = await prisma_1.default.tenant.findUnique({
            where: { id: tenantId },
            include: { subscription: true }
        });
        if (!tenant) {
            res.status(404).json({ message: 'Tenant not found' });
            return;
        }
        // Update Tenant base settings
        if (typeof isActive === 'boolean') {
            await prisma_1.default.tenant.update({
                where: { id: tenantId },
                data: { isActive }
            });
        }
        // Update Subscription Package if provided
        if (packageId && tenant.subscription) {
            await prisma_1.default.tenantSubscription.update({
                where: { id: tenant.subscription.id },
                data: { packageId }
            });
        }
        res.json({ message: 'Tenant updated successfully' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
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
exports.default = router;
//# sourceMappingURL=superadmin.routes.js.map