---
name: GrowitBuddy SEO single source of truth
description: Why the page list / sitemaps / JSON-LD share one registry, and the build gotchas around it.
---

# Single source of truth for SEO

The canonical page list, sitemap builders, brand constants, and JSON-LD builders live in the
shared package `@workspace/seo`. The website page registry, the API `/api/sitemap.xml` route,
and the static `public/sitemap.xml` generator all derive from it.

**Why:** the page list used to be duplicated in three places and silently drifted; never
reintroduce a second hand-maintained list.

**Invariants to preserve:**
- Blog canonical path is `/blog` (old `/insights/*` 301-redirects), so the blog sitemap must
  emit `/blog/...` locs.
- Site-level Organization + WebSite JSON-LD is rendered statically in `index.html` for
  crawlers; the `@workspace/seo` schema builders must mirror it (brand logo is `logo-dark.png`).
  Keep both in sync if brand data changes.
- The API sitemap respects live admin index/sitemap DB toggles, so it can legitimately list
  fewer urls than the static fallback. That divergence is expected, not a bug.

# Build gotchas for shared composite `lib/*` packages (this repo)

- `dist/` is gitignored repo-wide. Declarations are built fresh by the root
  `tsc --build` (`pnpm run typecheck:libs`), driven by **root `tsconfig.json` `references`**.
  A new `lib/*` package MUST be added to those references or consumers' `tsc -p --noEmit`
  fail with **TS6305** and the imported types collapse to `any`.
- Match the existing libs: `exports: { ".": "./src/index.ts" }`, `composite` tsconfig, and
  NO package scripts (the root build orchestrates everything).
- Both prod deploys bundle (Vite on Vercel, esbuild on Render) so they don't need `dist`;
  adding another shared workspace package is proven-safe for both. `vite build` requires a
  `PORT` env var just to load its config.
