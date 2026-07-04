#!/bin/sh
set -e

echo "[entrypoint] Syncing Prisma schema to database..."
npx prisma db push

echo "[entrypoint] Starting API server..."
exec node dist/index.js