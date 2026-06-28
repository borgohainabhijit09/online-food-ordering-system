import { Request, Response } from 'express';
import prisma from '../services/prisma';

export const getRoles = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const roles = await prisma.staffRole.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { tenantAccess: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createRole = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, permissions } = req.body;
    
    if (!name) return res.status(400).json({ message: 'Role name is required' });

    // Check if role name already exists for this tenant
    const existing = await prisma.staffRole.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name
        }
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Role with this name already exists' });
    }

    const role = await prisma.staffRole.create({
      data: {
        name,
        permissions: permissions || [],
        tenantId
      }
    });

    res.status(201).json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id as string;
    const { name, permissions } = req.body;

    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const existing = await prisma.staffRole.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check name collision
    if (name && name !== existing.name) {
      const collision = await prisma.staffRole.findUnique({
        where: {
          tenantId_name: {
            tenantId,
            name
          }
        }
      });
      if (collision) {
        return res.status(400).json({ message: 'Role with this name already exists' });
      }
    }

    const role = await prisma.staffRole.update({
      where: { id },
      data: {
        name: name || undefined,
        permissions: permissions !== undefined ? permissions : undefined
      }
    });

    res.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id as string;

    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    // Check if any users have this role
    const usersWithRole = await prisma.tenantAccess.count({
      where: { tenantId, staffRoleId: id }
    });

    if (usersWithRole > 0) {
      return res.status(400).json({ message: 'Cannot delete role assigned to active staff members' });
    }

    await prisma.staffRole.deleteMany({
      where: { id, tenantId }
    });

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
