export interface FreelancersPageData {
  heroLabel: string;
  heroHeadline: string;
  heroSubtext: string;
  perksHeadline: string;
  perks: string[];
  notForEveryoneTitle: string;
  notForEveryone: string[];
  formHeadline: string;
  formSubtext: string;
  formSuccessHeadline: string;
  formSuccessSubtext: string;
}

export const FREELANCERS_DEFAULTS: FreelancersPageData = {
  heroLabel: "Talent Network",
  heroHeadline: "Join the creator network behind modern authority brands.",
  heroSubtext: "Work on real projects, collaborate with creators and brands, and become part of a long-term creative ecosystem - not random one-off gigs.",
  perksHeadline: "What You Get.",
  perks: [
    "Real-world creator and brand projects",
    "Consistent freelance and collaboration opportunities",
    "Access to systems, workflows, and creative resources",
    "Opportunities across content, design, AI, and growth",
    "Long-term relationships inside the GrowitBuddy ecosystem",
  ],
  notForEveryoneTitle: "Built for creators who want to grow",
  notForEveryone: [
    "Creative people serious about improving their craft",
    "Freelancers looking for meaningful long-term opportunities",
    "Creators who value consistency, quality, and execution",
    "Talent interested in building real-world experience and relationships",
  ],
  formHeadline: "Apply for the Talent Network",
  formSubtext: "Selection is performance-based. Apply now and prove your work.",
  formSuccessHeadline: "Application received.",
  formSuccessSubtext: "We review applications based on performance. If you make the cut, we'll be in touch within 7 business days.",
};
