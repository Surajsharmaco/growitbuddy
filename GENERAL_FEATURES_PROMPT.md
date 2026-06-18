# Master Prompt — Add a Production-Grade SEO / AEO / GEO + CMS + Robustness Feature Set to My Website

> **How to use this prompt:** Paste everything below into the Replit Agent of ANY website project (any niche, any stack). It describes a battery of *general, niche-agnostic* features — proven in production — that you want added to that project. The agent should adapt them to whatever framework/stack the target project already uses, keep the project's existing branding and content, and implement the *behaviors and data models* described here. Nothing in this prompt is specific to one industry — it is pure infrastructure.

---

## ROLE & MANDATE (read first)

You are adding a reusable platform layer to my existing web app. **Do not change my niche, branding, copy, or visual design.** Add the capabilities below, adapt them to my current stack, and wire them into my existing pages. Prefer extending what exists over rewriting. After each module, verify it with the stated acceptance criteria.

If my project is a fresh/simple app, set up a small, clean foundation first (a backend API + a database + a content table), then build these features on top. If my project already has a backend and DB, reuse them.

### Non-negotiable engineering principles (apply to EVERY module)
1. **Single source of truth.** Page list, SEO defaults, and sitemap data all derive from ONE registry. Never duplicate the page list in multiple files.
2. **Server-authoritative security.** All access control is enforced on the server. Frontend gating (hiding menu items, buttons) is a *cosmetic mirror only* — never the actual guard.
3. **Fail closed, never fake.** On a failed data read, return empty/`null` and show an honest empty state. NEVER fall back to demo/placeholder/seed data — that causes deleted content to "resurrect" on the next save.
4. **No silent fallbacks that hide failure.** If something can't load, surface it; don't pretend it worked.
5. **Edits appear instantly.** Public content endpoints are `no-store`; the public UI re-fetches after an admin save.
6. **Null-safe everywhere.** Any CMS-driven array is guarded (`Array.isArray(x) && x.map(...)`) before iteration. Any CMS-driven lookup tolerates missing fields.
7. **Crawlers see real content without JavaScript.** Per-page meta + the page's primary text must exist in the server-rendered HTML, not only after JS runs.
8. **No secrets in code or in any export.** All credentials come from environment variables; exports strip secret-like files and PII.

---

## DATA FOUNDATION

Create (or reuse) a backend API and a relational database (PostgreSQL recommended; use an ORM such as Drizzle/Prisma). The core of the whole system is a single generic content table:

```
site_content (
  section   TEXT PRIMARY KEY,     -- arbitrary key, e.g. "home", "about", "blog", "seo:home", "seo-global"
  data      JSONB NOT NULL,       -- any JSON-serializable payload
  updated_at TIMESTAMP DEFAULT now()
)
```

Plus supporting tables introduced by the modules below: `leads`, `team_members`, `media_files`, `page_variants`, `admin_action_logs`, and any domain tables you already have. **Everything editable on the site lives as a `section` row in `site_content`** — there are no per-feature content tables. (E.g. a "team directory", "FAQ list", "pricing tiers", "testimonials" are each just a section key holding an array — NOT separate tables.)

---

# MODULE 1 — Page Registry (single source of truth)

**Goal:** One central manifest that every SEO surface reads from.

**Requirements:**
- A typed array `PAGE_REGISTRY` where each entry has:
  - `slug` (unique id, e.g. `"home"`), `path` (route, e.g. `"/"`), `label` (human name for admin UI), `group` (UI category for grouping in the admin panel).
  - `defaults`: `{ title, description, index?: boolean, sitemap?: boolean }` — the baseline meta for that page. `index`/`sitemap` default to `true`; utility/legal/auth pages set them to `false`.
  - `priority` (0.0–1.0, sitemap hint, default 0.7) and `changefreq` (e.g. `"weekly"`, default `"monthly"`).
