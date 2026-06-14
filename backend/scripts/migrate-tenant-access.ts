import 'dotenv/config';
import prisma from '../src/services/prisma';

async function main() {
  console.log('Starting TenantAccess migration...');

  // Find all users who have a tenantId but no TenantAccess records yet
  const usersToMigrate = await prisma.user.findMany({
    where: {
      tenantId: { not: null }
    },
    include: {
      tenantAccess: true
    }
  });

  console.log(`Found ${usersToMigrate.length} users to migrate.`);

  let migratedCount = 0;

  for (const user of usersToMigrate) {
    // Only migrate if they don't already have access to this tenant in the TenantAccess table
    const alreadyHasAccess = user.tenantAccess.some(a => a.tenantId === user.tenantId);
    
    if (!alreadyHasAccess && user.tenantId) {
      await prisma.tenantAccess.create({
        data: {
          userId: user.id,
          tenantId: user.tenantId,
          role: user.role // Keep existing role
        }
      });
      migratedCount++;
    }
  }

  console.log(`Successfully migrated ${migratedCount} users.`);
}

main()
  .catch(e => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
