import { Request, Response, NextFunction } from 'express';
interface TenantReq extends Request {
    tenantId?: string;
}
export declare const getSettings: (req: TenantReq, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateSettings: (req: TenantReq, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=settings.controller.d.ts.map