import { Router } from 'express';
import { getCustomers, getCustomerByPhone } from '../controllers/customer.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { requireFeature } from '../middlewares/featureGuard';

const router = Router();

router.use(requireFeature('CUSTOMER_CRM'));

router.get('/public/:phone', getCustomerByPhone);
router.get('/', authenticate, requireAdmin, getCustomers);

export default router;
