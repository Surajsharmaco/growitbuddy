---
name: GrowitBuddy admin manual ordering (influencers & distribution)
description: How "who is 1st/2nd/3rd" is controlled — array order IS the public order; no rank number; reorder paused under filters.
---

# Admin manual ordering = array order, no public rank

Influencers (`AdminInfluencers.tsx`) and distribution/featured pages
(`AdminDistributionPages.tsx`) let the admin set who appears first/second/third on the
public pages via up/down chevrons on each row. There is intentionally **NO visible rank
number** anywhere — public or admin.

**Why it works with zero public-page changes:** the public pages
(`InfluencerExplore.tsx`, `DistributionNetwork.tsx`) render the items array in **raw order**
— they have no `.sort` / `.reverse` / order field. So persisting the admin's reordered
`items[]` (saved via `saveContent("influencers" | "distribution-pages", {items, ...})`)
*is* the public order automatically.

**How to apply / don't break it:**
- Never add a `.sort()` or a rank/order numeric field to the public pages or the saved
  payload — that would fight the manual array order. Order = position in `items[]`.
- `moveItem` swaps with the adjacent *visible* neighbor and recomputes indices inside the
  `setItems(prev)` updater (so a fast double-click can't swap the wrong rows).
- Reorder is **paused while any search/filter is active** (`filtersActive` gates
  `canMoveUp/canMoveDown`) with an inline "clear filters to change the public order" hint —
  this keeps 1st/2nd/3rd unambiguous against the full list, not a filtered subset.
- This interacts with the visibility filters: hidden/trashed items still occupy array
  positions; public order is the array order *after* `sanitizePublicContent` drops them.
