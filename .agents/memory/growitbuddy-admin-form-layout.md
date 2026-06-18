---
name: GrowitBuddy admin form layout convention
description: How the admin add/edit forms (influencers, distribution pages) lay out photo + fields, and the responsive col-span gotcha.
---

# Admin form layout (influencers / distribution pages)

The clean, approved layout for admin add/edit forms that pair an `ImagePickerField`
with a set of fields:

- Put the `ImagePickerField` in its **own full-width box on top**:
  `rounded-xl border border-[#0B0B0B]/8 bg-[#fafafa] px-4 py-4` (size ~72).
- Put the fields **below** in a full-width responsive grid:
  `grid grid-cols-1 sm:grid-cols-2 gap-4`.
- A field that should be a full-width row (e.g. Full Name / Page Name / URL Slug /
  description / high-engagement toggle) must use **`sm:col-span-2`**, NOT bare
  `col-span-2`.

**Why:** The old layout was photo on the LEFT (`shrink-0`) next to a
`flex-1 grid grid-cols-2` — the photo stole horizontal width, squeezed the fields,
and made the Upload/Library/Remove/Shape buttons wrap into a cramped mess (user
complained the "Add Influencer" upload pop-up + distribution forms looked
unorganized). Bare `col-span-2` inside a `grid grid-cols-1` base can target an
implicit 2nd column at the mobile breakpoint instead of acting as a simple
full-width row, breaking the responsive intent.

**How to apply:** When restructuring photo-left+`flex-1 grid` forms, remember the
conversion drops one flex-wrapper nesting level — emit ONE fewer closing `</div>`
per spot. `ImagePickerField` is shared/generic — give it room via parent layout,
do NOT edit its internals.
