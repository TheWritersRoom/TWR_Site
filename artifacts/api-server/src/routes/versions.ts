import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, projectsTable, usersTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

async function createVersion(
  projectId: number,
  savedBy: number,
  content: string,
  label: string,
  trigger: string
) {
  await db.execute(
    sql`INSERT INTO project_versions (project_id, saved_by, label, content, trigger)
        VALUES (${projectId}, ${savedBy}, ${label}, ${content}, ${trigger})`
  );
}

router.get("/projects/:id/versions", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const userId = parseInt(req.query.userId as string, 10);
  if (isNaN(projectId) || isNaN(userId)) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.ownerId !== userId) { res.status(403).json({ error: "Only the owner can view version history" }); return; }

  const rows = await db.execute(
    sql`SELECT pv.id, pv.project_id, pv.saved_by, pv.label, pv.trigger, pv.created_at,
               u.name as saved_by_name
        FROM project_versions pv
        JOIN users u ON u.id = pv.saved_by
        WHERE pv.project_id = ${projectId}
        ORDER BY pv.created_at DESC`
  );

  res.json((rows as any).rows ?? rows);
});

router.get("/projects/:id/versions/:versionId", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const versionId = parseInt(req.params.versionId, 10);
  const userId = parseInt(req.query.userId as string, 10);
  if (isNaN(projectId) || isNaN(versionId) || isNaN(userId)) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.ownerId !== userId) { res.status(403).json({ error: "Only the owner can view versions" }); return; }

  const rows = await db.execute(
    sql`SELECT pv.id, pv.project_id, pv.saved_by, pv.label, pv.content, pv.trigger, pv.created_at,
               u.name as saved_by_name
        FROM project_versions pv
        JOIN users u ON u.id = pv.saved_by
        WHERE pv.id = ${versionId} AND pv.project_id = ${projectId}`
  );

  const version = ((rows as any).rows ?? rows)[0];
  if (!version) { res.status(404).json({ error: "Version not found" }); return; }

  res.json(version);
});

router.post("/projects/:id/versions", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const { userId, label } = req.body;
  if (!userId || !label?.trim()) {
    res.status(400).json({ error: "userId and label are required" });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.ownerId !== userId) { res.status(403).json({ error: "Only the owner can save versions" }); return; }

  await createVersion(projectId, userId, project.content, label.trim(), "manual");

  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));

  const rows = await db.execute(
    sql`SELECT id, project_id, saved_by, label, trigger, created_at
        FROM project_versions
        WHERE project_id = ${projectId} AND saved_by = ${userId}
        ORDER BY created_at DESC LIMIT 1`
  );
  const saved = ((rows as any).rows ?? rows)[0];

  res.status(201).json({ ...saved, saved_by_name: user?.name ?? "" });
});

router.post("/projects/:id/versions/:versionId/restore", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const versionId = parseInt(req.params.versionId, 10);
  if (isNaN(projectId) || isNaN(versionId)) { res.status(400).json({ error: "Invalid params" }); return; }

  const { userId } = req.body;
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.ownerId !== userId) { res.status(403).json({ error: "Only the owner can restore versions" }); return; }

  const rows = await db.execute(
    sql`SELECT * FROM project_versions WHERE id = ${versionId} AND project_id = ${projectId}`
  );
  const version = ((rows as any).rows ?? rows)[0];
  if (!version) { res.status(404).json({ error: "Version not found" }); return; }

  await createVersion(projectId, userId, project.content, `Before restore to "${version.label}"`, "auto-restore");

  await db.update(projectsTable)
    .set({ content: version.content })
    .where(eq(projectsTable.id, projectId));

  res.json({ success: true, restoredLabel: version.label });
});

export { createVersion };
export default router;
