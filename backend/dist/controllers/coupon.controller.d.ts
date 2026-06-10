import { Request, Response, NextFunction } from 'express';
interface TenantReq extends Request {
    tenantId?: string;
}
export declare const validateCouponApi: (req: TenantReq, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPublicCoupons: (req: TenantReq, res: Response, next: NextFunction) => Promise<void>;
export declare const getCoupons: (req: TenantReq, res: Response, next: NextFunction) => Promise<void>;
export declare const createCoupon: (req: TenantReq, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateCoupon: (req: TenantReq, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteCoupon: (req: TenantReq, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=coupon.controller.d.ts.map