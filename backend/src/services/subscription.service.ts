import prisma from './prisma';

/**
 * Service to manage subscription and feature gating logic
 */
export class SubscriptionService {
  /**
   * Resolves whether a restaurant (tenant) has access to a specific feature.
   *
   * Logic:
   * 1. Check Feature Overrides first (highest priority — super admin can always override).
   *    An override is active if expiresAt is null or in the future.
   * 2. If tenant is in TESTING or TRIAL_ACTIVE phase → full access to all features.
   * 3. If no active override, check the Tenant's assigned Subscription Plan.
   * 4. Query PlanFeature to verify if the feature is assigned to the plan.
   * 5. Return true / false.
   *
   * @param tenantId The ID of the tenant (restaurant)
   * @param featureCode The unique code of the feature (e.g. 'INVENTORY')
   */
  static async hasFeature(tenantId: string, featureCode: string): Promise<boolean> {
    try {
      if (!tenantId) return false;

      // 1. Check Feature Overrides (always takes priority)
      const now = new Date();
      const activeOverride = await prisma.featureOverride.findFirst({
        where: {
          restaurantId: tenantId,
          feature: {
            code: featureCode,
          },
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: now } }
          ]
        }
      });

      if (activeOverride !== null) {
        return activeOverride.enabled;
      }

      // 2. Check trial status — full access during TESTING and TRIAL_ACTIVE
      const tenantForTrial = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { trialStatus: true }
      });

      if (
        tenantForTrial?.trialStatus === 'TESTING' ||
        tenantForTrial?.trialStatus === 'TRIAL_ACTIVE'
      ) {
        return true;
      }

      // 3. Check Assigned Plan (for TRIAL_ENDED / SUBSCRIBED tenants)
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          currentPlanId: true,
          currentPlan: {
            select: {
              isActive: true,
            }
          }
        }
      });

      if (!tenant || !tenant.currentPlanId || tenant.currentPlan?.isActive === false) {
        return false;
      }

      // 4. Check Plan Features
      const planFeature = await prisma.planFeature.findFirst({
        where: {
          planId: tenant.currentPlanId,
          feature: {
            code: featureCode,
          }
        }
      });

      return planFeature !== null;
    } catch (error) {
      console.error(`Error resolving feature ${featureCode} for tenant ${tenantId}:`, error);
      return false;
    }
  }
}

