#!/bin/bash
set -e

echo "==> Post-merge setup starting..."

echo "==> Installing dependencies..."
pnpm install

echo "==> Running database migrations..."
pnpm exec prisma migrate deploy

echo "==> Post-merge setup complete."