- Lookup helpers: `findEntryByPath(pathname)` (handles dynamic routes like `/blog/:slug` → maps to the blog entry; `/item/:id` → detail entry) and `findEntryBySlug(slug)`.
- Put this in a shared module (e.g. a `lib/seo` package) so the frontend, the backend sitemap route, and any SSR function all import the SAME registry.

**Acceptance:** Adding or editing one registry entry updates the sitemap, the admin SEO panel list, and the default meta for that page — with no other edits.

---

# MODULE 2 — Per-Page Admin SEO Overrides (full meta control)

**Goal:** Let a non-technical admin override every SEO field per page from a UI, stored in the DB, overriding the registry defaults.

**Data model** — store under `site_content.section = "seo:<slug>"`, shape `PageSEOData`:
- **Indexability:** `index?`, `follow?`, `sitemap?` (booleans; default true).
- **Core meta:** `title?`, `description?`, `canonical?` (absolute URL or path starting with `/`).
- **Open Graph:** `ogTitle?`, `ogDescription?`, `ogImage?`, `ogType?` (`"website" | "article"`).
- **Twitter:** `twitterCard?` (`"summary" | "summary_large_image"`), `twitterTitle?`, `twitterDescription?`, `twitterImage?`.
- **Raw structured data:** `schema?` (a string of free-form JSON-LD the admin can paste; validate with `JSON.parse` before injecting, skip if invalid).
- **AEO/GEO fields** (see Modules 3 & 4): `primaryTopic?`, `searchIntent?`, `aiSummary?`, `entityMentions?`, `keyConcepts?`, `geoRelevance?`, `faq?: Array<{ q, a }>`.

**Global kill switch:** a row `site_content.section = "seo-global"` holding `{ siteIndexable: boolean }`. When `false`, the WHOLE site renders `noindex,nofollow` and all sitemaps return empty. Use this for staging or pre-launch.

**Resolution rule everywhere:** `effective = adminOverride ?? registryDefault`. Indexability resolves as: if `!siteIndexable` → noindex; else `seo.index ?? registryEntry.defaults.index ?? true`.

**Admin UI:** an "SEO Control" page listing every registry page (grouped). Selecting a page opens a form with all fields above, a live snippet preview, and per-page index/follow/sitemap toggles. Save writes `seo:<slug>`.

**Acceptance:** Set a custom title on a page in the admin → it appears in the page's `<title>`, OG/Twitter tags, AND in the server-rendered HTML (Module 7).

---

# MODULE 3 — AEO (Answer Engine Optimization)

**Goal:** Make pages easy for AI answer engines (ChatGPT, Perplexity, Google AI Overviews) to quote correctly.

**Requirements:**
- `aiSummary` — a tight, citable paragraph that directly answers the page's core question; render it in the page (e.g. an intro/abstract) AND expose it to crawlers in the SSR body.
- `faq` — admin-managed Q&A pairs. Render them visibly on the page AND emit matching **FAQPage JSON-LD** (Module 5). Rule: FAQ structured data MUST match on-page visible text, or engines ignore it.
- `searchIntent` (informational / commercial / navigational / transactional) and `primaryTopic` — used to shape headings and the summary.
- Ensure each page has exactly one clear `<h1>` and a logical heading outline; AI extractors rely on it.

**Acceptance:** A page with FAQs shows them on-screen and emits valid FAQPage JSON-LD whose questions/answers exactly match the visible text.

---

# MODULE 4 — GEO (Generative Engine Optimization / entity signals)

**Goal:** Strengthen entity recognition so AI engines understand *what/who* a page is about.

**Requirements:**
- `entityMentions` (comma-separated named entities — people, brands, products, places) and `keyConcepts` (comma-separated topical tags) — surface these as structured data and/or visible context, and feed them into JSON-LD `about`/`mentions` where appropriate.
- `geoRelevance` — geographic targeting hint ("Global", country, region); reflect in structured data when relevant.
- Maintain a site-level entity graph (Module 5: Organization + WebSite) with a stable `@id`, logo, and `sameAs` array of official social/profile URLs — this anchors the brand as a recognized entity.
- Provide an **`llms.txt`** at the site root: a concise, AI-friendly plain-text summary of the site, its key pages, and what it offers. Link to it from `robots.txt`.

