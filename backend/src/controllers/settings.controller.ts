import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma';

interface TenantReq extends Request { tenantId?: string; }

export const getSettings = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    if (!req.tenantId) return res.status(400).json({ message: 'Tenant required' });

    const settings = await prisma.settings.findFirst({
      where: { tenantId: req.tenantId },
      include: {
        tenant: {
          select: { slug: true }
        }
      }
    });
    
    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }
    
    res.status(200).json({
      ...settings,
      tenantSlug: settings.tenant?.slug
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    if (!req.tenantId) return res.status(400).json({ message: 'Tenant required' });
    const { restaurantName, isAcceptingOrders, deliveryRadiusKm, restaurantLat, restaurantLng, whatsappNumber, hasDeliveryCharge, deliveryChargeAmount, minOrderValueForDelivery, logoUrl, fssaiNumber } = req.body;
    
    // Check if settings exist
    const existing = await prisma.settings.findFirst({
      where: { tenantId: req.tenantId }
    });
    
    let settings;

    if (existing) {
      settings = await prisma.settings.update({
        where: { id: existing.id },
        data: { restaurantName, isAcceptingOrders, deliveryRadiusKm, restaurantLat, restaurantLng, whatsappNumber, hasDeliveryCharge, deliveryChargeAmount, minOrderValueForDelivery, logoUrl, fssaiNumber }
      });
    } else {
      settings = await prisma.settings.create({
        data: { restaurantName, isAcceptingOrders, deliveryRadiusKm, restaurantLat, restaurantLng, whatsappNumber, hasDeliveryCharge, deliveryChargeAmount, minOrderValueForDelivery, logoUrl, fssaiNumber, tenantId: req.tenantId }
      });
    }

    res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
};
