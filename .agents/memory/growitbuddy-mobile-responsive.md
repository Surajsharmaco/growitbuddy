---
name: GrowitBuddy mobile responsiveness & admin layout
description: How horizontal overflow surfaces here, the inline-grid convention, the admin sidebar's mobile behavior, and why live admin audits are blocked in dev.
---

## Horizontal overflow is MASKED, not visible
`html, body { overflow-x: hidden }` is set globally (index.css). A too-wide element produces NO scrollbar — it shows as CLIPPED / cut-off cards or an asymmetric right gutter. When auditing overflow, look for clipped content (and measure element rects); do not wait for a scrollbar to appear.

## Inline-grid convention
Public pages use inline `display:grid; gridTemplateColumns: repeat(auto-fit|auto-fill, minmax(min(100%, Npx), 1fr))`. The `min(100%, Npx)` guard is REQUIRED — a bare `minmax(Npx, 1fr)` overflows containers narrower than Npx.
**Why:** empirically the bare form did NOT clip at 320–400px (auto-fit collapses + the overflow mask above hides it), so it's easy to miss — but it's a latent bug below ~Npx (foldables/zoom).
**How to apply:** keep ALL inline public grids using the `min(100%, N)` guard for consistency; a clean browser audit does not prove a bare grid is safe.

## Admin layout has NO mobile drawer
`components/admin/AdminLayout.tsx` is a flex shell: fixed-width `<aside>` (w-56 expanded / w-14 collapsed, `shrink-0`) + `<main flex-1>`. There is no off-canvas drawer. It now defaults `collapsed` to true when `window.innerWidth < 768` (icon-only sidebar → ~296px content on a 400px phone). Desktop (>=768) is unchanged; admin can still toggle.
**How to apply:** a real off-canvas drawer is the future upgrade if richer mobile admin is wanted; the current fix only makes content usable, not spacious.

## Live admin audit is blocked in dev
Super-admin login = `POST /admin/login` comparing a single `{password}` to `process.env.ADMIN_PASSWORD` (returns 500 if unset). `ADMIN_PASSWORD` is a sensitive secret and is NOT in the Replit dev environment (prod env lives in Render), so a browser-driven admin audit can't run in dev without setting it.
**How to apply:** per the environment-secrets skill, request it via `requestEnvVar` (never set a password directly with setEnvVars). Otherwise audit admin at the code level.
