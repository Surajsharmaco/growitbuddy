/**
 * @workspace/seo — single source of truth for SEO across GrowitBuddy.
 *
 * Consumed by:
 *  - artifacts/growitbuddy  (frontend re-exports it via src/lib/pageRegistry.ts;
 *    components keep importing `@/lib/pageRegistry` unchanged)
 *  - artifacts/api-server   (dynamic /api/sitemap.xml + /api/sitemap-blog.xml)
 *  - artifacts/growitbuddy/scripts/generate-sitemap.ts (static public/sitemap.xml)
 *
 * Add or edit a page in ONE place — `PAGE_REGISTRY` below — and every sitemap,
 * SEO panel entry, and default meta value stays in lockstep automatically.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Site-wide constants (brand identity + canonical hosts)
 * These mirror the static JSON-LD @graph in artifacts/growitbuddy/index.html so
 * page-level structured data and the site-level Organization/WebSite stay
 * consistent. index.html holds the canonical injected copy; everything else
 * should derive Organization/WebSite data from the builders below.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Canonical public origin (no trailing slash). */
export const SITE_URL = "https://growitbuddy.com";
/** Public API origin that serves the dynamic sitemaps (no trailing slash). */
export const API_URL = "https://growitbuddy-api.onrender.com";
/** Canonical path for blog/insights posts. Old /insights/* URLs 301 here. */
export const BLOG_PATH = "/blog";

