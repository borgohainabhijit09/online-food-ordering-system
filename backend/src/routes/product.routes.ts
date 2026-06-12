import { Router } from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct, toggleProductStatus } from '../controllers/product.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getProducts);
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.patch('/:id/status', authenticate, requireAdmin, toggleProductStatus);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

export default router;
