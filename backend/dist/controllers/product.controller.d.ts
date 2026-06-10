import { Request, Response, NextFunction } from 'express';
interface TenantReq extends Request {
    tenantId?: string;
}
export declare const getProducts: (req: TenantReq, res: Response, next: NextFunction) => Promise<void>;
export declare const createProduct: (req: TenantReq, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getProductById: (req: TenantReq, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateProduct: (req: TenantReq, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteProduct: (req: TenantReq, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=product.controller.d.ts.map