// Page Variants - registry of source pages that can be "duplicated" at a new
// URL. Each variant clones one of these pages (same React component, same
// design) but reads its content from a namespaced site_content key so the
// admin can edit each section independently per variant.
//
// To add a new source page: add an entry here AND a route mapping in
// VariantResolver.tsx so the slug resolves to the right component.

export interface VariantSource {
  key: string;        // siteContent key (e.g. "home", "about")
  label: string;      // Human label shown in admin dropdown
  basePath: string;   // Public URL of the original page
  adminPath: string;  // Admin edit URL for this page
}

export const VARIANT_SOURCES: VariantSource[] = [
  { key: "home",                    label: "Home Page",                  basePath: "/",                       adminPath: "/admin/home" },
  { key: "about",                   label: "About",                      basePath: "/about",                  adminPath: "/admin/about" },
  { key: "services",                label: "Services",                   basePath: "/services",               adminPath: "/admin/services" },
  { key: "framework",               label: "Framework",                  basePath: "/framework",              adminPath: "/admin/framework" },
  { key: "work",                    label: "Work",                       basePath: "/work",                   adminPath: "/admin/work" },
  { key: "blog",                    label: "Blog / Insights",            basePath: "/blog",                   adminPath: "/admin/blog" },
  { key: "resources",               label: "Resources",                  basePath: "/resources",              adminPath: "/admin/resources" },
  { key: "contact",                 label: "Contact",                    basePath: "/contact",                adminPath: "/admin/contact" },
  { key: "creators",                label: "Creators",                   basePath: "/creators",               adminPath: "/admin/creators" },
  { key: "joinnetwork",             label: "Join Network",               basePath: "/join",                   adminPath: "/admin/join-network" },
  { key: "career",                  label: "Careers Page",               basePath: "/career",                 adminPath: "/admin/career" },
  { key: "authority-audit",         label: "Authority Audit",            basePath: "/authority-audit",        adminPath: "/admin/authority-audit" },
  { key: "distribution-network",    label: "Distribution Network",       basePath: "/distribution",           adminPath: "/admin/distribution-network" },
  { key: "creator-school",          label: "Editors Pool",               basePath: "/editors-pool",           adminPath: "/admin/editors-pool" },
  { key: "pool-designers",          label: "Designers Pool",             basePath: "/designers-pool",         adminPath: "/admin/pool-designers" },
  { key: "pool-thumbnail-designers",label: "Thumbnail Designers Pool",   basePath: "/thumbnail-designers",    adminPath: "/admin/pool-thumbnail-designers" },
  { key: "pool-writers",            label: "Writers Pool",               basePath: "/writers-pool",           adminPath: "/admin/pool-writers" },
  { key: "pool-social-managers",    label: "Social Media Managers Pool", basePath: "/social-media-managers",  adminPath: "/admin/pool-social-managers" },
  { key: "pool-motion-designers",   label: "Motion Designers Pool",      basePath: "/motion-designers",       adminPath: "/admin/pool-motion-designers" },
  { key: "pool-ai-creators",        label: "AI Creators Pool",           basePath: "/ai-creators",            adminPath: "/admin/pool-ai-creators" },
  { key: "pool-ugc-creators",       label: "UGC Creators Pool",          basePath: "/ugc-creators",           adminPath: "/admin/pool-ugc-creators" },
  { key: "pool-meme-designers",     label: "Meme Designers Pool",        basePath: "/meme-designers",         adminPath: "/admin/pool-meme-designers" },
  { key: "pool-editors",            label: "Video Editors Pool",         basePath: "/video-editors",          adminPath: "/admin/pool-editors" },
];

export function findVariantSource(key: string): VariantSource | undefined {
  return VARIANT_SOURCES.find((s) => s.key === key);
}

// Namespaced content key for a variant. Matches server-side variantKey().
export function variantContentKey(sourceKey: string, slug: string): string {
  return `${sourceKey}__v__${slug}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
