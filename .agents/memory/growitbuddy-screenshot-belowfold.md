---
name: GrowitBuddy below-fold screenshot verification
description: How to visually verify below-the-fold Home.tsx sections (services cards, etc.) with the screenshot tool despite the 100vh hero + framer-motion whileInView.
---

# Verifying below-fold sections on GrowitBuddy Home

The screenshot tool captures only the top viewport at scroll 0 (no scrolling). The Home hero `<section>` uses `minHeight: "100vh"`, so it always exactly fills the captured viewport — every section below it (stats, problem, **services cards**, CTA) sits just past the fold and is never captured. Hash navigation (`/#id`) does NOT help: the id mounts after React renders, so the browser's initial hash-scroll lands on nothing.

Also: the services cards animate in via framer-motion `whileInView` with `viewport={{ once: true }}` — they stay at `opacity:0` unless actually scrolled into view.

**Workaround that works:** temporarily set the hero section `minHeight` from `"100vh"` to `"auto"`, then capture a tall viewport (`[1280, 3000]` desktop, `[420, 3000]` mobile — 3000 is the tool's max edge). With the hero collapsed, the whole page shrinks so the target section falls inside the 3000px capture and whileInView fires. **Revert `minHeight` back to `"100vh"` afterward.**

**Why:** coupling of CSS `vh` to the tool's viewport height makes any single top-anchored capture stop exactly at the hero; collapsing the hero is the only reliable way to bring lower sections into frame.

**How to apply:** edit `artifacts/growitbuddy/src/pages/Home.tsx` hero `minHeight` (around the `ref={heroRef}` section), screenshot, then restore. On mobile widths the page is much taller (stats + problem cards stack), so even 3000px may only reach the first card row — that's enough to confirm card layout.

## Deep sections (past 3000px even after hero collapse) — pin-to-top trick

For a section many blocks down (e.g. Home §7 "BUILT FOR" is the 7th `<section>`, ~4000px+ down), collapsing the hero is not enough — the intervening sections still push it past the 3000px max. Instead, temporarily pin **the target section itself** to the top of the viewport:

- Add to that section's inline `style`: `position:"fixed", top:0, left:0, right:0, zIndex:9999, maxHeight:"100vh", overflowY:"auto"` and drop its top padding (e.g. `100px`→`32px`) so the heading + first card row fit.
- Screenshot `/` at `[1280, ~1250]` (100vh now equals the viewport height, so the fixed section fills it; whileInView fires because the section is in view).
- **Revert every temporary style change afterward** — restore original padding and remove the fixed positioning.

**Why:** `position:fixed` decouples the section from document flow so its scroll position no longer matters; this reliably frames any section regardless of how deep it is, and is cleaner than hiding 5+ sections individually.

## Capturing the shared FOOTER (two stacked vh spacers)

The footer is the worst case because TWO `vh`-scaled spacers push it below any single top-anchored capture (raising the viewport height also raises the spacers):
1. `components/layout/Layout.tsx` outer div `min-h-[100dvh]` + `<main className="flex-1">` — pins the footer to the bottom of the viewport.
2. The page rendered inside ALSO has its own `minHeight: "100vh"` (most public pages do).

**Workaround:** temporarily set BOTH to collapse, then capture a short page so the footer rises into frame:
- Layout outer: `min-h-[100dvh]` → `min-h-0`.
- The target page's root `minHeight: "100vh"` → `"auto"` (e.g. `/verify` = `pages/Verify.tsx`).
- Screenshot a content-light page (`/verify`) at `[1440, ~1200]` desktop / `[402, ~1500]` mobile.
- **Revert both** afterward.

