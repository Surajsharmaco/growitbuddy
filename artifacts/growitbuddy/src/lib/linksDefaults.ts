export interface LinkItem {
  id: string;
  label: string;
  sublabel?: string;
  url: string;
  thumbnailUrl?: string;
  featured?: boolean;
  enabled?: boolean;
}

export interface SocialItem {
  id: string;
  platform: string;
  url: string;
}

export interface LinksData {
  profileName: string;
  username: string;
  bio: string;
  avatarUrl: string;
  verified: boolean;
  theme: "dark" | "light";
  accentColor: string;
  socials: SocialItem[];
  links: LinkItem[];
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

export const LINKS_DEFAULTS: LinksData = {
  profileName: "GrowitBuddy",
  username: "@growitbuddy",
  bio: "We help creators and brands grow with content, distribution, and a network that delivers real results.",
  avatarUrl: "",
  verified: true,
  theme: "dark",
  accentColor: "#C9A227",
  socials: [
    { id: "s1", platform: "instagram", url: "https://instagram.com/growitbuddy" },
    { id: "s2", platform: "youtube", url: "https://youtube.com/@growitbuddy" },
    { id: "s3", platform: "x", url: "https://x.com/growitbuddy" },
    { id: "s4", platform: "email", url: "hello@growitbuddy.com" },
  ],
  links: [
    { id: "l1", label: "Book a Free Strategy Call", sublabel: "30 min, no strings attached", url: "/contact", featured: true, enabled: true },
    { id: "l2", label: "Work With Our Influencers", sublabel: "Browse our creator network", url: "/influencers", enabled: true },
    { id: "l3", label: "Distribution Network", sublabel: "Reach millions across our pages", url: "/distribution", enabled: true },
    { id: "l4", label: "Explore Our Services", sublabel: "See what we can do for you", url: "/services", enabled: true },
    { id: "l5", label: "Read the Blog", sublabel: "Growth playbooks & insights", url: "/insights", enabled: true },
  ],
  footerNote: "",
};
