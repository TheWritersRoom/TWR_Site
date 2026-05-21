#!/bin/bash
set -e

HOOKS_DIR="$(git rev-parse --git-dir)/hooks"

echo "[install-hooks] Installing post-commit hook..."

cat > "$HOOKS_DIR/post-commit" <<'EOF'
#!/bin/bash
bash "$(git rev-parse --show-toplevel)/scripts/github-sync.sh"
EOF

chmod +x "$HOOKS_DIR/post-commit"

echo "[install-hooks] post-commit hook installed."
