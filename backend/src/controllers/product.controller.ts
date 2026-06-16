import { Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
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

export const bulkDeleteProducts = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No product IDs provided' });
    }

    // Ensure all products belong to this tenant
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: ids }, tenantId: req.tenantId },
      select: { id: true }
    });
    
    const validIds = existingProducts.map(p => p.id);

    if (validIds.length === 0) {
      return res.status(404).json({ message: 'Products not found or not authorized' });
    }

    await prisma.$transaction([
      prisma.productVariant.deleteMany({ where: { productId: { in: validIds } } }),
      prisma.productImage.deleteMany({ where: { productId: { in: validIds } } }),
      prisma.inventory.deleteMany({ where: { productId: { in: validIds } } }),
      prisma.productAddon.deleteMany({ where: { productId: { in: validIds } } }),
      prisma.product.deleteMany({ where: { id: { in: validIds } } })
    ]);
    res.status(200).json({ message: `Successfully deleted ${validIds.length} products` });
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

export const bulkUploadProducts = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const results: any[] = [];
    const stream = Readable.from(req.file.buffer.toString('utf-8'));
    
    stream
      .pipe(csvParser({
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
              if (errors === 0) console.log("First error row:", row);
              errors++;
              continue;
            }

            // Find or create category
            let category = await prisma.category.findFirst({
              where: { name: { equals: categoryName, mode: 'insensitive' }, tenantId: req.tenantId! }
            });
            if (!category) {
              category = await prisma.category.create({
                data: {
                  name: categoryName,
                  tenant: { connect: { id: req.tenantId! } }
                }
              });
            }

            const offerPrice = row.OfferPrice ? parseFloat(row.OfferPrice) : null;
            const isSpicy = row.IsSpicy?.toUpperCase() === 'TRUE';
            const isActive = row.IsActive?.toUpperCase() !== 'FALSE';
            const dietaryPreference = ['VEG', 'NON_VEG', 'VEGAN', 'EGG'].includes(row.DietaryPreference?.toUpperCase()) 
              ? row.DietaryPreference.toUpperCase() : 'VEG';

            await prisma.product.create({
              data: {
                name: productName,
                description: row.Description || null,
                basePrice,
                offerPrice: isNaN(offerPrice as number) ? null : offerPrice,
                isSpicy,
                isActive,
                dietaryPreference: dietaryPreference as 'VEG' | 'NON_VEG' | 'VEGAN',
                category: { connect: { id: category.id } },
                tenant: { connect: { id: req.tenantId! } },
                images: row.ImageUrl ? { create: [{ url: row.ImageUrl }] } : undefined,
                inventory: { create: { currentStock: 0, minimumStock: 5 } }
              }
            });
            imported++;
          } catch (e) {
            console.error('Row import error:', e);
            errors++;
          }
        }
        res.status(200).json({ imported, errors, firstErrorRow: errors > 0 ? results[0] : null });
      });
  } catch (error) {
    next(error);
  }
};
