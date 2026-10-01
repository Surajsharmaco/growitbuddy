import { API_URL, BRAND, SITE_URL } from "./constants";
import { resolveBlogSeo, type BlogSeoPost, type ResolvedBlogSeo } from "./blog";

/** CMS pages intentionally share the blog's structural content and SEO fields. */
export interface CmsPageSeoPost extends BlogSeoPost {
  visibility?: "public" | "private";
}

const RESERVED_ROOT_SLUGS = new Set([
  // Static registry paths and every explicit public route in App.tsx.
  "about", "contact", "blog", "services", "work", "framework", "authority-audit",
  "influencers", "distribution", "acts-club", "links", "join", "creators", "career",
  "editors-pool", "video-editors", "designers-pool", "thumbnail-designers",
  "writers-pool", "social-media-managers", "motion-designers", "ai-creators",
  "ugc-creators", "meme-designers", "resources", "privacy", "terms", "portfolio",
  "verify", "guide", "seo-guide", "home", "join-page-owner", "verify-id", "site-guide",
  // Aliases/redirects and path roots with nested explicit routes.
  "insights", "freelancers", "full-time", "internship", "portfolio-private",
  // API, admin, framework/static assets and platform-owned paths.
  "api", "admin", "assets", "static", "public", "src", "node_modules",
  "favicon.ico", "robots.txt", "sitemap.xml", "sitemap-blog.xml",
  // Permanently retired legacy roots and common file/metadata endpoints.
  "product", "products", "collection", "collections", "cart", "checkout",
  "checkouts", "account", "accounts", "order", "orders", "pages", "policies",
  "apps", "layout", "layouts", "blogs", "fonts", "images", "media",
  "opengraph.jpg", "logo.png", "logo-dark.png",
]);

export function isReservedCmsPageSlug(slug: string): boolean {
  return RESERVED_ROOT_SLUGS.has(slug.toLowerCase());
}

/** The only public content-key namespace historically used for CMS page copies. */
export function isCmsPagesVariantSection(section: string): boolean {
  return /^cms-pages__v__/i.test(section);
}

export function validateCmsPageSlug(slug: unknown): { valid: boolean; error?: string } {
  if (typeof slug !== "string" || slug.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { valid: false, error: "slug must be one lowercase kebab-case URL segment (max 80 characters)" };
  }
  if (isReservedCmsPageSlug(slug)) {
    return { valid: false, error: `slug "${slug}" is reserved by an existing route` };
  }
  return { valid: true };
}

export function isPublicCmsPage(page: CmsPageSeoPost): boolean {
  return page.trashed !== true &&
    page.status === "published" &&
    (page.visibility === undefined || page.visibility === "public");
}

function absoluteUrl(value: string | undefined, fallback: string): string {
  const url = (value ?? "").trim();
  if (!url) return fallback;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/api/")) return `${API_URL}${url}`;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function validDate(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function isCmsPageInSitemap(page: CmsPageSeoPost, globalIndexable = true): boolean {
  if (!globalIndexable || !isPublicCmsPage(page) || page.seo?.noIndex === true) return false;
  const expectedUrl = `${SITE_URL}/${page.slug}`;
  const canonical = absoluteUrl(page.seo?.canonicalUrl, expectedUrl);
  return canonical === expectedUrl && validateCmsPageSlug(page.slug).valid;
}

export function resolveCmsPageSeo(
  page: CmsPageSeoPost,
  options: { globalIndexable?: boolean } = {},
): ResolvedBlogSeo {
  const base = resolveBlogSeo(page, options);
  const seo = page.seo ?? {};
  const url = `${SITE_URL}/${encodeURIComponent(page.slug)}`;
  const title = seo.seoTitle?.trim() || page.title.trim();
  const description = seo.metaDescription?.trim() || page.excerpt || "";
  const canonical = absoluteUrl(seo.canonicalUrl, url);
  const globalIndexable = options.globalIndexable !== false;
  const robots = globalIndexable && seo.noIndex !== true ? "index,follow" : "noindex,nofollow";
  const image = absoluteUrl(seo.ogImage || page.featuredImage, `${SITE_URL}/opengraph.jpg`);
  const ogTitle = seo.ogTitle?.trim() || title;
  const ogDescription = seo.ogDescription?.trim() || description;
  const datePublished = validDate(page.isoDate || page.date);
  const dateModified = validDate(page.modifiedIsoDate) || datePublished;
  const faqItems = (seo.faqItems ?? []).filter((item) => item.question?.trim() && item.answer?.trim());
  const schemaType = seo.schemaType || "WebPage";

  const graph: Record<string, unknown>[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: page.title, item: canonical },
      ],
    },
  ];
  if (schemaType !== "None") {
    const type = schemaType === "FAQ" ? "FAQPage" : schemaType;
    if (type === "FAQPage") {
      graph.push({
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      });
    } else {
      const isHowTo = type === "HowTo";
      graph.push({
        "@type": type,
        name: title,
        headline: title,
        description,
        url: canonical,
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
        ...(datePublished ? { datePublished } : {}),
        ...(dateModified ? { dateModified } : {}),
        ...(image ? { image } : {}),
        ...(isHowTo
          ? {
              step: (seo.howToSteps ?? [])
                .filter((step) => step.name?.trim() && step.text?.trim())
                .map((step, index) => ({
                  "@type": "HowToStep",
                  position: index + 1,
                  name: step.name,
                  text: step.text,
                })),
            }
          : {}),
      });
    }
  }

  const jsonLd = { "@context": "https://schema.org", "@graph": graph };
  const ogType = schemaType === "Article" ? "article" : "website";
  const metaTagsHtml = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="${escapeHtml(robots)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:title" content="${escapeHtml(ogTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(ogDescription)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(BRAND.name)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(ogTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(ogDescription)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:url" content="${escapeHtml(canonical)}" />`,
    `<script type="application/ld+json" id="gb-jsonld">${safeJson(jsonLd)}</script>`,
  ].join("\n");

  return {
    ...base,
    url,
    title,
    description,
    canonical,
    robots,
    og: { title: ogTitle, description: ogDescription, url: canonical, type: ogType, image, siteName: BRAND.name },
    twitter: { card: "summary_large_image", title: ogTitle, description: ogDescription, image, url: canonical },
    jsonLd,
    metaTagsHtml,
    sitemap: {
      included: isCmsPageInSitemap(page, globalIndexable),
      url,
      lastmod: (validDate(page.modifiedIsoDate || page.isoDate || page.date) ?? null)?.slice(0, 10) ?? null,
    },
  };
}