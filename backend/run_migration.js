const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    await client.query(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "forcePasswordChange" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "lastPasswordChangeAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
    `);
    console.log('User columns added.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL,
        "businessId" TEXT,
        "userId" TEXT,
        "action" TEXT NOT NULL,
        "performedBy" TEXT NOT NULL,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('AuditLog table created.');

  } catch (err) {
    console.error('Database migration error:', err);
  } finally {
    await client.end();
  }
}
main();
