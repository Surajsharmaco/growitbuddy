import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "wouter";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";

interface FrameworkStep { num: string; title: string; headline: string; desc: string; details: string[]; }
interface FrameworkPageData {
  heroLabel: string; heroHeadline: string; heroSubtext: string;
  steps: FrameworkStep[];
  ctaHeadline: string; ctaSubtext: string; ctaButton: string;
}
const FW_STEPS: FrameworkStep[] = [
  { num: "01", title: "Positioning", headline: "Know exactly what you stand for.", desc: "We audit your space, map your competitors, and identify the specific category angle only you can own.", details: ["Competitor landscape audit", "Category design & naming", "Unique point of view articulation", "Target audience avatar mapping", "90-day authority roadmap"] },
  { num: "02", title: "Content Engine", headline: "High-signal content strategy. At scale.", desc: "We build a repeatable content system that extracts your expertise and packages it into formats that educate, persuade, and convert.", details: ["Pillar content strategy", "Content calendar & themes", "Ghostwriting & scripting", "Multi-format repurposing", "Editorial quality control"] },
  { num: "03", title: "Distribution Loop", headline: "Content Distribution Strategy That Actually Works", desc: "Make sure your content doesn't just get posted - it gets seen by the people who actually matter.", details: ["LinkedIn publishing system", "Email list growth strategy", "Cross-platform syndication", "Podcast & media placement", "Community building"] },
  { num: "04", title: "Authority Compounding", headline: "The flywheel that never stops.", desc: "When your personal branding strategy, content system, and distribution work together, authority compounds automatically.", details: ["Monthly authority score tracking", "Inbound opportunity capture", "Premium positioning signals", "Speaking & PR outreach", "Authority monetization"] },
];
const FW_DEFAULTS: FrameworkPageData = {
  heroLabel: "Framework", heroHeadline: "The Authority Framework.", heroSubtext: "A battle-tested content marketing framework for engineering category dominance that compounds over time. No hacks. No shortcuts. Just infrastructure built to generate inbound leads.",
  steps: FW_STEPS,
  ctaHeadline: "Ready to start building?", ctaSubtext: "Book a free strategy call and we'll map out your authority roadmap.", ctaButton: "Book a Strategy Call",
};

