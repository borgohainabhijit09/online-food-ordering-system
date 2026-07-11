import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../services/prisma';
import { PasswordService } from '../services/password.service';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      include: { tenantAccess: { include: { tenant: true, staffRole: true } }, tenant: true }
    });

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return res.status(403).json({ message: 'Account temporarily locked. Please try again later.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts, lockedUntil }
      });

      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });

    if (user.role === 'SUPER_ADMIN') {
      const token = jwt.sign(
        { id: user.id, name: user.name, role: user.role, phone: user.phone, forcePasswordChange: user.forcePasswordChange, permissions: [] },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          phone: user.phone,
          forcePasswordChange: user.forcePasswordChange
        }
      });
    }

    const accessibleStores = user.tenantAccess.map(a => {
      const perms = a.staffRole?.permissions || [];
      console.log(`[LOGIN DEBUG] User ${user.phone} -> Store ${a.tenant.slug} -> Role ${a.role} -> StaffRoleId ${a.staffRoleId} -> Permissions:`, perms);
      return {
        id: a.tenant.id,
        slug: a.tenant.slug,
        businessName: a.tenant.businessName,
        role: a.role,
        permissions: perms
      };
    });

    if (accessibleStores.length === 0) {
      return res.status(403).json({ message: 'User does not have access to any restaurants' });
    }

    if (accessibleStores.length === 1) {
      const store = accessibleStores[0]!;

      // Check if store is staff role and status is valid
      const access = await prisma.tenantAccess.findFirst({
        where: { userId: user.id, tenantId: store.id }
      });

      if (access && access.role === 'STAFF' && access.status !== 'ACTIVE') {
        return res.status(403).json({ message: 'Account is ' + access.status.toLowerCase() });
      }

      const token = jwt.sign(
        { id: user.id, name: user.name, role: store.role, phone: user.phone, tenantId: store.id, tenantSlug: store.slug, forcePasswordChange: user.forcePasswordChange, permissions: store.permissions },
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
          tenantSlug: store.slug,
          forcePasswordChange: user.forcePasswordChange,
          permissions: store.permissions
        },
        stores: accessibleStores
      });
    }

    // Multiple stores: Issue partial token and prompt for selection
    const partialToken = jwt.sign(
      { id: user.id, name: user.name, phone: user.phone, forcePasswordChange: user.forcePasswordChange },
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
        phone: user.phone,
        forcePasswordChange: user.forcePasswordChange
      }
    });
  } catch (error) {
    next(error);
  }
};

export const registerTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessName, slug, email, phone, ownerName, password } = req.body;

    // Validate slug
    const existingTenant = await prisma.tenant.findFirst({ where: { slug } });
    if (existingTenant) {
      return res.status(400).json({ message: 'Slug is already taken. Please choose another.' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    const hashedPassword = await bcrypt.hash(password, 10);

    const generateId = () => 'RB-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    let restaurantId = generateId();
    while (await prisma.tenant.findUnique({ where: { restaurantId } })) {
      restaurantId = generateId();
    }

    const result = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          slug,
          businessName,
          email,
          phone,
          restaurantId
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

      // NOTE: No TenantSubscription created at signup.
      // Restaurants start in TESTING phase (set by schema default).
      // Subscription begins only after the trial period ends and they subscribe.

      return { tenant: newTenant, admin: adminUser };
    });

    const token = jwt.sign(
      { id: result.admin.id, name: result.admin.name, role: 'ADMIN', phone: result.admin.phone, tenantId: result.tenant.id, tenantSlug: result.tenant.slug },
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
      include: { tenant: true, user: true, staffRole: true }
    });

    if (!access || !access.tenant.isActive) {
      return res.status(403).json({ message: 'Access denied or restaurant suspended' });
    }

    if (access.role === 'STAFF' && access.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Account is ' + access.status.toLowerCase() });
    }

    const permissions = access.staffRole?.permissions || [];

    const newToken = jwt.sign(
      {
        id: access.user.id,
        name: access.user.name,
        role: access.role,
        phone: access.user.phone,
        tenantId: access.tenant.id,
        tenantSlug: access.tenant.slug,
        forcePasswordChange: access.user.forcePasswordChange,
        permissions
      },
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
        tenantSlug: access.tenant.slug,
        forcePasswordChange: access.user.forcePasswordChange,
        permissions
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
      include: { tenant: true, staffRole: true }
    });

    const stores = accesses.map(a => ({
      id: a.tenant.id,
      slug: a.tenant.slug,
      businessName: a.tenant.businessName,
      role: a.role,
      permissions: a.staffRole?.permissions || []
    }));

    res.status(200).json(stores);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userReq = req as any;
    if (!userReq.user || !userReq.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userReq.user.id } });
    if (!user || !user.password) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const validation = PasswordService.validatePassword(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    const hashedPassword = await PasswordService.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        forcePasswordChange: false,
        lastPasswordChangeAt: new Date()
      }
    });

    // Issue a fresh token with forcePasswordChange=false so the client can replace the
    // stale token that was carrying forcePasswordChange=true. Without this the user would
    // be bounced back to the change-password screen immediately after logging out.
    const oldPayload = userReq.user; // decoded JWT payload attached by auth middleware
    const freshToken = jwt.sign(
      {
        id: oldPayload.id,
        name: oldPayload.name,
        role: oldPayload.role,
        phone: oldPayload.phone,
        tenantId: oldPayload.tenantId,
        tenantSlug: oldPayload.tenantSlug,
        permissions: oldPayload.permissions,
        forcePasswordChange: false,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({ message: 'Password changed successfully', token: freshToken });
  } catch (error) {
    next(error);
  }
};


export const createLeadFromDemoRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantName, ownerName, phone, email, city } = req.body;
    
    if (!restaurantName || !ownerName || !phone) {
      return res.status(400).json({ message: 'Restaurant name, owner name, and phone number are required' });
    }

    const lead = await prisma.lead.create({
      data: {
        restaurantName,
        ownerName,
        phone,
        email: email || null,
        city: city || null,
        status: 'NEW',
        source: 'landing_page_demo_cta'
      }
    });

    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
};

