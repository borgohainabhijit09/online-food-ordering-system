import { Router } from 'express';
import { getBillingSummary, closeRegister } from '../controllers/billing.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/summary', getBillingSummary);
router.post('/closure', closeRegister);

export default router;
