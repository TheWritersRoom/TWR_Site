import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, suggestionsTable, collaboratorsTable, projectsTable } from "@workspace/db";

const router: IRouter = Router();

export type AchievementKey =
  | "first_mark"
  | "sharp_eye"
  | "trusted_voice"
  | "master_editor"
  | "consistent_voice"
  | "collaborator"
  | "sought_after"
  | "published_credit";

export type Tier = "bronze" | "silver" | "gold" | "platinum";

export type Achievement = {
  key: AchievementKey;
  label: string;
  description: string;
  tier: Tier;
  earned: boolean;
};

export type ReputationResult = {
  score: number;
  totalSuggestions: number;
  acceptedSuggestions: number;
  acceptRate: number | null;
  uniqueProjectsWithAccepted: number;
  collaborationCount: number;
  publishedCollaborationCount: number;
  achievements: Achievement[];
};

const ACHIEVEMENT_META: Record<AchievementKey, { label: string; description: string; tier: Tier }> = {
  first_mark:       { label: "First Mark",       tier: "bronze",   description: "Had a first suggestion accepted by an author" },
  sharp_eye:        { label: "Sharp Eye",         tier: "silver",   description: "60%+ acceptance rate across 5 or more suggestions" },
  trusted_voice:    { label: "Trusted Voice",     tier: "gold",     description: "75%+ acceptance rate across 10 or more suggestions" },
  master_editor:    { label: "Master Editor",     tier: "platinum", description: "90%+ acceptance rate across 10 or more suggestions" },
  consistent_voice: { label: "Consistent Voice",  tier: "silver",   description: "Accepted suggestions across 3 or more different projects" },
  collaborator:     { label: "Collaborator",      tier: "bronze",   description: "Active collaborator on 3 or more projects" },
  sought_after:     { label: "Sought After",      tier: "gold",     description: "Active collaborator on 5 or more projects" },
  published_credit: { label: "Published Credit",  tier: "gold",     description: "Credited on at least one published manuscript" },
};

export async function computeReputation(userId: number): Promise<ReputationResult> {
  // ── Suggestion stats ───────────────────────────────────────────────────────
  const [suggRow] = await db
    .select({
      total:            sql<number>`COUNT(*)::int`,
      accepted:         sql<number>`COUNT(*) FILTER (WHERE ${suggestionsTable.status} = 'accepted')::int`,
      uniqueWithAccepted: sql<number>`COUNT(DISTINCT ${suggestionsTable.projectId}) FILTER (WHERE ${suggestionsTable.status} = 'accepted')::int`,
    })
    .from(suggestionsTable)
    .where(eq(suggestionsTable.submitterId, userId));

  // ── Collaboration stats ────────────────────────────────────────────────────
  const [collabRow] = await db
    .select({
      totalCollabs:     sql<number>`COUNT(DISTINCT ${collaboratorsTable.projectId})::int`,
      publishedCollabs: sql<number>`COUNT(DISTINCT ${collaboratorsTable.projectId}) FILTER (WHERE ${projectsTable.isPublished} = true)::int`,
    })
    .from(collaboratorsTable)
    .leftJoin(projectsTable, eq(collaboratorsTable.projectId, projectsTable.id))
    .where(eq(collaboratorsTable.userId, userId));

  const total             = Number(suggRow?.total             ?? 0);
  const accepted          = Number(suggRow?.accepted          ?? 0);
  const uniqueWithAccepted = Number(suggRow?.uniqueWithAccepted ?? 0);
  const totalCollabs      = Number(collabRow?.totalCollabs    ?? 0);
  const publishedCollabs  = Number(collabRow?.publishedCollabs ?? 0);

  const rate    = total > 0 ? accepted / total : null;
  const ratePct = rate !== null ? Math.round(rate * 100) : null;

  // ── Achievement eligibility ────────────────────────────────────────────────
  const earned = new Set<AchievementKey>();
  if (accepted >= 1)                                         earned.add("first_mark");
  if (total >= 5  && rate !== null && rate >= 0.60)          earned.add("sharp_eye");
  if (total >= 10 && rate !== null && rate >= 0.75)          earned.add("trusted_voice");
  if (total >= 10 && rate !== null && rate >= 0.90)          earned.add("master_editor");
  if (uniqueWithAccepted >= 3)                               earned.add("consistent_voice");
  if (totalCollabs >= 3)                                     earned.add("collaborator");
  if (totalCollabs >= 5)                                     earned.add("sought_after");
  if (publishedCollabs >= 1)                                 earned.add("published_credit");

  // ── Reputation score 0–100 ─────────────────────────────────────────────────
  let score = 0;
  if (total >= 5 && rate !== null) score += Math.round(rate * 50); // max 50 pts
  score += Math.min(uniqueWithAccepted * 6, 30);                    // max 30 pts
  if (publishedCollabs >= 1) score += 20;                           // max 20 pts
  score = Math.min(score, 100);

  const achievements: Achievement[] = (Object.keys(ACHIEVEMENT_META) as AchievementKey[]).map(key => ({
    key,
    ...ACHIEVEMENT_META[key],
    earned: earned.has(key),
  }));

  return {
    score,
    totalSuggestions: total,
    acceptedSuggestions: accepted,
    acceptRate: ratePct,
    uniqueProjectsWithAccepted: uniqueWithAccepted,
    collaborationCount: totalCollabs,
    publishedCollaborationCount: publishedCollabs,
    achievements,
  };
}

router.get("/users/:id/reputation", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }
  const result = await computeReputation(userId);
  res.json(result);
});

export default router;
