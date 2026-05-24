#!/bin/bash

if [ -z "$GITHUB_TOKEN" ]; then
  echo "[github-sync] GITHUB_TOKEN is not set — skipping push" >&2
  exit 0
fi

# ---------------------------------------------------------------------------
# Build dist files before pushing so Hostinger always gets pre-compiled output
# ---------------------------------------------------------------------------
echo "[github-sync] Building dist files..."

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

BUILD_OUTPUT=$(cd "$REPO_ROOT" && PORT=3000 BASE_PATH=/ pnpm --filter @workspace/writers-room run build 2>&1)
BUILD_EXIT=$?
if [ $BUILD_EXIT -ne 0 ]; then
  echo "[github-sync] WARNING: Frontend build failed (exit ${BUILD_EXIT})" >&2
  echo "[github-sync] Output: ${BUILD_OUTPUT}" >&2
else
  echo "[github-sync] Frontend built successfully."
fi

BUILD_OUTPUT=$(cd "$REPO_ROOT" && pnpm --filter @workspace/api-server run build 2>&1)
BUILD_EXIT=$?
if [ $BUILD_EXIT -ne 0 ]; then
  echo "[github-sync] WARNING: API server build failed (exit ${BUILD_EXIT})" >&2
  echo "[github-sync] Output: ${BUILD_OUTPUT}" >&2
else
  echo "[github-sync] API server built successfully."
fi

# Stage any updated dist files so they're included in the push
cd "$REPO_ROOT" && git add artifacts/writers-room/dist artifacts/api-server/dist 2>/dev/null || true

# ---------------------------------------------------------------------------

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
    echo "[github-sync] SLACK_WEBHOOK_URL is not set — skipping Slack notification." >&2
  fi

  # Send email notification via Resend if ADMIN_EMAIL and RESEND_API_KEY are set
  if [ -n "$ADMIN_EMAIL" ] && [ -n "$RESEND_API_KEY" ]; then
    # Truncate error output to 3000 chars for the email body
    EMAIL_ERROR_OUTPUT="${PUSH_OUTPUT:0:3000}"
    if [ ${#PUSH_OUTPUT} -gt 3000 ]; then
      EMAIL_ERROR_OUTPUT="${EMAIL_ERROR_OUTPUT}
... (truncated)"
    fi

    # Build HTML email body
    EMAIL_HTML="<!DOCTYPE html>
<html lang=\"en\">
<head><meta charset=\"UTF-8\" /><title>GitHub Push Failed</title></head>
<body style=\"margin:0;padding:0;background:#F9F6EE;font-family:'Helvetica Neue',Arial,sans-serif;color:#1A1614;\">
  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#F9F6EE;padding:40px 20px;\">
    <tr><td align=\"center\">
      <table width=\"100%\" style=\"max-width:560px;background:#ffffff;border:2px solid #1A1614;\">
        <tr><td style=\"background:#1A1614;padding:28px 36px;\">
          <p style=\"margin:0 0 4px;font-size:10px;letter-spacing:0.24em;font-weight:700;color:#E8B84B;text-transform:uppercase;\">The Writers Room</p>
          <p style=\"margin:0;font-size:20px;font-weight:700;color:#F9F6EE;font-family:Georgia,'Times New Roman',serif;\">A space for serious writers.</p>
        </td></tr>
        <tr><td style=\"padding:36px;\">
          <p style=\"margin:0 0 6px;font-size:10px;letter-spacing:0.2em;font-weight:700;text-transform:uppercase;color:#E8B84B;\">GitHub sync</p>
          <h1 style=\"margin:0 0 20px;font-size:22px;font-weight:700;color:#1A1614;font-family:Georgia,'Times New Roman',serif;\">Push to GitHub failed</h1>
          <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-bottom:28px;border:1px solid rgba(26,22,20,0.15);\">
            <tr>
              <td style=\"padding:8px 16px;background:#F9F6EE;border-bottom:1px solid rgba(26,22,20,0.1);width:30%;\"><span style=\"font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#7A6B5E;\">Commit</span></td>
              <td style=\"padding:8px 16px;background:#ffffff;border-bottom:1px solid rgba(26,22,20,0.1);\"><span style=\"font-size:13px;font-family:monospace;color:#1A1614;\">${COMMIT_HASH}</span></td>
            </tr>
            <tr>
              <td style=\"padding:8px 16px;background:#F9F6EE;border-bottom:1px solid rgba(26,22,20,0.1);\"><span style=\"font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#7A6B5E;\">Branch</span></td>
              <td style=\"padding:8px 16px;background:#ffffff;border-bottom:1px solid rgba(26,22,20,0.1);\"><span style=\"font-size:13px;font-family:monospace;color:#1A1614;\">${CURRENT_BRANCH}</span></td>
            </tr>
            <tr>
              <td style=\"padding:8px 16px;background:#F9F6EE;\"><span style=\"font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#7A6B5E;\">Exit code</span></td>
              <td style=\"padding:8px 16px;background:#ffffff;\"><span style=\"font-size:13px;font-family:monospace;color:#1A1614;\">${PUSH_EXIT_CODE}</span></td>
            </tr>
          </table>
          <p style=\"margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7A6B5E;\">Error output</p>
          <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-bottom:16px;\">
            <tr><td style=\"background:#1A1614;padding:16px 20px;\">
              <pre style=\"margin:0;font-size:12px;line-height:1.6;color:#F9F6EE;font-family:monospace;white-space:pre-wrap;word-break:break-all;\">${EMAIL_ERROR_OUTPUT}</pre>
            </td></tr>
          </table>
          <p style=\"margin:0;font-size:13px;color:#7A6B5E;\">Check the deployment logs and retry the push once the issue is resolved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"

    EMAIL_PAYLOAD=$(jq -n \
      --arg from "The Writers Room <noreply@jointhewritersroom.com>" \
      --arg to "$ADMIN_EMAIL" \
      --arg subject "GitHub push failed — ${CURRENT_BRANCH} (${COMMIT_HASH})" \
      --arg html "$EMAIL_HTML" \
      '{"from": $from, "to": [$to], "subject": $subject, "html": $html}')

    EMAIL_RESPONSE=$(curl --fail --silent --show-error \
      -X POST \
      -H "Authorization: Bearer ${RESEND_API_KEY}" \
      -H "Content-Type: application/json" \
      --data "$EMAIL_PAYLOAD" \
      "https://api.resend.com/emails" 2>&1)
    EMAIL_CURL_EXIT=$?

    if [ $EMAIL_CURL_EXIT -eq 0 ]; then
      echo "[github-sync] Failure notification emailed to ${ADMIN_EMAIL}."
    else
      echo "[github-sync] Warning: could not send failure email (curl exit ${EMAIL_CURL_EXIT}): ${EMAIL_RESPONSE}" >&2
    fi
  else
    echo "[github-sync] ADMIN_EMAIL or RESEND_API_KEY is not set — skipping email notification." >&2
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
