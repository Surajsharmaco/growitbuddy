---
name: GrowitBuddy master AI prompt & backup paths
description: Why backup has two paths (ZIP vs prompt) and the single-source coupling rule between them.
---

# Backup / Migration has TWO paths — keep them straight

The admin "Backup / Migration" page exposes two independent things:

1. **Full source ZIP** — `GET /admin/backup`. Fetches the whole repo from GitHub
   (needs `GITHUB_TOKEN`). This is the SLOW/FLAKY path — GitHub fetch can time out.
   That timeout is the "weak/buggy backup" users complain about; it is inherent to
   pulling source over the network, not a code bug.
2. **Master AI prompt** — `GET /admin/handoff-prompt` (super-admin only). Makes
   **NO GitHub call**. It builds one comprehensive markdown prompt from
   `buildMasterPrompt()` + a LIVE `buildContentSnapshot()` (DB) every request, so it
   is fast/robust and **auto-reflects current CMS content** without being asked.
   Frontend auto-fetches it on mount and offers Copy + Download(.md).

**Why prompt path makes no GitHub call:** the whole point was to fix the flaky ZIP.
The prompt only needs to *describe* the project + embed current content, not ship the
code, so it skips the network entirely.

## Single-source coupling rule (don't let docs drift)

`buildMasterPrompt()` does NOT re-write the architecture/setup/env/database prose. It
**reuses the strings returned by `buildHandoffDocs()`** (keys
`_AI_HANDOFF/ARCHITECTURE.md`, `SETUP_AND_DEPLOY.md`, `ENV_AND_CONNECTIONS.md`,
`DATABASE.md`) so the ZIP and the prompt can never disagree.
**How to apply:** if you change those four doc bodies or their record keys in
`buildHandoffDocs`, the master prompt changes in lockstep — verify both. The prompt
calls `buildHandoffDocs` with empty `sha/shortSha/commitMsg/commitDate` — that is SAFE
because only `meta.branch` is read by those four docs; commit fields only feed
START_HERE / AI_PROMPT / MANIFEST, which the prompt does not consume.

## Privacy / what the snapshot excludes
`buildContentSnapshot()` returns only public/CMS data (site_content, portfolio,
client_logos, page_variants, certificates w/o emails, media metadata+URLs). It
deliberately excludes: secrets/API keys, CRM leads & PII, team password hashes,
internal logs, certificate emails, media binary bytes. The prompt embeds this snapshot
as JSON — so it is safe to paste into an AI.

**Dev caveat:** dev DB has no schema, so the live path 500s in dev. Verify
`buildMasterPrompt` logic with a mock snapshot (esbuild-bundle a throwaway test;
run with `NODE_ENV=production` or pino-pretty transport load crashes the bundle).
