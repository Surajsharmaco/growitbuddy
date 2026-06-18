---
name: GrowitBuddy home Services card design
description: Settled visual direction for the home "Services" cards and the full list of what the user rejected getting there.
---

# Home "Services" cards — settled design (live)

The 6 home Services cards (section "Everything you need to build authority and generate inbound demand", in `artifacts/growitbuddy/src/pages/Home.tsx`) are **clean, monochrome, soft line-art** — Apple-like restraint, NO colour.

- Card surface: white with a very subtle vertical gradient (`#FFFFFF`→`#FAFAFB`), rounded ~24, **very light** border (`rgba(15,23,42,0.05)`), and a **soft diffuse** shadow (large blur, low opacity). Nothing hard-edged or high-contrast. No `CardGrain`/`getWashCardStyle` for these cards.
- Icon: a single clean lucide **line-art glyph** (~38px, strokeWidth ~1.5, near-black slate `#2A2E35`). NO coloured chip behind it.
- Then: small gray number, bold dark title, gray description, dark `Explore Service →` link. All monochrome.

## Hard rules (each came from an explicit rejection — do not relitigate)
- **NO rainbow / per-card colour accents.** No multi-hue icon chips or coloured links.
- **NO decorative blobs, watermarks, or oversized faded background shapes.** The user reads any faint shape as "eyes" / confusing. Keep cards literally just icon + text.
- **Soft, not harsh.** Gentle diffuse shadows, light borders, softened text contrast — the user asked to "add blur so things don't look too hard."
- Keep the shared `WashCard` helpers (`getWashCardStyle`, `getWashBorder`, `CardGrain`, `WashIconChip`) intact — OTHER Home sections still use them; only the Services card opts out.

## Rejection history (why the rules exist)
The user (non-technical, Hinglish, low patience for design churn) rejected **five** prior directions before approving:
1. Gold/champagne full-card washes — rejected.
2. Full-card colourful pastel rainbow washes — rejected ("not premium / looks bad").
3. White cards + per-card Apple accent colours (blue/orange/teal/green/purple/pink on icon chip + link) — rejected ("weird/strange colours"). *(This file previously, wrongly, recorded #3 as the settled state — it is NOT.)*
4. Monochrome line-art + faint oversized icon **watermark** in the corner — rejected (watermark "looks like eyes", confusing).
5. **APPROVED & pushed live:** monochrome line-art, watermark removed, softened (diffuse shadow, light border, soft bg).

**How to apply:** If asked to "add colour" or "make it pop," do it with extreme restraint (e.g. one consistent subtle accent at most) and confirm before shipping — this user has rejected colour repeatedly. Never add background decoration. When unsure after one more rejection, escalate to a DESIGN subagent / Canvas options instead of more blind tweaks.
