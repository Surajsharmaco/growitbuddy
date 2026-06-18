---
name: GrowitBuddy public visibility filters
description: Where trashed/draft/hidden content must be filtered — React .filter() alone is not enough; SSR bootstrap + SEO body + sitemaps bypass it.
---

# Public visibility filters must be applied in MORE than the React components

When an item gains a "hide from public" flag (e.g. `trashed`, blog `status==="draft"`,
distribution/influencer `profileEnabled===false`), filtering it in the React page's
`.filter()` is necessary but **NOT sufficient**. Three other server paths emit the raw
data and bypass React entirely:

1. **SSR JSON bootstrap** — `ssr/render.ts` injects `window.__GB_PUBLIC_CONTENT__` from
   DB content. Raw arrays end up in the HTML *source* even though React later hides them.
2. **SSR SEO/no-JS body** — `renderContentBody` + `collectBlocks` walk the same content
   into crawler-visible `<h1>/<h2>/<p>`.
3. **Sitemaps** — blog sitemap is built in TWO places: `ssr/render.ts buildBlogSitemap`
   AND `artifacts/api-server/src/routes/sitemap.ts`. Both must exclude hidden items.

**Why:** the SPA mounts with `createRoot().render()` (not hydrate), so it clears `#root`,
but the pre-clear HTML, the JSON bootstrap, and the sitemaps are all already in the
response — search engines and "view source" see them. This was a real content-disclosure
leak caught in code review.

**How to apply:** the single chokepoint is `sanitizePublicContent(content)` in
`ssr/render.ts`. It mirrors the public-page filters and its output (`publicContent`) feeds
BOTH the bootstrap injection and the body merge. `collectBlocks` also skips
`trashed===true || status==="draft" || profileEnabled===false` as defense in depth.
- Public filters to mirror: blog = `!trashed && (status ?? "published") === "published"`;
  distribution + influencers = `!trashed && profileEnabled !== false`.
- Any NEW public section with an item array + a hide flag must be added to
  `sanitizePublicContent` and (if individually listed) to a sitemap builder.
- After editing `ssr/render.ts`, regenerate `api/render.js` (`node scripts/build-fn.mjs`)
  or the committed prebuilt bundle stays stale on Vercel.
