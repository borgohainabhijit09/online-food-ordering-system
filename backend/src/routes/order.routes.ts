import { Router } from 'express';
import { getOrders, updateOrderStatus, createOrder, getOrderById, getNewOrdersCount } from '../controllers/order.controller';

const router = Router();

router.get('/', getOrders);
router.get('/new-count', getNewOrdersCount);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);

export default router;
