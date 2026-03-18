import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db, usersTable } from "@workspace/db";

const scryptAsync = promisify(scrypt);
const router: IRouter = Router();

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [hash, salt] = stored.split(".");
  if (!hash || !salt) return false;
  try {
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    const keyBuffer = Buffer.from(hash, "hex");
    if (buf.length !== keyBuffer.length) return false;
    return timingSafeEqual(buf, keyBuffer);
  } catch {
    return false;
  }
}

// POST /auth/register
router.post("/auth/register", async (req, res): Promise<void> => {
  const { name, email, password, role, genres, mediaInterests } = req.body ?? {};

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Name is required." });
    return;
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "A valid email is required." });
    return;
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }
  const validRoles = ["author", "contributor", "both"];
  const userRole = validRoles.includes(role) ? role : "both";

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  const passwordHash = await hashPassword(password);

  if (existing.length > 0) {
    const existingUser = existing[0];
    if (existingUser.passwordHash) {
      // Already has a password — must sign in instead
      res.status(409).json({ error: "An account with this email already exists. Please sign in." });
      return;
    }
    // Existing account with no password — set the password now
    const [updated] = await db
      .update(usersTable)
      .set({ passwordHash })
      .where(eq(usersTable.id, existingUser.id))
      .returning();
    const { passwordHash: _ph, ...safeUser } = updated;
    res.status(200).json(safeUser);
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
      role: userRole,
      genres: typeof genres === "string" ? genres : "[]",
      mediaInterests: typeof mediaInterests === "string" ? mediaInterests : "",
    })
    .returning();

  const { passwordHash: _ph, ...safeUser } = user;
  res.status(201).json(safeUser);
});

// POST /auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required." });
    return;
  }
  if (!password || typeof password !== "string") {
    res.status(400).json({ error: "Password is required." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  if (!user.passwordHash) {
    res.status(401).json({ error: "This account was set up before passwords were required. Please register a new account." });
    return;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const { passwordHash: _ph, ...safeUser } = user;
  res.status(200).json(safeUser);
});

export default router;
