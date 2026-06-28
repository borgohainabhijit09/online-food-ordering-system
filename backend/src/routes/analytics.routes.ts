import { Router } from 'express';
import { getAdvancedAnalytics } from '../controllers/analytics.controller';

const router = Router();

router.get('/', getAdvancedAnalytics);

export default router;
