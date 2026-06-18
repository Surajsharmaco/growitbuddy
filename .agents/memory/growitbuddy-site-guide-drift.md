---
name: GrowitBuddy site-guide drift & orphaned influencer profile
description: Why the Site Guide defaults go stale, how to verify them, and the orphaned InfluencerProfile page / true meaning of profileEnabled
---

# Site Guide defaults drift

`artifacts/growitbuddy/src/lib/siteGuideDefaults.ts` hard-codes prose lists of
every public page and every admin page (plus a `v1.x` badge). These DRIFT whenever
routes/admin pages are added or removed.

**How to verify before editing:** ground truth = public/admin `<Route>`s in
`artifacts/growitbuddy/src/App.tsx` and the nav in
`artifacts/growitbuddy/src/components/admin/AdminLayout.tsx`. Diff the guide's
lists against those two files; do not trust the guide text itself.

**Why it only half-matters:** this file is the DEFAULT only. The Site Guide is
admin-editable, so on any environment where `/admin/site-guide` was saved, the DB
copy wins and editing the default changes nothing live. Fixing the default helps
fresh installs, dev, and the backup/handoff export — to push a correction to a
customized live site you must re-save it from `/admin/site-guide`.

# Orphaned InfluencerProfile + meaning of profileEnabled

- There is **no `/influencers/:slug` route**. `/influencers` renders the directory
  grid (`InfluencerExplore`) only.
- `artifacts/growitbuddy/src/pages/InfluencerProfile.tsx` exists but is **orphaned
  dead code**: not routed in `App.tsx`, not imported anywhere, and the directory
  cards (`InfluencerCard`) do not link to it. So there are NO broken profile links
  for users — the grid-only behaviour is internally consistent.
- The `profileEnabled` field on an influencer means **"show in the public
  directory"** (admin label: "Visible on the public directory"), NOT "has a profile
  page". It is correctly wired to the directory filter in `InfluencerExplore`.
- **Decision left open:** wiring up `/influencers/:slug` (+ profile links + SEO) is
  a NEW feature, and deleting the orphan is cleanup — both are product decisions,
  not part of a sync fix. Left untouched unless the user asks.
