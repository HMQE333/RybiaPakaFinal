# RybiaPaka - Replit Environment

## Overview
A Next.js 16 fishing community web app (Polish: rybiapaka.pl) with forums, user profiles, galleries, messaging, and moderation features. Uses better-auth for authentication, Prisma ORM with PostgreSQL, and Tailwind CSS v4.

## Architecture
- **Framework**: Next.js 16 (App Router) with Turbopack
- **Auth**: better-auth (session-based)
- **Database**: PostgreSQL (Replit Helium DB) via Prisma ORM
- **Styling**: Tailwind CSS v4 + tailwind-merge
- **Package manager**: pnpm

## Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Shared UI components
- `src/utils/` - Utility functions
- `prisma/` - Prisma schema and migrations

## Running the App
```
pnpm run dev   # Dev server on port 5000
```
The workflow "Start application" runs `pnpm run dev` and is configured to serve on port 5000 (required for Replit webview).

## Environment Variables
Set in Replit Secrets / Env Vars:
- `DATABASE_URL` - PostgreSQL connection string (Replit Helium DB)
- `BETTER_AUTH_SECRET` - Secret for better-auth session signing
- `NEXT_PUBLIC_SITE_URL` / `BETTER_AUTH_URL` / `NEXTAUTH_URL` - App base URL (set to Replit dev domain)
- `PORT` - 5000
- SMTP vars (optional, for email)
- OAuth vars (optional, for Google/Facebook/Discord login)

## Key Features
- **Dyskusje (Chat)**: Channel-based chat with 60-day message retention, cursor-based scroll-up pagination (loads 60 messages per page, `before=` cursor param), admin hide/delete, emoji system
- **Forum**: Permanent threaded posts with likes, comments (replies), board categories, admin archive/delete
- **Galeria**: Photo gallery with categories, likes, comments; images saved to `public/uploads/galeria/`; avatars to `public/uploads/avatars/`
- **Auth**: Email/password + Google/Discord/Facebook OAuth via better-auth

## Database Models (Prisma → PostgreSQL)
- `User`, `Account`, `Session`, `Verification` — auth
- `Thread`, `Post`, `Reaction`, `Board` — forum
- `ChannelMessage` — chat (with hiddenAt, hiddenById, deletedAt, deletedById)
- `GalleryItem`, `GalleryLike`, `GalleryComment`, `GalleryCommentLike` — gallery
- `Message` — direct messages
- Plus: FriendRequest, Friendship, Notification, Report, ContentArchive, AdminLog, SiteSetting, UserNotificationSetting, Rank, Region, FishingMethod, UserFishingMethod

## File Upload
- `src/lib/localUpload.ts` — saves gallery images and avatars locally
- Gallery images: `public/uploads/galeria/` → URL `/uploads/galeria/<uuid>.<ext>`
- Avatars: `public/uploads/avatars/` → URL `/uploads/avatars/<uuid>.<ext>`
- Max sizes: gallery 8MB, avatar 2MB; allowed: jpg, png, webp
- **Note**: Files in `public/uploads/` do NOT survive container restarts (Replit ephemeral FS)

## Migration Notes (Vercel → Replit)
- Database switched from SQLite (`file:`) to PostgreSQL (Replit Helium DB)
- Prisma schema provider updated to `postgresql`
- SQLite migrations cleared; new baseline migration created for Postgres
- `dev` script updated: `next dev -p 5000 -H 0.0.0.0`
- `pnpm.onlyBuiltDependencies` added for prisma, sharp, esbuild native builds
- Gallery tables (GalleryItem etc.) added to Prisma schema and pushed with `prisma db push`
- Old external data service (`dataFetch`/`galleryUpload`) replaced with local Prisma + file storage
