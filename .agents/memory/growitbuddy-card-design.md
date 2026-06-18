---
name: GrowitBuddy solid card system
description: How the brand "solid card" system replaced the watercolor wash across all public pages, and the per-page conversion patterns.
---

# GrowitBuddy solid card system

The public site moved OFF the old "watercolor wash" cards to a SOLID brand-card
system. Single source: `src/components/WashCard.tsx`.

- `solidIsDark(i)` → `(i % 3) === 2` (every 3rd card dark). This is the
  "kuch dark kuch normal" rhythm the (frustrated, non-technical) owner asked for.
- `getSolidCardStyle(dark, overrides)` owns the card SURFACE inline (bg/border/
  shadow) — light cream `#FCFAF6` or dark navy `#16202E`. Inline style beats any
  base CSS class, so card classes only need to handle TEXT.
- `getSolidText(dark)` → palette `{title, body, strong, muted, accent}` for
  flipping text on dark cards. `WashIconChip` takes a `dark` prop (works for both
  `icon` and `label` chips). Render `{!dark && <CardGrain/>}` (grain only on light).

**Why:** owner rejected ~8 prior colorful/wash designs; wanted every card solid +
brand-consistent (navy/gold/cream), some dark + some light, on EVERY page.

## Per-page conversion patterns (two kinds)

1. **Inline-styled cards** (Home sections, About Values): just swap the inline
   text colors to `getSolidText(dark)` values. Easiest.
2. **CSS-class-styled cards** (Services `.svc-bento-*`, TalentPool `.tp-step-*`/
   `.tp-res-*` — classes live in each page's `<style>` block, NOT index.css): add
   an `is-dark` className modifier on dark cards and add `.<card>.is-dark .<child>`
   override rules. Two-class selectors beat the single-class base rules (and must
   also override `:hover` rules, e.g. `.tp-res-card.is-dark:hover .tp-res-btn`).
   Any inline-styled child (e.g. the "Soon" pill) must be made dark-aware inline.

`TalentPoolPage.tsx` is shared by all 10 talent-pool routes (WritersPool,
DesignersPool, EditorsPool, etc.), so converting it covers every pool page.

## Deliberate exception: Resources

`Resources.tsx` FeaturedCard/ResourceCard kept **light-only** solid
(`getWash`→`SOLID_LIGHT_BG`, border→literal light). They are deeply nested with
many hardcoded dark-text children (badges, CtaRow, type icons, gated/lock states);
a dark variant would need a palette prop threaded end-to-end — too risky for a
visual-only pass. Light-solid still satisfies "no wash"; site-wide dark rhythm
comes from Home/Services/About/TalentPool.

## Leftovers (intentional, non-blocking)

Old exports `getWash`/`getWashBorder`/`getWashCardStyle`/`WASH_CARD_*` remain in
WashCard.tsx but are no longer used by pages. `WashIconChip` still calls
`getWashBorder` internally for the light chip border, so don't delete that one.
Verify "no wash left" with: `rg "getWash\b|getWashBorder|getWashCardStyle|WASH_CARD" src --glob '!**/WashCard.tsx'`.
