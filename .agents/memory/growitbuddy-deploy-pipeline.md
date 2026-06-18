---
name: GrowitBuddy live-update pipeline (Replit → GitHub → Vercel)
description: Real root cause of live-site staleness (failing Vercel build from an outdated pnpm lockfile), the fix, and how to diagnose fast.
---

# GrowitBuddy live-update pipeline

Live `growitbuddy.com` = Vercel (frontend) + Render (backend) on a prod DB.
Replit is dev-only. Repo github.com/Surajsharmaco/growitbuddy, production branch `main`.
NOTE: the dev repl DB is SEPARATE from (and empty vs) the prod DB — NOT shared. See
growitbuddy-content-vs-code.md; live content rows exist only in prod, not in this repl.

**Replit → GitHub (proven):** commits auto-push from Replit via `GITHUB_TOKEN` + a workflow
credential helper (see replit-git-blocked-ops-workflow.md). Pushes confirmed on `origin/main`.

**GitHub → Vercel — REAL root cause (confirmed; earlier guesses were WRONG):** Vercel DOES
auto-build every push. The live site froze because every build **FAILED** at `pnpm install`
with `ERR_PNPM_OUTDATED_LOCKFILE` — `pnpm-lock.yaml` was stale vs root `package.json`
(prettier/typescript specifiers bumped in the manifest but not re-locked). Vercel CI uses
`--frozen-lockfile`, which refuses to reconcile and exits 1. A failing build keeps production
serving the last good deploy, so the bundle hash stays frozen — this LOOKS identical to
"Vercel not deploying," but it is not. The discarded theories (auto-deploy paused /
ignored-build-step / domain pinned to an old deploy) were all wrong.

**BUT auto-deploy is also FLAKY (later finding, nuances the above):** a push can simply NOT be
picked up — GitHub shows 0 Vercel deployments AND 0 commit statuses for that SHA, no build ever
starts (distinct from a build that starts and fails). Observed once: a real-change push sat ~20 min
with no deployment; an **empty "retrigger" commit** (`git commit --allow-empty -m "chore: retrigger
Vercel"`) pushed right after was built within ~30s and the live bundle hash changed. The repo
owner's history has prior `"...to retrigger Vercel"` commits for the same reason. So both happen:
most pushes auto-build, but occasionally the GitHub→Vercel webhook misses one. Confirm a build was
even triggered before assuming a build *failure*: GitHub API
`/repos/<owner>/<repo>/commits/<sha>/statuses` (and `/deployments?sha=<sha>`) — empty list = skipped
trigger (retrigger), non-empty = it ran (then check the build log/lockfile).

**Fix:** run `pnpm install` at repo root after ANY dependency version change, commit the updated
`pnpm-lock.yaml`. Verify locally with `pnpm install --frozen-lockfile` (must exit 0 / "Lockfile is
up to date") — that reproduces exactly the Vercel step that was failing. After the lockfile-sync
push, the live `/assets/index-*.js` hash changed = build succeeded = full pipeline proven.

**Durable lesson:** keep `pnpm-lock.yaml` in lockstep with `package.json`. A version bump in any
manifest without re-running `pnpm install` breaks EVERY Vercel build and silently freezes prod on
the last good deploy.

**Don't declare "skipped trigger" too early:** GitHub `/statuses`, `/deployments?sha=`, and
`/check-runs` can ALL read empty for the first ~1 min after a push even when the build is running —
they just haven't been posted yet. Confirmed: empty at ~60s, then "success"+Production deployment at
~2 min, and the live `/assets/index-*.js` hash changed on its own. Wait ~2-3 min and re-poll before
resorting to an empty retrigger commit, or you'll add a needless commit to a build that was fine.

**Fast diagnosis of live staleness:** capture live `/assets/index-*.js` hash before/after a push.
- Hash changes → build succeeded, pipeline end-to-end OK.
- Hash unchanged after a few min → push reached GitHub but the build FAILED. Check the lockfile
  first (`pnpm install --frozen-lockfile`); if that passes, read the Vercel build log for the next
  failing step. Do NOT re-investigate the Replit→GitHub push — that half is proven.

**SSR-SEO prerender gotcha:** `artifacts/growitbuddy/api/render.js` is a Vercel serverless fn,
PREBUILT and committed (esbuild-bundled from `ssr/render.ts` via `scripts/build-fn.mjs`). The
package `build` script does NOT regenerate it (it only refreshes `api/_template.js` per build).
So changing a CODE content default (e.g. `src/lib/homeDefaults.ts`, which `ssr/contentDefaults.ts`
re-imports) updates the CLIENT bundle and the visible UI, but NOT the hidden `<div data-ssr-seo>`
crawler snapshot — that stays stale until `scripts/build-fn.mjs` is re-run and api/render.js
re-committed. Narrow impact: only fields with NO admin DB override (the SSR fn reads live Neon for
overrides; null row → baked CONTENT_DEFAULTS). Regenerating locally in this repl FAILS (esbuild
can't resolve `@neondatabase/serverless` with the current build-fn config); do NOT force it — a
broken render.js serves every page, so a bad regen takes the whole site down for one SEO word.
