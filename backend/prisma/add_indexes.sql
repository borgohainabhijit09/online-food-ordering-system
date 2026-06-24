-- ============================================================
-- RestoBuddy — Performance Indexes
-- Run ALL at once in Supabase SQL Editor (no CONCURRENTLY needed).
-- Safe at current scale — table locks are milliseconds on small data.
-- ============================================================

-- 1. Orders: Compound index on tenant + date (DESC).
--    Covers: getOrders, dashboard stats, BI health queries.
CREATE INDEX IF NOT EXISTS idx_order_tenant_created
  ON "Order"("tenantId", "createdAt" DESC);

-- 2. Orders: Status filter.
--    Covers: getNewOrdersCount, KOT page, churn queries.
CREATE INDEX IF NOT EXISTS idx_order_tenant_status
  ON "Order"("tenantId", "status");

-- 3. Orders: Compound covering index for date+status queries.
--    Covers: Dashboard orders today/week/month.
CREATE INDEX IF NOT EXISTS idx_order_tenant_status_created
  ON "Order"("tenantId", "status", "createdAt" DESC);

-- 4. Customers: Phone-based upsert on every order creation.
--    Covers: createOrder upsert (tenantId_phone unique key).
CREATE INDEX IF NOT EXISTS idx_customer_tenant_phone
  ON "Customer"("tenantId", "phone");

-- 5. Customers: Date filter for new customer counts.
--    Covers: CEO dashboard newCustomersThisMonth.
CREATE INDEX IF NOT EXISTS idx_customer_tenant_created
  ON "Customer"("tenantId", "createdAt" DESC);

-- 6. SupportTicket: Queried for unread count every 30 seconds.
--    Covers: /api/support/unread-count and super-admin version.
CREATE INDEX IF NOT EXISTS idx_support_ticket_tenant_status
  ON "SupportTicket"("tenantId", "status");

-- 7. BillingRecord: Queried in billing cron for past-due detection.
--    Covers: checkPastDue() cron.
CREATE INDEX IF NOT EXISTS idx_billing_status_date
  ON "BillingRecord"("status", "date");

-- 8. BillingRecord: Tenant-based lookup.
--    Covers: /api/super-admin/billing endpoint.
CREATE INDEX IF NOT EXISTS idx_billing_tenant
  ON "BillingRecord"("tenantId", "date" DESC);

-- 9. OrderItem: GroupBy for top products dashboard widget.
--    Covers: getTopProducts() in dashboard controller.
CREATE INDEX IF NOT EXISTS idx_orderitem_product
  ON "OrderItem"("productId");

-- 10. Tenant: Plan-based filtering for MRR calculation.
--     Covers: CEO dashboard, /api/super-admin/dashboard.
CREATE INDEX IF NOT EXISTS idx_tenant_active_plan
  ON "Tenant"("isActive", "currentPlanId");

-- 11. TenantSubscription: Status-based queries.
--     Covers: billing cron, churn risk.
CREATE INDEX IF NOT EXISTS idx_tenant_subscription_status
  ON "TenantSubscription"("tenantId", "status");

-- 12. AuditLog: Tenant-based audit log retrieval.
--     Covers: /api/super-admin/restaurants/:id/audit-logs.
CREATE INDEX IF NOT EXISTS idx_auditlog_tenant_created
  ON "AuditLog"("businessId", "createdAt" DESC);

-- 13. Product: Active product filter.
--     Covers: storefront product listing.
CREATE INDEX IF NOT EXISTS idx_product_tenant_active
  ON "Product"("tenantId", "isActive");

-- 14. Coupon: Code-based lookup on every order with a coupon.
--     Covers: validateCoupon() in coupon service.
CREATE INDEX IF NOT EXISTS idx_coupon_tenant_code
  ON "Coupon"("tenantId", "code");

-- ============================================================
-- Run indexes 15 & 16 ONLY after the LoyaltyTransaction table
-- has been created via the Supabase SQL Editor migration.
-- ============================================================

-- 15. LoyaltyTransaction: Customer point history.
-- CREATE INDEX IF NOT EXISTS idx_loyalty_customer_created
--   ON "LoyaltyTransaction"("customerId", "createdAt" DESC);

-- 16. LoyaltyTransaction: Tenant-level reporting.
-- CREATE INDEX IF NOT EXISTS idx_loyalty_tenant_type
--   ON "LoyaltyTransaction"("tenantId", "type");

-- ============================================================
-- VERIFY: Check which indexes exist on a table
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'Order';
-- ============================================================
