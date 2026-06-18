---
name: GrowitBuddy media URLs (split-origin prod)
description: Why every public render of admin-uploaded media must go through resolveMediaUrl
---

# Admin-uploaded media must be wrapped with resolveMediaUrl on every public render

Admin uploads can be stored as **relative** URLs like `/api/media/file/<id>` (the
Cloudinary→DB fallback path used when Cloudinary is unconfigured). In production the
site is split-origin — Vercel SSR serves the frontend, the API runs on a different
Render origin — so a bare `/api/media/...` resolves against the Vercel origin and
404s. `resolveMediaUrl` rewrites only relative `/api/...` values to the API origin
and passes through absolute/protocol-relative/empty values unchanged (idempotent).

**Why:** influencer DPs and other images "worked in dev, broke live" precisely
because dev is same-origin and prod is not. The fix is not a single page — it is a
**bug class** affecting every component that renders admin media.

**How to apply:** any `<img src=...>` / `link.href` / favicon / iframe-thumbnail
that can carry an admin-uploaded URL must be `resolveMediaUrl(...)`-wrapped. Known
render sites span influencer pages, About (founder + team), DistributionNetwork,
Links, Portfolio thumbnails, CaseStudy (client logo / hero / gallery), the public
BlockRenderer (image + gallery blocks), and the App favicon injector. Do NOT wrap
video embed iframes (YouTube/Vimeo embed URLs) — those are already absolute and not
media uploads. When adding any new admin-editable image field, wrap its public
render in the same call or it will silently break on prod only.
