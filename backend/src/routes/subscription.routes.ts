import { Router, Request, Response } from 'express';
import prisma from '../services/prisma';
import { authenticate } from '../middlewares/auth.middleware';
import { isSuperAdmin } from '../middlewares/superAdmin.middleware';
import { SubscriptionService } from '../services/subscription.service';

const router = Router();

// ==========================================
// 1. PLANS ENDPOINTS
// ==========================================

// GET /api/plans - Get all plans (public or authenticated)
router.get('/plans', async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        planFeatures: {
          include: { feature: true }
        }
      },
      orderBy: { monthlyPrice: 'asc' }
    });
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching plans', error: error.message });
  }
});

// POST /api/plans - Create plan (Super Admin only)
router.post('/plans', isSuperAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, monthlyPrice, yearlyPrice, description, featureCodes } = req.body;
    
    if (!name || monthlyPrice === undefined) {
      res.status(400).json({ message: 'Name and monthlyPrice are required.' });
      return;
    }

    const plan = await prisma.$transaction(async (tx) => {
      const newPlan = await tx.subscriptionPlan.create({
        data: {
          name,
          monthlyPrice: parseFloat(monthlyPrice),
          yearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : null,
          description,
          isActive: true
        }
      });
      
      if (featureCodes && Array.isArray(featureCodes)) {
        for (const code of featureCodes) {
          const feat = await tx.feature.findUnique({ where: { code } });
          if (feat) {
            await tx.planFeature.create({
              data: {
                planId: newPlan.id,
                featureId: feat.id
              }
            });
          }
        }
      }
      
      // Write Audit Log
      await tx.auditLog.create({
        data: {
          action: 'PLAN_CREATED',
          performedBy: 'SUPER_ADMIN',
          metadata: { planName: name, monthlyPrice }
        }
      });
      
      return newPlan;
    });
    
    res.status(201).json(plan);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error creating plan', error: error.message });
  }
});

// PUT /api/plans/:id - Update plan (Super Admin only)
router.put('/plans/:id', isSuperAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, monthlyPrice, yearlyPrice, description, isActive, featureCodes } = req.body;
    
    const updatedPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.subscriptionPlan.update({
        where: { id },
        data: {
          name,
          monthlyPrice: monthlyPrice !== undefined ? parseFloat(monthlyPrice) : undefined,
          yearlyPrice: yearlyPrice !== undefined ? (yearlyPrice ? parseFloat(yearlyPrice) : null) : undefined,
          description,
          isActive: isActive !== undefined ? isActive : undefined
        }
      });
      
      if (featureCodes && Array.isArray(featureCodes)) {
        // Delete existing features for this plan
        await tx.planFeature.deleteMany({ where: { planId: id as string } });
        
        // Re-add selected features
        for (const code of featureCodes) {
          const feat = await tx.feature.findUnique({ where: { code: code as string } });
          if (feat) {
            await tx.planFeature.create({
              data: {
                planId: id as string,
                featureId: feat.id
              }
            });
          }
        }
      }
      
      // Write Audit Log
      await tx.auditLog.create({
        data: {
          action: 'PLAN_UPDATED',
          performedBy: 'SUPER_ADMIN',
          metadata: { planName: plan.name, planId: id }
        }
      });
      
      return plan;
    });
    
    res.json(updatedPlan);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error updating plan', error: error.message });
  }
});

// ==========================================
// 2. FEATURES ENDPOINTS
// ==========================================

// GET /api/features - Get all feature codes (public listing, no sensitive data)
router.get('/features', async (req: Request, res: Response): Promise<void> => {
  try {
    const features = await prisma.feature.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(features);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching features', error: error.message });
  }
});

// POST /api/features - Create feature code (Super Admin only)
router.post('/features', isSuperAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, description } = req.body;
    
    if (!code || !name) {
      res.status(400).json({ message: 'Code and name are required.' });
      return;
    }

    const feature = await prisma.feature.create({
      data: { code, name, description }
    });
    res.status(201).json(feature);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error creating feature', error: error.message });
  }
});

// POST /api/plan-features - Assign feature to plan (Super Admin only)
router.post('/plan-features', isSuperAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId, featureId } = req.body;
    
    if (!planId || !featureId) {
      res.status(400).json({ message: 'PlanId and featureId are required.' });
      return;
    }

    const planFeature = await prisma.planFeature.create({
      data: { planId, featureId }
    });
    res.status(201).json(planFeature);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error assigning feature', error: error.message });
  }
});

// ==========================================
// 3. RESTAURANT & TENANT FEATURE ACCESS
// ==========================================

