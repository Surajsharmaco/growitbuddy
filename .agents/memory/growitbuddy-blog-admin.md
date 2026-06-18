---
name: GrowitBuddy blog admin robustness
description: Why the blog editor felt flaky (toast storms, posts vanishing/duplicating) and the patterns that fix it.
---

# Blog admin (AdminBlog.tsx) robustness

User perception "blog keeps throwing alerts; posts randomly removed/added" traced to three concrete causes, all now fixed:

- **Toast storm:** "Fix All" buttons applied each SEO fix in a `forEach(applyFix)` loop, and `applyFix` fired one toast each → N alerts at once. Fix: split into `applyFixField` (no toast) + `applyAllFixes` (apply all, then ONE summary toast). **Rule:** any bulk action must emit a single summary toast, never one-per-item.
- **"Posts removed":** soft-delete to Trash had NO confirmation, so a misclick on the trash icon silently moved a post out of the active list. Fix: `confirm()` before trashing. Trash is reversible, but the confirm kills the "it disappeared" perception.
- **"Posts added/duplicated":** `handleSave` had no slug uniqueness check; a duplicate slug duplicated or silently overwrote a post. Fix: normalized (`trim().toLowerCase()`) uniqueness check that throws a clear Error; slug is also normalized at save time; PostEditor's catch surfaces `err.message` so the user sees the real reason.

**Also:** list-level `persist()` calls (delete/restore/permanent-delete) now `.catch()` and alert on backend save failure — previously they were unhandled rejections with no user feedback.

**Why:** the load path was already fail-closed (inits `posts` to `[]`, never demo defaults — see `growitbuddy-ghost-data.md`), so the flakiness was UX/data-integrity in the editor, NOT the ghost-data bug. Don't re-touch the load/seed path looking for this class of issue.
