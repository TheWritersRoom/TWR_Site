import { Router, type IRouter } from "express";
import { eq, or, sql } from "drizzle-orm";
import { db, usersTable, suggestionsTable, projectsTable, pitchInvitesTable, pitchesTable } from "@workspace/db";
import { CreateUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email))
    .limit(1);

  if (existing.length > 0) {
    const user = existing[0];
    const [updated] = await db
      .update(usersTable)
      .set({
        role: parsed.data.role ?? user.role,
        genres: parsed.data.genres ?? user.genres,
        mediaInterests: parsed.data.mediaInterests ?? user.mediaInterests,
      })
      .where(eq(usersTable.id, user.id))
      .returning();
    res.status(201).json(updated);
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      genres: parsed.data.genres ?? "[]",
      mediaInterests: parsed.data.mediaInterests ?? "",
    })
    .returning();

  res.status(201).json(user);
});

router.get("/users/browse", async (req, res): Promise<void> => {
  const rows = await db
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
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(or(eq(usersTable.role, "contributor"), eq(usersTable.role, "both")));

  res.json(rows);
});

router.get("/users/:id/collaborator-stats", async (req, res): Promise<void> => {
  const authorId = parseInt(req.params.id, 10);
  if (isNaN(authorId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  // All projects this user owns
  const ownedProjects = await db
    .select({ id: projectsTable.id, title: projectsTable.title })
    .from(projectsTable)
    .where(eq(projectsTable.ownerId, authorId));

  if (ownedProjects.length === 0) {
    res.json([]);
    return;
  }

  const projectIds = ownedProjects.map((p) => p.id);
  const projectMap = Object.fromEntries(ownedProjects.map((p) => [p.id, p.title]));

  // All suggestions on those projects (excluding owner's own)
  const { inArray } = await import("drizzle-orm");
  const allSuggestions = await db
    .select({
      submitterId: suggestionsTable.submitterId,
      submitterName: usersTable.name,
      submitterEmail: usersTable.email,
      projectId: suggestionsTable.projectId,
      status: suggestionsTable.status,
    })
    .from(suggestionsTable)
    .innerJoin(usersTable, eq(suggestionsTable.submitterId, usersTable.id))
    .where(inArray(suggestionsTable.projectId, projectIds));

  // Aggregate per contributor
  const statsMap = new Map<number, {
    submitterId: number;
    submitterName: string;
    submitterEmail: string;
    total: number;
    accepted: number;
    discarded: number;
    pending: number;
    projectIds: Set<number>;
  }>();

  for (const row of allSuggestions) {
    if (row.submitterId === authorId) continue; // skip self
    if (!statsMap.has(row.submitterId)) {
      statsMap.set(row.submitterId, {
        submitterId: row.submitterId,
        submitterName: row.submitterName,
        submitterEmail: row.submitterEmail,
        total: 0,
        accepted: 0,
        discarded: 0,
        pending: 0,
        projectIds: new Set(),
      });
    }
    const entry = statsMap.get(row.submitterId)!;
    entry.total++;
    entry.projectIds.add(row.projectId);
    if (row.status === "accepted") entry.accepted++;
    else if (row.status === "discarded") entry.discarded++;
    else entry.pending++;
  }

  const result = Array.from(statsMap.values())
    .map((s) => ({
      submitterId: s.submitterId,
      submitterName: s.submitterName,
      submitterEmail: s.submitterEmail,
      total: s.total,
      accepted: s.accepted,
      discarded: s.discarded,
      pending: s.pending,
      acceptRate: s.total > 0 ? Math.round((s.accepted / s.total) * 100) : 0,
      projectsTogether: Array.from(s.projectIds).map((pid) => ({
        id: pid,
        title: projectMap[pid] ?? "Unknown",
      })),
    }))
    .sort((a, b) => b.acceptRate - a.acceptRate || b.total - a.total);

  res.json(result);
});

router.get("/projects/:id/contributor-stats", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const allSuggestions = await db
    .select({
      submitterId: suggestionsTable.submitterId,
      submitterName: usersTable.name,
      submitterEmail: usersTable.email,
      status: suggestionsTable.status,
      createdAt: suggestionsTable.createdAt,
    })
    .from(suggestionsTable)
    .innerJoin(usersTable, eq(suggestionsTable.submitterId, usersTable.id))
    .where(eq(suggestionsTable.projectId, projectId));

  const statsMap = new Map<number, {
    submitterId: number;
    submitterName: string;
    submitterEmail: string;
    total: number;
    accepted: number;
    discarded: number;
    pending: number;
    firstAt: string;
    lastAt: string;
  }>();

  for (const row of allSuggestions) {
    if (row.submitterId === project.ownerId) continue;
    if (!statsMap.has(row.submitterId)) {
      statsMap.set(row.submitterId, {
        submitterId: row.submitterId,
        submitterName: row.submitterName,
        submitterEmail: row.submitterEmail,
        total: 0,
        accepted: 0,
        discarded: 0,
        pending: 0,
        firstAt: row.createdAt.toISOString(),
        lastAt: row.createdAt.toISOString(),
      });
    }
    const entry = statsMap.get(row.submitterId)!;
    entry.total++;
    const ts = row.createdAt.toISOString();
    if (ts < entry.firstAt) entry.firstAt = ts;
    if (ts > entry.lastAt) entry.lastAt = ts;
    if (row.status === "accepted") entry.accepted++;
    else if (row.status === "discarded") entry.discarded++;
    else entry.pending++;
  }

  const result = Array.from(statsMap.values())
    .map((s) => ({
      ...s,
      acceptRate: s.total > 0 ? Math.round((s.accepted / s.total) * 100) : 0,
    }))
    .sort((a, b) => b.acceptRate - a.acceptRate || b.total - a.total);

  res.json(result);
});

router.get("/users/:id/activity", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const rows = await db
    .select({
      id: suggestionsTable.id,
      projectId: suggestionsTable.projectId,
      projectTitle: projectsTable.title,
      projectType: projectsTable.type,
      originalText: suggestionsTable.originalText,
      suggestedText: suggestionsTable.suggestedText,
      comment: suggestionsTable.comment,
      status: suggestionsTable.status,
      ownerNote: suggestionsTable.ownerNote,
      createdAt: suggestionsTable.createdAt,
      updatedAt: suggestionsTable.updatedAt,
    })
    .from(suggestionsTable)
    .innerJoin(projectsTable, eq(suggestionsTable.projectId, projectsTable.id))
    .where(eq(suggestionsTable.submitterId, userId))
    .orderBy(suggestionsTable.createdAt);

  res.json(rows);
});