// GET /api/restaurants/:id/features - Resolve plan and active features for a restaurant
router.get('/restaurants/:id/features', authenticate, async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check permission: superadmin or tenant-owner
    if (req.user.role !== 'SUPER_ADMIN' && req.user.tenantId !== id) {
      res.status(403).json({ message: 'Access denied. You cannot query other stores.' });
      return;
    }
    
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        currentPlan: {
          include: {
            planFeatures: {
              include: { feature: true }
            }
          }
        },
        featureOverrides: {
          include: { feature: true }
        }
      }
    });
    
    if (!tenant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }
    
    // Resolve which feature codes are active for this tenant
    const features = await prisma.feature.findMany();
    const resolvedFeatures: string[] = [];
    
    for (const f of features) {
      const allowed = await SubscriptionService.hasFeature(id, f.code);
      if (allowed) {
        resolvedFeatures.push(f.code);
      }
    }
    
    res.json({
      plan: tenant.currentPlan,
      overrides: tenant.featureOverrides,
      resolvedFeatures
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error resolving restaurant features', error: error.message });
  }
});

// POST /api/restaurants/:id/upgrade - Upgrade/downgrade restaurant plan (self-serve or Super Admin)
router.post('/restaurants/:id/upgrade', authenticate, async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { planId } = req.body;
    
    if (!planId) {
      res.status(400).json({ message: 'planId is required.' });
      return;
    }

    if (req.user.role !== 'SUPER_ADMIN' && req.user.tenantId !== id) {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: { currentPlanId: true }
    });
    
    if (!tenant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }
    
    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });
    
    if (!newPlan) {
      res.status(404).json({ message: 'Selected plan not found' });
      return;
    }
    
    const fromPlanId = tenant.currentPlanId;
    
    await prisma.$transaction([
      prisma.tenant.update({
        where: { id },
        data: { currentPlanId: planId }
      }),
      prisma.auditLog.create({
        data: {
          businessId: id,
          userId: req.user.id,
          action: 'RESTAURANT_UPGRADED',
          performedBy: req.user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
          metadata: { fromPlanId, toPlanId: planId, planName: newPlan.name }
        }
      })
    ]);
    
    res.json({ message: 'Restaurant plan updated successfully', plan: newPlan });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error upgrading plan', error: error.message });
  }
});

// ==========================================
// 4. FEATURE OVERRIDES
// ==========================================

// POST /api/feature-overrides - Create/update feature override (Super Admin only)
router.post('/feature-overrides', isSuperAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { restaurantId, featureId, enabled, expiresAt, notes } = req.body;
    
    if (!restaurantId || !featureId || enabled === undefined) {
      res.status(400).json({ message: 'restaurantId, featureId, and enabled status are required.' });
      return;
    }

    const override = await prisma.$transaction(async (tx) => {
      const feat = await tx.feature.findUnique({ where: { id: featureId } });
      if (!feat) {
        throw new Error('Feature not found');
      }
      
      // Delete existing overrides for this restaurant + feature to avoid duplicates
      await tx.featureOverride.deleteMany({
        where: { restaurantId, featureId }
      });

      const newOverride = await tx.featureOverride.create({
        data: {
          restaurantId,
          featureId,
          enabled: enabled === true,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          notes
        },
        include: { feature: true }
      });
      
      await tx.auditLog.create({
        data: {
          businessId: restaurantId,
          action: 'FEATURE_OVERRIDE_CREATED',
          performedBy: 'SUPER_ADMIN',
          metadata: { featureCode: feat.code, enabled, expiresAt, notes }
        }
      });
      
      return newOverride;
    });
    
    res.status(201).json(override);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error creating feature override', error: error.message });
  }
});

// DELETE /api/feature-overrides/:id - Remove feature override (Super Admin only)
router.delete('/feature-overrides/:id', isSuperAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    // Find the override first (outside transaction to get featureId)
    const override = await prisma.featureOverride.findUnique({
      where: { id },
      include: { feature: true }
    });

    if (!override) {
      res.status(404).json({ message: 'Feature override not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.featureOverride.delete({ where: { id } });
      
      await tx.auditLog.create({
        data: {
          businessId: override.restaurantId,
          action: 'FEATURE_OVERRIDE_DELETED',
          performedBy: 'SUPER_ADMIN',
          metadata: { featureCode: override.featureId }
        }
      });
    });
    
    res.json({ message: 'Feature override deleted successfully', override });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error deleting feature override', error: error.message });
  }
});

// ==========================================
// 5. SUBSCRIPTION COMPARE MATRIX
// ==========================================

// GET /api/subscription/compare - Get plan feature matrix
router.get('/subscription/compare', async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      include: {
        planFeatures: {
          include: { feature: true }
        }
      },
      orderBy: { monthlyPrice: 'asc' }
    });
    
    const features = await prisma.feature.findMany({
      orderBy: { name: 'asc' }
    });
    
    // Create comparison matrix
    const matrix = features.map(f => {
      const row: Record<string, any> = {
        featureCode: f.code,
        featureName: f.name,
        description: f.description
      };
      
      for (const p of plans) {
        const hasFeat = p.planFeatures.some(pf => pf.feature.code === f.code);
        row[p.name] = hasFeat;
      }
      
      return row;
    });
    
    res.json({ plans, features, matrix });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching subscription comparison', error: error.message });
  }
});

export default router;
