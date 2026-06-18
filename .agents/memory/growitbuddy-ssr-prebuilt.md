---
name: GrowitBuddy SSR prebuilt render.js + content defaults
description: How the Vercel SSR function is built/shipped, why source edits can silently not deploy, and the empty-fallback rule for user-deletable list sections.
---

# GrowitBuddy SSR (Vercel) — prebuilt bundle + content-default rules

## `api/render.js` is a committed prebuilt bundle (deploys AS-IS)
- `artifacts/growitbuddy/api/render.js` is an esbuild bundle of `ssr/render.ts`, **committed** and deployed by Vercel unchanged.
- Vercel's `pnpm run build` = `vite build` + `scripts/postbuild-ssr.mjs`. postbuild only regenerates `api/_template.js` (the HTML shell with the build's hashed asset tags). **It does NOT rebuild `api/render.js`.**
- **Gotcha:** editing any `ssr/*` file (`render.ts`, `contentDefaults.ts`, …) does nothing in prod until you re-run `node artifacts/growitbuddy/scripts/build-fn.mjs` to regenerate `api/render.js` and commit it. Easy to "fix the source" and have it silently never ship.
- `build-fn.mjs` bundles with esbuild, **inlines** `@workspace/seo` and `@neondatabase/serverless`, keeps only `./_template.js` external.
  - It needs `@neondatabase/serverless` resolvable. It was missing from growitbuddy → bundle failed with "Could not resolve @neondatabase/serverless". Fixed by adding it as a **devDependency** of `@workspace/growitbuddy` (build-time only; the Vite client never imports it). Pin matched the inlined version (`1.1.0`).
- After regen, sanity-check: file maps the changed sections correctly, contains no demo strings, still inlines neon (`rg -c neondatabase`), keeps `from "./_template.js"`.

## User-deletable LIST sections must use EMPTY fallbacks in `ssr/contentDefaults.ts`
- `CONTENT_DEFAULTS` feeds the SSR crawler/SEO body via `mergeForBody`/`isEmptyContent` when the DB value is empty. For most pages the code defaults ARE the real copy (keep them).
- For **user-deletable lists** the default must be empty, never demo data: `"distribution-pages": { items: [] }`, `blog: { posts: [] }`. Demo arrays here resurrect deleted content in the crawler body / first paint (same class as the ghost-data write-side fix).
- **Why:** `mergeForBody(def, db)` returns `def` when `isEmptyContent(db)`; if `def` is a demo array, an empty/unreachable DB shows demo. With `{items:[]}`, empty DB → empty (correct); real DB → shallow merge returns the real value.
- `influencer-explore` default is page chrome only (no embedded list) — leave it.

## Optimize / cache-clear buttons are honest no-ops (audited)
- `/admin/optimize/cache-clear` & `full-cache-clear` only purge expired session tokens + run `ANALYZE`; `image-cache-clear` is a no-op. Messages are accurate ("public content served live, no server cache").
- They do **NOT** call any Vercel API, so they cannot bust Vercel SSR/CDN HTML. Do not "fix" them to expect CDN purge — that's by design (no server-side content cache exists).
- **Why it matters:** the user's "refresh pe purani cheezein wapas aa jaati hain" was demo-data resurrection from SSR defaults (fixed via empty-list rule above), NOT a stale server cache. Vercel edge HTML can still be up to ~60s stale (s-maxage=60 + stale-while-revalidate); the client no-store fetch corrects it after JS loads.

## Vercel SSR bootstrap is empty on every page (separate env issue)
- Live HTML shows `window.__GB_PUBLIC_CONTENT__={}` on home/blog/distribution → `loadData` returns EMPTY_BUNDLE, i.e. SSR can't read Neon. The Render API reads the same Neon fine, so the DB is healthy.
- Most likely cause: **`NEON_DATABASE_URL` (or `DATABASE_URL`) not set in Vercel env** (`ssr/render.ts` reads `process.env.NEON_DATABASE_URL || process.env.DATABASE_URL`). `DATA_TIMEOUT_MS=2500`.
- Effect: defeats no-flash SSR (client must wait on cold Render API) and SEO body falls back to code defaults. The empty-list fix above makes this harmless for demo data, but setting the env var on Vercel restores real first-paint + correct SEO. This is user-side Vercel config, not a code fix.
