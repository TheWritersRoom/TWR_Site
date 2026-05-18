import { Router, type IRouter } from "express";
import { eq, and, asc } from "drizzle-orm";
import { db, plannersTable, plannerCardsTable, plannerContributorsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

const VALID_MEDIA = ["tv", "book", "serial", "other"] as const;
const VALID_STATUS = ["draft", "outline", "writing", "complete"] as const;

// List all planners for a user
router.get("/planners", async (req, res): Promise<void> => {
  const userId = parseInt(req.query.userId as string, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "userId query param required" });
    return;
  }

  const planners = await db
    .select()
    .from(plannersTable)
    .where(eq(plannersTable.ownerId, userId))
    .orderBy(plannersTable.updatedAt);

  const result = await Promise.all(planners.map(async (p) => {
    const cards = await db
      .select({ id: plannerCardsTable.id, status: plannerCardsTable.status })
      .from(plannerCardsTable)
      .where(eq(plannerCardsTable.plannerId, p.id));
    return {
      ...p,
      cardCount: cards.length,
      completeCount: cards.filter(c => c.status === "complete").length,
    };
  }));

  res.json(result);
});

// Get a single planner with all cards
router.get("/planners/:id", async (req, res): Promise<void> => {
  const plannerId = parseInt(req.params.id, 10);
  if (isNaN(plannerId)) {
    res.status(400).json({ error: "Invalid planner id" });
    return;
  }

  const [planner] = await db
    .select()
    .from(plannersTable)
    .where(eq(plannersTable.id, plannerId));

  if (!planner) {
    res.status(404).json({ error: "Planner not found" });
    return;
  }

  const cards = await db
    .select()
    .from(plannerCardsTable)
    .where(eq(plannerCardsTable.plannerId, plannerId))
    .orderBy(asc(plannerCardsTable.position));

  res.json({ ...planner, cards });
});

// Create a planner
router.post("/planners", async (req, res): Promise<void> => {
  const { ownerId, title, mediaType = "tv", projectId } = req.body ?? {};
  if (!ownerId || !title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "ownerId and title are required" });
    return;
  }

  const [planner] = await db
    .insert(plannersTable)
    .values({
      ownerId: Number(ownerId),
      title: title.trim(),
      mediaType: VALID_MEDIA.includes(mediaType) ? mediaType : "tv",
      projectId: projectId ? Number(projectId) : null,
    })
    .returning();

  res.status(201).json(planner);
});

// Update a planner
router.patch("/planners/:id", async (req, res): Promise<void> => {
  const plannerId = parseInt(req.params.id, 10);
  if (isNaN(plannerId)) {
    res.status(400).json({ error: "Invalid planner id" });
    return;
  }

  const { title, mediaType, projectId, synopsis, notes } = req.body ?? {};
  const updates: Record<string, any> = {};
  if (title && typeof title === "string") updates.title = title.trim();
  if (mediaType && VALID_MEDIA.includes(mediaType)) updates.mediaType = mediaType;
  if (projectId !== undefined) updates.projectId = projectId ? Number(projectId) : null;
  if (synopsis !== undefined) updates.synopsis = synopsis ?? null;
  if (notes !== undefined) updates.notes = notes ?? null;

  const [updated] = await db
    .update(plannersTable)
    .set(updates)
    .where(eq(plannersTable.id, plannerId))
    .returning();

  res.json(updated);
});

// Delete a planner
router.delete("/planners/:id", async (req, res): Promise<void> => {
  const plannerId = parseInt(req.params.id, 10);
  if (isNaN(plannerId)) {
    res.status(400).json({ error: "Invalid planner id" });
    return;
  }
  await db.delete(plannersTable).where(eq(plannersTable.id, plannerId));
  res.status(204).send();
});

// ── Contributors ─────────────────────────────────────────────────────────────

// List contributors for a planner
router.get("/planners/:id/contributors", async (req, res): Promise<void> => {
  const plannerId = parseInt(req.params.id, 10);
  if (isNaN(plannerId)) {
    res.status(400).json({ error: "Invalid planner id" });
    return;
  }

  const rows = await db
    .select({
      id: plannerContributorsTable.id,
      plannerId: plannerContributorsTable.plannerId,
      userId: plannerContributorsTable.userId,
      role: plannerContributorsTable.role,
      addedAt: plannerContributorsTable.addedAt,
      name: usersTable.name,
      email: usersTable.email,
      avatarUrl: usersTable.avatarUrl,
    })
    .from(plannerContributorsTable)
    .innerJoin(usersTable, eq(plannerContributorsTable.userId, usersTable.id))
    .where(eq(plannerContributorsTable.plannerId, plannerId))
    .orderBy(asc(plannerContributorsTable.addedAt));

  res.json(rows);
});

// Add a contributor by email
router.post("/planners/:id/contributors", async (req, res): Promise<void> => {
  const plannerId = parseInt(req.params.id, 10);
  if (isNaN(plannerId)) {
    res.status(400).json({ error: "Invalid planner id" });
    return;
  }

  const { email, role = "editor" } = req.body ?? {};
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "email is required" });
    return;
  }

  // Find user by email
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.trim().toLowerCase()));

  if (!user) {
    res.status(404).json({ error: "No user found with that email address" });
    return;
  }

  // Check planner exists and user isn't owner
  const [planner] = await db
    .select()
    .from(plannersTable)
    .where(eq(plannersTable.id, plannerId));

  if (!planner) {
    res.status(404).json({ error: "Planner not found" });
    return;
  }

  if (planner.ownerId === user.id) {
    res.status(400).json({ error: "Cannot add the planner owner as a contributor" });
    return;
  }

  try {
    const [contrib] = await db
      .insert(plannerContributorsTable)
      .values({
        plannerId,
        userId: user.id,
        role: role === "viewer" ? "viewer" : "editor",
      })
      .returning();

    res.status(201).json({
      ...contrib,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(400).json({ error: "This user is already a contributor" });
    } else {
      throw err;
    }
  }
});

