# GrowitBuddy — Complete Migration & Handoff Guide (v2)

> **Purpose:** Move the entire GrowitBuddy project to a brand-new Replit account in under 30 minutes, without re-doing any setup. Vercel, Render, Neon, Resend, Cloudinary all keep working — only the Replit workspace changes.

This document has **3 parts**:

- **PART A** — Owner's 6-step quick checklist (Hindi/English) — what *you* do in the new Replit account.
- **PART B** — The exact **copy-paste prompt** to send to the new Replit AI Agent on first message.
- **PART C** — Full technical handoff (architecture, every env var, every service, every recent feature) — the new Agent reads this from the repo itself.

---

## PART A — OWNER'S 6-STEP QUICK GUIDE (आपके लिए)

> कुल मिलाकर ~20-30 minute। कुछ भी redeploy नहीं करना, कोई domain reconnect नहीं करना। बस access transfer।

### Step 1 — नया Replit account पर project import करें

1. नए Replit account में login कीजिए।
2. **"Create Repl"** → top-right में **"Import from GitHub"** select कीजिए।
3. URL paste कीजिए: `https://github.com/Surajsharmaco/growitbuddy`
4. **Import** दबाइए — Replit पूरा monorepo automatically clone कर लेगा (1-2 min)।

> ❌ **Zip download/upload method use मत कीजिए** — git history टूट जाएगी और Vercel/Render का auto-deploy connection भी।

### Step 2 — कोई नया service signup नहीं — सब पहले से चालू है

ये सब accounts पहले से बने और live हैं। **कुछ भी नया नहीं बनाना, बस login कर लेना:**

| Service | Login URL | क्या-क्या already setup है |
|---|---|---|
| **GitHub** | github.com — `Surajsharmaco/growitbuddy` | पूरा source code, branch `main` |
| **Vercel** | vercel.com | Frontend `growitbuddy-growitbuddy.vercel.app` — `main` से auto-deploy |
| **Render** | dashboard.render.com | API `garden-planner-newzip.onrender.com` — `main` से auto-deploy |
| **Neon** | console.neon.tech | Postgres database — already populated |
| **Resend** | resend.com | Email sender — API key already on Render |
| **Cloudinary** | cloudinary.com | Image hosting — credentials already on Render |

> **Important:** ऊपर वाले किसी भी service में कुछ change मत कीजिए। पुरानी Replit account बंद होने पर भी ये सब चलते रहेंगे — क्योंकि Vercel/Render सीधे GitHub से deploy होते हैं, Replit से नहीं।

### Step 3 — सिर्फ 3 (या 4) Secrets नए Replit में add करें

नए Repl में: **Tools → Secrets** खोलिए, ये add कीजिए। ये केवल **local dev** के लिए हैं — production में Render/Vercel की अपनी copies हैं।

| Secret Name | कहाँ से उठाएँ | ज़रूरी? |
|---|---|---|
| `DATABASE_URL` | Neon → Project → Connection Details → **Pooled connection** string (`?sslmode=require` ज़रूर हो) | ✅ Must |
| `ADMIN_PASSWORD` | जो आप `/admin` login में use करते थे | ✅ Must |
| `RESEND_API_KEY` | resend.com → API Keys → existing key copy या **Create New** | ✅ Must |
| `GITHUB_TOKEN` | github.com → Settings → Developer settings → Personal access tokens → **Fine-grained** → repo `growitbuddy` को `Contents: Read & Write` दे दें | Optional (केवल तभी जब Agent direct GitHub push करे, ज़्यादातर ज़रूरी होता है) |

> **Quick way to get all these:** पुरानी Replit account में जाकर Secrets panel से values देख लें (या ☰ → Account → Show Secret), और एक-एक करके नई account में paste कर दें।

### Step 4 — एक बार install करें

नए Repl के terminal में:

```bash
pnpm install
```

(1-2 min लेगा।) फिर **Run** button दबाइए — तीनों workflows (API server, web, mockup sandbox) auto-start हो जाएँगे। Preview pane में website खुल जाएगी।

### Step 5 — Production का status verify करें (1 min)

ये केवल health-check है — कुछ change नहीं करना:

