import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../services/prisma';

export const getStaff = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const staffMembers = await prisma.tenantAccess.findMany({
      where: { 
        tenantId,
        role: 'STAFF'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true,
            lastLoginAt: true
          }
        },
        staffRole: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(staffMembers.map((s: any) => ({
      ...s.user,
      accessId: s.id,
      staffRole: s.staffRole
    })));
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, phone, password, staffRoleId } = req.body;
    
    if (!name || !phone || !password || !staffRoleId) {
      return res.status(400).json({ message: 'Name, phone, password, and role are required' });
    }

    // Verify staffRole belongs to this tenant
    const role = await prisma.staffRole.findFirst({
      where: { id: staffRoleId, tenantId }
    });
    if (!role) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user with phone already exists in system
    let user = await prisma.user.findUnique({
      where: { phone }
    });

    if (user) {
      // Check if user is already assigned to this tenant
      const existingAccess = await prisma.tenantAccess.findUnique({
        where: { userId_tenantId: { userId: user.id, tenantId } }
      });
      if (existingAccess) {
        return res.status(400).json({ message: 'User with this phone is already staff here' });
      }
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          name,
          phone,
          password: hashedPassword,
          role: 'STAFF'
        }
      });
    }

    // Grant access
    const access = await prisma.tenantAccess.create({
      data: {
        userId: user.id,
        tenantId,
        role: 'STAFF',
        staffRoleId
      },
      include: { staffRole: true }
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      accessId: access.id,
      staffRole: access.staffRole
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateStaff = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id as string; // this is the tenantAccess ID, not user ID
    const { name, phone, password, staffRoleId } = req.body;

    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const access = await prisma.tenantAccess.findFirst({
      where: { id, tenantId },
      include: { user: true }
    });

    if (!access) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    if (staffRoleId && staffRoleId !== access.staffRoleId) {
      const role = await prisma.staffRole.findFirst({
        where: { id: staffRoleId, tenantId }
      });
      if (!role) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      
      await prisma.tenantAccess.update({
        where: { id },
        data: { staffRoleId }
      });
    }

    if (name || phone || password) {
      const updateData: any = {};
      if (name) updateData.name = name;
      
      if (phone && phone !== access.user.phone) {
        const existing = await prisma.user.findUnique({ where: { phone } });
        if (existing) {
          return res.status(400).json({ message: 'Phone number already in use by another user' });
        }
        updateData.phone = phone;
      }
      
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await prisma.user.update({
        where: { id: access.userId },
        data: updateData
      });
    }

    const updatedAccess = await prisma.tenantAccess.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        staffRole: true
      }
    });

    res.json({
      id: updatedAccess?.user.id,
      name: updatedAccess?.user.name,
      phone: updatedAccess?.user.phone,
      accessId: updatedAccess?.id,
      staffRole: updatedAccess?.staffRole
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteStaff = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id as string; // tenantAccess ID

    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const access = await prisma.tenantAccess.findFirst({
      where: { id, tenantId }
    });

    if (!access) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    if (access.role === 'ADMIN') {
      return res.status(403).json({ message: 'Cannot delete admin user' });
    }

    await prisma.tenantAccess.delete({
      where: { id }
    });

    // Optionally check if user has other accesses, if not delete user, but keeping it is safer
    res.json({ message: 'Staff removed successfully' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
