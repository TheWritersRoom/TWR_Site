import type { Request, Response, NextFunction } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, userSessionsTable, usersTable } from "@workspace/db";

declare global {
  namespace Express {
    interface Request {
      adminUserId?: number;
    }
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.["wr_session"];
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [row] = await db
    .select({
      userId: userSessionsTable.userId,
      isAdmin: usersTable.isAdmin,
    })
    .from(userSessionsTable)
    .innerJoin(usersTable, eq(userSessionsTable.userId, usersTable.id))
    .where(
      and(
        eq(userSessionsTable.token, token),
        gt(userSessionsTable.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!row) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!row.isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  req.adminUserId = row.userId;
  next();
}
