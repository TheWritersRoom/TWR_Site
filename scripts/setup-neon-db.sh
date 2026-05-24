#!/bin/bash
# One-time script to push the full schema to a new Neon (or any external) PostgreSQL database.
# Usage: NEON_URL="postgres://..." bash scripts/setup-neon-db.sh

set -e

if [ -z "$NEON_URL" ]; then
  echo ""
  echo "Usage: NEON_URL=\"postgres://...\" bash scripts/setup-neon-db.sh"
  echo ""
  echo "Paste your Neon connection string as the NEON_URL variable."
  echo "You can find it in the Neon dashboard under Connection Details."
  echo ""
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "[neon-setup] Pushing schema to Neon database..."
cd "$REPO_ROOT"
DATABASE_URL="$NEON_URL" pnpm --filter @workspace/db run push-force

echo ""
echo "[neon-setup] Done! All tables created."
echo ""
echo "Next steps:"
echo "  1. Set DATABASE_URL=\"$NEON_URL\" in Hostinger hPanel > Advanced > Environment Variables"
echo "  2. The remaining schema changes (extra columns, seed data) will apply automatically"
echo "     the first time the server starts on Hostinger."
echo ""
