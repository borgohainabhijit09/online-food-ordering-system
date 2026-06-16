import { Router } from 'express';
import multer from 'multer';
import { getProducts, createProduct, updateProduct, deleteProduct, toggleProductStatus, bulkUploadProducts, bulkDeleteProducts } from '../controllers/product.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getProducts);
router.post('/bulk-delete', authenticate, requireAdmin, bulkDeleteProducts);
router.post('/bulk-upload', authenticate, requireAdmin, upload.single('file'), bulkUploadProducts);
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.patch('/:id/status', authenticate, requireAdmin, toggleProductStatus);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

export default router;