export const BRAND = {
  name: "GrowitBuddy",
  url: SITE_URL,
  logo: `${SITE_URL}/logo-dark.png`,
  email: "hello@growitbuddy.com",
  twitter: "@growitbuddy",
  description:
    "GrowitBuddy builds positioning, production, distribution, and inbound demand systems for founders and creators.",
  founder: {
    id: `${SITE_URL}/#suraj-sharma`,
    name: "Suraj Sharma",
    jobTitle: "Founder & CEO",
  },
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 * Page registry — the single source of truth
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PageRegistryEntry {
  slug: string;
  path: string;
  label: string;
  group: "Core" | "Services" | "Network" | "Pools" | "Legal" | "Utility";
  defaults: {
    title: string;
    description: string;
    /** Override DEFAULT indexability. Most pages index, but utility pages default to noindex. */
    index?: boolean;
    sitemap?: boolean;
  };
  /** Sitemap priority hint (0.0–1.0). Defaults to 0.7 when omitted. */
  priority?: number;
  /** Sitemap changefreq hint. Defaults to "monthly" when omitted. */
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
}

export const PAGE_REGISTRY: PageRegistryEntry[] = [
  // Core
  { slug: "home",             path: "/",                 label: "Home",                group: "Core",     priority: 1.0, changefreq: "weekly",  defaults: { title: "GrowitBuddy - Personal Branding, Content & Distribution Studio",     description: "Personal branding, content creation, and video editing for founders, creators, and building their online distribution, Authority & Inbound Leads" } },
  { slug: "about",            path: "/about",            label: "About",               group: "Core",     priority: 0.7, changefreq: "monthly", defaults: { title: "About GrowitBuddy",                                                 description: "Learn about the GrowitBuddy team, mission, and how we help creators scale." } },
  { slug: "contact",          path: "/contact",          label: "Contact",             group: "Core",     priority: 0.7, changefreq: "monthly", defaults: { title: "Contact GrowitBuddy",                                               description: "Get in touch with the GrowitBuddy team." } },
  { slug: "insights",         path: "/blog",             label: "Insights / Blog",     group: "Core",     priority: 0.8, changefreq: "weekly",  defaults: { title: "GrowitBuddy Insights",                                              description: "Strategies, frameworks, and lessons from running a modern creator agency." } },

  // Services
  { slug: "services",         path: "/services",         label: "Services",            group: "Services", priority: 0.9, changefreq: "monthly", defaults: { title: "Services — GrowitBuddy",                                            description: "Content, distribution, and growth services for creators and brands." } },
  { slug: "work",             path: "/work",             label: "Work / Case Studies", group: "Services", priority: 0.8, changefreq: "monthly", defaults: { title: "Our Work — GrowitBuddy",                                            description: "Real results from the brands and creators we've worked with." } },
  { slug: "framework",        path: "/framework",        label: "Framework",           group: "Services", priority: 0.7, changefreq: "monthly", defaults: { title: "The GrowitBuddy Framework",                                         description: "Our 4-step framework: Positioning, Production, Distribution, Inbound Demand." } },
  { slug: "authority-audit",  path: "/authority-audit",  label: "Authority Audit",     group: "Services", priority: 0.8, changefreq: "monthly", defaults: { title: "Authority Audit — GrowitBuddy",                                     description: "Free authority audit to identify content and distribution gaps." } },

  // Network & Hiring
  { slug: "influencers",      path: "/influencers",      label: "Influencers",         group: "Network",  priority: 0.7, changefreq: "weekly",  defaults: { title: "Influencer Network — GrowitBuddy",                                  description: "Explore our network of vetted creators and influencers." } },
  { slug: "distribution",     path: "/distribution",     label: "Distribution Network",group: "Network",  priority: 0.7, changefreq: "monthly", defaults: { title: "Distribution Network — GrowitBuddy",                                description: "Our owned distribution network of pages and creators." } },
  { slug: "join",             path: "/join",             label: "Join Network",        group: "Network",  priority: 0.7, changefreq: "monthly", defaults: { title: "Join the Network — GrowitBuddy",                                    description: "Join the GrowitBuddy creator and page-owner network." } },
  { slug: "creators",         path: "/creators",         label: "Creators",            group: "Network",  priority: 0.7, changefreq: "monthly", defaults: { title: "Creators — GrowitBuddy",                                            description: "Resources and opportunities for creators with GrowitBuddy." } },
  { slug: "career",           path: "/career",           label: "Careers (Unified)",   group: "Network",  priority: 0.7, changefreq: "monthly", defaults: { title: "Careers — GrowitBuddy",                                             description: "Join GrowitBuddy as a full-time team member, intern, or talent network member." } },

  // Talent Pools
  { slug: "creator-school",       path: "/editors-pool",          label: "Editors Pool",        group: "Pools", priority: 0.7, changefreq: "monthly", defaults: { title: "Video Editors Pool — GrowitBuddy",                              description: "Join the GrowitBuddy editors pool. Watch the demo, access resources, and submit your work." } },
  { slug: "video-editors",        path: "/video-editors",         label: "Video Editors",       group: "Pools", priority: 0.7, changefreq: "monthly", defaults: { title: "Video Editors Pool — GrowitBuddy",                              description: "Join the GrowitBuddy video editors talent pool." } },
  { slug: "designers-pool",       path: "/designers-pool",        label: "Designers Pool",      group: "Pools", priority: 0.7, changefreq: "monthly", defaults: { title: "Designers Pool — GrowitBuddy",                                  description: "Join the GrowitBuddy designers talent pool." } },
  { slug: "thumbnail-designers",  path: "/thumbnail-designers",   label: "Thumbnail Designers", group: "Pools", priority: 0.7, changefreq: "monthly", defaults: { title: "Thumbnail Designers Pool — GrowitBuddy",                        description: "Join the GrowitBuddy thumbnail designers talent pool." } },
  { slug: "writers-pool",         path: "/writers-pool",          label: "Writers Pool",        group: "Pools", priority: 0.7, changefreq: "monthly", defaults: { title: "Writers Pool — GrowitBuddy",                                    description: "Join the GrowitBuddy writers talent pool." } },
  { slug: "social-media-managers",path: "/social-media-managers", label: "Social Media Managers",group: "Pools",priority: 0.7, changefreq: "monthly", defaults: { title: "Social Media Managers Pool — GrowitBuddy",                      description: "Join the GrowitBuddy social media managers talent pool." } },
  { slug: "motion-designers",     path: "/motion-designers",      label: "Motion Designers",    group: "Pools", priority: 0.7, changefreq: "monthly", defaults: { title: "Motion Designers Pool — GrowitBuddy",                           description: "Join the GrowitBuddy motion designers talent pool." } },
  { slug: "ai-creators",          path: "/ai-creators",           label: "AI Creators",         group: "Pools", priority: 0.7, changefreq: "monthly", defaults: { title: "AI Creators Pool — GrowitBuddy",                                description: "Join the GrowitBuddy AI creators talent pool." } },
  { slug: "ugc-creators",         path: "/ugc-creators",          label: "UGC Creators",        group: "Pools", priority: 0.7, changefreq: "monthly", defaults: { title: "UGC Creators Pool — GrowitBuddy",                               description: "Join the GrowitBuddy UGC creators talent pool." } },
  { slug: "meme-designers",       path: "/meme-designers",        label: "Meme Designers",      group: "Pools", priority: 0.7, changefreq: "monthly", defaults: { title: "Meme Designers Pool — GrowitBuddy",                             description: "Join the GrowitBuddy meme designers talent pool." } },

  // Additional public pages
  { slug: "resources",            path: "/resources",             label: "Resources",           group: "Core",     priority: 0.7, changefreq: "weekly",  defaults: { title: "Resources — GrowitBuddy",                                       description: "Free guides, templates, and resources for creators and brands." } },
  { slug: "join-page-owner",      path: "/join/page-owner",       label: "Join · Page Owner",   group: "Network",  priority: 0.6, changefreq: "monthly", defaults: { title: "Join as a Page Owner — GrowitBuddy",                            description: "Apply to join the GrowitBuddy distribution network as a page owner." } },

  // Legal — indexed by default (trust signal); admin can flip
  { slug: "privacy",              path: "/privacy",               label: "Privacy Policy",      group: "Legal",    priority: 0.3, changefreq: "yearly",  defaults: { title: "Privacy Policy — GrowitBuddy",                                  description: "GrowitBuddy privacy policy and how we handle your data." } },
  { slug: "terms",                path: "/terms",                 label: "Terms of Service",    group: "Legal",    priority: 0.3, changefreq: "yearly",  defaults: { title: "Terms of Service — GrowitBuddy",                                description: "GrowitBuddy terms of service." } },

  // Utility — default noindex (not meant for search, excluded from sitemap)
  { slug: "portfolio",            path: "/portfolio",             label: "Portfolio",           group: "Utility",  defaults: { title: "Portfolio — GrowitBuddy",                                       description: "Client portfolio.", index: false, sitemap: false } },
  { slug: "verify",               path: "/verify",                label: "Verify Certificate",  group: "Utility",  defaults: { title: "Verify Certificate — GrowitBuddy",                              description: "Verify a GrowitBuddy certificate.", index: false, sitemap: false } },
  { slug: "verify-id",            path: "/verify/:id",            label: "Verify Detail",       group: "Utility",  defaults: { title: "Certificate Verification — GrowitBuddy",                        description: "Verify a specific certificate.", index: false, sitemap: false } },
];

/* ────────────────────────────────────────────────────────────────────────────
 * Registry lookups
 * ──────────────────────────────────────────────────────────────────────────── */

/** Match an actual URL pathname → registry entry (handles dynamic blog/verify paths). */
export function findEntryByPath(pathname: string): PageRegistryEntry | null {
  const exact = PAGE_REGISTRY.find((p) => p.path === pathname);
  if (exact) return exact;
  // Blog detail pages share insights SEO defaults (both /blog/* and legacy /insights/*)
  if (pathname.startsWith("/blog/") || pathname.startsWith("/insights/"))
    return PAGE_REGISTRY.find((p) => p.slug === "insights") ?? null;
  // /verify/:id → verify-id entry
  if (/^\/verify\/[^/]+$/.test(pathname)) return PAGE_REGISTRY.find((p) => p.slug === "verify-id") ?? null;
  return null;
}

export function findEntryBySlug(slug: string): PageRegistryEntry | null {
  return PAGE_REGISTRY.find((p) => p.slug === slug) ?? null;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Sitemap generation — shared by the API and the static generator
 * ──────────────────────────────────────────────────────────────────────────── */

/** Default sitemap priority when an entry omits one. */
export const DEFAULT_SITEMAP_PRIORITY = 0.7;
/** Default sitemap changefreq when an entry omits one. */
export const DEFAULT_SITEMAP_CHANGEFREQ = "monthly";

/**
 * Pages eligible for the main sitemap: indexable, sitemap-enabled, and not a
 * dynamic (`:param`) route. This is the de-facto registered-page list.
 */
export function getSitemapPages(): PageRegistryEntry[] {
  return PAGE_REGISTRY.filter(
    (p) => p.defaults.index !== false && p.defaults.sitemap !== false && !p.path.includes(":"),
  );
}

/** Build one `<url>` block. */
function sitemapUrl(loc: string, lastmod: string, changefreq: string, priority: number): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority.toFixed(1)}</priority>\n  </url>`;
}

/** Wrap `<url>` blocks in a complete urlset document. */
export function wrapUrlset(urls: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

/**
 * Build the main sitemap XML from the registry.
 * @param lastmod  ISO date (YYYY-MM-DD) used as lastmod for every URL.
 * @param siteUrl  Origin to prefix paths with (defaults to SITE_URL).
 * @param include  Optional predicate to drop pages (e.g. admin index/sitemap overrides).
 *                 Return false to exclude a page. Defaults to including every eligible page.
 */
export function buildSitemapXml(params: {
  lastmod: string;
  siteUrl?: string;
  include?: (page: PageRegistryEntry) => boolean;
}): string {
  const site = params.siteUrl ?? SITE_URL;
  const urls = getSitemapPages()
    .filter((p) => (params.include ? params.include(p) : true))
    .map((p) =>
      sitemapUrl(
        `${site}${p.path}`,
        params.lastmod,
        p.changefreq ?? DEFAULT_SITEMAP_CHANGEFREQ,
        p.priority ?? DEFAULT_SITEMAP_PRIORITY,
      ),
    );
  return wrapUrlset(urls);
}

/* ────────────────────────────────────────────────────────────────────────────
 * Structured data (JSON-LD) builders — keep page schemas consistent with the
 * site-level @graph rendered statically in index.html.
 * ──────────────────────────────────────────────────────────────────────────── */

export function buildOrganizationSchema() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: BRAND.name,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: BRAND.logo },
    description: BRAND.description,
    email: BRAND.email,
    founder: {
      "@type": "Person",
      "@id": BRAND.founder.id,
      name: BRAND.founder.name,
      jobTitle: BRAND.founder.jobTitle,
    },
  } as const;
}

export function buildWebSiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: BRAND.name,
    publisher: { "@id": `${SITE_URL}/#organization` },
  } as const;
}

