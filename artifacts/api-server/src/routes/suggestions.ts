import { Router, type IRouter } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, suggestionsTable, usersTable, projectsTable, collaboratorsTable, suggestionVotesTable } from "@workspace/db";
import { createVersion } from "./versions";
import { awardInk } from "../lib/ink";
import {
  ListSuggestionsParams,
  ListSuggestionsQueryParams,
  CreateSuggestionParams,
  CreateSuggestionBody,
  GetSuggestionParams,
  UpdateSuggestionStatusParams,
  UpdateSuggestionStatusBody,
  DeleteSuggestionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Helper: check if userId is owner or collaborator of projectId
async function isRoomMember(projectId: number, userId: number): Promise<boolean> {
  const [project] = await db.select({ ownerId: projectsTable.ownerId }).from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) return false;
  if (project.ownerId === userId) return true;
  const [collab] = await db.select({ userId: collaboratorsTable.userId }).from(collaboratorsTable)
    .where(and(eq(collaboratorsTable.projectId, projectId), eq(collaboratorsTable.userId, userId)));
  return !!collab;
}

router.get("/projects/:id/suggestions", async (req, res): Promise<void> => {
  const params = ListSuggestionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const query = ListSuggestionsQueryParams.safeParse(req.query);
  const requestingUserId = req.query.userId ? parseInt(req.query.userId as string, 10) : null;

  const conditions = [eq(suggestionsTable.projectId, params.data.id)];
  if (query.success && query.data.status) {
    conditions.push(eq(suggestionsTable.status, query.data.status));
  }

  const rows = await db
    .select({
      id: suggestionsTable.id,
      projectId: suggestionsTable.projectId,
      submitterId: suggestionsTable.submitterId,
      submitterName: usersTable.name,
      submitterRole: usersTable.role,
      originalText: suggestionsTable.originalText,
      suggestedText: suggestionsTable.suggestedText,
      comment: suggestionsTable.comment,
      status: suggestionsTable.status,
      votingOpen: suggestionsTable.votingOpen,
      ownerNote: suggestionsTable.ownerNote,
      createdAt: suggestionsTable.createdAt,
      updatedAt: suggestionsTable.updatedAt,
    })
    .from(suggestionsTable)
    .innerJoin(usersTable, eq(suggestionsTable.submitterId, usersTable.id))
    .where(and(...conditions))
    .orderBy(suggestionsTable.createdAt);

  // Attach vote counts and the requesting user's vote
  if (rows.length > 0) {
    const ids = rows.map(r => r.id);
    const votes = await db
      .select({ suggestionId: suggestionVotesTable.suggestionId, userId: suggestionVotesTable.userId, vote: suggestionVotesTable.vote })
      .from(suggestionVotesTable)
      .where(inArray(suggestionVotesTable.suggestionId, ids));

    const voteMap = new Map<number, { original: number; amendment: number; userVote: string | null }>();
    for (const r of rows) {
      voteMap.set(r.id, { original: 0, amendment: 0, userVote: null });
    }
    for (const v of votes) {
      const entry = voteMap.get(v.suggestionId);
      if (!entry) continue;
      if (v.vote === "original") entry.original++;
      else if (v.vote === "amendment") entry.amendment++;
      if (requestingUserId && v.userId === requestingUserId) entry.userVote = v.vote;
    }

    const result = rows.map(r => ({ ...r, votes: voteMap.get(r.id) ?? { original: 0, amendment: 0, userVote: null } }));
    res.json(result);
    return;
  }

  res.json(rows);
});

router.post("/projects/:id/suggestions", async (req, res): Promise<void> => {
  const params = CreateSuggestionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateSuggestionBody.safeParse(req.body);
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

  const isOwner = project.ownerId === parsed.data.submitterId;

  if (!isOwner) {
    const isCollaborator = await db
      .select()
      .from(collaboratorsTable)
      .where(and(
        eq(collaboratorsTable.projectId, params.data.id),
        eq(collaboratorsTable.userId, parsed.data.submitterId)
      ));

    if (isCollaborator.length === 0) {
      res.status(403).json({ error: "You must be a collaborator to submit suggestions" });
      return;
    }
  }

  const [suggestion] = await db
    .insert(suggestionsTable)
    .values({
      projectId: params.data.id,
      submitterId: parsed.data.submitterId,
      originalText: parsed.data.originalText,
      suggestedText: parsed.data.suggestedText,
      comment: parsed.data.comment ?? null,
    })
    .returning();

  await awardInk(suggestion.submitterId, 2, "suggestion_submitted", params.data.id).catch(() => {});

  const [submitter] = await db
    .select({ name: usersTable.name, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, suggestion.submitterId));

  res.status(201).json({
    ...suggestion,
    submitterName: submitter?.name ?? "",
    submitterRole: submitter?.role ?? "contributor",
    votes: { original: 0, amendment: 0, userVote: null },
  });
});

