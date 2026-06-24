import prisma from './prisma';

/**
 * Service to manage subscription and feature gating logic
 */
export class SubscriptionService {
  /**
   * Resolves whether a restaurant (tenant) has access to a specific feature.
   *
   * Logic:
   * 1. Check Feature Overrides first.
   *    An override is active if expiresAt is null or in the future.
   *    If an active override is found, return its 'enabled' value immediately.
   * 2. If no active override, check the Tenant's assigned Subscription Plan.
   * 3. Query PlanFeature to verify if the feature is assigned to the plan.
   * 4. Return true / false.
   *
   * @param tenantId The ID of the tenant (restaurant)
   * @param featureCode The unique code of the feature (e.g. 'INVENTORY')
   */
  static async hasFeature(tenantId: string, featureCode: string): Promise<boolean> {
    try {
      if (!tenantId) return false;

      // 1. Check Feature Overrides
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

      // 2. Check Assigned Plan
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

      // 3. Check Plan Features
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
