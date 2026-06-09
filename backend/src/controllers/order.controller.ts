import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma';

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
    res.status(200).json(order);
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
    const { customerName, phone, address, latitude, longitude, total, items, remarks } = req.body;

    const order = await prisma.order.create({
      data: {
        customerName,
        phone,
        address,
        latitude,
        longitude,
        total,
        remarks,
        status: 'NEW',
        tenant: { connect: { id: req.tenantId! } },
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
