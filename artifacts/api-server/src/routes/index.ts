import { Router, type IRouter, type Request, type Response } from "express";
import healthRouter from "./health";
import formsRouter from "./forms";
import adminRouter from "./admin";
import aiSeoRouter from "./ai-seo";
import sitemapRouter from "./sitemap";
import { db, mediaFiles, siteContent } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sitemapRouter);
router.use("/forms", formsRouter);

// ── Public media serving (no auth, serves images/videos stored in DB) ──
router.get("/media/file/:id", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).end(); return; }
  try {
    const rows = await db
      .select({ mimetype: mediaFiles.mimetype, data: mediaFiles.data })
      .from(mediaFiles)
      .where(eq(mediaFiles.id, id))
      .limit(1);
    if (!rows.length) { res.status(404).end(); return; }
    const { mimetype, data } = rows[0];
    const buf = Buffer.from(data, "base64");
    res.setHeader("Content-Type", mimetype);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Length", String(buf.length));
    res.end(buf);
  } catch {
    res.status(500).end();
  }
});

// ── Public SEO record (no auth) ──
// Returns admin-configured SEO overrides for a given page slug.
// Storage: siteContent where section = `seo:<slug>`.
router.get("/seo/:slug", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  if (!/^[a-z0-9-]+$/i.test(slug)) {
    res.status(400).json({ error: "invalid slug" });
    return;
  }
  try {
    const rows = await db
      .select({ data: siteContent.data, updatedAt: siteContent.updatedAt })
      .from(siteContent)
      .where(eq(siteContent.section, `seo:${slug}`))
      .limit(1);
    // No caching — admin edits must be visible immediately on next page-load.
    // Payload is tiny (~1 KB JSON) so this has negligible cost.
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    if (!rows.length) { res.json({ slug, data: null }); return; }
    res.json({ slug, data: rows[0].data, updatedAt: rows[0].updatedAt });
  } catch {
    res.status(500).json({ error: "failed" });
  }
});

router.use("/admin", adminRouter);
router.use("/admin/ai-seo", aiSeoRouter);

export default router;
