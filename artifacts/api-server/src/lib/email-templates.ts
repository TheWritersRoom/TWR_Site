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
  return emailWrapper(`
    <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#1A1614;font-family:Georgia,'Times New Roman',serif;">Welcome, ${name}.</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#7A6B5E;">Thanks for joining The Writers Room. Please verify your email address to confirm your account.</p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#E8B84B;border:2px solid #1A1614;">
          <a href="${verifyUrl}" style="display:block;padding:14px 32px;font-size:13px;font-weight:700;color:#1A1614;text-decoration:none;letter-spacing:0.08em;text-transform:uppercase;">Verify my email address</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:12px;color:#7A6B5E;">Or copy and paste this link into your browser:</p>
    <p style="margin:0 0 24px;font-size:12px;color:#7A6B5E;word-break:break-all;"><a href="${verifyUrl}" style="color:#1A1614;">${verifyUrl}</a></p>
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
  return emailWrapper(`
    <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.2em;font-weight:700;text-transform:uppercase;color:#E8B84B;">New join request</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#1A1614;font-family:Georgia,'Times New Roman',serif;">${projectTitle}</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#1A1614;">Hi ${ownerName}, <strong>${requesterName}</strong> has requested to join your project <strong>&ldquo;${projectTitle}&rdquo;</strong>.</p>
    ${message ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#F9F6EE;border-left:3px solid #E8B84B;padding:14px 18px;">
          <p style="margin:0;font-size:14px;line-height:1.7;color:#1A1614;font-style:italic;">&ldquo;${message}&rdquo;</p>
        </td>
      </tr>
    </table>
    ` : `<p style="margin:0 0 24px;font-size:14px;color:#7A6B5E;font-style:italic;">No message included.</p>`}
    <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="background:#1A1614;border:2px solid #1A1614;">
          <a href="${projectUrl}" style="display:block;padding:14px 32px;font-size:13px;font-weight:700;color:#F9F6EE;text-decoration:none;letter-spacing:0.08em;text-transform:uppercase;">Review request</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#7A6B5E;">You can accept or decline from the Collaborators tab of your project.</p>
  `);
}

export function inboxMessageEmailTemplate(opts: {
  recipientName: string;
  senderName: string;
  preview: string;
  inboxUrl: string;
}): string {
  const { recipientName, senderName, preview, inboxUrl } = opts;
  const safePreview = preview.length > 200 ? preview.slice(0, 200) + "…" : preview;
  return emailWrapper(`
    <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.2em;font-weight:700;text-transform:uppercase;color:#E8B84B;">New message</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#1A1614;font-family:Georgia,'Times New Roman',serif;">You have a new message</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#1A1614;">Hi ${recipientName}, <strong>${senderName}</strong> sent you a message on The Writers Room.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#F9F6EE;border:1px solid rgba(26,22,20,0.2);padding:18px;">
          <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#7A6B5E;">${senderName}</p>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#1A1614;">${safePreview}</p>
        </td>
      </tr>
    </table>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="background:#E8B84B;border:2px solid #1A1614;">
          <a href="${inboxUrl}" style="display:block;padding:14px 32px;font-size:13px;font-weight:700;color:#1A1614;text-decoration:none;letter-spacing:0.08em;text-transform:uppercase;">Open inbox</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#7A6B5E;">Reply directly from your inbox on The Writers Room.</p>
  `);
}
