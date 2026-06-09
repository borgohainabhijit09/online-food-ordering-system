import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma';

interface TenantReq extends Request { tenantId?: string; }

export const getCategories = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { order: 'asc' },
    });
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { name, order, imageUrl } = req.body;
    const category = await prisma.category.create({
      data: { name, order, imageUrl, tenantId: req.tenantId! },
    });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, order, imageUrl } = req.body;
    
    // First verify it belongs to tenant
    const existing = await prisma.category.findFirst({ where: { id: id as string, tenantId: req.tenantId } });
    if (!existing) return res.status(404).json({ message: 'Not found' });

    const category = await prisma.category.update({
      where: { id: id as string },
      data: { name, order, imageUrl },
    });
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.category.findFirst({ where: { id: id as string, tenantId: req.tenantId } });
    if (!existing) return res.status(404).json({ message: 'Not found' });

    await prisma.category.delete({
      where: { id: id as string },
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
