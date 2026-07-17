// Adds the Member table to the Turso production database (idempotent) and
// seeds the three original members. Run once after deploying the Member feature:
//   node prisma/add-members-turso.mjs
// Reads TURSO_DATABASE_URL / TURSO_AUTH_TOKEN from the environment, falling
// back to the .env file at the project root.
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Minimal .env loader (avoids adding a dotenv dependency).
if (!process.env.TURSO_AUTH_TOKEN || !process.env.TURSO_DATABASE_URL) {
  try {
    const env = readFileSync(join(__dirname, "..", ".env"), "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch (_) { /* no .env — rely on process.env */ }
}

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error("Missing TURSO_DATABASE_URL / TURSO_AUTH_TOKEN. Set them in .env or the environment.");
  process.exit(1);
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

console.log("Creating Member table (if not exists)...");
await db.execute(`CREATE TABLE IF NOT EXISTS "Member" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "initials" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT '',
  "email" TEXT NOT NULL DEFAULT '',
  "role" TEXT NOT NULL DEFAULT ''
);`);
await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "Member_initials_key" ON "Member"("initials");`);

console.log("Seeding original members (skips any that already exist)...");
await db.batch([
  { sql: `INSERT OR IGNORE INTO "Member" VALUES (?,?,?,?,?)`, args: ["MB-001", "KW", "K. Wisener", "", "Quality Lead"] },
  { sql: `INSERT OR IGNORE INTO "Member" VALUES (?,?,?,?,?)`, args: ["MB-002", "RK", "R. K.", "", "Engineer"] },
  { sql: `INSERT OR IGNORE INTO "Member" VALUES (?,?,?,?,?)`, args: ["MB-003", "ML", "M. L.", "", "Engineer"] },
]);

console.log("Member table ready. Add real emails via the in-app Team screen.");
await db.close();
