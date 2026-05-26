import { Router, type IRouter, type Response } from "express";
import { eq, lt } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { randomUUID } from "crypto";
import { db, usersTable, authTokensTable, userSessionsTable, referralCodesTable, referredUsersTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { awardInk } from "../lib/ink";
import { sendEmail } from "../lib/email";
import { verificationEmailTemplate, newSignupAdminTemplate } from "../lib/email-templates";

const scryptAsync = promisify(scrypt);
const router: IRouter = Router();

// ── Helpers ────────────────────────────────────────────────────────────────

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

export function safeUser(user: typeof usersTable.$inferSelect) {
  const {
    passwordHash: _ph,
    googleId: _gi,
    emailVerificationToken: _evt,
    emailVerificationTokenExpiresAt: _evtea,
    ...rest
  } = user;
  return rest;
}

const SESSION_COOKIE = "wr_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Create a server-side session and set an httpOnly session cookie */
async function createSession(userId: number, res: Response): Promise<void> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(userSessionsTable).values({ token, userId, expiresAt });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

/** Create a short-lived one-time token that the frontend exchanges for a user object */
async function createLoginToken(userId: number): Promise<string> {
  // Clean up any expired tokens first
  await db.delete(authTokensTable).where(lt(authTokensTable.expiresAt, new Date()));

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  await db.insert(authTokensTable).values({ token, userId, expiresAt });
  return token;
}

function getBaseUrl(): string {
  const domain = process.env.REPLIT_DEV_DOMAIN;
  if (domain) return `https://${domain}`;
  return process.env.APP_URL ?? "http://localhost:8080";
}

function getFrontendBase(): string {
  const domain = process.env.REPLIT_DEV_DOMAIN;
  // The writers-room frontend is served at /writers-room on the Replit proxy
  if (domain) return `https://${domain}/writers-room`;
  return process.env.APP_FRONTEND_URL ?? "http://localhost:5173";
}

function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL ?? "pete@bristolfixer.com";
}

function notifyAdminOfSignup(user: { name: string; email: string; role: string; genres: string }): void {
  const adminUrl = `${getFrontendBase()}/admin`;
  sendEmail({
    to: getAdminEmail(),
    subject: `New member: ${user.name} — The Writers Room`,
    html: newSignupAdminTemplate({
      name: user.name,
      email: user.email,
      role: user.role ?? "both",
      genres: user.genres ?? "[]",
      adminUrl,
    }),
  }).catch((err) => console.warn("[email] Admin signup notification failed:", err));
}

// Emails that are always granted admin status on first account creation
const SEED_ADMIN_EMAILS = new Set([
  "pete@bristolfixer.com",
  "emailpetemartin@gmail.com",
]);

const SEED_PRO_EMAILS = new Set([
  "m.roberts@gmx.co.uk",
]);

// ── Password auth ──────────────────────────────────────────────────────────

