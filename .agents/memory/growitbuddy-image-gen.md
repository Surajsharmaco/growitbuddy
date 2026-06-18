---
name: GrowitBuddy image generation for service cards
description: Lessons for generating on-brand product images for GrowitBuddy cards and shipping them lean.
---

# Generating service-card images (GrowitBuddy)

- **Never put literal hex codes (e.g. `#C2A878`) or short label words ("UI", "AI") in an image prompt.** The image model renders them as visible TEXT baked into the image. Describe colours in words instead ("champagne gold and deep navy-slate on warm ivory cream"). This was the root cause of text leaking onto cards; a strong negative prompt alone did NOT fix it.
- **No faces / eyes.** User reads any face or paired shapes as creepy "eyes". For an AI/automation concept use an abstract glowing orb / concentric rings / circuit halo, and put "no face, no eyes, no robot" in both prompt and negative prompt.
- **Image service throttles hard (429 RESOURCE_EXHAUSTED).** Generate with a retry/backoff loop (≤6 attempts, ~25s waits); often only some of the batch succeed per attempt, so filter completed and retry the rest.
- **Compress before shipping.** Generated PNGs are ~0.9–1.1 MB each. Convert to WebP q86 (`magick in.png -quality 86 out.webp`) → ~40x smaller (6 imgs: 5.65MB → 132KB) with no visible loss; update `@assets/...` imports to `.webp` and delete the PNGs. `vite/client` types already cover `.webp` imports, so no tsconfig change.
- Cards stay admin-editable: images live in code as a positional `SERVICE_IMAGES[]` array (the services data carries no image field), mapped by card order — same approach the old line-art icons used.
- **ImageMagick montage** fails on missing font (label render); for a contact-sheet use `magick a b c -resize '420x315!' +append row.png` then `-append` rows — no fonts needed.
