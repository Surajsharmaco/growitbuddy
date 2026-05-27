export interface ContactInfoItem { label: string; value: string; href: string; }

export interface ContactPageData {
  heroHeadline: string;
  heroSubtext: string;
  bookingLabel: string;
  bookingHeadline: string;
  calLink: string;
  formHeadline: string;
  formSubtext: string;
  formSuccessHeadline: string;
  formSuccessSubtext: string;
  contactInfo: ContactInfoItem[];
}

export const CONTACT_DEFAULTS: ContactPageData = {
  heroHeadline: "Let's build your authority system.",
  heroSubtext: "We partner with ambitious founders and creators who are serious about authority. One strategy call is all it takes to get started.",
  bookingLabel: "Book a call",
  bookingHeadline: "Pick a time that works for you.",
  calLink: "growitbuddy.com/growth-strategy-call",
  formHeadline: "Send us a message",
  formSubtext: "We respond to every inquiry within 24 hours.",
  formSuccessHeadline: "Message sent!",
  formSuccessSubtext: "We'll be in touch within 24 hours to schedule your free strategy call.",
  contactInfo: [
    { label: "Email", value: "cs.growitbuddy@gmail.com", href: "mailto:cs.growitbuddy@gmail.com" },
    { label: "Response time", value: "Within 24 hours", href: "" },
    { label: "Based", value: "Global - 4 timezones", href: "" },
    { label: "Next step", value: "Free 30-min strategy call", href: "" },
  ],
};
