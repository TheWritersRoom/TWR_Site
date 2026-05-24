import pg from "pg";

const { Pool } = pg;

const NEON_URL = process.env.NEON_DATABASE_URL;
if (!NEON_URL) {
  console.error("Error: NEON_DATABASE_URL environment variable is not set.");
  console.error("Usage: NEON_DATABASE_URL='postgresql://...' npx tsx lib/db/migrate-to-neon.ts");
  process.exit(1);
}

const src = new Pool({ connectionString: process.env.DATABASE_URL });
const dst = new Pool({ connectionString: NEON_URL });

const tables = [
  "users",
  "projects",
  "auth_tokens",
  "collaborators",
  "content_access_logs",
  "contributor_bookmarks",
  "feedback",
  "ink_ledger",
  "ip_agreements",
  "join_requests",
  "messages",
  "pitch_invites",
  "pitch_responses",
  "pitches",
  "structure_planners",
  "planner_cards",
  "planner_contributors",
  "platform_settings",
  "project_versions",
  "ratings",
  "referral_codes",
  "referred_users",
  "schema_migrations",
  "suggestion_votes",
  "suggestions",
  "user_sessions",
];

for (const table of tables) {
  const { rows } = await src.query(`SELECT * FROM ${table}`);
  if (rows.length === 0) {
    console.log(`  ${table}: empty`);
    continue;
  }
  const cols = Object.keys(rows[0]);
  const colList = cols.map((c) => `"${c}"`).join(", ");
  let inserted = 0,
    skipped = 0;
  for (const row of rows) {
    const vals = cols.map((_, i) => `$${i + 1}`).join(", ");
    try {
      const r = await dst.query(
        `INSERT INTO ${table} (${colList}) VALUES (${vals}) ON CONFLICT DO NOTHING`,
        cols.map((c) => row[c])
      );
      r.rowCount! > 0 ? inserted++ : skipped++;
    } catch (e: any) {
      console.warn(`  ${table} row error: ${e.message}`);
      skipped++;
    }
  }
  console.log(`  ${table}: ${inserted} inserted, ${skipped} already existed`);
}

const { rows: seqs } = await src.query(
  `SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema='public'`
);
for (const { sequence_name } of seqs) {
  try {
    const {
      rows: [r],
    } = await src.query(`SELECT last_value FROM ${sequence_name}`);
    await dst.query(`SELECT setval('${sequence_name}', $1, true)`, [
      r.last_value,
    ]);
  } catch (e: any) {
    console.warn(`  seq ${sequence_name}: ${e.message}`);
  }
}
console.log("Sequences reset.");

await src.end();
await dst.end();
console.log("\nMigration complete.");
