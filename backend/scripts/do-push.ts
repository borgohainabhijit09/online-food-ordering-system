import { execSync } from 'child_process';
import 'dotenv/config';

console.log("Pushing DB using DIRECT_URL...");
try {
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DIRECT_URL
    }
  });
  console.log("DB Push successful.");
} catch (e) {
  console.error("Failed to push DB", e);
}
