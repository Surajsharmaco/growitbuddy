# GrowitBuddy - Migration Guide (v3, updated May 2026)

> Aapko sirf 20-30 min lagenge. Vercel / Render / Neon / Resend / Cloudinary - kuch bhi change nahi hoga. Sirf naye Replit account mein workspace import karna hai, 3 secrets daalne hain, aur ek prompt naye Agent ko bhejna hai. Bas.

---

## ⚡ TL;DR - AAPKO ABHI YE 5 KAAM KARNE HAIN

```
1. Naye Replit account mein "Import from GitHub" →
   https://github.com/Surajsharmaco/growitbuddy

2. Open hote hi Tools → Secrets mein 3 cheezein daalein:
   - DATABASE_URL     (Neon → Connection Details → Pooled string)
   - ADMIN_PASSWORD   (jo /admin login mein use karte hain)
   - RESEND_API_KEY   (resend.com → API Keys)
   (Optional: GITHUB_TOKEN agar Agent ko direct push karwana ho)

3. Terminal mein: pnpm install
   Phir Run button dabaiye - 3 workflows auto-start ho jayenge.

4. Health check (1 min):
   https://growitbuddy-growitbuddy.vercel.app  → site khulti hai?
   https://growitbuddy-api.onrender.com/api/healthz  → {"status":"ok"} aata hai? (pehli baar 30s)
   /contact form se ek test submit → 2 min mein cs.growitbuddy@gmail.com par email aati hai?

5. Naye Replit Agent ko PART B ka pura prompt copy-paste kar dena.
   Wo apne aap PART C padh lega.
```

**Bas. Itna hi.** Niche detail mein har step diya hai agar koi confusion ho.

---

## PART A - OWNER STEPS (Detail Mein)

### Step 1 - Project Import

