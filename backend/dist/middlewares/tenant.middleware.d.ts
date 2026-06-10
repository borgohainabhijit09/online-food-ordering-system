import { Request, Response, NextFunction } from 'express';
export interface TenantRequest extends Request {
    tenantId?: string;
    user?: any;
}
export declare const resolveTenant: (req: TenantRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=tenant.middleware.d.ts.map