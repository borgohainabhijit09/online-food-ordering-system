import prisma from './src/services/prisma';

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'STAFF' },
    include: {
      tenantAccess: {
        include: {
          staffRole: true
        }
      }
    }
  });

  const roles = await prisma.staffRole.findMany();

  console.log('--- USERS ---');
  console.log(JSON.stringify(users, null, 2));

  console.log('\n--- ROLES ---');
  console.log(JSON.stringify(roles, null, 2));
}

main().finally(() => prisma.$disconnect());
