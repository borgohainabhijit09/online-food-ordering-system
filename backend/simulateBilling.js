"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma_1 = __importDefault(require("./src/services/prisma"));
const billing_cron_1 = require("./src/cron/billing.cron");
async function simulate() {
    console.log('--- Simulating Billing ---');
    // 1. Ensure at least one tenant has an active subscription
    const tenant = await prisma_1.default.tenant.findFirst();
    if (!tenant) {
        console.log('No tenants found, please register a business first.');
        return;
    }
    const pkg = await prisma_1.default.subscriptionPackage.findFirst();
    if (!pkg) {
        console.log('No packages found.');
        return;
    }
    let sub = await prisma_1.default.tenantSubscription.findUnique({ where: { tenantId: tenant.id } });
    if (!sub) {
        sub = await prisma_1.default.tenantSubscription.create({
            data: {
                tenantId: tenant.id,
                packageId: pkg.id,
                nextBillingDate: new Date(),
                status: 'ACTIVE'
            }
        });
    }
    // 2. Move all subscription billing dates to yesterday to trigger the cron logic
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await prisma_1.default.tenantSubscription.updateMany({
        data: { nextBillingDate: yesterday, status: 'ACTIVE' }
    });
    console.log('Set all nextBillingDates to yesterday.');
    // 3. Process Invoices (This generates PENDING invoices via our Cron function)
    await (0, billing_cron_1.processInvoices)();
    // 4. Mark one invoice as 8 days old to test PAST_DUE logic
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    const record = await prisma_1.default.billingRecord.findFirst({ where: { status: 'PENDING' } });
    if (record) {
        await prisma_1.default.billingRecord.update({
            where: { id: record.id },
            data: { date: eightDaysAgo }
        });
        console.log(`Modified invoice ${record.id.substring(0, 8)} to be 8 days old.`);
    }
    // 5. Check Past Due
    await (0, billing_cron_1.checkPastDue)();
    // 6. Create some dummy COMPLETED invoices for revenue metric
    await prisma_1.default.billingRecord.create({
        data: {
            tenantId: tenant.id,
            amount: pkg.price,
            status: 'COMPLETED',
            date: new Date()
        }
    });
    console.log('Generated a dummy COMPLETED invoice to demonstrate the Revenue metric.');
    console.log('--- Simulation Complete ---');
}
simulate().catch(console.error).finally(() => prisma_1.default.$disconnect());
//# sourceMappingURL=simulateBilling.js.map