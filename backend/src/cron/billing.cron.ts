import cron from 'node-cron';
import prisma from '../services/prisma';

// Run every day at midnight
export const initBillingCron = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily billing cron job...');
    await processInvoices();
    await checkPastDue();
  });
  
  console.log('Billing CRON initialized.');
};

export const processInvoices = async () => {
  try {
    const now = new Date();

    // Find subscriptions that need to be billed today or earlier
    const dueSubscriptions = await prisma.tenantSubscription.findMany({
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
      await prisma.$transaction(async (tx) => {
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
  } catch (err) {
    console.error('Error processing invoices:', err);
  }
};

export const checkPastDue = async () => {
  try {
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() - 7);

    // Find all pending billing records older than 7 days
    const pastDueRecords = await prisma.billingRecord.findMany({
      where: {
        status: 'PENDING',
        date: {
          lte: gracePeriodEnd
        }
      }
    });

    console.log(`Found ${pastDueRecords.length} pending invoices older than 7 days.`);

    for (const record of pastDueRecords) {
      await prisma.tenantSubscription.updateMany({
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
  } catch (err) {
    console.error('Error checking past due accounts:', err);
  }
};
