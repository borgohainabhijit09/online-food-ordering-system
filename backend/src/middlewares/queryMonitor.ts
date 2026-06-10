import { Request, Response, NextFunction } from 'express';

export const queryMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500) {
      console.warn(`[SLOW_REQUEST] ${req.method} ${req.originalUrl} took ${duration}ms`);
    } else {
      console.log(`[REQUEST] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });

  next();
};
