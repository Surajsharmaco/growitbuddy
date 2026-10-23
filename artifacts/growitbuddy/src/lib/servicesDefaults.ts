export interface ServiceItem {
  id: string;
  title: string;
  subtitle?: string;
  headline: string;
  description: string;
  features: string[];
  badge?: string;
  note?: string;
  cta?: string;
  ctaHref?: string;
}

export interface ServicesStat { num: string; label: string; }

export interface OfflineServiceItem {
  enabled: boolean;
  categoryNumber: string;
  categoryLabel: string;
  title: string;
  description: string;
  tags: string[];
  cta: string;
  ctaHref: string;
}

export interface ServicesData {
  heroHeadline: string;
  heroSubtext: string;
  heroCTA: string;
  headline: string;
  subtext: string;
  stats: ServicesStat[];
  services: ServiceItem[];
  offlineService: OfflineServiceItem;
}

export const SERVICES_DEFAULTS: ServicesData = {
  heroHeadline: "The content systems behind authority and inbound demand.",
  heroSubtext: "We don't just create content. We build the content marketing infrastructure that turns your expertise into recognition, trust, and consistent inbound opportunities.",
  heroCTA: "Book a strategy call",
  headline: "What we build for you",
  subtext: "Four ways we help founders, creators, and brands build the authority that converts.",
  stats: [
    { num: "700M+", label: "Views Generated Across Content Networks" },
    { num: "250+",  label: "Founders & Brands Served" },
    { num: "90K+",  label: "Content Assets Created Across High-Volume Pages" },
  ],
  services: [
    {
      id: "1",
      title: "Personal Branding",
      subtitle: "01 | Positioning & Authority",
      headline: "Become recognized in your category.",
      description: "Authority positioning systems that help founders, creators, and brands become recognized voices in their category.",
      features: ["Founder Positioning", "LinkedIn Growth", "Instagram Growth", "Authority Strategy", "Thought Leadership", "Audience Positioning", "Brand Messaging", "Content Strategy", "Personal Branding", "Category Positioning"],
      cta: "Build Authority",
      ctaHref: "/contact",
    },
    {
      id: "2",
      title: "Content Creation",
      subtitle: "02 | Authority Production",
      headline: "Content systems built for scale.",
      description: "High-volume content systems designed to build visibility, trust, and long-term authority across modern platforms.",
      features: ["Short-form Editing", "Long-form Editing", "Podcast Editing", "Script Writing", "Thumbnail Design", "Content Repurposing", "Social Media Content", "UGC Content", "YouTube Content", "Creative Direction"],
      cta: "Build Visibility",
      ctaHref: "/contact",
    },
    {
      id: "3",
      title: "Distribution & Growth",
      subtitle: "03 | Amplification Systems",
      headline: "Distribution infrastructure that amplifies reach.",
      description: "Distribution infrastructure designed to amplify reach, compound attention, and generate inbound demand.",
      features: ["Distribution Campaigns", "Influencer Campaigns", "Meta Ads", "Google Ads", "Lead Generation", "Newsletter Systems", "Viral Distribution", "Growth Systems", "YouTube Distribution", "Community Growth", "Clipping"],
      cta: "Scale Reach",
      ctaHref: "/contact",
    },
    {
      id: "4",
      title: "Web & Funnel Systems",
      subtitle: "04 | Digital Infrastructure",
      headline: "Digital systems that convert authority into demand.",
      description: "Digital systems built to convert authority into inbound leads, trust, and scalable opportunities.",
      features: ["Website Development", "Landing Pages", "CRM Integration", "Admin Dashboards", "Booking Systems", "Client Portals", "Funnel Systems", "Ecommerce Websites", "UI/UX Systems", "Conversion Optimization"],
      cta: "Launch Systems",
      ctaHref: "/contact",
    },
    {
      id: "5",
      title: "AI Automation",
      subtitle: "05 | AI Authority Systems",
      headline: "AI systems that power inbound authority.",
      description: "AI-powered systems that automate communication, support, lead flow, and creator operations.",
      features: ["AI Chatbots", "AI Voice Agents", "WhatsApp AI Systems", "Lead Qualification AI", "Custom AI Agents", "AI Customer Support", "Workflow Automation", "CRM Automation", "AI Content Systems", "Internal AI Tools"],
      cta: "Automate Growth",
      ctaHref: "/contact",
    },
    {
      id: "6",
      title: "Digital Products & Growth",
      subtitle: "06 | Monetization Systems",
      headline: "Launch and scale your authority ecosystem.",
      description: "Systems designed to help creators and brands monetize attention through products, communities, and scalable offers.",
      features: ["Course Launches", "Ebook Systems", "Community Growth", "Email Marketing", "Creator Monetization", "Membership Funnels", "Webinar Funnels", "Digital Products", "Paid Communities", "Distribution Systems"],
      cta: "Scale Authority",
      ctaHref: "/contact",
    },
  ],
  offlineService: {
    enabled: true,
    categoryNumber: "07",
    categoryLabel: "LOCAL REACH & BRAND ACTIVATION",
    title: "Offline Advertising & Brand Activation",
    description: "Take your brand beyond the screen with campaigns people can see and experience, from outdoor media and transit branding to retail displays, print, events and on-ground activations.",
    tags: [
      "Auto Rickshaw Branding",
      "E-Rickshaw Branding",
      "Hoarding Advertising",
      "Billboard Advertising",
      "Metro Advertising",
      "Bus Branding",
      "Indoor Branding",
      "Office Branding",
      "Event Branding",
      "Exhibition Branding",
      "Brand Activation",
      "Mall Activation",
      "Standee & Banner Printing",
      "Pamphlet & Brochure Printing",
    ],
    cta: "Explore Services",
    // The dedicated page is not live yet; keep the CTA useful until it exists.
    ctaHref: "/contact",
  },
};

