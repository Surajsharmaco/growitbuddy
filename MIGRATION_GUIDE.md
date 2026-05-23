# GrowitBuddy — Project Migration & Handoff Guide

> **Purpose:** This document is for transferring the entire GrowitBuddy project to a new Replit account. It contains two parts:
> - **Part A — Owner's Quick Guide (Hindi/English)**: 5-minute checklist for the project owner.
> - **Part B — Full Technical Handoff (for Replit AI Agent)**: complete architecture, services, env vars, and operational knowledge needed by the AI agent on the new Replit workspace.

---

## PART A — OWNER'S QUICK GUIDE (आपके लिए)

### Step 1 — नया Replit account पर project import करें (recommended method)

1. नए Replit account में login कीजिए
2. **"Create Repl"** → top-right में **"Import from GitHub"** select कीजिए
3. URL paste कीजिए: `https://github.com/Surajsharmaco/growitbuddy`
4. **Import** दबाइए — Replit पूरा project automatically clone कर लेगा (1-2 min)

> ❌ **Zip download/upload method use मत कीजिए** — slow है, git history खो जाएगी, और Vercel/Render का auto-deploy connection टूट जाएगा। GitHub import ही best है।

### Step 2 — Existing external services (पहले से setup हैं, बस access transfer करें)

ये सब accounts पहले से बने हुए हैं। नए Replit account से access करने के लिए login credentials चाहिए होंगे — कोई नया signup नहीं करना:

| Service | Purpose | क्या करना है |
|---|---|---|
| **GitHub** (Surajsharmaco/growitbuddy) | Source code | New Replit को इसी repo से connect करें |
| **Neon** (neon.tech) | PostgreSQL database | Existing project के owner को रहने दें या team में invite करें |
| **Render** (dashboard.render.com) | API server hosting | Existing service `growitbuddy-api` है — कुछ change नहीं करना |
| **Vercel** (vercel.com) | Frontend hosting | Existing deployment है — कुछ change नहीं करना |
| **Resend** (resend.com) | Email notifications | API key already setup; अगर नई account से चलाना है तो नई key generate करें |
| **Cloudinary** (cloudinary.com) | Image uploads | Existing account credentials Render पर already set हैं |

### Step 3 — नए Replit account पर ये Secrets add करें

Replit dashboard में **Tools → Secrets** खोलकर ये 3 secrets add कीजिए (बाक़ी सब Render/Vercel पर हैं, Replit पर सिर्फ़ ये local dev के लिए):

| Secret Name | Value | कहाँ से मिलेगा |
|---|---|---|
| `DATABASE_URL` | Neon connection string | Neon dashboard → Connection Details → Pooled connection |
| `ADMIN_PASSWORD` | Admin panel password | जो पुराने account में था वही, या नया set करें |
| `RESEND_API_KEY` | Resend API key | resend.com → API Keys → Create |
| `GITHUB_TOKEN` *(optional)* | GitHub Personal Access Token | github.com → Settings → Developer settings → Tokens. Sirf तभी चाहिए जब Replit से directly GitHub को push करना हो |

> **`RESEND_API_KEY` important:** यही wo missing piece है जिसकी वजह से talent pool/contact form की emails नहीं आ रहीं। Replit और Render **दोनों** जगह set करना है।

### Step 4 — Production (Render + Vercel) पर ये env vars verify करें

Render और Vercel का auto-deploy GitHub के `main` branch से चलता है। नया Replit जब push करेगा तो automatic deploy हो जाएगा। पर पहले एक बार ये verify कर लें:

**Render (API server):** Dashboard → growitbuddy-api → Environment
- `DATABASE_URL` ✅
- `ADMIN_PASSWORD` ✅
- `RESEND_API_KEY` ⚠️ **(यही missing है — add कीजिए!)**
- `NOTIFY_EMAIL` = `cs.growitbuddy@gmail.com`
- `CAREERS_EMAIL` = `cs.growitbuddy@gmail.com`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` ✅
- `ALLOWED_ORIGINS` = `https://growitbuddy.vercel.app` (या आपका custom domain)
- `NODE_ENV` = `production`
- `PORT` = `10000`

**Vercel (frontend):** Dashboard → growitbuddy → Settings → Environment Variables
- `VITE_API_URL` = `https://growitbuddy-api.onrender.com/api`

### Step 5 — पहली बार चलाने के लिए

नए Replit workspace में terminal खोलकर:
```bash
pnpm install
```
फिर **Run** button दबाइए — सारे 3 workflows (API server, frontend, mockup sandbox) auto-start हो जाएँगे।

### Step 6 — नए Replit Agent को क्या कहें