**Acceptance:** Home page emits an Organization+WebSite `@graph` with `sameAs`; `llms.txt` is reachable and accurate.

---

# MODULE 5 — Structured Data (JSON-LD) builders

**Goal:** Consistent, valid schema.org markup across the site.

**Requirements (builder functions in the shared SEO module):**
- `buildOrganizationSchema()` — name, url, logo (ImageObject), description, contactPoint, founder, `sameAs`. Stable `@id` like `${SITE_URL}/#organization`.
- `buildWebSiteSchema()` — site identity, publisher linked to the Organization `@id`.
- `buildSiteGraph()` — combines Organization + WebSite into one `@graph`; inject statically on the home page / index.html.
- `buildFAQSchema(faqs)` — FAQPage from the admin `faq` array.
- **Dynamic-page schema:** detail/profile pages emit the right type — `Person` + `ProfilePage` for people/profiles; `Article` / `CreativeWork` for posts/case studies/portfolio detail; `BreadcrumbList` where there's a hierarchy.
- Admins can additionally paste raw JSON-LD via `PageSEOData.schema`; validate then inject.

**Acceptance:** Google Rich Results Test passes for home (Organization), an FAQ page (FAQPage), a post (Article), and a profile (Person/ProfilePage).

---

# MODULE 6 — Dynamic Sitemaps + robots.txt

**Goal:** Always-correct sitemaps and crawler directives.

**Requirements:**
- `GET /sitemap.xml` — built from `PAGE_REGISTRY`, filtered by `index !== false && sitemap !== false` and excluding dynamic (`:param`) routes; honors per-page admin overrides and the `seo-global` kill switch (empty if site is non-indexable).
- A second sitemap for any content collection (e.g. `GET /sitemap-blog.xml`) generated from DB rows (and/or an external CMS/WordPress API if used), **excluding trashed and draft items**.
- Both sitemaps MUST apply the same visibility filtering as the site (Module 11) — a draft/trashed item must never appear in a sitemap.
- `robots.txt` with an **"explicitly welcome AI" strategy**: a wildcard (`*`) block allowing content and disallowing private paths (`/admin`, auth, verify, etc.), PLUS named blocks for `GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`, `CCBot`, etc. **Critical gotcha:** named-agent blocks ignore the wildcard block entirely, so you MUST repeat the global `Disallow` lines inside each named block. Include `Sitemap:` lines and a link/comment pointing to `llms.txt`.

**Acceptance:** `/sitemap.xml` lists exactly the indexable static pages; a drafted post is absent from `/sitemap-blog.xml`; AI bots are allowed content but blocked from private paths.

---

# MODULE 7 — Server-side rendering / pre-render for crawlers

**Goal:** Per-page meta + the page's real text exist in the raw HTML (no JS required), so crawlers and social scrapers (which don't run JS) see correct titles, descriptions, OG images, JSON-LD, and content.

**Requirements:**
- A request-time renderer (a serverless function on the host, or SSR/SSG in your framework) that, for each public route:
  1. Looks up the registry entry by path.
  2. Reads the live DB DIRECTLY for `seo:<slug>`, `seo-global`, and the page's content section(s) — **do not depend on a slow/cold-starting API for first render.** Use a low-latency driver and a hard timeout (~2.5s) with a total fallback to registry defaults so a DB hiccup can NEVER take the site down (always return HTTP 200 with valid HTML).
  3. Injects into `<head>`: resolved `<title>`, description, robots, canonical, full OG + Twitter tags, and per-page JSON-LD.
  4. Bootstraps data into the HTML so the SPA's first paint has no flash and crawlers' JS render needs no network: `window.__PUBLIC_CONTENT__ = <sanitized page content>` and `window.__SEO__ = { slug, path, data: <resolved seo>, globalIndexable }`.
  5. Injects the page's primary text (H1/H2/paragraphs derived from the admin content) into a visually-hidden container inside the app root, so the no-JS HTML source contains real, route-specific copy.
