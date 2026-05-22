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
