import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAdmin } from "../middleware/require-admin";

const router: IRouter = Router();

router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      isAdmin: usersTable.isAdmin,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(usersTable.createdAt);

  res.json(rows);
});

router.patch("/admin/users/:id/admin", requireAdmin, async (req, res): Promise<void> => {
  const targetId = parseInt(req.params.id, 10);
  if (isNaN(targetId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  if (req.adminUserId === targetId) {
    res.status(403).json({ error: "You cannot change your own admin status" });
    return;
  }

  const { isAdmin } = req.body;
  if (typeof isAdmin !== "boolean") {
    res.status(400).json({ error: "isAdmin must be a boolean" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ isAdmin })
    .where(eq(usersTable.id, targetId))
    .returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      isAdmin: usersTable.isAdmin,
      createdAt: usersTable.createdAt,
    });

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(updated);
});

export default router;
