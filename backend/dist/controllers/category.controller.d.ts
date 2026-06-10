import { Request, Response, NextFunction } from 'express';
interface TenantReq extends Request {
    tenantId?: string;
}
export declare const getCategories: (req: TenantReq, res: Response, next: NextFunction) => Promise<void>;
export declare const createCategory: (req: TenantReq, res: Response, next: NextFunction) => Promise<void>;
export declare const updateCategory: (req: TenantReq, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteCategory: (req: TenantReq, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=category.controller.d.ts.map