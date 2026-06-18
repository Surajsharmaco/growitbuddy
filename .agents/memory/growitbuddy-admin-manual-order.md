---
name: GrowitBuddy admin manual ordering (influencers & distribution)
description: How "who is 1st/2nd/3rd" is controlled — array order IS the public order; admin has a position-number input but public has no rank; reorder paused under filters.
---

# Admin manual ordering = array order; public has no rank number

Influencers (`AdminInfluencers.tsx`) and distribution/featured pages
(`AdminDistributionPages.tsx`) let the admin set who appears first/second/third on the
public pages. Each row has a shared `PositionControl` (in
`components/admin/AdminField.tsx`): a 1-based **position number input** (type `1` → first,
`2` → second…) plus up/down chevrons for ±1 nudges. The **public** pages still show NO
visible rank number — the number is an admin editing aid only.

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
- `moveToPosition(realIndex, newPos)` jumps an item to an absolute position: it reorders
  ONLY the active (non-trashed) sublist, then stitches trashed items back into their
  original slots via `prev.map(x => x.trashed ? x : nextActive[ai++])`. Clamps `newPos-1`
  into `[0, activeLen-1]`; same-position is a no-op. Validated against interleaved-trash
  cases.
- `PositionControl` keeps a local `draft` synced via `useEffect([position])`, commits on
  blur/Enter, resets NaN, clamps to `[1,total]`. Editors pass
  `position = activeItems.indexOf(item)+1`, `total = activeItems.length`,
  `disabled = filtersActive`.
- Reorder is **paused while any search/filter is active** (`filtersActive` disables the
  PositionControl) — keeps 1st/2nd/3rd unambiguous against the full list, not a filtered
  subset.
- Saving: the bottom `SaveBar` (non-sticky, owns the success/error toast + status) is kept,
  PLUS a duplicate "Save changes" button was added to each editor's TOP toolbar (next to
  Add) so users needn't scroll a long list after prepending a new item. Both call the same
  `handleSave`, which guards `if (saving) return;`.
- This interacts with the visibility filters: hidden/trashed items still occupy array
  positions; public order is the array order *after* `sanitizePublicContent` drops them.
