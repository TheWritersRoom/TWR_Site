import { Router, type IRouter } from "express";
import { eq, and, ilike, or, sql, desc, ne } from "drizzle-orm";
import { db, pitchesTable, pitchResponsesTable, usersTable, pitchInvitesTable } from "@workspace/db";

const router: IRouter = Router();

// GET /pitches — browse all pitches
router.get("/pitches", async (req, res): Promise<void> => {
  const { q, type, status } = req.query as { q?: string; type?: string; status?: string };

  const rows = await db
    .select({
      id: pitchesTable.id,
      title: pitchesTable.title,
      description: pitchesTable.description,
      type: pitchesTable.type,
      genres: pitchesTable.genres,
      status: pitchesTable.status,
      ownerId: pitchesTable.ownerId,
      ownerName: usersTable.name,
      createdAt: pitchesTable.createdAt,
      updatedAt: pitchesTable.updatedAt,
      feedbackCount: sql<number>`(SELECT COUNT(*)::int FROM pitch_responses WHERE pitch_responses.pitch_id = ${pitchesTable.id} AND pitch_responses.type = 'feedback')`.as("feedback_count"),
      interestCount: sql<number>`(SELECT COUNT(*)::int FROM pitch_responses WHERE pitch_responses.pitch_id = ${pitchesTable.id} AND pitch_responses.type = 'interest')`.as("interest_count"),
    })
    .from(pitchesTable)
    .leftJoin(usersTable, eq(pitchesTable.ownerId, usersTable.id))
    .orderBy(desc(pitchesTable.createdAt));

  let result = rows;
  if (q?.trim()) {
    const lq = q.trim().toLowerCase();
    result = result.filter(
      (r) =>
        r.title.toLowerCase().includes(lq) ||
        r.description.toLowerCase().includes(lq) ||
        (r.ownerName ?? "").toLowerCase().includes(lq)
    );
  }
  if (type && (type === "book" || type === "script" || type === "other")) {
    result = result.filter((r) => r.type === type);
  }
  if (status && (status === "open" || status === "closed")) {
    result = result.filter((r) => r.status === status);
  }

  res.json(result);
});

// GET /pitches/:id — single pitch with responses
router.get("/pitches/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [pitch] = await db
    .select({
      id: pitchesTable.id,
      title: pitchesTable.title,
      description: pitchesTable.description,
      type: pitchesTable.type,
      genres: pitchesTable.genres,
      status: pitchesTable.status,
      ownerId: pitchesTable.ownerId,
      ownerName: usersTable.name,
      createdAt: pitchesTable.createdAt,
      updatedAt: pitchesTable.updatedAt,
    })
    .from(pitchesTable)
    .leftJoin(usersTable, eq(pitchesTable.ownerId, usersTable.id))
    .where(eq(pitchesTable.id, id));

  if (!pitch) { res.status(404).json({ error: "Pitch not found" }); return; }

  const responses = await db
    .select({
      id: pitchResponsesTable.id,
      pitchId: pitchResponsesTable.pitchId,
      userId: pitchResponsesTable.userId,
      userName: usersTable.name,
      userRole: usersTable.role,
      type: pitchResponsesTable.type,
      message: pitchResponsesTable.message,
      createdAt: pitchResponsesTable.createdAt,
    })
    .from(pitchResponsesTable)
    .leftJoin(usersTable, eq(pitchResponsesTable.userId, usersTable.id))
    .where(eq(pitchResponsesTable.pitchId, id))
    .orderBy(pitchResponsesTable.createdAt);

  res.json({ ...pitch, responses });
});

// POST /pitches — create
router.post("/pitches", async (req, res): Promise<void> => {
  const { title, description, type, genres, userId } = req.body;
  if (!title || !description || !userId) {
    res.status(400).json({ error: "title, description, userId required" }); return;
  }
  const ownerId = parseInt(userId, 10);
  if (isNaN(ownerId)) { res.status(400).json({ error: "Invalid userId" }); return; }

  const [pitch] = await db
    .insert(pitchesTable)
    .values({
      title,
      description,
      type: (type === "book" || type === "script") ? type : "other",
      genres: genres ?? "[]",
      ownerId,
    })
    .returning();

  res.status(201).json(pitch);
});

