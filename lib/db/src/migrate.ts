import { pool } from "./index";

/**
 * Idempotent schema migrations applied at API server startup.
 *
 * Each statement uses IF NOT EXISTS / IF EXISTS guards so it is safe
 * to run on every boot, including against a database that was already
 * fully migrated.
 *
 * Background: drizzle-kit push has a unique-constraint bug in the
 * Replit environment, so we manage additive column migrations here
 * rather than relying on the push command.
 *
 * Admin bootstrap:
 * Set the ADMIN_EMAIL environment variable to the email address of the
 * user who should be the first admin. On every boot, that user will be
 * promoted to is_admin = true. If the variable is not set and no admin
 * exists yet, a warning is logged so the operator knows action is needed.
 */
export async function applyMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    // 1. Ensure is_admin column exists
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    // 2. Admin bootstrap — promote the configured email to admin
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (adminEmail) {
      const result = await client.query(
        `UPDATE users SET is_admin = TRUE WHERE LOWER(email) = $1 RETURNING id, email`,
        [adminEmail]
      );
      if (result.rowCount && result.rowCount > 0) {
        console.log(`[migrate] Admin bootstrap: promoted ${adminEmail} to admin.`);
      } else {
        console.warn(
          `[migrate] Admin bootstrap: ADMIN_EMAIL is set to "${adminEmail}" but no matching user was found. ` +
          `Register that account first, then restart the server.`
        );
      }
    } else {
      // Check whether any admin already exists
      const { rows } = await client.query(
        `SELECT id FROM users WHERE is_admin = TRUE LIMIT 1`
      );
      if (rows.length === 0) {
        console.warn(
          "[migrate] No admin users exist and ADMIN_EMAIL is not set. " +
          "Set ADMIN_EMAIL to the email of the user who should be the first admin and restart."
        );
      }
    }

    // 3. Ensure platform_settings table exists and is seeded
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    // Insert the initial free Pro slot count. If the row already exists
    // with a real (non-zero) value — meaning real signups have claimed
    // slots — leave it untouched. Only initialise if missing or still at
    // the uninitialised default of 0.
    await client.query(`
      INSERT INTO platform_settings (key, value)
        VALUES ('free_pro_slots', '300')
      ON CONFLICT (key) DO UPDATE
        SET value = '300'
        WHERE platform_settings.value = '0';
    `);

    console.log("[migrate] Schema up to date.");
  } catch (err) {
    console.error("[migrate] Migration failed:", err);
    throw err;
  } finally {
    client.release();
  }
}
