import prisma from '../src/services/prisma';

async function seed() {
  console.log('--- STARTING SUBSCRIPTION SEEDING ---');

  // 1. Seed Features
  const featuresList = [
    { code: 'ORDERING', name: 'Online Ordering', description: 'Enable customers to place orders online via storefront.' },
    { code: 'COUPONS', name: 'Coupons', description: 'Create and manage discount codes.' },
    { code: 'REWARDS', name: 'Rewards Program', description: 'Loyalty points and customer rewards.' },
    { code: 'RESERVATIONS', name: 'Reservations', description: 'Table management and reservation scheduling.' },
    { code: 'BILLING', name: 'Sales & Billing', description: 'Detailed sales history and receipt generation.' },
    { code: 'INVENTORY', name: 'Recipe Based Inventory', description: 'Track ingredients, stock limits, and recipes.' },
    { code: 'AI_RECIPE_SUGGESTIONS', name: 'AI Recipe Suggestions', description: 'Get suggestions based on low stock ingredients.' },
    { code: 'CONSUMPTION_FORECAST', name: 'Consumption Forecast', description: 'Predict future ingredient needs.' },
    { code: 'CUSTOMER_CRM', name: 'Customer CRM', description: 'Track customer lifetime values, segments, and promotions.' },
    { code: 'MARKETPLACE', name: 'Marketplace', description: 'Request raw materials and services from suppliers.' },
    { code: 'ADVANCED_ANALYTICS', name: 'Advanced Analytics', description: 'High-level business intelligence reports.' },
    { code: 'MULTI_BRANCH', name: 'Multi Branch Management', description: 'Manage multiple outlets from a single dashboard.' },
  ];

  console.log('Upserting Features...');
  const featureIdMap: Record<string, string> = {};
  for (const f of featuresList) {
    const feat = await prisma.feature.upsert({
      where: { code: f.code },
      update: { name: f.name, description: f.description },
      create: f
    });
    featureIdMap[f.code] = feat.id;
  }
  console.log(`Seeded ${featuresList.length} features.`);

  // 2. Seed Subscription Plans
  const plansList = [
    { name: 'Starter', monthlyPrice: 499, yearlyPrice: 4999, description: 'Essential tools for small restaurants.', featureCodes: ['ORDERING', 'COUPONS', 'MARKETPLACE'] },
    { name: 'Growth', monthlyPrice: 999, yearlyPrice: 9999, description: 'Loyalty programs, reservations, and basic marketing tools.', featureCodes: ['ORDERING', 'COUPONS', 'MARKETPLACE', 'REWARDS', 'RESERVATIONS', 'BILLING', 'CUSTOMER_CRM'] },
    { name: 'Premium', monthlyPrice: 1499, yearlyPrice: 14999, description: 'Advanced AI insights, recipe based inventory, and reports.', featureCodes: ['ORDERING', 'COUPONS', 'MARKETPLACE', 'REWARDS', 'RESERVATIONS', 'BILLING', 'CUSTOMER_CRM', 'INVENTORY', 'AI_RECIPE_SUGGESTIONS', 'CONSUMPTION_FORECAST', 'ADVANCED_ANALYTICS'] },
    { name: 'Enterprise', monthlyPrice: 2999, yearlyPrice: 29999, description: 'Full features including multi-branch management and priority support.', featureCodes: ['ORDERING', 'COUPONS', 'MARKETPLACE', 'REWARDS', 'RESERVATIONS', 'BILLING', 'CUSTOMER_CRM', 'INVENTORY', 'AI_RECIPE_SUGGESTIONS', 'CONSUMPTION_FORECAST', 'ADVANCED_ANALYTICS', 'MULTI_BRANCH'] }
  ];

  console.log('Upserting Subscription Plans...');
  for (const p of plansList) {
    // Check if plan already exists by name (since name is not unique in prisma model, we search by findFirst)
    let plan = await prisma.subscriptionPlan.findFirst({
      where: { name: p.name }
    });

    if (plan) {
      plan = await prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data: {
          monthlyPrice: p.monthlyPrice,
          yearlyPrice: p.yearlyPrice,
          description: p.description,
          isActive: true
        }
      });
    } else {
      plan = await prisma.subscriptionPlan.create({
        data: {
          name: p.name,
          monthlyPrice: p.monthlyPrice,
          yearlyPrice: p.yearlyPrice,
          description: p.description,
          isActive: true
        }
      });
    }

    // Now map Plan Features
    // Delete existing links for this plan to prevent duplicates
    await prisma.planFeature.deleteMany({
      where: { planId: plan.id }
    });

    // Insert new links
    for (const code of p.featureCodes) {
      const featureId = featureIdMap[code];
      if (featureId) {
        await prisma.planFeature.create({
          data: {
            planId: plan.id,
            featureId
          }
        });
      }
    }
    console.log(`Seeded plan "${p.name}" with ${p.featureCodes.length} features.`);
  }

  // 3. Backfill Existing Tenants (Restaurants)
  console.log('Backfilling existing tenants...');
  const tenants = await prisma.tenant.findMany({
    include: { subscription: { include: { package: true } } }
  });

  const starterPlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'Starter' } });
  const growthPlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'Growth' } });
  const premiumPlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'Premium' } });

  let backfilledCount = 0;
  for (const t of tenants) {
    if (!t.currentPlanId) {
      // Determine best plan based on price or assign default
      let targetPlan = premiumPlan; // default fallback is premium to not lock users out during migration
      if (t.subscription?.package) {
        const price = t.subscription.package.price;
        if (price <= 499) {
          targetPlan = starterPlan;
        } else if (price <= 999) {
          targetPlan = growthPlan;
        } else {
          targetPlan = premiumPlan;
        }
      }

      if (targetPlan) {
        await prisma.tenant.update({
          where: { id: t.id },
          data: { currentPlanId: targetPlan.id }
        });
        backfilledCount++;
      }
    }
  }

  console.log(`Backfilled ${backfilledCount} tenants to their new plans.`);
  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
