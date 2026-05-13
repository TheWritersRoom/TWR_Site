import { db, inkLedgerTable } from "@workspace/db";

export type InkReason =
  | "suggestion_submitted"
  | "suggestion_accepted"
  | "collaborator_added"
  | "published_credit"
  | "historical_seed"
  | "referral_signup"
  | "referral_pro_upgrade"
  | "invite_accepted"
  | "invite_accepted_pro_bonus";

export async function awardInk(
  userId: number,
  amount: number,
  reason: InkReason,
  projectId?: number,
): Promise<void> {
  await db.insert(inkLedgerTable).values({
    userId,
    amount,
    reason,
    projectId: projectId ?? null,
  });
}
