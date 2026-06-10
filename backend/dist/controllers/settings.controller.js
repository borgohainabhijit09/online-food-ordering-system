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
        const settings = await prisma_1.default.settings.findFirst({
            where: { tenantId: req.tenantId }
        });
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }
        res.status(200).json(settings);
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
        const { restaurantName, isAcceptingOrders, deliveryRadiusKm, restaurantLat, restaurantLng, whatsappNumber } = req.body;
        // Check if settings exist
        const existing = await prisma_1.default.settings.findFirst({
            where: { tenantId: req.tenantId }
        });
        let settings;
        if (existing) {
            settings = await prisma_1.default.settings.update({
                where: { id: existing.id },
                data: { restaurantName, isAcceptingOrders, deliveryRadiusKm, restaurantLat, restaurantLng, whatsappNumber }
            });
        }
        else {
            settings = await prisma_1.default.settings.create({
                data: { restaurantName, isAcceptingOrders, deliveryRadiusKm, restaurantLat, restaurantLng, whatsappNumber, tenantId: req.tenantId }
            });
        }
        res.status(200).json(settings);
    }
    catch (error) {
        next(error);
    }
};
exports.updateSettings = updateSettings;
//# sourceMappingURL=settings.controller.js.map