---
name: GrowitBuddy backup/export features
description: SSRF + memory-safety rules for admin backup builders that fetch untrusted URLs; WP blog export quirks; how to test them in dev.
---

# Admin backup / migration builders (blog export + content+photos archive)

The admin "Backup / Migration" page can build ZIPs server-side. Two builders fetch
bytes from URLs that originate from **untrusted** sources, which drives the design:

- Blog export: blogs are NOT in our DB — they live on an EXTERNAL WordPress site
  (`blog.growitbuddy.com`). Image URLs are scraped out of WP HTML/content.
- Content+photos archive: `media_files.url` values are arbitrary DB strings.

## Rule: any server-side fetch of an externally-derived URL MUST go through the
SSRF-safe fetch helper (`safeFetch.ts` → `safeFetchToBuffer`).
**Why:** a malicious/compromised WP page or DB url could point the server at
internal/cloud-metadata/private hosts (SSRF), or stream an unbounded body → OOM.
**How to apply:** the helper blocks private/loopback/link-local/reserved IPs by
resolving DNS and checking every address, follows redirects MANUALLY re-validating
each hop, only allows http/https, preflights Content-Length, and streams with a
hard byte cap (never `arrayBuffer()` before the cap). Fixed-host fetches to the WP
REST API / post pages can stay as plain `fetch` (host is a constant, not SSRF).

## Rule: never bulk-select `media_files.data` (base64 blobs) for all rows.
**Why:** a media-heavy DB OOMs before any total-size cap matters.
**How to apply:** select metadata + a `sql<boolean>\`(${mediaFiles.data} IS NOT NULL)\``
flag; skip up front when declared `size` exceeds the per-file cap; load a single
row's `data` on demand (`where(eq(id))`) only when including it.

## WP export quirks
- The WP REST media endpoint is anon-locked, so `_embed` media is unavailable —
  resolve the featured image by scraping the public post page (`wp-post-image` /
  `og:image`). The post BODY (`content.rendered`) often has NO inline `<img>`, so a
  per-post `content.html` with zero images is correct; the featured image belongs
  in the standalone `index.html`, not the body.

## Testing in dev (no tsx; dev DB has no schema)
- You CANNOT easily bundle the whole export to run it (pino worker-thread bundling).
  Test `safeFetch.ts` in isolation: `esbuild build({write:false})` it, import via a
  `data:text/javascript;base64,...` URL, and run from a package dir that DECLARES
  esbuild (e.g. `artifacts/api-server`) — esbuild won't resolve from the repo root.
- `buildContentArchive` can't run in dev (dev DB empty) — verify by typecheck +
  reuse of the proven `buildContentSnapshot`; only blog export is live-testable.
