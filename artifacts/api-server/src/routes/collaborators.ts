import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { db, collaboratorsTable, usersTable, projectsTable, joinRequestsTable } from "@workspace/db";
import { awardInk } from "../lib/ink";
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

  await awardInk(invitedUser.id, 5, "collaborator_added", params.data.id).catch(() => {});

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

// ── Join Requests ─────────────────────────────────────────────────────────────

// GET /projects/:id/join-requests  — owner sees all pending requests
router.get("/projects/:id/join-requests", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const userId = parseInt(req.query.userId as string, 10);
  if (isNaN(projectId) || isNaN(userId)) { res.status(400).json({ error: "Invalid params" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.ownerId !== userId) { res.status(403).json({ error: "Only the owner can view join requests" }); return; }

  const rows = await db
    .select({
      id: joinRequestsTable.id,
      userId: joinRequestsTable.userId,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      message: joinRequestsTable.message,
      status: joinRequestsTable.status,
      createdAt: joinRequestsTable.createdAt,
    })
    .from(joinRequestsTable)
    .innerJoin(usersTable, eq(joinRequestsTable.userId, usersTable.id))
    .where(eq(joinRequestsTable.projectId, projectId))
    .orderBy(joinRequestsTable.createdAt);

  res.json(rows);
});

// POST /projects/:id/join-requests  — reader submits a request
router.post("/projects/:id/join-requests", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const userId = parseInt(req.body.userId, 10);
  const message: string = req.body.message ?? "";
  if (isNaN(projectId) || isNaN(userId)) { res.status(400).json({ error: "Invalid params" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.ownerId === userId) { res.status(400).json({ error: "You own this project" }); return; }

  const [existing] = await db.select().from(collaboratorsTable).where(
    and(eq(collaboratorsTable.projectId, projectId), eq(collaboratorsTable.userId, userId))
  );
  if (existing) { res.status(400).json({ error: "You are already a collaborator" }); return; }

  const [existingReq] = await db.select().from(joinRequestsTable).where(
    and(eq(joinRequestsTable.projectId, projectId), eq(joinRequestsTable.userId, userId))
  );
  if (existingReq) {
    // Allow re-requesting if previously declined
    if (existingReq.status === "pending") {
      res.status(400).json({ error: "You already have a pending request" }); return;
    }
    const [updated] = await db
      .update(joinRequestsTable)
      .set({ status: "pending", message, createdAt: new Date() })
      .where(eq(joinRequestsTable.id, existingReq.id))
      .returning();
    res.status(200).json(updated);
    return;
  }

  const [created] = await db
    .insert(joinRequestsTable)
    .values({ projectId, userId, message })
    .returning();

  res.status(201).json(created);
});

// PATCH /projects/:id/join-requests/:requestId  — owner accepts or declines
router.patch("/projects/:id/join-requests/:requestId", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const requestId = parseInt(req.params.requestId, 10);
  const ownerId = parseInt(req.body.userId, 10);
  const action: "accept" | "decline" = req.body.action;
  if (isNaN(projectId) || isNaN(requestId) || isNaN(ownerId)) { res.status(400).json({ error: "Invalid params" }); return; }
  if (action !== "accept" && action !== "decline") { res.status(400).json({ error: "action must be accept or decline" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.ownerId !== ownerId) { res.status(403).json({ error: "Only the owner can respond to join requests" }); return; }

  const [joinReq] = await db.select().from(joinRequestsTable).where(
    and(eq(joinRequestsTable.id, requestId), eq(joinRequestsTable.projectId, projectId))
  );
  if (!joinReq) { res.status(404).json({ error: "Join request not found" }); return; }

  if (action === "accept") {
    // Check room limit
    const limit = project.collaboratorLimit ?? 6;
    const [{ total }] = await db.select({ total: count(collaboratorsTable.id) }).from(collaboratorsTable).where(eq(collaboratorsTable.projectId, projectId));
    if (total >= limit) {
      res.status(400).json({ error: `Room is full (${limit} max). Increase the room limit first.` }); return;
    }
    // Add as collaborator
    await db.insert(collaboratorsTable).values({ projectId, userId: joinReq.userId }).onConflictDoNothing();

    // Award ink to the project owner for accepting a join request
    const [invitee] = await db.select({ subscriptionTier: usersTable.subscriptionTier })
      .from(usersTable).where(eq(usersTable.id, joinReq.userId));
    await awardInk(ownerId, 5, "invite_accepted", projectId).catch(() => {});
    if (invitee?.subscriptionTier === "pro") {
      await awardInk(ownerId, 15, "invite_accepted_pro_bonus", projectId).catch(() => {});
    }
  }

  const [updated] = await db
    .update(joinRequestsTable)
    .set({ status: action === "accept" ? "accepted" : "declined" })
    .where(eq(joinRequestsTable.id, requestId))
    .returning();

  res.json(updated);
});

export default router;
