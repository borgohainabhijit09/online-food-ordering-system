import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
  });
  
  const adapter = new PrismaPg(pool);
  
  const prisma = new PrismaClient({ adapter, log: ['warn', 'error'] });

  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        subscription: {
          include: { package: true }
        },
        tenantAccess: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log("SUCCESS. Found", tenants.length, "tenants.");
  } catch (err) {
    console.error("PRISMA ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
