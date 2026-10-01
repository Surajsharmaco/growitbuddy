import {
  isCmsPagesVariantSection,
  isPublicCmsPage,
  validateCmsPageSlug,
  type CmsPageSeoPost,
} from "@workspace/seo";

/**
 * Sanitized content feeds both the SSR JSON bootstrap and crawler-visible body.
 * Blog's established `status ?? "published"` lifecycle is intentionally distinct
 * from CMS Pages' fail-closed lifecycle.
 */
export function sanitizePublicContent(
  content: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...content };

  // Only this exact namespace is known to hold historical copies of the CMS
  // collection. Shape-based detection would also match normal blog sections.
  for (const section of Object.keys(out)) {
    if (section !== "cms-pages" && isCmsPagesVariantSection(section)) {
      delete out[section];
    }
  }

  const blog = out.blog as { posts?: unknown } | undefined;
  if (blog && Array.isArray(blog.posts)) {
    out.blog = {
      ...blog,
      posts: blog.posts.filter(
        (post) =>
          !!post &&
          (post as { trashed?: boolean }).trashed !== true &&
          ((post as { status?: string }).status ?? "published") === "published",
      ),
    };
  }

  const cmsPages = out["cms-pages"] as { posts?: unknown } | undefined;
  if (cmsPages && Array.isArray(cmsPages.posts)) {
    out["cms-pages"] = {
      ...cmsPages,
      posts: cmsPages.posts.filter(
        (page): page is CmsPageSeoPost =>
          !!page &&
          typeof page === "object" &&
          typeof (page as CmsPageSeoPost).slug === "string" &&
          typeof (page as CmsPageSeoPost).title === "string" &&
          validateCmsPageSlug((page as CmsPageSeoPost).slug).valid &&
          isPublicCmsPage(page as CmsPageSeoPost),
      ),
    };
  }

  for (const key of ["distribution-pages", "influencers"] as const) {
    const section = out[key] as { items?: unknown } | undefined;
    if (section && Array.isArray(section.items)) {
      out[key] = {
        ...section,
        items: section.items.filter(
          (item) =>
            !!item &&
            (item as { trashed?: boolean }).trashed !== true &&
            (item as { profileEnabled?: boolean }).profileEnabled !== false,
        ),
      };
    }
  }
  return out;
}