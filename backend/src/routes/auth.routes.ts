import { Router } from 'express';
import { login, registerTenant, selectStore, getStores, changePassword, createLeadFromDemoRequest } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', registerTenant);
router.post('/select-store', selectStore);
router.get('/me/stores', authenticate, getStores);
router.post('/change-password', authenticate, changePassword);
router.post('/demo-request', createLeadFromDemoRequest);

export default router;

