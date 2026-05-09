import { Router, type IRouter } from "express";
import { desc, eq, isNotNull } from "drizzle-orm";
import { db, usersTable, projectsTable, feedbackTable } from "@workspace/db";
import { requireAdmin } from "../middleware/require-admin";

const router: IRouter = Router();

router.get("/admin/activity", requireAdmin, async (_req, res): Promise<void> => {
  const LIMIT = 25;

  const [recentUsers, recentPublications, recentFeedback] = await Promise.all([
    db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(LIMIT),

    db
      .select({
        id: projectsTable.id,
        title: projectsTable.title,
        publishedAt: projectsTable.publishedAt,
        ownerName: usersTable.name,
      })
      .from(projectsTable)
      .innerJoin(usersTable, eq(projectsTable.ownerId, usersTable.id))
      .where(isNotNull(projectsTable.publishedAt))
      .orderBy(desc(projectsTable.publishedAt))
      .limit(LIMIT),

    db
      .select({
        id: feedbackTable.id,
        content: feedbackTable.content,
        createdAt: feedbackTable.createdAt,
        authorName: usersTable.name,
        projectTitle: projectsTable.title,
      })
      .from(feedbackTable)
      .innerJoin(usersTable, eq(feedbackTable.userId, usersTable.id))
      .innerJoin(projectsTable, eq(feedbackTable.projectId, projectsTable.id))
      .orderBy(desc(feedbackTable.createdAt))
      .limit(LIMIT),
  ]);

  type ActivityEvent = {
    type: "user_joined" | "project_published" | "feedback_submitted";
    actorName: string;
    targetTitle?: string;
    timestamp: string;
  };

  const events: ActivityEvent[] = [
    ...recentUsers.map((u) => ({
      type: "user_joined" as const,
      actorName: u.name,
      timestamp: u.createdAt.toISOString(),
    })),
    ...recentPublications.map((p) => ({
      type: "project_published" as const,
      actorName: p.ownerName,
      targetTitle: p.title,
      timestamp: p.publishedAt!.toISOString(),
    })),
    ...recentFeedback.map((f) => ({
      type: "feedback_submitted" as const,
      actorName: f.authorName,
      targetTitle: f.projectTitle,
      timestamp: f.createdAt.toISOString(),
    })),
  ];

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json(events.slice(0, LIMIT));
});

router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      isAdmin: usersTable.isAdmin,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(usersTable.createdAt);

  res.json(rows);
});

router.patch("/admin/users/:id/admin", requireAdmin, async (req, res): Promise<void> => {
  const targetId = parseInt(req.params.id, 10);
  if (isNaN(targetId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  if (req.adminUserId === targetId) {
    res.status(403).json({ error: "You cannot change your own admin status" });
    return;
  }

  const { isAdmin } = req.body;
  if (typeof isAdmin !== "boolean") {
    res.status(400).json({ error: "isAdmin must be a boolean" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ isAdmin })
    .where(eq(usersTable.id, targetId))
    .returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      isAdmin: usersTable.isAdmin,
      createdAt: usersTable.createdAt,
    });

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(updated);
});

export default router;
