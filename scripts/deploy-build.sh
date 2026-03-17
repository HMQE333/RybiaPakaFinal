#!/bin/bash
set -e

echo "==> Node: $(node --version), pnpm: $(pnpm --version)"

echo "==> Installing dependencies..."
pnpm install

echo "==> Running database migrations..."
pnpm exec prisma migrate deploy

echo "==> Building Next.js application..."
pnpm run build

echo "==> Build complete."
