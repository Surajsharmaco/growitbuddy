import { Router, type Request, type Response, type IRouter } from "express";
import { db, siteContent } from "@workspace/db";
import { eq, like } from "drizzle-orm";

const sitemapRouter: IRouter = Router();

const SITE = "https://growitbuddy.com";
const WP_API = "https://blog.growitbuddy.com/wp-json/wp/v2";

interface WPPost { slug: string; date: string; modified: string; }

/**
 * Public pages registered for the main sitemap.
 * Keep in sync with `artifacts/growitbuddy/src/lib/pageRegistry.ts`.
 * `priority` and `changefreq` are coarse SEO hints.
 */
interface RegisteredPage { slug: string; path: string; priority: number; changefreq: string; }

const REGISTERED_PAGES: RegisteredPage[] = [
  { slug: "home",                  path: "/",                       priority: 1.0, changefreq: "weekly"  },
  { slug: "about",                 path: "/about",                  priority: 0.7, changefreq: "monthly" },
  { slug: "contact",               path: "/contact",                priority: 0.7, changefreq: "monthly" },
  { slug: "insights",              path: "/blog",                   priority: 0.8, changefreq: "weekly"  },
  { slug: "services",              path: "/services",               priority: 0.9, changefreq: "monthly" },
  { slug: "work",                  path: "/work",                   priority: 0.8, changefreq: "monthly" },
  { slug: "framework",             path: "/framework",              priority: 0.7, changefreq: "monthly" },
  { slug: "authority-audit",       path: "/authority-audit",        priority: 0.8, changefreq: "monthly" },
  { slug: "influencers",           path: "/influencers",            priority: 0.7, changefreq: "weekly"  },
  { slug: "distribution",          path: "/distribution",           priority: 0.7, changefreq: "monthly" },
  { slug: "join",                  path: "/join",                   priority: 0.7, changefreq: "monthly" },
  { slug: "creators",              path: "/creators",               priority: 0.7, changefreq: "monthly" },
  { slug: "career",                path: "/career",                 priority: 0.7, changefreq: "monthly" },
  { slug: "creator-school",        path: "/editors-pool",           priority: 0.7, changefreq: "monthly" },
  { slug: "video-editors",         path: "/video-editors",          priority: 0.7, changefreq: "monthly" },
  { slug: "designers-pool",        path: "/designers-pool",         priority: 0.7, changefreq: "monthly" },
  { slug: "thumbnail-designers",   path: "/thumbnail-designers",    priority: 0.7, changefreq: "monthly" },
  { slug: "writers-pool",          path: "/writers-pool",           priority: 0.7, changefreq: "monthly" },
  { slug: "social-media-managers", path: "/social-media-managers",  priority: 0.7, changefreq: "monthly" },
  { slug: "motion-designers",      path: "/motion-designers",       priority: 0.7, changefreq: "monthly" },
  { slug: "ai-creators",           path: "/ai-creators",            priority: 0.7, changefreq: "monthly" },
  { slug: "ugc-creators",          path: "/ugc-creators",           priority: 0.7, changefreq: "monthly" },
  { slug: "meme-designers",        path: "/meme-designers",         priority: 0.7, changefreq: "monthly" },
  // Additional public pages
  { slug: "resources",             path: "/resources",              priority: 0.7, changefreq: "weekly"  },
  { slug: "join-page-owner",       path: "/join/page-owner",        priority: 0.6, changefreq: "monthly" },
  { slug: "privacy",               path: "/privacy",                priority: 0.3, changefreq: "yearly"  },
  { slug: "terms",                 path: "/terms",                  priority: 0.3, changefreq: "yearly"  },
];

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
  const urls: string[] = [];
  if (globalIndexable) {
    for (const page of REGISTERED_PAGES) {
      const seo = seoMap.get(page.slug);
      if (seo && (seo.index === false || seo.sitemap === false)) continue;
      urls.push(
        `  <url>\n    <loc>${SITE}${page.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority.toFixed(1)}</priority>\n  </url>`,
      );
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
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
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>`;
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
          `  <url>\n    <loc>${SITE}/insights/wp-${post.slug}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
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

    const posts = (rows[0]?.data?.posts ?? []) as Array<{ slug?: string; date?: string }>;
    const fallbackDate = new Date().toISOString().split("T")[0];

    for (const post of posts) {
      if (!post.slug) continue;
      const lastmod = post.date
        ? new Date(post.date).toISOString().split("T")[0]
        : fallbackDate;
      urls.push(
        `  <url>\n    <loc>${SITE}/insights/${post.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
      );
    }
  } catch { /* DB error — skip gracefully */ }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.send(xml);
});

export default sitemapRouter;
