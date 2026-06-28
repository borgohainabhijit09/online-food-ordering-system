#!/usr/bin/env bash
# Supabase -> local Docker Postgres migration (bash / WSL / git-bash).
# Only READS from Supabase (pg_dump); writes to local Docker. Live .env untouched.
#
# Usage (from the backend/ folder):
#   ./migration/migrate.sh            # full run
#   ./migration/migrate.sh schema     # schema only
#   ./migration/migrate.sh verify     # counts only
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE="$SCRIPT_DIR/docker-compose.yml"
DUMP_FILE="$SCRIPT_DIR/data.dump"
ENV_FILE="$BACKEND_DIR/.env"

TARGET_URL='postgresql://postgres:postgres@localhost:5433/foodordering'
PG_IMAGE='postgres:17-alpine'
CONTAINER='food_ordering_db'

# read DIRECT_URL (session-mode, port 5432) from the live .env
SOURCE_URL="$(grep -E '^\s*DIRECT_URL\s*=' "$ENV_FILE" | head -1 | sed -E 's/^\s*DIRECT_URL\s*=\s*//' | sed -E 's/^["'"'"']//;s/["'"'"']$//')"
[ -n "$SOURCE_URL" ] || { echo "DIRECT_URL not found in $ENV_FILE"; exit 1; }

TABLES=(Tenant User AuditLog TenantAccess Category Product ProductImage ProductVariant
  Addon ProductAddon Inventory Customer Order OrderItem OrderItemAddon Settings
  SubscriptionPackage TenantSubscription BillingRecord Coupon RestaurantTable
  RestaurantEvent Lead SupportTicket SupportMessage MarketplaceProduct
  MarketplaceRequest Feature SubscriptionPlan PlanFeature FeatureOverride LoyaltyTransaction)

build_count_sql() {
  local sep="" sql=""
  for t in "${TABLES[@]}"; do
    sql+="${sep}SELECT '$t' AS t, count(*) AS n FROM \"$t\""
    sep=" UNION ALL "
  done
  echo "$sql ORDER BY t;"
}

verify() {
  local sql; sql="$(build_count_sql)"
  echo "-- Supabase (source) --"
  docker run --rm "$PG_IMAGE" psql "$SOURCE_URL" -At -F '|' -c "$sql"
  echo "-- Docker (target) --"
  docker exec "$CONTAINER" psql -U postgres -d foodordering -At -F '|' -c "$sql"
}

case "${1:-full}" in
  verify) verify; exit 0 ;;
esac

echo "[1/5] Starting Docker Postgres..."
docker compose -f "$COMPOSE" up -d
for i in $(seq 1 40); do
  [ "$(docker inspect --format '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null)" = "healthy" ] && break
  sleep 2
done

echo "[2/5] Pushing Prisma schema to target..."
( cd "$BACKEND_DIR" && DATABASE_URL="$TARGET_URL" DIRECT_URL="$TARGET_URL" npx prisma db push )

if [ "${1:-full}" = "schema" ]; then echo "Schema only — done."; exit 0; fi

echo "[3/5] Dumping data from Supabase..."
rm -f "$DUMP_FILE"
docker run --rm -v "$SCRIPT_DIR:/out" "$PG_IMAGE" \
  pg_dump "$SOURCE_URL" -Fc --data-only --no-owner --no-privileges --schema=public -f /out/data.dump

echo "[4/5] Restoring into Docker Postgres..."
docker cp "$DUMP_FILE" "$CONTAINER:/tmp/data.dump"
docker exec "$CONTAINER" pg_restore --data-only --disable-triggers \
  --no-owner --no-privileges -U postgres -d foodordering /tmp/data.dump || true
docker exec "$CONTAINER" rm -f /tmp/data.dump

echo "[5/5] Verifying..."
verify
echo "Done — compare the counts above."
