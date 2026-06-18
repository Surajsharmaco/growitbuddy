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
(empty db wins over defaults). The client fix (default `{items:[]}` / `{posts:[]}`, no
seed import, honest empty state) now covers influencers, distribution-pages, AND blog
(`Insights.tsx` listing + `InsightDetail.tsx` single post — a deleted slug now hits the
existing "Post not found" instead of a seed post). Still client-only. Page deliberately
NOT changed: authority-audit (needs its questions to function).

**Known SSR limitation (SEO-only, not user-visible):** the hidden crawler body
(`mergeForBody` + `CONTENT_DEFAULTS` `blog: blogPosts`, `distribution-pages:
distributionPages` in `ssr/contentDefaults.ts`) STILL injects the seed when the DB list
is empty — `isEmptyContent({posts:[]})` is true → falls back to the default array. This
is wrapped in a visually-hidden `data-ssr-seo` block that `createRoot` clears on mount,
so a JS browser user never sees it; it only affects raw HTML / crawlers / no-JS. Fixing
it requires regenerating the committed `api/render.js` via `scripts/build-fn.mjs`, which
**FAILS in this repl**: esbuild `Could not resolve "@neondatabase/serverless"` (not a
direct dep here; the original bundle inlined it from an env where it resolved). Vercel
deploys `api/render.js` AS-IS — the `build` script (`vite build` + `postbuild-ssr.mjs`)
only regenerates `api/_template.js`, NOT render.js — so source-only edits to `ssr/*`
never reach prod. Net: client fix is the shippable fix; the sr-only SSR seed cleanup is
blocked until render.js can be rebuilt. Reaches prod only via GitHub push (user-gated;
never push manually).
