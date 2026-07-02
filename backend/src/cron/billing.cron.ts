import cron from 'node-cron';
import prisma from '../services/prisma';

// Run every day at midnight
export const initBillingCron = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily billing cron job...');
    await processInvoices();
    await checkPastDue();
    await checkTrialExpiry();
  });
  
  console.log('Billing CRON initialized.');
};

export const processInvoices = async () => {
  try {
    const now = new Date();

    // Find subscriptions that need to be billed today or earlier
    const dueSubscriptions = await prisma.tenantSubscription.findMany({
      where: {
        nextBillingDate: { lte: now },
        status: 'ACTIVE'
      },
      include: { package: true }
    });

    if (dueSubscriptions.length === 0) {
      console.log('No subscriptions due for billing today.');
      return;
    }

    console.log(`Found ${dueSubscriptions.length} subscriptions due for billing.`);

    // OPTIMIZED: Single transaction for all billing records instead of N separate transactions
    await prisma.$transaction(async (tx) => {
      // Create all billing records in one createMany call
      await tx.billingRecord.createMany({
        data: dueSubscriptions.map(sub => ({
          tenantId: sub.tenantId,
          amount: sub.package.price,
          status: 'PENDING'
        }))
      });

      // Update each subscription's next billing date
      // Note: Prisma doesn't support updateMany with different values, so we use individual updates
      // inside the same transaction — one DB round-trip for the connection, N for the statements
      for (const sub of dueSubscriptions) {
        const nextBilling = new Date(sub.nextBillingDate);
        nextBilling.setMonth(nextBilling.getMonth() + 1);

        await tx.tenantSubscription.update({
          where: { id: sub.id },
          data: { nextBillingDate: nextBilling }
        });
      }
    });

    console.log(`Billing batch complete: created ${dueSubscriptions.length} invoices.`);
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
        date: { lte: gracePeriodEnd }
      },
      select: { tenantId: true }
    });

    if (pastDueRecords.length === 0) return;

    const tenantIds = [...new Set(pastDueRecords.map(r => r.tenantId))];
    console.log(`Found ${tenantIds.length} tenants with overdue invoices. Marking PAST_DUE.`);

    // OPTIMIZED: Single updateMany instead of N individual updates
    await prisma.tenantSubscription.updateMany({
      where: {
        tenantId: { in: tenantIds },
        status: 'ACTIVE'
      },
      data: { status: 'PAST_DUE' }
    });

    console.log(`Marked ${tenantIds.length} subscriptions as PAST_DUE.`);
  } catch (err) {
    console.error('Error checking past due accounts:', err);
  }
};

export const checkTrialExpiry = async () => {
  try {
    const now = new Date();

    // Find all TRIAL_ACTIVE tenants whose trial has ended
    const expiredTrials = await prisma.tenant.findMany({
      where: {
        trialStatus: 'TRIAL_ACTIVE',
        trialEndDate: { lte: now }
      },
      include: { currentPlan: true }
    });

    if (expiredTrials.length === 0) return;

    console.log(`[Trial Cron] Found ${expiredTrials.length} expired trials. Generating invoices and marking TRIAL_ENDED.`);

    // Find cheapest plan as fallback
    const allPlans = await prisma.subscriptionPlan.findMany({
      orderBy: { monthlyPrice: 'asc' }
    });
    const cheapestPlan = allPlans.length > 0 ? allPlans[0] : null;

    await prisma.$transaction(async (tx) => {
      for (const tenant of expiredTrials) {
        let planId = tenant.currentPlanId;
        let amount = tenant.currentPlan?.monthlyPrice || 0;

        if (!planId && cheapestPlan) {
          planId = cheapestPlan.id;
          amount = cheapestPlan.monthlyPrice;
        }

        // 1. Mark as TRIAL_ENDED and update plan if it was missing
        await tx.tenant.update({
          where: { id: tenant.id },
          data: { 
            trialStatus: 'TRIAL_ENDED',
            ...( !tenant.currentPlanId && planId ? { currentPlanId: planId } : {} )
          }
        });

        // 2. Generate Invoice (BillingRecord)
        if (planId) {
          await tx.billingRecord.create({
            data: {
              tenantId: tenant.id,
              planId: planId,
              amount: amount,
              status: 'PENDING'
            }
          });
        }

        // 3. Write audit log
        await tx.auditLog.create({
          data: {
            businessId: tenant.id,
            action: 'TRIAL_EXPIRED',
            performedBy: 'SYSTEM',
            metadata: { businessName: tenant.businessName, expiredAt: now.toISOString(), invoiceGeneratedForPlan: planId }
          }
        });
      }
    });

    console.log(`[Trial Cron] Marked ${expiredTrials.length} tenants as TRIAL_ENDED and generated invoices.`);
  } catch (err) {
    console.error('[Trial Cron] Error checking trial expiry:', err);
  }
};
