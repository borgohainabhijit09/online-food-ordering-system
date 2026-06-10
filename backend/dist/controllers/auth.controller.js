"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTenant = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../services/prisma"));
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const login = async (req, res, next) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) {
            return res.status(400).json({ message: 'Phone and password are required' });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { phone },
            include: { tenant: true }
        });
        if (!user || !user.password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, phone: user.phone, tenantId: user.tenantId, tenantSlug: user.tenant?.slug }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                phone: user.phone,
                tenantId: user.tenantId,
                tenantSlug: user.tenant?.slug
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const registerTenant = async (req, res, next) => {
    try {
        const { businessName, slug, email, phone, ownerName, password } = req.body;
        // Validate slug
        const existingTenant = await prisma_1.default.tenant.findFirst({ where: { slug } });
        if (existingTenant) {
            return res.status(400).json({ message: 'Slug is already taken. Please choose another.' });
        }
        const defaultPackage = await prisma_1.default.subscriptionPackage.findUnique({
            where: { name: 'App Only' }
        });
        if (!defaultPackage) {
            return res.status(500).json({ message: 'Default subscription package not found in system.' });
        }
        // Check if phone or email is already taken
        const existingUser = await prisma_1.default.user.findUnique({ where: { phone } });
        if (existingUser) {
            return res.status(400).json({ message: 'Phone number already registered.' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create Tenant, Admin User, and default Settings in one transaction
        const result = await prisma_1.default.$transaction(async (tx) => {
            const newTenant = await tx.tenant.create({
                data: {
                    slug,
                    businessName,
                    email,
                    phone
                }
            });
            const newAdmin = await tx.user.create({
                data: {
                    name: ownerName,
                    phone,
                    password: hashedPassword,
                    role: 'ADMIN',
                    tenantId: newTenant.id
                }
            });
            await tx.settings.create({
                data: {
                    restaurantName: businessName,
                    whatsappNumber: phone,
                    restaurantLat: 0,
                    restaurantLng: 0,
                    tenantId: newTenant.id
                }
            });
            // Assign default subscription package
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            await tx.tenantSubscription.create({
                data: {
                    tenantId: newTenant.id,
                    packageId: defaultPackage.id,
                    nextBillingDate: nextMonth,
                    status: 'ACTIVE'
                }
            });
            return { tenant: newTenant, admin: newAdmin };
        });
        const token = jsonwebtoken_1.default.sign({ id: result.admin.id, role: result.admin.role, phone: result.admin.phone, tenantId: result.admin.tenantId, tenantSlug: result.tenant.slug }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            message: 'Business registered successfully!',
            tenantSlug: result.tenant.slug,
            token
        });
    }
    catch (error) {
        next(error);
    }
};
exports.registerTenant = registerTenant;
//# sourceMappingURL=auth.controller.js.map