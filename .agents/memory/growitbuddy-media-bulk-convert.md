---
name: GrowitBuddy bulk image convert (WebP/AVIF)
description: Design rules for the admin Media Library in-place bulk re-encode feature
---

# In-place bulk image conversion (admin Media Library / "Media Lab")

Admin selects images and bulk-converts them in place to WebP/AVIF (sharp) with real
size compression. The row keeps its id, so id-based URLs (`/api/media/file/:id`)
stay stable.

## Durable rules (learned the hard way; architect-enforced)

- **Never delete the old asset inline during an in-place re-encode.** When a
  Cloudinary-backed image is re-encoded into a brand-new asset, do NOT delete the
  previous Cloudinary asset in the convert path.
  **Why:** if any reference rewrite is missed or fails, the old URL still resolves,
  so a live page can never 404. Storage cleanup is a separate concern; if ever
  needed, do it as a separate audited job that validates references first.

- **Reference rewrite must cover EVERY media-bearing column, not just siteContent.**
  Rewrite the new URL across: `siteContent.data` (jsonb), `clientLogos.imageUrl`
  (scalar), `portfolioItems.customThumbnailUrl` (scalar) + `caseStudy` (jsonb) +
  `blocks` (jsonb). Missing any one leaves stale (but still-working, since old asset
  retained) references that just don't get the compression benefit.
  **How to apply:** if a new media-referencing column/table is added later, extend
  the rewrite helper too. Use a shared `applyMediaReplacements(string, reps)` over
  the JSON.stringify'd value for jsonb columns and over the raw scalar for URL columns.

- **id-URL regex needs a digit boundary.** Use
  `/api/media/file/${id}(?![0-9])(\?v=\d+)?` so id 5 does NOT match inside
  `/api/media/file/55`. Tolerate an existing `?v=` cache-bust suffix.

- **Report partial failure to the admin.** Conversions can succeed while the rewrite
  step fails; return `{referencesUpdated, warning}` and surface the warning in the UI
  (old assets retained, so it's a "re-run to finish" situation, not breakage).

- Skip non-raster/animated (svg, animated gif, video) and skip if result not
  meaningfully smaller. Fetch of remote source URLs uses a 15s AbortSignal timeout.