// Update contributor role
router.patch("/planners/:id/contributors/:userId", async (req, res): Promise<void> => {
  const plannerId = parseInt(req.params.id, 10);
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(plannerId) || isNaN(userId)) {
    res.status(400).json({ error: "Invalid ids" });
    return;
  }

  const { role } = req.body ?? {};
  if (!role || !["viewer", "editor"].includes(role)) {
    res.status(400).json({ error: "role must be viewer or editor" });
    return;
  }

  const [updated] = await db
    .update(plannerContributorsTable)
    .set({ role })
    .where(and(
      eq(plannerContributorsTable.plannerId, plannerId),
      eq(plannerContributorsTable.userId, userId),
    ))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Contributor not found" });
    return;
  }

  res.json(updated);
});

// Remove a contributor
router.delete("/planners/:id/contributors/:userId", async (req, res): Promise<void> => {
  const plannerId = parseInt(req.params.id, 10);
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(plannerId) || isNaN(userId)) {
    res.status(400).json({ error: "Invalid ids" });
    return;
  }

  await db
    .delete(plannerContributorsTable)
    .where(and(
      eq(plannerContributorsTable.plannerId, plannerId),
      eq(plannerContributorsTable.userId, userId),
    ));

  res.status(204).send();
});

// ── Cards ─────────────────────────────────────────────────────────────────────

// Reorder cards — must come BEFORE /planners/:id/cards/:cardId
router.patch("/planners/:id/cards/reorder", async (req, res): Promise<void> => {
  const plannerId = parseInt(req.params.id, 10);
  const { order } = req.body as { order: number[] };
  if (!Array.isArray(order)) {
    res.status(400).json({ error: "order must be an array of card ids" });
    return;
  }
  await Promise.all(
    order.map((cardId, pos) =>
      db
        .update(plannerCardsTable)
        .set({ position: pos })
        .where(and(eq(plannerCardsTable.id, cardId), eq(plannerCardsTable.plannerId, plannerId)))
    )
  );
  res.json({ ok: true });
});

// Add a card
router.post("/planners/:id/cards", async (req, res): Promise<void> => {
  const plannerId = parseInt(req.params.id, 10);
  if (isNaN(plannerId)) {
    res.status(400).json({ error: "Invalid planner id" });
    return;
  }

  const existingCards = await db
    .select({ id: plannerCardsTable.id })
    .from(plannerCardsTable)
    .where(eq(plannerCardsTable.plannerId, plannerId));

  const b = req.body ?? {};

  const [card] = await db
    .insert(plannerCardsTable)
    .values({
      plannerId,
      position: existingCards.length,
      title: typeof b.title === "string" ? b.title : "Untitled",
      episodeNumber: b.episodeNumber ?? null,
      logline: b.logline ?? null,
      synopsis: b.synopsis ?? null,
      theme: b.theme ?? null,
      characterArc: b.characterArc ?? null,
      characters: b.characters ?? "[]",
      tags: b.tags ?? "[]",
      status: VALID_STATUS.includes(b.status) ? b.status : "draft",
      wordCount: Number(b.wordCount) || 0,
      targetWordCount: b.targetWordCount ? Number(b.targetWordCount) : null,
      assignee: b.assignee ?? null,
      dueDate: b.dueDate ?? null,
      notes: b.notes ?? null,
    })
    .returning();

  res.status(201).json(card);
});

// Update a card
router.patch("/planners/:id/cards/:cardId", async (req, res): Promise<void> => {
  const cardId = parseInt(req.params.cardId, 10);
  if (isNaN(cardId)) {
    res.status(400).json({ error: "Invalid card id" });
    return;
  }

  const b = req.body ?? {};
  const updates: Record<string, any> = {};

  if (b.title !== undefined) updates.title = b.title;
  if (b.episodeNumber !== undefined) updates.episodeNumber = b.episodeNumber;
  if (b.logline !== undefined) updates.logline = b.logline;
  if (b.synopsis !== undefined) updates.synopsis = b.synopsis;
  if (b.theme !== undefined) updates.theme = b.theme;
  if (b.characterArc !== undefined) updates.characterArc = b.characterArc;
  if (b.characters !== undefined) updates.characters = b.characters;
  if (b.tags !== undefined) updates.tags = b.tags;
  if (b.status !== undefined && VALID_STATUS.includes(b.status)) updates.status = b.status;
  if (b.wordCount !== undefined) updates.wordCount = Number(b.wordCount) || 0;
  if (b.targetWordCount !== undefined) updates.targetWordCount = b.targetWordCount ? Number(b.targetWordCount) : null;
  if (b.assignee !== undefined) updates.assignee = b.assignee;
  if (b.dueDate !== undefined) updates.dueDate = b.dueDate;
  if (b.notes !== undefined) updates.notes = b.notes;

  const [updated] = await db
    .update(plannerCardsTable)
    .set(updates)
    .where(eq(plannerCardsTable.id, cardId))
    .returning();

  res.json(updated);
});

// Delete a card
router.delete("/planners/:id/cards/:cardId", async (req, res): Promise<void> => {
  const cardId = parseInt(req.params.cardId, 10);
  if (isNaN(cardId)) {
    res.status(400).json({ error: "Invalid card id" });
    return;
  }
  await db.delete(plannerCardsTable).where(eq(plannerCardsTable.id, cardId));
  res.status(204).send();
});

export default router;
