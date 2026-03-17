#!/bin/bash
set -e

echo "==> Node: $(node --version), pnpm: $(pnpm --version)"

echo "==> Installing dependencies..."
pnpm install

echo "==> Syncing database schema..."
# prisma db push is idempotent: syncs schema to match Prisma models without
# depending on migration tracking history. Safe to run repeatedly; does nothing
# if the DB already matches the schema.
pnpm exec prisma db push --skip-generate --accept-data-loss

echo "==> Building Next.js application..."
pnpm run build

echo "==> Build complete."
