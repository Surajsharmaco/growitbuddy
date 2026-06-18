---
name: GrowitBuddy WP featured images
description: Why WordPress featured images need a server-side resolver, and how it works.
---

# GrowitBuddy WordPress featured images

WordPress posts come from `blog.growitbuddy.com` (headless, fetched client-side in
`useWordPressPosts.ts`). Featured images do **not** arrive via the REST API.

**Why:** that site's WP REST **media endpoint is locked for anonymous requests** —
`/wp/v2/media/<id>` → 401 `rest_forbidden`, the `?_embed`-ed `wp:featuredmedia`
comes back as a forbidden *error object* (so `source_url` is always undefined),
and `/wp/v2/media` lists empty. The `/wp/v2/posts` endpoint itself works fine.
The image FILE is public (served from `/wp-content/uploads/...`); only the API
hides the URL. The clean long-term fix is on the WordPress side (unblock REST
media access / the security plugin doing it) — but we can't do that for the user.

**How we work around it:** the post's own public HTML page renders the featured
image with WordPress's standard `class="wp-post-image"`. Browsers can't scrape it
(CORS), but the api-server can (server-to-server). So:
- api-server `GET /api/wp/featured-images?slugs=a,b,c` → `{ images: { slug: url|null } }`
  fetches `https://blog.growitbuddy.com/<slug>/` and extracts the image
  (`wp-post-image` src → og:image → first uploads URL). Slugs are validated to
  `^[a-z0-9-]+$` (SSRF guard + pins the path), batch capped, concurrency-limited,
  cached (6h hits / 30m misses). Verify the **final** redirected host is
  `blog.growitbuddy.com` before trusting the body (fetch follows redirects).
- client `resolveWpFeaturedImages()` backfills `featuredImage` after posts load
  (list via a `setPosts` updater, detail via `fetchWpPostBySlug`).

**Gotcha:** this is purely client-side enrichment — SSR/prebuilt render.js does
not include WP posts, so no SSR change is needed. If featured images ever vanish
again, first re-check whether the WP media endpoint is still 401 (root cause is
external WordPress config, not our code).
