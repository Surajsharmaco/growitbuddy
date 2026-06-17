---
name: GrowitBuddy local↔GitHub history — reconciled
description: How the unrelated local vs GitHub histories were finally joined, and the deploy flow.
---

# RESOLVED (2026-06-17): local main reconciled with GitHub via merge

At reconciliation time local `main` and GitHub `Surajsharmaco/growitbuddy` `main`
had NO common ancestor (empty merge-base) — local had been re-synced from files,
not cloned, so histories were unrelated. The Replit Git panel merged origin/main
into local with `--allow-unrelated-histories`, producing 7 conflicts (resolved
taking origin/main versions: homeDefaults.ts, mockup-sandbox vite.config/tsconfig/
index.css, growitbuddy artifact.toml, opengraph.jpg, pnpm-lock.yaml).

The merge was then COMPLETED in-repl via the workflow trick — `git commit` was
blocked in the agent and the panel was stuck on a stale `.git/index.lock`. See
[Running git ops the main-agent blocks](replit-git-blocked-ops-workflow.md).
Afterward local main is `ahead N, behind 0` of origin/main, so a normal Git-panel
Push fast-forwards GitHub. The leftover `.migration-backup/` duplicate dir (538
tracked files; also spawned failing duplicate workflows that can't be deleted while
its artifact.toml exists) was removed in the same pass.

**Deploy flow:** Vercel (frontend) + Render (backend) auto-deploy from GitHub
`main`. Replit is dev-only. Neon DB shared between dev and live.

**Push:** only via the Replit Git panel Push button (CLI has no GitHub creds).
