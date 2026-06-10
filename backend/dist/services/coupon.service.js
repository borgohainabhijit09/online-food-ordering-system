"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCouponDiscount = exports.validateCoupon = void 0;
const prisma_1 = __importDefault(require("./prisma"));
const validateCoupon = async (payload) => {
    const { tenantId, couponCode, phone, cartTotal } = payload;
    // 1. Fetch Coupon
    const coupon = await prisma_1.default.coupon.findFirst({
        where: {
            tenantId,
            code: couponCode.toUpperCase(),
        },
    });
    if (!coupon) {
        return { valid: false, message: 'Invalid coupon code.' };
    }
    // 2. Check Active Status
    if (!coupon.active) {
        return { valid: false, message: 'This coupon is no longer active.' };
    }
    // 3. Date Validation
    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
        return { valid: false, message: 'This coupon is not yet valid.' };
    }
    if (coupon.expiryDate && now > coupon.expiryDate) {
        return { valid: false, message: 'This coupon has expired.' };
    }
    // 4. Minimum Order Value
    if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
        return { valid: false, message: `Minimum order value is ₹${coupon.minOrderValue}` };
    }
    // 5. First Order Only Validation
    if (coupon.firstOrderOnly) {
        if (!phone) {
            return { valid: false, message: 'Phone number is required to verify first order eligibility.' };
        }
        const previousOrder = await prisma_1.default.order.findFirst({
            where: {
                tenantId,
                phone,
            },
        });
        if (previousOrder) {
            return { valid: false, message: 'Coupon valid only for your first order.' };
        }
    }
    // 6. Calculate Discount
    const { discountAmount, finalAmount } = (0, exports.calculateCouponDiscount)(coupon, cartTotal);
    return {
        valid: true,
        discountAmount,
        finalAmount,
        coupon: {
            id: coupon.id,
            code: coupon.code,
            type: coupon.discountType,
        }
    };
};
exports.validateCoupon = validateCoupon;
const calculateCouponDiscount = (coupon, cartTotal) => {
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = cartTotal * (coupon.discountValue / 100);
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
        }
    }
    else if (coupon.discountType === 'FLAT') {
        discountAmount = coupon.discountValue;
    }
    // Prevent Negative Totals
    let finalAmount = cartTotal - discountAmount;
    if (finalAmount < 0) {
        discountAmount = cartTotal; // The max discount they can get is the cart total
        finalAmount = 0;
    }
    return {
        discountAmount,
        finalAmount
    };
};
exports.calculateCouponDiscount = calculateCouponDiscount;
//# sourceMappingURL=coupon.service.js.map