// PATCH /pitches/:id — update (owner only)
router.patch("/pitches/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { userId, title, description, type, genres, status } = req.body;
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(pitchesTable).where(eq(pitchesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.ownerId !== parseInt(userId, 10)) { res.status(403).json({ error: "Forbidden" }); return; }

  const updates: Partial<typeof pitchesTable.$inferInsert> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (type !== undefined) updates.type = type;
  if (genres !== undefined) updates.genres = genres;
  if (status !== undefined) updates.status = status;

  const [updated] = await db.update(pitchesTable).set(updates).where(eq(pitchesTable.id, id)).returning();
  res.json(updated);
});

// DELETE /pitches/:id — owner only
router.delete("/pitches/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const userId = parseInt(req.body.userId ?? req.query.userId as string, 10);
  if (isNaN(id) || isNaN(userId)) { res.status(400).json({ error: "Invalid params" }); return; }

  const [existing] = await db.select().from(pitchesTable).where(eq(pitchesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(pitchResponsesTable).where(eq(pitchResponsesTable.pitchId, id));
  await db.delete(pitchesTable).where(eq(pitchesTable.id, id));
  res.json({ ok: true });
});

// POST /pitches/:id/respond — feedback or interest
router.post("/pitches/:id/respond", async (req, res): Promise<void> => {
  const pitchId = parseInt(req.params.id, 10);
  const { userId, type, message } = req.body;
  if (isNaN(pitchId) || !userId || !type) {
    res.status(400).json({ error: "pitchId, userId, type required" }); return;
  }
  if (type !== "feedback" && type !== "interest") {
    res.status(400).json({ error: "type must be feedback or interest" }); return;
  }
  const uid = parseInt(userId, 10);

  const [existing] = await db.select().from(pitchesTable).where(eq(pitchesTable.id, pitchId));
  if (!existing) { res.status(404).json({ error: "Pitch not found" }); return; }
  if (existing.ownerId === uid) { res.status(400).json({ error: "Owner cannot respond to own pitch" }); return; }

  const [response] = await db
    .insert(pitchResponsesTable)
    .values({ pitchId, userId: uid, type, message: message ?? "" })
    .returning();

  res.status(201).json(response);
});

// DELETE /pitches/:id/responses/:responseId
router.delete("/pitches/:id/responses/:responseId", async (req, res): Promise<void> => {
  const responseId = parseInt(req.params.responseId, 10);
  const userId = parseInt(req.body.userId ?? req.query.userId as string, 10);
  if (isNaN(responseId) || isNaN(userId)) { res.status(400).json({ error: "Invalid params" }); return; }

  const [existing] = await db.select().from(pitchResponsesTable).where(eq(pitchResponsesTable.id, responseId));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(pitchResponsesTable).where(eq(pitchResponsesTable.id, responseId));
  res.json({ ok: true });
});

// GET /pitches/:id/suggested-collaborators?userId=X
// Returns contributors open to approach whose genres overlap with the pitch's genres,
// excluding those already invited and the pitch owner.
router.get("/pitches/:id/suggested-collaborators", async (req, res): Promise<void> => {
  const pitchId = parseInt(req.params.id, 10);
  const userId = parseInt(req.query.userId as string, 10);
  if (isNaN(pitchId) || isNaN(userId)) { res.status(400).json({ error: "Invalid params" }); return; }

  const [pitch] = await db.select().from(pitchesTable).where(eq(pitchesTable.id, pitchId));
  if (!pitch) { res.status(404).json({ error: "Pitch not found" }); return; }
  if (pitch.ownerId !== userId) { res.status(403).json({ error: "Only the pitch owner can search for collaborators" }); return; }

  const pitchGenres: string[] = JSON.parse(pitch.genres ?? "[]");

  // Get already-invited user IDs for this pitch
  const existingInvites = await db
    .select({ toUserId: pitchInvitesTable.toUserId })
    .from(pitchInvitesTable)
    .where(eq(pitchInvitesTable.pitchId, pitchId));
  const invitedIds = new Set(existingInvites.map((i) => i.toUserId));

  // Fetch all contributors open to approach (excluding the pitch owner)
  const candidates = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      genres: usersTable.genres,
      mediaInterests: usersTable.mediaInterests,
      bio: usersTable.bio,
      credentials: usersTable.credentials,
      avatarUrl: usersTable.avatarUrl,
    })
    .from(usersTable)
    .where(
      and(
        or(eq(usersTable.role, "contributor"), eq(usersTable.role, "both")),
        eq(usersTable.openToApproach, true),
        ne(usersTable.id, userId),
      )
    );

  // Filter by genre overlap and exclude already-invited
  const results = candidates
    .filter((c) => !invitedIds.has(c.id))
    .map((c) => {
      const userGenres: string[] = JSON.parse(c.genres ?? "[]");
      const overlap = pitchGenres.filter((g) => userGenres.includes(g));
      return { ...c, matchingGenres: overlap, matchScore: overlap.length };
    })
    .filter((c) => pitchGenres.length === 0 || c.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  res.json(results);
});

