export interface ValidateCouponPayload {
    tenantId: string;
    couponCode: string;
    phone?: string;
    cartTotal: number;
    discountableTotal?: number;
}
export declare const validateCoupon: (payload: ValidateCouponPayload) => Promise<{
    valid: boolean;
    message: string;
    discountAmount?: undefined;
    finalAmount?: undefined;
    coupon?: undefined;
} | {
    valid: boolean;
    discountAmount: number;
    finalAmount: number;
    coupon: {
        id: string;
        code: string;
        type: import("@prisma/client").$Enums.DiscountType;
    };
    message?: undefined;
}>;
export declare const calculateCouponDiscount: (coupon: any, cartTotal: number, discountableTotal?: number) => {
    discountAmount: number;
    finalAmount: number;
};
//# sourceMappingURL=coupon.service.d.ts.map