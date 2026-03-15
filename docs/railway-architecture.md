# Railway Architecture (Main + Data + Gallery)

This repo deploys as three Railway services:

- MAIN: Next.js app (web UI + API routes)
- DATA: Prisma-backed API (all DB access)
- GALLERY: Upload API (S3/R2 + metadata via DATA)

The MAIN service never connects to the database directly. All data access goes
through DATA, and all uploads go through GALLERY.

## Service setup

Use the `apps/*/railway.toml` files as the service config:

- `apps/main/railway.toml`
- `apps/data/railway.toml`
- `apps/gallery/railway.toml`

On Railway, create three services that point to this repo. For each service,
set the root to the folder that contains its `railway.toml`.

## MAIN environment

Required:

- `DATA_BASE_URL` (e.g. `https://rybiapaka-data.up.railway.app`)
- `DATA_SERVICE_TOKEN` (shared secret with DATA)
- `GALLERY_BASE_URL` (e.g. `https://rybiapaka-gallery.up.railway.app`)
- `GALLERY_SERVICE_TOKEN` (shared secret with GALLERY)
- `DATA_DB_PROVIDER=postgresql` (disables SQLite fallback helpers)

Existing app settings (auth, SMTP, OAuth) remain in MAIN as before.

## DATA environment

Required:

- `DATABASE_URL` (Railway Postgres connection string)
- `SERVICE_TOKEN` (must match MAIN `DATA_SERVICE_TOKEN`)

Optional:

- `CORS_ORIGIN` (comma-separated list of allowed origins)
- `RATE_LIMIT_MAX` (default 120 req/min)
- `RATE_LIMIT_WINDOW_MS` (default 60000)
- `PRISMA_MIGRATE=1` (run `prisma migrate deploy` on start)
- `PRISMA_GENERATE=1` (run `prisma generate` on start)

## GALLERY environment

Required:

- `SERVICE_TOKEN` (must match MAIN `GALLERY_SERVICE_TOKEN`)
- `DATA_BASE_URL` (DATA service URL)
- `DATA_SERVICE_TOKEN` (DATA service token)
- `S3_ENDPOINT`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_REGION`
- `PUBLIC_BASE_URL` (public base for uploaded files)

Optional:

- `CORS_ORIGIN` (comma-separated list of allowed origins)
- `MAX_UPLOAD_BYTES` (default 5242880)
- `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS`

## Health checks

- MAIN: `GET /health`
- DATA: `GET /health`
- GALLERY: `GET /health`

MAIN also exposes `GET /api/health/data` which checks DATA connectivity.

## Notes

- Only DATA runs Prisma migrations (`prisma migrate deploy`).
- No service writes uploads to local disk; uploads go to S3/R2 and only URLs
  are stored in the database.
- Tokens are required on all service-to-service calls (`X-SERVICE-TOKEN`).
