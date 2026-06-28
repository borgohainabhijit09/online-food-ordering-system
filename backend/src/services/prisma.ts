import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ override: true });

// Module-level reference to the pool so we can close it during graceful shutdown.
// Prisma's built-in $disconnect() does NOT close the underlying pg Pool when using
// driver adapters, so we must do it ourselves.
let pgPool: Pool | null = null;

const prismaClientSingleton = () => {
  // IMPORTANT: Keep max:2 for Supabase free tier (hard limit of 15 session connections).
  // We use DIRECT_URL (port 5432) because Prisma 7 with adapter-pg sends prepared statements
  // which can hang in Transaction Mode (port 6543) depending on Supavisor config.
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 8000,
    allowExitOnIdle: true,
  });

  const adapter = new PrismaPg(pgPool);

  return new PrismaClient({
    adapter,
    log: ['warn', 'error'],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
  // eslint-disable-next-line no-var
  var pgPoolGlobal: undefined | Pool;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
globalThis.pgPoolGlobal = globalThis.pgPoolGlobal ?? pgPool ?? undefined;

/**
 * Cleanly disconnects Prisma and closes the underlying pg connection pool.
 * Called by the graceful shutdown hooks in index.ts.
 */
export const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect();
    const pool = globalThis.pgPoolGlobal ?? pgPool;
    if (pool) {
      await pool.end();
      console.log('[prisma]: PostgreSQL connection pool closed.');
    }
  } catch (err) {
    console.error('[prisma]: Error during database disconnect:', err);
  }
};

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
