function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function emailWrapper(content: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>The Writers Room</title>
</head>
<body style="margin:0;padding:0;background:#F9F6EE;font-family:'Helvetica Neue',Arial,sans-serif;color:#1A1614;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F6EE;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border:2px solid #1A1614;">
          <tr>
            <td style="background:#1A1614;padding:28px 36px;">
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.24em;font-weight:700;color:#E8B84B;text-transform:uppercase;">The Writers Room</p>
              <p style="margin:0;font-size:20px;font-weight:700;color:#F9F6EE;font-family:Georgia,'Times New Roman',serif;">A space for serious writers.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background:#F9F6EE;border-top:1px solid rgba(26,22,20,0.15);padding:20px 36px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#7A6B5E;">You received this email because you have an account at The Writers Room.</p>
              <p style="margin:6px 0 0;font-size:11px;color:#7A6B5E;">&copy; ${year} The Writers Room. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function verificationEmailTemplate(name: string, verifyUrl: string): string {
  const safeName = escapeHtml(name);
  const safeUrl = encodeURI(verifyUrl);
  return emailWrapper(`
    <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#1A1614;font-family:Georgia,'Times New Roman',serif;">Welcome, ${safeName}.</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#7A6B5E;">Thanks for joining The Writers Room. Please verify your email address to confirm your account.</p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#E8B84B;border:2px solid #1A1614;">
          <a href="${safeUrl}" style="display:block;padding:14px 32px;font-size:13px;font-weight:700;color:#1A1614;text-decoration:none;letter-spacing:0.08em;text-transform:uppercase;">Verify my email address</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:12px;color:#7A6B5E;">Or copy and paste this link into your browser:</p>
    <p style="margin:0 0 24px;font-size:12px;color:#7A6B5E;word-break:break-all;"><a href="${safeUrl}" style="color:#1A1614;">${escapeHtml(verifyUrl)}</a></p>
    <p style="margin:0;font-size:12px;color:#7A6B5E;border-top:1px solid rgba(26,22,20,0.1);padding-top:16px;">This link expires in 48 hours. If you didn&apos;t create this account, you can safely ignore this email.</p>
  `);
}

export function joinRequestEmailTemplate(opts: {
  ownerName: string;
  requesterName: string;
  projectTitle: string;
  message: string | null;
  projectUrl: string;
}): string {
  const { ownerName, requesterName, projectTitle, message, projectUrl } = opts;
  const safeOwner = escapeHtml(ownerName);
  const safeRequester = escapeHtml(requesterName);
  const safeTitle = escapeHtml(projectTitle);
  const safeMessage = message ? escapeHtml(message) : null;
  const safeProjectUrl = encodeURI(projectUrl);
  return emailWrapper(`
    <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.2em;font-weight:700;text-transform:uppercase;color:#E8B84B;">New join request</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#1A1614;font-family:Georgia,'Times New Roman',serif;">${safeTitle}</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#1A1614;">Hi ${safeOwner}, <strong>${safeRequester}</strong> has requested to join your project <strong>&ldquo;${safeTitle}&rdquo;</strong>.</p>
    ${safeMessage ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#F9F6EE;border-left:3px solid #E8B84B;padding:14px 18px;">
          <p style="margin:0;font-size:14px;line-height:1.7;color:#1A1614;font-style:italic;">&ldquo;${safeMessage}&rdquo;</p>
        </td>
      </tr>
    </table>
    ` : `<p style="margin:0 0 24px;font-size:14px;color:#7A6B5E;font-style:italic;">No message included.</p>`}
    <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="background:#1A1614;border:2px solid #1A1614;">
          <a href="${safeProjectUrl}" style="display:block;padding:14px 32px;font-size:13px;font-weight:700;color:#F9F6EE;text-decoration:none;letter-spacing:0.08em;text-transform:uppercase;">Review request</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#7A6B5E;">You can accept or decline from the Collaborators tab of your project.</p>
  `);
}

export function newSignupAdminTemplate(opts: {
  name: string;
  email: string;
  role: string;
  genres: string;
  adminUrl: string;
}): string {
  const { name, email, role, genres, adminUrl } = opts;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeRole = escapeHtml(role);
  const parsedGenres: string[] = (() => { try { return JSON.parse(genres); } catch { return []; } })();
  const safeGenres = parsedGenres.length > 0 ? parsedGenres.map(escapeHtml).join(", ") : "—";
  const safeAdminUrl = encodeURI(adminUrl);
  const roleLabel: Record<string, string> = { author: "Author", contributor: "Contributor", both: "Author &amp; Contributor" };
  const safeRoleLabel = roleLabel[safeRole] ?? safeRole;
  return emailWrapper(`
    <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.2em;font-weight:700;text-transform:uppercase;color:#E8B84B;">New member</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#1A1614;font-family:Georgia,'Times New Roman',serif;">Someone just joined the room.</h1>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid rgba(26,22,20,0.15);">
      <tr>
        <td style="padding:6px 16px;background:#F9F6EE;border-bottom:1px solid rgba(26,22,20,0.1);">
          <span style="font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#7A6B5E;">Name</span>
        </td>
        <td style="padding:6px 16px;background:#ffffff;border-bottom:1px solid rgba(26,22,20,0.1);">
          <span style="font-size:14px;color:#1A1614;font-weight:600;">${safeName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 16px;background:#F9F6EE;border-bottom:1px solid rgba(26,22,20,0.1);">
          <span style="font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#7A6B5E;">Email</span>
        </td>
        <td style="padding:6px 16px;background:#ffffff;border-bottom:1px solid rgba(26,22,20,0.1);">
          <span style="font-size:14px;color:#1A1614;">${safeEmail}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 16px;background:#F9F6EE;border-bottom:1px solid rgba(26,22,20,0.1);">
          <span style="font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#7A6B5E;">Role</span>
        </td>
        <td style="padding:6px 16px;background:#ffffff;border-bottom:1px solid rgba(26,22,20,0.1);">
          <span style="font-size:14px;color:#1A1614;">${safeRoleLabel}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 16px;background:#F9F6EE;">
          <span style="font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#7A6B5E;">Genres</span>
        </td>
        <td style="padding:6px 16px;background:#ffffff;">
          <span style="font-size:14px;color:#1A1614;">${safeGenres}</span>
        </td>
      </tr>
    </table>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="background:#1A1614;border:2px solid #1A1614;">
          <a href="${safeAdminUrl}" style="display:block;padding:14px 32px;font-size:13px;font-weight:700;color:#F9F6EE;text-decoration:none;letter-spacing:0.08em;text-transform:uppercase;">View in admin</a>
        </td>
      </tr>
    </table>
  `);
}

export function githubPushFailedEmailTemplate(opts: {
  commitHash: string;
  branch: string;
  exitCode: string;
  errorOutput: string;
}): string {
  const { commitHash, branch, exitCode, errorOutput } = opts;
  const safeCommit = escapeHtml(commitHash);
  const safeBranch = escapeHtml(branch);
  const safeExitCode = escapeHtml(exitCode);
  const truncated = errorOutput.length > 3000 ? errorOutput.slice(0, 3000) + "\n… (truncated)" : errorOutput;
  const safeError = escapeHtml(truncated);
  return emailWrapper(`
    <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.2em;font-weight:700;text-transform:uppercase;color:#E8B84B;">GitHub sync</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#1A1614;font-family:Georgia,'Times New Roman',serif;">Push to GitHub failed</h1>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid rgba(26,22,20,0.15);">
      <tr>
        <td style="padding:8px 16px;background:#F9F6EE;border-bottom:1px solid rgba(26,22,20,0.1);width:30%;">
          <span style="font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#7A6B5E;">Commit</span>
        </td>
        <td style="padding:8px 16px;background:#ffffff;border-bottom:1px solid rgba(26,22,20,0.1);">
          <span style="font-size:13px;font-family:monospace;color:#1A1614;">${safeCommit}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 16px;background:#F9F6EE;border-bottom:1px solid rgba(26,22,20,0.1);">
          <span style="font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#7A6B5E;">Branch</span>
        </td>
        <td style="padding:8px 16px;background:#ffffff;border-bottom:1px solid rgba(26,22,20,0.1);">
          <span style="font-size:13px;font-family:monospace;color:#1A1614;">${safeBranch}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 16px;background:#F9F6EE;">
          <span style="font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#7A6B5E;">Exit code</span>
        </td>
        <td style="padding:8px 16px;background:#ffffff;">
          <span style="font-size:13px;font-family:monospace;color:#1A1614;">${safeExitCode}</span>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7A6B5E;">Error output</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="background:#1A1614;padding:16px 20px;">
          <pre style="margin:0;font-size:12px;line-height:1.6;color:#F9F6EE;font-family:monospace;white-space:pre-wrap;word-break:break-all;">${safeError}</pre>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#7A6B5E;">Check the deployment logs and retry the push once the issue is resolved.</p>
  `);
}

export function inboxMessageEmailTemplate(opts: {
  recipientName: string;
  senderName: string;
  preview: string;
  inboxUrl: string;
}): string {
  const { recipientName, senderName, preview, inboxUrl } = opts;
  const rawPreview = preview.length > 200 ? preview.slice(0, 200) + "…" : preview;
  const safeRecipient = escapeHtml(recipientName);
  const safeSender = escapeHtml(senderName);
  const safePreview = escapeHtml(rawPreview);
  const safeInboxUrl = encodeURI(inboxUrl);
  return emailWrapper(`
    <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.2em;font-weight:700;text-transform:uppercase;color:#E8B84B;">New message</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#1A1614;font-family:Georgia,'Times New Roman',serif;">You have a new message</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#1A1614;">Hi ${safeRecipient}, <strong>${safeSender}</strong> sent you a message on The Writers Room.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#F9F6EE;border:1px solid rgba(26,22,20,0.2);padding:18px;">
          <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#7A6B5E;">${safeSender}</p>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#1A1614;">${safePreview}</p>
        </td>
      </tr>
    </table>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="background:#E8B84B;border:2px solid #1A1614;">
          <a href="${safeInboxUrl}" style="display:block;padding:14px 32px;font-size:13px;font-weight:700;color:#1A1614;text-decoration:none;letter-spacing:0.08em;text-transform:uppercase;">Open inbox</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#7A6B5E;">Reply directly from your inbox on The Writers Room.</p>
  `);
}
