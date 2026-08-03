"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = decoded;
        if (decoded.forcePasswordChange && !req.originalUrl.includes('/change-password') && !req.originalUrl.includes('/logout')) {
            res.status(403).json({ message: 'Password change required', forcePasswordChange: true });
            return;
        }
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid or expired token' });
        return;
    }
};
exports.authenticate = authenticate;
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'STAFF' && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ message: 'Dashboard access required' });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN') {
            next();
            return;
        }
        if (req.user?.role === 'STAFF') {
            const permissions = req.user?.permissions || [];
            if (permissions.includes(permission)) {
                next();
                return;
            }
        }
        res.status(403).json({ message: 'Insufficient permissions' });
    };
};
exports.requirePermission = requirePermission;
//# sourceMappingURL=auth.middleware.js.map