---
name: GrowitBuddy public card animation + gradient gotchas
description: Why list cards on public pages (e.g. /distribution) shouldn't use framer-motion enter animations, and the gradient-vs-pill legibility tradeoff.
---

# Public list-card animation + overlay legibility

Two recurring gotchas on public cards fed by `usePublicContent` (distribution
network cards, and similar listing grids):

1. **No framer-motion enter/exit animation on the list items.** `usePublicContent`
   auto-refetches the content (~every 60s) and the list re-renders; if each card is a
   `motion.div` with `initial/animate` (or the grid uses `AnimatePresence`/`layout`),
   the fade/slide REPLAYS on every refetch and on every filter change — the user
   perceives this as a "weird repeated fade". Render list cards as plain `<div>`s.
   **Why:** the animation isn't a one-time mount effect here; the refetch cycle keeps
   remounting/re-animating them. Hero/section one-shot animations are fine.

2. **Don't rely on a dark gradient overlay to make overlaid text readable.** If text
   sits directly on a card image (followers count, country, etc.) it usually depends
   on a `linear-gradient(... rgba(11,11,11,...))` overlay. If the user wants the
   gradient gone / image shown clearly, you must move that text into its own solid
   (or translucent-white + backdrop-blur) **pill** so it stays legible on ANY image —
   light or dark. A solid white pill with bold dark text + a hairline border + drop
   shadow reads on both. Keep the number dark-on-white so the value itself is always
   readable regardless of the photo behind it.

**Verify on prod, not dev:** the dev DB has no `distribution-pages` rows, so
`/distribution` shows "0 pages" locally and the cards can't be screenshotted in dev —
visual confirmation happens on the live (Vercel+Render+Neon) site after the gated push.
