import { Router } from 'express';
import { getCustomers, getCustomerByPhone } from '../controllers/customer.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/public/:phone', getCustomerByPhone);
router.get('/', authenticate, requireAdmin, getCustomers);

export default router;
