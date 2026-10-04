import { readFile } from "node:fs/promises";
import pg from "pg";

if (!process.argv.includes("--apply")) {
  throw new Error("Pass --apply to add only the two ACTS membership tables to the configured app database.");
}
const connectionString = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("The app database is not configured.");
const pool = new pg.Pool({
  connectionString,
  ssl: connectionString.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
});
try {
  const sql = await readFile(new URL("../migrations/acts-memberships.sql", import.meta.url), "utf8");
  await pool.query(sql);
  process.stdout.write("ACTS membership tables are ready. Existing product tables were not changed.\n");
} finally {
  await pool.end();
}