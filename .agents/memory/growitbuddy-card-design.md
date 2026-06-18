---
name: GrowitBuddy home Services card design
description: The ONLY approved Services-card design + the long list of rejected variants. Read before touching these cards — the user has rejected ~8 redesigns.
---

# Home "Services" cards — the only approved design

The 6 home Services cards (section "Everything you need to build authority and generate inbound demand", in `artifacts/growitbuddy/src/pages/Home.tsx`) have exactly ONE design the user has ever accepted, and it is the one currently **live** (origin/main): **white cards, a monochrome line-art Lucide icon at top** (per-card, mapped by order: Search, Calendar, ScanLine, Send, Bot, Box), then number (`01-06`), bold title, gray desc, `Explore Service →`. Styled with the shared `WashCard` helpers so it matches the navy/gold/cream brand theme. NO photographic/3D images.

**Why this matters:** the user (non-technical, Hinglish, very low patience) calls these line-art icons "the images" and calls this the "cards that were originally in my website according to my theme." Every time a redesign is rejected, "put back the original cards" = restore THIS live line-art design.

## Restoring it cleanly
The dev `Home.tsx` typically diverges from the live version ONLY in the service-card region (the icon/image imports, the `SERVICE_ICONS`/`SERVICE_IMAGES` constant, and the card JSX map ~L380-490). So overwriting the **entire** working-tree `Home.tsx` with the live version's content (`git show <live-ref>:artifacts/growitbuddy/src/pages/Home.tsx` then `cp` over the file) reverts only the cards and nothing else. Verify with: `rg 'cut\.webp|SERVICE_IMAGES'` returns nothing, then typecheck. (Other dev commits touch admin/backup/Links etc. — do NOT revert those; only the service-card region of Home.tsx.)

## Hard rules (each from an explicit rejection — do not relitigate)
- **DO NOT add 3D/photographic/product images to these cards.** Every image-forward variant has been rejected as "गंदा / cheap / ugly" — including one that matched a reference screenshot the USER supplied. Keep the line-art icons.
- **NO rainbow / per-card multi-hue colour accents.** Stay in the gold+navy+cream brand palette.
- **NO faces, eyes, or decorative blobs/watermarks** (user reads faint paired shapes as "eyes").
- **Soft, not harsh.** Gentle diffuse shadows, light borders.
- Keep the shared `WashCard` helpers intact — other Home sections (e.g. "Who we work with") use them.
- After ANY further rejection: STOP blind-tweaking. Restore the live line-art design and escalate to Canvas/DESIGN-subagent options for sign-off BEFORE building anything new.

## Rejection history (why the rules exist)
1. Gold/champagne full-card washes — rejected.
2. Full-card colourful pastel rainbow washes — rejected ("not premium").
3. White cards + per-card Apple accent colours — rejected ("weird colours").
4. Monochrome line-art + faint oversized icon watermark — rejected (watermark "looks like eyes").
5. **Monochrome soft line-art, watermark removed (= the LIVE design) — APPROVED.** Later once called "too simple," which kicked off the image experiments below — all of which were rejected, and the user returned to wanting THIS.
6. Image-forward, image on TOP, text below — rejected ("गंदा").
7. Name+desc top, full-width image at BOTTOM on a beige block — rejected ("cheap/ugly").
8. Text LEFT, floating transparent 3D image RIGHT, orange number (matched user's own ChatGPT reference screenshot) — rejected ("बहुत गंदे").
9. Reverted to #5 (live line-art) at the user's request — current state.

**How to apply:** treat #5 (live line-art) as the safe home base. If asked to change these cards, propose visually (Canvas/mockup) and get explicit sign-off first; never silently swap in images again.
