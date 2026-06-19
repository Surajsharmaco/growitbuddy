---
name: GrowitBuddy social icons (header + footer)
description: Shared SocialLinks component, its single source of truth, the empty-string fallback decision, and placement gates.
---

# Social icons in header + footer

A shared `SocialLinks` component (`components/layout/SocialLinks.tsx`) renders the brand's monochrome Instagram/LinkedIn/X/YouTube inline-SVG icons (currentColor, `variant` dark/light) in BOTH the public Navbar and Footer.

**Single source of truth:** URLs are admin-editable and live in the **"footer" content section** (Admin → Footer) — the navbar reads `usePublicContent("footer", ...)` too, NOT its own section. Default URLs are seeded in `footerDefaults.ts` from `lib/seo` `BRAND.sameAs` (the canonical social-profile list); keep those two in lockstep. The footer model also gained a `youtube` field.

**Empty-string fallback (deliberate):** `usePublicContent` merges `{...defaults, ...db}`, so a blank social string saved in the DB (prod footer records often carry "") would otherwise blank an icon. The component uses `url = (data[key]||"").trim() || FOOTER_DEFAULTS[key]`.
**Why:** the requirement is "icons must always show"; this guarantees they render on dev AND prod even with stale blank DB values.
**Tradeoff / how to apply:** clearing one URL in admin will NOT hide that single platform — it reverts to the brand default. If "hide a platform" is ever wanted, replace the fallback with an explicit per-platform toggle/empty model.

**Header placement:** desktop icons gated `hidden xl:flex` (≥1280) to dodge the documented lg–xl navbar overflow band; below xl the icons appear in the mobile fullscreen menu's bottom "Get in touch" block.

**Footer placement:** icons sit in the bottom legal bar, grouped just before Verify Certificate / Privacy / Terms (flexWrap for mobile). The old text-based brand-column social links were removed.

**Touch targets:** each anchor has invisible `padding:8` (icon + 16 ≈ 32–36px hit area) with the flex container `gap` reduced by `2*pad` so visual spacing equals the requested `gap`.

**Prod/SSR caveat:** the footer is server-rendered by the prebuilt `api/render.js`; new icons appear only after client hydration until that bundle is rebuilt at the next deploy (not deploying = dev-only).
