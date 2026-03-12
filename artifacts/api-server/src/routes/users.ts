import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
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
    res.status(201).json(existing[0]);
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({ name: parsed.data.name, email: parsed.data.email })
    .returning();

  res.status(201).json(user);
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
