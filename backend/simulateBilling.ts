import dotenv from 'dotenv';
dotenv.config();
import prisma from './src/services/prisma';
import { processInvoices, checkPastDue } from './src/cron/billing.cron';

async function simulate() {
  console.log('--- Simulating Billing ---');
  
  // 1. Ensure at least one tenant has an active subscription
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.log('No tenants found, please register a business first.');
    return;
  }

  const pkg = await prisma.subscriptionPackage.findFirst();
  if (!pkg) {
    console.log('No packages found.');
    return;
  }

  let sub = await prisma.tenantSubscription.findUnique({ where: { tenantId: tenant.id } });
  if (!sub) {
    sub = await prisma.tenantSubscription.create({
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
  
  await prisma.tenantSubscription.updateMany({
    data: { nextBillingDate: yesterday, status: 'ACTIVE' }
  });
  console.log('Set all nextBillingDates to yesterday.');

  // 3. Process Invoices (This generates PENDING invoices via our Cron function)
  await processInvoices();
  
  // 4. Mark one invoice as 8 days old to test PAST_DUE logic
  const eightDaysAgo = new Date();
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
  
  const record = await prisma.billingRecord.findFirst({ where: { status: 'PENDING' }});
  if (record) {
    await prisma.billingRecord.update({
      where: { id: record.id },
      data: { date: eightDaysAgo }
    });
    console.log(`Modified invoice ${record.id.substring(0,8)} to be 8 days old.`);
  }

  // 5. Check Past Due
  await checkPastDue();

  // 6. Create some dummy COMPLETED invoices for revenue metric
  await prisma.billingRecord.create({
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

simulate().catch(console.error).finally(() => prisma.$disconnect());
