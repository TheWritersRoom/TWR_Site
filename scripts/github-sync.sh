#!/bin/bash

if [ -z "$GITHUB_TOKEN" ]; then
  echo "[github-sync] GITHUB_TOKEN is not set — skipping push" >&2
  exit 0
fi

AUTHENTICATED_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/TheWritersRoom/TWR_Site.git"

CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "master")
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo "[github-sync] Pushing ${CURRENT_BRANCH} (${COMMIT_HASH}) to GitHub (master)..."

PUSH_OUTPUT=$(git push --force "$AUTHENTICATED_URL" "${CURRENT_BRANCH}:master" 2>&1)
PUSH_EXIT_CODE=$?

if [ $PUSH_EXIT_CODE -ne 0 ]; then
  echo "[github-sync] ERROR: Push failed (exit ${PUSH_EXIT_CODE})" >&2
  echo "[github-sync] Output: ${PUSH_OUTPUT}" >&2

  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    # Truncate output to 1500 chars to stay within Slack message limits
    TRUNCATED_OUTPUT="${PUSH_OUTPUT:0:1500}"
    if [ ${#PUSH_OUTPUT} -gt 1500 ]; then
      TRUNCATED_OUTPUT="${TRUNCATED_OUTPUT}... (truncated)"
    fi

    MESSAGE_TEXT="*GitHub push failed* :warning:
*Commit:* \`${COMMIT_HASH}\`
*Branch:* \`${CURRENT_BRANCH}\`
*Exit code:* \`${PUSH_EXIT_CODE}\`
*Error output:*
\`\`\`${TRUNCATED_OUTPUT}\`\`\`"

    # Use jq to build a properly JSON-escaped payload
    PAYLOAD=$(jq -n --arg text "$MESSAGE_TEXT" '{"text": $text}')

    CURL_RESPONSE=$(curl --fail --silent --show-error \
      -X POST \
      -H "Content-Type: application/json" \
      --data "$PAYLOAD" \
      "$SLACK_WEBHOOK_URL" 2>&1)
    CURL_EXIT=$?

    if [ $CURL_EXIT -eq 0 ]; then
      echo "[github-sync] Failure notification sent to Slack."
    else
      echo "[github-sync] Warning: could not send Slack notification (curl exit ${CURL_EXIT}): ${CURL_RESPONSE}" >&2
    fi
  else
    echo "[github-sync] SLACK_WEBHOOK_URL is not set — skipping notification." >&2
  fi

  exit $PUSH_EXIT_CODE
fi

echo "[github-sync] Done."

# ---------------------------------------------------------------------------
# Token expiry check
# GitHub returns an "x-oauth-token-expires-at" header on API responses when
# the token has an expiry date set (fine-grained PATs always do; classic PATs
# with an expiry also include it). We check after a successful push so expiry
# warnings don't block the sync itself.
# ---------------------------------------------------------------------------

TOKEN_WARN_DAYS="${GITHUB_TOKEN_WARN_DAYS:-14}"

API_HEADERS=$(curl --silent --show-error --head \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/user" 2>&1)

EXPIRES_AT=$(echo "$API_HEADERS" | grep -i "x-oauth-token-expires-at" | awk '{print $2}' | tr -d '\r')

if [ -z "$EXPIRES_AT" ]; then
  echo "[github-sync] Token has no expiry date (classic PAT with no expiration or GitHub App token). No rotation reminder needed."
  exit 0
fi

echo "[github-sync] Token expires at: ${EXPIRES_AT}"

# Convert expiry to epoch seconds (requires date command that supports -d / -j)
if date --version >/dev/null 2>&1; then
  # GNU date (Linux)
  EXPIRY_EPOCH=$(date -d "$EXPIRES_AT" +%s 2>/dev/null)
else
  # BSD date (macOS)
  EXPIRY_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$EXPIRES_AT" +%s 2>/dev/null)
fi

NOW_EPOCH=$(date +%s)

if [ -z "$EXPIRY_EPOCH" ]; then
  echo "[github-sync] Warning: could not parse token expiry date '${EXPIRES_AT}' — skipping expiry check." >&2
  exit 0
fi

SECONDS_UNTIL_EXPIRY=$(( EXPIRY_EPOCH - NOW_EPOCH ))
DAYS_UNTIL_EXPIRY=$(( SECONDS_UNTIL_EXPIRY / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -le 0 ]; then
  EXPIRY_MESSAGE="*GitHub token has expired!* :rotating_light:
The \`GITHUB_TOKEN\` secret used for automatic GitHub sync expired on \`${EXPIRES_AT}\`.
GitHub pushes will fail until the token is renewed.
See \`docs/github-token-rotation.md\` for renewal steps."
  echo "[github-sync] CRITICAL: Token has already expired!" >&2
elif [ $DAYS_UNTIL_EXPIRY -le $TOKEN_WARN_DAYS ]; then
  EXPIRY_MESSAGE="*GitHub token expiring soon* :warning:
The \`GITHUB_TOKEN\` secret used for automatic GitHub sync expires in *${DAYS_UNTIL_EXPIRY} day(s)* (on \`${EXPIRES_AT}\`).
Renew it before it lapses to avoid broken sync.
See \`docs/github-token-rotation.md\` for renewal steps."
  echo "[github-sync] Warning: Token expires in ${DAYS_UNTIL_EXPIRY} day(s) (threshold: ${TOKEN_WARN_DAYS} days)."
else
  echo "[github-sync] Token is valid for ${DAYS_UNTIL_EXPIRY} more day(s). No action needed."
  exit 0
fi

# Send Slack alert for expiry warning / expiry
if [ -n "$SLACK_WEBHOOK_URL" ]; then
  PAYLOAD=$(jq -n --arg text "$EXPIRY_MESSAGE" '{"text": $text}')

  CURL_RESPONSE=$(curl --fail --silent --show-error \
    -X POST \
    -H "Content-Type: application/json" \
    --data "$PAYLOAD" \
    "$SLACK_WEBHOOK_URL" 2>&1)
  CURL_EXIT=$?

  if [ $CURL_EXIT -eq 0 ]; then
    echo "[github-sync] Token expiry alert sent to Slack."
  else
    echo "[github-sync] Warning: could not send token expiry alert to Slack (curl exit ${CURL_EXIT}): ${CURL_RESPONSE}" >&2
  fi
else
  echo "[github-sync] SLACK_WEBHOOK_URL is not set — cannot send token expiry alert." >&2
fi
