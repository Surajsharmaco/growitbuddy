---
name: GrowitBuddy content is DB-driven (not code) on live
description: Why code edits to home/section defaults are invisible on the live site, and why dev cannot change live content
---

- Live pages call `usePublicContent(section, DEFAULTS)` which, on every mount, fetches `${API_BASE}/admin/public/content/<section>` from the **prod Render backend** (`https://growitbuddy-api.onrender.com/api`) and merges the returned `data` OVER the code defaults. Whenever the prod DB has a row for that section, the DB value WINS and code-default edits are invisible on live (they only show when that section's DB row is null).
- The frontend bundle / SSR `homeDefaults` is only a fallback. Verifying a "visible" change by editing defaults is unreliable for any section with saved admin content (e.g. `home`, `settings`, `seo-global`). Sections null in prod (e.g. `navbar`, `footer`) DO render from code defaults, so a code-pipeline visible proof must target a null-in-prod section.
- **Dev repl DB != prod DB.** This repl's api-server returns `data:null` for content sections while prod returns real rows — they are different databases. So live content CANNOT be changed from this dev environment; it changes only via the **admin panel** (writes to prod DB through Render) or direct prod-DB access (not available in this repl).
- Practical: live site *text/content* is changed through the admin dashboard (instant, no deploy). The Replit->GitHub->Vercel deploy pipeline is for code/features only; it cannot move content rows.
- **Why:** burned a long debugging detour chasing browser cache / React mount / SSR when a home "results->result" code edit refused to show on live — real cause was the runtime DB override plus the separate (empty) dev DB.
