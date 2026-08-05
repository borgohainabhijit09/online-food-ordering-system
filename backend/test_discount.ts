import { calculateCouponDiscount } from './src/services/coupon.service';
console.log(calculateCouponDiscount({ discountType: 'FLAT', discountValue: 50 }, 1000, 0));
