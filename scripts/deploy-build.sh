#!/bin/bash
set -e

echo "==> Node: $(node --version), pnpm: $(pnpm --version)"

echo "==> Installing dependencies..."
pnpm install

echo "==> Generating Prisma client..."
pnpm exec prisma generate

echo "==> Building Next.js application..."
pnpm run build

echo "==> Build complete."