// POST /pitches/:id/invite — send an invite to a contributor
router.post("/pitches/:id/invite", async (req, res): Promise<void> => {
  const pitchId = parseInt(req.params.id, 10);
  const { fromUserId, toUserId, message } = req.body as { fromUserId: number; toUserId: number; message?: string };
  if (isNaN(pitchId) || !fromUserId || !toUserId) { res.status(400).json({ error: "Invalid params" }); return; }

  const [pitch] = await db.select().from(pitchesTable).where(eq(pitchesTable.id, pitchId));
  if (!pitch) { res.status(404).json({ error: "Pitch not found" }); return; }
  if (pitch.ownerId !== fromUserId) { res.status(403).json({ error: "Only the pitch owner can send invites" }); return; }

  // Check for duplicate
  const [existing] = await db
    .select()
    .from(pitchInvitesTable)
    .where(and(eq(pitchInvitesTable.pitchId, pitchId), eq(pitchInvitesTable.toUserId, toUserId)));
  if (existing) { res.status(409).json({ error: "Already invited" }); return; }

  const [invite] = await db
    .insert(pitchInvitesTable)
    .values({ pitchId, fromUserId, toUserId, message: message ?? "" })
    .returning();

  res.status(201).json(invite);
});

// GET /pitches/:id/invites?userId=X — list invites for a pitch (owner only)
router.get("/pitches/:id/invites", async (req, res): Promise<void> => {
  const pitchId = parseInt(req.params.id, 10);
  const userId = parseInt(req.query.userId as string, 10);
  if (isNaN(pitchId) || isNaN(userId)) { res.status(400).json({ error: "Invalid params" }); return; }

  const [pitch] = await db.select().from(pitchesTable).where(eq(pitchesTable.id, pitchId));
  if (!pitch) { res.status(404).json({ error: "Pitch not found" }); return; }
  if (pitch.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const invites = await db
    .select({
      id: pitchInvitesTable.id,
      toUserId: pitchInvitesTable.toUserId,
      toUserName: usersTable.name,
      message: pitchInvitesTable.message,
      status: pitchInvitesTable.status,
      createdAt: pitchInvitesTable.createdAt,
    })
    .from(pitchInvitesTable)
    .innerJoin(usersTable, eq(pitchInvitesTable.toUserId, usersTable.id))
    .where(eq(pitchInvitesTable.pitchId, pitchId));

  res.json(invites);
});

// PATCH /pitch-invites/:id — accept or decline an invite (recipient only)
router.patch("/pitch-invites/:id", async (req, res): Promise<void> => {
  const inviteId = parseInt(req.params.id, 10);
  const { userId, status } = req.body as { userId: number; status: "accepted" | "declined" };
  if (isNaN(inviteId) || !userId || !["accepted", "declined"].includes(status)) {
    res.status(400).json({ error: "Invalid params" }); return;
  }

  const [invite] = await db.select().from(pitchInvitesTable).where(eq(pitchInvitesTable.id, inviteId));
  if (!invite) { res.status(404).json({ error: "Invite not found" }); return; }
  if (invite.toUserId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const [updated] = await db
    .update(pitchInvitesTable)
    .set({ status })
    .where(eq(pitchInvitesTable.id, inviteId))
    .returning();

  res.json(updated);
});

export default router;
