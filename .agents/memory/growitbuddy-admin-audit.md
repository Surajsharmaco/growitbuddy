---
name: GrowitBuddy admin↔public field audit
description: How to safely decide which admin-editable fields/sections are orphaned (not on the public site) before removing them.
---

# Auditing admin-editable content vs public site

GrowitBuddy's admin (artifacts/growitbuddy/src/pages/admin/Admin*.tsx) edits a
content blob per page (e.g. HomeData in src/lib/homeDefaults.ts) that the public
page (e.g. src/pages/Home.tsx) reads. Over time admin grew sections/fields the
public page never renders, so admin can edit data that shows nowhere.

**Rule:** before removing any admin section/field as "orphaned," verify the exact
field key has 0 references in the public page AND no other src file references it.
Use `rg -c "<fieldKey>" pages/<Public>.tsx` and a project-wide `rg -ln`.

**Why:** an automated explore-subagent audit produced FALSE POSITIVES here —
it flagged live items (Influencers via useLiveInfluencers, About founder
socials, Home `ecosystem` rendered 4x) as orphaned. Do not trust a summarized
audit; grep each candidate key yourself.

**How to apply:**
- Confirmed orphaned on Home and removed from AdminHome editor JSX:
  Solution/Comparison, Process, Authority Audit Promo, Founder sections.
- Confirmed LIVE (keep): Hero, Stats, Problem, Services, Framework, Proof,
  Ecosystem, Testimonials, Final CTA.
- Removing only the admin editor JSX (not the HomeData type/defaults) is enough
  to satisfy "remove admin items not on the public site" and is lower risk —
  leftover type fields are harmless dead data. Removing a section may leave an
  import dead (e.g. ImagePickerField); drop it to keep typecheck clean.
- Verify with `pnpm --filter @workspace/growitbuddy run typecheck` (exit 0).
  api-server has PRE-EXISTING unrelated typecheck errors — ignore them.
