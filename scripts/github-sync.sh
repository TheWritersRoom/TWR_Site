#!/bin/bash
set -e

if [ -z "$GITHUB_TOKEN" ]; then
  echo "[github-sync] GITHUB_TOKEN is not set — skipping push" >&2
  exit 0
fi

AUTHENTICATED_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/TheWritersRoom/TWR_Site.git"

CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "master")

echo "[github-sync] Pushing ${CURRENT_BRANCH} to GitHub (master)..."
git push --force "$AUTHENTICATED_URL" "${CURRENT_BRANCH}:master"

echo "[github-sync] Done."
