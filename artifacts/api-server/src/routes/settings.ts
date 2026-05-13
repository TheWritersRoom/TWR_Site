import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

// GET /settings/free-slots — public, no auth required
router.get("/settings/free-slots", async (_req, res): Promise<void> => {
  try {
    const result = await db.execute(
      sql`SELECT value::int AS slots FROM platform_settings WHERE key = 'free_pro_slots'`
    );
    const slots = result.rows?.[0]?.slots ?? 0;
    res.json({ slots: Number(slots) });
  } catch {
    res.json({ slots: 0 });
  }
});

export default router;
