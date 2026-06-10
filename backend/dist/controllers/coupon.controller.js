"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCoupon = exports.updateCoupon = exports.createCoupon = exports.getCoupons = exports.getPublicCoupons = exports.validateCouponApi = void 0;
const prisma_1 = __importDefault(require("../services/prisma"));
const coupon_service_1 = require("../services/coupon.service");
// PUBLIC - Validate Coupon at Checkout
const validateCouponApi = async (req, res, next) => {
    try {
        const { couponCode, phone, cartTotal } = req.body;
        if (!req.tenantId || !couponCode || cartTotal === undefined) {
            return res.status(400).json({ valid: false, message: 'Missing required fields.' });
        }
        const result = await (0, coupon_service_1.validateCoupon)({
            tenantId: req.tenantId,
            couponCode,
            phone,
            cartTotal: Number(cartTotal)
        });
        if (!result.valid) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.validateCouponApi = validateCouponApi;
// PUBLIC - Get Active Coupons for Checkout
const getPublicCoupons = async (req, res, next) => {
    try {
        const now = new Date();
        const coupons = await prisma_1.default.coupon.findMany({
            where: {
                tenantId: req.tenantId,
                active: true,
                OR: [
                    { expiryDate: null },
                    { expiryDate: { gt: now } }
                ],
                AND: [
                    {
                        OR: [
                            { startDate: null },
                            { startDate: { lte: now } }
                        ]
                    }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });
        // Omit sensitive data if any, but currently returning all fields is fine
        res.status(200).json(coupons);
    }
    catch (error) {
        next(error);
    }
};
exports.getPublicCoupons = getPublicCoupons;
// ADMIN - Get All Coupons
const getCoupons = async (req, res, next) => {
    try {
        const coupons = await prisma_1.default.coupon.findMany({
            where: { tenantId: req.tenantId },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(coupons);
    }
    catch (error) {
        next(error);
    }
};
exports.getCoupons = getCoupons;
// ADMIN - Create Coupon
const createCoupon = async (req, res, next) => {
    try {
        const data = req.body;
        // Ensure code is uppercase
        if (data.code) {
            data.code = data.code.toUpperCase();
        }
        const existing = await prisma_1.default.coupon.findFirst({
            where: { tenantId: req.tenantId, code: data.code }
        });
        if (existing) {
            return res.status(400).json({ message: 'Coupon code already exists.' });
        }
        const coupon = await prisma_1.default.coupon.create({
            data: {
                ...data,
                tenantId: req.tenantId
            }
        });
        res.status(201).json(coupon);
    }
    catch (error) {
        next(error);
    }
};
exports.createCoupon = createCoupon;
// ADMIN - Update Coupon
const updateCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;
        if (data.code) {
            data.code = data.code.toUpperCase();
            const existing = await prisma_1.default.coupon.findFirst({
                where: { tenantId: req.tenantId, code: data.code, id: { not: id } }
            });
            if (existing) {
                return res.status(400).json({ message: 'Coupon code already exists.' });
            }
        }
        const existingCoupon = await prisma_1.default.coupon.findFirst({
            where: { id: id, tenantId: req.tenantId }
        });
        if (!existingCoupon) {
            return res.status(404).json({ message: 'Coupon not found.' });
        }
        const coupon = await prisma_1.default.coupon.update({
            where: { id: id },
            data
        });
        res.status(200).json(coupon);
    }
    catch (error) {
        next(error);
    }
};
exports.updateCoupon = updateCoupon;
// ADMIN - Delete Coupon
const deleteCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existingCoupon = await prisma_1.default.coupon.findFirst({
            where: { id: id, tenantId: req.tenantId }
        });
        if (!existingCoupon) {
            return res.status(404).json({ message: 'Coupon not found.' });
        }
        await prisma_1.default.coupon.delete({
            where: { id: id }
        });
        res.status(200).json({ message: 'Coupon deleted successfully.' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCoupon = deleteCoupon;
//# sourceMappingURL=coupon.controller.js.map