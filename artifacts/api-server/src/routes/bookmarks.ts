import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, bookmarksTable, usersTable, suggestionsTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/bookmarks", async (req, res): Promise<void> => {
  const { authorId, contributorId } = req.body as { authorId: number; contributorId: number };
  if (!authorId || !contributorId) { res.status(400).json({ error: "Missing fields" }); return; }

  const existing = await db.select().from(bookmarksTable)
    .where(and(eq(bookmarksTable.authorId, Number(authorId)), eq(bookmarksTable.contributorId, Number(contributorId))))
    .limit(1);

  if (existing.length > 0) { res.json(existing[0]); return; }

  const [bm] = await db.insert(bookmarksTable).values({
    authorId: Number(authorId),
    contributorId: Number(contributorId),
  }).returning();
  res.status(201).json(bm);
});

router.delete("/bookmarks", async (req, res): Promise<void> => {
  const { authorId, contributorId } = req.body as { authorId: number; contributorId: number };
  if (!authorId || !contributorId) { res.status(400).json({ error: "Missing fields" }); return; }

  await db.delete(bookmarksTable)
    .where(and(eq(bookmarksTable.authorId, Number(authorId)), eq(bookmarksTable.contributorId, Number(contributorId))));
  res.json({ success: true });
});

router.get("/bookmarks", async (req, res): Promise<void> => {
  const authorId = parseInt(req.query.authorId as string, 10);
  if (isNaN(authorId)) { res.status(400).json({ error: "Invalid authorId" }); return; }

  const rows = await db
    .select({
      bookmarkId: bookmarksTable.id,
      contributorId: bookmarksTable.contributorId,
      contributorName: usersTable.name,
      contributorRole: usersTable.role,
      contributorBio: usersTable.bio,
      contributorGenres: usersTable.genres,
      contributorCredentials: usersTable.credentials,
      contributorAvatar: usersTable.avatarUrl,
      contributorOpenToApproach: usersTable.openToApproach,
      contributorMediaInterests: usersTable.mediaInterests,
      savedAt: bookmarksTable.createdAt,
    })
    .from(bookmarksTable)
    .innerJoin(usersTable, eq(bookmarksTable.contributorId, usersTable.id))
    .where(eq(bookmarksTable.authorId, authorId))
    .orderBy(bookmarksTable.createdAt);

  const statsRows = await db
    .select({
      submitterId: suggestionsTable.submitterId,
      total: sql<number>`count(*)::int`.as("total"),
      accepted: sql<number>`count(case when ${suggestionsTable.status} = 'accepted' then 1 end)::int`.as("accepted"),
    })
    .from(suggestionsTable)
    .groupBy(suggestionsTable.submitterId);

  const statsMap = new Map(statsRows.map((s) => [s.submitterId, s]));

  const enriched = rows.map((r) => {
    let creds: Record<string, unknown> = {};
    try { creds = JSON.parse(r.contributorCredentials ?? "{}"); } catch { /* ignore */ }
    const stats = statsMap.get(r.contributorId);
    const total = stats?.total ?? 0;
    const accepted = stats?.accepted ?? 0;
    return {
      ...r,
      totalSuggestions: total,
      acceptRate: total > 0 ? Math.round((accepted / total) * 100) : null,
      editingSpecialties: (creds.editingSpecialties as string[]) ?? [],
      availableForWork: (creds.availableForWork as boolean) ?? false,
      experienceLevel: (creds.experienceLevel as string) ?? null,
      professionalTitle: (creds.professionalTitle as string) ?? null,
    };
  });

  res.json(enriched);
});

export default router;
