#!/bin/bash
set -e

if command -v pnpm &> /dev/null; then
  echo "Using pnpm"
  pnpm install
  pnpm run build
else
  echo "pnpm not found, installing via corepack"
  corepack enable
  corepack prepare pnpm@latest --activate
  pnpm install
  pnpm run build
fi
