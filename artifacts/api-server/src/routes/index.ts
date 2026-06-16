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
      .select({ mimetype: mediaFiles.mimetype, data: mediaFiles.data, url: mediaFiles.url })
      .from(mediaFiles)
      .where(eq(mediaFiles.id, id))
      .limit(1);
    if (!rows.length) { res.status(404).end(); return; }
    const { mimetype, data, url } = rows[0];
    if (url) { res.redirect(302, url); return; }
    if (!data) { res.status(404).end(); return; }
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
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    if (!rows.length) { res.json({ slug, data: null }); return; }
    res.json({ slug, data: rows[0].data, updatedAt: rows[0].updatedAt });
  } catch {
    res.status(500).json({ error: "failed" });
  }
});

// ── Gumlet thumbnail proxy ──
const GUMLET_THUMB_CACHE = new Map<string, { url: string; expiresAt: number }>();
const GUMLET_THUMB_CACHE_MAX = 2000;
function gumletCacheSet(id: string, url: string, expiresAt: number) {
  if (GUMLET_THUMB_CACHE.size >= GUMLET_THUMB_CACHE_MAX) {
    const now = Date.now();
    for (const [k, v] of GUMLET_THUMB_CACHE) {
      if (v.expiresAt <= now) GUMLET_THUMB_CACHE.delete(k);
    }
    while (GUMLET_THUMB_CACHE.size >= GUMLET_THUMB_CACHE_MAX) {
      const oldest = GUMLET_THUMB_CACHE.keys().next().value;
      if (oldest === undefined) break;
      GUMLET_THUMB_CACHE.delete(oldest);
    }
  }
  GUMLET_THUMB_CACHE.set(id, { url, expiresAt });
}
router.get("/video-thumb", async (req: Request, res: Response) => {
  const id = String(req.query.id || "").trim();
  if (!/^[a-zA-Z0-9]{6,64}$/.test(id)) {
    res.status(400).json({ error: "invalid id" });
    return;
  }
  try {
    const now = Date.now();
    const cached = GUMLET_THUMB_CACHE.get(id);
    if (cached && cached.expiresAt > now) {
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.redirect(302, cached.url);
      return;
    }
    const embedUrl = `https://play.gumlet.io/embed/${id}`;
    const oe = await fetch(
      `https://api.gumlet.com/v1/oembed?url=${encodeURIComponent(embedUrl)}&format=json`,
      { headers: { "User-Agent": "growitbuddy-thumb-proxy/1.0" } },
    );
    if (!oe.ok) { res.status(404).json({ error: "lookup failed" }); return; }
    const data = (await oe.json()) as { thumbnail_url?: string };
    const thumb = data.thumbnail_url;
    if (!thumb) { res.status(404).json({ error: "no thumbnail" }); return; }
    gumletCacheSet(id, thumb, now + 24 * 60 * 60 * 1000);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.redirect(302, thumb);
  } catch {
    res.status(500).json({ error: "failed" });
  }
});

router.use("/admin", adminRouter);
router.use("/admin/ai-seo", aiSeoRouter);

export default router;
