import { Router, type IRouter } from "express";
import { desc, eq, isNotNull, sql, count, or } from "drizzle-orm";
import { db, usersTable, projectsTable, feedbackTable, collaboratorsTable, suggestionsTable, referredUsersTable, messagesTable, bookmarksTable, plannersTable, ratingsTable, joinRequestsTable, pitchResponsesTable } from "@workspace/db";
import { requireAdmin } from "../middleware/require-admin";
import { awardInk } from "../lib/ink";

const router: IRouter = Router();

// ── Platform stats ──────────────────────────────────────────────────────────

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [[userCount], [projectCount], [publishedCount], [suggestionCount], [acceptedCount], [collabCount]] =
    await Promise.all([
      db.select({ n: count() }).from(usersTable),
      db.select({ n: count() }).from(projectsTable),
      db.select({ n: count() }).from(projectsTable).where(isNotNull(projectsTable.publishedAt)),
      db.select({ n: count() }).from(suggestionsTable),
      db.select({ n: count() }).from(suggestionsTable).where(eq(suggestionsTable.status, "accepted")),
      db.select({ n: count() }).from(collaboratorsTable),
    ]);

  res.json({
    totalUsers: Number(userCount.n),
    totalProjects: Number(projectCount.n),
    publishedProjects: Number(publishedCount.n),
    totalSuggestions: Number(suggestionCount.n),
    acceptedSuggestions: Number(acceptedCount.n),
    totalCollaborations: Number(collabCount.n),
  });
});

// ── Activity feed ───────────────────────────────────────────────────────────

router.get("/admin/activity", requireAdmin, async (_req, res): Promise<void> => {
  const LIMIT = 50;

  const [recentUsers, recentPublications, recentFeedback] = await Promise.all([
    db.select({ id: usersTable.id, name: usersTable.name, createdAt: usersTable.createdAt })
      .from(usersTable).orderBy(desc(usersTable.createdAt)).limit(LIMIT),

    db.select({ id: projectsTable.id, title: projectsTable.title, publishedAt: projectsTable.publishedAt, ownerName: usersTable.name })
      .from(projectsTable)
      .innerJoin(usersTable, eq(projectsTable.ownerId, usersTable.id))
      .where(isNotNull(projectsTable.publishedAt))
      .orderBy(desc(projectsTable.publishedAt)).limit(LIMIT),

    db.select({ id: feedbackTable.id, createdAt: feedbackTable.createdAt, authorName: usersTable.name, projectTitle: projectsTable.title })
      .from(feedbackTable)
      .innerJoin(usersTable, eq(feedbackTable.userId, usersTable.id))
      .innerJoin(projectsTable, eq(feedbackTable.projectId, projectsTable.id))
      .orderBy(desc(feedbackTable.createdAt)).limit(LIMIT),
  ]);

  type ActivityEvent = {
    type: "user_joined" | "project_published" | "feedback_submitted";
    actorName: string;
    targetTitle?: string;
    timestamp: string;
  };

  const events: ActivityEvent[] = [
    ...recentUsers.map(u => ({ type: "user_joined" as const, actorName: u.name, timestamp: u.createdAt.toISOString() })),
    ...recentPublications.map(p => ({ type: "project_published" as const, actorName: p.ownerName, targetTitle: p.title, timestamp: p.publishedAt!.toISOString() })),
    ...recentFeedback.map(f => ({ type: "feedback_submitted" as const, actorName: f.authorName, targetTitle: f.projectTitle, timestamp: f.createdAt.toISOString() })),
  ];

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(events.slice(0, LIMIT));
});

// ── Users list with per-user stats ──────────────────────────────────────────

router.get("/admin/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      bio: usersTable.bio,
      isAdmin: usersTable.isAdmin,
      subscriptionTier: usersTable.subscriptionTier,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));

  const [projectCounts, collabCounts, suggestionCounts, acceptedCounts] = await Promise.all([
    db.select({ userId: projectsTable.ownerId, n: count() })
      .from(projectsTable).groupBy(projectsTable.ownerId),

    db.select({ userId: collaboratorsTable.userId, n: count() })
      .from(collaboratorsTable).groupBy(collaboratorsTable.userId),

    db.select({ userId: suggestionsTable.submitterId, n: count() })
      .from(suggestionsTable).groupBy(suggestionsTable.submitterId),

    db.select({ userId: suggestionsTable.submitterId, n: count() })
      .from(suggestionsTable)
      .where(eq(suggestionsTable.status, "accepted"))
      .groupBy(suggestionsTable.submitterId),
  ]);

  const pMap = new Map(projectCounts.map(r => [r.userId, Number(r.n)]));
  const cMap = new Map(collabCounts.map(r => [r.userId, Number(r.n)]));
  const sMap = new Map(suggestionCounts.map(r => [r.userId, Number(r.n)]));
  const aMap = new Map(acceptedCounts.map(r => [r.userId, Number(r.n)]));

  const result = users.map(u => ({
    ...u,
    projectCount: pMap.get(u.id) ?? 0,
    collaborationCount: cMap.get(u.id) ?? 0,
    suggestionCount: sMap.get(u.id) ?? 0,
    acceptedCount: aMap.get(u.id) ?? 0,
  }));

  res.json(result);
});

