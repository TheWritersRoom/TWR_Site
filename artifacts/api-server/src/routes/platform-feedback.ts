import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, userSessionsTable, usersTable } from "@workspace/db";
import { sendEmail } from "../lib/email";

const router: IRouter = Router();

const CATEGORIES: Record<string, string> = {
  bug: "Bug report",
  feature: "Feature request",
  general: "General feedback",
  other: "Other",
};

router.post("/feedback/platform", async (req, res): Promise<void> => {
  const sessionToken = req.cookies?.["wr_session"];
  if (!sessionToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [session] = await db
    .select({
      userId: userSessionsTable.userId,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
    .from(userSessionsTable)
    .innerJoin(usersTable, eq(userSessionsTable.userId, usersTable.id))
    .where(
      and(
        eq(userSessionsTable.token, sessionToken),
        gt(userSessionsTable.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { category, message } = req.body as {
    category?: string;
    message?: string;
  };

  if (!message?.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const categoryLabel = CATEGORIES[category ?? ""] ?? "Other";
  const adminEmail = process.env["ADMIN_EMAIL"];

  if (!adminEmail) {
    res.status(503).json({ error: "Admin email not configured" });
    return;
  }

  const submittedAt = new Date().toLocaleString("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  await sendEmail({
    to: adminEmail,
    subject: `[TWR Feedback] ${categoryLabel} from ${session.userName}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #1A1614; background: #F9F6EE;">
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.28em; font-weight: bold; color: #E8B84B; margin: 0 0 6px;">The Writers Room</p>
        <div style="border-top: 3px solid #1A1614; margin-bottom: 28px;"></div>
        <h1 style="font-size: 22px; font-weight: bold; margin: 0 0 6px; color: #1A1614;">User Feedback</h1>
        <p style="font-size: 13px; color: #7A6B5E; margin: 0 0 28px;">${submittedAt}</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
          <tr>
            <td style="padding: 10px 14px; background: #fff; border: 1px solid #E8E0D8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #7A6B5E; width: 110px;">From</td>
            <td style="padding: 10px 14px; background: #fff; border: 1px solid #E8E0D8; font-size: 14px; color: #1A1614;">${session.userName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; background: #fff; border: 1px solid #E8E0D8; border-top: none; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #7A6B5E;">Email</td>
            <td style="padding: 10px 14px; background: #fff; border: 1px solid #E8E0D8; border-top: none; font-size: 14px; color: #1A1614;"><a href="mailto:${session.userEmail}" style="color: #E8B84B;">${session.userEmail}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; background: #fff; border: 1px solid #E8E0D8; border-top: none; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #7A6B5E;">Category</td>
            <td style="padding: 10px 14px; background: #fff; border: 1px solid #E8E0D8; border-top: none; font-size: 14px; color: #1A1614;">${categoryLabel}</td>
          </tr>
        </table>

        <div style="background: #fff; border: 1px solid #E8E0D8; padding: 20px 22px; margin-bottom: 32px;">
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #7A6B5E; margin: 0 0 10px;">Message</p>
          <p style="font-size: 15px; line-height: 1.75; color: #1A1614; margin: 0; white-space: pre-wrap;">${message.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        </div>

        <div style="border-top: 1px solid #E8E0D8; padding-top: 16px;">
          <p style="font-size: 11px; color: #9A8C82; margin: 0;">Sent via the feedback form in the user dashboard · The Writers Room</p>
        </div>
      </div>
    `,
  });

  res.status(201).json({ ok: true });
});

export default router;
