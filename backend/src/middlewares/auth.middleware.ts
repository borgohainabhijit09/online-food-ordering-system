import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    req.user = decoded;

    if (decoded.forcePasswordChange && !req.originalUrl.includes('/change-password') && !req.originalUrl.includes('/logout')) {
      res.status(403).json({ message: 'Password change required', forcePasswordChange: true });
      return;
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'STAFF' && req.user?.role !== 'SUPER_ADMIN') {
    res.status(403).json({ message: 'Dashboard access required' });
    return;
  }
  next();
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN') {
      next();
      return;
    }
    
    if (req.user?.role === 'STAFF') {
      const permissions = req.user?.permissions || [];
      if (permissions.includes(permission)) {
        next();
        return;
      }
    }
    
    res.status(403).json({ message: 'Insufficient permissions' });
  };
};
