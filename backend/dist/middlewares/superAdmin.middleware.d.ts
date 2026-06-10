import { Request, Response, NextFunction } from 'express';
export interface SuperAdminRequest extends Request {
    user?: any;
}
export declare const isSuperAdmin: (req: SuperAdminRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=superAdmin.middleware.d.ts.map