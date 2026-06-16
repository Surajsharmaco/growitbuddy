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
}

export interface ServicesStat { num: string; label: string; }

export interface ServicesData {
  heroHeadline: string;
  heroSubtext: string;
  heroCTA: string;
  headline: string;
  subtext: string;
  stats: ServicesStat[];
  services: ServiceItem[];
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
    },
    {
      id: "2",
      title: "Content Creation",
      subtitle: "02 | Authority Production",
      headline: "Content systems built for scale.",
      description: "High-volume content systems designed to build visibility, trust, and long-term authority across modern platforms.",
      features: ["Short-form Editing", "Long-form Editing", "Podcast Editing", "Script Writing", "Thumbnail Design", "Content Repurposing", "Social Media Content", "UGC Content", "YouTube Content", "Creative Direction"],
      cta: "Build Visibility",
    },
    {
      id: "3",
      title: "Distribution & Growth",
      subtitle: "03 | Amplification Systems",
      headline: "Distribution infrastructure that amplifies reach.",
      description: "Distribution infrastructure designed to amplify reach, compound attention, and generate inbound demand.",
      features: ["Distribution Campaigns", "Influencer Campaigns", "Meta Ads", "Google Ads", "Lead Generation", "Newsletter Systems", "Viral Distribution", "Growth Systems", "YouTube Distribution", "Community Growth", "Clipping"],
      cta: "Scale Reach",
    },
    {
      id: "4",
      title: "Web & Funnel Systems",
      subtitle: "04 | Digital Infrastructure",
      headline: "Digital systems that convert authority into demand.",
      description: "Digital systems built to convert authority into inbound leads, trust, and scalable opportunities.",
      features: ["Website Development", "Landing Pages", "CRM Integration", "Admin Dashboards", "Booking Systems", "Client Portals", "Funnel Systems", "Ecommerce Websites", "UI/UX Systems", "Conversion Optimization"],
      cta: "Launch Systems",
    },
    {
      id: "5",
      title: "AI Automation",
      subtitle: "05 | AI Authority Systems",
      headline: "AI systems that power inbound authority.",
      description: "AI-powered systems that automate communication, support, lead flow, and creator operations.",
      features: ["AI Chatbots", "AI Voice Agents", "WhatsApp AI Systems", "Lead Qualification AI", "Custom AI Agents", "AI Customer Support", "Workflow Automation", "CRM Automation", "AI Content Systems", "Internal AI Tools"],
      cta: "Automate Growth",
    },
    {
      id: "6",
      title: "Digital Products & Growth",
      subtitle: "06 | Monetization Systems",
      headline: "Launch and scale your authority ecosystem.",
      description: "Systems designed to help creators and brands monetize attention through products, communities, and scalable offers.",
      features: ["Course Launches", "Ebook Systems", "Community Growth", "Email Marketing", "Creator Monetization", "Membership Funnels", "Webinar Funnels", "Digital Products", "Paid Communities", "Distribution Systems"],
      cta: "Scale Authority",
    },
  ],
};
