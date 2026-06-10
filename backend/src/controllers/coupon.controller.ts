import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma';
import { validateCoupon } from '../services/coupon.service';

interface TenantReq extends Request {
  tenantId?: string;
}

// PUBLIC - Validate Coupon at Checkout
export const validateCouponApi = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { couponCode, phone, cartTotal } = req.body;

    if (!req.tenantId || !couponCode || cartTotal === undefined) {
      return res.status(400).json({ valid: false, message: 'Missing required fields.' });
    }

    const result = await validateCoupon({
      tenantId: req.tenantId,
      couponCode,
      phone,
      cartTotal: Number(cartTotal)
    });

    if (!result.valid) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// PUBLIC - Get Active Coupons for Checkout
export const getPublicCoupons = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: { 
        tenantId: req.tenantId,
        active: true,
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: now } }
        ],
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: now } }
            ]
          }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Omit sensitive data if any, but currently returning all fields is fine
    res.status(200).json(coupons);
  } catch (error) {
    next(error);
  }
};

// ADMIN - Get All Coupons
export const getCoupons = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(coupons);
  } catch (error) {
    next(error);
  }
};

// ADMIN - Create Coupon
export const createCoupon = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    
    // Ensure code is uppercase
    if (data.code) {
      data.code = data.code.toUpperCase();
    }

    const existing = await prisma.coupon.findFirst({
      where: { tenantId: req.tenantId, code: data.code }
    });

    if (existing) {
      return res.status(400).json({ message: 'Coupon code already exists.' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        ...data,
        tenantId: req.tenantId!
      }
    });

    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
};

// ADMIN - Update Coupon
export const updateCoupon = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    if (data.code) {
      data.code = data.code.toUpperCase();
      
      const existing = await prisma.coupon.findFirst({
        where: { tenantId: req.tenantId!, code: data.code, id: { not: id as string } }
      });

      if (existing) {
        return res.status(400).json({ message: 'Coupon code already exists.' });
      }
    }

    const existingCoupon = await prisma.coupon.findFirst({
      where: { id: id as string, tenantId: req.tenantId! }
    });

    if (!existingCoupon) {
      return res.status(404).json({ message: 'Coupon not found.' });
    }

    const coupon = await prisma.coupon.update({
      where: { id: id as string },
      data
    });

    res.status(200).json(coupon);
  } catch (error) {
    next(error);
  }
};

// ADMIN - Delete Coupon
export const deleteCoupon = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existingCoupon = await prisma.coupon.findFirst({
      where: { id: id as string, tenantId: req.tenantId! }
    });

    if (!existingCoupon) {
      return res.status(404).json({ message: 'Coupon not found.' });
    }

    await prisma.coupon.delete({
      where: { id: id as string }
    });

    res.status(200).json({ message: 'Coupon deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
