"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPastDue = exports.processInvoices = exports.initBillingCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = __importDefault(require("../services/prisma"));
// Run every day at midnight
const initBillingCron = () => {
    node_cron_1.default.schedule('0 0 * * *', async () => {
        console.log('Running daily billing cron job...');
        await (0, exports.processInvoices)();
        await (0, exports.checkPastDue)();
    });
    console.log('Billing CRON initialized.');
};
exports.initBillingCron = initBillingCron;
const processInvoices = async () => {
    try {
        const now = new Date();
        // Find subscriptions that need to be billed today or earlier
        const dueSubscriptions = await prisma_1.default.tenantSubscription.findMany({
            where: {
                nextBillingDate: {
                    lte: now
                },
                status: 'ACTIVE'
            },
            include: {
                package: true
            }
        });
        console.log(`Found ${dueSubscriptions.length} subscriptions due for billing.`);
        for (const sub of dueSubscriptions) {
            await prisma_1.default.$transaction(async (tx) => {
                // Create an invoice/billing record
                await tx.billingRecord.create({
                    data: {
                        tenantId: sub.tenantId,
                        amount: sub.package.price,
                        status: 'PENDING'
                    }
                });
                // Push next billing date forward by 1 month
                const nextBilling = new Date(sub.nextBillingDate);
                nextBilling.setMonth(nextBilling.getMonth() + 1);
                // Update the subscription
                await tx.tenantSubscription.update({
                    where: { id: sub.id },
                    data: { nextBillingDate: nextBilling }
                });
                console.log(`Generated invoice for tenant ${sub.tenantId} for ₹${sub.package.price}`);
            });
        }
    }
    catch (err) {
        console.error('Error processing invoices:', err);
    }
};
exports.processInvoices = processInvoices;
const checkPastDue = async () => {
    try {
        const gracePeriodEnd = new Date();
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() - 7);
        // Find all pending billing records older than 7 days
        const pastDueRecords = await prisma_1.default.billingRecord.findMany({
            where: {
                status: 'PENDING',
                date: {
                    lte: gracePeriodEnd
                }
            }
        });
        console.log(`Found ${pastDueRecords.length} pending invoices older than 7 days.`);
        for (const record of pastDueRecords) {
            await prisma_1.default.tenantSubscription.updateMany({
                where: {
                    tenantId: record.tenantId,
                    status: 'ACTIVE'
                },
                data: {
                    status: 'PAST_DUE'
                }
            });
            console.log(`Marked subscription for tenant ${record.tenantId} as PAST_DUE`);
        }
    }
    catch (err) {
        console.error('Error checking past due accounts:', err);
    }
};
exports.checkPastDue = checkPastDue;
//# sourceMappingURL=billing.cron.js.map