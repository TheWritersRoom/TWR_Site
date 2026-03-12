import { Router, type IRouter } from "express";
import { eq, or } from "drizzle-orm";
import { db, usersTable, suggestionsTable, projectsTable } from "@workspace/db";
import { CreateUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email))
    .limit(1);

  if (existing.length > 0) {
    const user = existing[0];
    const [updated] = await db
      .update(usersTable)
      .set({
        role: parsed.data.role ?? user.role,
        genres: parsed.data.genres ?? user.genres,
        mediaInterests: parsed.data.mediaInterests ?? user.mediaInterests,
      })
      .where(eq(usersTable.id, user.id))
      .returning();
    res.status(201).json(updated);
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      genres: parsed.data.genres ?? "[]",
      mediaInterests: parsed.data.mediaInterests ?? "",
    })
    .returning();

  res.status(201).json(user);
});

router.get("/users/browse", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      genres: usersTable.genres,
      mediaInterests: usersTable.mediaInterests,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(or(eq(usersTable.role, "contributor"), eq(usersTable.role, "both")));

  res.json(rows);
});

router.get("/users/:id/activity", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const rows = await db
    .select({
      id: suggestionsTable.id,
      projectId: suggestionsTable.projectId,
      projectTitle: projectsTable.title,
      projectType: projectsTable.type,
      originalText: suggestionsTable.originalText,
      suggestedText: suggestionsTable.suggestedText,
      comment: suggestionsTable.comment,
      status: suggestionsTable.status,
      ownerNote: suggestionsTable.ownerNote,
      createdAt: suggestionsTable.createdAt,
      updatedAt: suggestionsTable.updatedAt,
    })
    .from(suggestionsTable)
    .innerJoin(projectsTable, eq(suggestionsTable.projectId, projectsTable.id))
    .where(eq(suggestionsTable.submitterId, userId))
    .orderBy(suggestionsTable.createdAt);

  res.json(rows);
});

router.get("/users/me", async (req, res): Promise<void> => {
  const email = req.query.email as string;
  if (!email) {
    res.status(404).json({ error: "No email provided" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

export default router;
