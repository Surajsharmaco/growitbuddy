---
name: GrowitBuddy ghost-data fallback
description: Why public admin-managed list pages must respect explicitly-empty lists and never seed hardcoded demo defaults.
---

# GrowitBuddy "ghost data" — empty lists must stay empty

**Rule:** On public pages backed by admin-managed lists (influencers, distribution
pages, and any future `usePublicContent` / `useLiveInfluencers`-style list), an
explicitly-empty saved list (`{items: []}`) is authoritative and must render empty.
Fall back to the hardcoded demo defaults (`DEFAULT_INFLUENCERS`, `DEFAULT_DIST_PAGES`)
only when the section was **never configured** (no `items` array at all).

- Test with `Array.isArray(items)`, NEVER `items?.length` / `items.length > 0` — an
  empty array is falsy via `.length`, which is exactly what resurrected the demo
  "ghost" data when the admin deleted everyone.
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