1. `https://growitbuddy-growitbuddy.vercel.app` खोलिए → site load हो रही है? ✅
2. `https://garden-planner-newzip.onrender.com/api/healthz` खोलिए → `{"status":"ok"}` मिलना चाहिए ✅ (पहली बार 30 sec लग सकते हैं cold-start की वजह से)
3. `growitbuddy-growitbuddy.vercel.app/admin` पर login कीजिए ✅
4. `growitbuddy-growitbuddy.vercel.app/contact` से एक test form submit कीजिए → 1-2 min में `cs.growitbuddy@gmail.com` पर email आना चाहिए ✅

अगर email नहीं आया: Render → `growitbuddy-api` → Environment → check कीजिए कि `RESEND_API_KEY` set है। यही 95% cases में missing piece होता है।

### Step 6 — नए Replit Agent को पहला message भेजें

बस **PART B** का पूरा prompt copy करके paste कर दीजिए। Agent बाकी सब खुद से समझ लेगा (पूरा technical handoff PART C में repo के अंदर already है)।

---

## PART B — पहला message जो आप नए Replit Agent को भेजेंगे (copy-paste)

> नीचे की पूरी block — `>>>` से `<<<` तक — copy करके नए Replit Agent के chat में paste कर दीजिए। बस इतना ही, कुछ और type नहीं करना है।

```
>>> ONBOARDING PROMPT — START >>>

Hi! This is an existing production project being migrated to a new Replit account. Please do NOT start writing code or making any changes yet. First, ground yourself by doing exactly these 4 steps in order:

STEP 1 — READ THE PROJECT KNOWLEDGE BASE
Read these two files end-to-end, in this order:
  1. /MIGRATION_GUIDE.md  (this file — focus on PART C "Full Technical Handoff")
  2. /replit.md            (project overview + user preferences)

STEP 2 — UNDERSTAND THE TOPOLOGY (do not change any of this)
  - Source of truth: GitHub repo `Surajsharmaco/growitbuddy`, branch `main`.
  - Frontend: React + Vite SPA → auto-deployed to Vercel (`growitbuddy-growitbuddy.vercel.app`) on every push to `main`.
  - API: Express server → auto-deployed to Render (`garden-planner-newzip.onrender.com`) on every push to `main`.
  - Database: Neon Postgres (already populated with live data — do NOT reset or re-seed).
  - Email: Resend. Images: Cloudinary. Both are already wired into Render's env vars.
  - The Replit workspace is for DEVELOPMENT ONLY. It does NOT host anything. Pushing to `main` is what deploys.

STEP 3 — VERIFY LOCAL DEV
Confirm that:
  - Replit Secrets contain: DATABASE_URL, ADMIN_PASSWORD, RESEND_API_KEY (and optionally GITHUB_TOKEN).
  - `pnpm install` has completed.
  - All 3 workflows are running: `artifacts/api-server: API Server`, `artifacts/growitbuddy: web`, `artifacts/mockup-sandbox: Component Preview Server`.
  - The preview pane shows the live website.
If any of those are missing, ask me — don't try to fix the topology yourself.

STEP 4 — CONFIRM AND WAIT
Once you've done STEPS 1-3, reply with a short summary:
  - "I've read MIGRATION_GUIDE.md and replit.md."
  - "I understand: Vercel = frontend, Render = API, Neon = DB, Resend = email, Cloudinary = images. Auto-deploy from GitHub main."
  - "Local dev workflows are running: [list]."
  - "Ready for your first task."

USER PREFERENCES (very important):
  - I speak Hindi (Devanagari + Roman mix). Reply in the same style — keep technical explanations clear but warm.
  - Push commits DIRECTLY to `main`. No PRs, no feature branches.
  - Push method: if GITHUB_TOKEN is in Replit Secrets, use the GitHub Contents/Git Data REST API from a small Node script in /tmp/push.mjs (blobs → tree → commit → PATCH ref). Otherwise use a direct `git push origin main` from the Replit shell.
  - Never run destructive DB commands (DROP, TRUNCATE, DELETE without WHERE). The Neon database is LIVE production data.
  - Never bump dependencies without my asking. The pnpm catalog in `pnpm-workspace.yaml` has `minimumReleaseAge: 1440` (24h) — keep it that way.
  - Skip Replit's `mark_task_complete` validation runs — they don't apply here (real deployment happens on Vercel/Render after a git push).
  - When you finish work, push to GitHub and wait ~2-5 min for Vercel/Render to redeploy; tell me which commit SHA went out.

That's it. Read the two files now, do the 4 steps, and wait for my first real task.

<<< ONBOARDING PROMPT — END <<<
```