// PATCH /users/:id — update editable profile fields
router.patch("/users/:id", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }

  const { name, bio, mediaInterests, genres, credentials, avatarUrl } = req.body as {
    name?: string;
    bio?: string;
    mediaInterests?: string;
    genres?: string;
    credentials?: string;
    avatarUrl?: string;
  };

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (bio !== undefined) updates.bio = bio;
  if (mediaInterests !== undefined) updates.mediaInterests = mediaInterests;
  if (genres !== undefined) updates.genres = genres;
  if (credentials !== undefined) updates.credentials = credentials;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" }); return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
    .returning();

  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(updated);
});

// PATCH /users/:id/profile-public — toggle public profile visibility
router.patch("/users/:id/profile-public", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  const { profilePublic } = req.body as { profilePublic: boolean };
  if (isNaN(userId) || typeof profilePublic !== "boolean") {
    res.status(400).json({ error: "Invalid params" }); return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ profilePublic })
    .where(eq(usersTable.id, userId))
    .returning();

  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(updated);
});

// PATCH /users/:id/open-to-approach — toggle open-to-approach flag
router.patch("/users/:id/open-to-approach", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  const { openToApproach } = req.body as { openToApproach: boolean };
  if (isNaN(userId) || typeof openToApproach !== "boolean") {
    res.status(400).json({ error: "Invalid params" }); return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ openToApproach })
    .where(eq(usersTable.id, userId))
    .returning();

  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(updated);
});

// GET /users/:id/pitch-invites — invites received by a contributor
router.get("/users/:id/pitch-invites", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }

  const invites = await db
    .select({
      id: pitchInvitesTable.id,
      pitchId: pitchInvitesTable.pitchId,
      pitchTitle: pitchesTable.title,
      pitchType: pitchesTable.type,
      pitchGenres: pitchesTable.genres,
      fromUserId: pitchInvitesTable.fromUserId,
      fromUserName: usersTable.name,
      message: pitchInvitesTable.message,
      status: pitchInvitesTable.status,
      createdAt: pitchInvitesTable.createdAt,
    })
    .from(pitchInvitesTable)
    .innerJoin(pitchesTable, eq(pitchInvitesTable.pitchId, pitchesTable.id))
    .innerJoin(usersTable, eq(pitchInvitesTable.fromUserId, usersTable.id))
    .where(eq(pitchInvitesTable.toUserId, userId))
    .orderBy(pitchInvitesTable.createdAt);

  res.json(invites);
});

