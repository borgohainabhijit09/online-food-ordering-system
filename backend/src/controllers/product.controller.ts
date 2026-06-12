import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma';

interface TenantReq extends Request { tenantId?: string; }

export const getProducts = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
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
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { name, description, basePrice, offerPrice, categoryId, variants, addons, imageUrl, isTrending, dietaryPreference, isSpicy, isActive } = req.body;
    
    // Validate category belongs to this tenant
    const category = await prisma.category.findFirst({ where: { id: categoryId, tenantId: req.tenantId } });
    if (!category) return res.status(400).json({ message: 'Invalid category' });

    const product = await prisma.product.create({
      data: {
        name,
        description,
        basePrice,
        offerPrice,
        tenant: { connect: { id: req.tenantId! } },
        category: { connect: { id: categoryId } },
        isTrending: isTrending || false,
        dietaryPreference: dietaryPreference || 'VEG',
        isSpicy: isSpicy || false,
        isActive: isActive !== undefined ? isActive : true,
        variants: variants && variants.length > 0 ? { create: variants } : undefined,
        inventory: { create: { currentStock: 0, minimumStock: 5 } },
        addons: addons && addons.length > 0 ? {
          create: addons.map((id: string) => ({
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
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findFirst({
      where: { id: id as string, tenantId: req.tenantId },
      include: {
        category: true,
        images: true,
        variants: true,
        addons: {
          include: { addon: true }
        }
      }
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, basePrice, offerPrice, categoryId, variants, addons, imageUrl, isTrending, dietaryPreference, isSpicy, isActive } = req.body;

    // Verify product belongs to tenant
    const existing = await prisma.product.findFirst({ where: { id: id as string, tenantId: req.tenantId } });
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    if (categoryId) {
      const category = await prisma.category.findFirst({ where: { id: categoryId, tenantId: req.tenantId } });
      if (!category) return res.status(400).json({ message: 'Invalid category' });
    }

    const product = await prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId: id as string } });
      await tx.productAddon.deleteMany({ where: { productId: id as string } });
      await tx.productImage.deleteMany({ where: { productId: id as string } });

      return await tx.product.update({
        where: { id: id as string },
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
            create: addons.map((addonId: string) => ({
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
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.product.findFirst({ where: { id: id as string, tenantId: req.tenantId } });
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    await prisma.$transaction([
      prisma.productVariant.deleteMany({ where: { productId: id as string } }),
      prisma.productImage.deleteMany({ where: { productId: id as string } }),
      prisma.inventory.deleteMany({ where: { productId: id as string } }),
      prisma.productAddon.deleteMany({ where: { productId: id as string } }),
      prisma.product.delete({ where: { id: id as string } })
    ]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const toggleProductStatus = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const existing = await prisma.product.findFirst({ where: { id: id as string, tenantId: req.tenantId } });
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    const product = await prisma.product.update({
      where: { id: id as string },
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
  } catch (error) {
    next(error);
  }
};