> इतना ही। Agent खुद से PART C पढ़ लेगा, project समझ लेगा, और आपके task का wait करेगा।

---

## PART C — FULL TECHNICAL HANDOFF (FOR THE NEW REPLIT AI AGENT)

> **Read this entire section before making any changes.** This is the operational truth for the project.

### 1. Project Overview

**GrowitBuddy** is a premium content authority & marketing agency website with a full admin CMS, blog (with Yoast-style SEO suite), influencer directory, 9-pool talent network, portfolio shares (trackable shareable links), page-variant A/B system, full per-page SEO control with JSON-LD, and lead capture system.

- **Live frontend:** `https://growitbuddy-growitbuddy.vercel.app` (or custom domain)
- **Live API:** `https://garden-planner-newzip.onrender.com`
- **GitHub:** `https://github.com/Surajsharmaco/growitbuddy` (branch: `main`)
- **Owner notification email:** `cs.growitbuddy@gmail.com`
- **Built-in onboarding page for new team members:** `/guide` (SiteGuide.tsx, currently v1.4) — covers every feature top-to-bottom with a beginner-friendly SEO chapter. Also `/seo-guide`.

### 2. Architecture (pnpm Monorepo)

This is a **pnpm workspace monorepo**. Do not use `npm` or `yarn` — the preinstall hook will block it.

```
workspace/
├── artifacts/                       # Deployable apps
│   ├── api-server/                  # Express 5 API → deployed to Render
│   ├── growitbuddy/                 # React 19 + Vite 7 SPA → deployed to Vercel
│   ├── mockup-sandbox/              # Internal design sandbox (dev only, not deployed)
│   └── uploads/                     # Legacy disk-uploads dir (do not commit large files)
├── lib/                             # Internal shared packages
│   ├── db/                          # @workspace/db — Drizzle ORM + schema
│   ├── api-spec/                    # @workspace/api-spec — OpenAPI source of truth
│   ├── api-zod/                     # @workspace/api-zod — Zod schemas (generated)
│   └── api-client-react/            # @workspace/api-client-react — React Query hooks (generated)
├── api/                             # Vercel serverless entrypoint (handler.mjs for /api/*)
├── scripts/                         # Maintenance & migration scripts
├── pnpm-workspace.yaml              # Workspace config + dependency catalog
├── render.yaml                      # Render deployment config (API)
├── vercel.json                      # Vercel deployment config (frontend + serverless API fallback)
├── DEPLOY.md                        # Older deployment notes (references Koyeb — ignore)
├── MIGRATION_GUIDE.md               # This file
└── replit.md                        # Replit-facing project overview
```

