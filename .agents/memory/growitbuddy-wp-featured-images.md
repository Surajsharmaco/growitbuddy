---
name: GrowitBuddy WordPress featured-image pipeline
description: Why blog featured images "disappear", how the scrape pipeline works, and the durable fix.
---

# Blog (WordPress) featured images

The /blog posts come from `blog.growitbuddy.com` (WordPress). **The WP REST media endpoint is LOCKED** for anonymous requests — `/wp-json/wp/v2/media/<id>` and the `_embed`-ed `wp:featuredmedia` both return `401 rest_forbidden "Sorry, you are not allowed to do that."` (a WP security plugin locks the REST API). So a post's featured-image URL is **never** available from the WP API.

**Workaround (the only reason images show at all):** `useWordPressPosts.ts` loads posts, then for any post missing an image calls the api-server `GET /api/wp/featured-images?slugs=...` (`artifacts/api-server/src/routes/wp.ts`). That endpoint **scrapes the post's public HTML page** server-to-server and extracts: `wp-post-image` class → `og:image`/`twitter:image` meta → first `/wp-content/uploads/...` image. Frontend merges the URL onto the post; `Insights.tsx` renders it via `resolveMediaUrl()` (absolute URLs pass through unchanged).

## Recurring "featured image gone / won't show" = LIVE CACHE LAG, not a real loss
Almost every report is the user adding/replacing a featured image in WordPress and the **live** site (Render api-server) still serving a cached old/absent value. **Diagnose by curl, don't guess:**
- `https://blog.growitbuddy.com/wp-json/wp/v2/posts?per_page=100&_fields=id,slug,featured_media` — `featured_media>0` means an image IS set in WP.
- `curl -I <the uploads image URL>` — confirm the file itself is HTTP 200.
- DEV scrape: `localhost:80/api/wp/featured-images?slugs=<slug>` vs LIVE: `https://growitbuddy-api.onrender.com/api/wp/featured-images?slugs=<slug>`. **DEV resolves but LIVE returns `null` ⇒ stale cache on Render**, not a broken image.

**Why it lagged:** TTLs + HTTP cache were too long (in-memory hit 6h / miss 30m AND `Cache-Control: max-age=1800`). A just-added image stayed `null` up to 30m; a *changed* image stayed on the old URL up to 6h.

**Fix applied:** in-memory `TTL_HIT=30m`, `TTL_MISS=3m`, and `Cache-Control: public, max-age=180, stale-while-revalidate=300`. **Keep the HTTP cache window in step with the in-memory TTL** — if the HTTP header is longer, a browser/CDN pins stale `null` regardless of the server TTL (architect caught this). Also switched the scraper to a real desktop-Chrome User-Agent + Accept header: bot UAs from datacenter IPs (the prod server) can be silently 403'd by a WAF while the page renders fine for real visitors. WP did NOT block the browser UA (verified).

**These changes only take effect on the next deploy** (they're api-server/Render code). Until then the live instance self-heals within its *old* TTL. The current live `null` clears on its own once the old miss-TTL expires or after redeploy wipes the in-memory cache.

## Durable root fix (recommended, WP-side)
Unlock anonymous read access to the WP REST media endpoint (the security plugin that returns 401). Then `_embedded["wp:featuredmedia"][0].source_url` works directly — **no scraping, instant, 100% reliable**, and the whole fragile scrape becomes a fallback only. This is the only permanent cure for the recurring complaint; the scrape is inherently best-effort.
