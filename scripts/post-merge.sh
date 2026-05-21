#!/bin/bash
set -e
pnpm install --frozen-lockfile
bash scripts/install-hooks.sh
bash scripts/github-sync.sh
