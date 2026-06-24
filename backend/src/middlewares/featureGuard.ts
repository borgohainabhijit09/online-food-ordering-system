import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscription.service';

interface GatedRequest extends Request {
  tenantId?: string;
  user?: any;
}

/**
 * Express middleware to restrict route access based on active subscription features
 * @param featureCode The feature code that must be enabled (e.g. 'INVENTORY')
 */
export const requireFeature = (featureCode: string) => {
  return async (req: GatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        res.status(400).json({ 
          message: 'Tenant context is required. Ensure resolveTenant middleware is run before requireFeature.' 
        });
        return;
      }

      const isAllowed = await SubscriptionService.hasFeature(tenantId, featureCode);

      if (!isAllowed) {
        res.status(403).json({ 
          error: 'Feature Not Available',
          message: `The feature '${featureCode}' is not active under your current subscription plan or overrides.`,
          featureCode 
        });
        return;
      }

      next();
    } catch (error) {
      console.error(`Error in requireFeature middleware for ${featureCode}:`, error);
      res.status(500).json({ message: 'Internal server error validating features' });
    }
  };
};
