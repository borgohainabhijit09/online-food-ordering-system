import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import prisma from './src/services/prisma';

dotenv.config({ path: path.join(__dirname, '.env') });

async function main() {
  const tickets = await prisma.supportTicket.findMany({
    include: { tenant: true }
  });
  console.log(JSON.stringify(tickets, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
