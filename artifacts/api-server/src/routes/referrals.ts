import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, referralCodesTable, referredUsersTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

function generateCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

async function getOrCreateCode(userId: number): Promise<string> {
  const [existing] = await db
    .select()
    .from(referralCodesTable)
    .where(eq(referralCodesTable.userId, userId));
  if (existing) return existing.code;

  let code = generateCode();
  let attempts = 0;
  while (attempts < 10) {
    const [clash] = await db.select().from(referralCodesTable).where(eq(referralCodesTable.code, code));
    if (!clash) break;
    code = generateCode();
    attempts++;
  }

  await db.insert(referralCodesTable).values({ userId, code });
  return code;
}

router.get("/users/:id/referral-code", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }
  const code = await getOrCreateCode(userId);
  res.json({ code });
});

router.get("/referral/:code/preview", async (req, res): Promise<void> => {
  const { code } = req.params;
  const [record] = await db
    .select({ userId: referralCodesTable.userId, name: usersTable.name })
    .from(referralCodesTable)
    .innerJoin(usersTable, eq(referralCodesTable.userId, usersTable.id))
    .where(eq(referralCodesTable.code, code.toUpperCase()));
  if (!record) { res.status(404).json({ error: "Referral code not found" }); return; }
  res.json({ referrerName: record.name });
});

export { getOrCreateCode };
export default router;
