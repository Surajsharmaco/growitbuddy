---
name: GrowitBuddy live-update pipeline (Replit → GitHub → Vercel)
description: Where the live-site update pipeline actually breaks; what is proven working vs not, and how to diagnose staleness fast.
---

# GrowitBuddy live-update pipeline

Live `growitbuddy.com` is served by **Vercel** (frontend); backend on Render; Neon DB
shared dev↔live. Replit is dev-only. Repo: github.com/Surajsharmaco/growitbuddy,
production branch `main`.

**Proven working — Replit → GitHub:** commits push to GitHub automatically from Replit
via the `GITHUB_TOKEN` secret + a workflow credential helper (see
replit-git-blocked-ops-workflow.md "Pushing to GitHub"). Pushes confirmed landing on
`origin/main` (verified via push refspec output and the GitHub contents API).

**The bottleneck is GitHub → Vercel.** Observed: after the redesign commit deployed,
multiple confirmed pushes did NOT update the live site for 15+ min — the production JS
bundle filename (Vite content-hash, `/assets/index-XXXX.js`) stayed frozen and
`x-vercel-cache: MISS, age:0` (so it's the *origin build* that's stale, not edge cache).
Vercel is simply not shipping new commits to the production domain.

**Likely Vercel-side causes (can't inspect without a Vercel token):** auto-deploy / Git
integration paused; builds failing (production keeps serving the last good deploy);
custom domain pinned to a specific old deployment; or an "Ignored Build Step" skip.
NOTE: a commit that *did* touch the artifact dir (`artifacts/growitbuddy/...`) also
failed to deploy, so it is NOT purely Vercel's monorepo ignored-build-step heuristic.

**Fast diagnosis of live staleness:** capture the live `/assets/index-*.js` hash before
and after a push.
- Hash changes → Vercel rebuilt; pipeline end-to-end OK.
- Hash unchanged after several minutes → the push reached GitHub but Vercel did not
  rebuild. Investigate **Vercel** (deployments list / build logs / Git settings / domain
  assignment), NOT the Replit→GitHub push — that half is proven. A Vercel access token
  would let the agent list deployments, read build logs, and trigger redeploys directly.
