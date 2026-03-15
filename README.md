This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Production (OVH dedicated)

See `DEPLOYMENT.md` for the full production checklist. Quick summary:

```
cp .env.example .env
# fill URLs, secrets, DATABASE_URL
pnpm install
pnpm build
pnpm prisma:seed:prod
pnpm start
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Prisma / Database

- Provider: `sqlite` using `DATABASE_URL` from `.env` (use `DATABASE_URL="file:./dev.db"` so Prisma resolves to `prisma/dev.db`).
- For production, use an absolute SQLite path and make sure the directory is writable by the server user.
- Schema contains user auth/forum models plus profile/social features: ranks, regions, fishing methods, DMs, friend requests, friendships, notifications.

### Commands

Run these in order after creating `.env` with `DATABASE_URL` (you can copy from `.env.example`):

```
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm run dev
```

Production uses `pnpm start` (via `scripts/run-prod.js`) which runs `prisma migrate deploy` and `prisma generate` before `next start`.

Quick restore: there is a checked-in development database backup at `prisma/dev.db.bak`. To quickly restore a working local DB, copy it to `prisma/dev.db`:

On Unix/macOS:

```
cp prisma/dev.db.bak prisma/dev.db
```

On Windows PowerShell:

```
Copy-Item prisma/dev.db.bak -Destination prisma/dev.db
```

After restoring `prisma/dev.db`, copy `.env.example` to `.env` (or create `.env`) so Prisma can find the database.

### Profile API

- Server component fetch: `src/lib/profile.ts#getUser(username)` returns the UI-ready shape used by `src/app/profil/[username]/page.tsx`.
- HTTP endpoint: `GET /api/profile/:username` returns the same JSON.

Notes:

- If you have an existing SQLite file at `prisma/dev.db`, consider moving it away before migrating to apply the initial migration cleanly to an empty DB.
- The existing API routes (`/api/auth/*`) remain compatible (email + passwordHash). The new profile fields (`username`, `avatarUrl`, `bio`, `age`, `joinedAt`, `rankId`, `regionId`) are optional.
- Profile counts (posts/comments/messages) can be computed from forum `Post` rows (top-level vs replies) and `Message` rows.
