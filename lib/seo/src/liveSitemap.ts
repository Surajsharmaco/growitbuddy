import { SITE_URL } from "./constants";
import { isBlogInSitemap, resolveBlogSeo, type BlogSeoPost } from "./blog";
import { isCmsPageInSitemap, resolveCmsPageSeo, validateCmsPageSlug, type CmsPageSeoPost } from "./pages";
import type { PageRegistryEntry } from "./index";

export interface SitemapPageSettings {
  index?: boolean;
  sitemap?: boolean;
  canonical?: string;
}

export interface LiveSitemapPolicy {
  globalIndexable: boolean;
  seo: Record<string, SitemapPageSettings>;
  visibility: Record<string, { hidden?: boolean }>;
  cmsPages: CmsPageSeoPost[];
  posts: BlogSeoPost[];
  variants: Array<{ slug: string; sourceKey: string; isLive?: boolean }>;
}

function escape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function canonicalMatches(value: string | undefined, expected: string): boolean {
  const canonical = value?.trim();
  if (!canonical) return true;
  const absolute = canonical.startsWith("//") ? `https:${canonical}` :
    /^https?:\/\//i.test(canonical) ? canonical :
    `${SITE_URL}${canonical.startsWith("/") ? "" : "/"}${canonical}`;
  return absolute === expected;
}

function entry(url: string, lastmod?: string | null, priority = 0.7, changefreq = "monthly"): string {
  return `  <url>\n    <loc>${escape(url)}</loc>${lastmod ? `\n    <lastmod>${escape(lastmod)}</lastmod>` : ""}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

/** Pure, shared policy: API and SSR must never produce different permission lists. */
export function buildLivePageSitemapEntries(registry: PageRegistryEntry[], policy: LiveSitemapPolicy): string[] {
  if (!policy.globalIndexable) return [];
  const urls = new Map<string, string>();
  for (const page of registry) {
    const seo = policy.seo[page.slug] ?? {};
    const url = SITE_URL + page.path;
    if (page.path.includes(":") || policy.visibility[page.slug]?.hidden ||
      (seo.index ?? page.defaults.index ?? true) === false ||
      (seo.sitemap ?? page.defaults.sitemap ?? true) === false ||
      !canonicalMatches(seo.canonical, url)) continue;
    urls.set(url, entry(url, null, page.priority, page.changefreq));
  }
  for (const page of policy.cmsPages) {
    if (!page || !page.slug || policy.visibility[page.slug]?.hidden || !isCmsPageInSitemap(page)) continue;
    const seo = policy.seo[page.slug];
    const resolved = resolveCmsPageSeo(page);
    if (seo?.index === false || seo?.sitemap === false || !canonicalMatches(seo?.canonical, resolved.sitemap.url)) continue;
    urls.set(resolved.sitemap.url, entry(resolved.sitemap.url, resolved.sitemap.lastmod));
  }
  for (const variant of policy.variants) {
    if (!variant || variant.isLive === false || !validateCmsPageSlug(variant.slug).valid ||
      policy.cmsPages.some(page => page.slug === variant.slug) ||
      policy.visibility[variant.slug]?.hidden || policy.visibility[variant.sourceKey]?.hidden) continue;
    const source = registry.find(page => page.slug === variant.sourceKey);
    if (!source) continue;
    const seo = { ...policy.seo[variant.sourceKey], ...policy.seo[variant.slug], canonical: policy.seo[variant.slug]?.canonical };
    const url = SITE_URL + "/" + variant.slug;
    if ((seo.index ?? source.defaults.index ?? true) === false ||
      (seo.sitemap ?? source.defaults.sitemap ?? true) === false ||
      !canonicalMatches(seo.canonical, url)) continue;
    urls.set(url, entry(url));
  }
  return [...urls.values()];
}

export function buildLiveBlogSitemapEntries(policy: LiveSitemapPolicy): string[] {
  if (!policy.globalIndexable || policy.visibility.insights?.hidden) return [];
  const urls = new Map<string, string>();
  for (const post of policy.posts) {
    if (!post || !post.slug || !isBlogInSitemap(post)) continue;
    const resolved = resolveBlogSeo(post);
    urls.set(resolved.sitemap.url, entry(resolved.sitemap.url, resolved.sitemap.lastmod, 0.8));
  }
  return [...urls.values()];
}

export function buildLiveSitemapIndex(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>${SITE_URL}/sitemap-pages.xml</loc></sitemap>\n  <sitemap><loc>${SITE_URL}/sitemap-blog.xml</loc></sitemap>\n</sitemapindex>`;
}