import { Router, type IRouter, type Request, type Response } from "express";
import healthRouter from "./health";
import formsRouter from "./forms";
import adminRouter from "./admin";
import aiSeoRouter from "./ai-seo";
import sitemapRouter from "./sitemap";
import { db, mediaFiles } from "@workspace/db";
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

router.use("/admin", adminRouter);
router.use("/admin/ai-seo", aiSeoRouter);

export default router;
