import { Router, type IRouter } from "express";
import { eq, and, or, count, sql } from "drizzle-orm";
import { db, projectsTable, usersTable, collaboratorsTable, suggestionsTable, joinRequestsTable } from "@workspace/db";
import {
  CreateProjectBody,
  UpdateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  DeleteProjectParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/projects", async (req, res): Promise<void> => {
  const userId = parseInt(req.query.userId as string, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "userId query param required" });
    return;
  }

  const publishingFields = {
    isPublished: projectsTable.isPublished,
    publishedAt: projectsTable.publishedAt,
    publishVisibility: projectsTable.publishVisibility,
    feedbackEnabled: projectsTable.feedbackEnabled,
    feedbackAudience: projectsTable.feedbackAudience,
    feedbackVisibility: projectsTable.feedbackVisibility,
  };

  const owned = await db
    .select({
      id: projectsTable.id,
      title: projectsTable.title,
      type: projectsTable.type,
      ownerId: projectsTable.ownerId,
      ownerName: usersTable.name,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
      ...publishingFields,
    })
    .from(projectsTable)
    .innerJoin(usersTable, eq(projectsTable.ownerId, usersTable.id))
    .where(eq(projectsTable.ownerId, userId));

  const collaborated = await db
    .select({
      id: projectsTable.id,
      title: projectsTable.title,
      type: projectsTable.type,
      ownerId: projectsTable.ownerId,
      ownerName: usersTable.name,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
      ...publishingFields,
    })
    .from(collaboratorsTable)
    .innerJoin(projectsTable, eq(collaboratorsTable.projectId, projectsTable.id))
    .innerJoin(usersTable, eq(projectsTable.ownerId, usersTable.id))
    .where(eq(collaboratorsTable.userId, userId));

  const allProjects = [...owned, ...collaborated];
  const projectIds = allProjects.map(p => p.id);

  const pendingCounts: Record<number, number> = {};
  const collabCounts: Record<number, number> = {};

  if (projectIds.length > 0) {
    const pendingRows = await db
      .select({
        projectId: suggestionsTable.projectId,
        cnt: count(suggestionsTable.id),
      })
      .from(suggestionsTable)
      .where(and(
        eq(suggestionsTable.status, "pending"),
        sql`${suggestionsTable.projectId} = ANY(${sql.raw(`ARRAY[${projectIds.join(",")}]::int[]`)})`
      ))
      .groupBy(suggestionsTable.projectId);

    for (const row of pendingRows) {
      pendingCounts[row.projectId] = row.cnt;
    }

    const collabRows = await db
      .select({
        projectId: collaboratorsTable.projectId,
        cnt: count(collaboratorsTable.id),
      })
      .from(collaboratorsTable)
      .where(sql`${collaboratorsTable.projectId} = ANY(${sql.raw(`ARRAY[${projectIds.join(",")}]::int[]`)})`)
      .groupBy(collaboratorsTable.projectId);

    for (const row of collabRows) {
      collabCounts[row.projectId] = row.cnt;
    }
  }

  const result = allProjects.map(p => ({
    ...p,
    pendingSuggestionsCount: pendingCounts[p.id] ?? 0,
    collaboratorsCount: collabCounts[p.id] ?? 0,
  }));

  res.json(result);
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId, ...projectData } = parsed.data;

  const rawLimit = parseInt(req.body.collaboratorLimit, 10);
  const collaboratorLimit = !isNaN(rawLimit) && rawLimit >= 1 && rawLimit <= 50 ? rawLimit : 6;

  const [project] = await db
    .insert(projectsTable)
    .values({ ...projectData, ownerId: userId, collaboratorLimit })
    .returning();

  const [owner] = await db
    .select({ name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, project.ownerId));

  res.status(201).json({
    ...project,
    ownerName: owner?.name ?? "",
    pendingSuggestionsCount: 0,
    collaboratorsCount: 0,
  });
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = parseInt(req.query.userId as string, 10);

  const [project] = await db
    .select({
      id: projectsTable.id,
      title: projectsTable.title,
      type: projectsTable.type,
      content: projectsTable.content,
      ownerId: projectsTable.ownerId,
      ownerName: usersTable.name,
      isPublished: projectsTable.isPublished,
      publishedAt: projectsTable.publishedAt,
      publishVisibility: projectsTable.publishVisibility,
      feedbackEnabled: projectsTable.feedbackEnabled,
      feedbackAudience: projectsTable.feedbackAudience,
      feedbackVisibility: projectsTable.feedbackVisibility,
      collaboratorLimit: projectsTable.collaboratorLimit,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
    })
    .from(projectsTable)
    .innerJoin(usersTable, eq(projectsTable.ownerId, usersTable.id))
    .where(eq(projectsTable.id, params.data.id));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  let role: "owner" | "collaborator" | "reader" = "reader";
  let canGiveFeedback = false;

  if (!isNaN(userId)) {
    if (project.ownerId === userId) {
      role = "owner";
    } else {
      const [collab] = await db
        .select({ id: collaboratorsTable.id })
        .from(collaboratorsTable)
        .where(and(eq(collaboratorsTable.projectId, params.data.id), eq(collaboratorsTable.userId, userId)));
      if (collab) role = "collaborator";
    }

    if (project.isPublished && project.feedbackEnabled && role !== "owner") {
      const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
      if (project.feedbackAudience === "all") {
        canGiveFeedback = true;
      } else if (project.feedbackAudience === "matched" && currentUser) {
        try {
          const BOOK_GENRES = ["Long-form Fiction", "Non-fiction", "Short Story", "Poetry", "Fan Fiction",
            "Graphic Novel / Comics", "Children's Literature", "Literary Fiction",
            "Thriller / Mystery", "Romance", "Science Fiction / Fantasy", "Horror"];
          const SCRIPT_GENRES = ["Film & TV Script", "Screenwriting"];
          const genres: string[] = JSON.parse(currentUser.genres ?? "[]");
          const target = project.type === "script" ? SCRIPT_GENRES : BOOK_GENRES;
          canGiveFeedback = genres.some(g => target.includes(g));
        } catch { canGiveFeedback = false; }
      } else if (project.feedbackAudience === "contributors" && role === "collaborator") {
        canGiveFeedback = true;
      }
    }
  }

  let myJoinRequest: { id: number; status: string } | null = null;
  if (!isNaN(userId) && role === "reader") {
    const [jr] = await db
      .select({ id: joinRequestsTable.id, status: joinRequestsTable.status })
      .from(joinRequestsTable)
      .where(and(eq(joinRequestsTable.projectId, params.data.id), eq(joinRequestsTable.userId, userId)));
    myJoinRequest = jr ?? null;
  }

  res.json({ ...project, role, canGiveFeedback, myJoinRequest });
});

router.patch("/projects/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (existing.ownerId !== parsed.data.userId) {
    res.status(403).json({ error: "Only the owner can update this project" });
    return;
  }

  const updateData: { title?: string; content?: string; collaboratorLimit?: number } = {};
  if (parsed.data.title != null) updateData.title = parsed.data.title;
  if (parsed.data.content != null) updateData.content = parsed.data.content;
  const rawLimit = parseInt(req.body.collaboratorLimit, 10);
  if (!isNaN(rawLimit) && rawLimit >= 1 && rawLimit <= 50) updateData.collaboratorLimit = rawLimit;

  const [updated] = await db
    .update(projectsTable)
    .set(updateData)
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  const [owner] = await db
    .select({ name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, updated.ownerId));

  res.json({
    ...updated,
    ownerName: owner?.name ?? "",
    pendingSuggestionsCount: 0,
    collaboratorsCount: 0,
  });
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = parseInt(req.body.userId, 10);

  const [existing] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (existing.ownerId !== userId) {
    res.status(403).json({ error: "Only the owner can delete this project" });
    return;
  }

  await db.delete(projectsTable).where(eq(projectsTable.id, params.data.id));

  res.sendStatus(204);
});

export default router;
