import prisma from './src/services/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const pass = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.updateMany({
    where: { role: 'SUPER_ADMIN' },
    data: { password: pass }
  });
  console.log('Reset super admin password to admin123', admin);
  process.exit(0);
}
main();
