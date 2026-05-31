import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { eq, and, count, gt } from "drizzle-orm";
import { db, collaboratorsTable, usersTable, projectsTable, joinRequestsTable, userSessionsTable } from "@workspace/db";
import { createInboxMessageAndNotify } from "../lib/inbox";
import { awardInk } from "../lib/ink";
import { sendEmail } from "../lib/email";
import { joinRequestEmailTemplate } from "../lib/email-templates";
import {
  ListCollaboratorsParams,
  InviteCollaboratorParams,
  InviteCollaboratorBody,
  RemoveCollaboratorParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ── Pro ratio helper ───────────────────────────────────────────────────────────
// Rule: ceil(totalMembers / 6) Pro accounts required.
// totalMembers = owner + all collaborators (AFTER the new joiner is added).
async function checkProRatio(projectId: number, ownerId: number, currentCollabCount: number) {
  const newTotal = 1 + currentCollabCount + 1;
  const requiredPros = Math.ceil(newTotal / 6);

  const [owner] = await db.select({ subscriptionTier: usersTable.subscriptionTier })
    .from(usersTable).where(eq(usersTable.id, ownerId));

  const proCollabs = await db
    .select({ tier: usersTable.subscriptionTier })
    .from(collaboratorsTable)
    .innerJoin(usersTable, eq(collaboratorsTable.userId, usersTable.id))
    .where(and(
      eq(collaboratorsTable.projectId, projectId),
      eq(usersTable.subscriptionTier, "pro")
    ));

  const currentProCount = (owner?.subscriptionTier === "pro" ? 1 : 0) + proCollabs.length;
  return { allowed: currentProCount >= requiredPros, requiredPros, currentProCount, newTotal };
}

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

  // Verify the session belongs to the declared requester
  const sessionToken = req.cookies?.["wr_session"];
  if (!sessionToken) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [session] = await db
    .select({ userId: userSessionsTable.userId })
    .from(userSessionsTable)
    .where(and(eq(userSessionsTable.token, sessionToken), gt(userSessionsTable.expiresAt, new Date())))
    .limit(1);
  if (!session || session.userId !== userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

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
  const [requester] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  const requesterName = requester?.name ?? "Someone";
  const notifyBody = message?.trim()
    ? `${requesterName} has requested to join "${project.title}":\n\n"${message.trim()}"`
    : `${requesterName} has requested to join "${project.title}".`;

  // Helper: email the project owner about the join request (fire-and-forget)
  async function notifyOwnerByEmail(): Promise<void> {
    const [owner] = await db
      .select({ name: usersTable.name, email: usersTable.email, emailNotifications: usersTable.emailNotifications })
      .from(usersTable)
      .where(eq(usersTable.id, project.ownerId));
    if (!owner?.emailNotifications) return;

    const domain = process.env.REPLIT_DEV_DOMAIN;
    const frontendBase = domain ? `https://${domain}/writers-room` : (process.env.APP_FRONTEND_URL ?? "http://localhost:5173");
    const projectUrl = `${frontendBase}/projects/${projectId}?tab=collaborators`;

    sendEmail({
      to: owner.email,
      subject: `New join request for "${project.title}" — The Writers Room`,
      html: joinRequestEmailTemplate({
        ownerName: owner.name,
        requesterName: requesterName,
        projectTitle: project.title,
        message: message?.trim() || null,
        projectUrl,
      }),
    }).catch((err) => console.warn("[email] Join request notification failed:", err));
  }

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
    await createInboxMessageAndNotify(userId, project.ownerId, notifyBody).catch(() => {});
    await notifyOwnerByEmail();
    res.status(200).json(updated);
    return;
  }

  const [created] = await db
    .insert(joinRequestsTable)
    .values({ projectId, userId, message })
    .returning();

  await createInboxMessageAndNotify(userId, project.ownerId, notifyBody).catch(() => {});
  await notifyOwnerByEmail();

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

  const [owner] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, ownerId));
  const ownerName = owner?.name ?? "The author";

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

    // Notify the requester
    await createInboxMessageAndNotify(
      ownerId,
      joinReq.userId,
      `${ownerName} accepted your request to join "${project.title}". Welcome to the room!`
    ).catch(() => {});
  } else {
    // Notify the requester of the decline
    await createInboxMessageAndNotify(
      ownerId,
      joinReq.userId,
      `${ownerName} has reviewed your request to join "${project.title}" and isn't able to take on a collaborator at this time.`
    ).catch(() => {});
  }

  const [updated] = await db
    .update(joinRequestsTable)
    .set({ status: action === "accept" ? "accepted" : "declined" })
    .where(eq(joinRequestsTable.id, requestId))
    .returning();

  res.json(updated);
});