- **Sanitize content BEFORE it enters the bootstrap or the SEO body** (Module 11) — trashed/draft/hidden items must never reach the raw source.

> **CRITICAL OPS GOTCHA (this exact bug cost real time):** whatever host runs this renderer (e.g. Vercel) MUST have the DB connection string in ITS OWN server-side env (e.g. `NEON_DATABASE_URL` or `DATABASE_URL`, NOT a `VITE_`/client var). If it's missing or named differently, the renderer silently serves registry defaults + an EMPTY content bootstrap (admin SEO/content won't be server-rendered, only client-rendered). Symptom to check: view-source shows `__SEO__.data:{}` AND `__PUBLIC_CONTENT__:{}` on every page. Also note: successful-but-empty reads can be cached hard by the CDN — after fixing the env you must redeploy AND purge the cache.

**Acceptance:** `view-source:` on several pages shows admin titles, correct OG tags, page-specific JSON-LD, and real body text — all without running JS.

---

# MODULE 8 — Client-side SEO application (race-safe)

**Goal:** In the live SPA, the admin's SEO always wins, with no flash and no overwrite by page-level defaults.

**Requirements:**
- A root-mounted `DynamicPageSEO` controller that, on every route change:
  1. Synchronously (in a layout effect, before passive page effects run) applies the SSR bootstrap (`window.__SEO__`) so the correct `<title>`/meta are stamped first; mark admin-controlled tags with an attribute like `data-admin-seo="1"`.
  2. Then fetches the latest override (`GET /api/seo/:slug`) and re-applies; an older in-flight fetch must never clobber a newer one (use a monotonic request id), and a failed fetch must never downgrade correct server-rendered meta.
  3. Listens for cross-tab `storage`/content-update events and re-applies when the relevant `seo:<slug>` or `seo-global` row changes.
- A passive `SEOMeta` component usable inside page templates that **checks for `data-admin-seo` and refuses to overwrite** any tag the admin controller already set.

**Acceptance:** Navigating between pages shows the correct admin titles immediately (no default→admin flash); page components never overwrite admin SEO.

---

# MODULE 9 — Generic Admin CMS (editable content) + sticky SaveBar

**Goal:** Make essentially everything on the site editable from an admin panel without code changes.

**Requirements:**
- API: `GET /api/admin/public/content/:section` (public read) and `PUT /api/admin/content/:section` (admin write). Arbitrary section keys allowed (no whitelist) so new editable areas need no backend change.
- A `usePublicContent(section, defaults)` hook that merges DB data over code-provided defaults, with a session-level in-memory cache and in-flight request de-duplication to avoid flashes. **It must distinguish "loaded but empty" from "load failed"** and, on failure, NOT fall back to defaults that could overwrite real data on save (Module 12).
- Live updates: on admin save, broadcast a `localStorage` event so other open tabs (and the public preview) re-fetch.
- Reusable admin field components (Input, Textarea, image picker, list editor) and a **sticky, always-visible SaveBar** pinned to the bottom of admin forms showing `Unsaved / Saving… / Saved`, with auto-fading success/error toasts.
- A `PageGate` mechanism: a `page_visibility` section that can put individual pages (or the whole site) into "coming soon"/"maintenance" mode.

**Acceptance:** Add a new editable section to a page in minutes (no backend edit); edits save and appear on the public page immediately; the SaveBar always reflects true state.

---

# MODULE 10 — Auth + RBAC (server-authoritative)

**Goal:** Secure admin with a super-admin and fine-grained team-member roles, with NO third-party auth dependency.