1. [replit.com](https://replit.com) par naye account se login karein
2. **Create Repl → Import from GitHub** select karein
3. URL: `https://github.com/Surajsharmaco/growitbuddy`
4. **Import** dabayein (1-2 min)

> ❌ **Zip download / upload mat karein** - git history toot jayegi aur Vercel/Render ka auto-deploy bhi.

### Step 2 - Koi Naya Service Signup NAHI Chahiye

Ye sab pehle se chal rahe hain, sirf login kar lijiye:

| Service | URL | Kya Pehle Se Setup Hai |
|---|---|---|
| **GitHub** | github.com (`Surajsharmaco/growitbuddy`) | Source code + branch `main` |
| **Vercel** | vercel.com | Frontend - `main` se auto-deploy |
| **Render** | dashboard.render.com | API - `main` se auto-deploy |
| **Neon** | console.neon.tech | Postgres DB - sara data already hai |
| **Resend** | resend.com | Email sender - API key already Render par |
| **Cloudinary** | cloudinary.com | Image hosting - credentials Render par |

> **Important:** In services mein kuch bhi change mat karein. Purani Replit account band hone par bhi sab chalta rahega, kyunki Vercel/Render direct GitHub se deploy karte hain, Replit se nahi.

### Step 3 - Sirf 3 Secrets Naye Replit Mein

**Tools → Secrets** kholiye, ye add karein (sirf local dev ke liye, production ki copies Render par alag hain):

| Secret | Source | Required |
|---|---|---|
| `DATABASE_URL` | Neon → Connection Details → **Pooled connection** (`?sslmode=require` zaroori) | ✅ Must |
| `ADMIN_PASSWORD` | Jo aap `/admin` mein use karte hain | ✅ Must |
| `RESEND_API_KEY` | resend.com → API Keys | ✅ Must |
| `GITHUB_TOKEN` | github.com → Settings → Developer settings → Fine-grained PAT, repo `growitbuddy`, `Contents: Read & Write` | Optional |

> **Shortcut:** Purani Replit account ke Secrets panel se values copy karke yahan paste kar dijiye.

### Step 4 - Install + Run

Terminal mein:
```bash
pnpm install
```
(1-2 min lega). Phir **Run** button dabaiye. Teen workflows start honge:
- `artifacts/api-server: API Server`
- `artifacts/growitbuddy: web`
- `artifacts/mockup-sandbox: Component Preview Server`

Preview pane mein site khul jayegi.

### Step 5 - Verify (1 min)

1. `https://growitbuddy-growitbuddy.vercel.app` → load ho rahi hai? ✅
2. `https://growitbuddy-api.onrender.com/api/healthz` → `{"status":"ok"}` ✅ (pehli baar 30s cold start)
3. `/admin` par login ✅
4. `/contact` se test form → 2 min mein `cs.growitbuddy@gmail.com` par email ✅

Agar email na aaye: Render → `growitbuddy-api` → Environment → `RESEND_API_KEY` check karein. 95% cases mein wahi missing hota hai.

### Step 6 - Naye Agent Ko Prompt Dein

**PART B** ka pura block copy karke naye Replit Agent ke chat mein paste kar dijiye. Bas.

---

## PART B - PROMPT FOR NEW AGENT (copy-paste)

```
>>> ONBOARDING PROMPT - START >>>

Hi! This is an existing production project being migrated to a new Replit account. Please do NOT start writing code or making any changes yet. First, ground yourself by doing exactly these 4 steps in order:

STEP 1 - READ THE PROJECT KNOWLEDGE BASE
Read these two files end-to-end, in this order:
  1. /MIGRATION_GUIDE.md  (this file - focus on PART C "Full Technical Handoff")
  2. /replit.md            (project overview + user preferences)

STEP 2 - UNDERSTAND THE TOPOLOGY (do not change any of this)
  - Source of truth: GitHub repo `Surajsharmaco/growitbuddy`, branch `main`.
  - Frontend: React + Vite SPA -> auto-deployed to Vercel (`growitbuddy-growitbuddy.vercel.app`) on every push to `main`.
  - API: Express server -> auto-deployed to Render (`growitbuddy-api.onrender.com`) on every push to `main`.
  - Database: Neon Postgres (already populated with live data - do NOT reset or re-seed).
  - Email: Resend. Images: Cloudinary. Both wired into Render env vars.
  - Vercel ALSO runs 2 small serverless functions for SSR meta injection:
      * `artifacts/growitbuddy/api/blog.js` - for /blog/:slug
      * `artifacts/growitbuddy/api/page.js` - for all other public pages
    Both fetch admin SEO from the Render API on each request.
  - The Replit workspace is for DEVELOPMENT ONLY. Pushing to `main` is what deploys.

STEP 3 - VERIFY LOCAL DEV
Confirm that:
  - Replit Secrets contain: DATABASE_URL, ADMIN_PASSWORD, RESEND_API_KEY (optional GITHUB_TOKEN).
  - `pnpm install` has completed.
  - All 3 workflows are running: api-server, growitbuddy: web, mockup-sandbox.
  - The preview pane shows the live website.
If any of those are missing, ask me - don't try to fix the topology yourself.

STEP 4 - CONFIRM AND WAIT
Once you've done STEPS 1-3, reply with a short summary and wait for the first real task.

USER PREFERENCES (very important):
  - I speak Hindi (Devanagari + Roman mix). Reply in the same style - clear but warm.
  - NO em-dashes (— U+2014) ANYWHERE. Use plain hyphen (-). A startup DB migration cleans existing em-dashes; do not re-introduce them in new code, comments, or content.
  - NO emojis in any communication or in code/files I'll see.
  - Push commits DIRECTLY to `main`. No PRs, no feature branches.
  - Push method: if GITHUB_TOKEN is in Secrets, use the GitHub REST API from `/tmp/push.mjs` (blobs -> tree -> commit -> PATCH ref). Otherwise `git push origin main` from shell.
  - Never run destructive DB commands (DROP, TRUNCATE, DELETE without WHERE). Neon has LIVE production data.
  - Never bump dependencies without my asking. `pnpm-workspace.yaml` has `minimumReleaseAge: 1440` - keep it.
  - Skip `mark_task_complete` validation runs - they don't apply here (real deploy is on Vercel/Render).
  - After push, tell me the commit SHA and the 2-5 min Vercel/Render rebuild wait.

That's it. Read the two files now, do the 4 steps, and wait for my first real task.

<<< ONBOARDING PROMPT - END <<<
```

---

## PART C - TECHNICAL HANDOFF (for the new Agent)

> Read this entire section before making any changes.

### 1. Project Overview

**GrowitBuddy** - premium content authority + marketing agency site with:
- Full admin CMS (`/admin`)
- Blog (Yoast-style SEO suite, score ring, readability, internal-link suggestions)
- Influencer directory + 9 talent-pool landing pages
- Portfolio shares (trackable shareable links)
- Page-variant A/B system
- Per-page SEO control (title / description / canonical / OG / Twitter / JSON-LD)
- Lead capture across 8 form endpoints
- **Universal SSR meta injection** via Vercel serverless functions (NEW, May 2026)

**Live URLs:**
- Frontend: `https://growitbuddy-growitbuddy.vercel.app` (custom: `growitbuddy.com`)
- API: `https://growitbuddy-api.onrender.com`
- GitHub: `https://github.com/Surajsharmaco/growitbuddy` (branch `main`)
- Owner notify email: `cs.growitbuddy@gmail.com`
- Built-in team onboarding: `/guide` (SiteGuide.tsx) + `/seo-guide`

### 2. Architecture (pnpm monorepo)

```
workspace/
├── artifacts/
│   ├── api-server/             # Express 5 API -> Render
│   ├── growitbuddy/            # React 19 + Vite 7 SPA -> Vercel
│   │   ├── api/                # Vercel serverless functions (SSR meta injection)
│   │   │   ├── blog.js         # /blog/:slug - fetches WP post + admin SEO
│   │   │   └── page.js         # all other public routes - fetches admin SEO  (NEW)
│   │   └── vercel.json         # rewrites all routes through api/page.js (NEW)
│   ├── mockup-sandbox/         # Dev-only design sandbox
│   └── uploads/                # Legacy disk dir - do NOT commit large files
├── lib/
│   ├── db/                     # @workspace/db - Drizzle ORM + schema
│   ├── api-spec/               # @workspace/api-spec - OpenAPI source
│   ├── api-zod/                # @workspace/api-zod - generated Zod schemas
│   └── api-client-react/       # @workspace/api-client-react - generated React Query hooks
├── api/                        # Vercel serverless fallback for /api/* (handler.mjs, generated)
├── scripts/                    # Maintenance scripts
├── pnpm-workspace.yaml         # Workspace + dependency catalog
├── render.yaml                 # Render deploy config (API)
├── vercel.json                 # Repo-root Vercel config (frontend + /api fallback)
├── replit.md                   # Project overview + preferences
├── DEPLOY.md                   # Older notes (references Koyeb - ignore)
└── MIGRATION_GUIDE.md          # This file
```

### 3. Tech Stack

| Layer | Tech | Version |
|---|---|---|
| Runtime | Node.js | 24 (Replit), 22 (Render) |
| Package manager | pnpm | 10.26.1 |
| TypeScript | - | 5.9 |
| API framework | Express | 5 |
| ORM | Drizzle | 0.45 |
| Validation | Zod v4 + drizzle-zod | 3.25 |
| API codegen | Orval (from OpenAPI) | - |
| API bundler | esbuild | 0.27 (bundles to `dist/index.mjs`) |
| Frontend | React + Vite | 19 / 7 |
| Styling | Tailwind v4 + Radix UI | 4.1 |
| Animation | Framer Motion + R3F | 12 / 9 |
| Router | wouter | 3.3 |
| Email | Resend | 6.12 |
| Image upload | Cloudinary | 2.10 |
| Logging | pino + pino-http | 9 / 10 |

### 4. Workflows (Replit auto-config)

| Name | Command |
|---|---|
| `artifacts/api-server: API Server` | `pnpm --filter @workspace/api-server run dev` |
| `artifacts/growitbuddy: web` | `pnpm --filter @workspace/growitbuddy run dev` |
| `artifacts/mockup-sandbox: Component Preview Server` | `pnpm --filter @workspace/mockup-sandbox run dev` |

API server runs `pnpm build && pnpm start` on dev (bundled esbuild, not tsx watch). **After API changes, restart the workflow.**

### 5. Environment Variables - Complete Reference

**Development (Replit Secrets):**

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon pooled connection (`?sslmode=require`) |
| `ADMIN_PASSWORD` | ✅ | `/admin` super-admin password + HMAC signing secret |
| `RESEND_API_KEY` | ⚠️ Strongly | Without this, form emails fail silently |
| `GITHUB_TOKEN` | Optional | For REST API push pattern |
| `NOTIFY_EMAIL` | Optional | Default `cs.growitbuddy@gmail.com` |
| `CAREERS_EMAIL` | Optional | Default `cs.growitbuddy@gmail.com` |
| `EMAIL_FROM` | Optional | Default `GrowitBuddy <onboarding@resend.dev>` |
| `LOG_LEVEL` | Optional | pino level (default `info`) |
| `PORT` | Auto | Replit assigns |

**Production - Render (API)** (see `render.yaml`):

Same 4 secrets PLUS:
- `NODE_ENV=production`
- `PORT=10000`
- `ALLOWED_ORIGINS` = comma-separated list, e.g. `https://growitbuddy-growitbuddy.vercel.app,https://growitbuddy.com`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Production - Vercel (frontend):**
- `VITE_API_URL` = `https://growitbuddy-api.onrender.com/api`
- `GB_API_BASE` (Optional, NEW) = same value WITHOUT `/api` suffix is wrong - it expects the full `/api` base e.g. `https://growitbuddy-api.onrender.com/api`. Defaults to the production Render URL if unset. Read by `artifacts/growitbuddy/api/page.js` for SSR meta injection.

### 6. Database Schema (`lib/db/src/schema/`)

| Table | Purpose |
|---|---|
| `site_content` | CMS content keyed by `section` (e.g. `home`, `about`, `seo:contact`, `seo-global`); `data` is JSONB |
| `leads` | All form submissions |
| `certificates` | Issued certificates (`is_hidden` for soft-delete) |
| `team_members` | Admin team accounts (bcrypt) + per-section permissions JSONB |
| `client_logos` | Logos on Work page |
| `portfolio_items` | Case studies on Work page |
| `portfolio_shares` | Trackable share links |
| `page_variants` | Alternate published versions of any page |
| `media_files` | Image uploads as base64 (served via `/api/media/file/:id`) |
| `influencers` | Influencer directory |

**Schema push (dev only):** `pnpm --filter @workspace/db run push`
**Production:** API server runs idempotent `ADD COLUMN IF NOT EXISTS` startup migrations in `artifacts/api-server/src/index.ts`.

**Startup migrations the API runs every boot (idempotent, safe):**
1. Framework-steps update (sets default home content if missing)
2. **Em-dash sweep** (NEW, May 2026): replaces every `—` (U+2014) with `-` across 10 tables (`site_content`, `blog_posts`, `portfolio_items`, `certificates`, `navigation_items`, `footer_content`, `client_logos`, `testimonials`, `page_variants`, `portfolio_shares`). Runs on every boot - if no em-dashes exist, it's a no-op.

**Seed file:** `growitbuddy_import.sql` + `.sql.gz` at repo root. **Use only on a brand-new empty DB.** NEVER re-import on populated DB.

### 7. API Routes (mounted at `/api/*`)

- `GET /api/healthz` - Render health check
- `GET /api/sitemap.xml` - dynamic sitemap (respects SEO master switch + per-page toggles)
- `GET /api/seo/:slug` - public per-page SEO (no auth, `Cache-Control: no-store`)
- `GET /api/admin/public/content/:section` - public CMS content (no auth)
- Admin CRUD: `/api/admin/content/:section`, `/api/admin/influencers`, `/api/admin/leads`, `/api/admin/logos`, `/api/admin/team`, `/api/admin/certificates`, `/api/admin/media`, `/api/admin/page-variants`, `/api/admin/portfolio-shares`
- Auth: `POST /api/admin/login`, `POST /api/admin/team/login`, `GET /api/admin/verify`, `POST /api/admin/logout`
- Forms (all send email via `sendEmail()` in `forms.ts`): `/api/forms/{contact, creators, page-owner, freelancers, full-time, internship, talent-pool, newsletter}`
- `POST /api/admin/ai-seo` - OpenAI-powered SEO analysis (bring-your-own-key, gated by ADMIN_PASSWORD)
- `GET /api/video-thumb?id=...` - Gumlet thumbnail proxy
- `GET /api/media/file/:id` - serves base64-stored images

**Rate limits:** in-memory per-IP. `formLimit = 5/60s`, `newsletterLimit = 20/60s`. Resets on restart.

### 8. Frontend Routing (wouter)

SPA routes in `artifacts/growitbuddy/src/App.tsx`. `vercel.json` rewrites:
- `/blog/:slug` → `api/blog.js` (SSR meta + OG image for crawlers)
- All other paths → `api/page.js` (SSR meta from admin SEO)
- Static files (in `dist/public/assets`, `favicon.ico`, etc.) bypass rewrites automatically.

Notable public routes:
- `/`, `/about`, `/services`, `/work`, `/framework`, `/blog`, `/blog/:slug`, `/contact`, `/resources`, `/authority-audit`
- `/influencers`, `/influencers/:slug`, `/distribution`, `/join`, `/join/page-owner`, `/creators`, `/career`
- 9 talent-pool pages: `/editors-pool`, `/video-editors`, `/designers-pool`, `/thumbnail-designers`, `/writers-pool`, `/social-media-managers`, `/motion-designers`, `/ai-creators`, `/ugc-creators`, `/meme-designers`
- `/portfolio/:slug`, `/portfolio/shared/:slug`
- `/verify`, `/verify/:id`
- `/privacy`, `/terms`
- `/guide`, `/seo-guide` (team onboarding)
- `/admin/*` (password-protected admin panel)

### 9. The SSR Meta Injection System (NEW, May 2026)

**Problem solved:** Earlier, browser parsed `index.html` (with hardcoded title/description), showed those for ~500ms-2s, then React's `<DynamicPageSEO>` mounted and replaced them with admin-saved values - a visible "flash of old meta".

**Solution:**
- `artifacts/growitbuddy/api/page.js` - Vercel serverless function. For every public route, it fetches the admin SEO record (`/api/seo/<slug>` + `/admin/public/content/seo-global` for the index master-switch) from Render, builds a full meta block (title, description, OG, Twitter, canonical, robots, JSON-LD), and injects it into the `index.html` shell **before the byte goes to the browser**.
- `artifacts/growitbuddy/api/blog.js` - same idea, specialised for blog posts (also fetches WordPress for featured image + author).
- The path-to-slug map is mirrored at the top of `page.js` - **keep it in sync with `artifacts/growitbuddy/src/lib/pageRegistry.ts`** if you add a public page.
- Cache: `Cache-Control: max-age=0, s-maxage=30, stale-while-revalidate=86400`. Admin edits propagate to the CDN within 30s.

**If you add a new public page:**
1. Add it to `pageRegistry.ts` (React side, for `<DynamicPageSEO>`).
2. Add the same path + slug + default title/description to `REGISTRY` array at top of `artifacts/growitbuddy/api/page.js`.
3. Add it to the dynamic sitemap (api-server `sitemap.ts`) if SEO-relevant.

### 10. Design System

**Premium editorial / consulting** light theme.
- Cream `#F8F8F6`, dark `#0A0A0A`, gold accent `#C2A878`, Inter font.
- **NO purple, NO bright colors, NO gradients, NO emojis.**
- Design tokens: `artifacts/growitbuddy/src/index.css` CSS variables (`--gb-*`).
- Component classes: `gb-btn`, `gb-card`, `gb-eyebrow`, `gb-gold-underline`, etc.

### 11. Admin Panel Tour (full reference in `/guide` v1.4)

- `/admin` - Dashboard (stat cards, Leads-by-Type chart, Recent Saves, section status grid)
- Content editors: `/admin/{home, about, services, work, blog, resources, contact, distribution-pages}`
- `/admin/blog` - full Yoast-style SEO suite
- `/admin/page-variants` - A/B variant manager (each variant has own URL + SEO)
- `/admin/portfolio-shares` - trackable share URLs
- `/admin/leads`, `/admin/talent-pool-leads` - CRM
- `/admin/{influencers, logos, certificates}` - directory editors
- `/admin/media` - drag-drop uploader, search, lightbox
- `/admin/team` - role-based accounts (super vs member, per-section permissions)
- `/admin/seo` - global Site-Indexing master switch + per-page SEO with live preview
- `/admin/{navbar, footer, settings, page-visibility}` - branding + Maintenance/Coming Soon modes
- `/admin/optimize` - performance toggles, cache warm-up, VACUUM ANALYZE

### 12. Email System - Critical

Every form endpoint calls `sendEmail(to, subject, html, replyTo?)` in `artifacts/api-server/src/routes/forms.ts`:
1. Checks `RESEND_API_KEY` - if missing, **logs an error and returns silently** (form still returns success to user).
2. Dynamic-imports `resend`, calls `resend.emails.send(...)`.
3. On error, logs details.

**Common failure modes:**
- No `RESEND_API_KEY` on Render → all emails fail silently. Check Render logs for `"RESEND_API_KEY not set"`.
- `onboarding@resend.dev` only delivers to the email that owns the Resend account. Verify a custom domain in Resend + set `EMAIL_FROM=GrowitBuddy <notifications@growitbuddy.com>` for production-grade delivery.
- Gmail Promotions/Spam - first email often lands there. User must "Move to Inbox" once.

### 13. Deployment Flow

Push to `main` → Vercel rebuilds frontend (~2 min) + Render rebuilds API (~5 min). No manual deploy needed.

Render free plan cold-starts after 15 min idle (~30s wake-up).

**Push patterns:**
- **Preferred:** Atomic GitHub REST API via `GITHUB_TOKEN`. Write `/tmp/push.mjs` (blobs → tree → commit → PATCH ref). Re-create each turn since `/tmp` may not persist.
- **Fallback:** `git push origin main` from shell.

**NEVER** commit large binaries (uploaded media). Uploads go to Cloudinary or `media_files` table.

### 14. Commands Cheat Sheet

```bash
# Install
pnpm install

# Run individual apps (or use Run button)
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/growitbuddy run dev
pnpm --filter @workspace/mockup-sandbox run dev

# Typecheck
pnpm run typecheck
# Single app:
pnpm --filter @workspace/growitbuddy exec tsc --noEmit

# Build everything
pnpm run build

# DB schema push (dev only)
pnpm --filter @workspace/db run push

# Regenerate API client + Zod from OpenAPI
pnpm --filter @workspace/api-spec run codegen

# Restore DB from seed dump (ONLY a brand-new empty DB)
psql "$DATABASE_URL" < growitbuddy_import.sql
```

---

## 15. ⚠️ Common Pitfalls - Real Production Bugs (must-read)

> Every item below is a real issue that has hit this project before, with fix + prevention rule.

### A. Email

| # | Bug | Cause | Prevention |
|---|---|---|---|
| A1 | Form says "Thanks!" but no email arrives | `RESEND_API_KEY` not on Render. `sendEmail()` returns silently. | Verify Render env. Check logs for `"RESEND_API_KEY not set"`. |
| A2 | `onboarding@resend.dev` emails go to spam / non-account-owner emails fail | Resend's shared sender restrictions | Verify a domain in Resend, set `EMAIL_FROM=GrowitBuddy <notifications@growitbuddy.com>` |

### B. SEO & Indexing

| # | Bug | Cause | Prevention |
|---|---|---|---|
| B1 | Blog posts not appearing in Google after weeks | `robots.txt` had hardcoded sitemap URL pointing to old Render domain (404) | Run `rg -n "onrender\.com\|vercel\.app"` before pushing any URL change |
| B2 | Site disappears from Google | `/admin/seo` master indexing toggle was OFF (often pre-launch) | Verify GREEN on every deployment day |
| B3 | Duplicate pages competing | Page Variants created with identical SEO | When creating a variant, edit its SEO in `/admin/seo` independently or set `noindex` |
| B4 | Hidden page still showing in Google | Page hidden but Google takes weeks to drop 404 | Set `noindex` in `/admin/seo` BEFORE hiding |
| B5 | **Em-dashes (`—`) reappearing in meta titles** | Old admin-saved content had them | DB startup migration auto-cleans on every boot. Do NOT type `—` in new code/content. Use plain `-`. |
| B6 | **Flash of old meta on page load** | `index.html` shipped with hardcoded meta; React replaced them ~1s later | Fixed by `artifacts/growitbuddy/api/page.js` (SSR injection). If you change vercel.json rewrites, do NOT remove the `api/page` route. |

### C. CORS / Frontend ↔ API

| # | Bug | Cause | Prevention |
|---|---|---|---|
| C1 | Every API call returns CORS error | `ALLOWED_ORIGINS` on Render missing Vercel URL (or trailing slash mismatch) | Render env = exact `https://growitbuddy-growitbuddy.vercel.app` (no trailing slash). Comma-separate multiple. |
| C2 | API calls hit wrong server | `VITE_API_URL` missing on Vercel - falls back to relative `/api` | Vercel env = `https://growitbuddy-api.onrender.com/api`. **Redeploy after env change.** |
| C3 | Works in Replit, breaks on Vercel | Replit serves same-origin (no CORS); production is cross-origin | Always test live URL with DevTools after CORS/URL changes |
| C4 | **SSR meta function returns blank** | `api/page.js` couldn't reach Render API | Check Vercel function logs. If Render is cold-starting, function still serves the bare shell (graceful fallback). |

### D. Database

| # | Bug | Cause | Prevention |
|---|---|---|---|
| D1 | API crashes at boot: `ECONNREFUSED` / SSL error | `DATABASE_URL` missing `?sslmode=require` | Always copy Neon **Pooled** string verbatim |
| D2 | "Relation does not exist" after deploy | Schema drift - `db push` ran in dev but not prod | Extend the idempotent `ADD COLUMN IF NOT EXISTS` block in `artifacts/api-server/src/index.ts` for every new column |
| D3 | Lost ALL admin content overnight | Someone ran `psql $DATABASE_URL < growitbuddy_import.sql` against live DB | NEVER re-import. Add `-- DO NOT RUN ON POPULATED DB` banner. |
| D4 | "too many connections" | Using direct (non-pooled) Neon string | Always use Pooled (port 6543 / `-pooler` host) |

### E. Deployment & Build

| # | Bug | Cause | Prevention |
|---|---|---|---|
| E1 | "Edited API code, nothing changed" | API is esbuild-bundled, not tsx-watched | Restart `artifacts/api-server: API Server` workflow after API changes |
| E2 | `pnpm install` fails: `ERR_PNPM_PACKAGE_TOO_NEW` | `minimumReleaseAge: 1440` (24h supply-chain defence) | Wait 24h OR add specific package to `minimumReleaseAgeExclude`. **Do NOT disable.** |
| E3 | Wrong dep version installed | Version lives in `pnpm-workspace.yaml` `catalog:`, not individual `package.json` | Edit catalog, then `pnpm install`. Never edit catalog refs directly in package.json. |
| E4 | `Cannot find module '@workspace/db'` | New Agent assumed `packages/db` - it's `lib/db` | `pnpm-workspace.yaml` maps `lib/*`. Check before guessing paths. |
| E5 | Render builds OK but API throws on first request | esbuild excluded a runtime dep | Check `artifacts/api-server/scripts/build.mjs` `external:` array |
| E6 | Vercel deploys but frontend is blank | Stale cache or new route without rebuild | Hard refresh. Check `vercel.json` rewrites intact. |
| E7 | "Push succeeded but Vercel didn't deploy" | Vercel branch mismatch or GitHub App uninstalled | Vercel → Settings → Git → Production Branch = `main`. Check GitHub Vercel App permissions. |

### F. Push / Source Control

| # | Bug | Cause | Prevention |
|---|---|---|---|
| F1 | `git push` from Replit: 403 Permission denied | Stale credentials | Use REST API push (`/tmp/push.mjs`) with `GITHUB_TOKEN` (Contents: R/W) |
| F2 | "Replit says local is ahead by 50 commits" | Agent pushed via REST API; Replit local clone wasn't updated | Normal. `git fetch && git reset --hard origin/main` to re-sync. |
| F3 | Accidentally pushed huge binary | Image saved to `artifacts/uploads/` and committed | All uploads → Cloudinary or `media_files` base64. Never commit `artifacts/uploads/`. |
| F4 | Secret accidentally committed | Pasted Neon URL / Resend key in markdown or comment | NEVER paste real secrets. If it happens: rotate IMMEDIATELY, don't bother scrubbing git history. |

### G. Admin UX

| # | Bug | Cause | Prevention |
|---|---|---|---|
| G1 | Flash of default content in admin | React mounts with empty state, then fetches | Use `loaded` flag pattern: `if (!loaded) return <Loading/>`. Already applied to many admin pages. |
| G2 | Save shows "Saved!" but reload reverts | Field not in save payload because state didn't update | Log payload in dev. Re-test save → reload after adding any new field. |
| G3 | Admin logged out randomly | In-memory sessions reset on Render cold start | Accepted for now. Move to DB-backed sessions if painful. |
| G4 | Team member sees pages they shouldn't | Permission check missing on new admin route | Every new admin route must check team member's `permissions` JSONB. |

### H. Render Free Plan

| # | Bug | Cause | Prevention |
|---|---|---|---|
| H1 | First request 30s+ then everything works | Cold start after 15 min idle | Expected. Upgrade plan OR set external pinger (cron-job.org → `/api/healthz` every 10 min) |
| H2 | Rate-limit counters reset randomly | In-memory limits reset on restart | Accepted. Move to Redis/DB if abuse appears. |

### J. Code-level footguns

| # | File | What could go wrong | Prevention |
|---|---|---|---|
| J1 | `forms.ts` - dynamic `import("resend")` | If esbuild bundles dynamic import wrong, every email fails silently while form returns success | After any esbuild config change, submit a real form on deployed Render URL + check inbox |
| J2 | `forms.ts` - in-memory rate limit | Resets on cold start; attacker can burst-spam | Acceptable. Move to DB-backed if abuse appears. |
| J3 | `index.ts` - `GUMLET_THUMB_CACHE` (bounded to 2000 entries, but no TTL eviction) | Long-uptime instance accumulates expired entries | Periodic Render restarts mask the issue. Don't disable restarts. |
| J4 | `admin.ts` - `loadOptimizeSettingsFromDb().then(...)` unawaited at startup | If DB unreachable at boot, settings stay default; user edits in `/admin/optimize` appear lost | Await it inside listen-start path, fail-fast with clear log |
| J5 | `admin.ts` - `ADMIN_PASSWORD ?? randomBytes(16)` | If missing, HMAC secret becomes fresh random each boot → all admin sessions invalidated | Hard-require: `if (!process.env.ADMIN_PASSWORD) process.exit(1);` |
| J6 | `app.ts` - `express.json({ limit: "10mb" })` | Base64 image >10MB → silent 413 | Frontend compresses via `ImagePickerField`/`CropModal`. Check Network tab payload size when debugging upload. |
| J7 | `gcsMedia.ts` - `REPLIT_SIDECAR = "http://127.0.0.1:1106"` | Hardcoded Replit-only URL | Intentional Replit-only fallback. Don't "fix" by calling sidecar from Render. |
| J8 | `app.ts` - `ALLOWED_ORIGINS ?? true` | If unset, CORS becomes `*` (allow all) | Render env MUST always have `ALLOWED_ORIGINS` set |
| J9 | `forms.ts` - email send blocks response | UX delay when Resend slow (1-3s) | Acceptable. If decoupled, write lead to DB first, return 200, fire-and-forget email in `setImmediate()`. |
| J10 | `gcsMedia.ts` - `REPLIT_DOMAINS.split(",")[0]` | On Render empty → URL becomes `https:///path` | Code path guarded by Cloudinary-creds check. Dormant on Render. Don't enable GCS branch without setting `PUBLIC_BASE_URL`. |

### K. Admin pages still missing `loaded` guard (low priority)

These still render defaults before fetch resolves. Add the guard only if you're already touching the file:
```
AdminResources, AdminCertificates, AdminLeads, AdminTalentPoolLeads, AdminFooter,
AdminNavbar, AdminPortfolioShares, AdminPageVariants, AdminPageVisibility,
AdminTeam, AdminSEO, AdminLogos, AdminCreatorSchool, AdminTalentPool
```
Pattern:
```tsx
const [loaded, setLoaded] = useState(false);
useEffect(() => {
  api.get("/admin/content/<section>").then(r => { setData(r.data); setLoaded(true); });
}, []);
if (!loaded) return <div className="p-8 text-sm opacity-60">Loading content...</div>;
```

### L. Slug-collision risk

| # | Where | Risk | Prevention |
|---|---|---|---|
| L1 | App.tsx `<Route path="/:slug" component={VariantResolver}/>` | Variant slug = core route name → hijacks real page | Validate variant slug against `pageRegistry.ts` keys + wouter route list. Reject reserved slugs in admin UI. |

### M. DB hygiene

| # | Issue | Risk | Prevention |
|---|---|---|---|
| M1 | `leads` table - no index on `type`, `email`, `created_at` | Slow filtering at 10K+ leads | Add Drizzle indexes + roll out via startup `CREATE INDEX IF NOT EXISTS` |
| M2 | `media_files.data` is base64 text | DB bloat, slow backups | Prefer Cloudinary for new uploads. Migrate old rows to Cloudinary long-term. |
| M3 | `growitbuddy_import.sql` has no `IF NOT EXISTS` guards | Re-run on populated DB throws + may overwrite | Add banner + `\set ON_ERROR_STOP on`. Use `CREATE TABLE IF NOT EXISTS` + `ON CONFLICT DO NOTHING`. |

### N. Pre-existing TODOs (clean up only if already touching)

- `Verify.tsx` - 1 TODO
- `AdminCertificates.tsx` - 1 TODO
- `Contact.tsx` - leftover `console.log`
- `AdminPortfolioShares.tsx` - 3 leftover `console.log`s

### O. Day-1 Verification Checklist

```
☐ Replit Secrets: DATABASE_URL, ADMIN_PASSWORD, RESEND_API_KEY (+ optional GITHUB_TOKEN)
☐ Render env: same 4 + ALLOWED_ORIGINS + CLOUDINARY_* + NODE_ENV + PORT=10000
☐ Vercel env: VITE_API_URL = https://growitbuddy-api.onrender.com/api
☐ public/robots.txt sitemap URL matches Render URL
☐ /admin/seo global Site-Indexing toggle is ON (green)
☐ /api/healthz returns {"status":"ok"} (allow 30s cold start)
☐ /contact form delivers email within 2 min
☐ pnpm-workspace.yaml minimumReleaseAge is still 1440
☐ artifacts/uploads/ is empty (or git-ignored)
☐ No real secrets in committed files:
  rg -n "re_[a-zA-Z0-9]{20,}|postgresql://[^@]+@" .
```

---

## 16. 🚨 Architecture Footguns - DO NOT TOUCH without owner approval

1. **API is esbuild-bundled, not tsx-watched.** Dev cycle: edit → restart workflow. Render's build depends on bundle output. Don't switch to `tsx watch` / `nodemon`.
2. **`pnpm-workspace.yaml` `minimumReleaseAge: 1440`** is supply-chain defence. Never lower. Use `minimumReleaseAgeExclude: [pkg]` instead.
3. **Catalog dependencies (`"react": "catalog:"`)** - version lives in `pnpm-workspace.yaml` `catalog:` block. Editing `package.json` value to a real version is silently ignored.
4. **`@workspace/db` is at `lib/db`, not `packages/db`.** `pnpm-workspace.yaml` maps `lib/*`. Don't create `packages/db`.
5. **Vercel `api/handler.mjs` is fallback only.** Primary API → Render (real long-running Node, native module support). Don't "consolidate" to Vercel functions.
6. **`growitbuddy_import.sql`** is one-shot bootstrap. NEVER auto-run. NEVER re-import on populated DB.
7. **Replit local git diverges from `origin/main`** because pushes use GitHub REST API. `git status` "ahead by N" is normal. Don't force-push. Re-sync: `git fetch && git reset --hard origin/main`.
8. **Admin auth is hybrid.** `/api/admin/login` = env `ADMIN_PASSWORD` (super). `/api/admin/team/login` = DB bcrypt + per-section permissions. Don't merge.
9. **Hardcoded service URLs in static files** (`public/robots.txt`, `AdminSEO.tsx`, `SEOGuide.tsx`, `lib/api.ts` comment, `artifacts/growitbuddy/api/page.js` fallback). When Render/Vercel URL changes, update ALL together. Run `rg -n "onrender\.com|vercel\.app"` before pushing.
10. **Cloudinary is the canonical image store.** `media_files` base64 exists for legacy. Don't default to it for new features.
11. **`growitbuddy_import.sql.gz`** is a backup snapshot. Don't bloat repo with more. Use Neon's branching/snapshots.
12. **`vercel.json` rewrites** route everything through `api/page.js` (NEW). Don't remove or reorder without understanding. Static assets bypass rewrites automatically; new `/.well-known/` style paths must be added BEFORE the catch-all.
13. **`artifacts/growitbuddy/api/page.js` REGISTRY** must mirror `pageRegistry.ts`. If you add a public route to one, add it to the other too, or SSR meta will fall back to the bare shell for that page.
14. **Em-dash sweep** runs at API server boot. Don't remove the migration block - it's idempotent and protects against admin re-introducing em-dashes via paste.

---

## 17. User Preferences

- **Language:** Hindi (Devanagari + Roman). Reply in the same style - warm but clear.
- **NO em-dashes (—) anywhere.** Use `-`. DB migration cleans existing; don't add new ones.
- **NO emojis** in chat OR code/files the user sees.
- **Push:** Direct to `main`. No PRs, no feature branches.
- **Deploy:** Auto via GitHub → Vercel + Render. After every push, share commit SHA + 2-5 min wait.
- **Validation:** Skip `mark_task_complete` validation runs (real deploy is external).
- **Email recipient:** All forms → `cs.growitbuddy@gmail.com`.
- **Never touch:** Production Neon DB (no DROP/TRUNCATE), `minimumReleaseAge`, random dependency bumps.
- **Before every push:** `rg -n "re_[a-zA-Z0-9]{20,}|postgresql://[^@]+@" .` to scan for leaked secrets.
- **Re-read Sections 15 + 16** before any task touching: forms, auth, SEO, sitemap, CORS, env vars, DB schema, bundle config, vercel.json rewrites, admin pages.

---

## Quick "Did I Set Everything Up?" Checklist

For the owner, after migration:

- [ ] New Replit workspace created via GitHub Import from `Surajsharmaco/growitbuddy`
- [ ] `pnpm install` completed
- [ ] Replit Secrets set: `DATABASE_URL`, `ADMIN_PASSWORD`, `RESEND_API_KEY` (+ optional `GITHUB_TOKEN`)
- [ ] Run button works - all 3 workflows running
- [ ] `growitbuddy-growitbuddy.vercel.app` loads
- [ ] `growitbuddy-api.onrender.com/api/healthz` returns `{"status":"ok"}`
- [ ] Admin login works at `/admin`
- [ ] Test form on `/contact` → email arrives at `cs.growitbuddy@gmail.com` within 2 min
- [ ] Render env vars verified (especially `RESEND_API_KEY` and `ALLOWED_ORIGINS`)
- [ ] Vercel env var verified: `VITE_API_URL`
- [ ] PART B onboarding prompt sent to the new Replit Agent

If all 11 boxes ticked, migration complete. ✅
