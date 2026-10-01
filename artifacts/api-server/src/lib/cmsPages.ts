import {
  isCmsPagesVariantSection,
  isPublicCmsPage,
  validateCmsPageSlug,
  type CmsPageSeoPost,
} from "@workspace/seo";

export interface CmsPagesData {
  posts: CmsPageSeoPost[];
  tocInitialVisible: number;
}

export const SUPPORTED_VARIANT_SOURCE_KEYS = new Set([
  "home",
  "about",
  "services",
  "framework",
  "work",
  "blog",
  "resources",
  "contact",
  "creators",
  "joinnetwork",
  "career",
  "authority-audit",
  "distribution-network",
  "creator-school",
  "pool-designers",
  "pool-thumbnail-designers",
  "pool-writers",
  "pool-social-managers",
  "pool-motion-designers",
  "pool-ai-creators",
  "pool-ugc-creators",
  "pool-meme-designers",
  "pool-editors",
]);

export const DEFAULT_PUBLIC_CONTENT_SECTIONS = ["cms-pages"] as const;

export function isSupportedVariantSourceKey(sourceKey: string): boolean {
  return SUPPORTED_VARIANT_SOURCE_KEYS.has(sourceKey);
}

export function validateCmsPagesData(value: unknown, variantSlugs: Iterable<string> = []): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "data must be an object containing posts and tocInitialVisible";
  }
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.posts)) return "posts must be an array";
  if (!Number.isInteger(data.tocInitialVisible) || (data.tocInitialVisible as number) < 0) {
    return "tocInitialVisible must be a non-negative integer";
  }

  const slugs = new Set<string>();
  const variants = new Set(Array.from(variantSlugs, (slug) => slug.toLowerCase()));
  for (let index = 0; index < data.posts.length; index += 1) {
    const candidate = data.posts[index];
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return `posts[${index}] must be an object`;
    }
    const post = candidate as Record<string, unknown>;
    if (typeof post.slug !== "string" || typeof post.title !== "string") {
      return `posts[${index}] must include string slug and title fields`;
    }
    const slugResult = validateCmsPageSlug(post.slug);
    if (!slugResult.valid) return `posts[${index}].${slugResult.error}`;
    if (post.visibility !== undefined && post.visibility !== "public" && post.visibility !== "private") {
      return `posts[${index}].visibility must be "public" or "private"`;
    }
    if (post.status !== undefined && typeof post.status !== "string") {
      return `posts[${index}].status must be a string`;
    }
    if (post.trashed !== undefined && typeof post.trashed !== "boolean") {
      return `posts[${index}].trashed must be a boolean`;
    }
    for (const key of ["excerpt", "date", "isoDate", "modifiedIsoDate", "tag", "content", "featuredImage"] as const) {
      if (post[key] !== undefined && typeof post[key] !== "string") {
        return `posts[${index}].${key} must be a string`;
      }
    }
    if (post.seo !== undefined && (!post.seo || typeof post.seo !== "object" || Array.isArray(post.seo))) {
      return `posts[${index}].seo must be an object`;
    }
    if (post.seo && typeof post.seo === "object" && !Array.isArray(post.seo)) {
      const seo = post.seo as Record<string, unknown>;
      for (const key of ["seoTitle", "metaDescription", "canonicalUrl", "ogTitle", "ogDescription", "ogImage", "schemaType", "focusKeyword", "secondaryKeywords"] as const) {
        if (seo[key] !== undefined && typeof seo[key] !== "string") {
          return `posts[${index}].seo.${key} must be a string`;
        }
      }
      if (seo.noIndex !== undefined && typeof seo.noIndex !== "boolean") {
        return `posts[${index}].seo.noIndex must be a boolean`;
      }
      for (const key of ["faqItems", "howToSteps"] as const) {
        if (seo[key] === undefined) continue;
        if (!Array.isArray(seo[key]) || (seo[key] as unknown[]).some((item) =>
          !item || typeof item !== "object" || Array.isArray(item) ||
          Object.values(item as Record<string, unknown>).some((entry) => entry !== undefined && typeof entry !== "string"),
        )) {
          return `posts[${index}].seo.${key} must be an array of text objects`;
        }
      }
    }
    const normalizedSlug = post.slug.trim().toLowerCase().replace(/-+/g, "-");
    if (slugs.has(normalizedSlug)) return `duplicate CMS page slug "${post.slug}"`;
    if (variants.has(normalizedSlug)) return `CMS page slug "${post.slug}" is already used by a page variant`;
    slugs.add(normalizedSlug);
  }
  return null;
}

/** Public projection: CMS drafts and private/trash entries never leave the API. */
export function projectPublicCmsPages(value: unknown): CmsPagesData | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.posts)) return null;
  const posts = data.posts.filter((post): post is CmsPageSeoPost => {
    if (!post || typeof post !== "object" || Array.isArray(post)) return false;
    const page = post as CmsPageSeoPost;
    return typeof page.slug === "string" &&
      typeof page.title === "string" &&
      validateCmsPageSlug(page.slug).valid &&
      isPublicCmsPage(page);
  });
  return {
    posts,
    tocInitialVisible: Number.isInteger(data.tocInitialVisible) && (data.tocInitialVisible as number) >= 0
      ? data.tocInitialVisible as number
      : 0,
  };
}

/**
 * Content stored under a copied collection alias must receive the same
 * fail-closed page projection as its canonical section. The variant-key
 * namespace is deliberately exact: ordinary blog collections share the same
 * JSON shape and cannot safely be identified by shape alone.
 */
export function projectPublicContentSection(section: string, value: unknown): object | null {
  const data = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
  if (
    section === "cms-pages" ||
    isCmsPagesVariantSection(section)
  ) {
    return projectPublicCmsPages(value);
  }
  return data;
}