import { Router } from 'express';
import { getMarketplaceProducts, createPurchaseRequest, getMyRequests } from '../controllers/marketplace.controller';

const router = Router();

// These routes will be protected by tenant auth middleware since they will be mounted in index.ts after resolveTenant
router.get('/products', getMarketplaceProducts);
router.post('/requests', createPurchaseRequest);
router.get('/requests', getMyRequests);

export default router;
