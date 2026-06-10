"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = void 0;
const prisma_1 = __importDefault(require("../services/prisma"));
const getCategories = async (req, res, next) => {
    try {
        const categories = await prisma_1.default.category.findMany({
            where: { tenantId: req.tenantId },
            orderBy: { order: 'asc' },
        });
        res.status(200).json(categories);
    }
    catch (error) {
        next(error);
    }
};
exports.getCategories = getCategories;
const createCategory = async (req, res, next) => {
    try {
        const { name, order, imageUrl } = req.body;
        const category = await prisma_1.default.category.create({
            data: { name, order, imageUrl, tenantId: req.tenantId },
        });
        res.status(201).json(category);
    }
    catch (error) {
        next(error);
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, order, imageUrl } = req.body;
        // First verify it belongs to tenant
        const existing = await prisma_1.default.category.findFirst({ where: { id: id, tenantId: req.tenantId } });
        if (!existing)
            return res.status(404).json({ message: 'Not found' });
        const category = await prisma_1.default.category.update({
            where: { id: id },
            data: { name, order, imageUrl },
        });
        res.status(200).json(category);
    }
    catch (error) {
        next(error);
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existing = await prisma_1.default.category.findFirst({ where: { id: id, tenantId: req.tenantId } });
        if (!existing)
            return res.status(404).json({ message: 'Not found' });
        await prisma_1.default.category.delete({
            where: { id: id },
        });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=category.controller.js.map