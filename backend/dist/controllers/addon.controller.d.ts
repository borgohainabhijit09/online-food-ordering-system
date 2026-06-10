import { Request, Response, NextFunction } from 'express';
interface TenantReq extends Request {
    tenantId?: string;
}
export declare const getAddons: (req: TenantReq, res: Response, next: NextFunction) => Promise<void>;
export declare const createAddon: (req: TenantReq, res: Response, next: NextFunction) => Promise<void>;
export declare const updateAddon: (req: TenantReq, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteAddon: (req: TenantReq, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=addon.controller.d.ts.map