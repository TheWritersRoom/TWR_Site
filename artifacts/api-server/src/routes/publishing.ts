import { Router, type IRouter } from "express";
import { eq, and, desc, inArray, sql, count } from "drizzle-orm";
import { db, projectsTable, usersTable, collaboratorsTable, feedbackTable } from "@workspace/db";

const router: IRouter = Router();

const BOOK_GENRES = [
  "Long-form Fiction", "Non-fiction", "Short Story", "Poetry", "Fan Fiction",
  "Graphic Novel / Comics", "Children's Literature", "Literary Fiction",
  "Thriller / Mystery", "Romance", "Science Fiction / Fantasy", "Horror",
];
const SCRIPT_GENRES = ["Film & TV Script", "Screenwriting"];

function isMatchedUser(userGenres: string | null, projectType: string): boolean {
  if (!userGenres) return false;
  try {
    const genres: string[] = JSON.parse(userGenres);
    const targetGenres = projectType === "script" ? SCRIPT_GENRES : BOOK_GENRES;
    return genres.some((g) => targetGenres.includes(g));
  } catch {
    return false;
  }
}

async function checkCanAccess(
  userId: number,
  project: typeof projectsTable.$inferSelect,
  user: typeof usersTable.$inferSelect | null
): Promise<boolean> {
  if (!project.isPublished) return false;
  if (project.ownerId === userId) return true;

  switch (project.publishVisibility) {
    case "all":
      return true;
    case "matched":
      return isMatchedUser(user?.genres ?? null, project.type);
    case "contributors": {
      const [collab] = await db
        .select({ id: collaboratorsTable.id })
        .from(collaboratorsTable)
        .where(and(eq(collaboratorsTable.projectId, project.id), eq(collaboratorsTable.userId, userId)));
      return !!collab;
    }
    default:
      return false;
  }
}

async function checkCanGiveFeedback(
  userId: number,
  project: typeof projectsTable.$inferSelect,
  user: typeof usersTable.$inferSelect | null
): Promise<boolean> {
  if (!project.isPublished || !project.feedbackEnabled) return false;
  if (project.ownerId === userId) return false;

  switch (project.feedbackAudience) {
    case "all":
      return true;
    case "matched":
      return isMatchedUser(user?.genres ?? null, project.type);
    case "contributors": {
      const [collab] = await db
        .select({ id: collaboratorsTable.id })
        .from(collaboratorsTable)
        .where(and(eq(collaboratorsTable.projectId, project.id), eq(collaboratorsTable.userId, userId)));
      return !!collab;
    }
    default:
      return false;
  }
}

router.post("/projects/:id/publish", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const { userId, publishVisibility, feedbackEnabled, feedbackAudience, feedbackVisibility } = req.body;

  if (!userId || !publishVisibility || feedbackEnabled == null || !feedbackAudience || !feedbackVisibility) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.ownerId !== userId) { res.status(403).json({ error: "Only the owner can publish" }); return; }

  const [updated] = await db
    .update(projectsTable)
    .set({
      isPublished: true,
      publishedAt: new Date(),
      publishVisibility,
      feedbackEnabled,
      feedbackAudience,
      feedbackVisibility,
    })
    .where(eq(projectsTable.id, projectId))
    .returning();

  const [owner] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, updated.ownerId));

  res.json({
    ...updated,
    ownerName: owner?.name ?? "",
    role: "owner",
    canGiveFeedback: false,
  });
});

router.post("/projects/:id/unpublish", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const { userId } = req.body;
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.ownerId !== userId) { res.status(403).json({ error: "Only the owner can unpublish" }); return; }

  const [updated] = await db
    .update(projectsTable)
    .set({ isPublished: false, publishedAt: null })
    .where(eq(projectsTable.id, projectId))
    .returning();

  const [owner] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, updated.ownerId));

  res.json({ ...updated, ownerName: owner?.name ?? "", role: "owner", canGiveFeedback: false });
});

