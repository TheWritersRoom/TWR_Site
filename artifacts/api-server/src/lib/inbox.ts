import { eq } from "drizzle-orm";
import { db, messagesTable, usersTable } from "@workspace/db";
import { sendEmail } from "./email";
import { inboxMessageEmailTemplate } from "./email-templates";

type InsertedMessage = typeof messagesTable.$inferSelect;

function getFrontendBase(): string {
  const domain = process.env.REPLIT_DEV_DOMAIN;
  return domain
    ? `https://${domain}/writers-room`
    : (process.env.APP_FRONTEND_URL ?? "http://localhost:5173");
}

/** Fire-and-forget email notification — never throws. */
function sendInboxEmailNotification(fromUserId: number, toUserId: number, body: string): void {
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

/**
 * Insert an inbox message and enqueue a best-effort email notification.
 *
 * DB insert errors are propagated so callers can handle them correctly.
 * Email send is always fire-and-forget and never blocks the response.
 *
 * Returns the inserted message row.
 */
export async function createInboxMessageAndNotify(
  fromUserId: number,
  toUserId: number,
  body: string
): Promise<InsertedMessage> {
  const [inserted] = await db
    .insert(messagesTable)
    .values({ fromUserId, toUserId, body })
    .returning();

  // Kick off email notification without awaiting it
  sendInboxEmailNotification(fromUserId, toUserId, body);

  return inserted;
}
