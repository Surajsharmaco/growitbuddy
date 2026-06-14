/**
 * Single source of truth for all SEO-managed public pages.
 *
 * The canonical data now lives in the shared `@workspace/seo` package so the
 * frontend, the API sitemap, and the static sitemap generator all stay in sync.
 * This file re-exports it so existing `@/lib/pageRegistry` imports keep working.
 *
 * To add or edit a page, edit `lib/seo/src/index.ts` — not this file.
 */

export {
  PAGE_REGISTRY,
  findEntryByPath,
  findEntryBySlug,
  SEO_SECTION_PREFIX,
  seoSectionKey,
  SITE_URL,
  API_URL,
  BLOG_PATH,
  BRAND,
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildSiteGraph,
} from "@workspace/seo";

export type { PageRegistryEntry, PageSEOData } from "@workspace/seo";
