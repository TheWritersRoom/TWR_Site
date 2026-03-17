import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { db, collaboratorsTable, usersTable, projectsTable } from "@workspace/db";
import {
  ListCollaboratorsParams,
  InviteCollaboratorParams,
  InviteCollaboratorBody,
  RemoveCollaboratorParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/projects/:id/collaborators", async (req, res): Promise<void> => {
  const params = ListCollaboratorsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select({
      id: collaboratorsTable.id,
      userId: collaboratorsTable.userId,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      genres: usersTable.genres,
      mediaInterests: usersTable.mediaInterests,
      addedAt: collaboratorsTable.addedAt,
    })
    .from(collaboratorsTable)
    .innerJoin(usersTable, eq(collaboratorsTable.userId, usersTable.id))
    .where(eq(collaboratorsTable.projectId, params.data.id));

  res.json(rows);
});

router.post("/projects/:id/invite", async (req, res): Promise<void> => {
  const params = InviteCollaboratorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = InviteCollaboratorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (project.ownerId !== parsed.data.ownerId) {
    res.status(403).json({ error: "Only the owner can invite collaborators" });
    return;
  }

  const limit = project.collaboratorLimit ?? 6;
  const [{ total }] = await db
    .select({ total: count(collaboratorsTable.id) })
    .from(collaboratorsTable)
    .where(eq(collaboratorsTable.projectId, params.data.id));

  if (total >= limit) {
    res.status(400).json({
      error: `This room is full (${limit} collaborator${limit === 1 ? "" : "s"} max). Increase the room limit to invite more.`,
    });
    return;
  }

  const [invitedUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email));

  if (!invitedUser) {
    res.status(404).json({ error: "User with that email not found. They must sign up first." });
    return;
  }

  if (invitedUser.id === project.ownerId) {
    res.status(400).json({ error: "Cannot invite the project owner as a collaborator" });
    return;
  }

  const existing = await db
    .select()
    .from(collaboratorsTable)
    .where(and(
      eq(collaboratorsTable.projectId, params.data.id),
      eq(collaboratorsTable.userId, invitedUser.id)
    ));

  if (existing.length > 0) {
    res.status(400).json({ error: "User is already a collaborator" });
    return;
  }

  const [collaborator] = await db
    .insert(collaboratorsTable)
    .values({ projectId: params.data.id, userId: invitedUser.id })
    .returning();

  res.status(201).json({
    id: collaborator.id,
    userId: invitedUser.id,
    name: invitedUser.name,
    email: invitedUser.email,
    role: invitedUser.role,
    genres: invitedUser.genres,
    mediaInterests: invitedUser.mediaInterests,
    addedAt: collaborator.addedAt,
  });
});

router.delete("/projects/:id/collaborators/:collaboratorId", async (req, res): Promise<void> => {
  const params = RemoveCollaboratorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = parseInt(req.body.userId, 10);

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (project.ownerId !== userId) {
    res.status(403).json({ error: "Only the owner can remove collaborators" });
    return;
  }

  const [collab] = await db
    .select()
    .from(collaboratorsTable)
    .where(and(
      eq(collaboratorsTable.id, params.data.collaboratorId),
      eq(collaboratorsTable.projectId, params.data.id)
    ));

  if (!collab) {
    res.status(404).json({ error: "Collaborator not found" });
    return;
  }

  await db.delete(collaboratorsTable).where(eq(collaboratorsTable.id, params.data.collaboratorId));

  res.sendStatus(204);
});

export default router;
