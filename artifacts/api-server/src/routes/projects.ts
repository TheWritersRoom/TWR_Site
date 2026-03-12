import { Router, type IRouter } from "express";
import { eq, and, or, count, sql } from "drizzle-orm";
import { db, projectsTable, usersTable, collaboratorsTable, suggestionsTable } from "@workspace/db";
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

  const owned = await db
    .select({
      id: projectsTable.id,
      title: projectsTable.title,
      type: projectsTable.type,
      ownerId: projectsTable.ownerId,
      ownerName: usersTable.name,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
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

  const [project] = await db
    .insert(projectsTable)
    .values({ ...projectData, ownerId: userId })
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

  let role: "owner" | "collaborator" = "collaborator";
  if (!isNaN(userId)) {
    if (project.ownerId === userId) {
      role = "owner";
    }
  }

  res.json({ ...project, role });
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

  const updateData: { title?: string; content?: string } = {};
  if (parsed.data.title != null) updateData.title = parsed.data.title;
  if (parsed.data.content != null) updateData.content = parsed.data.content;

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
