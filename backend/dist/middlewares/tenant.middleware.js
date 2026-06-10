"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTenant = void 0;
const prisma_1 = __importDefault(require("../services/prisma"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const resolveTenant = async (req, res, next) => {
    try {
        let resolvedTenantId = null;
        let resolvedSlug = null;
        // 1. If user is authenticated, they already have a tenantId from the JWT
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
                if (decoded && decoded.tenantId) {
                    resolvedTenantId = decoded.tenantId;
                    req.user = decoded; // Store for later auth middleware
                }
            }
            catch (err) {
                // Just ignore JWT errors here, let actual auth middleware handle it if it's a protected route
            }
        }
        // 2. Otherwise, look for x-tenant-slug header (used by public customer portal endpoints)
        if (!resolvedTenantId) {
            const slug = req.headers['x-tenant-slug'];
            if (slug && typeof slug === 'string') {
                resolvedSlug = slug;
            }
        }
        if (!resolvedTenantId && !resolvedSlug) {
            res.status(400).json({ message: 'Tenant slug is required in headers (x-tenant-slug) or via Auth Token' });
            return;
        }
        const tenant = await prisma_1.default.tenant.findUnique({
            where: resolvedTenantId ? { id: resolvedTenantId } : { slug: resolvedSlug }
        });
        if (!tenant) {
            res.status(404).json({ message: 'Tenant not found' });
            return;
        }
        if (!tenant.isActive) {
            res.status(403).json({ message: 'This restaurant is currently suspended.' });
            return;
        }
        req.tenantId = tenant.id;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.resolveTenant = resolveTenant;
//# sourceMappingURL=tenant.middleware.js.map