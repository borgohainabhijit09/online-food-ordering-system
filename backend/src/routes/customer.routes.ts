import { Router } from 'express';
import { getCustomers } from '../controllers/customer.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, requireAdmin, getCustomers);

export default router;
