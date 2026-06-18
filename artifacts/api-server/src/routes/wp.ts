import { Router, type IRouter, type Request, type Response } from "express";

/**
 * WordPress featured-image resolver.
 *
 * The WP REST media endpoint on blog.growitbuddy.com is locked for
 * unauthenticated requests (`/wp/v2/media/<id>` -> 401 rest_forbidden, and the
 * `_embed`-ed `wp:featuredmedia` comes back as a "Sorry, you are not allowed to
 * do that" error). So the public site can read posts but never learns the
 * featured-image URL from the API.
 *
 * The image FILE itself is public (served straight from /wp-content/uploads),
 * and the post's own public HTML page renders it with WordPress's standard
 * `wp-post-image` class. The browser can't scrape that page cross-origin (CORS),
 * but this server can fetch it server-to-server. We extract the URL here and the
 * frontend merges it onto the WordPress posts it already loaded.
 */
const wpRouter: IRouter = Router();

const WP_SITE = "https://blog.growitbuddy.com";

// slug -> resolved URL (or null when no image was found), with TTL.
const CACHE = new Map<string, { url: string | null; expiresAt: number }>();
const CACHE_MAX = 1000;
const TTL_HIT = 6 * 60 * 60 * 1000; // 6h once an image is found
const TTL_MISS = 30 * 60 * 1000; // 30m for misses, so newly-added images show up soon

function cacheSet(slug: string, url: string | null, expiresAt: number) {
  if (CACHE.size >= CACHE_MAX) {
    const now = Date.now();
    for (const [k, v] of CACHE) if (v.expiresAt <= now) CACHE.delete(k);
    while (CACHE.size >= CACHE_MAX) {
      const oldest = CACHE.keys().next().value;
      if (oldest === undefined) break;
      CACHE.delete(oldest);
    }
  }
  CACHE.set(slug, { url, expiresAt });
}

function pickImgSrc(tag: string): string | null {
  // Lazy-loading themes keep the real URL in data-* attrs and a placeholder in
  // src, so try those first; require an absolute http(s) URL in every case.
  for (const attr of ["data-lazy-src", "data-src", "src"]) {
    const m = new RegExp(`\\b${attr}=["']([^"']+)["']`, "i").exec(tag);
    if (m && /^https?:\/\//i.test(m[1])) return m[1];
  }
  const ss = /\bsrcset=["']([^"']+)["']/i.exec(tag);
  if (ss) {
    const first = ss[1].split(",")[0]?.trim().split(/\s+/)[0];
    if (first && /^https?:\/\//i.test(first)) return first;
  }
  return null;
}

function extractFeaturedImage(html: string): string | null {
  // 1) WordPress tags the featured image <img> with the `wp-post-image` class.
  const wpImg = /<img\b[^>]*\bwp-post-image\b[^>]*>/i.exec(html);
  if (wpImg) {
    const url = pickImgSrc(wpImg[0]);
    if (url) return url;
  }
  // 2) Open Graph / Twitter image meta (SEO plugins set these to the featured image).
  const og = /<meta\b[^>]*(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*>/i.exec(html);
  if (og) {
    const m = /content=["']([^"']+)["']/i.exec(og[0]);
    if (m && /^https?:\/\//i.test(m[1])) return m[1];
  }
  // 3) Last resort: the first uploaded image referenced on the page.
  const up = /https?:\/\/[^"' ]*\/wp-content\/uploads\/[^"' ]+\.(?:jpe?g|png|webp|gif|avif)/i.exec(html);
  if (up) return up[0];
  return null;
}

async function resolveOne(slug: string): Promise<string | null> {
  const now = Date.now();
  const cached = CACHE.get(slug);
  if (cached && cached.expiresAt > now) return cached.url;

  let url: string | null = null;
  try {
    const r = await fetch(`${WP_SITE}/${encodeURIComponent(slug)}/`, {
      headers: { "User-Agent": "growitbuddy-featured-image/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    // fetch follows redirects by default; only trust the body if it never left
    // the first-party host (defence-in-depth against an open-redirect → SSRF).
    if (r.ok && new URL(r.url).hostname === "blog.growitbuddy.com") {
      url = extractFeaturedImage(await r.text());
    }
  } catch {
    /* network/timeout — treat as a miss, retry after the short TTL */
  }
  cacheSet(slug, url, now + (url ? TTL_HIT : TTL_MISS));
  return url;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// GET /api/wp/featured-images?slugs=slug-a,slug-b
// -> { images: { "slug-a": "https://…", "slug-b": null } }
wpRouter.get("/featured-images", async (req: Request, res: Response) => {
  const raw = String(req.query.slugs || "").trim();
  const slugs = Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        // WordPress slugs are lowercase alphanumerics + hyphens; this also
        // pins the fetch to a safe path segment (no SSRF via the slug).
        .filter((s) => /^[a-z0-9-]+$/.test(s)),
    ),
  ).slice(0, 40);

  const images: Record<string, string | null> = {};
  if (slugs.length) {
    try {
      const results = await mapLimit(slugs, 6, resolveOne);
      slugs.forEach((s, i) => {
        images[s] = results[i];
      });
    } catch (err) {
      req.log.warn({ err }, "wp featured-images resolve failed");
    }
  }

  res.setHeader("Cache-Control", "public, max-age=1800, stale-while-revalidate=3600");
  res.json({ images });
});

export default wpRouter;