router.get("/projects/:id/suggestions/:suggestionId", async (req, res): Promise<void> => {
  const params = GetSuggestionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      id: suggestionsTable.id,
      projectId: suggestionsTable.projectId,
      submitterId: suggestionsTable.submitterId,
      submitterName: usersTable.name,
      submitterRole: usersTable.role,
      originalText: suggestionsTable.originalText,
      suggestedText: suggestionsTable.suggestedText,
      comment: suggestionsTable.comment,
      status: suggestionsTable.status,
      votingOpen: suggestionsTable.votingOpen,
      ownerNote: suggestionsTable.ownerNote,
      createdAt: suggestionsTable.createdAt,
      updatedAt: suggestionsTable.updatedAt,
    })
    .from(suggestionsTable)
    .innerJoin(usersTable, eq(suggestionsTable.submitterId, usersTable.id))
    .where(and(
      eq(suggestionsTable.id, params.data.suggestionId),
      eq(suggestionsTable.projectId, params.data.id)
    ));

  if (!row) {
    res.status(404).json({ error: "Suggestion not found" });
    return;
  }

  res.json(row);
});

router.patch("/projects/:id/suggestions/:suggestionId", async (req, res): Promise<void> => {
  const params = UpdateSuggestionStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSuggestionStatusBody.safeParse(req.body);
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

  if (project.ownerId !== parsed.data.userId) {
    res.status(403).json({ error: "Only the owner can accept or discard suggestions" });
    return;
  }

  const [suggestion] = await db
    .select()
    .from(suggestionsTable)
    .where(and(
      eq(suggestionsTable.id, params.data.suggestionId),
      eq(suggestionsTable.projectId, params.data.id)
    ));

  if (!suggestion) {
    res.status(404).json({ error: "Suggestion not found" });
    return;
  }

  const updateData: { status: "accepted" | "discarded"; ownerNote?: string | null } = {
    status: parsed.data.status,
    ownerNote: parsed.data.ownerNote ?? null,
  };

  if (parsed.data.status === "accepted") {
    const currentContent = project.content;
    if (currentContent.includes(suggestion.originalText)) {
      await createVersion(
        params.data.id,
        parsed.data.userId,
        currentContent,
        `Before accepting: "${suggestion.originalText.slice(0, 40)}${suggestion.originalText.length > 40 ? "…" : ""}"`,
        "suggestion-accepted"
      );
      const newContent = currentContent.replace(suggestion.originalText, suggestion.suggestedText);
      await db
        .update(projectsTable)
        .set({ content: newContent })
        .where(eq(projectsTable.id, params.data.id));
    }
  }

  const [updated] = await db
    .update(suggestionsTable)
    .set(updateData)
    .where(eq(suggestionsTable.id, params.data.suggestionId))
    .returning();

  if (parsed.data.status === "accepted") {
    await awardInk(updated.submitterId, 10, "suggestion_accepted", params.data.id).catch(() => {});
  }

  const [submitter] = await db
    .select({ name: usersTable.name, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, updated.submitterId));

  res.json({
    ...updated,
    submitterName: submitter?.name ?? "",
    submitterRole: submitter?.role ?? "contributor",
  });
});

router.delete("/projects/:id/suggestions/:suggestionId", async (req, res): Promise<void> => {
  const params = DeleteSuggestionParams.safeParse(req.params);
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

  const [suggestion] = await db
    .select()
    .from(suggestionsTable)
    .where(and(
      eq(suggestionsTable.id, params.data.suggestionId),
      eq(suggestionsTable.projectId, params.data.id)
    ));

  if (!suggestion) {
    res.status(404).json({ error: "Suggestion not found" });
    return;
  }

  const isOwner = project.ownerId === userId;
  const isSubmitter = suggestion.submitterId === userId;

  if (!isOwner && !isSubmitter) {
    res.status(403).json({ error: "Only the owner or suggestion author can delete this suggestion" });
    return;
  }

  await db.delete(suggestionsTable).where(eq(suggestionsTable.id, params.data.suggestionId));

  res.sendStatus(204);
});

