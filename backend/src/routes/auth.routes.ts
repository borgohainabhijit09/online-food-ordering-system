import { Router } from 'express';
import { login, registerTenant, selectStore, getStores } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', registerTenant);
router.post('/select-store', selectStore);
router.get('/me/stores', authenticate, getStores);

export default router;
