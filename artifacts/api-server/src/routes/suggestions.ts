import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, suggestionsTable, usersTable, projectsTable, collaboratorsTable } from "@workspace/db";
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

router.get("/projects/:id/suggestions", async (req, res): Promise<void> => {
  const params = ListSuggestionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const query = ListSuggestionsQueryParams.safeParse(req.query);

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
      ownerNote: suggestionsTable.ownerNote,
      createdAt: suggestionsTable.createdAt,
      updatedAt: suggestionsTable.updatedAt,
    })
    .from(suggestionsTable)
    .innerJoin(usersTable, eq(suggestionsTable.submitterId, usersTable.id))
    .where(and(...conditions))
    .orderBy(suggestionsTable.createdAt);

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

export default router;
