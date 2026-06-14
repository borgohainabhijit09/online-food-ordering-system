import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma';

interface TenantReq extends Request { tenantId?: string; }

export const getCustomers = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { tenantId: req.tenantId },
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enrichedCustomers = customers.map(c => {
      const totalOrders = c.orders.length;
      const lifetimeSpend = c.orders.reduce((sum, order) => sum + order.total, 0);
      const lastOrderDate = c.orders.length > 0 ? c.orders[0]?.createdAt : null;

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        dob: c.dob,
        createdAt: c.createdAt,
        totalOrders,
        lifetimeSpend,
        lastOrderDate
      };
    });

    res.status(200).json(enrichedCustomers);
  } catch (error) {
    next(error);
  }
};

export const getCustomerByPhone = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.params;
    // Strip leading code or let it be if user types differently, but usually it matches exactly.
    const customer: any = await prisma.customer.findFirst({
      where: { tenantId: req.tenantId as string, phone: phone as string },
      include: {
        orders: {
          select: {
            address: true,
            latitude: true,
            longitude: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const lastOrder = customer.orders[0];

    res.status(200).json({
      name: customer.name,
      dob: customer.dob,
      address: lastOrder?.address || ''
    });
  } catch (error) {
    next(error);
  }
};
