---
name: GrowitBuddy WordPress blog-detail rendering
description: How the blog post page renders raw WordPress REST HTML — TOC plugin restyling, self-anchor rewriting, and hero image cropping rules.
---

# WordPress post rendering on the blog detail page

The blog detail page (`InsightDetail.tsx`, route `/blog/wp-<wpSlug>`) renders **raw HTML
from the WordPress REST API** (`blog.growitbuddy.com/wp-json/wp/v2`) inside `.article-body`.
None of WordPress's plugin CSS or JS is loaded on our SPA, so plugin-authored markup must be
re-styled and de-glitched by us. The transform pipeline is
`addHeadingIds(enhanceWpHtml(rewriteSelfAnchors(raw)))`, all string/regex based.

## TOC plugins emit absolute self-anchor links — rewrite to in-page hashes
WP TOC plugins (Easy TOC / ez-toc, etc.) emit **absolute** self-referential links like
`href="https://blog.growitbuddy.com/<slug>/#Section"`. On the SPA, clicking one navigates
*away* to WordPress instead of scrolling the page.
**Fix:** `rewriteSelfAnchors()` rewrites a blog-domain link to a bare `#fragment` **only when
that fragment matches an `id` that actually exists in the document.**
**Why scoped this way:** anchoring on "id exists in doc" (not on the current slug) is robust to
any WP permalink structure, leaves links to *other* posts' sections as real navigation, and
leaves external deep links (e.g. Wikipedia `#section`) untouched (different domain). The anchor
targets exist as `<span class="ez-toc-section" id="...">` in the raw content for ALL heading
levels, so they're present before `addHeadingIds` runs.

## ez-toc selectors: it's an ID, not a class
The ez-toc container is `id="ez-toc-container"` (plus `ez-toc-v2_x` version classes) — there is
NO `class="ez-toc-container"`. Links carry `class="ez-toc-link"`. So restyle rules must cover
`#ez-toc-container a` AND `.ez-toc-link` (a `.ez-toc-container a` class selector alone misses
them and links render in the orange body-link color). Hide the non-functional collapse controls
(`.ez-toc-title-toggle`, `.ez-toc-js-icon-con`, `.ez-toc-toggle`) — without plugin JS they show
as orphaned icons. `hasInlineToc()` already suppresses our own auto-TOC when a WP TOC is present.

## Hero featured image: never force a crop
Do NOT put `aspectRatio` + `objectFit:cover` (or a mobile `aspect-ratio` override) on the hero
`<img>` — wide banner featured images get over-cropped on mobile. Render at natural ratio
(`width:100%; height:auto`). Tradeoff: no width/height attrs ⇒ minor CLS; acceptable vs. the
crop bug. If real media dimensions become available, pass true `width`/`height` (never the old
hard-coded 1600×900).
