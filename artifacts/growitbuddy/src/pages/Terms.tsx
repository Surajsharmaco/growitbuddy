import SEOMeta from "@/components/SEOMeta";
import { motion } from "framer-motion";
import { usePublicContent } from "@/hooks/usePublicContent";
import { TERMS_DEFAULTS, type TermsData } from "@/lib/termsDefaults";

export default function Terms() {
  const data = usePublicContent<TermsData>("terms", TERMS_DEFAULTS);

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
            {data.badge}
          </p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ fontWeight: 800, fontSize: "clamp(26px, 6vw, 64px)", letterSpacing: "-0.04em", lineHeight: "1.08", color: "#0A0A0A", marginBottom: 20 }}
          >
            {data.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 14, color: "#9A9A9A", fontWeight: 500 }}
          >
            {data.lastUpdated}
          </motion.p>
        </div>
      </section>

      {/* Intro */}
      <section style={{ padding: "48px 24px 0", background: "#F8F8F6" }}>
        <div className="max-w-[760px] mx-auto">
          <p style={{ fontSize: 16, color: "#5F5F5F", lineHeight: "1.85", borderLeft: "3px solid var(--gb-accent)", paddingLeft: 20, whiteSpace: "pre-line" }}>
            {data.intro}
          </p>
        </div>
      </section>

      {/* Sections */}
      <section style={{ padding: "48px 24px 96px", background: "#F8F8F6" }}>
        <div className="max-w-[760px] mx-auto" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {data.sections.map((s, i) => (
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
