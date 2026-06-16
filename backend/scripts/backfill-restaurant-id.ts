import crypto from 'crypto';
import prisma from '../src/services/prisma';

const generateId = () => 'RB-' + crypto.randomBytes(3).toString('hex').toUpperCase();

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: {
      restaurantId: null
    }
  });

  console.log(`Found ${tenants.length} tenants without a restaurantId. Backfilling...`);

  let count = 0;
  for (const tenant of tenants) {
    let restaurantId = generateId();
    // Ensure uniqueness
    while (await prisma.tenant.findUnique({ where: { restaurantId } })) {
      restaurantId = generateId();
    }

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { restaurantId }
    });
    count++;
  }

  console.log(`Successfully backfilled ${count} tenants with unique restaurant IDs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
