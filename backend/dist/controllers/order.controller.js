"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = exports.updateOrderStatus = exports.getOrderById = exports.getOrders = void 0;
const prisma_1 = __importDefault(require("../services/prisma"));
const coupon_service_1 = require("../services/coupon.service");
const getOrders = async (req, res, next) => {
    try {
        const orders = await prisma_1.default.order.findMany({
            where: { tenantId: req.tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: { addons: true }
                }
            }
        });
        res.status(200).json(orders);
    }
    catch (error) {
        next(error);
    }
};
exports.getOrders = getOrders;
const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await prisma_1.default.order.findFirst({
            where: { id: id, tenantId: req.tenantId },
            include: {
                items: {
                    include: { addons: true }
                }
            }
        });
        if (!order)
            return res.status(404).json({ message: 'Order not found' });
        res.status(200).json(order);
    }
    catch (error) {
        next(error);
    }
};
exports.getOrderById = getOrderById;
const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const existing = await prisma_1.default.order.findFirst({ where: { id: id, tenantId: req.tenantId } });
        if (!existing)
            return res.status(404).json({ message: 'Order not found' });
        const order = await prisma_1.default.order.update({
            where: { id: id },
            data: { status }
        });
        res.status(200).json(order);
    }
    catch (error) {
        next(error);
    }
};
exports.updateOrderStatus = updateOrderStatus;
const createOrder = async (req, res, next) => {
    try {
        const { customerName, phone, address, latitude, longitude, total, items, remarks, couponCode } = req.body;
        let finalTotal = total;
        let appliedDiscount = 0;
        // Validate Coupon Server-Side
        if (couponCode) {
            const couponResult = await (0, coupon_service_1.validateCoupon)({
                tenantId: req.tenantId,
                couponCode,
                phone,
                cartTotal: total
            });
            if (!couponResult.valid) {
                return res.status(400).json({ message: couponResult.message });
            }
            finalTotal = couponResult.finalAmount;
            appliedDiscount = couponResult.discountAmount;
        }
        const order = await prisma_1.default.order.create({
            data: {
                customerName,
                phone,
                address,
                latitude,
                longitude,
                total: finalTotal,
                couponCode: couponCode || null,
                discountAmount: appliedDiscount,
                remarks,
                status: 'NEW',
                tenant: { connect: { id: req.tenantId } },
                items: {
                    create: items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                        variant: item.variant,
                        addons: {
                            create: item.addons?.map((addon) => ({
                                addonName: addon.addonName,
                                price: addon.price
                            })) || []
                        }
                    }))
                }
            },
            include: {
                items: {
                    include: { addons: true }
                }
            }
        });
        res.status(201).json(order);
    }
    catch (error) {
        next(error);
    }
};
exports.createOrder = createOrder;
//# sourceMappingURL=order.controller.js.map