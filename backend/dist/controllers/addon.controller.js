"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAddon = exports.updateAddon = exports.createAddon = exports.getAddons = void 0;
const prisma_1 = __importDefault(require("../services/prisma"));
const getAddons = async (req, res, next) => {
    try {
        const addons = await prisma_1.default.addon.findMany({
            where: { tenantId: req.tenantId }
        });
        res.status(200).json(addons);
    }
    catch (error) {
        next(error);
    }
};
exports.getAddons = getAddons;
const createAddon = async (req, res, next) => {
    try {
        const { name, price, imageUrl } = req.body;
        const addon = await prisma_1.default.addon.create({
            data: { name, price, imageUrl, tenantId: req.tenantId }
        });
        res.status(201).json(addon);
    }
    catch (error) {
        next(error);
    }
};
exports.createAddon = createAddon;
const updateAddon = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, price, imageUrl } = req.body;
        const existing = await prisma_1.default.addon.findFirst({ where: { id: id, tenantId: req.tenantId } });
        if (!existing)
            return res.status(404).json({ message: 'Addon not found' });
        const addon = await prisma_1.default.addon.update({
            where: { id: id },
            data: { name, price, imageUrl }
        });
        res.status(200).json(addon);
    }
    catch (error) {
        next(error);
    }
};
exports.updateAddon = updateAddon;
const deleteAddon = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existing = await prisma_1.default.addon.findFirst({ where: { id: id, tenantId: req.tenantId } });
        if (!existing)
            return res.status(404).json({ message: 'Addon not found' });
        await prisma_1.default.$transaction([
            prisma_1.default.productAddon.deleteMany({ where: { addonId: id } }),
            prisma_1.default.addon.delete({ where: { id: id } })
        ]);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteAddon = deleteAddon;
//# sourceMappingURL=addon.controller.js.map