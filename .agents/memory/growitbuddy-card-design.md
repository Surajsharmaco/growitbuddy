---
name: GrowitBuddy home Services card design
description: Settled visual direction for the home "Services" cards and the full list of what the user rejected getting there.
---

# Home "Services" cards — settled design

The 6 home Services cards (section "Everything you need to build authority and generate inbound demand", in `artifacts/growitbuddy/src/pages/Home.tsx`) are a **horizontal split**: service **text on the LEFT** and a **floating transparent 3D product image on the RIGHT** (matching a user-supplied ChatGPT reference). This replaced an earlier "name+desc on top, full-width image at bottom on a beige block" layout the user called cheap.

- Card surface: white, rounded ~20, very light border (`rgba(15,23,42,0.07)`), soft diffuse shadow, `overflow: hidden`, `minHeight: 234`. No `CardGrain`/`getWashCardStyle` for these cards.
- Layout = flex row, two columns (NOT absolute positioning — absolute overlapped text when admin text got long):
  - Text col: `flex: "1 1 0%"`, `minWidth: 0` (lets text shrink/wrap, prevents overlap). Contains `{s.num}` **orange** eyebrow (`#E1562A`), bold title (`#15171A`), desc **clamped to 4 lines** (`#6A6F77`), `Explore Service →` (dark, `marginTop:auto` pins it to bottom).
  - Image col: `flex: "0 0 42%"`, flex-centered, `pointerEvents: none`. `<img objectFit:contain>` with `maxHeight:"74%"` and a grounding `filter: drop-shadow(...)` so the object FLOATS (no background block). Verified no overlap at desktop 3-col, tablet 2-col, and mobile 1-col.
- Images: positional in `SERVICE_IMAGES[]` (services data has no image field), mapped by card order. Source files are the **`*-cut.webp`** transparent cutouts in `attached_assets/generated_images/` — made by `remove_image_background_tool` on the original `svc-*.webp` renders, then `sharp().trim()` to crop transparent margins (consistent framing), then webp (q86, ~18-35KB). Imports in Home.tsx point at the `-cut.webp` names.
- Imagery style: cohesive premium 3D renders, single hero object, **champagne gold + deep navy-slate** (originals were on warm ivory cream, now removed). AI card = gold atom orb (kept deliberately instead of the reference's robot, to respect the no-faces/eyes rule). Personal-branding card = abstract person-silhouette icon (acceptable; not a realistic face).

## Hard rules (each came from an explicit rejection — do not relitigate)
- **NO rainbow / per-card multi-hue colour accents.** Imagery stays in the gold+navy palette. (Orange is used ONLY for the small `01-06` number, per the reference.)
- **NO faces, eyes, or decorative blobs/watermarks.** The user reads any face or faint paired shape as "eyes" / confusing. (AI concept = abstract orb, not a robot face — even though the reference screenshot showed a robot.)
- **Soft, not harsh.** Gentle diffuse shadows, light borders.
- Keep the shared `WashCard` helpers (`getWashCardStyle`, `getWashBorder`, `CardGrain`, `WashIconChip`) intact — OTHER Home sections (e.g. "Who we work with") still use them; only the Services cards opt out.

## Rejection history (why the rules exist)
The user (non-technical, Hinglish, low patience for design churn) churned through many directions:
1. Gold/champagne full-card washes — rejected.
2. Full-card colourful pastel rainbow washes — rejected ("not premium / looks bad").
3. White cards + per-card Apple accent colours on icon chip + link — rejected ("weird/strange colours").
4. Monochrome line-art + faint oversized icon **watermark** in corner — rejected (watermark "looks like eyes").
5. Monochrome soft line-art, watermark removed, softened — initially approved, then later rejected as **"too simple."**
6. Image-forward but with **image on TOP, text below** — rejected ("गंदा").
7. Name + desc on top, **full-width product image at the bottom** on a `#DED5C6` beige block (`objectFit:cover`) — rejected as **"cheap/ugly"** (the beige crop is what looked bad).
8. **CURRENT:** text LEFT, floating **transparent** cutout image RIGHT, orange `01-06` number, white card, bottom-center black pill "Get your growth breakdown →". Matches the user's ChatGPT reference screenshot. Built in dev; NOT yet pushed to live (push is user-gated).

**How to apply:** If asked to "add colour" or "make it pop," do it with restraint within the brand palette and confirm before shipping — this user has rejected off-brand colour repeatedly. Never add background decoration, faces, or eye-like shapes. If another rejection lands, escalate to a DESIGN subagent / Canvas options instead of more blind tweaks.
