import { readFile } from "node:fs/promises";
import pg from "pg";
if (!process.argv.includes("--apply")) throw new Error("Pass --apply; this adds ACTS-only CRM and session tables.");
const connectionString = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Database is not configured.");
const pool = new pg.Pool({ connectionString, ssl: connectionString.includes("neon.tech") ? { rejectUnauthorized: false } : undefined });
try {
  await pool.query(await readFile(new URL("../migrations/acts-crm.sql", import.meta.url), "utf8"));
  console.log("ACTS CRM migration complete. Existing checkouts were preserved and indexed.");
} finally { await pool.end(); }