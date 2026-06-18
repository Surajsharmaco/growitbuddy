---
name: GrowitBuddy admin RBAC model
description: How super/member access control is enforced and the invariants to keep consistent
---

# Admin RBAC: backend is authoritative, "super" semantics must match everywhere

The backend (`api-server admin.ts`) is the authoritative gate; the frontend sidebar
and route guard are a DISPLAY mirror only and must never be the sole protection.

**"super" has TWO tiers — keep them distinct (this overrides the older "must be
identical in all 4 spots" rule):**
- **Super-only ROUTES** (team management, page variants admin, optimize lock,
  backup/export) are gated by `superAdminOnly`, which checks `role === "super"`
  ONLY and must NEVER honor the `"all"` permission wildcard. **Why:** team-member
  permission arrays are NOT validated server-side, so a member can be assigned
  `["all"]`; if super-only routes honored `"all"`, that member would escalate to
  full super (manage team, export the entire project). Verified by test: a member
  with `["all"]` gets 403 on `/admin/backup` and `/admin/team`.
- **Content permissions** still treat `role === "super" OR permissions includes
  "all"` as all-access (`isSuperReq` / `hasPermission`, and frontend
  `isSuperAdmin` / `hasPermission`). This is a deliberate convenience for an
  explicitly trusted member and is acceptable for CMS content.

**Residual (known):** because the content gate's super bypass still honors `"all"`,
a member granted `["all"]` can also reach `__super__` content sections
(page_visibility, variants, seo). If that ever matters, the clean fix is to forbid
assigning `"all"` to members (validate team permissions) — do NOT weaken the
route-level role check.

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
