export interface LinkItem {
  id: string;
  label: string;
  sublabel?: string;
  url: string;
  thumbnailUrl?: string;
  featured?: boolean;
  enabled?: boolean;
  /**
   * How this single link renders inside a "list" layout section:
   * - "normal": compact row (icon/thumbnail left, text right) - the default.
   * - "large":  big thumbnail on top with the title + subtitle below it.
   * - "image":  just the big thumbnail, no text.
   */
  display?: "normal" | "large" | "image";
}

export interface SocialItem {
  id: string;
  platform: string;
  url: string;
}

/** The block types the link page can be composed of. */
export type SectionType =
  | "links"
  | "socials"
  | "video"
  | "text"
  | "image"
  | "spacer";

interface BaseSection {
  id: string;
  type: SectionType;
  /** Hide/show the whole section. Treat `undefined` as visible. */
  enabled?: boolean;
  /** Optional small heading shown above the section. */
  title?: string;
}

export interface LinksSection extends BaseSection {
  type: "links";
  layout?: "list" | "grid";
  items: LinkItem[];
}

export interface SocialsSection extends BaseSection {
  type: "socials";
  socials: SocialItem[];
}

export interface VideoSection extends BaseSection {
  type: "video";
  /** YouTube / Vimeo / Drive / Gumlet link, an embed snippet, or a raw mp4/webm/ogg URL. */
  videoUrl: string;
  caption?: string;
}

export interface TextSection extends BaseSection {
  type: "text";
  heading?: string;
  body?: string;
  align?: "left" | "center";
}

export interface ImageSection extends BaseSection {
  type: "image";
  imageUrl: string;
  /** Optional click-through link. */
  linkUrl?: string;
  caption?: string;
  rounded?: boolean;
}

export interface SpacerSection extends BaseSection {
  type: "spacer";
  size?: "sm" | "md" | "lg";
}

export type LinkSection =
  | LinksSection
  | SocialsSection
  | VideoSection
  | TextSection
  | ImageSection
  | SpacerSection;

export interface LinksData {
  /** Bumped to 2 when the page moved from fixed sections to the block model. */
  schemaVersion?: number;
  profileName: string;
  username: string;
  bio: string;
  avatarUrl: string;
  verified: boolean;
  accentColor: string;
  sections: LinkSection[];
  footerNote: string;
}

export const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "x", label: "X (Twitter)" },
  { key: "tiktok", label: "TikTok" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "facebook", label: "Facebook" },
  { key: "threads", label: "Threads" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "telegram", label: "Telegram" },
  { key: "snapchat", label: "Snapchat" },
  { key: "github", label: "GitHub" },
  { key: "website", label: "Website" },
  { key: "email", label: "Email" },
] as const;

/** Human label + short helper text for each block type (used by the admin picker). */
export const SECTION_TYPES: { key: SectionType; label: string; hint: string }[] = [
  { key: "links", label: "Link buttons", hint: "A group of tappable link buttons" },
  { key: "video", label: "Video", hint: "Embed a YouTube, Vimeo, Drive or uploaded video" },
  { key: "text", label: "Text", hint: "A heading and/or paragraph" },
  { key: "image", label: "Image", hint: "A banner image, optionally clickable" },
  { key: "socials", label: "Social icons", hint: "A row of social media icons" },
  { key: "spacer", label: "Spacer", hint: "Add vertical breathing room" },
];

/**
 * Normalize a user-entered URL so it always opens correctly.
 * - Empty -> "".
 * - Internal/relative links (start with /, #, ?) kept as-is so in-app routes work.
 * - http(s)/mailto/tel kept as-is.
 * - "user@x.com" (email-like) -> mailto:
 * - Otherwise (bare domain like example.com) -> prepend https://
 */
