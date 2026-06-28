const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema='public'").then(res => {
  console.log(res);
  process.exit(0);
}).catch(console.error);