बस इतना type कीजिए:
> "Read `MIGRATION_GUIDE.md` and `replit.md` first. Project structure और सारी services वहाँ documented हैं। उसके बाद मेरा काम शुरू करो।"

बाक़ी सब Part B में लिखा है — Agent खुद पढ़ लेगा।

---

## PART B — FULL TECHNICAL HANDOFF (FOR THE NEW REPLIT AI AGENT)

> **Read this entire section before making any changes.** This is the operational truth for the project.

### 1. Project Overview

**GrowitBuddy** is a premium content authority & marketing agency website with a full admin CMS, blog, influencer directory, talent pool, and lead capture system.

- **Live frontend:** `https://growitbuddy.vercel.app` (or custom domain)
- **Live API:** `https://growitbuddy-api.onrender.com`
- **GitHub:** `https://github.com/Surajsharmaco/growitbuddy` (branch: `main`)
- **Owner contact email (for all notifications):** `cs.growitbuddy@gmail.com`

### 2. Architecture (Monorepo)

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
│   ├── api-zod/                     # @workspace/api-zod — Zod schemas (generated from OpenAPI)
│   └── api-client-react/            # @workspace/api-client-react — React Query hooks (generated)
├── api/                             # Vercel serverless entrypoint (handler.mjs for /api/*)
├── scripts/                         # Maintenance & migration scripts
├── pnpm-workspace.yaml              # Workspace config + dependency catalog
├── render.yaml                      # Render deployment config (API)
├── vercel.json                      # Vercel deployment config (frontend + serverless API fallback)
├── DEPLOY.md                        # Original deployment notes (older — references Koyeb, ignore)
└── replit.md                        # Replit-facing project overview
```

**Deployment topology:**
- Vercel serves the React SPA AND has a serverless `/api/handler.mjs` fallback (used only if Render is down — primary API traffic goes to Render via the frontend's `VITE_API_URL`).
- Render runs the Express API as a long-running Node process on port 10000 (free plan, may cold-start after 15min idle).
- Neon provides Postgres — accessed by both Render and (rarely) the Vercel serverless handler.

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
| Bundler (API) | esbuild | 0.27 (CJS bundle to `dist/index.mjs`) |
| Frontend | React + Vite | 19 / 7 |
| Styling | Tailwind CSS v4 + Radix UI | 4.1 |
| Animation | Framer Motion + R3F (Three.js) | 12 / 9 |
| Router | wouter | 3.3 |
| Email | Resend | 6.12 |
| Image upload | Cloudinary | 2.10 |
| Logging | pino + pino-http | 9 / 10 |

### 4. Workflows (auto-configured in `.replit`)

Three workflows run in parallel on `pnpm` Run:

| Name | Command | Port |
|---|---|---|
| `artifacts/api-server: API Server` | `pnpm --filter @workspace/api-server run dev` | 8080 (dev), 10000 (Render prod) |
| `artifacts/growitbuddy: web` | `pnpm --filter @workspace/growitbuddy run dev` | 5173 (Vite default) |
| `artifacts/mockup-sandbox: Component Preview Server` | `pnpm --filter @workspace/mockup-sandbox run dev` | — |

The API server runs `pnpm build && pnpm start` on dev — it's a bundled esbuild output, not `tsx` watch mode. After API changes, restart the workflow.

### 5. Environment Variables — Complete Reference

**Development (Replit Secrets):**
| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | ✅ Yes | — | Neon Postgres connection string (must include `?sslmode=require`) |
| `ADMIN_PASSWORD` | ✅ Yes | — | Super-admin login password for `/admin` |
| `RESEND_API_KEY` | ⚠️ Recommended | — | Without this, NO form-submission emails go out (silent failure, logged as error) |
| `GITHUB_TOKEN` | Optional | — | Only needed if agent pushes commits via Contents/Git Data API (rare; user prefers direct Replit→GitHub git push) |
| `NOTIFY_EMAIL` | Optional | `cs.growitbuddy@gmail.com` | Recipient for general/newsletter form emails (hardcoded fallback in `.replit` userenv) |
| `CAREERS_EMAIL` | Optional | `cs.growitbuddy@gmail.com` | Recipient for talent pool / job application emails |
| `EMAIL_FROM` | Optional | `GrowitBuddy <onboarding@resend.dev>` | Override to use a verified custom domain sender |
| `LOG_LEVEL` | Optional | `info` | pino log level |
| `PORT` | Auto-set | 8080 (dev) | Replit binds this automatically |

**Production — Render (API):** (see `render.yaml`)
- Same as above PLUS:
- `NODE_ENV` = `production`
- `PORT` = `10000`
- `ALLOWED_ORIGINS` = `https://growitbuddy.vercel.app` (CORS allowlist, comma-separated)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (for `/admin/upload` image uploads)

