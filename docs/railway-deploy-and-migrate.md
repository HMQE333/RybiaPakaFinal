# Railway Deploy & Migrate (Only Steps You Do)

## 1) Railway: create 3 services + Postgres

- Create one Postgres database (DATA only).
- Create 3 services from this repo:
  - MAIN: root repo
  - DATA: `apps/data`
  - GALLERY: `apps/gallery`

Use the `apps/*/railway.toml` files for each service.

## 2) Paste ENV variables

### DATA
- `DATABASE_URL`
- `SERVICE_TOKEN`
- `PRISMA_MIGRATE=1`
- `PRISMA_GENERATE=1`
- `CORS_ORIGIN` (optional)
- `RATE_LIMIT_MAX` (optional)
- `RATE_LIMIT_WINDOW_MS` (optional)

### GALLERY
- `SERVICE_TOKEN`
- `DATA_BASE_URL`
- `DATA_SERVICE_TOKEN`
- `S3_ENDPOINT`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_REGION`
- `PUBLIC_BASE_URL`
- `CORS_ORIGIN` (optional)
- `MAX_UPLOAD_BYTES` (optional)

### MAIN
- `DATA_BASE_URL`
- `DATA_SERVICE_TOKEN`
- `GALLERY_BASE_URL`
- `GALLERY_SERVICE_TOKEN`
- `DATA_DB_PROVIDER=postgresql`
- plus existing auth/SMTP/OAuth vars

## 3) Verify health

- MAIN: `GET /health` and `GET /api/health/data`
- DATA: `GET /health`
- GALLERY: `GET /health`

## 4) Migrate SQLite -> Postgres (DATA)

Prerequisite: DATA migrations already ran (DATA start does this).

```bash
node scripts/migrate_sqlite_to_postgres.js
```

Required env:
- `DATABASE_URL` or `POSTGRES_URL` (target Postgres)
- `SQLITE_PATH` (optional, defaults to `prisma/dev.db`)

## 5) Sync uploads -> S3/R2

```bash
node scripts/sync_uploads_to_s3.js
```

Required env:
- `S3_ENDPOINT`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_REGION`
- `PUBLIC_BASE_URL`

Optional env:
- `UPLOADS_DIR` (custom source)
- `S3_AVATAR_PREFIX` (default `avatars`)
- `S3_GALLERY_PREFIX` (default `gallery`)
- `DRY_RUN=1`

## 6) Update URLs in DB

```bash
node scripts/update_db_urls.js
```

Required env:
- `DATABASE_URL` or `POSTGRES_URL`
- `PUBLIC_BASE_URL` (if you didn't use the mapping file)

Optional env:
- `MAPPING_FILE` (defaults to `scripts/uploads_url_mapping.json`)

## Notes

- MAIN never uses `DATABASE_URL`.
- Only DATA runs migrations (deploy only).
- Scripts are idempotent: if you re-run, they either do nothing or stop safely.
