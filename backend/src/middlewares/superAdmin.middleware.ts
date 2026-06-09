import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface SuperAdminRequest extends Request {
  user?: any;
}

export const isSuperAdmin = (req: SuperAdminRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    if (decoded.role !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Access denied. Super Admin privileges required.' });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
