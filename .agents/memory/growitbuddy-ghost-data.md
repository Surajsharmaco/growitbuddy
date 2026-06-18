---
name: GrowitBuddy ghost-data fallback
description: Why public admin-managed list pages must respect explicitly-empty lists and never seed hardcoded demo defaults.
---

# GrowitBuddy "ghost data" — empty lists must stay empty

**Rule:** On public pages backed by admin-managed lists (influencers, distribution
pages, and any future `usePublicContent` / `useLiveInfluencers`-style list), the
admin-managed list is the ONLY source of truth. The default passed to
`usePublicContent` must be `{ items: [] }` — NEVER the hardcoded demo array. When
there is no live data (empty DB row, cold/timed-out SSR, asleep API, failed refetch)
the page renders an honest empty state, not resurrected demos.

- The bug recurs per-page: each list page must be fixed independently. The influencers
  fix did NOT cover distribution-pages — `DistributionNetwork.tsx` still defaulted to
  `{ items: DEFAULT_DIST_PAGES }` (20 demos) and resurrected deleted pages on every
  refresh/cold-start until its default was changed to `{ items: [] }` and the demo
  import dropped. Grep every `usePublicContent(..., { items: DEFAULT_* })` call.
- Test with `Array.isArray(items)`, NEVER `items?.length` / `items.length > 0` — an
  empty array is falsy via `.length`, which is exactly what resurrected the demo
  "ghost" data when the admin deleted everyone.
- **useMemo deps gotcha:** any derived/filtered list (`const filtered = useMemo(... ,
  [filters])`) MUST include the live data array in its deps. The live list arrives via
  a background fetch AFTER the first paint (initial state is empty on cold-start), so
  if the data array is missing from the deps the memo never recomputes and the grid
  stays stuck on "No pages found" until the user touches a filter.
- Do NOT seed demo defaults into React initial state either. `useLiveInfluencers`
  starts from the SSR bootstrap (`window.__GB_PUBLIC_CONTENT__.influencers`) when
  present, else `[]` + `loading=true`; resolve `loading=false` on BOTH fetch success
  and failure so a sleeping API shows an honest empty state, never an endless spinner
  or demo data. Consumers without their own data (e.g. `InfluencerProfile`) need a
  `loading` guard so they don't flash "not found" before the fetch resolves.

**Why:** Live stack is Vercel SSR + a free-tier Render API that cold-starts/sleeps +
Neon. The "deleted creators reappear / alternate every refresh" bug had two layers:
(1) empty-array→demo fallback, and (2) `useLiveInfluencers` ignored the SSR bootstrap,
so it first-painted demo data and, when the Render API was asleep, the failed client
refresh left demo stuck (awake refresh = real data, asleep refresh = demo → the
alternation the user reported).

**How to apply:** The SSR bootstrap uses raw DB content, so it already respects empty —
trust it over client defaults. `usePublicContent` correctly caches/merges `{items:[]}`
(empty db wins over defaults). Pages deliberately NOT changed (different semantics):
blog (WordPress/CMS-backed), authority-audit (needs questions to function), and the
hidden SEO crawler body (`mergeForBody`) which still defaults when empty but is
invisible sr-only text. The fix is client-only — no SSR rebuild needed. Reaches prod
only via GitHub push (user-gated; never push manually).