// ── Voting ────────────────────────────────────────────────────────────────────

// POST /projects/:id/suggestions/:suggestionId/vote/open — open voting
router.post("/projects/:id/suggestions/:suggestionId/vote/open", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const suggestionId = parseInt(req.params.suggestionId, 10);
  const userId = parseInt(req.body.userId, 10);
  if (isNaN(projectId) || isNaN(suggestionId) || isNaN(userId)) {
    res.status(400).json({ error: "Invalid parameters" }); return;
  }
  if (!(await isRoomMember(projectId, userId))) {
    res.status(403).json({ error: "Only room members can open a vote" }); return;
  }
  const [updated] = await db
    .update(suggestionsTable)
    .set({ votingOpen: true })
    .where(and(eq(suggestionsTable.id, suggestionId), eq(suggestionsTable.projectId, projectId)))
    .returning({ id: suggestionsTable.id });
  if (!updated) { res.status(404).json({ error: "Suggestion not found" }); return; }
  res.json({ ok: true });
});

// POST /projects/:id/suggestions/:suggestionId/vote/close — close voting (owner only)
router.post("/projects/:id/suggestions/:suggestionId/vote/close", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const suggestionId = parseInt(req.params.suggestionId, 10);
  const userId = parseInt(req.body.userId, 10);
  if (isNaN(projectId) || isNaN(suggestionId) || isNaN(userId)) {
    res.status(400).json({ error: "Invalid parameters" }); return;
  }
  const [project] = await db.select({ ownerId: projectsTable.ownerId }).from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.ownerId !== userId) { res.status(403).json({ error: "Only the project owner can close a vote" }); return; }
  const [updated] = await db
    .update(suggestionsTable)
    .set({ votingOpen: false })
    .where(and(eq(suggestionsTable.id, suggestionId), eq(suggestionsTable.projectId, projectId)))
    .returning({ id: suggestionsTable.id });
  if (!updated) { res.status(404).json({ error: "Suggestion not found" }); return; }
  res.json({ ok: true });
});

// POST /projects/:id/suggestions/:suggestionId/vote — cast or change a vote
router.post("/projects/:id/suggestions/:suggestionId/vote", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const suggestionId = parseInt(req.params.suggestionId, 10);
  const userId = parseInt(req.body.userId, 10);
  const vote = req.body.vote as string;
  if (isNaN(projectId) || isNaN(suggestionId) || isNaN(userId) || !["original", "amendment"].includes(vote)) {
    res.status(400).json({ error: "Invalid parameters" }); return;
  }
  const [suggestion] = await db.select({ votingOpen: suggestionsTable.votingOpen, projectId: suggestionsTable.projectId })
    .from(suggestionsTable).where(eq(suggestionsTable.id, suggestionId));
  if (!suggestion || suggestion.projectId !== projectId) { res.status(404).json({ error: "Suggestion not found" }); return; }
  if (!suggestion.votingOpen) { res.status(400).json({ error: "Voting is not open for this suggestion" }); return; }
  if (!(await isRoomMember(projectId, userId))) {
    res.status(403).json({ error: "Only room members can vote" }); return;
  }
  // Upsert: insert or update existing vote
  await db
    .insert(suggestionVotesTable)
    .values({ suggestionId, userId, vote: vote as "original" | "amendment" })
    .onConflictDoUpdate({ target: [suggestionVotesTable.suggestionId, suggestionVotesTable.userId], set: { vote: vote as "original" | "amendment" } });

  // Return updated counts
  const votes = await db.select({ userId: suggestionVotesTable.userId, vote: suggestionVotesTable.vote })
    .from(suggestionVotesTable).where(eq(suggestionVotesTable.suggestionId, suggestionId));
  const counts = votes.reduce((acc, v) => {
    if (v.vote === "original") acc.original++;
    else acc.amendment++;
    return acc;
  }, { original: 0, amendment: 0 });
  res.json({ ...counts, userVote: vote });
});

export default router;
