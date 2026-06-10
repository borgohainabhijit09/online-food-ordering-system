"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.createProduct = exports.getProducts = void 0;
const prisma_1 = __importDefault(require("../services/prisma"));
const getProducts = async (req, res, next) => {
    try {
        const products = await prisma_1.default.product.findMany({
            where: { tenantId: req.tenantId },
            include: {
                category: true,
                images: true,
                variants: true,
                addons: {
                    include: { addon: true }
                },
                inventory: true
            }
        });
        res.status(200).json(products);
    }
    catch (error) {
        next(error);
    }
};
exports.getProducts = getProducts;
const createProduct = async (req, res, next) => {
    try {
        const { name, description, basePrice, offerPrice, categoryId, variants, addons, imageUrl, isTrending, dietaryPreference, isSpicy } = req.body;
        // Validate category belongs to this tenant
        const category = await prisma_1.default.category.findFirst({ where: { id: categoryId, tenantId: req.tenantId } });
        if (!category)
            return res.status(400).json({ message: 'Invalid category' });
        const product = await prisma_1.default.product.create({
            data: {
                name,
                description,
                basePrice,
                offerPrice,
                tenant: { connect: { id: req.tenantId } },
                category: { connect: { id: categoryId } },
                isTrending: isTrending || false,
                dietaryPreference: dietaryPreference || 'VEG',
                isSpicy: isSpicy || false,
                variants: variants && variants.length > 0 ? { create: variants } : undefined,
                inventory: { create: { currentStock: 0, minimumStock: 5 } },
                addons: addons && addons.length > 0 ? {
                    create: addons.map((id) => ({
                        addon: { connect: { id } }
                    }))
                } : undefined,
                images: imageUrl ? {
                    create: [{ url: imageUrl }]
                } : undefined
            },
            include: {
                category: true,
                variants: true,
                addons: { include: { addon: true } },
                images: true,
                inventory: true
            }
        });
        res.status(201).json(product);
    }
    catch (error) {
        next(error);
    }
};
exports.createProduct = createProduct;
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await prisma_1.default.product.findFirst({
            where: { id: id, tenantId: req.tenantId },
            include: {
                category: true,
                images: true,
                variants: true,
                addons: {
                    include: { addon: true }
                }
            }
        });
        if (!product)
            return res.status(404).json({ message: 'Product not found' });
        res.status(200).json(product);
    }
    catch (error) {
        next(error);
    }
};
exports.getProductById = getProductById;
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, basePrice, offerPrice, categoryId, variants, addons, imageUrl, isTrending, dietaryPreference, isSpicy } = req.body;
        // Verify product belongs to tenant
        const existing = await prisma_1.default.product.findFirst({ where: { id: id, tenantId: req.tenantId } });
        if (!existing)
            return res.status(404).json({ message: 'Product not found' });
        if (categoryId) {
            const category = await prisma_1.default.category.findFirst({ where: { id: categoryId, tenantId: req.tenantId } });
            if (!category)
                return res.status(400).json({ message: 'Invalid category' });
        }
        const product = await prisma_1.default.$transaction(async (tx) => {
            await tx.productVariant.deleteMany({ where: { productId: id } });
            await tx.productAddon.deleteMany({ where: { productId: id } });
            await tx.productImage.deleteMany({ where: { productId: id } });
            return await tx.product.update({
                where: { id: id },
                data: {
                    name,
                    description,
                    basePrice,
                    offerPrice,
                    ...(categoryId && { category: { connect: { id: categoryId } } }),
                    isTrending: isTrending || false,
                    dietaryPreference: dietaryPreference || 'VEG',
                    isSpicy: isSpicy || false,
                    variants: variants && variants.length > 0 ? { create: variants } : undefined,
                    addons: addons && addons.length > 0 ? {
                        create: addons.map((addonId) => ({
                            addon: { connect: { id: addonId } }
                        }))
                    } : undefined,
                    images: imageUrl ? {
                        create: [{ url: imageUrl }]
                    } : undefined
                },
                include: {
                    category: true,
                    variants: true,
                    addons: { include: { addon: true } },
                    images: true,
                    inventory: true
                }
            });
        });
        res.status(200).json(product);
    }
    catch (error) {
        next(error);
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existing = await prisma_1.default.product.findFirst({ where: { id: id, tenantId: req.tenantId } });
        if (!existing)
            return res.status(404).json({ message: 'Product not found' });
        await prisma_1.default.$transaction([
            prisma_1.default.productVariant.deleteMany({ where: { productId: id } }),
            prisma_1.default.productImage.deleteMany({ where: { productId: id } }),
            prisma_1.default.inventory.deleteMany({ where: { productId: id } }),
            prisma_1.default.productAddon.deleteMany({ where: { productId: id } }),
            prisma_1.default.product.delete({ where: { id: id } })
        ]);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=product.controller.js.map