const ALLOWED_SERVICE_HREF_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

export function isValidServiceHref(value: string | undefined): boolean {
  const href = value?.trim() ?? "";
  if (!href || /[\u0000-\u0020]/.test(href)) return false;
  if (href.startsWith("#") || href.startsWith("?")) return true;

  try {
    if (href.startsWith("/") && !href.startsWith("//")) {
      return new URL(href, "https://growitbuddy.com").origin === "https://growitbuddy.com";
    }
    const parsed = new URL(href.startsWith("//") ? `https:${href}` : href);
    return ALLOWED_SERVICE_HREF_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

export function safeServiceHref(value: string | undefined, fallback: string): string {
  const href = value?.trim() ?? "";
  return isValidServiceHref(href) ? href : fallback;
}

export function isExternalServiceHref(href: string): boolean {
  return /^(https?:\/\/|\/\/|mailto:|tel:)/i.test(href);
}

export function normalizeOfflineService(value: unknown): OfflineServiceItem {
  const defaults = SERVICES_DEFAULTS.offlineService;
  const saved = value && typeof value === "object"
    ? value as Partial<OfflineServiceItem>
    : {};

  return {
    enabled: typeof saved.enabled === "boolean" ? saved.enabled : defaults.enabled,
    categoryNumber: typeof saved.categoryNumber === "string" ? saved.categoryNumber : defaults.categoryNumber,
    categoryLabel: typeof saved.categoryLabel === "string" ? saved.categoryLabel : defaults.categoryLabel,
    title: typeof saved.title === "string" ? saved.title : defaults.title,
    description: typeof saved.description === "string" ? saved.description : defaults.description,
    tags: Array.isArray(saved.tags)
      ? saved.tags.filter((tag): tag is string => typeof tag === "string")
      : [...defaults.tags],
    cta: typeof saved.cta === "string" ? saved.cta : defaults.cta,
    ctaHref: typeof saved.ctaHref === "string" ? saved.ctaHref : defaults.ctaHref,
  };
}