// ── Group invite link ──────────────────────────────────────────────────────────

// GET /projects/:id/invite-link — owner gets (or auto-generates) the invite token
router.get("/projects/:id/invite-link", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const ownerId = parseInt(req.query.userId as string, 10);
  if (isNaN(projectId) || isNaN(ownerId)) { res.status(400).json({ error: "Invalid params" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.ownerId !== ownerId) { res.status(403).json({ error: "Only the owner can view the invite link" }); return; }

  let token = project.inviteToken;
  if (!token) {
    token = randomUUID();
    await db.update(projectsTable).set({ inviteToken: token }).where(eq(projectsTable.id, projectId));
  }
  res.json({ token });
});

// POST /projects/:id/invite-link/regenerate — owner regenerates token
router.post("/projects/:id/invite-link/regenerate", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const ownerId = parseInt(req.body.userId, 10);
  if (isNaN(projectId) || isNaN(ownerId)) { res.status(400).json({ error: "Invalid params" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.ownerId !== ownerId) { res.status(403).json({ error: "Only the owner can regenerate the invite link" }); return; }

  const token = randomUUID();
  await db.update(projectsTable).set({ inviteToken: token }).where(eq(projectsTable.id, projectId));
  res.json({ token });
});

// GET /join/:token — public: look up project by invite token
router.get("/join/:token", async (req, res): Promise<void> => {
  const { token } = req.params;

  const [row] = await db
    .select({
      id: projectsTable.id,
      title: projectsTable.title,
      type: projectsTable.type,
      genres: projectsTable.genres,
      synopsis: projectsTable.synopsis,
      ownerName: usersTable.name,
      ownerId: projectsTable.ownerId,
      collaboratorLimit: projectsTable.collaboratorLimit,
    })
    .from(projectsTable)
    .innerJoin(usersTable, eq(projectsTable.ownerId, usersTable.id))
    .where(eq(projectsTable.inviteToken, token));

  if (!row) { res.status(404).json({ error: "Invite link not found or has been reset" }); return; }

  const [{ total }] = await db
    .select({ total: count(collaboratorsTable.id) })
    .from(collaboratorsTable)
    .where(eq(collaboratorsTable.projectId, row.id));

  const limit = row.collaboratorLimit ?? 6;
  res.json({ ...row, collaboratorCount: Number(total), isFull: Number(total) >= limit });
});

// POST /join/:token — authenticated user joins via invite link
router.post("/join/:token", async (req, res): Promise<void> => {
  const { token } = req.params;
  const userId = parseInt(req.body.userId, 10);
  if (!token || isNaN(userId)) { res.status(400).json({ error: "Invalid params" }); return; }

  const sessionToken = req.cookies?.["wr_session"];
  if (!sessionToken) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [session] = await db
    .select({ userId: userSessionsTable.userId })
    .from(userSessionsTable)
    .where(and(eq(userSessionsTable.token, sessionToken), gt(userSessionsTable.expiresAt, new Date())))
    .limit(1);
  if (!session || session.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.inviteToken, token));
  if (!project) { res.status(404).json({ error: "Invite link not found or has been reset" }); return; }
  if (project.ownerId === userId) { res.status(400).json({ error: "You own this project" }); return; }

  const [existing] = await db.select().from(collaboratorsTable).where(
    and(eq(collaboratorsTable.projectId, project.id), eq(collaboratorsTable.userId, userId))
  );
  if (existing) {
    res.json({ alreadyMember: true, projectId: project.id, title: project.title });
    return;
  }

  const limit = project.collaboratorLimit ?? 6;
  const [{ total }] = await db.select({ total: count(collaboratorsTable.id) })
    .from(collaboratorsTable)
    .where(eq(collaboratorsTable.projectId, project.id));
  if (Number(total) >= limit) {
    res.status(400).json({ error: `This room is full (${limit} max). Ask the owner to increase the room limit.` });
    return;
  }

  await db.insert(collaboratorsTable).values({ projectId: project.id, userId }).onConflictDoNothing();
  await awardInk(userId, 5, "collaborator_added", project.id).catch(() => {});
  await createInboxMessageAndNotify(
    userId,
    project.ownerId,
    `A new member joined "${project.title}" via your group invite link.`
  ).catch(() => {});

  res.status(201).json({ success: true, projectId: project.id, title: project.title });
});

export default router;