/** The full site-level @graph (Organization + WebSite). Mirrors index.html. */
export function buildSiteGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [buildOrganizationSchema(), buildWebSiteSchema()],
  } as const;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Admin SEO override data model
 * ──────────────────────────────────────────────────────────────────────────── */

/** SEO data shape stored under siteContent.section = `seo:<slug>`. */
export interface PageSEOData {
  // Indexability
  index?: boolean;            // default true
  follow?: boolean;           // default true
  sitemap?: boolean;          // default true

  // Core meta
  title?: string;
  description?: string;
  canonical?: string;         // absolute URL or path starting with /

  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: "website" | "article";

  // Twitter
  twitterCard?: "summary" | "summary_large_image";
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;

  // Structured data (raw JSON-LD as string for free-form editing)
  schema?: string;

  // AI / AEO / GEO (light support — fields available for ranking optimization)
  primaryTopic?: string;
  searchIntent?: string;
  aiSummary?: string;
  entityMentions?: string;    // comma-separated
  keyConcepts?: string;       // comma-separated
  geoRelevance?: string;
  faq?: Array<{ q: string; a: string }>;
}

export const SEO_SECTION_PREFIX = "seo:";
export const seoSectionKey = (slug: string) => `${SEO_SECTION_PREFIX}${slug}`;