**Production — Vercel (frontend):**
- `VITE_API_URL` = `https://growitbuddy-api.onrender.com/api`

### 6. Database Schema (Drizzle, `lib/db/src/schema/`)

| Table | Purpose |
|---|---|
| `site_content` | CMS content keyed by `section` (e.g. `home`, `about`, `seo:contact`); `data` is JSONB |
| `leads` | All form submissions (type, name, email, payload as JSONB) |
| `certificates` | Issued certificates (with `is_hidden` for soft-delete) |
| `team_members` | Admin team accounts (bcrypt hashes) |
| `client_logos` | Logos on the Work page (id, image_url, alt, sort_order) |
| `portfolio_items` | Case studies on Work page (with `is_hidden`) |
| `media_files` | Image uploads stored as base64 in DB (served via `/api/media/file/:id`) |
| `influencers` | Influencer directory entries |

**Schema migrations:** `pnpm --filter @workspace/db run push` (dev only — pushes Drizzle schema to DB). For production, the API server runs idempotent `ADD COLUMN IF NOT EXISTS` startup migrations in `index.ts` for `is_hidden` on `portfolio_items` and `certificates`.

**Seed data:** `growitbuddy_import.sql` (and `.sql.gz`) at the repo root contain a full DB snapshot. Restore with `psql $DATABASE_URL < growitbuddy_import.sql` on a fresh Neon DB.

### 7. API Routes

Mounted at `/api/*`. Full list in `replit.md`. Notable routes:

- `GET /api/healthz` — health check (Render uses this for uptime monitoring)
- `GET /api/admin/public/content/:section` — public content fetch (no auth)
- Admin CRUD: `/api/admin/content/:section`, `/api/admin/influencers`, `/api/admin/leads`, `/api/admin/logos`, `/api/admin/team`, `/api/admin/certificates`, `/api/admin/media`
- Auth: `POST /api/admin/login`, `POST /api/admin/team/login`, `GET /api/admin/verify`, `POST /api/admin/logout`
- Forms (all send email via `sendEmail()` helper in `forms.ts`): `/api/forms/{contact, creators, page-owner, freelancers, full-time, internship, talent-pool, newsletter}`
- `POST /api/admin/ai-seo` — OpenAI-powered SEO analysis (needs OpenAI key — currently uses ADMIN_PASSWORD-gated bring-your-own-key flow)

**Rate limits:** in-memory per-IP, `formLimit = 5/60s`, `newsletterLimit = 20/60s`. Resets on server restart (which happens on Render free plan after 15min idle).

### 8. Frontend Routing (wouter)

SPA routes are declared in `artifacts/growitbuddy/src/App.tsx`. Vercel's `vercel.json` rewrites all non-`/api/*` paths to `/index.html` for client-side routing. Full route list in `replit.md`.

### 9. Design System

**Premium editorial / consulting** light theme. NO purple, NO bright colors, NO gradients. All design tokens are in `artifacts/growitbuddy/src/index.css` as CSS variables (`--gb-*`). See `replit.md` "Design System" section for the full token list and component class names (`gb-btn`, `gb-card`, `gb-eyebrow`, etc.).

### 10. Email System — Critical Knowledge

**Every form endpoint** in `artifacts/api-server/src/routes/forms.ts` calls `sendEmail(to, subject, html, replyTo?)`. The function:
1. Checks `RESEND_API_KEY` — if missing, **logs an error and returns silently** (form still returns success to user).
2. Imports `resend` dynamically, calls `resend.emails.send(...)`.
3. On Resend error, logs the error details.

**Common failure modes:**
- **No API key on Render** → all emails fail silently. Verify with `fetch_deployment_logs` searching for `"RESEND_API_KEY not set"`.
- **Using `onboarding@resend.dev` shared sender** → Resend only delivers to the email address that owns the Resend account. If `NOTIFY_EMAIL` doesn't match the Resend account email, emails are rejected. Fix by either (a) ensuring the Resend account is registered with `cs.growitbuddy@gmail.com`, or (b) verifying a custom domain in Resend and setting `EMAIL_FROM=GrowitBuddy <notifications@growitbuddy.com>`.
- **Going to Gmail Promotions/Spam** → first email from `onboarding@resend.dev` often filed there. User must "Move to Inbox" once.

### 11. Deployment Flow

**Auto-deploy from GitHub `main`:**
- Push to `main` → Vercel rebuilds frontend (~2 min) + Render rebuilds API (~5 min)
- No manual deploy step needed
- Render free plan: cold-starts after 15 min idle (~30s wake-up on first request)

