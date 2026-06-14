import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { isSuperAdmin, SuperAdminRequest } from '../middlewares/superAdmin.middleware';

const router = Router();
router.use(isSuperAdmin);

// Get all leads
router.get('/', async (req: SuperAdminRequest, res: Response) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(leads);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create lead
router.post('/', async (req: SuperAdminRequest, res: Response) => {
  try {
    const { restaurantName, ownerName, phone, email, city, source, assignedTo, notes, nextFollowUpDate } = req.body;
    
    const lead = await prisma.lead.create({
      data: {
        restaurantName,
        ownerName,
        phone,
        email,
        city,
        source,
        assignedTo,
        notes,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null
      }
    });

    res.status(201).json(lead);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update lead status (drag and drop)
router.patch('/:id/status', async (req: SuperAdminRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const lead = await prisma.lead.update({
      where: { id },
      data: { status }
    });

    res.json(lead);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update lead details
router.put('/:id', async (req: SuperAdminRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { restaurantName, ownerName, phone, email, city, source, assignedTo, notes, nextFollowUpDate } = req.body;

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        restaurantName,
        ownerName,
        phone,
        email,
        city,
        source,
        assignedTo,
        notes,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null
      }
    });

    res.json(lead);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete lead
router.delete('/:id', async (req: SuperAdminRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.lead.delete({
      where: { id }
    });
    res.json({ message: 'Lead deleted' });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