**Requirements:**
- **Token:** a signed, stateless token `expiry.nonce.role.permsB64.signature`, where the signature is an HMAC-SHA256 of the payload using a server secret. Store client-side (e.g. `localStorage`) and send as `Authorization: Bearer`. Support server-side revocation (a `revoked_tokens` table checked in middleware).
- **Two login paths:** super-admin via an `ADMIN_PASSWORD` env secret; team members via email + password checked against a `team_members` table (passwords hashed with `scrypt`/`argon2`/`bcrypt`, never plaintext).
- **RBAC middleware:** `authMiddleware` (verifies token, populates `role` + `permissions`), `superAdminOnly` (role check only — do NOT accept an `"all"` wildcard here, or a team member could self-escalate), and `requirePermission(perm)` for content routes. An `"all"` permission may grant content access but must NOT bypass super-admin-only routes.
- Map content sections to required permissions so each team member only edits what they're allowed to.
- The admin sidebar shows/hides items based on permissions, but this is **display only** — every API route independently enforces access.

**Acceptance:** A limited team member cannot call a route outside their permissions even with a crafted request; super-admin-only routes reject the `all` wildcard; tokens can be revoked.

---

# MODULE 11 — Public visibility filters (no ghost/hidden leaks)

**Goal:** Trashed, draft, or hidden items NEVER reach the public — in the UI, the raw HTML, OR the sitemaps.

**Requirements:**
- A single `sanitizePublicContent(content)` chokepoint that strips items where `trashed === true`, `status === "draft"`, or a visibility flag is off (e.g. `enabled === false`, `hidden === true`).
- Apply it at EVERY surface, not just React:
  1. The SSR content bootstrap (`__PUBLIC_CONTENT__`).
  2. The SSR SEO body generator (recursively skip hidden/trashed/draft branches when emitting H1/H2/P).
  3. Every sitemap (main + collection).
  4. The client render (defense in depth).
- Keep all four in lockstep — if you add a new visibility flag, update the chokepoint, not four call sites.

**Acceptance:** Create a draft + a trashed item → confirmed absent from view-source, the live UI, and all sitemaps.

---

# MODULE 12 — Ghost-data prevention (deleted content stays deleted)

**Goal:** Deleted/empty content must never resurrect after a save.

**Requirements:**
- List editors must initialize collections to `[]` — NEVER to demo/seed defaults. Seeding demo data into initial state means "Save" re-persists deleted items.
- Distinguish **empty** from **load-failed**: if a content read fails, the editor must fail closed (disable save / show error), NOT load defaults that overwrite the DB.
- Test emptiness with `Array.isArray(x)` (not `x.length`), and resolve loading states even when a fetch fails so the UI doesn't hang.

**Acceptance:** Delete all items in a list, reload, save again → the list stays empty; a simulated read failure does not wipe existing data.

---

# MODULE 13 — Structural robustness (no white screens)

**Goal:** A single component crash never blanks the site.

**Requirements:**
- A global **Error Boundary** (class component with `getDerivedStateFromError` + `componentDidCatch`) wrapping the page area INSIDE the layout, so a crash shows a graceful, on-theme fallback card with the site chrome (nav/footer) intact.
- **Route-keyed reset:** the boundary resets its error state when the route changes (key it on the current location), so navigating away recovers automatically.
- Apply the null-safe array/lookup guards from Principle 6 at all CMS-driven render points; skip collection items missing a required field (e.g. no `slug`) instead of throwing.

**Acceptance:** Force an error in a page → fallback renders (not a blank screen); navigating to another route recovers.

---

# MODULE 14 — Media management (upload, CDN + fallback, optimization)

**Goal:** Robust media handling that works with or without a CDN.

