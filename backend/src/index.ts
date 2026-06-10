import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';

import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import productRoutes from './routes/product.routes';
import addonRoutes from './routes/addon.routes';
import orderRoutes from './routes/order.routes';
import settingsRoutes from './routes/settings.routes';
import dashboardRoutes from './routes/dashboard.routes';
import couponRoutes from './routes/coupon.routes';
import { errorHandler } from './middlewares/error.middleware';
const app: Express = express();
const port = process.env.PORT || 8000;

import { queryMonitor } from './middlewares/queryMonitor';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(queryMonitor);

app.get('/', (req: Request, res: Response) => {
  res.send('Smart Restaurant Ordering API is running');
});

import { resolveTenant } from './middlewares/tenant.middleware';

import superadminRoutes from './routes/superadmin.routes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superadminRoutes);

// Apply Tenant Resolution for all business routes
app.use(resolveTenant);

app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/addons', addonRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/coupons', couponRoutes);

// Error Handling Middleware
app.use(errorHandler);

import { initBillingCron } from './cron/billing.cron';

// Initialize background jobs
initBillingCron();

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

// Trigger nodemon restart

// Trigger nodemon restart 2
