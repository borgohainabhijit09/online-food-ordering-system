import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma';

interface TenantReq extends Request { tenantId?: string; }

export const getAddons = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const addons = await prisma.addon.findMany({
      where: { tenantId: req.tenantId }
    });
    res.status(200).json(addons);
  } catch (error) {
    next(error);
  }
};

export const createAddon = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { name, price, imageUrl } = req.body;
    const addon = await prisma.addon.create({
      data: { name, price, imageUrl, tenantId: req.tenantId! }
    });
    res.status(201).json(addon);
  } catch (error) {
    next(error);
  }
};

export const updateAddon = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, price, imageUrl } = req.body;

    const existing = await prisma.addon.findFirst({ where: { id: id as string, tenantId: req.tenantId } });
    if (!existing) return res.status(404).json({ message: 'Addon not found' });

    const addon = await prisma.addon.update({
      where: { id: id as string },
      data: { name, price, imageUrl }
    });
    res.status(200).json(addon);
  } catch (error) {
    next(error);
  }
};

export const deleteAddon = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await prisma.addon.findFirst({ where: { id: id as string, tenantId: req.tenantId } });
    if (!existing) return res.status(404).json({ message: 'Addon not found' });

    await prisma.$transaction([
      prisma.productAddon.deleteMany({ where: { addonId: id as string } }),
      prisma.addon.delete({ where: { id: id as string } })
    ]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
