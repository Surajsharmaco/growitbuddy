---
name: GrowitBuddy SEO architecture
description: How SEO meta is served on the GrowitBuddy SPA and the sync constraints that cause stale-index bugs
---

GrowitBuddy is a React+Vite SPA (Vercel) + Express API (Render) + Neon DB. SEO meta is NOT only from index.html.

- `DynamicPageSEO.tsx` runs client-side on every route, fetches admin SEO from the API (`siteContent` section `seo:<slug>`), and OVERWRITES every meta/canonical/robots/JSON-LD tag. When there is no DB override OR the fetch fails/times out, it falls back to `pageRegistry.ts` `defaults`.
- **Consequence:** a correct `index.html` title can still be overridden by a STALE `pageRegistry.ts` default. If the DB has no `seo:<slug>` row, the registry default is what Google sees after JS render. So registry defaults must always reflect current branding.

**Sync rule:** three places must agree on each public page's path:
1. `artifacts/growitbuddy/src/lib/pageRegistry.ts` (PAGE_REGISTRY)
2. `artifacts/api-server/src/routes/sitemap.ts` (REGISTERED_PAGES)
3. `artifacts/growitbuddy/public/sitemap.xml` (static fallback)
**Why:** drift makes sitemaps list redirecting/wrong URLs, diluting crawl signals.

- Canonical insights/blog path is `/blog`; `/insights` permanently redirects to `/blog` (App.tsx). Sitemaps must list `/blog`.
- Dynamic sitemaps live on the API host `growitbuddy-api.onrender.com` (`/api/sitemap.xml`, `/api/sitemap-blog.xml`) and respect per-page index/sitemap toggles + global `seo-global.siteIndexable`. robots.txt must point there (a wrong leftover host `garden-planner-newzip.onrender.com` was once hardcoded).
- Vercel does NOT proxy `/api` to Render; frontend calls the API cross-domain via `VITE_API_URL`. So `growitbuddy.com/api/...` does not exist in prod.
- Production DB is Neon (NEON_DATABASE_URL), NOT Replit-managed, so `executeSql(environment:"production")` cannot reach it.
