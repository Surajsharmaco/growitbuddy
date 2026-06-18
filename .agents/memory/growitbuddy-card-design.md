---
name: GrowitBuddy home Services card design
description: Settled visual direction for the home "Services" cards and what the user rejected getting there.
---

# Home "Services" cards — settled design

The 6 home Services cards (section "Everything you need to build authority and generate inbound demand", in `artifacts/growitbuddy/src/pages/Home.tsx`) use a **clean white surface** with color applied only as a **tasteful Apple-style accent**, never as a full-card wash.

- Card surface: white, rounded corners, subtle border + soft shadow. No `CardGrain`, no `getWashCardStyle` for these cards.
- Color comes from a per-card accent only: a soft tinted icon chip + the colored icon glyph + the "Explore Service" link. Palette by card index: blue, orange, teal, green, purple, pink.
- Link text uses a **darker, WCAG-AA-safe** shade of each hue (icon stays the brighter shade).

**Why:** The user (non-technical, Hinglish) iterated 3 times: (1) gold/champagne washes, (2) full-card colorful pastel rainbow washes — **explicitly rejected as "not premium / looks bad"**, (3) approved = white cards with tasteful accents, referencing how Apple's product grid uses color sparingly. Do NOT reintroduce full-card colorful gradient washes here.

**How to apply:** Keep the shared `WashCard` helpers (`getWashCardStyle`, `getWashBorder`, `CardGrain`, `WashIconChip`) intact — other Home sections still use them; only the Services card opts out. If asked to "add color," add it as an accent (icon/link/small chip), not a card-wide tint.
