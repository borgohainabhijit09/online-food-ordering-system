"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const prisma_1 = __importDefault(require("../services/prisma"));
const razorpay_service_1 = require("../services/razorpay.service");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', settings_controller_1.getSettings);
router.put('/', settings_controller_1.updateSettings);
// ─── Razorpay Payment Gateway Settings ───────────────────────────────────────
// GET /api/settings/payment-gateway — get connection status (never returns secret)
router.get('/payment-gateway', async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const settings = await prisma_1.default.settings.findUnique({
            where: { tenantId },
            select: { razorpayKeyId: true, razorpayEnabled: true }
        });
        res.json({
            connected: !!(settings?.razorpayKeyId && settings?.razorpayEnabled),
            keyId: settings?.razorpayKeyId || null,
            enabled: settings?.razorpayEnabled || false
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /api/settings/payment-gateway — connect Razorpay (save encrypted keys)
router.post('/payment-gateway', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { keyId, keySecret } = req.body;
        if (!keyId || !keySecret) {
            res.status(400).json({ message: 'Both Key ID and Key Secret are required.' });
            return;
        }
        if (!keyId.startsWith('rzp_')) {
            res.status(400).json({ message: 'Invalid Razorpay Key ID format. Should start with rzp_test_ or rzp_live_' });
            return;
        }
        const encryptedSecret = (0, razorpay_service_1.encryptSecret)(keySecret);
        await prisma_1.default.settings.update({
            where: { tenantId },
            data: {
                razorpayKeyId: keyId.trim(),
                razorpayKeySecret: encryptedSecret,
                razorpayEnabled: true
            }
        });
        res.json({ success: true, message: 'Razorpay connected successfully', keyId });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// DELETE /api/settings/payment-gateway — disconnect Razorpay
router.delete('/payment-gateway', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        await prisma_1.default.settings.update({
            where: { tenantId },
            data: {
                razorpayKeyId: null,
                razorpayKeySecret: null,
                razorpayEnabled: false
            }
        });
        res.json({ success: true, message: 'Razorpay disconnected.' });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=settings.routes.js.map