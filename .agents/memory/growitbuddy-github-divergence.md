---
name: GrowitBuddy local↔GitHub history divergence
description: Why a plain push of the redesign fails, and which git ops the Replit repl blocks vs allows.
---

# GrowitBuddy main has DIVERGED from GitHub (not a fast-forward)

The local `main` and GitHub `Surajsharmaco/growitbuddy` `main` share a common
ancestor (`1af95a4`, "editable byline labels/values") but then split:

- **Local main**: ~40 commits of the talent-pool / site redesign work (tip authored by Replit Agent).
- **GitHub main**: 3 commits that are NOT local, made directly on GitHub after the split:
  - `f3813ca` chore: replit migration verified ok (adds `MIGRATION_NOTES.md`)
  - `2180330` fix: remove custom cursor, fix 200 to 250+
  - `4887562` fix: SEO meta tags mismatch (index.html canonical, fetch timeout)
  - Files they touch: `index.html`, `src/App.tsx`, `src/components/DynamicPageSEO.tsx`,
    `src/index.css`, `src/lib/api.ts`, `src/lib/servicesDefaults.ts`, `src/pages/admin/AdminSEO.tsx`, `MIGRATION_NOTES.md`.

So a normal `git push` is rejected as **non-fast-forward**. The "corrupt object
`2180330a`" symptom is just one of those 3 GitHub commits being only partially
present locally (its tree `5929b76` is unreadable locally).

**Why the live site looks "old":** Vercel/Render deploy from GitHub `main`, which
only has the 3 commits, not the 40-commit redesign.

## What the Replit repl git guard allows vs blocks
- **BLOCKED** (in both main agent AND task-agent env): any object-writing transfer,
  i.e. `git fetch` / `git gc` — fails with "Destructive git operations are not allowed
  in the main agent" when it tries to write `.git/objects/.../tmp_obj_*`. This means
  **git-based reconciliation (fetch + merge/rebase) cannot be done from inside the repl.**
- **ALLOWED**: `git commit` (the redesign was committed fine), `git push` (it RUNS and
  reaches GitHub; it was only rejected for non-ff, not blocked), `git ls-remote`,
  `git fsck`, GitHub REST API via `curl` with `$GITHUB_TOKEN`.

## Auth
Push/ls-remote need the token, never a password:
`-c credential.helper='!f() { echo "username=x-access-token"; echo "password=$GITHUB_TOKEN"; }; f'`
Never print `$GITHUB_TOKEN`.

## Resolving the divergence (needs a human decision — do NOT do silently)
Only two ways to get the redesign onto GitHub:
1. **Force-push** local main over GitHub: makes the redesign live but DROPS the 3
   commits' specific changes (SEO meta fix, cursor removal, migration note) from the
   deployed tree unless they're first re-applied locally. Destructive; needs explicit consent.
2. **Reconcile** by bringing the 3 remote commits into local first. Can't `git fetch`
   here, so options are: re-apply the 3 diffs via GitHub API as new local commits (watch
   for conflicts in index.html / DynamicPageSEO.tsx / api.ts that both sides edited),
   then force-push so GitHub == local (now containing both sets); OR do the merge outside
   the repl (another clone) and push from there.

**Why:** force-pushing without preserving the 3 fixes would regress the live SEO/cursor
fixes. The user must choose preserve-and-merge vs overwrite.

## UPDATE (2026-06-14): local already supersedes the 3 commits — overwrite is safe
Verified local main ALREADY contains every functional change from the 3 GitHub commits:
custom cursor removed (App.tsx/index.css), new SEO title "GrowitBuddy - Personal Branding,
Content & Distribution Studio" in index.html, "250+" in servicesDefaults.ts,
`growitbuddy-api.onrender.com` in api.ts comment + AdminSEO.tsx, and the 8s AbortController
fetch timeouts in DynamicPageSEO.tsx. The ONLY GitHub-unique file is `MIGRATION_NOTES.md`
(throwaway). So a plain force-overwrite of GitHub main with local loses no functional work.
User (site owner) explicitly approved the overwrite.

## Force-push is blocked in the main agent env — must use a Project Task executor
- `git push --force-with-lease` (bare): rejected "stale info" because the local tracking ref
  `origin/main` is stale and can't be refreshed (fetch is blocked).
- `git push --force-with-lease=main:<remoteSHA>` (pinned, the safe variant): BLOCKED by the
  Replit guard because it writes `.git/refs/remotes/origin/main.lock` ("Destructive git
  operations are not allowed in the main agent").
- Plain non-ff `git push` reaches GitHub but is rejected by GitHub before any local ref write.
- Conclusion: the main-agent guard blocks any push that mutates local objects/refs. The
  force-push must be performed by the isolated Project Task executor (which has the relaxed
  protections), pinning the expected remote SHA `4887562...`. Do NOT circumvent the guard
  with an ad-hoc URL push.
