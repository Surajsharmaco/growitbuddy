---
name: GrowitBuddy SEO navigation flash
description: Why client-side menu navigation flashed default SEO then admin SEO, and the cache fix that prevents it.
---

# GrowitBuddy SEO navigation flash

**Symptom:** On every client-side menu navigation the page briefly showed the
registry DEFAULT title/meta, then swapped to the admin "SEO Control" values — a
visible flash. Manifests on prod only; the dev DB has no `seo:*` rows, so
default == fetched and nothing flashes locally.

**Root cause:** `DynamicPageSEO` had no client cache. Its `useLayoutEffect` ran
on every navigation and applied the SSR bootstrap `window.__GB_SEO__`, which only
matches the INITIAL page's slug. For every OTHER page it applied the registry
default synchronously, then an async per-slug fetch applied the admin SEO later.

**Fix / rule:** Client navigation must apply SEO SYNCHRONOUSLY from a
module-level cache (`lib/seoCache.ts`: `syncSeoFor` = cache → bootstrap → empty).
The cache is warmed once at startup by `prefetchAllSEO()` hitting the bulk
`GET /api/seo` endpoint (`{global:{siteIndexable}, pages:{slug:data}}`). The
per-navigation `GET /api/seo/:slug` (no-store) still runs and records the latest
into the cache, so admin edits show on the next visit.

**Why:** `useLayoutEffect` paints before any async fetch resolves; without a
synchronous source of the admin value, the default is unavoidable on first paint.
The bootstrap can't cover client navigation — it only carries the initial page.

**How to apply:** Never "simplify" by deleting `seoCache` or making the
layout-effect apply only the bootstrap/registry default — that reintroduces the
flash. Keep `GET /api/seo` registered alongside `GET /api/seo/:slug` (the param
route does NOT match the bare `/seo`, so ordering is safe). Bulk route keeps
no-store headers. This was a dev-only change; effect is visible after deploy.
