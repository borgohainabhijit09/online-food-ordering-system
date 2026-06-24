import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config({ override: true });

import cors from 'cors';
import { resolveTenant } from './middlewares/tenant.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { queryMonitor } from './middlewares/queryMonitor';

import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import productRoutes from './routes/product.routes';
import addonRoutes from './routes/addon.routes';
import orderRoutes from './routes/order.routes';
import settingsRoutes from './routes/settings.routes';
import dashboardRoutes from './routes/dashboard.routes';
import couponRoutes from './routes/coupon.routes';
import customerRoutes from './routes/customer.routes';
import tableRoutes from './routes/table.routes';
import supportRoutes from './routes/support.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import subscriptionRoutes from './routes/subscription.routes';
import paymentRoutes from './routes/payment.routes';
import superadminRoutes from './routes/superadmin.routes';
import biRoutes from './routes/bi.routes';
import leadsRoutes from './routes/leads.routes';

import { initBillingCron } from './cron/billing.cron';
import { disconnectPrisma } from './services/prisma';

const app: Express = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(queryMonitor);

app.get('/', (req: Request, res: Response) => {
  res.send('Smart Restaurant Ordering API is running');
});

// Super-admin routes (no tenant middleware)
app.use('/api/auth', authRoutes);
app.use('/api/super-admin/bi', biRoutes);
app.use('/api/super-admin/leads', leadsRoutes);
app.use('/api/super-admin', superadminRoutes);
app.use('/api', subscriptionRoutes);

// Apply tenant resolution for all restaurant-scoped routes
app.use(resolveTenant);

app.use('/api/payments', paymentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/addons', addonRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/marketplace', marketplaceRoutes);

// Global error handler — must be last
app.use(errorHandler);

// Initialize background jobs
initBillingCron();

const server = app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

// Graceful shutdown helper — closes the HTTP server cleanly and releases
// the pg connection pool before exiting. This prevents zombie connections
// from accumulating on the Supabase pooler during nodemon restarts.
const gracefulShutdown = async (signal: string) => {
  console.log(`[server]: Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('[server]: HTTP server closed.');
    await disconnectPrisma();
    console.log('[server]: Graceful shutdown completed.');
    process.exit(0);
  });

  // Force exit after 5 seconds if server.close hangs
  setTimeout(async () => {
    console.error('[server]: Forcefully shutting down after timeout.');
    await disconnectPrisma();
    process.exit(1);
  }, 5000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// nodemon sends SIGUSR2 on restart — clean up connections before restarting
process.once('SIGUSR2', async () => {
  console.log('[server]: Received SIGUSR2 (nodemon restart). Cleaning up database connections...');
  server.close(async () => {
    await disconnectPrisma();
    console.log('[server]: Cleanup complete. Proceeding with nodemon restart.');
    process.kill(process.pid, 'SIGUSR2');
  });

  setTimeout(async () => {
    console.error('[server]: Forceful cleanup during nodemon restart.');
    await disconnectPrisma();
    process.kill(process.pid, 'SIGUSR2');
  }, 4000);
});
