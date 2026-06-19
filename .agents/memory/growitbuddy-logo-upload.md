---
name: GrowitBuddy logo upload (no-crop + WYSIWYG)
description: How company/client logos are added and why they must never be cropped; the two managers that feed the same Work grid.
---

# Logos: never crop, admin preview must mirror the public Work cell

**Two admin managers write the SAME logos** (both hit `/api/admin/logos`, both render in the public Work grid):
- `/admin/work` → `AdminWork.tsx` LogosSection → `AddLogoPanel` (uses `ImageUrlField`).
- `/admin/logos` → `AdminLogos.tsx` "Client Logos" page (own dropzone + `ImageUrlField`).
Fix/verify BOTH when touching logo behavior, or the bug persists on whichever page the user uses.

**Rule:** logos are never cropped. The public Work cell renders white bg, `object-contain`, img `maxWidth 80%` / `maxHeight 44`. Admin previews must match this exactly (WYSIWYG).

**Why:** owner complaint — admin showed full logo during the crop step but the stored file came out cut, and the post-upload preview (`object-cover`) cropped the display. "Jitna admin me dikhe utna website par dikhe."

**How to apply:**
- `ImageUrlField` has opt-in props `skipCrop` (bypass `CropModal`, upload original via `uploadBlob`) and `objectFit` ("cover" default preserves OG/Twitter/cover-image consumers; "contain" renders white + centered 80%×44 mirroring a logo cell). Logo usages pass `skipCrop objectFit="contain"`.
- `CropModal` rasterizes to PNG via canvas; routing logos through it (esp. `defaultAspect="3:1"`) bakes a crop into the file — don't. Its "Skip crop" button already uploaded raw originals, so raw-SVG upload is a pre-existing path, not new.
- Other `ImageUrlField` consumers (AdminTalentPool 16:9, AdminSEO, AdminResources) rely on the cover/crop defaults — don't change their behavior.
- Always wrap admin logo preview `src` with `resolveMediaUrl` (split-origin prod), same as public.
