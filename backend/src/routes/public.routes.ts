import { Router } from 'express';
import {
  getPublicRestaurants,
  getPublicRestaurantBySlug,
  trackPublicOrder,
  getPublicOrdersByPhone,
  getPublicCustomerProfile,
  updatePublicCustomerProfile,
} from '../controllers/public.controller';

const router = Router();

router.get('/restaurants', getPublicRestaurants);
router.get('/restaurants/:slug', getPublicRestaurantBySlug);
router.get('/orders/track/:id', trackPublicOrder);
router.get('/orders/history', getPublicOrdersByPhone);
router.get('/customer/:phone', getPublicCustomerProfile);
router.post('/customer/profile', updatePublicCustomerProfile);

export default router;