// GET /contributors/search — filtered contributor discovery with stats
router.get("/contributors/search", async (req, res): Promise<void> => {
  const { q, genres, specialties, available, experience } = req.query;

  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      role: usersTable.role,
      genres: usersTable.genres,
      mediaInterests: usersTable.mediaInterests,
      bio: usersTable.bio,
      credentials: usersTable.credentials,
      avatarUrl: usersTable.avatarUrl,
      openToApproach: usersTable.openToApproach,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(or(eq(usersTable.role, "contributor"), eq(usersTable.role, "both")));

  const statsRows = await db
    .select({
      submitterId: suggestionsTable.submitterId,
      total: sql<number>`count(*)::int`.as("total"),
      accepted: sql<number>`count(case when ${suggestionsTable.status} = 'accepted' then 1 end)::int`.as("accepted"),
    })
    .from(suggestionsTable)
    .groupBy(suggestionsTable.submitterId);

  const statsMap = new Map(statsRows.map((s) => [s.submitterId, s]));

  let enriched = rows.map((r) => {
    let creds: Record<string, unknown> = {};
    try { creds = JSON.parse(r.credentials ?? "{}"); } catch { /* ignore */ }
    const stats = statsMap.get(r.id);
    const total = stats?.total ?? 0;
    const accepted = stats?.accepted ?? 0;
    return {
      ...r,
      totalSuggestions: total,
      acceptRate: total > 0 ? Math.round((accepted / total) * 100) : null,
      editingSpecialties: (creds.editingSpecialties as string[]) ?? [],
      availableForWork: (creds.availableForWork as boolean) ?? false,
      experienceLevel: (creds.experienceLevel as string) ?? null,
      professionalTitle: (creds.professionalTitle as string) ?? null,
      isPublishedAuthor: (creds.isPublishedAuthor as boolean) ?? false,
    };
  });

  if (q && typeof q === "string") {
    const lq = q.toLowerCase();
    enriched = enriched.filter((c) =>
      c.name.toLowerCase().includes(lq) ||
      (c.bio ?? "").toLowerCase().includes(lq) ||
      (c.mediaInterests ?? "").toLowerCase().includes(lq) ||
      (c.professionalTitle ?? "").toLowerCase().includes(lq) ||
      c.editingSpecialties.some((s: string) => s.toLowerCase().includes(lq))
    );
  }

  if (genres && typeof genres === "string") {
    const gList = genres.split(",").map((g) => g.trim()).filter(Boolean);
    enriched = enriched.filter((c) => {
      let cGenres: string[] = [];
      try { cGenres = JSON.parse(c.genres ?? "[]"); } catch { /* ignore */ }
      return gList.some((g) => cGenres.includes(g));
    });
  }

  if (specialties && typeof specialties === "string") {
    const sList = specialties.split(",").map((s) => s.trim()).filter(Boolean);
    enriched = enriched.filter((c) => sList.some((s) => c.editingSpecialties.includes(s)));
  }

  if (available === "true") {
    enriched = enriched.filter((c) => c.availableForWork);
  }

  if (experience && typeof experience === "string") {
    enriched = enriched.filter((c) => c.experienceLevel === experience);
  }

  enriched.sort((a, b) => {
    if (a.availableForWork !== b.availableForWork) return a.availableForWork ? -1 : 1;
    return (b.totalSuggestions - a.totalSuggestions) || ((b.acceptRate ?? 0) - (a.acceptRate ?? 0));
  });

  res.json(enriched);
});

// GET /users/:id/public — safe public profile (no email)
router.get("/users/:id/public", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }

  const [user] = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    role: usersTable.role,
    genres: usersTable.genres,
    mediaInterests: usersTable.mediaInterests,
    bio: usersTable.bio,
    credentials: usersTable.credentials,
    avatarUrl: usersTable.avatarUrl,
    openToApproach: usersTable.openToApproach,
    profilePublic: usersTable.profilePublic,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const statsRows = await db.select({
    total: sql<number>`count(*)::int`.as("total"),
    accepted: sql<number>`count(case when ${suggestionsTable.status} = 'accepted' then 1 end)::int`.as("accepted"),
  }).from(suggestionsTable).where(eq(suggestionsTable.submitterId, userId));

  const stats = statsRows[0] ?? { total: 0, accepted: 0 };

  res.json({
    ...user,
    totalSuggestions: stats.total,
    acceptRate: stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : null,
  });
});

router.get("/users/me", async (req, res): Promise<void> => {
  const email = req.query.email as string;
  if (!email) {
    res.status(404).json({ error: "No email provided" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

export default router;
