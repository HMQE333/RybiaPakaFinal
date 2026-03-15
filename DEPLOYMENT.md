# Deployment (OVH dedicated, production)

This project runs as a Node.js server (Next.js + Prisma/SQLite). Use these steps on OVH.

## 1) Requirements

- Node.js 20 LTS
- pnpm (recommended): `npm i -g pnpm`

## 2) Upload and env

Example path: `/var/www/rybiapaka`

- Copy `.env.example` to `.env` and fill values.
- Set URLs to your domain:
  - `NEXT_PUBLIC_SITE_URL`
  - `BETTER_AUTH_URL` or `NEXTAUTH_URL`
- Set secrets:
  - `NEXTAUTH_SECRET` (use the same value for `AUTH_SECRET` and `BETTER_AUTH_SECRET`)
- Set database path (absolute):
  - `DATABASE_URL=file:/var/www/rybiapaka/prisma/dev.db`
- Ensure the DB directory is writable by the service user.
- (Recommended) Persist uploads outside the repo:
  - `UPLOADS_DIR=/var/www/rybiapaka/uploads`
  - Ensure `UPLOADS_DIR/avatars` and `UPLOADS_DIR/galeria` are writable.

Optional:
- `PRISMA_RESTORE=1` to restore from `prisma/dev.db.bak` when DB is missing.

## 3) Install and build

```bash
pnpm install
pnpm build
```

## 4) Initialize base data (one time)

This inserts ranks, regions, fishing methods, and site settings (no demo users):

```bash
pnpm prisma:seed:prod
```

## 5) Start the server

```bash
pnpm start
```

`pnpm start` uses `scripts/run-prod.js` which:
- normalizes `DATABASE_URL` for SQLite,
- runs `prisma migrate deploy`,
- runs `prisma generate`,
- starts `next start`.

## 7) HTTPS note

Login cookies are marked `Secure` in production. Make sure the site is served
over HTTPS (proxy/SSL) or sessions will not persist.

## 6) Optional: PM2

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
```
