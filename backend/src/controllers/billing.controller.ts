import { Request, Response } from 'express';
import prisma from '../services/prisma';

export const getBillingSummary = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get today's bounds
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get all PAID or COMPLETED orders for today
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        // status: 'COMPLETED' or paymentStatus: 'PAID' (depending on the logic, let's take all today's orders for simplicity, maybe just those that aren't cancelled)
        status: { not: 'CANCELLED' }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    let cashTotal = 0;
    let digitalTotal = 0;

    const invoices = orders.map(order => {
      // paymentMethod is typically 'COD' for cash, 'ONLINE' or 'UPI' or 'CARD' for digital
      const method = order.paymentMethod?.toUpperCase() || 'COD';
      if (method === 'COD' || method === 'CASH') {
        cashTotal += order.total;
      } else {
        digitalTotal += order.total;
      }

      return {
        id: order.id,
        date: order.createdAt.toISOString().split('T')[0],
        amount: order.total,
        type: order.orderType,
        method: method,
        status: order.paymentStatus || 'PAID'
      };
    });

    res.json({
      cashTotal,
      digitalTotal,
      totalInvoices: invoices.length,
      invoices
    });

  } catch (error) {
    console.error('Error in getBillingSummary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const closeRegister = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user?.id || 'admin';
    if (!tenantId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { actualCash, notes } = req.body;

    // Calculate expected cash again just in case
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' }
      }
    });

    let expectedCash = 0;
    orders.forEach(order => {
      const method = order.paymentMethod?.toUpperCase() || 'COD';
      if (method === 'COD' || method === 'CASH') {
        expectedCash += order.total;
      }
    });

    const discrepancy = actualCash - expectedCash;

    const closure = await prisma.cashRegisterClosure.create({
      data: {
        tenantId,
        expectedCash,
        actualCash,
        discrepancy,
        notes,
        closedBy: userId
      }
    });

    res.json(closure);
  } catch (error) {
    console.error('Error in closeRegister:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
