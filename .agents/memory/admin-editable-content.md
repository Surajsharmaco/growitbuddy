---
name: Admin-editable content pattern (growitbuddy)
description: How to make a public page admin-editable in artifacts/growitbuddy
---

# Making a public surface admin-editable

The content backend is generic: API exposes `/content/:section` (GET public,
PUT auth) and `/admin/public/content/:section`, with NO key whitelist. Any new
section key works immediately; no backend change needed.

**Steps to add a new editable surface:**
1. `src/lib/<name>Defaults.ts` — export a typed DEFAULTS const + its type.
   Imported by BOTH the public page and the admin editor.
2. Public page: `usePublicContent<T>("<key>", DEFAULTS)` (hook merges saved over
   defaults).
3. Admin editor in `src/pages/admin/Admin<X>.tsx`: `useAdmin()` →
   `getContent("<key>")` in useEffect (spread over DEFAULTS), `saveContent("<key>", data)`.
   UI from `@/components/admin/AdminField` (PageHeader/Card/SectionTitle/Input/
   Textarea/SaveBar) + `<PageVisibilityCard slug="<slug>" />`.
4. Wire ALL of: `App.tsx` lazy import + admin route + `ALL_SECTIONS` prefetch
   array; `AdminLayout.tsx` navGroups item (permission key); `adminPermissions.ts`
   ALL_PERMISSIONS entry.

**Page visibility gotcha:** PageVisibilityCard (slug-based) only takes effect if
the PUBLIC route is wrapped in `<PageGate slug="<slug>">`. Adding the card to the
admin editor without gating the public route is a silent no-op. The slug used in
PageGate must match the slug in PageVisibilityCard.

**super admin** (role==="super") sees all nav regardless of permission.
