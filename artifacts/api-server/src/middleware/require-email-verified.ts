import type { Request, Response, NextFunction } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, userSessionsTable, usersTable } from "@workspace/db";

const VERIFICATION_EXEMPT_PREFIXES = [
  "/api/auth/",
  "/api/health",
];

export async function requireEmailVerified(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const isExempt = VERIFICATION_EXEMPT_PREFIXES.some((prefix) =>
    req.path.startsWith(prefix)
  );
  if (isExempt) {
    next();
    return;
  }

  const token = req.cookies?.["wr_session"];
  if (!token) {
    next();
    return;
  }

  const [row] = await db
    .select({
      emailVerified: usersTable.emailVerified,
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

  if (row && row.emailVerified === false) {
    res.status(403).json({
      error: "Email not verified",
      code: "EMAIL_NOT_VERIFIED",
      message: "Please verify your email address before continuing. Check your inbox for a verification link.",
    });
    return;
  }

  next();
}
