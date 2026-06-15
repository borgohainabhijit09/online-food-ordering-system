import { Request, Response } from 'express';
import prisma from '../services/prisma';

// ========================
// TENANT ADMIN CONTROLLERS
// ========================

export const createTicket = async (req: Request, res: Response) => {
  try {
    const { tenantId } = (req as any).user;
    const { subject, description, priority } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId,
        subject,
        description,
        priority: priority || 'MEDIUM',
      },
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
};

export const getTenantTickets = async (req: Request, res: Response) => {
  try {
    const { tenantId } = (req as any).user;

    const tickets = await prisma.supportTicket.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tenant tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

// Also shared for Super Admin
export const getTicketDetails = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: id as string },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, name: true, role: true }
            }
          }
        },
        tenant: {
          select: { id: true, businessName: true, email: true }
        }
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // If not super admin, check tenant access
    if (user.role !== 'SUPER_ADMIN' && ticket.tenantId !== user.tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    res.status(500).json({ error: 'Failed to fetch ticket details' });
  }
};

export const addMessage = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params; // ticketId
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: id as string },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    if (!isSuperAdmin && ticket.tenantId !== user.tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const message = await prisma.supportMessage.create({
      data: {
        ticketId: id as string,
        senderId: user.id as string,
        isSuperAdmin,
        content,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    // Optionally update ticket status if super admin replies
    if (isSuperAdmin && ticket.status === 'OPEN') {
      await prisma.supportTicket.update({
        where: { id: id as string },
        data: { status: 'IN_PROGRESS' }
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
};

// ========================
// SUPER ADMIN CONTROLLERS
// ========================

export const getAllTickets = async (req: Request, res: Response) => {
  try {
    console.log('[getAllTickets] Request received. Query:', req.query);
    const { status, priority, tenantId } = req.query;

    const where: any = {};
    if (status) where.status = status as string;
    if (priority) where.priority = priority as string;
    if (tenantId) where.tenantId = tenantId as string;

    console.log('[getAllTickets] Constructed where clause:', where);

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: { id: true, businessName: true, email: true }
        },
        _count: {
          select: { messages: true }
        }
      }
    });

    console.log(`[getAllTickets] Found ${tickets.length} tickets`);
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: id as string },
      data: { status },
    });

    res.json(ticket);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
};
