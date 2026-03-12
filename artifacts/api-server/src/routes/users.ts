import { Router, type IRouter } from "express";
import { eq, or } from "drizzle-orm";
import { db, usersTable, suggestionsTable, projectsTable } from "@workspace/db";
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
