export interface NetworkFormContent {
  seoTitle: string;
  seoDesc: string;
  eyebrow: string;
  hero: string;
  heroSubtext: string;
  sectionTitle: string;
  benefits: string[];
  calloutLabel: string;
  calloutItems: string[];
  formTitle: string;
  formSubtitle: string;
  submitLabel: string;
  successMsg: string;
}

export const CREATORS_FORM_DEFAULTS: NetworkFormContent = {
  seoTitle: "Influencer Network - GrowitBuddy",
  seoDesc:
    "Join the GrowitBuddy Influencer Network. Built for serious creators who want real authority, meaningful opportunities, and long-term growth.",
  eyebrow: "Influencer Network",
  hero: "Join the Influencer Network.",
  heroSubtext:
    "Connect, grow, and unlock opportunities. We work with creators who want to build real authority and long-term growth, not just chase views.",
  sectionTitle: "What You Get.",
  benefits: [
    "Growth-focused guidance built around your platform",
    "Collaboration opportunities with serious creators",
    "Access to brand and content opportunities",
    "Strategic support to build lasting authority",
    "A network of creators focused on long-term growth",
  ],
  calloutLabel: "Built for serious creators",
  calloutItems: [
    "Influencers focused on growth and long-term opportunities",
    "Personal brands building real authority in their space",
    "Content creators who want more than just views",
  ],
  formTitle: "Join the Network",
  formSubtitle: "Takes less than 2 minutes. Every application is reviewed personally.",
  submitLabel: "Join the Influencer Network",
  successMsg:
    "We review every application personally. If you're a fit for the Influencer Network, we'll be in touch within 48 hours.",
};

export const PAGE_OWNER_FORM_DEFAULTS: NetworkFormContent = {
  seoTitle: "Join Distribution Network - GrowitBuddy",
  seoDesc:
    "Apply to join the GrowitBuddy Distribution Network as a meme or theme page owner and distribute premium content at scale.",
  eyebrow: "Distribution Network",
  hero: "Join the Distribution Network.",
  heroSubtext:
    "Partner with us to distribute premium content through your page. We work with serious meme and theme page owners who have real, engaged audiences.",
  sectionTitle: "What You Get.",
  benefits: [
    "Consistent high-quality content for your page",
    "Monetise your audience with premium campaigns",
    "Access to brand and content partnerships",
    "Support from a dedicated distribution team",
    "Part of a growing network of high-reach pages",
  ],
  calloutLabel: "Built for page owners",
  calloutItems: [
    "Meme and theme pages with real engagement",
    "Pages focused on consistent content and growth",
    "Page owners who want long-term partnerships",
  ],
  formTitle: "Apply as Page Owner",
  formSubtitle: "Takes less than 2 minutes. Every application is reviewed personally.",
  submitLabel: "Apply as Page Owner",
  successMsg: "Your application has been received. Our team will review and get back to you.",
};
