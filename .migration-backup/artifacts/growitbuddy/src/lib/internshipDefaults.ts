export interface InternshipPageData {
  heroLabel: string;
  heroHeadline: string;
  heroSubtext: string;
  perksHeadline: string;
  perks: string[];
  idealForTitle: string;
  idealFor: string[];
  formHeadline: string;
  formSubtext: string;
  formSuccessHeadline: string;
  formSuccessSubtext: string;
}

export const INTERNSHIP_DEFAULTS: InternshipPageData = {
  heroLabel: "Creator Internship",
  heroHeadline: "Start building real-world experience.",
  heroSubtext: "Work alongside creators, brands, and modern content systems while learning through execution - not theory.",
  perksHeadline: "What you'll experience.",
  perks: [
    "Real projects with practical execution",
    "Structured feedback and collaborative workflows",
    "Exposure to modern creator and authority systems",
    "Opportunities to build your portfolio with shipped work",
    "A path toward freelance, creator, or full-time opportunities",
  ],
  idealForTitle: "Ideal For",
  idealFor: [
    "Creators starting their journey",
    "People who want hands-on experience instead of only tutorials",
    "Early-stage creatives looking to sharpen real-world skills",
    "Ambitious individuals who want to grow through execution",
  ],
  formHeadline: "Apply for Internship",
  formSubtext: "We read every application. If you're a fit, we'll be in touch.",
  formSuccessHeadline: "Application received.",
  formSuccessSubtext: "We'll review it and get back to you within a few days.",
};
