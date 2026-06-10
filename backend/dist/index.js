"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const addon_routes_1 = __importDefault(require("./routes/addon.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const app = (0, express_1.default)();
const port = process.env.PORT || 8000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/', (req, res) => {
    res.send('Smart Restaurant Ordering API is running');
});
const tenant_middleware_1 = require("./middlewares/tenant.middleware");
const superadmin_routes_1 = __importDefault(require("./routes/superadmin.routes"));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/super-admin', superadmin_routes_1.default);
// Apply Tenant Resolution for all business routes
app.use(tenant_middleware_1.resolveTenant);
app.use('/api/categories', category_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/addons', addon_routes_1.default);
app.use('/api/orders', order_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
// Error Handling Middleware
app.use(error_middleware_1.errorHandler);
const billing_cron_1 = require("./cron/billing.cron");
// Initialize background jobs
(0, billing_cron_1.initBillingCron)();
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map