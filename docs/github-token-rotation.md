# GitHub Token Rotation Guide

## Overview

The `GITHUB_TOKEN` secret is a GitHub Personal Access Token (PAT) used by
`scripts/github-sync.sh` to push checkpoints to
[TheWritersRoom/TWR_Site](https://github.com/TheWritersRoom/TWR_Site).

After every successful push, the sync script checks how many days remain
before the token expires. If the token expires within **14 days** (or has
already expired), an alert is posted to the Slack webhook configured in
`SLACK_WEBHOOK_URL`. You can adjust the warning threshold by setting the
`GITHUB_TOKEN_WARN_DAYS` environment variable (default: `14`).

---

## When to act

| Situation | What happens |
|-----------|-------------|
| > 14 days remaining | No alert — nothing to do |
| ≤ 14 days remaining | Slack warning posted after each push |
| Already expired | Slack critical alert posted; pushes will fail |

---

## How to renew the token

### Step 1 — Generate a new PAT on GitHub

1. Go to **GitHub → Settings → Developer settings → Personal access tokens**.
2. Choose **Fine-grained tokens** (recommended) or **Tokens (classic)**.
3. Click **Generate new token**.
4. Set the following:
   - **Token name**: `TWR Replit Sync` (or similar)
   - **Expiration**: 90 days (or the maximum your org allows)
   - **Repository access**: Only `TheWritersRoom/TWR_Site`
   - **Repository permissions**: `Contents` → **Read and write**
5. Click **Generate token** and copy the token value immediately — it is only shown once.

### Step 2 — Update the secret in Replit

1. Open the Replit project for Writers Room.
2. Go to **Secrets** (the padlock icon in the left sidebar).
3. Find the secret named `GITHUB_TOKEN`.
4. Click **Edit** and paste the new token value.
5. Save.

### Step 3 — Verify

Trigger a sync (e.g. make a small commit) and check that the push succeeds
without errors. The log should show:

```
[github-sync] Token is valid for N more day(s). No action needed.
```

---

## Notes

- **Never commit the token value** to the repository. Always store it as a
  Replit secret.
- If the repository is transferred or renamed, update the remote URL in
  `scripts/github-sync.sh` accordingly.
- Classic PATs without an expiry date will not trigger rotation warnings —
  but they are less secure. Prefer fine-grained tokens with an expiry.
