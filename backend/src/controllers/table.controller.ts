import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma';

interface TenantReq extends Request { tenantId?: string; }

export const getTables = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.query.tenantId as string;
    const tables = await prisma.restaurantTable.findMany({
      where: { tenantId },
      orderBy: { tableNumber: 'asc' },
    });
    res.status(200).json(tables);
  } catch (error) {
    next(error);
  }
};

export const createTable = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { tableNumber, tableName, capacity } = req.body;
    
    const existing = await prisma.restaurantTable.findUnique({
      where: { tenantId_tableNumber: { tenantId: req.tenantId!, tableNumber: String(tableNumber) } }
    });

    if (existing) {
      return res.status(400).json({ message: 'Table number already exists' });
    }

    const table = await prisma.restaurantTable.create({
      data: {
        tenantId: req.tenantId!,
        tableNumber: String(tableNumber),
        tableName,
        capacity: Number(capacity) || 4,
      }
    });

    res.status(201).json(table);
  } catch (error) {
    next(error);
  }
};

export const updateTable = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { tableNumber, tableName, capacity, status } = req.body;
    
    const existing = await prisma.restaurantTable.findFirst({
      where: { id, tenantId: req.tenantId! }
    });

    if (!existing) return res.status(404).json({ message: 'Table not found' });

    const table = await prisma.restaurantTable.update({
      where: { id },
      data: { tableNumber: tableNumber ? String(tableNumber) : undefined, tableName, capacity: capacity ? Number(capacity) : undefined, status }
    });

    res.status(200).json(table);
  } catch (error) {
    next(error);
  }
};

export const deleteTable = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.query.tenantId as string;
    
    const existing = await prisma.restaurantTable.findFirst({
      where: { id, tenantId }
    });

    if (!existing) return res.status(404).json({ message: 'Table not found' });

    await prisma.restaurantTable.delete({ where: { id } });

    res.status(200).json({ message: 'Table deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Customer facing actions
export const callWaiter = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { tableNumber } = req.body;
    
    const table = await prisma.restaurantTable.findUnique({
      where: { tenantId_tableNumber: { tenantId: req.tenantId!, tableNumber: String(tableNumber) } }
    });

    if (!table) return res.status(404).json({ message: 'Table not found' });

    const event = await prisma.restaurantEvent.create({
      data: {
        tenantId: req.tenantId!,
        tableId: table.id,
        type: 'CALL_WAITER',
        status: 'PENDING'
      }
    });

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

export const requestBill = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { tableNumber } = req.body;
    
    const table = await prisma.restaurantTable.findUnique({
      where: { tenantId_tableNumber: { tenantId: req.tenantId!, tableNumber: String(tableNumber) } }
    });

    if (!table) return res.status(404).json({ message: 'Table not found' });

    const event = await prisma.restaurantEvent.create({
      data: {
        tenantId: req.tenantId!,
        tableId: table.id,
        type: 'REQUEST_BILL',
        status: 'PENDING'
      }
    });

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

// Admin fetching active events
export const getActiveEvents = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.query.tenantId as string;
    const events = await prisma.restaurantEvent.findMany({
      where: { 
        tenantId,
        status: 'PENDING'
      },
      include: {
        table: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
};

export const resolveEvent = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.restaurantEvent.findFirst({
      where: { id, tenantId: req.tenantId! }
    });

    if (!existing) return res.status(404).json({ message: 'Event not found' });

    const event = await prisma.restaurantEvent.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() }
    });

    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
};
