export interface FullTimePageData {
  heroLabel: string;
  heroHeadline: string;
  heroSubtext: string;
  perksHeadline: string;
  perks: string[];
  rolesLabel: string;
  roles: string[];
  formHeadline: string;
  formSubtext: string;
  formSuccessHeadline: string;
  formSuccessSubtext: string;
}

export const FULLTIME_DEFAULTS: FullTimePageData = {
  heroLabel: "Careers at GrowitBuddy",
  heroHeadline: "Build modern authority systems with us.",
  heroSubtext: "We're building a high-output creative ecosystem for founders, creators, and brands - and we're looking for ambitious people who want to do meaningful work.",
  perksHeadline: "Why join full-time?",
  perks: [
    "Flexible remote-first work environment",
    "Work directly on creator and authority systems",
    "High ownership and creative impact",
    "Access to modern workflows, systems, and frameworks",
    "Opportunities to grow across multiple creative disciplines",
  ],
  rolesLabel: "Open Roles",
  roles: [
    "Content Strategist",
    "Video Editor",
    "Graphic Designer",
    "Motion Designer",
    "Thumbnail Designer",
    "Copywriter",
    "Social Media Manager",
    "Distribution Specialist",
    "AI Automation Specialist",
    "Web & Funnel Designer",
    "Community Manager",
    "Operations Coordinator",
  ],
  formHeadline: "Apply for a full-time role",
  formSubtext: "We review every application. Expect a response within 7 business days.",
  formSuccessHeadline: "Application received.",
  formSuccessSubtext: "We review every application carefully. If you are a fit, we will reach out within 7 business days.",
};
