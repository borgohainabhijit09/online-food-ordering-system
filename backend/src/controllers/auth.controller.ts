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
      include: { tenantAccess: { include: { tenant: true } }, tenant: true }
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

    if (user.role === 'SUPER_ADMIN') {
      const token = jwt.sign(
        { id: user.id, role: user.role, phone: user.phone },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          phone: user.phone
        }
      });
    }

    const accessibleStores = user.tenantAccess.map(a => ({
      id: a.tenant.id,
      slug: a.tenant.slug,
      businessName: a.tenant.businessName,
      role: a.role
    }));

    if (accessibleStores.length === 0) {
      return res.status(403).json({ message: 'User does not have access to any restaurants' });
    }

    if (accessibleStores.length === 1) {
      const store = accessibleStores[0]!;
      const token = jwt.sign(
        { id: user.id, role: store.role, phone: user.phone, tenantId: store.id, tenantSlug: store.slug },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          role: store.role,
          phone: user.phone,
          tenantId: store.id,
          tenantSlug: store.slug
        },
        stores: accessibleStores
      });
    }

    // Multiple stores: Issue partial token and prompt for selection
    const partialToken = jwt.sign(
      { id: user.id, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      partialToken,
      requiresStoreSelection: true,
      stores: accessibleStores,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone
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
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          slug,
          businessName,
          email,
          phone
        }
      });

      let adminUser = existingUser;
      
      if (!adminUser) {
        adminUser = await tx.user.create({
          data: {
            name: ownerName,
            phone,
            password: hashedPassword,
            role: 'ADMIN',
            tenantId: newTenant.id // Keeping for backward compat
          }
        });
      }

      // Always create TenantAccess
      await tx.tenantAccess.create({
        data: {
          userId: adminUser.id,
          tenantId: newTenant.id,
          role: 'ADMIN'
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

      return { tenant: newTenant, admin: adminUser };
    });

    const token = jwt.sign(
      { id: result.admin.id, role: 'ADMIN', phone: result.admin.phone, tenantId: result.tenant.id, tenantSlug: result.tenant.slug },
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

export const selectStore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (!decoded || !decoded.id) return res.status(401).json({ message: 'Invalid token' });

    const { tenantId } = req.body;
    if (!tenantId) return res.status(400).json({ message: 'tenantId is required' });

    const access = await prisma.tenantAccess.findUnique({
      where: { userId_tenantId: { userId: decoded.id, tenantId } },
      include: { tenant: true, user: true }
    });

    if (!access || !access.tenant.isActive) {
      return res.status(403).json({ message: 'Access denied or restaurant suspended' });
    }

    const newToken = jwt.sign(
      { id: access.user.id, role: access.role, phone: access.user.phone, tenantId: access.tenant.id, tenantSlug: access.tenant.slug },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token: newToken,
      user: {
        id: access.user.id,
        name: access.user.name,
        role: access.role,
        phone: access.user.phone,
        tenantId: access.tenant.id,
        tenantSlug: access.tenant.slug
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getStores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userReq = req as any;
    if (!userReq.user || !userReq.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const accesses = await prisma.tenantAccess.findMany({
      where: { userId: userReq.user.id },
      include: { tenant: true }
    });

    const stores = accesses.map(a => ({
      id: a.tenant.id,
      slug: a.tenant.slug,
      businessName: a.tenant.businessName,
      role: a.role
    }));

    res.status(200).json(stores);
  } catch (error) {
    next(error);
  }
};
