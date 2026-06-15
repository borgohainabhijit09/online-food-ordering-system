import { Router } from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct, getRequests, updateRequestStatus } from '../controllers/superadmin.marketplace.controller';

const router = Router();

// Products
router.get('/products', getProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Requests
router.get('/requests', getRequests);
router.patch('/requests/:id/status', updateRequestStatus);

export default router;
