# Migrating off Supabase → local Docker Postgres

Supabase is used in this project for **exactly one thing: the Postgres database.**
Verified facts:

- **Auth** is your own JWT + bcrypt (`auth.controller.ts`) — not Supabase Auth.
- **Storage** is Cloudinary — not Supabase Storage.
- **Realtime** is not used — order updates are HTTP polling. No websockets.
- `@supabase/supabase-js` in the frontend is a **dead, unused dependency**.

So the entire migration = move the database and repoint two env vars. No app
logic changes.

## What these scripts do (and don't)

They run a Docker Postgres **in parallel** with your live Supabase DB and copy
the data into it. They **only read** from Supabase (`pg_dump`) and they **never
touch your live `.env`**. Your running app keeps using Supabase until *you*
perform the cutover at the bottom of this file. Rollback = put the old URL back.

Schema is created cleanly via `prisma db push` (this repo has no migrations
folder). Only the **data** is dumped from Supabase, so none of Supabase's RLS
policies, roles, or extensions come along for the ride.

## Prerequisites

- Docker Desktop running.
- `npx prisma` working in `backend/` (`npm install` already done).
- Network access to Supabase from the dump container (default).

## Run it

From the **`backend/`** folder:

```powershell
# Windows / PowerShell
./migration/migrate.ps1
```

```bash
# bash / WSL / git-bash
./migration/migrate.sh
```

This will: start the container → push the schema → dump data from Supabase →
restore into Docker → print a **source-vs-target row count** for every table.
Confirm the two count lists match.

Partial runs:

```powershell
./migration/migrate.ps1 -SchemaOnly   # create tables only, no data
./migration/migrate.ps1 -VerifyOnly   # re-print the count comparison
```

```bash
./migration/migrate.sh schema
./migration/migrate.sh verify
```

The dump is idempotent enough to re-run, but a clean re-import is cleanest:
`docker compose -f migration/docker-compose.yml down -v` (wipes the volume),
then run the script again.

## Notes / gotchas

- **Postgres version:** the scripts use `postgres:17`. `pg_dump 17` can dump an
  older Supabase server fine. If Supabase ever runs a *newer* major than the
  image, bump the `image:` tag in `docker-compose.yml` and `$PgImage` to match.
- **`pg_restore` exit code:** data-only restores often print benign notices and
  exit non-zero. That's why success is judged by the **row-count verification**,
  not the exit code.
- `data.dump` and any `.env.migration` are gitignored — they are not committed.

## CUTOVER (only after counts match and you've tested)

1. **Back up** your current `.env`.
2. In `backend/.env`, replace both URLs with the local DB:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/foodordering"
   DIRECT_URL="postgresql://postgres:postgres@localhost:5433/foodordering"
   ```
   (For local Postgres, `DATABASE_URL` and `DIRECT_URL` are the same — there's
   no pooler.)
3. In `backend/src/services/prisma.ts`, the `max: 2` pool cap exists *only* for
   the Supabase free tier. For local Postgres you can safely raise it
   (e.g. `max: 10`). Optional, but recommended.
4. Remove the dead frontend dependency:
   ```bash
   cd frontend && npm uninstall @supabase/supabase-js
   ```
5. Restart the backend (`npm run dev`) and smoke-test: login, list products,
   place an order, check the admin dashboard.

### Rollback

Put the original Supabase `DATABASE_URL` / `DIRECT_URL` back in `.env` and
restart. Nothing else changed.
