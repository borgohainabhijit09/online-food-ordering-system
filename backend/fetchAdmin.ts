import prisma from './src/services/prisma';

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });
  console.log('Super Admin Phone Number is:', admin?.phone);
  process.exit(0);
}
main();