// POST /auth/register
router.post("/auth/register", async (req, res): Promise<void> => {
  try {
  const { name, email, password, role, genres, mediaInterests, bio, credentials } = req.body ?? {};

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
      res.status(409).json({ error: "An account with this email already exists. Please sign in." });
      return;
    }
    // Existing OAuth account — set the password now
    const [updated] = await db
      .update(usersTable)
      .set({ passwordHash })
      .where(eq(usersTable.id, existingUser.id))
      .returning();
    await createSession(updated.id, res);
    res.status(200).json(safeUser(updated));
    return;
  }

  const normalizedEmail = email.toLowerCase();
  const { referralCode } = req.body ?? {};

  // Atomically claim a free Pro slot if any remain
  const slotResult = await db.execute(
    sql`UPDATE platform_settings SET value = (value::int - 1)::text
        WHERE key = 'free_pro_slots' AND value::int > 0
        RETURNING value::int AS remaining`
  );
  const claimedProSlot = (slotResult.rows?.length ?? 0) > 0;

  const [user] = await db
    .insert(usersTable)
    .values({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: userRole,
      genres: typeof genres === "string" ? genres : "[]",
      mediaInterests: typeof mediaInterests === "string" ? mediaInterests : "",
      bio: typeof bio === "string" && bio.trim() ? bio.trim() : null,
      credentials: typeof credentials === "string" && credentials !== "{}" ? credentials : null,
      isAdmin: SEED_ADMIN_EMAILS.has(normalizedEmail),
      subscriptionTier: (SEED_PRO_EMAILS.has(normalizedEmail) || claimedProSlot) ? "pro" : "free",
    })
    .returning();

  // Handle referral: award ink to referrer on signup
  if (referralCode && typeof referralCode === "string") {
    const [codeRecord] = await db
      .select()
      .from(referralCodesTable)
      .where(eq(referralCodesTable.code, referralCode.toUpperCase().trim()));
    if (codeRecord && codeRecord.userId !== user.id) {
      await db.insert(referredUsersTable).values({
        referrerId: codeRecord.userId,
        referredId: user.id,
        signupInkAwarded: true,
        proInkAwarded: false,
      }).onConflictDoNothing();
      await awardInk(codeRecord.userId, 15, "referral_signup").catch(() => {});
    }
  }

  // Store verification token, then send email. If token storage fails we skip
  // the email so users never receive a link that cannot be redeemed.
  try {
    const verificationToken = randomUUID();
    const verificationExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await db.update(usersTable)
      .set({ emailVerificationToken: verificationToken, emailVerificationTokenExpiresAt: verificationExpiry })
      .where(eq(usersTable.id, user.id));

    const verifyUrl = `${getBaseUrl()}/api/auth/verify-email?token=${verificationToken}`;
    sendEmail({
      to: user.email,
      subject: "Verify your email — The Writers Room",
      html: verificationEmailTemplate(user.name, verifyUrl),
    }).catch((err) => console.warn("[email] Verification email failed:", err));
  } catch (err) {
    console.error("[signup] Failed to store verification token — email not sent:", err);
  }

  notifyAdminOfSignup(user);
  await createSession(user.id, res);
  res.status(201).json(safeUser(user));
  } catch (err) {
    console.error("[register] Unhandled error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// POST /auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  try {
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
      res.status(401).json({ error: "This account uses social sign-in. Please use the Google button to sign in." });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    await createSession(user.id, res);
    res.status(200).json(safeUser(user));
  } catch (err) {
    console.error("[login] Unhandled error:", err);
    res.status(500).json({ error: "Sign in failed. Please try again." });
  }
});

// ── Token exchange (used after OAuth redirect) ──────────────────────────────

// GET /auth/token/:token
router.get("/auth/token/:token", async (req, res): Promise<void> => {
  const { token } = req.params;

  const [record] = await db
    .select()
    .from(authTokensTable)
    .where(eq(authTokensTable.token, token))
    .limit(1);

  if (!record) {
    res.status(404).json({ error: "Token not found or expired." });
    return;
  }

  if (record.expiresAt < new Date()) {
    await db.delete(authTokensTable).where(eq(authTokensTable.token, token));
    res.status(410).json({ error: "Token has expired. Please sign in again." });
    return;
  }

  // Delete token so it can't be reused
  await db.delete(authTokensTable).where(eq(authTokensTable.token, token));

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, record.userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  await createSession(user.id, res);
  res.status(200).json(safeUser(user));
});

// ── Google OAuth ────────────────────────────────────────────────────────────

