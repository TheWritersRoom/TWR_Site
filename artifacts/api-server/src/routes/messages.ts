import { Router, type IRouter } from "express";
import { eq, desc, or, and, asc } from "drizzle-orm";
import { db, messagesTable, usersTable } from "@workspace/db";
import { createInboxMessageAndNotify } from "../lib/inbox";

const router: IRouter = Router();

router.post("/messages", async (req, res): Promise<void> => {
  const { fromUserId, toUserId, body } = req.body as {
    fromUserId: number;
    toUserId: number;
    body: string;
  };
  if (!fromUserId || !toUserId || !body?.trim()) {
    res.status(400).json({ error: "Missing required fields" }); return;
  }

  await createInboxMessageAndNotify(Number(fromUserId), Number(toUserId), body.trim());

  // Return the inserted message for the client
  const [msg] = await db
    .select()
    .from(messagesTable)
    .where(
      and(
        eq(messagesTable.fromUserId, Number(fromUserId)),
        eq(messagesTable.toUserId, Number(toUserId))
      )
    )
    .orderBy(desc(messagesTable.createdAt))
    .limit(1);

  res.status(201).json(msg);
});

router.get("/messages/inbox", async (req, res): Promise<void> => {
  const userId = parseInt(req.query.userId as string, 10);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid userId" }); return; }

  const messages = await db
    .select({
      id: messagesTable.id,
      fromUserId: messagesTable.fromUserId,
      fromName: usersTable.name,
      body: messagesTable.body,
      isRead: messagesTable.isRead,
      createdAt: messagesTable.createdAt,
    })
    .from(messagesTable)
    .innerJoin(usersTable, eq(messagesTable.fromUserId, usersTable.id))
    .where(eq(messagesTable.toUserId, userId))
    .orderBy(desc(messagesTable.createdAt));

  res.json(messages);
});

router.get("/messages/conversation", async (req, res): Promise<void> => {
  const userA = parseInt(req.query.userA as string, 10);
  const userB = parseInt(req.query.userB as string, 10);
  if (isNaN(userA) || isNaN(userB)) { res.status(400).json({ error: "Invalid userIds" }); return; }

  const messages = await db
    .select({
      id: messagesTable.id,
      fromUserId: messagesTable.fromUserId,
      fromName: usersTable.name,
      toUserId: messagesTable.toUserId,
      body: messagesTable.body,
      isRead: messagesTable.isRead,
      createdAt: messagesTable.createdAt,
    })
    .from(messagesTable)
    .innerJoin(usersTable, eq(messagesTable.fromUserId, usersTable.id))
    .where(
      or(
        and(eq(messagesTable.fromUserId, userA), eq(messagesTable.toUserId, userB)),
        and(eq(messagesTable.fromUserId, userB), eq(messagesTable.toUserId, userA))
      )
    )
    .orderBy(asc(messagesTable.createdAt));

  res.json(messages);
});

router.patch("/messages/:id/read", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [msg] = await db.update(messagesTable).set({ isRead: true }).where(eq(messagesTable.id, id)).returning();
  if (!msg) { res.status(404).json({ error: "Message not found" }); return; }
  res.json(msg);
});

export default router;
