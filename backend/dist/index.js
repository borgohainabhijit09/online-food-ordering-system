"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ override: true });
const cors_1 = __importDefault(require("cors"));
const tenant_middleware_1 = require("./middlewares/tenant.middleware");
const error_middleware_1 = require("./middlewares/error.middleware");
const queryMonitor_1 = require("./middlewares/queryMonitor");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const addon_routes_1 = __importDefault(require("./routes/addon.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const coupon_routes_1 = __importDefault(require("./routes/coupon.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const table_routes_1 = __importDefault(require("./routes/table.routes"));
const support_routes_1 = __importDefault(require("./routes/support.routes"));
const marketplace_routes_1 = __importDefault(require("./routes/marketplace.routes"));
const subscription_routes_1 = __importDefault(require("./routes/subscription.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const superadmin_routes_1 = __importDefault(require("./routes/superadmin.routes"));
const bi_routes_1 = __importDefault(require("./routes/bi.routes"));
const leads_routes_1 = __importDefault(require("./routes/leads.routes"));
const inventory_routes_1 = __importDefault(require("./routes/inventory.routes"));
const staff_routes_1 = __importDefault(require("./routes/staff.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const billing_routes_1 = __importDefault(require("./routes/billing.routes"));
const billing_cron_1 = require("./cron/billing.cron");
const prisma_1 = require("./services/prisma");
const app = (0, express_1.default)();
const port = process.env.PORT || 8000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(queryMonitor_1.queryMonitor);
app.get('/', (req, res) => {
    res.send('Smart Restaurant Ordering API is running');
});
// Super-admin routes (no tenant middleware)
app.use('/api/auth', auth_routes_1.default);
app.use('/api/super-admin/bi', bi_routes_1.default);
app.use('/api/super-admin/leads', leads_routes_1.default);
app.use('/api/super-admin', superadmin_routes_1.default);
app.use('/api', subscription_routes_1.default);
// Apply tenant resolution for all restaurant-scoped routes
app.use(tenant_middleware_1.resolveTenant);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/categories', category_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/addons', addon_routes_1.default);
app.use('/api/orders', order_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/coupons', coupon_routes_1.default);
app.use('/api/customers', customer_routes_1.default);
app.use('/api/tables', table_routes_1.default);
app.use('/api/support', support_routes_1.default);
app.use('/api/marketplace', marketplace_routes_1.default);
app.use('/api/inventory', inventory_routes_1.default);
app.use('/api/staff', staff_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/billing', billing_routes_1.default);
// Global error handler — must be last
app.use(error_middleware_1.errorHandler);
// Initialize background jobs
(0, billing_cron_1.initBillingCron)();
const server = app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
// Graceful shutdown helper — closes the HTTP server cleanly and releases
// the pg connection pool before exiting. This prevents zombie connections
// from accumulating on the Supabase pooler during nodemon restarts.
const gracefulShutdown = async (signal) => {
    console.log(`[server]: Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
        console.log('[server]: HTTP server closed.');
        await (0, prisma_1.disconnectPrisma)();
        console.log('[server]: Graceful shutdown completed.');
        process.exit(0);
    });
    // Force exit after 5 seconds if server.close hangs
    setTimeout(async () => {
        console.error('[server]: Forcefully shutting down after timeout.');
        await (0, prisma_1.disconnectPrisma)();
        process.exit(1);
    }, 5000);
};
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
// nodemon sends SIGUSR2 on restart — clean up connections before restarting
process.once('SIGUSR2', async () => {
    console.log('[server]: Received SIGUSR2 (nodemon restart). Cleaning up database connections...');
    server.close(async () => {
        await (0, prisma_1.disconnectPrisma)();
        console.log('[server]: Cleanup complete. Proceeding with nodemon restart.');
        process.kill(process.pid, 'SIGUSR2');
    });
    setTimeout(async () => {
        console.error('[server]: Forceful cleanup during nodemon restart.');
        await (0, prisma_1.disconnectPrisma)();
        process.kill(process.pid, 'SIGUSR2');
    }, 4000);
});
//# sourceMappingURL=index.js.map