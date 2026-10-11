import { readFile } from "node:fs/promises";
import pg from "pg";
if (!process.argv.includes("--apply")) throw new Error("Pass --apply after verifying the target database. This adds CMS safety tables only.");
const connectionString = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Database is not configured.");
const pool = new pg.Pool({ connectionString, ssl: connectionString.includes("neon.tech") ? { rejectUnauthorized: false } : undefined });
try {
  if (process.argv.includes("--dev-empty-only")) {
    const rows = await pool.query("SELECT data FROM site_content WHERE section='blog'");
    if ((rows.rows[0]?.data?.posts ?? []).length) throw new Error("Expected the verified empty development blog collection. Refusing this target.");
  }
  await pool.query(await readFile(new URL("../migrations/cms-safety.sql", import.meta.url), "utf8"));
  console.log("CMS safety tables created. Existing content and media were not changed.");
} finally { await pool.end(); }
