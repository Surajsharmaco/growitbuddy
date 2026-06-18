import { Router, type Request, type Response, type IRouter } from "express";
import { db, siteContent } from "@workspace/db";
import { eq, like } from "drizzle-orm";
import { SITE_URL, BLOG_PATH, buildSitemapXml, wrapUrlset } from "@workspace/seo";

const sitemapRouter: IRouter = Router();

const SITE = SITE_URL;
const WP_API = "https://blog.growitbuddy.com/wp-json/wp/v2";

interface WPPost { slug: string; date: string; modified: string; }

interface SEOData {
  index?: boolean;
  sitemap?: boolean;
}

/**
 * Main sitemap.xml — pulls per-page SEO overrides from siteContent (section "seo:<slug>")
 * and excludes pages where index=false or sitemap=false.
 */
sitemapRouter.get("/sitemap.xml", async (_req: Request, res: Response) => {
  // Master global switch: if siteIndexable === false, return empty sitemap
  // so search engines have nothing to discover.
  let globalIndexable = true;
  try {
    const g = await db
      .select({ data: siteContent.data })
      .from(siteContent)
      .where(eq(siteContent.section, "seo-global"))
      .limit(1);
    const gd = g[0]?.data as { siteIndexable?: boolean } | undefined;
    if (gd && gd.siteIndexable === false) globalIndexable = false;
  } catch { /* ignore — default to allowed */ }

  // Fetch ALL seo:* rows in one query
  let seoMap = new Map<string, SEOData>();
  try {
    const rows = await db
      .select({ section: siteContent.section, data: siteContent.data, updatedAt: siteContent.updatedAt })
      .from(siteContent)
      .where(like(siteContent.section, "seo:%"));
    seoMap = new Map(rows.map((r: { section: string; data: unknown }) => [r.section.replace(/^seo:/, ""), r.data as SEOData]));
  } catch { /* DB down — fall through with empty map (all pages included by default) */ }

  const today = new Date().toISOString().split("T")[0];
  // Built from the shared @workspace/seo registry so this sitemap can never
  // drift from the frontend page list or the static fallback sitemap.
  const xml = globalIndexable
    ? buildSitemapXml({
        lastmod: today,
        siteUrl: SITE,
        include: (page) => {
          const seo = seoMap.get(page.slug);
          return !(seo && (seo.index === false || seo.sitemap === false));
        },
      })
    : wrapUrlset([]);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=600, stale-while-revalidate=3600");
  res.send(xml);
});

sitemapRouter.get("/sitemap-blog.xml", async (_req: Request, res: Response) => {
  const urls: string[] = [];

  // Master global switch — return empty blog sitemap when site is hidden.
  let globalIndexable = true;
  try {
    const g = await db
      .select({ data: siteContent.data })
      .from(siteContent)
      .where(eq(siteContent.section, "seo-global"))
      .limit(1);
    const gd = g[0]?.data as { siteIndexable?: boolean } | undefined;
    if (gd && gd.siteIndexable === false) globalIndexable = false;
  } catch { /* ignore */ }

  if (!globalIndexable) {
    const xml = wrapUrlset([]);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.send(xml);
    return;
  }

  try {
    const wpRes = await fetch(
      `${WP_API}/posts?per_page=100&status=publish&_fields=slug,date,modified`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (wpRes.ok) {
      const wpPosts: WPPost[] = await wpRes.json() as WPPost[];
      for (const post of wpPosts) {
        const lastmod = post.modified?.split("T")[0] ?? post.date?.split("T")[0] ?? "";
        urls.push(
          `  <url>\n    <loc>${SITE}${BLOG_PATH}/wp-${post.slug}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
        );
      }
    }
  } catch { /* WP unreachable — skip gracefully */ }

  try {
    const rows = await db
      .select({ data: siteContent.data, updatedAt: siteContent.updatedAt })
      .from(siteContent)
      .where(eq(siteContent.section, "blog"))
      .limit(1);

    const posts = (rows[0]?.data?.posts ?? []) as Array<{ slug?: string; date?: string; trashed?: boolean; status?: string }>;
    const fallbackDate = new Date().toISOString().split("T")[0];

    for (const post of posts) {
      if (!post.slug) continue;
      // Never advertise trashed or draft posts in the sitemap (mirror /blog).
      if (post.trashed === true || (post.status ?? "published") !== "published")
        continue;
      const lastmod = post.date
        ? new Date(post.date).toISOString().split("T")[0]
        : fallbackDate;
      urls.push(
        `  <url>\n    <loc>${SITE}${BLOG_PATH}/${post.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
      );
    }
  } catch { /* DB error — skip gracefully */ }

  const xml = wrapUrlset(urls);

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.send(xml);
});

export default sitemapRouter;
