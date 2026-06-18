---
name: GrowitBuddy SSR DB-access (live admin SEO/content not server-rendered)
description: How to read the symptom where live SSR serves registry defaults + empty content bootstrap, and why it's a Vercel env issue not stale code.
---

# Symptom

On live (https://growitbuddy.com) the SSR HTML injects, for EVERY page,
`window.__GB_PUBLIC_CONTENT__={}` AND `window.__GB_SEO__={...,"data":{},...}`
(empty), so server-rendered `<title>`/meta fall back to `@workspace/seo`
registry defaults — even though the prod content API DOES return populated
admin rows (`seo:home`, `seo:about`, `seo:insights`, etc. in Neon).

# What it means

`ssr/render.ts` `loadData()` returns `EMPTY_BUNDLE` (seo:{}, content:{}) ONLY when
(a) `DB_URL` is falsy, or (b) the neon query throws/aborts. `DB_URL =
process.env.NEON_DATABASE_URL || process.env.DATABASE_URL`. So empty bootstrap on
live = **the Vercel SSR serverless function cannot read the Neon DB**: env var
missing, set under an unsupported name, pointing at the wrong Neon branch/db, or a
consistent query/timeout failure (timeout is 2500ms, neon HTTP has no cold start).

**Why:** this is NOT the same trap as a stale prebuilt `api/render.js`. Verify
staleness separately (render.ts vs render.js same commit = not stale). If both
content AND seo are empty together, suspect DB access, not staleness.

**How to apply / fix:**
- Set `NEON_DATABASE_URL` (preferred) or `DATABASE_URL` in the **Vercel** project
  env (server/runtime, NOT `VITE_*`) = same prod Neon connection string the Render
  API uses. The prod connection string lives in Render/Vercel/Neon, NOT in Replit
  (Replit's `DATABASE_URL` is the dev DB).
- Redeploy Vercel AND purge/refresh cached HTML: empty-but-successful reads cache
  hard (`s-maxage=60`, stale-while-revalidate 86400 ≈ 1 day); fallback HTML caches
  `s-maxage=10`/stale 30. So stale defaults can persist ~1 day after the fix.
- Verify via `view-source:https://growitbuddy.com/about` → `__GB_SEO__.data` should
  be non-empty with the admin title/schema.

# Browser vs crawler nuance

Real browser visitors STILL see correct admin titles: client `DynamicPageSEO`
fetches `${API_BASE}/seo/<slug>` after load and applies admin SEO (stamps
`data-gb-admin="1"`). So humans look fine; the gap hits view-source, social
scrapers (WhatsApp/FB/LinkedIn — no JS), and initial-HTML/non-JS crawlers, which
get registry defaults + empty content until SSR can reach the DB.
