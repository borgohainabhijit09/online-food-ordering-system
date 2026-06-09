import { Router } from 'express';
import { getAddons, createAddon, updateAddon, deleteAddon } from '../controllers/addon.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getAddons);
router.post('/', authenticate, requireAdmin, createAddon);
router.put('/:id', authenticate, requireAdmin, updateAddon);
router.delete('/:id', authenticate, requireAdmin, deleteAddon);

export default router;
