import { Router, type IRouter } from "express";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { db, projectsTable, usersTable, ratingsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/projects/search", async (req, res): Promise<void> => {
  const { q, type, userId } = req.query as { q?: string; type?: string; userId?: string };
  const uid = userId ? parseInt(userId, 10) : null;

  const conditions = [];
  if (type && (type === "book" || type === "script")) {
    conditions.push(eq(projectsTable.type, type));
  }
  if (q && q.trim()) {
    conditions.push(
      or(
        ilike(projectsTable.title, `%${q.trim()}%`),
        ilike(usersTable.name, `%${q.trim()}%`)
      )
    );
  }

  const rows = await db
    .select({
      id: projectsTable.id,
      title: projectsTable.title,
      type: projectsTable.type,
      ownerId: projectsTable.ownerId,
      ownerName: usersTable.name,
      isPublished: projectsTable.isPublished,
      publishedAt: projectsTable.publishedAt,
      publishVisibility: projectsTable.publishVisibility,
      feedbackEnabled: projectsTable.feedbackEnabled,
      feedbackAudience: projectsTable.feedbackAudience,
      feedbackVisibility: projectsTable.feedbackVisibility,
      createdAt: projectsTable.createdAt,
      feedbackCount: sql<number>`(SELECT COUNT(*) FROM feedback WHERE feedback.project_id = ${projectsTable.id})::int`.as("feedback_count"),
      avgRating: sql<number | null>`(SELECT AVG(rating)::float FROM ratings WHERE ratings.project_id = ${projectsTable.id})`.as("avg_rating"),
      ratingCount: sql<number>`(SELECT COUNT(*)::int FROM ratings WHERE ratings.project_id = ${projectsTable.id})`.as("rating_count"),
      userRating: uid
        ? sql<number | null>`(SELECT rating FROM ratings WHERE ratings.project_id = ${projectsTable.id} AND ratings.user_id = ${uid})`.as("user_rating")
        : sql<null>`NULL`.as("user_rating"),
    })
    .from(projectsTable)
    .leftJoin(usersTable, eq(projectsTable.ownerId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${projectsTable.createdAt} DESC`);

  res.json(rows);
});

router.post("/projects/:id/rate", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const userId = parseInt(req.body.userId, 10);
  const rating = parseInt(req.body.rating, 10);
  if (isNaN(projectId) || isNaN(userId) || isNaN(rating) || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  await db
    .insert(ratingsTable)
    .values({ projectId, userId, rating })
    .onConflictDoUpdate({
      target: [ratingsTable.projectId, ratingsTable.userId],
      set: { rating, updatedAt: new Date() },
    });

  const [stats] = await db
    .select({
      avgRating: sql<number>`AVG(rating)::float`.as("avg_rating"),
      ratingCount: sql<number>`COUNT(*)::int`.as("rating_count"),
    })
    .from(ratingsTable)
    .where(eq(ratingsTable.projectId, projectId));

  res.json({ avgRating: stats?.avgRating ?? null, ratingCount: stats?.ratingCount ?? 0, userRating: rating });
});

export default router;
