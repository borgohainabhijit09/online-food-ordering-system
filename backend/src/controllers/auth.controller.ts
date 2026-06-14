import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../services/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    const user = await prisma.user.findUnique({ 
      where: { phone },
      include: { tenant: true }
    });
    
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, phone: user.phone, tenantId: user.tenantId, tenantSlug: user.tenant?.slug },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        tenantId: user.tenantId,
        tenantSlug: user.tenant?.slug
      }
    });
  } catch (error) {
    next(error);
  }
};

export const registerTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessName, slug, email, phone, ownerName, password, plan } = req.body;

    // Validate slug
    const existingTenant = await prisma.tenant.findFirst({ where: { slug } });
    if (existingTenant) {
      return res.status(400).json({ message: 'Slug is already taken. Please choose another.' });
    }

    const packageName = plan === 'Growth' ? 'App + Website' : 'App Only';
    const defaultPackage = await prisma.subscriptionPackage.findUnique({
      where: { name: packageName }
    });
    
    if (!defaultPackage) {
      return res.status(500).json({ message: 'Default subscription package not found in system.' });
    }
    
    // Check if phone or email is already taken
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ message: 'Phone number already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Tenant, Admin User, and default Settings in one transaction
    const result = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          slug,
          businessName,
          email,
          phone
        }
      });

      const newAdmin = await tx.user.create({
        data: {
          name: ownerName,
          phone,
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: newTenant.id
        }
      });

      await tx.settings.create({
        data: {
          restaurantName: businessName,
          whatsappNumber: phone,
          restaurantLat: 0,
          restaurantLng: 0,
          tenantId: newTenant.id
        }
      });

      // Assign default subscription package
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await tx.tenantSubscription.create({
        data: {
          tenantId: newTenant.id,
          packageId: defaultPackage.id,
          nextBillingDate: nextMonth,
          status: 'ACTIVE'
        }
      });

      return { tenant: newTenant, admin: newAdmin };
    });

    const token = jwt.sign(
      { id: result.admin.id, role: result.admin.role, phone: result.admin.phone, tenantId: result.admin.tenantId, tenantSlug: result.tenant.slug },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Business registered successfully!',
      tenantSlug: result.tenant.slug,
      token
    });

  } catch (error) {
    next(error);
  }
};