**Requirements:**
- An upload endpoint that stores to a CDN (e.g. Cloudinary) when configured (`CLOUDINARY_URL`), and otherwise falls back to storing bytes (base64) in a `media_files` table served via an `/api/media/file/:id` proxy. Persist metadata (filename, mimetype, size, url, cdn id).
- **Image optimization:** on upload, convert raster images to WebP/AVIF (via `sharp` or equivalent) only when it actually reduces size beyond a small threshold (e.g. ≥2% smaller) to avoid pointless re-encoding.
- A `resolveMediaUrl(url)` helper used at EVERY public render point: if the stored URL is relative (`/api/media/...`), prepend the API origin — otherwise split-origin production (separate frontend/api domains) 404s the media.
- Optional: a bulk "convert existing media to WebP/AVIF" admin tool that rewrites references across all content and never deletes the old asset inline.

**Acceptance:** Uploads work with and without a CDN configured; images are served in a modern format; media renders correctly when frontend and API are on different domains.

---

# MODULE 15 — Page variants (A/B / audience)

**Goal:** Alternate versions of a page for testing or audience targeting.

**Requirements:**
- A `page_variants` table (`sourceKey`, `slug`, `label`, `isLive`). Variant content lives in `site_content` under a namespaced key like `{sourceKey}__v__{variantSlug}`.
- The content layer transparently swaps to the variant key when a `?variant=<slug>` param (or assignment rule) is present, so pages need no special code.

**Acceptance:** Create a variant, edit its content independently, view it via the variant param without affecting the original.

---

# MODULE 16 — Lead capture / CRM

**Goal:** Capture and manage form submissions.

