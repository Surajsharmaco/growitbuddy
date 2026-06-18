---
name: GrowitBuddy dev DB & prod health-check gotchas
description: How to verify prod connections; why dev DB tests mislead; which signals actually prove persistence.
---

# Verifying GrowitBuddy prod, and dev-DB traps

**App DB connection** (`lib/db/src/index.ts`): uses `NEON_DATABASE_URL ?? DATABASE_URL`. In the Replit dev repl this resolves to a Postgres that has **NO schema pushed** — `leads`, `siteContent` etc. do not exist. So:
- Dev `POST /api/forms/*` returns `200 {"success":true}` but the row is NOT saved — `saveLead` (forms.ts) **catches & swallows** the insert error and still returns success. **A 200 from a form endpoint never proves persistence.** The only truth is the server log (`ERROR ... Failed to save lead to DB`) or reading the row back via admin.
- Dev `/api/seo/:slug` returns **500** (its catch does `res.status(500)`), while `/api/admin/public/content/:section` returns `200 {data:null}` (its catch returns json) — both are just the missing-table symptom in dev, NOT prod bugs. Prod has the tables; prod `/api/seo/home` etc. return 200.

**`executeSql` ≠ the app DB.** The code-execution `executeSql` callback hits Replit's built-in Postgres, which is a *different* database than the api-server uses. `relation "leads" does not exist` from `executeSql` tells you nothing about the app DB. `await import('@workspace/db')` also fails from the code-execution sandbox (cannot resolve the workspace package from repo root).

**To verify prod without admin creds (all non-destructive):**
- Frontend: hit Vercel pages (200).
- Backend: `GET https://growitbuddy-api.onrender.com/api/healthz` → `{"status":"ok"}`.
- Neon reads: `GET /api/admin/public/content/<section>` (note the `/admin` prefix — public content lives under it). `navbar`/`footer` legitimately return `data:null` (code-driven).
- Neon **writes** proven indirectly: content `updatedAt` timestamps are recent AND an uploaded Cloudinary URL is persisted in `influencers` content.
- Cloudinary end-to-end proven: the persisted `res.cloudinary.com/dtxegiw2q/.../growitbuddy/media/*.png` URL loads HTTP 200. (`saveFileToDb` uploads to Cloudinary if `cloudinaryConfigured()`, else base64-in-DB fallback.)
- Forms intake: `POST /api/forms/*` with empty body → 400 (validating); >5/min → 429 (rate-limiter works).
- Admin auth live: wrong password → 401 "Invalid password" (so `ADMIN_PASSWORD` IS set on Render).

**Cannot verify from outside (need prod admin password):** the actual captured leads list, and whether `RESEND_API_KEY` is set on Render. In dev RESEND is OFF (`RESEND_API_KEY not set ... email NOT sent`) — leads still save, but no notification email to cs.growitbuddy@gmail.com. Flag this as the user's one self-check.

**Preview the REAL live cards/content in the Replit dev preview** (dev DB is empty + local api-server usually off → all `/api/...` content fetches 502 → admin-managed lists render their empty default, e.g. distribution grid shows "0 pages"). To see the actual current-repo design against real prod data: create a temporary `artifacts/growitbuddy/.env.local` with `VITE_API_URL=https://growitbuddy-api.onrender.com/api`, restart the `web` workflow, screenshot — `usePublicContent` is GET-only so this is read-only/safe. **Then DELETE `.env.local` and restart again** — it is NOT gitignored in this repo, so leaving it would commit the prod URL on the task-end checkpoint. This is the fastest way to confirm a card/layout change before telling the user to deploy.

**Below-fold sections screenshot BLANK (not a bug):** every Home section card uses framer-motion `whileInView` with `initial={{opacity:0}}`. The `screenshot` app_preview tool only captures the top of the page (no scroll; even a tall `viewport_size` up to 3000px caps out), so any section deeper than the viewport renders at opacity 0 → appears empty. This is why the homepage looks "blank below the hero" in screenshots. To visually verify a deep section (e.g. the ECOSYSTEM two-card section) you must actually scroll — which needs Playwright (NOT installed by default here). For pure CSS/texture tweaks, prefer typecheck + architect review over fighting the screenshot tool.

**Live can lag the repo:** the Vercel build is often behind `origin/main` (see deploy-pipeline memory), so a design improvement already committed (e.g. the distribution follower "highlighted pill") may be invisible on growitbuddy.com until the user redeploys. Always check whether a user's "it looks bad" complaint is actually a stale-deploy gap vs a real code bug — screenshot live AND the dev preview (pointed at prod) to compare.

**SEO go-live gate (before Search Console / manual indexing):** the #1 launch risk is operational, NOT code — the live Vercel SSR (`api/render.js`) must be able to read Neon. After publish, `view-source:https://growitbuddy.com/<page>` for home/about/blog must show a POPULATED `window.__GB_SEO__` (and `__GB_PUBLIC_CONTENT__`), not `{}`. Empty bootstrap on pages that should have admin content = Vercel missing `NEON_DATABASE_URL`/`DATABASE_URL` or serving a stale cached build → fix env + redeploy + purge BEFORE asking Google to index. Also re-confirm live `/robots.txt` (Allow: /), `/sitemap.xml`, `/sitemap-blog.xml` return 200 from the root domain (render.ts serves the sitemaps Neon-direct).

**OG image dimension trap:** `og:image:width`/`height` are hardcoded `1200`/`630` in BOTH the SSR template (`api/_template.js` → baked into `render.js`) AND `DynamicPageSEO.tsx` (also index.html/SEOMeta). A user-uploaded `public/opengraph.jpg` of a different size (e.g. 1280x720) creates a declared-vs-actual mismatch — social-share-only (crop), NOT an indexing issue. To truly fix: edit all declared dims to match AND rebuild the prebuilt `render.js`, or resize the asset to 1200x630. Safe to defer past launch.
