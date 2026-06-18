---
name: GrowitBuddy staleness verdict
description: Why "purani cheezein on refresh" is NOT a content-path code bug; what was verified, and that cache-clear buttons are honest no-ops by design.
---

Verified end-to-end (Playwright + API, June 2026): admin content edits reflect on the public site **immediately on first load** — no manual refresh required. So the recurring "stale content on refresh" report is NOT a content-caching code bug.

**Why:**
- Client public-content hook always fetches fresh: `no-store` + `?t=Date.now()` cachebust + cross-tab broadcast + visibility refetch; seeded from SSR bootstrap (`window.__GB_PUBLIC_CONTENT__`).
- API does NOT cache content reads (the public-cache allowlist excludes them); there is NO service worker anywhere.
- SSR renderer reads live Neon directly (`NEON_DATABASE_URL`) and merges DB over code defaults, so the server HTML is already current.
- Vercel serves SSR HTML with `cache-control: public` (no max-age) → edge MISS, not CDN-cached.

**Residual staleness is infra, not code:** Render free-tier cold start (client/SSR fetch can fail or be slow while the API is asleep → brief fallback to bootstrap/defaults) plus earlier deploy-pipeline issues (already resolved). Do NOT chase a content-cache bug.

**Cache-clear buttons are intentionally honest no-ops** — "Clear Frontend Cache" only deletes expired/revoked session tokens; "Clear Image Cache" does nothing (no server-side image cache); "Full Clear" purges tokens + runs DB ANALYZE. Their toasts truthfully state there is no server-side HTML/image cache. Do NOT "fix" them to fake a CDN purge.

**How to apply:** If staleness is reported again, investigate Render wake state and Vercel deploy/bundle freshness — not the content fetch/caching code.
