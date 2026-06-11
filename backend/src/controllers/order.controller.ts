import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma';
import { validateCoupon } from '../services/coupon.service';

interface TenantReq extends Request { tenantId?: string; }

export const getOrders = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.order.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { addons: true }
        }
      }
    });
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findFirst({
      where: { id: id as string, tenantId: req.tenantId },
      include: {
        items: {
          include: { addons: true }
        }
      }
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Fetch product names to attach to items
    const productIds = order.items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });
    
    const productMap = Object.fromEntries(products.map(p => [p.id, p.name]));
    
    const orderWithNames = {
      ...order,
      items: order.items.map(item => ({
        ...item,
        productName: productMap[item.productId] || `Product #${item.productId.slice(-4).toUpperCase()}`
      }))
    };

    res.status(200).json(orderWithNames);
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const existing = await prisma.order.findFirst({ where: { id: id as string, tenantId: req.tenantId } });
    if (!existing) return res.status(404).json({ message: 'Order not found' });

    const order = await prisma.order.update({
      where: { id: id as string },
      data: { status }
    });
    
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { customerName, phone, address, latitude, longitude, total, items, remarks, couponCode, dob } = req.body;

    let finalTotal = total;
    let appliedDiscount = 0;

    // Validate Coupon Server-Side
    if (couponCode) {
      const couponResult = await validateCoupon({
        tenantId: req.tenantId!,
        couponCode,
        phone,
        cartTotal: total
      });

      if (!couponResult.valid) {
        return res.status(400).json({ message: couponResult.message });
      }

      finalTotal = couponResult.finalAmount!;
      appliedDiscount = couponResult.discountAmount!;
    }

    // Upsert Customer Profile
    const customer = await prisma.customer.upsert({
      where: {
        tenantId_phone: { tenantId: req.tenantId!, phone: phone }
      },
      update: {
        name: customerName,
        ...(dob ? { dob: new Date(dob) } : {})
      },
      create: {
        tenantId: req.tenantId!,
        name: customerName,
        phone: phone,
        ...(dob ? { dob: new Date(dob) } : {})
      }
    });

    const order = await prisma.order.create({
      data: {
        customerName,
        phone,
        address,
        latitude,
        longitude,
        total: finalTotal,
        couponCode: couponCode || null,
        discountAmount: appliedDiscount,
        remarks,
        status: 'NEW',
        tenant: { connect: { id: req.tenantId! } },
        customer: { connect: { id: customer.id } },
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            variant: item.variant,
            addons: {
              create: item.addons?.map((addon: any) => ({
                addonName: addon.addonName,
                price: addon.price
              })) || []
            }
          }))
        }
      },
      include: {
        items: {
          include: { addons: true }
        }
      }
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};
