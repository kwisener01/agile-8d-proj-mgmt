// Pushes schema and seeds the Turso production database.
// Run once: node prisma/turso-setup.mjs
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Run migration SQL (safe: IF NOT EXISTS)
const migrationSql = readFileSync(
  join(__dirname, "migrations/20260331022122_init/migration.sql"),
  "utf8"
);

// Split on statement boundaries and run each
const statements = migrationSql
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => s + ";");

console.log("Applying schema to Turso...");
for (const stmt of statements) {
  try {
    await db.execute(stmt);
  } catch (e) {
    if (e.message?.includes("already exists")) {
      console.log("  (table already exists, skipping)");
    } else {
      throw e;
    }
  }
}

// Clear existing data
console.log("Clearing existing data...");
await db.execute("DELETE FROM AgileItem;");
await db.execute("DELETE FROM Defect;");
await db.execute("DELETE FROM Sprint;");

// Seed sprints
console.log("Seeding sprints...");
await db.batch([
  { sql: `INSERT INTO Sprint VALUES (?,?,?,?,?,?,?)`, args: ["SP-12","Sprint 12","Feb 24","Mar 7",34,40,"active"] },
  { sql: `INSERT INTO Sprint VALUES (?,?,?,?,?,?,?)`, args: ["SP-13","Sprint 13","Mar 10","Mar 21",0,42,"planned"] },
]);

// Seed defects
console.log("Seeding defects...");
await db.batch([
  { sql: `INSERT INTO Defect VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, args: ["8D-001","Weld seam failure on batch #4471","S2","D4","KW",'["KW","RK","ML"]',"2026-02-14","2026-03-10","Hold on affected lot. 100% inspection activated.","Electrode pressure drop caused by worn tip — confirmed via fishbone + 5-Why","15 units returned from field. Weld seam cracking under torque spec.",1] },
  { sql: `INSERT INTO Defect VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, args: ["8D-002","Torque spec deviation line 7","S1","D6","RK",'["RK","KW"]',"2026-01-20","2026-03-15","Rework process implemented. Line quarantined.","Calibration drift in torque wrench model TW-22. PM interval too long.","Torque readings 12% below spec on 23 units across shift B.",0] },
  { sql: `INSERT INTO Defect VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, args: ["8D-003","Sensor false-positive cascade","S2","D2","ML",'["ML","KW"]',"2026-02-28","2026-03-20","Software kill-switch deployed to production.","","Intake sensor reporting 300% above threshold intermittently. 8 customer complaints.",1] },
  { sql: `INSERT INTO Defect VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, args: ["8D-004","Assembly line stoppage — lubricant contamination","S3","D1","KW",'["KW"]',"2026-03-03","2026-03-25","","","Line 3 stopped 4 hrs. Lubricant cross-contamination suspected from supply change.",0] },
]);

// Seed agile items
console.log("Seeding agile items...");
await db.batch([
  { sql: `INSERT INTO AgileItem VALUES (?,?,?,?,?,?,?,?,?,?)`, args: ["A1","Intake sensor calibration API","Story",8,"RK","In Progress","High",'["backend","sensors"]',"8D-003",null] },
  { sql: `INSERT INTO AgileItem VALUES (?,?,?,?,?,?,?,?,?,?)`, args: ["A2","Dashboard velocity widget","Story",5,"ML","Review","Med",'["frontend"]',null,null] },
  { sql: `INSERT INTO AgileItem VALUES (?,?,?,?,?,?,?,?,?,?)`, args: ["A3","GHL webhook retry logic","Bug",3,"KW","In Sprint","High",'["integration"]',"8D-001",null] },
  { sql: `INSERT INTO AgileItem VALUES (?,?,?,?,?,?,?,?,?,?)`, args: ["A4","Export reports to PDF","Story",13,"RK","Backlog","Low",'["reports"]',null,null] },
  { sql: `INSERT INTO AgileItem VALUES (?,?,?,?,?,?,?,?,?,?)`, args: ["A5","Mobile push notifications","Story",8,"ML","Backlog","Med",'["mobile"]',null,null] },
  { sql: `INSERT INTO AgileItem VALUES (?,?,?,?,?,?,?,?,?,?)`, args: ["A6","Automated 8D → Agile bridge","Feature",21,"KW","In Sprint","Critical",'["core","8D"]',null,null] },
  { sql: `INSERT INTO AgileItem VALUES (?,?,?,?,?,?,?,?,?,?)`, args: ["A7","Sprint burndown anomaly alert","Bug",2,"ML","Done","Low",'["analytics"]',null,null] },
]);

console.log("Turso setup complete.");
await db.close();
