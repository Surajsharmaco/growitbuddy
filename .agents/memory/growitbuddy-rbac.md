---
name: GrowitBuddy admin RBAC model
description: How super/member access control is enforced and the invariants to keep consistent
---

# Admin RBAC: backend is authoritative, "super" semantics must match everywhere

The backend (`api-server admin.ts`) is the authoritative gate; the frontend sidebar
and route guard are a DISPLAY mirror only and must never be the sole protection.

**"super" is defined as `role === "super" OR permissions includes "all"`** and this
definition must be identical in all four places, or a member with `["all"]` ends up
half-super: backend `isSuperReq` + `superAdminOnly`, and frontend `isSuperAdmin` +
`hasPermission`. Keeping only some of them treating `"all"` as super was an actual
inconsistency that had to be fixed.

**Section→permission mapping** (`sectionToPermission`) resolves a CMS content
section key to the permission needed to edit it. Identity for most keys; explicit
overrides exist; and a few keys are super-only via the sentinel `"__super__"`:
page variants (`*__v__*`), SEO records (`seo:*` / `seo-global`), and
`page_visibility`. Team-member permission arrays are NOT validated server-side, so
any section that is super-only in the UI must also map to `"__super__"` server-side
or a crafted permission string could reach it.

**Frontend route guard:** `AdminGuard` derives gating from the exported `NAV_GATING`
map (single source of truth = sidebar navGroups) and renders `<AccessDenied/>`
("Access restricted") when a member lacks the route's permission. It strips the query
string for path lookup, so variant edits (`?variant=`) are gated separately by
checking `window.location.search` and requiring super (wouter's location may omit
the query).

**Deliberately auth-only (not per-section gated):** `POST /upload`, `GET /media`,
`GET /sections` are shared cross-section tools — any authenticated member can use
them. A member gets 400 (not 403) on `/upload` with no file; that means auth passed,
which is intended. The uploaded URL is useless without section-PUT access. Accept
this as a trusted-insider tradeoff; do not "fix" the 400 to a 403.
