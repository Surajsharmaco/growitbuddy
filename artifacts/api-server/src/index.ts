import app from "./app";
import { logger } from "./lib/logger";
import { db, pool } from "@workspace/db";
import { siteContent } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const CORRECT_FRAMEWORK_STEPS = [
  {
    step: "01",
    title: "Positioning",
    desc: "Shape perception and build recognition in your category and niche so the right people know exactly what you stand for.",
  },
  {
    step: "02",
    title: "Production",
    desc: "Create high-signal content built for attention, trust, and consistency at scale — video, copy, and graphics that communicate authority.",
  },
  {
    step: "03",
    title: "Distribution",
    desc: "Push content into the right audiences through networks and performance systems so it reaches the people who actually matter.",
  },
  {
    step: "04",
    title: "Inbound Demand",
    desc: "Turn compounding visibility into authority, qualified leads, and inbound opportunities — without chasing anyone.",
  },
];

async function runStartupMigrations() {
  // Idempotent column adds for soft-hide functionality across list-based tables.
  // Safe to run on every boot — ADD COLUMN IF NOT EXISTS is a no-op when present.
  const hideColumnTables = ["portfolio_items", "certificates"];
  for (const table of hideColumnTables) {
    try {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false`);
      logger.info({ table }, "Startup migration: is_hidden column ensured.");
    } catch (err) {
      logger.error({ err, table }, "Startup migration: failed to ensure is_hidden column.");
    }
  }

  // Rich case-study payload for portfolio items (text+image+video editorial content).
  try {
    await pool.query(`ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS case_study jsonb`);
    logger.info("Startup migration: portfolio_items.case_study column ensured.");
  } catch (err) {
    logger.error({ err }, "Startup migration: failed to ensure case_study column.");
  }

  // Optional admin-chosen poster image for portfolio video tiles
  // (overrides auto thumbnail fetched from YouTube/Vimeo/Gumlet).
  try {
    await pool.query(`ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS custom_thumbnail_url text`);
    logger.info("Startup migration: portfolio_items.custom_thumbnail_url column ensured.");
  } catch (err) {
    logger.error({ err }, "Startup migration: failed to ensure custom_thumbnail_url column.");
  }

  // Shareable portfolio links — admin hides some categories/items per share.
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS portfolio_shares (
        id serial PRIMARY KEY,
        slug text NOT NULL UNIQUE,
        title text NOT NULL DEFAULT '',
        hidden_categories text[] NOT NULL DEFAULT '{}',
        hidden_item_ids integer[] NOT NULL DEFAULT '{}',
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    logger.info("Startup migration: portfolio_shares table ensured.");
  } catch (err) {
    logger.error({ err }, "Startup migration: failed to ensure portfolio_shares table.");
  }

  try {
    const rows = await db.select().from(siteContent).where(eq(siteContent.section, "home"));
    if (rows.length === 0) {
      logger.info("Startup migration: home section not in DB yet, skipping.");
      return;
    }

    const homeData = rows[0].data as Record<string, unknown>;
    const steps = homeData.frameworkSteps as Array<{ step?: string; title?: string }> | undefined;

    if (!steps || !Array.isArray(steps)) {
      logger.info("Startup migration: frameworkSteps not found, skipping.");
      return;
    }

    const firstTitle = steps[0]?.title ?? "";
    if (firstTitle === "Positioning") {
      logger.info("Startup migration: frameworkSteps already in correct order, skipping.");
      return;
    }

    const updatedData = { ...homeData, frameworkSteps: CORRECT_FRAMEWORK_STEPS };
    await db
      .insert(siteContent)
      .values({ section: "home", data: updatedData })
      .onConflictDoUpdate({
        target: siteContent.section,
        set: { data: updatedData, updatedAt: new Date() },
      });

    logger.info("Startup migration: frameworkSteps updated to Positioning → Production → Distribution → Inbound Demand.");
  } catch (err) {
    logger.error({ err }, "Startup migration failed — server will still start.");
  }
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  runStartupMigrations();
});
