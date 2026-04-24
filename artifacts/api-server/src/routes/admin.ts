import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/admin/users", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(usersTable.createdAt);

  res.json(rows);
});

export default router;
