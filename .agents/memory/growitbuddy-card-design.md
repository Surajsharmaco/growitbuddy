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
  shadow). LIGHT cards = flat warm cream `#FCFAF6` + neutral border
  `rgba(20,32,46,0.10)`; DARK cards = navy `#16202E`. NO colored gradient — the
  owner explicitly rejected a lavender/periwinkle gradient (they called the tint
  "green"); keep light surfaces flat + neutral. Inline style beats any base CSS
  class, so card classes only handle TEXT.
- `getSolidText(dark)` → palette `{title, body, strong, muted, accent}` for
  flipping text on dark cards. `WashIconChip` takes a `dark` prop (works for both
  `icon` and `label` chips). `CardGrain` takes an optional `dark` prop and is
  rendered on BOTH surfaces as `<CardGrain dark={dark} />` — mixBlendMode
  `multiply` on light, `normal` on dark (so the bright grain shows as visible
  texture on navy, matching the "The Problem" cards). Opacity 0.5 both.

**Why:** owner rejected ~8 prior colorful/wash designs; wanted every card solid +
brand-consistent, some dark + some light, on EVERY page. A lavender/periwinkle
gradient on light cards was tried and rejected (owner called the tint "green" and
wanted it removed). Final spec: flat cream light + navy dark, and the SAME film
grain on BOTH surfaces (owner loves the "The Problem" textured dark cards).

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

## Texture (film grain) — light vs dark surfaces

`var(--gb-grain)` (index.css) is a fractalNoise SVG with BOTH a white and a black
noise layer. Apply it two different ways:
- **Light cards:** `<CardGrain/>` component — `mixBlendMode: multiply`, opacity 0.45,
  zIndex -1. Multiply only reads on light backgrounds.
- **Dark cards/sections:** a plain absolute overlay div, `inset:0`,
  `opacity ~0.5`, **NO** mixBlendMode (multiply would vanish on dark) — this lets
  the WHITE noise layer show. Same pattern used by About dark cards, the dark
  sections, and now the Home "Problem" cards.
  Parent needs `position: relative` + `isolation: isolate` so the grain's
  `zIndex:-1` paints above the card background yet below content.

**Why:** owner explicitly wanted the grain texture on EVERY card incl. the dark
"Problem" cards, matching the textured solid cards. CardGrain alone is invisible on
dark, hence the no-multiply overlay variant.

## Leftovers (intentional, non-blocking)

Old exports `getWash`/`getWashBorder`/`getWashCardStyle`/`WASH_CARD_*` remain in
WashCard.tsx but are no longer used by pages. `WashIconChip` still calls
`getWashBorder` internally for the light chip border, so don't delete that one.
Verify "no wash left" with: `rg "getWash\b|getWashBorder|getWashCardStyle|WASH_CARD" src --glob '!**/WashCard.tsx'`.

## Hero / page decoration: "blueprint" guide-lines REJECTED on Home

`BlueprintLines` (`src/components/effects/BlueprintLines.tsx`) draws two thin
vertical hairlines framing the content column + "+" crosshairs + optional diagonal
hatch. The owner saw these in the Home hero and disliked them — said they "look
like a margin" and asked for something else. Removed `<BlueprintLines/>` from the
Home hero (kept GrainOverlay + DotGrid + the mouse-follow radial glow — that clean
look was accepted). 

**Why:** durable taste signal — the owner reads the vertical guide-line/crosshair
motif as an accidental ugly margin, not a premium detail.
**How to apply:** BlueprintLines is STILL used on Services / Framework / Links
(Links uses the same `hatch midCrosses` variant as the removed Home one). If the
owner complains about "lines/margins" on another page, Links is the likeliest
culprit — remove it there next. Don't add new decorative hero effects without
sign-off (8+ prior design rejections).
