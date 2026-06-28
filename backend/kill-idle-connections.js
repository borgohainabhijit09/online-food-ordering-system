const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const res = await pool.query(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE pid <> pg_backend_pid() 
      AND state = 'idle'
      AND backend_type = 'client backend';
    `);
    console.log(`Terminated ${res.rowCount} idle connections.`);
  } catch (err) {
    console.error('Error terminating connections:', err);
  } finally {
    await pool.end();
  }
}

run();