**Requirements:**
- A `leads` table (`type`, `name`, `email`, `data` JSON blob, `status` default `"new"`, `notes`, `createdAt`). Public forms POST here.
- An admin dashboard to list/filter leads, change status, add internal notes, and export (e.g. Excel via `exceljs`/CSV).
- **Honesty rule:** the form must report real success/failure — a `200` must mean the lead actually persisted (don't swallow DB errors and show a fake "thank you").

**Acceptance:** Submitting a form creates a lead; the dashboard shows it; export works; a DB failure surfaces as an error, not a false success.

---

# MODULE 17 — Admin action audit log

**Goal:** Accountability for admin actions.

**Requirements:**
- An `admin_action_logs` table; a `pushLog(action, detail, ok)` helper called on meaningful admin operations (saves, team changes, deploys, optimizations). Auto-prune to the latest ~1000 rows.

**Acceptance:** Performing an admin action writes an audit row; the log view shows recent actions with success/failure.

---

# MODULE 18 — Migration / Backup / AI-Handoff system

**Goal:** One-click, super-admin-only export that lets anyone (or any AI) understand, restore, or take over the project.

**Requirements (a `backup` library + two routes + an admin UI):**
- `buildContentSnapshot()` — dumps all CMS/content tables as JSON, **excluding PII** (emails, lead personal data, password hashes) and heavy binary blobs (media bytes — keep metadata/URLs only).
- `buildHandoffDocs()` — generates a doc set: `START_HERE.md`, `AI_PROMPT.md`, `ARCHITECTURE.md`, `SETUP_AND_DEPLOY.md`, `ENV_AND_CONNECTIONS.md` (names + purpose of every env var, **no values**), `DATABASE.md` (real table list — keep it accurate to the actual schema), and a `MANIFEST.json` (repo, branch, commit, generated-at, includes list).
- `buildMasterPrompt()` — a single large document that REUSES the same handoff docs + a live content snapshot, designed to paste into an AI to rebuild/continue the project (keep it single-source with `buildHandoffDocs` so they never drift).
- `assembleBackupZip()` — fetches the committed source (e.g. from GitHub via `GITHUB_TOKEN`), flattens it under `SOURCE_CODE/`, **strips secret-like files** (`.env`, `*.pem`, `*.key`, `*.p12`, id_rsa, etc.; allow `.env.example`), and enforces zip-bomb caps (max entries + max uncompressed bytes, checked before inflation). Adds the generated docs + snapshot.
- Routes: `GET /api/admin/backup` (ZIP download, super-admin only) and `GET /api/admin/handoff-prompt` (the live master prompt). An `AdminBackup` UI exposes both.
- **Keep `DATABASE.md`/docs accurate:** the table list and feature description must match the real schema and real features (don't document tables that don't exist).

**Acceptance:** A super-admin can download a ZIP that contains the full source (no secrets), accurate docs, and a PII-free content snapshot; and can copy a master prompt that reflects the current site.

---

# MODULE 19 — Performance & caching strategy

**Goal:** Fast for visitors, instant for admins.

**Requirements:**
- Public content read endpoints: `Cache-Control: no-store` so admin edits show immediately.
- The SSR/pre-render layer may use CDN caching (`s-maxage` + `stale-while-revalidate`) for speed, but understand the trade-off in Module 7 (empty/fallback reads can get cached — purge after fixing data/env issues).
- Session-level in-memory content cache on the client to remove repeat-visit flashes.
- Lazy-load heavy/below-the-fold sections; serve modern image formats (Module 14).

**Acceptance:** Admin edits appear on the next public load; repeat in-tab navigation has no content flash.

---

# MODULE 20 — Stack hygiene (apply to whatever stack this project uses)

- **Contract-first API** where practical: define request/response schemas (OpenAPI + generated types, or shared Zod schemas) and validate inputs AND outputs on the server.
- **Structured logging** (e.g. pino) — never raw `console.log` in server code; use request-scoped logging.
- **Typed end-to-end** (TypeScript strict) and a passing `typecheck` as the bar for "done".
- **Secrets only via env vars**, surfaced through the platform's secret manager — never committed.

---

## SUGGESTED BUILD ORDER

1. Data foundation + Module 1 (registry) + Module 9 (generic CMS + SaveBar) — the backbone.
2. Module 10 (auth/RBAC) — so the admin is safe before exposing editors.
3. Modules 2–6 (SEO/AEO/GEO/JSON-LD/sitemaps/robots) — the SEO core.
4. Modules 7–8 (SSR pre-render + client SEO controller) — crawler correctness. **Don't forget the Module 7 ops gotcha (DB env on the render host).**
5. Modules 11–13 (visibility filters, ghost-data prevention, error boundary) — robustness.
6. Modules 14–17 (media, variants, CRM, audit log) — admin power features.
7. Modules 18–20 (backup/handoff, caching, stack hygiene) — operability.

---

## FINAL ACCEPTANCE CHECKLIST (verify before calling it done)

- [ ] One registry drives meta, the admin SEO list, and sitemaps.
- [ ] Admin can override every meta field per page; changes appear in `view-source` (not just after JS).
- [ ] FAQ pages emit FAQPage JSON-LD that matches visible text; home emits Organization+WebSite `@graph`; posts/profiles emit Article/Person.
- [ ] `llms.txt` exists; `robots.txt` welcomes AI bots but repeats disallows in each named block.
- [ ] `seo-global` kill switch flips the whole site to noindex + empties sitemaps.
- [ ] Render host has the DB connection string in its own server env; view-source bootstrap is populated, not `{}`.
- [ ] Trashed/draft/hidden items are absent from UI, raw HTML, and sitemaps.
- [ ] Deleting all items in a list and saving keeps it empty (no demo-data resurrection); failed reads don't wipe data.
- [ ] A thrown error shows a fallback with chrome intact and recovers on navigation.
- [ ] RBAC is enforced server-side; super-admin-only routes reject the `all` wildcard; media resolves on split-origin.
- [ ] Backup ZIP contains source (no secrets) + accurate docs + PII-free snapshot.
- [ ] `typecheck` passes; server uses structured logging; all secrets come from env vars.

> Implement these faithfully and adapt naming to my project's conventions. Ask me only for environment secrets (DB URL, admin password, CDN/email keys) — build everything else autonomously.
