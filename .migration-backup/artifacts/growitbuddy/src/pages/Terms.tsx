import SEOMeta from "@/components/SEOMeta";
import { motion } from "framer-motion";

const SECTIONS = [
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
];

export default function Terms() {
  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif", minHeight: "100vh" }}>
      <SEOMeta
        title="Terms & Conditions | GrowitBuddy"
        description="GrowitBuddy's Terms & Conditions - the rules and guidelines for using our website and services."
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
            Terms &amp; Conditions
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
            By accessing and using the GrowitBuddy website, you agree to the following terms.
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
