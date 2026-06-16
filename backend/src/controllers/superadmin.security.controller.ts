import { Response } from 'express';
import prisma from '../services/prisma';
import { SuperAdminRequest } from '../middlewares/superAdmin.middleware';
import { PasswordService } from '../services/password.service';

export const resetRestaurantPassword = async (req: SuperAdminRequest, res: Response) => {
  try {
    const tenantId = req.params.id as string;
    const { passwordType, manualPassword } = req.body;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Find the primary owner (first ADMIN of the tenant)
    const adminAccess = await prisma.tenantAccess.findFirst({
      where: { tenantId, role: 'ADMIN' },
      include: { user: true },
      orderBy: { createdAt: 'asc' }
    }) as any;

    if (!adminAccess || !adminAccess.user) {
      return res.status(404).json({ message: 'Tenant has no assigned admin user' });
    }

    const admin = adminAccess.user;

    let newPassword = '';
    if (passwordType === 'manual') {
      const validation = PasswordService.validatePassword(manualPassword);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.message });
      }
      newPassword = manualPassword;
    } else {
      newPassword = PasswordService.generateTempPassword();
    }

    const hashedPassword = await PasswordService.hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: admin.id },
        data: {
          password: hashedPassword,
          forcePasswordChange: true,
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });

      await tx.auditLog.create({
        data: {
          businessId: tenantId,
          userId: admin.id,
          action: 'PASSWORD_RESET',
          performedBy: 'SUPER_ADMIN',
          metadata: { targetUserPhone: admin.phone }
        }
      });
    });

    res.json({ 
      message: 'Password reset successfully. The restaurant owner will be required to create a new password during their next login.',
      tempPassword: newPassword 
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSecurityInfo = async (req: SuperAdminRequest, res: Response) => {
  try {
    const tenantId = req.params.id as string;
    
    const adminAccess = await prisma.tenantAccess.findFirst({
      where: { tenantId, role: 'ADMIN' },
      include: { user: true },
      orderBy: { createdAt: 'asc' }
    }) as any;

    if (!adminAccess || !adminAccess.user) {
      return res.status(404).json({ message: 'Tenant has no assigned admin user' });
    }

    const admin = adminAccess.user;

    const securityInfo = {
      lastLoginAt: admin.lastLoginAt,
      lastPasswordChangeAt: admin.lastPasswordChangeAt,
      failedLoginAttempts: admin.failedLoginAttempts,
      lockedUntil: admin.lockedUntil,
      forcePasswordChange: admin.forcePasswordChange
    };

    res.json(securityInfo);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAuditLogs = async (req: SuperAdminRequest, res: Response) => {
  try {
    const tenantId = req.params.id as string;
    
    const logs = await prisma.auditLog.findMany({
      where: { businessId: tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