// ── Set subscription tier ────────────────────────────────────────────────────

router.patch("/admin/users/:id/tier", requireAdmin, async (req, res): Promise<void> => {
  const targetId = parseInt(req.params.id, 10);
  if (isNaN(targetId)) { res.status(400).json({ error: "Invalid user id" }); return; }

  const { subscriptionTier } = req.body;
  if (!["free", "pro"].includes(subscriptionTier)) {
    res.status(400).json({ error: "subscriptionTier must be 'free' or 'pro'" });
    return;
  }

  const [updated] = await db.update(usersTable).set({ subscriptionTier })
    .where(eq(usersTable.id, targetId))
    .returning({ id: usersTable.id, name: usersTable.name, email: usersTable.email, subscriptionTier: usersTable.subscriptionTier });

  if (!updated) { res.status(404).json({ error: "User not found" }); return; }

  // If upgrading to Pro, award the Pro ink bonus to whoever referred this user
  if (subscriptionTier === "pro") {
    const [referral] = await db
      .select()
      .from(referredUsersTable)
      .where(eq(referredUsersTable.referredId, targetId));
    if (referral && !referral.proInkAwarded) {
      await awardInk(referral.referrerId, 50, "referral_pro_upgrade").catch(() => {});
      await db.update(referredUsersTable)
        .set({ proInkAwarded: true })
        .where(eq(referredUsersTable.id, referral.id));
    }
  }

  res.json(updated);
});

// ── Toggle admin ─────────────────────────────────────────────────────────────

router.patch("/admin/users/:id/admin", requireAdmin, async (req, res): Promise<void> => {
  const targetId = parseInt(req.params.id, 10);
  if (isNaN(targetId)) { res.status(400).json({ error: "Invalid user id" }); return; }
  if (req.adminUserId === targetId) { res.status(403).json({ error: "You cannot change your own admin status" }); return; }

  const { isAdmin } = req.body;
  if (typeof isAdmin !== "boolean") { res.status(400).json({ error: "isAdmin must be a boolean" }); return; }

  const [updated] = await db.update(usersTable).set({ isAdmin })
    .where(eq(usersTable.id, targetId))
    .returning({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, isAdmin: usersTable.isAdmin, createdAt: usersTable.createdAt });

  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(updated);
});

// ── All project feedback ──────────────────────────────────────────────────────

router.get("/admin/feedback", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: feedbackTable.id,
      content: feedbackTable.content,
      createdAt: feedbackTable.createdAt,
      userName: usersTable.name,
      userEmail: usersTable.email,
      userId: usersTable.id,
      projectTitle: projectsTable.title,
      projectId: projectsTable.id,
    })
    .from(feedbackTable)
    .innerJoin(usersTable, eq(feedbackTable.userId, usersTable.id))
    .innerJoin(projectsTable, eq(feedbackTable.projectId, projectsTable.id))
    .orderBy(desc(feedbackTable.createdAt));

  res.json(rows);
});

// ── Delete user ───────────────────────────────────────────────────────────────

router.delete("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const targetId = parseInt(req.params.id, 10);
  if (isNaN(targetId)) { res.status(400).json({ error: "Invalid user id" }); return; }
  if (req.adminUserId === targetId) { res.status(403).json({ error: "You cannot delete your own account from the admin panel" }); return; }

  try {
    // Delete child records without ON DELETE CASCADE, in dependency order
    await db.delete(messagesTable).where(or(eq(messagesTable.fromUserId, targetId), eq(messagesTable.toUserId, targetId)));
    await db.delete(bookmarksTable).where(or(eq(bookmarksTable.authorId, targetId), eq(bookmarksTable.contributorId, targetId)));
    await db.delete(pitchResponsesTable).where(eq(pitchResponsesTable.userId, targetId));
    await db.delete(ratingsTable).where(eq(ratingsTable.userId, targetId));
    await db.delete(joinRequestsTable).where(eq(joinRequestsTable.userId, targetId));
    await db.delete(suggestionsTable).where(eq(suggestionsTable.submitterId, targetId));
    await db.delete(plannersTable).where(eq(plannersTable.ownerId, targetId));
    await db.delete(projectsTable).where(eq(projectsTable.ownerId, targetId));
    // Delete the user — cascades auth-tokens, sessions, ink, referrals, pitch-invites, collaborators
    const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, targetId)).returning({ id: usersTable.id });
    if (!deleted) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin] Failed to delete user:", targetId, err);
    res.status(500).json({ error: "Failed to delete user. Please try again." });
  }
});

export default router;
