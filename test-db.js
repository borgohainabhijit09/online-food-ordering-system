const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/Users/320301827/Documents/WORKSPACE/01_CLIENTS/Active/eCommerce-website/backend/.env' });

async function testConnection(type, url) {
  console.log(`Testing ${type}...`);
  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    const client = await pool.connect();
    console.log(`[SUCCESS] Connected via ${type}`);
    client.release();
  } catch (err) {
    console.error(`[ERROR] Failed to connect via ${type}:`, err.message);
  } finally {
    await pool.end();
  }
}

async function run() {
  await testConnection('DIRECT_URL', process.env.DIRECT_URL);
  await testConnection('DATABASE_URL', process.env.DATABASE_URL);
}

run();