**Push patterns the agent has used:**
- **Preferred:** Direct git push from Replit shell (`git push origin main`) — needs git credentials configured
- **Fallback:** Atomic GitHub Contents API via `GITHUB_TOKEN` — write a Node script that creates blobs, builds a tree, creates a commit, and updates the ref. Pattern saved at `/tmp/push*.mjs` in the previous workspace; recreate as needed.

**Never** push huge binary diffs (uploaded media). Image uploads go to Cloudinary or are stored as base64 in the `media_files` DB table.

### 12. Recent Major Changes (last 30 days, for context)

- **Reusable `<CropModal>` component** wired into `ImagePickerField`, `ImageUrlField`, and `AdminLogos`
- **Admin "flash of default data" bug fixed** — added `loaded` flag pattern to AdminHome, About, Work, Settings, Blog, Influencers, DistributionPages (shows "Loading content…" until fetch resolves)
- **Work-page client-logo opacity reversed** — default opacity 1.0, hover 0.55
- **Email diagnosis complete** — `sendEmail()` is implemented correctly across all 8 form endpoints; root cause of missing emails is `RESEND_API_KEY` not set on Render

### 13. Things to Watch Out For

1. **`packages/db` does NOT exist** — the DB package is at `lib/db/`. The workspace import is `@workspace/db` (mapped via `pnpm-workspace.yaml` `packages: lib/*`).
2. **Catalog dependencies** — many packages use `"catalog:"` as the version (e.g. `"react": "catalog:"`). The actual version lives in `pnpm-workspace.yaml` under `catalog:`. Update the catalog, not individual `package.json` entries.
3. **`minimumReleaseAge: 1440`** is set in `pnpm-workspace.yaml` — pnpm will reject installing any npm package less than 24 hours old (supply-chain attack defense). Do NOT disable. If a package install fails for this reason, add the package to `minimumReleaseAgeExclude` only if it's from a trusted org.
4. **Render free plan cold starts** — first request after idle takes ~30s. Consider this when debugging "is the API down?" reports.
5. **`onboarding@resend.dev` deliverability** — see Section 10.
6. **Admin password is in env, not DB** — `ADMIN_PASSWORD` is checked directly. Team members (DB-stored) have a separate `/api/admin/team/login` flow with bcrypt hashes.
7. **The `growitbuddy_import.sql` file** is a full DB dump committed to the repo. Useful for fresh Neon DB setup; can be regenerated with `pg_dump`.
8. **Vercel's `api/handler.mjs`** is a serverless adapter that wraps the Express app — produced by `pnpm --filter @workspace/api-server run build:vercel`. This is a fallback path; primary API traffic goes to Render.

### 14. Commands Cheat Sheet

```bash
# Install
pnpm install

# Run everything (use Replit Run button instead in dev)
pnpm --filter @workspace/api-server run dev    # API
pnpm --filter @workspace/growitbuddy run dev   # Frontend
pnpm --filter @workspace/mockup-sandbox run dev

# Typecheck (full workspace)
pnpm run typecheck

# Build everything (typecheck + per-package build)
pnpm run build

# DB schema push (dev only — pushes Drizzle schema to $DATABASE_URL)
pnpm --filter @workspace/db run push

# Regenerate API client + Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Restore DB from seed dump
psql "$DATABASE_URL" < growitbuddy_import.sql
```

### 15. User Preferences

- **Language:** User communicates in Hindi (Devanagari + Roman). Reply in the same style — keep technical explanations clear but warm.
- **Push method:** User prefers commits going directly to `main` (no PRs, no feature branches).
- **Deployment:** Auto-deploy via GitHub → Vercel + Render. Do not manually trigger deploys unless asked.
- **Validation:** Skip `mark_task_complete` validation runs — they don't apply here (deploys are external).
- **Email recipient:** All form notifications go to `cs.growitbuddy@gmail.com`.

---

## Quick "Did I Set Everything Up?" Checklist

For the owner, after the migration:

- [ ] New Replit workspace created via GitHub Import from `Surajsharmaco/growitbuddy`
- [ ] `pnpm install` ran successfully
- [ ] Replit Secrets set: `DATABASE_URL`, `ADMIN_PASSWORD`, `RESEND_API_KEY`
- [ ] Run button works — all 3 workflows start
- [ ] Render env vars verified, especially `RESEND_API_KEY` ⚠️
- [ ] Vercel env var verified: `VITE_API_URL`
- [ ] Test form submission on `growitbuddy.vercel.app/contact` → email arrives at `cs.growitbuddy@gmail.com` within 2 min
- [ ] Admin login works at `growitbuddy.vercel.app/admin`

If all 8 boxes are ticked, migration is complete. ✅
