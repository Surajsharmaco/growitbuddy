import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "wouter";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";

import { SERVICES_DEFAULTS as PAGE_DEFAULTS, type ServicesData as ServicesPageData, type ServiceItem } from "@/lib/servicesDefaults";


export default function Services() {
  const cms = usePublicContent<ServicesPageData>("services", PAGE_DEFAULTS);
  const services = cms.services || PAGE_DEFAULTS.services;

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .svc-hero-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 64px;
          align-items: center;
        }
        .svc-block {
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 72px;
          align-items: start;
        }
        .svc-block.reverse {
          grid-template-columns: 1.1fr 1fr;
        }
        .svc-block.reverse .svc-left { order: 2; }
        .svc-block.reverse .svc-right { order: 1; }
        .svc-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }
        .svc-index-list { list-style: none; padding: 0; margin: 0; }
        .svc-index-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 13px 12px;
          margin: 0 -12px;
          border-radius: 10px;
          text-decoration: none;
          color: #3A3A3A;
          transition: background 0.15s, color 0.15s;
          cursor: pointer;
        }
        .svc-index-item:hover { background: rgba(10,10,10,0.05); color: #0A0A0A; }
        .svc-index-item:hover .svc-index-arrow { opacity: 1; transform: translateX(0); }
        .svc-index-item + .svc-index-item { border-top: 1px solid rgba(10,10,10,0.05); }
        .svc-index-arrow {
          margin-left: auto;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.18s, transform 0.18s;
          flex-shrink: 0;
          color: #8B3A1A;
        }
        .feature-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #3A3A3A;
          background: rgba(10,10,10,0.04);
          border: 1px solid rgba(10,10,10,0.07);
          transition: background 0.15s, border-color 0.15s;
        }
        .feature-tag:hover { background: rgba(10,10,10,0.07); border-color: rgba(10,10,10,0.12); }
        .feature-tag-dark {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.1);
          color: #D8D8D2;
        }
        .feature-tag-dark:hover { background: rgba(255,255,255,0.12); }
        .svc-card-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .svc-card {
          background: #FFFFFF;
          border: 1.5px solid #E5E5E0;
          border-radius: 16px;
          padding: 36px 30px 30px;
          display: flex;
          flex-direction: column;
          transition: box-shadow 0.22s, border-color 0.22s, transform 0.22s;
          cursor: default;
        }
        .svc-card:hover {
          box-shadow: 0 10px 40px rgba(10,10,10,0.09);
          border-color: rgba(30,41,59,0.22);
          transform: translateY(-3px);
        }
        .svc-card.dark {
          background: #1E293B;
          border-color: transparent;
        }
        .svc-service-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 500;
          color: #3A3A3A;
          background: #F4F4F1;
          border: 1px solid #EAEAE5;
          line-height: 1;
          white-space: nowrap;
        }
        .svc-service-pill.dark-pill {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.65);
        }
        @media (max-width: 900px) {
          .svc-hero-grid { grid-template-columns: 1fr; gap: 36px; }
          .svc-block, .svc-block.reverse { grid-template-columns: 1fr; gap: 40px; }
          .svc-block.reverse .svc-left { order: 0; }
          .svc-block.reverse .svc-right { order: 0; }
          .svc-card-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 700px) {
          .svc-stats-grid { grid-template-columns: 1fr; }
          .svc-stats-grid > div { border-right: none !important; border-bottom: 1px solid rgba(10,10,10,0.05); padding: 28px 20px; }
          .svc-stats-grid > div:last-child { border-bottom: none; }
        }
        @media (max-width: 580px) {
          .svc-card-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .svc-hero-section { padding-top: 80px !important; padding-bottom: 60px !important; }
          .svc-hero-card { padding: 20px 18px 16px !important; }
          .svc-hero-card-headline { font-size: 18px !important; }
          .svc-what-section { padding-top: 60px !important; padding-bottom: 64px !important; }
          .svc-what-header { margin-bottom: 32px !important; }
          .svc-card { padding: 22px 18px 20px !important; }
          .svc-card-pills { margin-bottom: 18px !important; }
          .svc-service-pill { font-size: 11px !important; padding: 5px 10px !important; }
          .svc-service-pill.dark-pill { font-size: 11px !important; padding: 5px 10px !important; }
          .svc-flow-section { padding-top: 64px !important; padding-bottom: 72px !important; }
          .svc-flow-header { margin-bottom: 44px !important; }
          .svc-cta-section { padding-top: 64px !important; padding-bottom: 64px !important; }
          .svc-hero-badge { flex-wrap: wrap; gap: 8px; align-items: flex-start; }
          .svc-hero-badge-pill { white-space: normal !important; text-align: center; }
        }
        .svc-flow-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
        }
        .svc-flow-step {
          padding: 0 24px 0 0;
          transition: opacity 0.22s;
        }
        .svc-flow-step:last-child { padding-right: 0; }
        .svc-flow-step:hover { opacity: 0.78; }
        .svc-flow-node:hover {
          border-color: #C2A878 !important;
          box-shadow: 0 0 0 4px rgba(194,168,120,0.12);
        }
        @media (max-width: 800px) {
          .svc-flow-grid { grid-template-columns: repeat(2, 1fr); gap: 48px 32px; }
          .svc-flow-connector { display: none; }
          .svc-flow-step { padding-right: 0; }
        }
        @media (max-width: 480px) {
          .svc-flow-grid { grid-template-columns: 1fr; gap: 36px; }
          .svc-flow-step { padding-right: 0; }
          .svc-flow-step p { max-width: none !important; }
        }
        .svc-cta-btn { position: relative; overflow: hidden; isolation: isolate; }
        .svc-cta-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 100px;
          padding: 1.5px;
          background: linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.35));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          pointer-events: none;
          opacity: 0.85;
          transition: opacity 0.25s ease;
          z-index: 1;
        }
        .svc-cta-btn::after {
          content: "";
          position: absolute;
          top: 0; bottom: 0;
          left: -120%;
          width: 60%;
          background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%);
          transform: skewX(-18deg);
          transition: left 0.7s ease;
          pointer-events: none;
          z-index: 2;
        }
        .svc-cta-btn:hover {
          background: var(--gb-accent-hover) !important;
          border-color: rgba(255,255,255,0.32) !important;
          transform: translateY(-2px);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.25) inset,
            0 18px 40px -12px rgba(0,0,0,0.7),
            0 0 0 4px rgba(255,255,255,0.06) !important;
        }
        .svc-cta-btn:hover::before { opacity: 1; }
        .svc-cta-btn:hover::after { left: 130%; }
        .svc-cta-btn:active { transform: translateY(0); }
        .svc-cta-btn > * { position: relative; z-index: 3; }
        .svc-cta-btn__arrow { transition: transform 0.25s ease; }
        .svc-cta-btn:hover .svc-cta-btn__arrow { transform: translateX(4px); }
      `}</style>

      <SEOMeta
        title="Content Marketing Services | Content Systems, Personal Branding & Distribution | GrowitBuddy"
        description="GrowitBuddy's content marketing services: content creation, personal branding strategy, distribution growth, AI automation, web & funnel systems, and digital product launches for founders and creators."
        schema={{
          "@type": "ItemList",
          "name": "GrowitBuddy Content Marketing Services",
          "url": "https://growitbuddy.com/services",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Content Creation", "url": "https://growitbuddy.com/services" },
            { "@type": "ListItem", "position": 2, "name": "Personal Branding", "url": "https://growitbuddy.com/services" },
            { "@type": "ListItem", "position": 3, "name": "Distribution & Growth", "url": "https://growitbuddy.com/services" },
            { "@type": "ListItem", "position": 4, "name": "Web & Funnel Systems", "url": "https://growitbuddy.com/services" },
            { "@type": "ListItem", "position": 5, "name": "AI Automation", "url": "https://growitbuddy.com/services" },
            { "@type": "ListItem", "position": 6, "name": "Digital Products & Growth", "url": "https://growitbuddy.com/services" }
          ]
        } as Record<string, unknown>}
      />

      {/* ── Hero ── */}
      <section className="svc-hero-section" style={{ paddingTop: 120, paddingBottom: 96, paddingLeft: 24, paddingRight: 24, background: "#FFFFFF", borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto svc-hero-grid">
          {/* Left */}
          <div>
            <p className="gb-eyebrow" style={{ marginBottom: 24 }}>Services</p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
              style={{ fontWeight: 800, fontSize: "clamp(28px, 3.8vw, 58px)", letterSpacing: "-0.04em", lineHeight: "1.06", color: "#0A0A0A", maxWidth: "20ch", marginBottom: 28 }}
            >
              {cms.heroHeadline}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.55 }}
            >
              <p style={{ fontSize: 16, lineHeight: "1.85", color: "#5F5F5F", maxWidth: "40ch", marginBottom: 32 }}>
                {cms.heroSubtext}
              </p>
              <Link href="/contact">
                <span
                  className="gb-btn"
                  style={{ width: "fit-content" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--gb-accent-hover)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--gb-accent)"; }}
                >
                  {cms.heroCTA}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </motion.div>
          </div>

          {/* Right - service index */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="svc-hero-card"
            style={{ background: "#FFFFFF", borderRadius: 16, padding: "28px 28px 20px", border: "1px solid #E5E5E0", boxShadow: "0 2px 16px rgba(10,10,10,0.04)" }}
          >
            {/* Card header */}
            <div className="svc-hero-badge" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, paddingBottom: 16, borderBottom: "1px solid #E5E5E0" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A8A8A", margin: 0 }}>
                Authority Infrastructure
              </p>
              <span className="svc-hero-badge-pill" style={{ fontSize: 11, fontWeight: 600, color: "#FFFFFF", background: "#1E293B", borderRadius: 100, padding: "4px 12px", whiteSpace: "nowrap" }}>
                Founders · Creators · Brands
              </span>
            </div>

            {/* Headline */}
            <p className="svc-hero-card-headline" style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.035em", lineHeight: "1.2", color: "#0A0A0A", marginBottom: 20 }}>
              We build authority systems<br />that compound.
            </p>

            {/* Three-line build */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 22 }}>
              {[
                "Content creates visibility.",
                "Distribution creates reach.",
                "Authority creates inbound demand.",
              ].map((line, li) => (
                <div key={li} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: li < 2 ? "1px solid #F2F2EE" : "none" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#C2A878", letterSpacing: "0.06em", fontVariantNumeric: "tabular-nums", flexShrink: 0, minWidth: "2ch" }}>
                    {String(li + 1).padStart(2, "0")}
                  </span>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", lineHeight: "1.4", margin: 0 }}>
                    {line}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <p style={{ fontSize: 12, lineHeight: "1.8", color: "#8A8A8A", paddingTop: 18, borderTop: "1px solid #EEEEEA", margin: 0, fontStyle: "italic" }}>
              Positioning · Production · Distribution · Inbound Demand — one compounding system.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ background: "#F8F8F6", borderBottom: "1px solid #E5E5E0", padding: "0 24px" }}>
        <div className="max-w-[1100px] mx-auto svc-stats-grid">
          {cms.stats.map(({ num, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              style={{
                padding: "40px 32px",
                borderRight: i < cms.stats.length - 1 ? "1px solid rgba(10,10,10,0.06)" : "none",
                textAlign: "center",
              }}
            >
              <p style={{ fontWeight: 800, fontSize: "clamp(20px, 3.5vw, 48px)", letterSpacing: "-0.04em", color: "#0A0A0A", lineHeight: 1, marginBottom: 8 }}>
                {num}
              </p>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#8A8A8A", letterSpacing: "0.02em", maxWidth: "24ch", margin: "0 auto", lineHeight: 1.5 }}>
                {label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── What We Do - 6 service cards ── */}
      <section className="svc-what-section" style={{ padding: "96px 24px 100px", background: "#F8F8F6", borderTop: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="svc-what-header"
            style={{ marginBottom: 56 }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 16 }}>
              Services
            </p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 4.5vw, 52px)", letterSpacing: "-0.04em", lineHeight: "1.08", color: "#0A0A0A", marginBottom: 16, maxWidth: "18ch" }}>
              What We Do
            </h2>
            <p style={{ fontSize: 16, color: "#5F5F5F", lineHeight: "1.75", maxWidth: "52ch" }}>
              Strategy, content, growth, and AI systems designed for modern brands, founders, and creators.
            </p>
          </motion.div>

          <div className="svc-card-grid">
            {services.map((s, i) => {
              const num = String(i + 1).padStart(2, "0");
              const isDark = i === 4;
              return (
                <motion.div
                  key={s.id}
                  className={`svc-card${isDark ? " dark" : ""}`}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.5 }}
                  id={`service-${s.id}`}
                  style={{ scrollMarginTop: 80 }}
                >
                  {/* Number + subtitle row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800, letterSpacing: "0.08em",
                      color: isDark ? "#C2A878" : "#C2A878",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {num}
                    </span>
                    <span style={{ width: 1, height: 10, background: isDark ? "rgba(255,255,255,0.15)" : "rgba(10,10,10,0.12)", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.35)" : "#8A8A8A" }}>
                      {(s.subtitle ?? "").replace(/^\d+\s*\|\s*/, "")}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontWeight: 800, fontSize: "clamp(18px, 1.8vw, 22px)",
                    letterSpacing: "-0.03em", lineHeight: "1.2",
                    color: isDark ? "#FFFFFF" : "#0A0A0A",
                    marginBottom: 12,
                  }}>
                    {s.title}
                  </h3>

                  {/* Description */}
                  <p style={{
                    fontSize: 14, lineHeight: "1.75",
                    color: isDark ? "rgba(255,255,255,0.5)" : "#5F5F5F",
                    marginBottom: 24,
                  }}>
                    {s.description}
                  </p>

                  {/* Service pills */}
                  <div className="svc-card-pills" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 32, flex: 1 }}>
                    {(s.features || []).map((f, fi) => (
                      <span key={fi} className={`svc-service-pill${isDark ? " dark-pill" : ""}`}>
                        {f}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link href="/contact">
                    <span
                      className="gb-btn"
                      style={{
                        padding: "10px 20px",
                        fontSize: 13,
                        background: isDark ? "rgba(255,255,255,0.1)" : "var(--gb-authority)",
                        border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.10)",
                        transition: "opacity 0.18s, background 0.18s",
                        alignSelf: "flex-start",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.78"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                    >
                      {s.cta || "Learn More"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── System Flow ── */}
      <section className="svc-flow-section" style={{ padding: "100px 24px 108px", background: "#FFFFFF", borderTop: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="svc-flow-header"
            style={{ marginBottom: 72, maxWidth: "52ch" }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C2A878", marginBottom: 18 }}>
              The Authority System
            </p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 4vw, 48px)", letterSpacing: "-0.04em", lineHeight: "1.1", color: "#0A0A0A", marginBottom: 20 }}>
              How authority compounds.
            </h2>
            <p style={{ fontSize: 15, lineHeight: "1.9", color: "#5F5F5F" }}>
              Every layer strengthens the next - transforming visibility into recognition, trust, and inbound growth.
            </p>
          </motion.div>

          {/* 4-step flow */}
          <div style={{ position: "relative" }}>
            {/* connector line - desktop only */}
            <div style={{
              position: "absolute",
              top: 28,
              left: "calc(12.5% + 16px)",
              right: "calc(12.5% + 16px)",
              height: 1,
              background: "linear-gradient(90deg, rgba(194,168,120,0.0) 0%, rgba(194,168,120,0.35) 20%, rgba(194,168,120,0.35) 80%, rgba(194,168,120,0.0) 100%)",
              pointerEvents: "none",
            }} className="svc-flow-connector" />

            <div className="svc-flow-grid">
              {[
                { num: "01", title: "Positioning", desc: "Shape perception and build recognition in your category and niche." },
                { num: "02", title: "Production", desc: "Create high-signal content built for attention, trust, and consistency at scale." },
                { num: "03", title: "Distribution", desc: "Push content into the right audiences through networks and performance systems." },
                { num: "04", title: "Inbound Demand", desc: "Turn compounding visibility into authority, leads, and inbound opportunities." },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="svc-flow-step"
                >
                  {/* Circle node */}
                  <div style={{
                    width: 56, height: 56,
                    borderRadius: "50%",
                    border: "1.5px solid #E5E5E0",
                    background: "#FFFFFF",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 28,
                    position: "relative", zIndex: 1,
                    transition: "border-color 0.22s, box-shadow 0.22s",
                  }} className="svc-flow-node">
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#C2A878", letterSpacing: "0.06em", fontVariantNumeric: "tabular-nums" }}>
                      {step.num}
                    </span>
                  </div>

                  {/* Text */}
                  <h3 style={{
                    fontWeight: 700, fontSize: 18,
                    letterSpacing: "-0.025em", lineHeight: "1.2",
                    color: "#0A0A0A", marginBottom: 10,
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 14, lineHeight: "1.8", color: "#5F5F5F", maxWidth: "22ch" }}>
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── CTA ── */}
      <section className="svc-cta-section" style={{ padding: "96px 24px", background: "#1E293B" }}>
        <div className="max-w-[700px] mx-auto" style={{ textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>
              Ready to start?
            </p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 5vw, 52px)", letterSpacing: "-0.04em", color: "#FFFFFF", lineHeight: 1.08, marginBottom: 20 }}>
              Ready to build your authority system?
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: "1.8", maxWidth: "46ch", margin: "0 auto 40px" }}>
              Book a free strategy call and we'll map out exactly where to start - your positioning, your content gaps, and the fastest path to consistent inbound demand.
            </p>
            <Link href="/contact">
              <span
                className="gb-btn svc-cta-btn"
                style={{
                  padding: "16px 34px",
                  willChange: "transform",
                }}
              >
                Book a strategy call
                <ArrowRight className="w-4 h-4 svc-cta-btn__arrow" />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