// GET /auth/google  — initiate the OAuth flow
router.get("/auth/google", (req, res): void => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.status(503).send("Google sign-in is not configured. Please set GOOGLE_CLIENT_ID.");
    return;
  }

  const redirectUri = `${getBaseUrl()}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// GET /auth/google/callback  — Google redirects here after user grants permission
router.get("/auth/google/callback", async (req, res): Promise<void> => {
  const { code, error } = req.query as Record<string, string>;
  const frontendBase = getFrontendBase();

  if (error || !code) {
    res.redirect(`${frontendBase}/auth/callback?error=${encodeURIComponent(error ?? "access_denied")}`);
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.redirect(`${frontendBase}/auth/callback?error=not_configured`);
    return;
  }

  try {
    // Exchange code for tokens
    const redirectUri = `${getBaseUrl()}/api/auth/google/callback`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Google token exchange failed:", err);
      res.redirect(`${frontendBase}/auth/callback?error=token_exchange_failed`);
      return;
    }

    const tokens = await tokenRes.json() as { access_token: string };

    // Get user profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileRes.ok) {
      res.redirect(`${frontendBase}/auth/callback?error=profile_fetch_failed`);
      return;
    }

    const profile = await profileRes.json() as {
      sub: string;
      name: string;
      email: string;
      picture?: string;
      email_verified?: boolean;
    };

    if (!profile.email) {
      res.redirect(`${frontendBase}/auth/callback?error=no_email`);
      return;
    }

    // Find or create the user
    let user: typeof usersTable.$inferSelect | undefined;

    // 1. Try by googleId
    const [byGoogleId] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.googleId, profile.sub))
      .limit(1);

    if (byGoogleId) {
      // Update avatar in case it changed
      const [updated] = await db
        .update(usersTable)
        .set({ avatarUrl: profile.picture ?? byGoogleId.avatarUrl })
        .where(eq(usersTable.id, byGoogleId.id))
        .returning();
      user = updated;
    } else {
      // 2. Try by email — link Google to existing account
      const [byEmail] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, profile.email.toLowerCase()))
        .limit(1);

      if (byEmail) {
        const [updated] = await db
          .update(usersTable)
          .set({ googleId: profile.sub, avatarUrl: profile.picture ?? byEmail.avatarUrl })
          .where(eq(usersTable.id, byEmail.id))
          .returning();
        user = updated;
      } else {
        // 3. Create a brand-new account
        const oauthEmail = profile.email.toLowerCase();
        const [created] = await db
          .insert(usersTable)
          .values({
            name: profile.name,
            email: oauthEmail,
            googleId: profile.sub,
            avatarUrl: profile.picture,
            role: "both",
            genres: "[]",
            mediaInterests: "",
            isAdmin: SEED_ADMIN_EMAILS.has(oauthEmail),
            subscriptionTier: SEED_PRO_EMAILS.has(oauthEmail) ? "pro" : "free",
            // Google has already verified this email address
            emailVerified: true,
          })
          .returning();
        user = created;
        notifyAdminOfSignup(user);
      }
    }

    const loginToken = await createLoginToken(user.id);
    res.redirect(`${frontendBase}/auth/callback?token=${loginToken}`);
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.redirect(`${frontendBase}/auth/callback?error=server_error`);
  }
});

// GET /auth/verify-email?token=xxx — confirm email address
router.get("/auth/verify-email", async (req, res): Promise<void> => {
  const { token } = req.query as Record<string, string>;
  const frontendBase = getFrontendBase();

  if (!token) {
    res.redirect(`${frontendBase}/profile?verified=invalid`);
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.emailVerificationToken, token))
    .limit(1);

  if (!user) {
    res.redirect(`${frontendBase}/profile?verified=invalid`);
    return;
  }

  // Enforce the 48-hour token expiry
  if (!user.emailVerificationTokenExpiresAt || user.emailVerificationTokenExpiresAt < new Date()) {
    await db
      .update(usersTable)
      .set({ emailVerificationToken: null, emailVerificationTokenExpiresAt: null })
      .where(eq(usersTable.id, user.id));
    res.redirect(`${frontendBase}/profile?verified=expired`);
    return;
  }

  await db
    .update(usersTable)
    .set({ emailVerified: true, emailVerificationToken: null, emailVerificationTokenExpiresAt: null })
    .where(eq(usersTable.id, user.id));

  // Issue a one-time login token so the user is signed in automatically
  const loginToken = await createLoginToken(user.id);
  res.redirect(`${frontendBase}/auth/callback?token=${loginToken}&verified=1`);
});

// POST /auth/logout — invalidate current session cookie
router.post("/auth/logout", async (req, res): Promise<void> => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    await db.delete(userSessionsTable).where(eq(userSessionsTable.token, token));
  }
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.status(204).send();
});

export default router;
