---
name: GrowitBuddy admin↔public field audit
description: How to safely decide which admin-editable fields/sections are truly orphaned (not on the public site) before removing them.
---

# Auditing admin-editable content vs public site

GrowitBuddy's per-page admin editors write a content blob (one type per page,
e.g. HomeData) that the matching public page reads. Admin tends to drift ahead of
the public page, accumulating sections/fields the public page never renders — so
admin can edit data that surfaces nowhere.

**Rule:** never trust a summarized/automated audit to decide what is orphaned.
Confirm each candidate field key has zero references in the public page AND
nowhere else in the app before removing it.

**Why:** an explore-subagent audit here produced false positives — it flagged
genuinely-live items as orphaned (data fetched at runtime, or rendered under a
differently-named variable than the admin key). Grep per key is the only
reliable check.

**How to apply:**
- Removing only the admin editor UI for an orphaned section (and leaving the
  unused type/default fields) is sufficient and lower-risk than also editing the
  shared content type; leftover fields are harmless dead data.
- Deleting a section can orphan an import — drop it so the typecheck stays clean.
- The web typecheck is the gate to trust; the api-server has pre-existing,
  unrelated type errors that are not a signal for this kind of change.
