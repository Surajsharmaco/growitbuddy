export interface LegalSection { title: string; body: string; }

export interface PrivacyData {
  badge: string;
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

export const PRIVACY_DEFAULTS: PrivacyData = {
  badge: "Legal",
  title: "Privacy Policy",
  lastUpdated: "Last updated: 5 May 2026",
  intro:
    'GrowitBuddy ("we", "our", or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you visit our website or submit information through our forms.',
  sections: [
    {
      title: "1. Information We Collect",
      body: `We may collect the following information when you use our website or submit a form:

• Name
• Email address
• Phone number
• Social media handles or page links
• Any other details you voluntarily provide`,
    },
    {
      title: "2. How We Use Your Information",
      body: `We use your information to:

• Review applications and submissions
• Communicate with you about opportunities
• Improve our services
• Send relevant updates (only if you opt in)`,
    },
    {
      title: "3. Sharing of Information",
      body: `We do not sell your personal information. We may share it with:

• Internal team members
• Trusted service providers (for hosting, analytics, etc.)

Only when necessary to operate our services.`,
    },
    {
      title: "4. Data Security",
      body: `We implement reasonable security measures to protect your information. However, no method of transmission over the internet is 100% secure.`,
    },
    {
      title: "5. Cookies",
      body: `We may use cookies or similar technologies to:

• Improve website performance
• Analyze usage
• Enhance user experience

You can disable cookies in your browser settings.`,
    },
    {
      title: "6. Third-Party Links",
      body: `Our website may contain links to third-party platforms (e.g., YouTube, social media). We are not responsible for their privacy practices.`,
    },
    {
      title: "7. Your Rights",
      body: `You may:

• Request access to your data
• Request correction or deletion
• Withdraw consent at any time

Contact us at: support.growitbuddy@gmail.com`,
    },
    {
      title: "8. Updates to This Policy",
      body: `We may update this Privacy Policy from time to time. Changes will be posted on this page.`,
    },
    {
      title: "9. Contact Us",
      body: `If you have any questions, contact us at:

Email: support.growitbuddy@gmail.com
Company: GrowitBuddy`,
    },
  ],
};
