import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, messagesTable, usersTable } from "@workspace/db";

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
  const [msg] = await db.insert(messagesTable).values({
    fromUserId: Number(fromUserId),
    toUserId: Number(toUserId),
    body: body.trim(),
  }).returning();
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

router.patch("/messages/:id/read", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [msg] = await db.update(messagesTable).set({ isRead: true }).where(eq(messagesTable.id, id)).returning();
  if (!msg) { res.status(404).json({ error: "Message not found" }); return; }
  res.json(msg);
});

export default router;
