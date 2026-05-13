import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, inkLedgerTable, projectsTable } from "@workspace/db";

const router: IRouter = Router();

const REASON_LABELS: Record<string, string> = {
  suggestion_submitted:      "Suggestion submitted",
  suggestion_accepted:       "Suggestion accepted",
  collaborator_added:        "Joined as collaborator",
  published_credit:          "Published project credit",
  historical_seed:           "Activity credit",
  referral_signup:           "Referral — new member joined",
  referral_pro_upgrade:      "Referral — member upgraded to Pro",
  invite_accepted:           "Collaborator accepted your invitation",
  invite_accepted_pro_bonus: "Pro collaborator bonus",
};

router.get("/users/:id/ink", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }

  const [balanceRow] = await db
    .select({ balance: sql<number>`COALESCE(SUM(${inkLedgerTable.amount}), 0)::int` })
    .from(inkLedgerTable)
    .where(eq(inkLedgerTable.userId, userId));

  const transactions = await db
    .select({
      id:           inkLedgerTable.id,
      amount:       inkLedgerTable.amount,
      reason:       inkLedgerTable.reason,
      projectId:    inkLedgerTable.projectId,
      projectTitle: projectsTable.title,
      createdAt:    inkLedgerTable.createdAt,
    })
    .from(inkLedgerTable)
    .leftJoin(projectsTable, eq(inkLedgerTable.projectId, projectsTable.id))
    .where(eq(inkLedgerTable.userId, userId))
    .orderBy(desc(inkLedgerTable.createdAt))
    .limit(20);

  res.json({
    balance: Number(balanceRow?.balance ?? 0),
    transactions: transactions.map(t => ({
      ...t,
      label: REASON_LABELS[t.reason] ?? t.reason,
    })),
  });
});

export default router;
