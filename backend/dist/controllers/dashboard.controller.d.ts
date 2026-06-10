import { Request, Response, NextFunction } from 'express';
interface TenantReq extends Request {
    tenantId?: string;
}
export declare const getDashboardStats: (req: TenantReq, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=dashboard.controller.d.ts.map