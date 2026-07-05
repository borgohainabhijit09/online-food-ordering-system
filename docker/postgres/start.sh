#!/bin/sh
# Wraps the official postgres entrypoint to fix the NOLOGIN issue that arises
# when the pgdata volume was populated from a Supabase dump (which exports the
# 'postgres' role with rolcanlogin=false). Runs in single-user mode before the
# normal startup so the fix persists in the data files permanently.
set -e

PGDATA="${PGDATA:-/var/lib/postgresql/data}"

if [ -d "$PGDATA/global" ]; then
    echo "[postgres-init] fixing postgres role LOGIN + password..."
    printf "ALTER ROLE postgres WITH LOGIN PASSWORD 'postgres';\n" | \
        gosu postgres postgres --single -j -D "$PGDATA" postgres 2>/dev/null || true
    echo "[postgres-init] done."
fi

exec docker-entrypoint.sh postgres "$@"
