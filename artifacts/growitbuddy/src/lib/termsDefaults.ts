import type { LegalSection } from "@/lib/privacyDefaults";

export interface TermsData {
  badge: string;
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

export const TERMS_DEFAULTS: TermsData = {
  badge: "Legal",
  title: "Terms & Conditions",
  lastUpdated: "Last updated: 5 May 2026",
  intro:
    "By accessing and using the GrowitBuddy website, you agree to the following terms.",
  sections: [
    {
      title: "1. Use of Website",
      body: `You agree to use this website only for lawful purposes. You must not misuse, disrupt, or attempt to gain unauthorized access to the website.`,
    },
    {
      title: "2. Services",
      body: `GrowitBuddy provides digital marketing, content, and growth-related services.

Submitting a form or application does not guarantee acceptance, onboarding, or results.`,
    },
    {
      title: "3. No Guarantee of Results",
      body: `While we aim to deliver high-quality services, we do not guarantee:

• Specific growth results
• Revenue outcomes
• Engagement metrics

Results may vary based on multiple factors.`,
    },
    {
      title: "4. Intellectual Property",
      body: `All content on this website (text, design, branding, etc.) is owned by GrowitBuddy.

You may not copy, reproduce, or distribute any content without permission.`,
    },
    {
      title: "5. User Submissions",
      body: `By submitting your information:

• You confirm the information is accurate
• You grant us permission to review and use it for evaluation purposes`,
    },
    {
      title: "6. Limitation of Liability",
      body: `GrowitBuddy is not liable for:

• Indirect or incidental damages
• Loss of data, revenue, or opportunities

Use of the website is at your own risk.`,
    },
    {
      title: "7. Third-Party Services",
      body: `We may use or link to third-party platforms. We are not responsible for their content or policies.`,
    },
    {
      title: "8. Termination",
      body: `We reserve the right to restrict or terminate access to the website at any time without notice.`,
    },
    {
      title: "9. Changes to Terms",
      body: `We may update these Terms at any time. Continued use of the website means you accept the updated terms.`,
    },
    {
      title: "10. Contact",
      body: `For any questions:

Email: support.growitbuddy@gmail.com
Company: GrowitBuddy`,
    },
  ],
};
