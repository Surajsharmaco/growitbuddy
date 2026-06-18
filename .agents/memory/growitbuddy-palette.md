---
name: GrowitBuddy color palette & card washes
description: The intentional brand palette and the rule that cards must stay within it (no rainbow tints).
---

# GrowitBuddy palette

Brand is a "Premium Editorial" trio (tokens in `index.css` `:root` as `--gb-*`):
- warm-white background `#F8F8F6`
- navy/slate authority `#1E293B`
- champagne gold accent/highlight `#C2A878`

**Decision / convention:** card surface tints must stay within ONLY those two
accent colors — warm gold (dominant highlight) + soft slate/navy (occasional
accent), on an ivory/cream base.

**Why:** the user explicitly rejected the cards as "rang-birang" (gaudy /
multicolored). The cause was the shared wash system cycling 6 unrelated pastel
hues (sky blue, terracotta, teal, olive, violet, sand). They also did NOT want a
flat all-white/navy look — they wanted a warm highlight. Gold+navy hits both.

**How to apply:** card tint across the whole site comes from the single source
`components/WashCard.tsx` (`WASH_CARD_BACKGROUNDS` / `WASH_CARD_BORDERS`), consumed
by every page via `getWashCardStyle`/`getWash`/`WashIconChip`. To change card
"colorfulness" edit only that file. Do NOT reintroduce off-brand pastels there.
All other gradients in the app already use brand gold `rgba(194,168,120,…)`.
