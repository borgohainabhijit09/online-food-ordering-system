<#
  Supabase -> local Docker Postgres migration (Windows / PowerShell).

  Safe by design: it only READS from Supabase (pg_dump) and writes to the
  local Docker DB. Your live .env is never modified, so the running app keeps
  using Supabase until YOU choose to cut over (see README.md).

  Usage (from the backend/ folder):
      ./migration/migrate.ps1            # full run: up -> schema -> dump -> restore -> verify
      ./migration/migrate.ps1 -SchemaOnly
      ./migration/migrate.ps1 -VerifyOnly

  Requires: Docker Desktop running, and `npx prisma` available in backend/.
#>
param(
  [switch]$SchemaOnly,
  [switch]$VerifyOnly
)

$ErrorActionPreference = 'Stop'

# --- paths -----------------------------------------------------------------
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Split-Path -Parent $ScriptDir
$Compose    = Join-Path $ScriptDir 'docker-compose.yml'
$DumpFile   = Join-Path $ScriptDir 'data.dump'
$EnvFile    = Join-Path $BackendDir '.env'

# --- target (local Docker) - matches docker-compose.yml --------------------
$TargetUrl    = 'postgresql://postgres:postgres@localhost:5433/foodordering'
$PgImage      = 'postgres:17-alpine'
$ContainerName = 'food_ordering_db'

# --- read the Supabase source URL from the live .env (DIRECT_URL) -----------
function Get-EnvValue($key) {
  $line = Select-String -Path $EnvFile -Pattern "^\s*$key\s*=" | Select-Object -First 1
  if (-not $line) { throw "$key not found in $EnvFile" }
  $val = ($line.Line -replace "^\s*$key\s*=\s*", '').Trim()
  return $val.Trim('"').Trim("'")
}
$SourceUrl = Get-EnvValue 'DIRECT_URL'   # port 5432 / session mode = correct for dumping

Write-Host "Source (Supabase): $($SourceUrl -replace ':[^:@/]+@', ':****@')" -ForegroundColor Cyan
Write-Host "Target (Docker)  : $TargetUrl" -ForegroundColor Cyan

# Prisma table names, in no particular order - FK order is handled by
# pg_restore --disable-triggers, not by us.
$Tables = @(
  'Tenant','User','AuditLog','TenantAccess','Category','Product','ProductImage',
  'ProductVariant','Addon','ProductAddon','Inventory','Customer','Order','OrderItem',
  'OrderItemAddon','Settings','SubscriptionPackage','TenantSubscription','BillingRecord',
  'Coupon','RestaurantTable','RestaurantEvent','Lead','SupportTicket','SupportMessage',
  'MarketplaceProduct','MarketplaceRequest','Feature','SubscriptionPlan','PlanFeature',
  'FeatureOverride','LoyaltyTransaction'
)

function Invoke-Verify {
  Write-Host "`n=== Row-count comparison (source vs target) ===" -ForegroundColor Yellow
  $parts = $Tables | ForEach-Object { "SELECT '$_' AS t, count(*) AS n FROM `"$_`"" }
  $sql = ($parts -join ' UNION ALL ') + ' ORDER BY t;'

  # Pipe SQL via stdin (-f -) so embedded double-quotes around identifiers
  # like "Order" survive — passing them as a -c argument strips the quotes.
  Write-Host "`n-- Supabase (source) --"
  $sql | docker run --rm -i $PgImage psql "$SourceUrl" -At -F '|' -f -
  Write-Host "`n-- Docker (target) --"
  $sql | docker exec -i $ContainerName psql -U postgres -d foodordering -At -F '|' -f -
}

if ($VerifyOnly) { Invoke-Verify; exit 0 }

# --- 1. bring up the local DB ----------------------------------------------
Write-Host "`n[1/5] Starting Docker Postgres..." -ForegroundColor Green
docker compose -f $Compose up -d
Write-Host "      Waiting for it to become healthy..."
$tries = 0
while ($true) {
  $status = docker inspect --format '{{.State.Health.Status}}' $ContainerName 2>$null
  if ($status -eq 'healthy') { break }
  if (++$tries -gt 40) { throw "Database did not become healthy in time." }
  Start-Sleep -Seconds 2
}
Write-Host "      Ready."

# --- 2. create schema on the target via Prisma (no migrations folder) ------
Write-Host "`n[2/5] Pushing Prisma schema to the target DB..." -ForegroundColor Green
Push-Location $BackendDir
try {
  $env:DATABASE_URL = $TargetUrl
  $env:DIRECT_URL   = $TargetUrl
  npx prisma db push
  if ($LASTEXITCODE -ne 0) { throw "prisma db push failed." }
} finally {
  Pop-Location
  Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:DIRECT_URL -ErrorAction SilentlyContinue
}

if ($SchemaOnly) { Write-Host "`nSchema created. Skipping data copy (-SchemaOnly)." -ForegroundColor Green; exit 0 }

# --- 3. dump DATA ONLY from Supabase (schema came from Prisma) -------------
Write-Host "`n[3/5] Dumping data from Supabase (data-only, public schema)..." -ForegroundColor Green
if (Test-Path $DumpFile) { Remove-Item $DumpFile }
docker run --rm -v "${ScriptDir}:/out" $PgImage `
  pg_dump "$SourceUrl" -Fc --data-only --no-owner --no-privileges --schema=public -f /out/data.dump
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed." }
Write-Host "      Wrote $DumpFile"

# --- 4. restore into the target --------------------------------------------
Write-Host "`n[4/5] Restoring into Docker Postgres..." -ForegroundColor Green
docker cp $DumpFile "${ContainerName}:/tmp/data.dump"
docker exec $ContainerName pg_restore --data-only --disable-triggers `
  --no-owner --no-privileges -U postgres -d foodordering /tmp/data.dump
# pg_restore data-only commonly exits non-zero on benign notices; verify decides success.
docker exec $ContainerName rm -f /tmp/data.dump

# --- 5. verify --------------------------------------------------------------
Write-Host "`n[5/5] Verifying..." -ForegroundColor Green
Invoke-Verify

Write-Host "`nDone. Compare the two count lists above - they should match." -ForegroundColor Green
Write-Host "When satisfied, follow the CUTOVER section in migration/README.md." -ForegroundColor Green
