import { Router, type IRouter } from "express";
import { db, siteContent, pageVariants } from "@workspace/db";
import { eq, like, or } from "drizzle-orm";
import {
  PAGE_REGISTRY, wrapUrlset, buildLiveSitemapIndex,
  buildLivePageSitemapEntries, buildLiveBlogSitemapEntries, type LiveSitemapPolicy,
} from "@workspace/seo";
import { logger } from "../lib/logger";

const sitemapRouter: IRouter = Router();

async function readPolicy(): Promise<LiveSitemapPolicy> {
  const [rows, variants] = await Promise.all([
    db.select({ section: siteContent.section, data: siteContent.data }).from(siteContent).where(or(
      like(siteContent.section, "seo:%"),
      eq(siteContent.section, "seo-global"), eq(siteContent.section, "page_visibility"),
      eq(siteContent.section, "blog"), eq(siteContent.section, "cms-pages"),
    )),
    db.select({ slug: pageVariants.slug, sourceKey: pageVariants.sourceKey }).from(pageVariants).where(eq(pageVariants.isLive, true)),
  ]);
  const data = Object.fromEntries(rows.map(row => [row.section, row.data]));
  const blog = data.blog as { posts?: LiveSitemapPolicy["posts"] } | null;
  const pages = data["cms-pages"] as { posts?: LiveSitemapPolicy["cmsPages"] } | null;
  return {
    globalIndexable: (data["seo-global"] as { siteIndexable?: boolean } | null)?.siteIndexable !== false,
    seo: Object.fromEntries(rows.filter(row => row.section.startsWith("seo:")).map(row => [row.section.slice(4), row.data])) as LiveSitemapPolicy["seo"],
    visibility: (data.page_visibility ?? {}) as LiveSitemapPolicy["visibility"],
    posts: Array.isArray(blog?.posts) ? blog.posts : [],
    cmsPages: Array.isArray(pages?.posts) ? pages.posts : [],
    variants,
  };
}

// Generate on every request: saves/publishing/deletion need no deployment, cron,
// stale snapshot, or obsolete Google ping. Fail closed if authoritative reads fail.
for (const path of ["/sitemap.xml", "/sitemap-pages.xml", "/sitemap-blog.xml"]) {
  sitemapRouter.get(path, async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const policy = await readPolicy();
      const xml = path === "/sitemap.xml" ? buildLiveSitemapIndex() : wrapUrlset(
        path === "/sitemap-blog.xml" ? buildLiveBlogSitemapEntries(policy) : buildLivePageSitemapEntries(PAGE_REGISTRY, policy),
      );
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.send(xml);
    } catch (error) {
      logger.error({ error }, "Authoritative sitemap read failed");
      res.status(503).setHeader("Retry-After", "60");
      res.type("text/plain").send("Sitemap is temporarily unavailable. Please retry.");
    }
  });
}
export default sitemapRouter;