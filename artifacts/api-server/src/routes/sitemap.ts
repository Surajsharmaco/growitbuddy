import { Router, type Request, type Response } from "express";
import { db, siteContent } from "@workspace/db";
import { eq } from "drizzle-orm";

const sitemapRouter = Router();

const SITE = "https://growitbuddy.com";
const WP_API = "https://blog.growitbuddy.com/wp-json/wp/v2";

interface WPPost {
  slug: string;
  date: string;
  modified: string;
}

sitemapRouter.get("/sitemap-blog.xml", async (req: Request, res: Response) => {
  const urls: string[] = [];

  // Fetch WordPress posts (server-side — no JS rendering needed for Googlebot)
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

  // Fetch CMS blog posts from database
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