router.get("/projects/discover", async (req, res): Promise<void> => {
  const userId = parseInt(req.query.userId as string, 10);
  if (isNaN(userId)) { res.status(400).json({ error: "userId required" }); return; }

  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  const published = await db
    .select({
      id: projectsTable.id,
      title: projectsTable.title,
      type: projectsTable.type,
      ownerId: projectsTable.ownerId,
      ownerName: usersTable.name,
      publishedAt: projectsTable.publishedAt,
      publishVisibility: projectsTable.publishVisibility,
      feedbackEnabled: projectsTable.feedbackEnabled,
      feedbackAudience: projectsTable.feedbackAudience,
      feedbackVisibility: projectsTable.feedbackVisibility,
      genres: usersTable.genres,
      createdAt: projectsTable.createdAt,
    })
    .from(projectsTable)
    .innerJoin(usersTable, eq(projectsTable.ownerId, usersTable.id))
    .where(and(eq(projectsTable.isPublished, true)));

  const results = [];
  for (const p of published) {
    if (p.ownerId === userId) continue; // skip own projects

    const canAccess = await checkCanAccess(userId, { ...p, content: "", isPublished: true, updatedAt: new Date() } as typeof projectsTable.$inferSelect, currentUser ?? null);
    if (!canAccess) continue;

    const canGiveFeedback = await checkCanGiveFeedback(userId, { ...p, content: "", isPublished: true, updatedAt: new Date() } as typeof projectsTable.$inferSelect, currentUser ?? null);

    const [feedbackCountRow] = await db
      .select({ cnt: count(feedbackTable.id) })
      .from(feedbackTable)
      .where(eq(feedbackTable.projectId, p.id));

    results.push({
      id: p.id,
      title: p.title,
      type: p.type,
      ownerId: p.ownerId,
      ownerName: p.ownerName,
      publishedAt: p.publishedAt!.toISOString(),
      publishVisibility: p.publishVisibility,
      feedbackEnabled: p.feedbackEnabled,
      feedbackAudience: p.feedbackAudience,
      feedbackVisibility: p.feedbackVisibility,
      canGiveFeedback,
      feedbackCount: feedbackCountRow?.cnt ?? 0,
      createdAt: p.createdAt.toISOString(),
    });
  }

  res.json(results);
});

router.get("/projects/:id/feedback", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const userId = parseInt(req.query.userId as string, 10);
  if (isNaN(projectId) || isNaN(userId)) { res.status(400).json({ error: "Invalid params" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const isOwner = project.ownerId === userId;

  if (!isOwner && project.feedbackVisibility === "private") {
    res.status(403).json({ error: "Feedback is private" });
    return;
  }

  const rows = await db
    .select({
      id: feedbackTable.id,
      projectId: feedbackTable.projectId,
      userId: feedbackTable.userId,
      userName: usersTable.name,
      content: feedbackTable.content,
      createdAt: feedbackTable.createdAt,
    })
    .from(feedbackTable)
    .innerJoin(usersTable, eq(feedbackTable.userId, usersTable.id))
    .where(eq(feedbackTable.projectId, projectId))
    .orderBy(desc(feedbackTable.createdAt));

  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/projects/:id/feedback", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const { userId, content } = req.body;
  if (!userId || !content?.trim()) { res.status(400).json({ error: "userId and content required" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const canFeedback = await checkCanGiveFeedback(userId, project, currentUser ?? null);

  if (!canFeedback) {
    res.status(403).json({ error: "You are not allowed to give feedback on this project" });
    return;
  }

  const [row] = await db
    .insert(feedbackTable)
    .values({ projectId, userId, content: content.trim() })
    .returning();

  res.status(201).json({
    ...row,
    userName: currentUser?.name ?? "",
    createdAt: row.createdAt.toISOString(),
  });
});

export default router;
