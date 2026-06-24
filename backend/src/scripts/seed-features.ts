import prisma from '../services/prisma';

async function seedFeatures() {
  const features = [
    { code: 'ANALYTICS', name: 'Advanced Analytics', description: 'Access to detailed sales reports, customer insights, and revenue analytics' },
    { code: 'INVENTORY', name: 'Inventory Management', description: 'Track stock levels, get low-stock alerts, and manage supplier orders' },
    { code: 'MARKETING', name: 'Marketing & Offers', description: 'Create targeted promotions, discount campaigns, and customer offers' },
    { code: 'WHATSAPP_NOTIFICATIONS', name: 'WhatsApp Notifications', description: 'Send order updates, promotional messages and bills via WhatsApp' },
    { code: 'CUSTOMER_SEGMENTATION', name: 'Customer Segmentation', description: 'Segment customers by behavior (New, VIP, Regular) and target them specifically' },
    { code: 'TABLE_MANAGEMENT', name: 'Table Management', description: 'Manage dine-in tables, QR codes, and seat reservations' },
    { code: 'COUPONS', name: 'Coupons & Discounts', description: 'Create and manage discount coupons for customers' },
    { code: 'MULTI_LOCATION', name: 'Multi-Location Support', description: 'Manage multiple restaurant branches from a single dashboard' },
    { code: 'API_ACCESS', name: 'API Access', description: 'Access to the RestoBuddy public API for custom integrations' },
    { code: 'PRIORITY_SUPPORT', name: 'Priority Support', description: 'Get priority access to customer support with dedicated account manager' },
    { code: 'CUSTOM_BRANDING', name: 'Custom Branding', description: 'Remove RestoBuddy branding and use your own logo and colors' },
    { code: 'MARKETPLACE', name: 'Marketplace Access', description: 'Access to the RestoBuddy marketplace for equipment and supplies' },
  ];

  console.log('Seeding features...');

  for (const f of features) {
    const existing = await prisma.feature.findUnique({ where: { code: f.code } });
    if (!existing) {
      await prisma.feature.create({ data: f });
      console.log(`✅ Created feature: ${f.name}`);
    } else {
      console.log(`⏭️  Feature already exists: ${f.name}`);
    }
  }

  const total = await prisma.feature.count();
  console.log(`\n✅ Done! Total features in database: ${total}`);
  
  await prisma.$disconnect();
}

seedFeatures().catch((e) => {
  console.error('Seeding failed:', e);
  process.exit(1);
});
