import { FOOTER_DEFAULTS } from "./footerDefaults";

export interface NavbarData {
  logo: string;
  ctaLabel: string;
  ctaPath: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  youtube: string;
}

export const NAVBAR_DEFAULTS: NavbarData = {
  logo: "GrowitBuddy",
  ctaLabel: "Book a Call",
  ctaPath: "https://cal.com/growitbuddy.com/growth-strategy-call",
  instagram: FOOTER_DEFAULTS.instagram,
  linkedin: FOOTER_DEFAULTS.linkedin,
  twitter: FOOTER_DEFAULTS.twitter,
  youtube: FOOTER_DEFAULTS.youtube,
};
