require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL
  });
  
  await client.connect();
  
  try {
    await client.query(`ALTER TYPE "DietaryPreference" ADD VALUE IF NOT EXISTS 'EGG'`);
    console.log('Enum updated');
  } catch (error) {
    console.error('Error updating enum:', error.message);
  } finally {
    await client.end();
  }
}

main();
