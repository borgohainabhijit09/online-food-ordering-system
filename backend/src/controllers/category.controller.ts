import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma';

interface TenantReq extends Request { tenantId?: string; }

export const getCategories = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { products: true } }
      }
    });
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { name, order, imageUrl, isActive } = req.body;
    const category = await prisma.category.create({
      data: { name, order, imageUrl, isActive: isActive !== undefined ? isActive : true, tenantId: req.tenantId! },
    });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, order, imageUrl, isActive } = req.body;
    
    // First verify it belongs to tenant
    const existing = await prisma.category.findFirst({ where: { id: id as string, tenantId: req.tenantId } });
    if (!existing) return res.status(404).json({ message: 'Not found' });

    const category = await prisma.category.update({
      where: { id: id as string },
      data: { name, order, imageUrl, isActive },
    });
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.category.findFirst({ 
      where: { id: id as string, tenantId: req.tenantId },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    if (!existing) return res.status(404).json({ message: 'Not found' });

    if (existing._count.products > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. It contains ${existing._count.products} products. Please reassign or delete them first.` 
      });
    }

    await prisma.category.delete({
      where: { id: id as string },
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
