import prisma from './src/services/prisma';

async function main() {
  const featureCode = 'LANDING_PAGE';
  let feature = await prisma.feature.findUnique({
    where: { code: featureCode }
  });

  if (!feature) {
    feature = await prisma.feature.create({
      data: {
        code: featureCode,
        name: 'Landing Page',
        description: 'Access to customizable restaurant landing page builder'
      }
    });
    console.log('Created LANDING_PAGE feature');
  } else {
    console.log('LANDING_PAGE feature already exists');
  }
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