export default function Framework() {
  const fw = usePublicContent<FrameworkPageData>("framework", FW_DEFAULTS);
  const STEPS = fw.steps;
  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif" }}>
      <SEOMeta
        title="The Authority Framework - 4-Step Content & Distribution System | GrowitBuddy"
        description="GrowitBuddy's Authority Framework: Positioning, Content Engine, Distribution Loop, and Authority Compounding - a proven 4-step system for founders and creators building inbound growth and category dominance."
        schema={{
          "@type": "HowTo",
          "name": "The Authority Framework - GrowitBuddy",
          "description": "A 4-step content marketing framework for engineering category dominance and compounding inbound growth over time.",
          "url": "https://growitbuddy.com/framework",
          "step": [
            { "@type": "HowToStep", "position": 1, "name": "Positioning", "text": "Audit your space, map competitors, and identify the specific category angle only you can own. Includes competitor landscape audit, category design, and 90-day authority roadmap." },
            { "@type": "HowToStep", "position": 2, "name": "Content Engine", "text": "Build a repeatable content system that extracts your expertise and packages it into formats that educate, persuade, and convert. Includes pillar content strategy, ghostwriting, and editorial quality control." },
            { "@type": "HowToStep", "position": 3, "name": "Distribution Loop", "text": "Ensure content is seen by the people who actually matter. Includes LinkedIn publishing system, email list growth, cross-platform syndication, and podcast & media placement." },
            { "@type": "HowToStep", "position": 4, "name": "Authority Compounding", "text": "When your positioning, content, and distribution work together, authority compounds automatically. Includes monthly tracking, inbound opportunity capture, and authority monetization." }
          ]
        } as Record<string, unknown>}
      />

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 80, paddingLeft: 24, paddingRight: 24, borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 16 }}>{fw.heroLabel}</p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ fontWeight: 800, fontSize: "clamp(28px, 7vw, 88px)", letterSpacing: "-0.04em", lineHeight: "1.08", color: "#0A0A0A", maxWidth: "16ch", marginBottom: 24 }}
          >
            {fw.heroHeadline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: "clamp(15px, 4.5vw, 18px)", color: "#5F5F5F", lineHeight: "1.75", maxWidth: "52ch" }}
          >
            {fw.heroSubtext}
          </motion.p>
        </div>
      </section>

      {/* Visual connector - vertical */}
      <section style={{ padding: "80px 24px" }}>
        <div className="max-w-[1100px] mx-auto">
          <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
            {/* Vertical line */}
            <div style={{ position: "absolute", left: 21, top: 22, bottom: 22, width: 1, background: "rgba(10,10,10,0.03)", zIndex: 0 }} />

            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                style={{ display: "flex", alignItems: "center", gap: 20, padding: "18px 0", position: "relative", zIndex: 1 }}
              >
                {/* Step dot */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: i % 2 !== 0 ? "#EFEFEA" : "#FFFFFF",
                    border: "1.5px solid #E5E5E0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(11,11,11,0.08)",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#0A0A0A", letterSpacing: "-0.02em" }}>{step.num}</span>
                </div>

                {/* Label */}
                <div
                  style={{
                    flex: 1,
                    padding: "14px 24px",
                    background: i % 2 !== 0 ? "#EFEFEA" : "#FFFFFF",
                    borderRadius: 14,
                    border: "1px solid #E5E5E0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: i % 2 !== 0 ? "#8A8A8A" : "rgba(11,11,11,0.35)", marginBottom: 3 }}>{step.num}</p>
                    <p style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.03em", color: "#0A0A0A" }}>{step.title}</p>
                  </div>
                  <p style={{ fontSize: 13, color: i % 2 !== 0 ? "#8A8A8A" : "rgba(11,11,11,0.4)", maxWidth: "38ch", lineHeight: 1.5, display: "none" }} className="step-tagline">
                    {step.headline}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps detail */}
      {STEPS.map((step, i) => (
        <section
          key={i}
          style={{
            padding: "80px 24px",
            background: i % 2 === 0 ? "#FFFFFF" : "#F8F8F6",
            borderTop: "1px solid #E5E5E0",
          }}
        >
          <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 items-start">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(10,10,10,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#0A0A0A" }}>{step.num}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A7A85" }}>{step.title}</span>
              </div>
              <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 4vw, 52px)", letterSpacing: "-0.035em", lineHeight: "1.1", color: "#0A0A0A", marginBottom: 20 }}>{step.headline}</h2>
              <p style={{ fontSize: 16, color: "#5F5F5F", lineHeight: "1.8" }}>{step.desc}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.07, duration: 0.6 }}
            >
              <ul style={{ borderTop: "1px solid #E5E5E0", display: "flex", flexDirection: "column" }}>
                {step.details.map((d, j) => (
                  <li key={j} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: "1px solid #E5E5E0" }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(10,10,10,0.03)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check className="w-3 h-3" style={{ color: "#0A0A0A" }} />
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 500, color: "#0A0A0A" }}>{d}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section style={{ padding: "80px 24px", background: "#EFEFEA", textAlign: "center" }}>
        <div className="max-w-[600px] mx-auto">
          <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 5vw, 52px)", letterSpacing: "-0.04em", color: "#0A0A0A", marginBottom: 20 }}>
            {fw.ctaHeadline}
          </h2>
          <p style={{ fontSize: 16, color: "#5F5F5F", lineHeight: "1.75", marginBottom: 36 }}>
            {fw.ctaSubtext}
          </p>
          <Link href="/contact">
            <span className="gb-btn" style={{ fontSize: 15, margin: "0 auto" }}>
              {fw.ctaButton}
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
