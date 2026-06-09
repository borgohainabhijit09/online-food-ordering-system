import prisma from './src/services/prisma';

async function seed() {
  await prisma.subscriptionPackage.upsert({
    where: { name: 'App Only' },
    update: {},
    create: {
      name: 'App Only',
      price: 499,
      features: 'Only the app via web and mobile browser',
    },
  });

  await prisma.subscriptionPackage.upsert({
    where: { name: 'App + Landing Page' },
    update: {},
    create: {
      name: 'App + Landing Page',
      price: 599,
      features: 'App + Restaurant Landing page maintained by us',
    },
  });

  await prisma.subscriptionPackage.upsert({
    where: { name: 'App + Landing Page + SMM' },
    update: {},
    create: {
      name: 'App + Landing Page + SMM',
      price: 1499,
      features: 'App + landing page + Social Media Marketing',
    },
  });

  console.log('Successfully seeded subscription packages.');
  process.exit(0);
}

seed();
