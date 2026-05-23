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
  group: "Core" | "Services" | "Network" | "Pools" | "Legal";
  defaults: {
    title: string;
    description: string;
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
  { slug: "freelancers",      path: "/freelancers",      label: "Freelancers",         group: "Network",  defaults: { title: "Freelancers — GrowitBuddy",                                         description: "Join the GrowitBuddy freelancer network." } },
  { slug: "full-time",        path: "/full-time",        label: "Full-Time Roles",     group: "Network",  defaults: { title: "Full-Time Careers — GrowitBuddy",                                   description: "Full-time positions at GrowitBuddy." } },

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
];

/** Match an actual URL pathname → registry entry (handles dynamic /insights/:slug). */
export function findEntryByPath(pathname: string): PageRegistryEntry | null {
  // exact match first
  const exact = PAGE_REGISTRY.find((p) => p.path === pathname);
  if (exact) return exact;
  // insights detail pages share insights SEO defaults
  if (pathname.startsWith("/insights/")) return PAGE_REGISTRY.find((p) => p.slug === "insights") ?? null;
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
