"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const coupon_controller_1 = require("../controllers/coupon.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// PUBLIC - Needs tenantId and payload
router.get('/public', coupon_controller_1.getPublicCoupons);
router.post('/validate', coupon_controller_1.validateCouponApi);
// ADMIN - Needs requireAdmin
router.get('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, coupon_controller_1.getCoupons);
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, coupon_controller_1.createCoupon);
router.patch('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, coupon_controller_1.updateCoupon);
router.delete('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, coupon_controller_1.deleteCoupon);
exports.default = router;
//# sourceMappingURL=coupon.routes.js.map