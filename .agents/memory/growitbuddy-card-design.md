---
name: GrowitBuddy home Services card design
description: Settled visual direction for the home "Services" cards and the full list of what the user rejected getting there.
---

# Home "Services" cards — settled design

The 6 home Services cards (section "Everything you need to build authority and generate inbound demand", in `artifacts/growitbuddy/src/pages/Home.tsx`) are **image-forward**, Apple product-grid style: a full-bleed high-quality product image on top, text block beneath.

- Card surface: white, rounded ~24, very light border (`rgba(15,23,42,0.06)`), soft diffuse shadow, `overflow: hidden`. No `CardGrain`/`getWashCardStyle` for these cards.
- Image: full-width `aspectRatio 4/3`, `objectFit: cover`, placeholder bg `#F5F3EE`, `loading="lazy"` + `decoding="async"`. Images are positional in a `SERVICE_IMAGES[]` array (services data has no image field), mapped by card order.
- Imagery style: cohesive premium 3D renders, single hero object, **champagne gold + deep navy-slate on warm ivory cream** — matches brand palette, NOT rainbow. See `growitbuddy-image-gen.md` for how they're generated (hex-codes-as-text gotcha, no faces/eyes, WebP compression).
- Text block: small gold (`#C2A878`) number eyebrow, bold dark title, gray description, dark `Explore Service →` link with per-card `aria-label`.

## Hard rules (each came from an explicit rejection — do not relitigate)
- **NO rainbow / per-card multi-hue colour accents.** Imagery stays in the gold+navy+cream brand palette.
- **NO faces, eyes, or decorative blobs/watermarks.** The user reads any face or faint paired shape as "eyes" / confusing. (AI concept = abstract orb, not a robot face.)
- **Soft, not harsh.** Gentle diffuse shadows, light borders.
- Keep the shared `WashCard` helpers (`getWashCardStyle`, `getWashBorder`, `CardGrain`, `WashIconChip`) intact — OTHER Home sections (e.g. "Who we work with") still use them; only the Services cards opt out.

## Rejection history (why the rules exist)
The user (non-technical, Hinglish, low patience for design churn) churned through many directions:
1. Gold/champagne full-card washes — rejected.
2. Full-card colourful pastel rainbow washes — rejected ("not premium / looks bad").
3. White cards + per-card Apple accent colours on icon chip + link — rejected ("weird/strange colours").
4. Monochrome line-art + faint oversized icon **watermark** in corner — rejected (watermark "looks like eyes").
5. Monochrome soft line-art, watermark removed, softened — initially approved, then later rejected as **"too simple."**
6. **CURRENT:** image-forward cards with cohesive premium 3D product images (gold+navy on cream), one per service. Built in dev; NOT yet pushed to live (push is user-gated).

**How to apply:** If asked to "add colour" or "make it pop," do it with restraint within the brand palette and confirm before shipping — this user has rejected off-brand colour repeatedly. Never add background decoration, faces, or eye-like shapes. If another rejection lands, escalate to a DESIGN subagent / Canvas options instead of more blind tweaks.
