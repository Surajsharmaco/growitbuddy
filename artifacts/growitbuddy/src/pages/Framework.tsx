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
      <section style={{ position: "relative", paddingTop: 140, paddingBottom: 96, paddingLeft: 24, paddingRight: 24, borderBottom: "1px solid #E5E5E0", overflow: "hidden" }}>
        {/* decorative dotted grid top-right */}
        <span aria-hidden style={{
          position: "absolute", top: 80, right: -20, width: 220, height: 220, opacity: 0.4,
          backgroundImage: "radial-gradient(circle, rgba(30,41,59,0.22) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
          maskImage: "radial-gradient(circle at top right, black, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle at top right, black, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div className="max-w-[1100px] mx-auto" style={{ position: "relative" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--gb-gold)", marginBottom: 20,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gb-gold)" }} />
            {fw.heroLabel}
          </span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ fontWeight: 800, fontSize: "clamp(28px, 7vw, 88px)", letterSpacing: "-0.04em", lineHeight: "1.08", color: "#0A0A0A", maxWidth: "16ch", marginBottom: 28 }}
          >
            {fw.heroHeadline}
          </motion.h1>
          {/* gold accent line under headline */}
          <span aria-hidden style={{ display: "block", width: 56, height: 3, background: "var(--gb-gold)", borderRadius: 2, marginBottom: 28 }} />
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
      <section style={{ padding: "96px 24px", background: "#F8F8F6" }}>
        <div className="max-w-[1100px] mx-auto">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span style={{
              display: "inline-block",
              fontSize: 14, fontWeight: 800, letterSpacing: "0.24em", textTransform: "uppercase",
              color: "var(--gb-gold)",
            }}>
              The 4-Step System
            </span>
            <span aria-hidden style={{ display: "block", width: 48, height: 2, background: "rgba(194,168,120,0.4)", borderRadius: 2, margin: "14px auto 0" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
            {/* Vertical connecting line — slate tinted, full opacity for visibility */}
            <div style={{ position: "absolute", left: 23, top: 22, bottom: 22, width: 2, background: "linear-gradient(to bottom, rgba(30,41,59,0.18), rgba(30,41,59,0.08))", zIndex: 0 }} />

            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                style={{ display: "flex", alignItems: "center", gap: 20, padding: "12px 0", position: "relative", zIndex: 1 }}
              >
                {/* Step dot — slate filled, white number */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "var(--gb-accent)",
                    border: "3px solid #F8F8F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(30,41,59,0.20), 0 0 0 1px rgba(30,41,59,0.10)",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>{step.num}</span>
                </div>

                {/* Label card */}
                <div
                  style={{
                    flex: 1,
                    padding: "18px 26px",
                    background: "#FFFFFF",
                    borderRadius: 14,
                    border: "1px solid #E5E5E0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 2px 8px rgba(30,41,59,0.04)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* gold left accent bar */}
                  <span aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "var(--gb-gold)" }} />
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--gb-gold)", marginBottom: 4 }}>Step {step.num}</p>
                    <p style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.03em", color: "#0A0A0A" }}>{step.title}</p>
                  </div>
                  <p style={{ fontSize: 13, color: "#8A8A8A", maxWidth: "38ch", lineHeight: 1.5, display: "none" }} className="step-tagline">
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
            padding: "96px 24px",
            background: i % 2 === 0 ? "#FFFFFF" : "#EFEFEA",
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
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: "var(--gb-accent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(30,41,59,0.20)",
                }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>{step.num}</span>
                </div>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
                  color: "var(--gb-gold)",
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--gb-gold)" }} />
                  {step.title}
                </span>
              </div>
              <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 4vw, 52px)", letterSpacing: "-0.035em", lineHeight: "1.1", color: "#0A0A0A", marginBottom: 18 }}>{step.headline}</h2>
              <span aria-hidden style={{ display: "block", width: 44, height: 3, background: "var(--gb-gold)", borderRadius: 2, marginBottom: 22 }} />
              <p style={{ fontSize: 16, color: "#5F5F5F", lineHeight: "1.8" }}>{step.desc}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.07, duration: 0.6 }}
            >
              <ul style={{ borderTop: "1px solid rgba(30,41,59,0.12)", display: "flex", flexDirection: "column" }}>
                {step.details.map((d, j) => (
                  <li key={j} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 0", borderBottom: "1px solid rgba(30,41,59,0.10)" }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "var(--gb-gold)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: "0 2px 6px rgba(194,168,120,0.35)",
                    }}>
                      <Check className="w-3.5 h-3.5" style={{ color: "#FFFFFF", strokeWidth: 3 }} />
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
      <section style={{ padding: "96px 24px", background: "#F8F8F6" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              position: "relative",
              background: "#EFEFEA",
              border: "1px solid rgba(30,41,59,0.10)",
              borderRadius: 24,
              padding: "clamp(40px, 6vw, 72px) clamp(24px, 5vw, 56px)",
              textAlign: "center",
              overflow: "hidden",
              boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 24px 60px -32px rgba(30,41,59,0.25)",
            }}
          >
            {/* decorative dotted corners */}
            <span aria-hidden style={{
              position: "absolute", top: 20, left: 20, width: 72, height: 72, opacity: 0.35,
              backgroundImage: "radial-gradient(circle, rgba(30,41,59,0.35) 1px, transparent 1px)",
              backgroundSize: "8px 8px",
              maskImage: "radial-gradient(circle at top left, black, transparent 70%)",
              WebkitMaskImage: "radial-gradient(circle at top left, black, transparent 70%)",
              pointerEvents: "none",
            }} />
            <span aria-hidden style={{
              position: "absolute", bottom: 20, right: 20, width: 72, height: 72, opacity: 0.35,
              backgroundImage: "radial-gradient(circle, rgba(30,41,59,0.35) 1px, transparent 1px)",
              backgroundSize: "8px 8px",
              maskImage: "radial-gradient(circle at bottom right, black, transparent 70%)",
              WebkitMaskImage: "radial-gradient(circle at bottom right, black, transparent 70%)",
              pointerEvents: "none",
            }} />
            {/* gold accent strip */}
            <span aria-hidden style={{
              position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
              width: 64, height: 3, background: "var(--gb-gold)", borderRadius: "0 0 6px 6px",
            }} />

            <div style={{ position: "relative", maxWidth: 560, margin: "0 auto" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
                color: "var(--gb-gold)", marginBottom: 20,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gb-gold)" }} />
                Get started
              </span>
              <h2 style={{ fontWeight: 800, fontSize: "clamp(24px, 4vw, 46px)", letterSpacing: "-0.04em", color: "#0A0A0A", marginBottom: 16, lineHeight: 1.08 }}>
                {fw.ctaHeadline}
              </h2>
              <p style={{ fontSize: 16, color: "#5F5F5F", lineHeight: "1.7", marginBottom: 36, maxWidth: "44ch", margin: "0 auto 36px" }}>
                {fw.ctaSubtext}
              </p>
              <Link href="/contact">
                <span className="gb-btn">
                  {fw.ctaButton}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
