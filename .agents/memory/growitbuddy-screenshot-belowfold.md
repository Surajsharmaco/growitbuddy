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
