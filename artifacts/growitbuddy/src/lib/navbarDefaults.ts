import { FOOTER_DEFAULTS } from "./footerDefaults";

export interface NavbarData {
  logo: string;
  ctaLabel: string;
  ctaPath: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  youtube: string;
  whatsappNumber: string;
  serviceHeroFormHeading: string;
  serviceHeroFormSubtitle: string;
  serviceHeroPrivacyMessage: string;
  serviceHeroPrivacyUrl: string;
}

export const NAVBAR_DEFAULTS: NavbarData = {
  logo: "GrowitBuddy",
  ctaLabel: "Book a Call",
  ctaPath: "https://cal.com/growitbuddy.com/growth-strategy-call",
  instagram: FOOTER_DEFAULTS.instagram,
  linkedin: FOOTER_DEFAULTS.linkedin,
  twitter: FOOTER_DEFAULTS.twitter,
  youtube: FOOTER_DEFAULTS.youtube,
  whatsappNumber: "919911990608",
  serviceHeroFormHeading: "Send us a message",
  serviceHeroFormSubtitle: "We respond to every inquiry within 24 hours.",
  serviceHeroPrivacyMessage: "Your information will only be used to respond to your inquiry.",
  serviceHeroPrivacyUrl: "/privacy",
};