**Deployment topology:**
- **Vercel** serves the React SPA. It also has a serverless `/api/handler.mjs` fallback (used only if Render is down — primary API traffic goes to Render via the frontend's `VITE_API_URL`).
- **Render** runs the Express API as a long-running Node process on port 10000 (free plan, may cold-start after 15 min idle).
- **Neon** provides Postgres — accessed by both Render and (rarely) the Vercel serverless handler.

### 3. Tech Stack

| Layer | Tech | Version |
|---|---|---|
| Runtime | Node.js | 24 (Replit), 22 (Render) |
| Package manager | pnpm | 10.26.1 |
| Language | TypeScript | 5.9 |
| API framework | Express | 5 |
| ORM | Drizzle ORM | 0.45 |
| Validation | Zod (`zod/v4`) + drizzle-zod | 3.25 |
| API codegen | Orval (from OpenAPI) | — |
| Bundler (API) | esbuild | 0.27 (bundle to `dist/index.mjs`) |
| Frontend | React + Vite | 19 / 7 |
| Styling | Tailwind CSS v4 + Radix UI | 4.1 |
| Animation | Framer Motion + R3F (Three.js) | 12 / 9 |
| Router | wouter | 3.3 |
| Email | Resend | 6.12 |
| Image upload | Cloudinary | 2.10 |
| Logging | pino + pino-http | 9 / 10 |

### 4. Workflows (auto-configured)

Three workflows run in parallel on Replit Run:

| Name | Command |
|---|---|
| `artifacts/api-server: API Server` | `pnpm --filter @workspace/api-server run dev` |
| `artifacts/growitbuddy: web` | `pnpm --filter @workspace/growitbuddy run dev` |
| `artifacts/mockup-sandbox: Component Preview Server` | `pnpm --filter @workspace/mockup-sandbox run dev` |

The API server runs `pnpm build && pnpm start` on dev — it's a bundled esbuild output, not `tsx` watch mode. **After API changes, restart the workflow.**

### 5. Environment Variables — Complete Reference

**Development (Replit Secrets):**

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | Neon Postgres pooled connection string (`?sslmode=require`) |
| `ADMIN_PASSWORD` | ✅ Yes | Super-admin login password for `/admin` |
| `RESEND_API_KEY` | ⚠️ Strongly recommended | Without this, NO form-submission emails go out (silent failure) |
| `GITHUB_TOKEN` | Optional | Personal access token if Agent pushes via GitHub REST API |
| `NOTIFY_EMAIL` | Optional | Default `cs.growitbuddy@gmail.com` |
| `CAREERS_EMAIL` | Optional | Default `cs.growitbuddy@gmail.com` |
| `EMAIL_FROM` | Optional | Default `GrowitBuddy <onboarding@resend.dev>` |
| `LOG_LEVEL` | Optional | pino log level (default `info`) |
| `PORT` | Auto | Replit binds it automatically |

**Production — Render (API):** (see `render.yaml`)

Same as above PLUS:
- `NODE_ENV` = `production`
- `PORT` = `10000`
- `ALLOWED_ORIGINS` = `https://growitbuddy-growitbuddy.vercel.app` (CORS allowlist, comma-separated; add custom domains here)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (for image uploads)

**Production — Vercel (frontend):**
- `VITE_API_URL` = `https://garden-planner-newzip.onrender.com/api`

### 6. Database Schema (Drizzle, `lib/db/src/schema/`)

| Table | Purpose |
|---|---|
| `site_content` | CMS content keyed by `section` (e.g. `home`, `about`, `seo:contact`, `seo:global`); `data` is JSONB |
| `leads` | All form submissions (type, name, email, payload as JSONB) |
| `certificates` | Issued certificates (with `is_hidden` for soft-delete) |
| `team_members` | Admin team accounts (bcrypt hashes) + per-section role permissions JSONB |
| `client_logos` | Logos on the Work page (id, image_url, alt, sort_order) |
| `portfolio_items` | Case studies on Work page (with `is_hidden`) |
| `portfolio_shares` | Trackable shared-portfolio links (slug, open count, revoked flag) |
| `page_variants` | Alternate published versions of any page (slug + variant key) |
| `media_files` | Image uploads stored as base64 in DB (served via `/api/media/file/:id`) |
| `influencers` | Influencer directory entries |

**Schema migrations:** `pnpm --filter @workspace/db run push` (dev only — pushes Drizzle schema to DB). For production, the API server runs idempotent `ADD COLUMN IF NOT EXISTS` startup migrations in `index.ts`.

**Seed data:** `growitbuddy_import.sql` (and `.sql.gz`) at the repo root contain a full DB snapshot. Restore with `psql $DATABASE_URL < growitbuddy_import.sql` on a fresh Neon DB (only needed if you ever set up a brand-new database — for migration, keep the existing Neon DB).

### 7. API Routes

Mounted at `/api/*`. Notable routes:

- `GET /api/healthz` — health check (Render uses this for uptime monitoring)
- `GET /api/sitemap.xml` — live-generated sitemap (respects global SEO master switch + per-page include-in-sitemap)
- `GET /api/admin/public/content/:section` — public content fetch (no auth)
- Admin CRUD: `/api/admin/content/:section`, `/api/admin/influencers`, `/api/admin/leads`, `/api/admin/logos`, `/api/admin/team`, `/api/admin/certificates`, `/api/admin/media`, `/api/admin/page-variants`, `/api/admin/portfolio-shares`
- Auth: `POST /api/admin/login`, `POST /api/admin/team/login`, `GET /api/admin/verify`, `POST /api/admin/logout`
- Forms (all send email via `sendEmail()` helper in `forms.ts`): `/api/forms/{contact, creators, page-owner, freelancers, full-time, internship, talent-pool, newsletter}`
- `POST /api/admin/ai-seo` — OpenAI-powered SEO analysis (bring-your-own-key flow, gated by ADMIN_PASSWORD)

**Rate limits:** in-memory per-IP, `formLimit = 5/60s`, `newsletterLimit = 20/60s`. Resets on server restart.

### 8. Frontend Routing (wouter)

SPA routes declared in `artifacts/growitbuddy/src/App.tsx`. Vercel's `vercel.json` rewrites all non-`/api/*` paths to `/index.html` for client-side routing.

Notable public routes (full list inside `/guide` page on the live site):
- `/`, `/about`, `/services`, `/work`, `/blog`, `/blog/:slug`, `/contact`, `/resources`
- `/portfolio/:slug`, `/portfolio/shared/:slug` (trackable shared variant)
- `/guide` (team onboarding), `/seo-guide`
- 9 talent-pool landing pages under `/talent/...`
- All admin under `/admin/*`

### 9. Design System

**Premium editorial / consulting** light theme. Palette: cream `#F8F8F6`, dark `#0A0A0A`, gold accent `#C2A878`, font Inter. **NO purple, NO bright colors, NO gradients.** All design tokens are in `artifacts/growitbuddy/src/index.css` as CSS variables (`--gb-*`). Component classes: `gb-btn`, `gb-card`, `gb-eyebrow`, etc.

### 10. Admin Panel Tour (high level — full reference is in `/guide` page v1.4)

- `/admin` — Dashboard: stat cards, Leads-by-Type bar chart, Recent Saves timeline, section status grid
- `/admin/home`, `/about`, `/services`, `/work`, `/blog`, `/resources`, `/contact`, `/distribution-pages` — content editors
- `/admin/blog` — full Yoast-style SEO suite (score ring 0-100, readability, search-intent detection, power-words analysis, internal-link suggestions)
- `/admin/page-variants` — A/B variant manager (each variant gets its own URL + its own SEO)
- `/admin/portfolio-shares` — generate trackable shareable portfolio URLs with open counts
- `/admin/leads`, `/admin/talent-pool-leads` — CRM inboxes
- `/admin/influencers`, `/admin/logos`, `/admin/certificates` — directory editors
- `/admin/media` — drag-drop multi-uploader, search, lightbox, one-click Copy URL
- `/admin/team` — role-based team accounts (super vs member; per-section permissions)
- `/admin/seo` — global Site-Indexing master switch + per-page (title / desc / canonical / OG / Twitter / JSON-LD with live preview cards)
- `/admin/navbar`, `/admin/footer`, `/admin/settings` (logo/favicon/colors/font-scale/cursor/intro), `/admin/page-visibility` (Maintenance + Coming Soon modes)
- `/admin/optimize` — performance toggles, cache warm-up, VACUUM ANALYZE

### 11. Email System — Critical Knowledge

**Every form endpoint** in `artifacts/api-server/src/routes/forms.ts` calls `sendEmail(to, subject, html, replyTo?)`. The function:
1. Checks `RESEND_API_KEY` — if missing, **logs an error and returns silently** (form still returns success to user).
2. Imports `resend` dynamically, calls `resend.emails.send(...)`.
3. On Resend error, logs the error details.

**Common failure modes:**
- **No API key on Render** → all emails fail silently. Verify by searching deployment logs for `"RESEND_API_KEY not set"`.
- **`onboarding@resend.dev` shared sender** → Resend only delivers to the email address that owns the Resend account. Fix by either (a) ensuring the Resend account is registered with `cs.growitbuddy@gmail.com`, or (b) verifying a custom domain in Resend and setting `EMAIL_FROM=GrowitBuddy <notifications@growitbuddy.com>`.
- **Gmail Promotions/Spam** → first email from `onboarding@resend.dev` often filed there. User must "Move to Inbox" once.

### 12. Deployment Flow

**Auto-deploy from GitHub `main`:**
- Push to `main` → Vercel rebuilds frontend (~2 min) + Render rebuilds API (~5 min)
- No manual deploy step needed
- Render free plan: cold-starts after 15 min idle (~30s wake-up on first request)

**Push patterns the Agent uses:**
- **Preferred (current workflow):** Atomic GitHub REST API via `GITHUB_TOKEN`. Write a Node script at `/tmp/push.mjs` that creates blobs, builds a tree, creates a commit, and PATCHes the ref. Re-create the script every turn since `/tmp` may not persist.
- **Fallback:** Direct `git push origin main` from the Replit shell (needs git credentials configured).

**Never** commit huge binary diffs (uploaded media). Image uploads go to Cloudinary or are stored as base64 in `media_files` table.

### 13. Things to Watch Out For

1. **`packages/db` does NOT exist** — the DB package is at `lib/db/`. The workspace import is `@workspace/db` (mapped via `pnpm-workspace.yaml` `packages: lib/*`).
2. **Catalog dependencies** — many packages use `"catalog:"` as the version. The actual version lives in `pnpm-workspace.yaml` under `catalog:`. Update the catalog, not individual `package.json` entries.
3. **`minimumReleaseAge: 1440`** is set in `pnpm-workspace.yaml` — pnpm rejects installing any npm package less than 24h old (supply-chain defense). Do NOT disable. If a package install fails, add it to `minimumReleaseAgeExclude` only if trusted.
4. **Render free plan cold starts** — first request after idle takes ~30s. Consider this when debugging "is the API down?" reports.
5. **`onboarding@resend.dev` deliverability** — see Section 11.
6. **Admin password is in env, not DB** — `ADMIN_PASSWORD` is checked directly. Team members (DB-stored) have a separate `/api/admin/team/login` flow with bcrypt hashes and per-section permissions.
7. **`growitbuddy_import.sql`** is a full DB dump committed to the repo. Useful for fresh Neon DB setup. For a normal migration, do NOT re-import — the existing Neon DB already has live data.
8. **Vercel `api/handler.mjs`** is a serverless adapter for the Express app — produced by `pnpm --filter @workspace/api-server run build:vercel`. This is a fallback path; primary API traffic goes to Render.
9. **Local git may diverge from origin** — pushes go via REST API, so `git status` on Replit can show "ahead by N commits" without it being a problem.

### 14. Commands Cheat Sheet

```bash
# Install
pnpm install

# Run everything (use Replit Run button instead in dev)
pnpm --filter @workspace/api-server run dev    # API
pnpm --filter @workspace/growitbuddy run dev   # Frontend
pnpm --filter @workspace/mockup-sandbox run dev

# Typecheck (workspace-wide)
pnpm run typecheck
# Or just one app:
cd artifacts/growitbuddy && npx tsc --noEmit

# Build everything
pnpm run build

# DB schema push (dev only — pushes Drizzle schema to $DATABASE_URL)
pnpm --filter @workspace/db run push

# Regenerate API client + Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Restore DB from seed dump (only for a brand-new empty DB)
psql "$DATABASE_URL" < growitbuddy_import.sql
```

### 15. User Preferences

- **Language:** User communicates in Hindi (Devanagari + Roman). Reply in the same style — keep technical explanations clear but warm.
- **Push method:** Commits go DIRECTLY to `main`, no PRs, no feature branches.
- **Deployment:** Auto-deploy via GitHub → Vercel + Render. Do not manually trigger deploys unless asked. After every push, tell the user the commit SHA and approximate wait time.
- **Validation:** Skip Replit's `mark_task_complete` validation runs — they don't apply here (real deployment is external).
- **Email recipient:** All form notifications go to `cs.growitbuddy@gmail.com`.
- **Never touch:** the Neon production DB (no DROP/TRUNCATE), the `minimumReleaseAge` setting, or random dependency bumps.

---

## Quick "Did I Set Everything Up?" Checklist

For the owner, after the migration:

- [ ] New Replit workspace created via GitHub Import from `Surajsharmaco/growitbuddy`
- [ ] `pnpm install` completed
- [ ] Replit Secrets set: `DATABASE_URL`, `ADMIN_PASSWORD`, `RESEND_API_KEY` (and optionally `GITHUB_TOKEN`)
- [ ] Run button works — all 3 workflows running
- [ ] `growitbuddy-growitbuddy.vercel.app` loads
- [ ] `garden-planner-newzip.onrender.com/api/healthz` returns `{"status":"ok"}`
- [ ] Admin login works at `/admin`
- [ ] Test form on `/contact` → email arrives at `cs.growitbuddy@gmail.com` within 2 min
- [ ] Render env vars verified (especially `RESEND_API_KEY`)
- [ ] Vercel env var verified: `VITE_API_URL`
- [ ] PART B onboarding prompt sent to the new Replit Agent

If all 10 boxes are ticked, migration is complete. ✅
