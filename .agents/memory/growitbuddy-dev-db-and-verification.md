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