export function normalizeLinkUrl(raw: string | undefined): string {
  const v = (raw || "").trim();
  if (!v) return "";
  if (/^[/#?]/.test(v)) return v;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(v)) return v;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
  return `https://${v}`;
}

// ── ID + factory helpers ──────────────────────────────────────────────
let _uidSeq = 0;
export function uid(prefix = "id"): string {
  _uidSeq += 1;
  return `${prefix}_${Date.now().toString(36)}${_uidSeq.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export function createLinkItem(): LinkItem {
  return { id: uid("lnk"), label: "", sublabel: "", url: "", thumbnailUrl: "", featured: false, enabled: true, display: "normal" };
}

export function createSocialItem(): SocialItem {
  return { id: uid("soc"), platform: "instagram", url: "" };
}

export function createSection(type: SectionType): LinkSection {
  const base = { id: uid("sec"), enabled: true, title: "" };
  switch (type) {
    case "links":
      return { ...base, type, layout: "list", items: [createLinkItem()] };
    case "socials":
      return { ...base, type, socials: [createSocialItem()] };
    case "video":
      return { ...base, type, videoUrl: "", caption: "" };
    case "text":
      return { ...base, type, heading: "", body: "", align: "left" };
    case "image":
      return { ...base, type, imageUrl: "", linkUrl: "", caption: "", rounded: true };
    case "spacer":
      return { ...base, type, title: "", size: "md" };
  }
}

// ── Defensive normalizers (tolerate partial/legacy/malformed data) ─────
type Raw = Record<string, unknown>;
function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function normalizeLink(l: unknown): LinkItem {
  const r = (l && typeof l === "object" ? l : {}) as Raw;
  return {
    id: str(r.id) || uid("lnk"),
    label: str(r.label),
    sublabel: str(r.sublabel),
    url: str(r.url),
    thumbnailUrl: str(r.thumbnailUrl),
    featured: r.featured === true,
    enabled: r.enabled !== false,
    display: r.display === "large" ? "large" : r.display === "image" ? "image" : "normal",
  };
}

function normalizeSocial(s: unknown): SocialItem {
  const r = (s && typeof s === "object" ? s : {}) as Raw;
  return {
    id: str(r.id) || uid("soc"),
    platform: str(r.platform, "instagram"),
    url: str(r.url),
  };
}

function normalizeSection(s: unknown): LinkSection | null {
  if (!s || typeof s !== "object") return null;
  const r = s as Raw;
  const id = str(r.id) || uid("sec");
  const enabled = r.enabled !== false;
  const title = str(r.title);
  switch (r.type) {
    case "links":
      return {
        id, type: "links", enabled, title,
        layout: r.layout === "grid" ? "grid" : "list",
        items: Array.isArray(r.items) ? r.items.map(normalizeLink) : [],
      };
    case "socials":
      return {
        id, type: "socials", enabled, title,
        socials: Array.isArray(r.socials) ? r.socials.map(normalizeSocial) : [],
      };
    case "video":
      return { id, type: "video", enabled, title, videoUrl: str(r.videoUrl), caption: str(r.caption) };
    case "text":
      return {
        id, type: "text", enabled, title,
        heading: str(r.heading), body: str(r.body),
        align: r.align === "center" ? "center" : "left",
      };
    case "image":
      return {
        id, type: "image", enabled, title,
        imageUrl: str(r.imageUrl), linkUrl: str(r.linkUrl), caption: str(r.caption),
        rounded: r.rounded !== false,
      };
    case "spacer":
      return { id, type: "spacer", enabled, title: "", size: r.size === "sm" ? "sm" : r.size === "lg" ? "lg" : "md" };
    default:
      return null;
  }
}

export const LINKS_DEFAULTS: LinksData = {
  schemaVersion: 2,
  profileName: "GrowitBuddy",
  username: "@growitbuddy",
  bio: "We help creators and brands grow with content, distribution, and a network that delivers real results.",
  avatarUrl: "",
  verified: true,
  accentColor: "#C2A878",
  sections: [
    {
      id: "sec_socials",
      type: "socials",
      enabled: true,
      title: "",
      socials: [
        { id: "s1", platform: "instagram", url: "https://instagram.com/growitbuddy" },
        { id: "s2", platform: "youtube", url: "https://youtube.com/@growitbuddy" },
        { id: "s3", platform: "x", url: "https://x.com/growitbuddy" },
        { id: "s4", platform: "email", url: "cs.growitbuddy@gmail.com" },
      ],
    },
    {
      id: "sec_links",
      type: "links",
      enabled: true,
      title: "",
      layout: "list",
      items: [
        { id: "l1", label: "Book a Free Strategy Call", sublabel: "30 min, no strings attached", url: "/contact", featured: true, enabled: true },
        { id: "l2", label: "Work With Our Influencers", sublabel: "Browse our creator network", url: "/influencers", enabled: true },
        { id: "l3", label: "Distribution Network", sublabel: "Reach millions across our pages", url: "/distribution", enabled: true },
        { id: "l4", label: "Explore Our Services", sublabel: "See what we can do for you", url: "/services", enabled: true },
        { id: "l5", label: "Read the Blog", sublabel: "Growth playbooks & insights", url: "/blog", enabled: true },
      ],
    },
  ],
  footerNote: "",
};

/**
 * Normalize any stored/merged content row into the v2 block model.
 *
 * Backward compatibility: pre-v2 rows stored flat `links` + `socials` arrays and
 * NO `sections`. `usePublicContent` shallow-merges `LINKS_DEFAULTS` into fetched
 * rows, so a legacy row would otherwise pick up the DEFAULT sections (and even a
 * default `schemaVersion`). We therefore detect legacy data by the presence of
 * top-level `links`/`socials` keys - which v2 NEVER persists - and synthesize the
 * sections from them so no saved content is ever lost.
 */
export function migrateLinksData(raw: unknown): LinksData {
  const r = (raw && typeof raw === "object" ? raw : {}) as Raw;

  const profile = {
    profileName: str(r.profileName, LINKS_DEFAULTS.profileName),
    username: str(r.username, LINKS_DEFAULTS.username),
    bio: str(r.bio, LINKS_DEFAULTS.bio),
    avatarUrl: str(r.avatarUrl),
    verified: r.verified === undefined ? LINKS_DEFAULTS.verified : r.verified === true,
    accentColor: str(r.accentColor) || LINKS_DEFAULTS.accentColor,
    footerNote: str(r.footerNote),
  };

  const isLegacy = Array.isArray(r.links) || Array.isArray(r.socials);
  if (isLegacy) {
    // Deterministic IDs: migrate runs on every public render, so stable ids
    // keep React from remounting the synthesized sections each time.
    const sections: LinkSection[] = [];
    if (Array.isArray(r.socials) && r.socials.length) {
      sections.push({ id: "legacy_socials", type: "socials", enabled: true, title: "", socials: r.socials.map(normalizeSocial) });
    }
    if (Array.isArray(r.links) && r.links.length) {
      sections.push({ id: "legacy_links", type: "links", enabled: true, title: "", layout: "list", items: r.links.map(normalizeLink) });
    }
    return { schemaVersion: 2, ...profile, sections };
  }

  const sections = Array.isArray(r.sections)
    ? (r.sections.map(normalizeSection).filter(Boolean) as LinkSection[])
    : LINKS_DEFAULTS.sections;

  return { schemaVersion: 2, ...profile, sections };
}
