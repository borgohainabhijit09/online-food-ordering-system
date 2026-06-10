"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSuperAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const isSuperAdmin = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        if (decoded.role !== 'SUPER_ADMIN') {
            res.status(403).json({ message: 'Access denied. Super Admin privileges required.' });
            return;
        }
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};
exports.isSuperAdmin = isSuperAdmin;
//# sourceMappingURL=superAdmin.middleware.js.map