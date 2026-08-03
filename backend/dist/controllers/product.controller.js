"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUploadProducts = exports.toggleProductStatus = exports.bulkDeleteProducts = exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.createProduct = exports.getProducts = void 0;
const stream_1 = require("stream");
const csv_parser_1 = __importDefault(require("csv-parser"));
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
        const { name, description, basePrice, offerPrice, categoryId, variants, addons, imageUrl, isTrending, dietaryPreference, isSpicy, isActive } = req.body;
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
                isActive: isActive !== undefined ? isActive : true,
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
        const { name, description, basePrice, offerPrice, categoryId, variants, addons, imageUrl, isTrending, dietaryPreference, isSpicy, isActive } = req.body;
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
                    ...(isActive !== undefined && { isActive }),
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
const bulkDeleteProducts = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No product IDs provided' });
        }
        // Ensure all products belong to this tenant
        const existingProducts = await prisma_1.default.product.findMany({
            where: { id: { in: ids }, tenantId: req.tenantId },
            select: { id: true }
        });
        const validIds = existingProducts.map(p => p.id);
        if (validIds.length === 0) {
            return res.status(404).json({ message: 'Products not found or not authorized' });
        }
        await prisma_1.default.$transaction([
            prisma_1.default.productVariant.deleteMany({ where: { productId: { in: validIds } } }),
            prisma_1.default.productImage.deleteMany({ where: { productId: { in: validIds } } }),
            prisma_1.default.inventory.deleteMany({ where: { productId: { in: validIds } } }),
            prisma_1.default.productAddon.deleteMany({ where: { productId: { in: validIds } } }),
            prisma_1.default.product.deleteMany({ where: { id: { in: validIds } } })
        ]);
        res.status(200).json({ message: `Successfully deleted ${validIds.length} products` });
    }
    catch (error) {
        next(error);
    }
};
exports.bulkDeleteProducts = bulkDeleteProducts;
const toggleProductStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const existing = await prisma_1.default.product.findFirst({ where: { id: id, tenantId: req.tenantId } });
        if (!existing)
            return res.status(404).json({ message: 'Product not found' });
        const product = await prisma_1.default.product.update({
            where: { id: id },
            data: { isActive },
            include: {
                category: true,
                variants: true,
                addons: { include: { addon: true } },
                images: true,
                inventory: true
            }
        });
        res.status(200).json(product);
    }
    catch (error) {
        next(error);
    }
};
exports.toggleProductStatus = toggleProductStatus;
const bulkUploadProducts = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No CSV file uploaded' });
        }
        const results = [];
        const stream = stream_1.Readable.from(req.file.buffer.toString('utf-8'));
        stream
            .pipe((0, csv_parser_1.default)({
            mapHeaders: ({ header }) => header.trim().replace(/^[\uFEFF\u200B]/, '')
        }))
            .on('data', (data) => results.push(data))
            .on('end', async () => {
            let imported = 0;
            let errors = 0;
            for (const row of results) {
                try {
                    const categoryName = row.CategoryName?.trim();
                    const productName = row.ProductName?.trim();
                    const basePrice = parseFloat(row.BasePrice);
                    if (!categoryName || !productName || isNaN(basePrice)) {
                        if (errors === 0)
                            console.log("First error row:", row);
                        errors++;
                        continue;
                    }
                    // Find or create category
                    let category = await prisma_1.default.category.findFirst({
                        where: { name: { equals: categoryName, mode: 'insensitive' }, tenantId: req.tenantId }
                    });
                    if (!category) {
                        category = await prisma_1.default.category.create({
                            data: {
                                name: categoryName,
                                tenant: { connect: { id: req.tenantId } }
                            }
                        });
                    }
                    const offerPrice = row.OfferPrice ? parseFloat(row.OfferPrice) : null;
                    const isSpicy = row.IsSpicy?.toUpperCase() === 'TRUE';
                    const isActive = row.IsActive?.toUpperCase() !== 'FALSE';
                    const dietaryPreference = ['VEG', 'NON_VEG', 'VEGAN', 'EGG'].includes(row.DietaryPreference?.toUpperCase())
                        ? row.DietaryPreference.toUpperCase() : 'VEG';
                    await prisma_1.default.product.create({
                        data: {
                            name: productName,
                            description: row.Description || null,
                            basePrice,
                            offerPrice: isNaN(offerPrice) ? null : offerPrice,
                            isSpicy,
                            isActive,
                            dietaryPreference: dietaryPreference,
                            category: { connect: { id: category.id } },
                            tenant: { connect: { id: req.tenantId } },
                            images: row.ImageUrl ? { create: [{ url: row.ImageUrl }] } : undefined,
                            inventory: { create: { currentStock: 0, minimumStock: 5 } }
                        }
                    });
                    imported++;
                }
                catch (e) {
                    console.error('Row import error:', e);
                    errors++;
                }
            }
            res.status(200).json({ imported, errors, firstErrorRow: errors > 0 ? results[0] : null });
        });
    }
    catch (error) {
        next(error);
    }
};
exports.bulkUploadProducts = bulkUploadProducts;
//# sourceMappingURL=product.controller.js.map