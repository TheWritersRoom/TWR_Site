import { eq } from "drizzle-orm";
import { db, messagesTable, usersTable } from "@workspace/db";
import { sendEmail } from "./email";
import { inboxMessageEmailTemplate } from "./email-templates";

function getFrontendBase(): string {
  const domain = process.env.REPLIT_DEV_DOMAIN;
  return domain
    ? `https://${domain}/writers-room`
    : (process.env.APP_FRONTEND_URL ?? "http://localhost:5173");
}

/**
 * Insert an inbox message and, if the recipient has email notifications
 * enabled, send a branded email notification. Fire-and-forget safe — always
 * resolves; errors are logged but never thrown.
 */
export async function createInboxMessageAndNotify(
  fromUserId: number,
  toUserId: number,
  body: string
): Promise<void> {
  try {
    await db.insert(messagesTable).values({ fromUserId, toUserId, body });
  } catch (err) {
    console.warn("[inbox] Failed to insert message:", err);
    return;
  }

  Promise.all([
    db.select({ name: usersTable.name })
      .from(usersTable).where(eq(usersTable.id, fromUserId)).limit(1),
    db.select({ name: usersTable.name, email: usersTable.email, emailNotifications: usersTable.emailNotifications })
      .from(usersTable).where(eq(usersTable.id, toUserId)).limit(1),
  ]).then(([[sender], [recipient]]) => {
    if (!recipient?.emailNotifications || !sender) return;
    return sendEmail({
      to: recipient.email,
      subject: `New message from ${sender.name} — The Writers Room`,
      html: inboxMessageEmailTemplate({
        recipientName: recipient.name,
        senderName: sender.name,
        preview: body,
        inboxUrl: `${getFrontendBase()}/inbox`,
      }),
    });
  }).catch((err) => console.warn("[inbox] Email notification failed:", err));
}
