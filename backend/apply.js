const { Client } = require('pg');
const fs = require('fs');

async function main() {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres.qcsxyhesxfdxdyuyxkzw:Advikrini%401408@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=20";
  
  const client = new Client({
    connectionString,
  });

  console.log('Connecting to DB...');
  await client.connect();
  console.log('Connected!');

  const sql = fs.readFileSync('apply_coupons_fix.sql', 'utf-8');
  console.log('Executing SQL...');
  
  try {
    await client.query(sql);
    console.log('Successfully executed SQL!');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
