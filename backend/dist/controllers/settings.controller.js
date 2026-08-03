"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = void 0;
const prisma_1 = __importDefault(require("../services/prisma"));
const getSettings = async (req, res, next) => {
    try {
        if (!req.tenantId)
            return res.status(400).json({ message: 'Tenant required' });
        let settings = await prisma_1.default.settings.findFirst({
            where: { tenantId: req.tenantId },
            include: {
                tenant: {
                    select: { slug: true, businessName: true, restaurantId: true }
                }
            }
        });
        if (!settings) {
            // Auto-create settings if they don't exist yet
            const tenant = await prisma_1.default.tenant.findUnique({ where: { id: req.tenantId } });
            settings = await prisma_1.default.settings.create({
                data: {
                    tenantId: req.tenantId,
                    restaurantName: tenant?.businessName || 'My Restaurant',
                    isAcceptingOrders: true,
                    deliveryRadiusKm: 5,
                    restaurantLat: 0,
                    restaurantLng: 0,
                    whatsappNumber: '',
                    loyaltyEnabled: false,
                    loyaltyPointsExpiryDays: null,
                    pointsEarningMultiplier: 1.0,
                    pointsEarningSpendUnit: 100.0,
                    pointValueInRupees: 1.0,
                    minimumPointsToRedeem: 50,
                    repeatOrderThreshold: 5,
                    vipSpendThreshold: 3000,
                },
                include: {
                    tenant: {
                        select: { slug: true, businessName: true, restaurantId: true }
                    }
                }
            });
        }
        res.status(200).json({
            ...settings,
            tenantSlug: settings?.tenant?.slug,
            restaurantId: settings?.tenant?.restaurantId
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res, next) => {
    try {
        if (!req.tenantId)
            return res.status(400).json({ message: 'Tenant required' });
        const { restaurantName, isAcceptingOrders, deliveryRadiusKm, restaurantLat, restaurantLng, whatsappNumber, hasDeliveryCharge, deliveryChargeAmount, minOrderValueForDelivery, logoUrl, fssaiNumber, loyaltyEnabled, loyaltyPointsExpiryDays, pointsEarningMultiplier, pointsEarningSpendUnit, pointValueInRupees, minimumPointsToRedeem, repeatOrderThreshold, vipSpendThreshold } = req.body;
        const existing = await prisma_1.default.settings.findFirst({
            where: { tenantId: req.tenantId }
        });
        let settings;
        if (existing) {
            settings = await prisma_1.default.settings.update({
                where: { id: existing.id },
                data: {
                    restaurantName, isAcceptingOrders, deliveryRadiusKm, restaurantLat, restaurantLng, whatsappNumber,
                    hasDeliveryCharge, deliveryChargeAmount, minOrderValueForDelivery, logoUrl, fssaiNumber,
                    loyaltyEnabled, loyaltyPointsExpiryDays, pointsEarningMultiplier, pointsEarningSpendUnit, pointValueInRupees, minimumPointsToRedeem,
                    repeatOrderThreshold, vipSpendThreshold
                },
                include: { tenant: { select: { slug: true, restaurantId: true } } }
            });
        }
        else {
            settings = await prisma_1.default.settings.create({
                data: {
                    restaurantName, isAcceptingOrders, deliveryRadiusKm, restaurantLat, restaurantLng, whatsappNumber,
                    hasDeliveryCharge, deliveryChargeAmount, minOrderValueForDelivery, logoUrl, fssaiNumber, tenantId: req.tenantId,
                    loyaltyEnabled, loyaltyPointsExpiryDays, pointsEarningMultiplier, pointsEarningSpendUnit, pointValueInRupees, minimumPointsToRedeem,
                    repeatOrderThreshold, vipSpendThreshold
                },
                include: { tenant: { select: { slug: true, restaurantId: true } } }
            });
        }
        res.status(200).json({
            ...settings,
            tenantSlug: settings?.tenant?.slug,
            restaurantId: settings?.tenant?.restaurantId
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateSettings = updateSettings;
//# sourceMappingURL=settings.controller.js.map