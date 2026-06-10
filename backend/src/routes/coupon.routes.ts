import { Router } from 'express';
import {
  validateCouponApi,
  getCoupons,
  getPublicCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} from '../controllers/coupon.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// PUBLIC - Needs tenantId and payload
router.get('/public', getPublicCoupons);
router.post('/validate', validateCouponApi);

// ADMIN - Needs requireAdmin
router.get('/', authenticate, requireAdmin, getCoupons);
router.post('/', authenticate, requireAdmin, createCoupon);
router.patch('/:id', authenticate, requireAdmin, updateCoupon);
router.delete('/:id', authenticate, requireAdmin, deleteCoupon);

export default router;
