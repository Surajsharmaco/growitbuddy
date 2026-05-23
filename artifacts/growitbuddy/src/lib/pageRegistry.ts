/**
 * Single source of truth for all SEO-managed public pages.
 * - `slug` matches the PageGate slug used in App.tsx and the storage key (seo:<slug>)
 * - `path` is the actual URL path on growitbuddy.com
 * - `defaults` are the fallback meta values when admin hasn't overridden them
 *
 * Add new pages here when they need SEO control.
 */

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
}

export const PAGE_REGISTRY: PageRegistryEntry[] = [
  // Core
  { slug: "home",             path: "/",                 label: "Home",                group: "Core",     defaults: { title: "GrowitBuddy — Premium Creator Agency",                              description: "We help creators and brands grow with content, distribution, and authority systems." } },
  { slug: "about",            path: "/about",            label: "About",               group: "Core",     defaults: { title: "About GrowitBuddy",                                                 description: "Learn about the GrowitBuddy team, mission, and how we help creators scale." } },
  { slug: "contact",          path: "/contact",          label: "Contact",             group: "Core",     defaults: { title: "Contact GrowitBuddy",                                               description: "Get in touch with the GrowitBuddy team." } },
  { slug: "insights",         path: "/insights",         label: "Insights / Blog",     group: "Core",     defaults: { title: "GrowitBuddy Insights",                                              description: "Strategies, frameworks, and lessons from running a modern creator agency." } },

  // Services
  { slug: "services",         path: "/services",         label: "Services",            group: "Services", defaults: { title: "Services — GrowitBuddy",                                            description: "Content, distribution, and growth services for creators and brands." } },
  { slug: "work",             path: "/work",             label: "Work / Case Studies", group: "Services", defaults: { title: "Our Work — GrowitBuddy",                                            description: "Real results from the brands and creators we've worked with." } },
  { slug: "framework",        path: "/framework",        label: "Framework",           group: "Services", defaults: { title: "The GrowitBuddy Framework",                                         description: "Our 4-step framework: Positioning, Production, Distribution, Inbound Demand." } },
  { slug: "authority-audit",  path: "/authority-audit",  label: "Authority Audit",     group: "Services", defaults: { title: "Authority Audit — GrowitBuddy",                                     description: "Free authority audit to identify content and distribution gaps." } },

  // Network & Hiring
  { slug: "influencers",      path: "/influencers",      label: "Influencers",         group: "Network",  defaults: { title: "Influencer Network — GrowitBuddy",                                  description: "Explore our network of vetted creators and influencers." } },
  { slug: "distribution",     path: "/distribution",     label: "Distribution Network",group: "Network",  defaults: { title: "Distribution Network — GrowitBuddy",                                description: "Our owned distribution network of pages and creators." } },
  { slug: "join",             path: "/join",             label: "Join Network",        group: "Network",  defaults: { title: "Join the Network — GrowitBuddy",                                    description: "Join the GrowitBuddy creator and page-owner network." } },
  { slug: "creators",         path: "/creators",         label: "Creators",            group: "Network",  defaults: { title: "Creators — GrowitBuddy",                                            description: "Resources and opportunities for creators with GrowitBuddy." } },
  { slug: "career",           path: "/career",           label: "Careers (Unified)",   group: "Network",  defaults: { title: "Careers — GrowitBuddy",                                             description: "Join GrowitBuddy as a full-time team member, intern, or talent network member." } },

  // Talent Pools
  { slug: "creator-school",       path: "/editors-pool",          label: "Editors Pool",        group: "Pools", defaults: { title: "Video Editors Pool — GrowitBuddy",                              description: "Join the GrowitBuddy editors pool. Watch the demo, access resources, and submit your work." } },
  { slug: "video-editors",        path: "/video-editors",         label: "Video Editors",       group: "Pools", defaults: { title: "Video Editors Pool — GrowitBuddy",                              description: "Join the GrowitBuddy video editors talent pool." } },
  { slug: "designers-pool",       path: "/designers-pool",        label: "Designers Pool",      group: "Pools", defaults: { title: "Designers Pool — GrowitBuddy",                                  description: "Join the GrowitBuddy designers talent pool." } },
  { slug: "thumbnail-designers",  path: "/thumbnail-designers",   label: "Thumbnail Designers", group: "Pools", defaults: { title: "Thumbnail Designers Pool — GrowitBuddy",                        description: "Join the GrowitBuddy thumbnail designers talent pool." } },
  { slug: "writers-pool",         path: "/writers-pool",          label: "Writers Pool",        group: "Pools", defaults: { title: "Writers Pool — GrowitBuddy",                                    description: "Join the GrowitBuddy writers talent pool." } },
  { slug: "social-media-managers",path: "/social-media-managers", label: "Social Media Managers",group: "Pools",defaults: { title: "Social Media Managers Pool — GrowitBuddy",                      description: "Join the GrowitBuddy social media managers talent pool." } },
  { slug: "motion-designers",     path: "/motion-designers",      label: "Motion Designers",    group: "Pools", defaults: { title: "Motion Designers Pool — GrowitBuddy",                           description: "Join the GrowitBuddy motion designers talent pool." } },
  { slug: "ai-creators",          path: "/ai-creators",           label: "AI Creators",         group: "Pools", defaults: { title: "AI Creators Pool — GrowitBuddy",                                description: "Join the GrowitBuddy AI creators talent pool." } },
  { slug: "ugc-creators",         path: "/ugc-creators",          label: "UGC Creators",        group: "Pools", defaults: { title: "UGC Creators Pool — GrowitBuddy",                               description: "Join the GrowitBuddy UGC creators talent pool." } },
  { slug: "meme-designers",       path: "/meme-designers",        label: "Meme Designers",      group: "Pools", defaults: { title: "Meme Designers Pool — GrowitBuddy",                             description: "Join the GrowitBuddy meme designers talent pool." } },

  // Additional public pages
  { slug: "resources",            path: "/resources",             label: "Resources",           group: "Core",     defaults: { title: "Resources — GrowitBuddy",                                       description: "Free guides, templates, and resources for creators and brands." } },
  { slug: "join-page-owner",      path: "/join/page-owner",       label: "Join · Page Owner",   group: "Network",  defaults: { title: "Join as a Page Owner — GrowitBuddy",                            description: "Apply to join the GrowitBuddy distribution network as a page owner." } },

  // Legal — indexed by default (trust signal); admin can flip
  { slug: "privacy",              path: "/privacy",               label: "Privacy Policy",      group: "Legal",    defaults: { title: "Privacy Policy — GrowitBuddy",                                  description: "GrowitBuddy privacy policy and how we handle your data." } },
  { slug: "terms",                path: "/terms",                 label: "Terms of Service",    group: "Legal",    defaults: { title: "Terms of Service — GrowitBuddy",                                description: "GrowitBuddy terms of service." } },

  // Utility — default noindex (not meant for search)
  { slug: "portfolio",            path: "/portfolio",             label: "Portfolio",           group: "Utility",  defaults: { title: "Portfolio — GrowitBuddy",                                       description: "Client portfolio.", index: false, sitemap: false } },
  { slug: "verify",               path: "/verify",                label: "Verify Certificate",  group: "Utility",  defaults: { title: "Verify Certificate — GrowitBuddy",                              description: "Verify a GrowitBuddy certificate.", index: false, sitemap: false } },
  { slug: "verify-id",            path: "/verify/:id",            label: "Verify Detail",       group: "Utility",  defaults: { title: "Certificate Verification — GrowitBuddy",                        description: "Verify a specific certificate.", index: false, sitemap: false } },
];

/** Match an actual URL pathname → registry entry (handles dynamic /insights/:slug). */
export function findEntryByPath(pathname: string): PageRegistryEntry | null {
  // exact match first
  const exact = PAGE_REGISTRY.find((p) => p.path === pathname);
  if (exact) return exact;
  // insights detail pages share insights SEO defaults
  if (pathname.startsWith("/insights/")) return PAGE_REGISTRY.find((p) => p.slug === "insights") ?? null;
  // /verify/:id → verify-id entry
  if (/^\/verify\/[^/]+$/.test(pathname)) return PAGE_REGISTRY.find((p) => p.slug === "verify-id") ?? null;
  return null;
}

export function findEntryBySlug(slug: string): PageRegistryEntry | null {
  return PAGE_REGISTRY.find((p) => p.slug === slug) ?? null;
}

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
