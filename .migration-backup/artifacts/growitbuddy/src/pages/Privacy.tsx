import SEOMeta from "@/components/SEOMeta";
import { motion } from "framer-motion";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: `We may collect the following information:

• Name
• Email address
• Social media links (Instagram, YouTube, etc.)
• Business or brand information
• Any information you voluntarily provide through forms`,
  },
  {
    title: "2. How We Use Your Information",
    body: `We use the information we collect to:

• Respond to your inquiries
• Evaluate your application or request
• Provide our services
• Improve our website and user experience
• Communicate with you regarding services, updates, or opportunities`,
  },
  {
    title: "3. Data Sharing",
    body: `We do not sell your personal data.

We may share your information with:

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
];

export default function Privacy() {
  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif", minHeight: "100vh" }}>
      <SEOMeta
        title="Privacy Policy | GrowitBuddy"
        description="GrowitBuddy's Privacy Policy - how we collect, use, and protect your personal information."
      />

      {/* Header */}
      <section style={{ paddingTop: 120, paddingBottom: 64, paddingLeft: 24, paddingRight: 24, background: "#FFFFFF", borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[760px] mx-auto">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 16 }}>
            Legal
          </p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ fontWeight: 800, fontSize: "clamp(26px, 6vw, 64px)", letterSpacing: "-0.04em", lineHeight: "1.08", color: "#0A0A0A", marginBottom: 20 }}
          >
            Privacy Policy
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 14, color: "#9A9A9A", fontWeight: 500 }}
          >
            Last updated: 5 May 2026
          </motion.p>
        </div>
      </section>

      {/* Intro */}
      <section style={{ padding: "48px 24px 0", background: "#F8F8F6" }}>
        <div className="max-w-[760px] mx-auto">
          <p style={{ fontSize: 16, color: "#5F5F5F", lineHeight: "1.85", borderLeft: "3px solid var(--gb-accent)", paddingLeft: 20 }}>
            GrowitBuddy ("we", "our", or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you visit our website or submit information through our forms.
          </p>
        </div>
      </section>

      {/* Sections */}
      <section style={{ padding: "48px 24px 96px", background: "#F8F8F6" }}>
        <div className="max-w-[760px] mx-auto" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {SECTIONS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.04 }}
              style={{ paddingBottom: 40, borderBottom: "1px solid rgba(10,10,10,0.06)" }}
            >
              <h2 style={{ fontWeight: 800, fontSize: "clamp(18px, 2.2vw, 22px)", letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 14 }}>
                {s.title}
              </h2>
              <div style={{ fontSize: 15, color: "#5F5F5F", lineHeight: "1.85", whiteSpace: "pre-line" }}>
                {s.body}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
