import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma';

interface TenantReq extends Request { tenantId?: string; }

export const getSettings = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    if (!req.tenantId) return res.status(400).json({ message: 'Tenant required' });

    let settings = await prisma.settings.findFirst({
      where: { tenantId: req.tenantId },
      include: {
        tenant: {
          select: { slug: true, businessName: true, restaurantId: true }
        }
      }
    });
    
    if (!settings) {
      // Auto-create settings if they don't exist yet
      const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
      settings = await prisma.settings.create({
        data: {
          tenantId: req.tenantId,
          restaurantName: tenant?.businessName || 'My Restaurant',
          isAcceptingOrders: true,
          deliveryRadiusKm: 5,
          restaurantLat: 0,
          restaurantLng: 0,
          whatsappNumber: '',
        },
        include: {
          tenant: {
            select: { slug: true, businessName: true, restaurantId: true }
          }
        }
      });
    }
    
    res.status(200).json({
      ...settings,
      tenantSlug: settings?.tenant?.slug,
      restaurantId: settings?.tenant?.restaurantId
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
        data: { restaurantName, isAcceptingOrders, deliveryRadiusKm, restaurantLat, restaurantLng, whatsappNumber, hasDeliveryCharge, deliveryChargeAmount, minOrderValueForDelivery, logoUrl, fssaiNumber },
        include: { tenant: { select: { slug: true, restaurantId: true } } }
      });
    } else {
      settings = await prisma.settings.create({
        data: { restaurantName, isAcceptingOrders, deliveryRadiusKm, restaurantLat, restaurantLng, whatsappNumber, hasDeliveryCharge, deliveryChargeAmount, minOrderValueForDelivery, logoUrl, fssaiNumber, tenantId: req.tenantId },
        include: { tenant: { select: { slug: true, restaurantId: true } } }
      });
    }

    res.status(200).json({
      ...settings,
      tenantSlug: settings?.tenant?.slug,
      restaurantId: settings?.tenant?.restaurantId
    });
  } catch (error) {
    next(error);
  }
};
