import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import CountUp from "@/components/effects/CountUp";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";

import { API_BASE } from "@/lib/api";

interface WorkItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  metric: string;
  metricLabel: string;
  description: string;
  tags: string[];
  stats: { label: string; value: string }[];
  imageUrl: string;
}

interface WorkStat {
  eyebrow: string;
  value: string;
  valueLabel: string;
  headline: string;
  description: string;
}

interface WorkData {
  headline: string;
  subtext: string;
  heroStats: WorkStat[];
  items: WorkItem[];
}

interface ClientLogo {
  id: number;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  enabled?: boolean;
  link?: string;
}

const DEFAULTS: WorkData = {
  headline: "Proof of authority at scale.",
  subtext: "Real systems. Real execution. Real outcomes.",
  heroStats: [
    {
      eyebrow: "Multi-Channel · Content Networks",
      value: "700M+",
      valueLabel: "views generated",
      headline: "Built large-scale visibility across content ecosystems through consistent high-volume distribution systems.",
      description: "Distributed content across platforms and campaigns to generate massive organic reach.",
    },
    {
      eyebrow: "Services · Authority System",
      value: "200+",
      valueLabel: "founders & brands served",
      headline: "Built authority systems for founders, creators, and modern internet brands.",
      description: "Positioned creators and businesses into recognized voices within their niche.",
    },
    {
      eyebrow: "Content Engine · High Volume",
      value: "90K+",
      valueLabel: "content assets created",
      headline: "Executed high-volume content production at scale across multiple platforms.",
      description: "Consistent output across short-form, long-form, platform-native, and distribution-first formats.",
    },
  ],
  items: [
    { id: "1", title: "Built a SaaS founder into an industry voice", subtitle: "LinkedIn Authority Campaign", category: "B2B SaaS · LinkedIn", metric: "14M+", metricLabel: "impressions", description: "From zero presence to recognized authority in 6 months.", tags: [], stats: [], imageUrl: "" },
    { id: "2", title: "Turned content into a $2.4M inbound pipeline", subtitle: "Multi-channel content strategy", category: "Services · Multi-channel", metric: "$2.4M", metricLabel: "inbound pipeline", description: "Systematic distribution drove inbound that exceeded prior annual revenue.", tags: [], stats: [], imageUrl: "" },
    { id: "3", title: "Built 250K+ subscribers from a zero-base channel", subtitle: "YouTube authority build", category: "Creator Economy · YouTube", metric: "250K+", metricLabel: "subscribers", description: "Consistent inbound through framework-led content systems.", tags: [], stats: [], imageUrl: "" },
    { id: "4", title: "Turned a quiet operator into a thought leader", subtitle: "Podcast & PR strategy", category: "Leadership · Podcast & PR", metric: "15+", metricLabel: "speaking invites/qtr", description: "Consistent media placement and a personal brand system.", tags: [], stats: [], imageUrl: "" },
    { id: "5", title: "Made a founder synonymous with their category", subtitle: "X / Twitter brand build", category: "E-commerce · X / Twitter", metric: "400%", metricLabel: "branded search growth", description: "Personal brand-first approach drove organic discovery at scale.", tags: [], stats: [], imageUrl: "" },
    { id: "6", title: "Repositioned a VC firm to attract premium deal flow", subtitle: "LinkedIn positioning", category: "Finance · LinkedIn", metric: "3x", metricLabel: "deal flow growth", description: "Category authority positioning brought better deals at higher velocity.", tags: [], stats: [], imageUrl: "" },
  ],
};

const SYSTEM_STEPS = [
  { label: "Content", desc: "Precise, authority-led output built for your niche." },
  { label: "Distribution", desc: "Systematic amplification across every relevant channel." },
  { label: "Authority", desc: "Positioning that makes you the obvious expert." },
  { label: "Inbound", desc: "Leads, deals, and opportunities arrive without cold outreach." },
];

export default function Work() {
  const data = usePublicContent<WorkData>("work", DEFAULTS);
  const [logos, setLogos] = useState<ClientLogo[]>([]);
  const [failedLogos, setFailedLogos] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch(`${API_BASE}/admin/logos/public`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setLogos(d); })
      .catch(() => {});
  }, []);

  const heroStats = data.heroStats ?? DEFAULTS.heroStats;

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif" }}>
      <SEOMeta
        title="Content Marketing Case Studies & Results | GrowitBuddy"
        description="Real content marketing results from GrowitBuddy: 700M+ views, $2.4M inbound pipelines, 250K+ subscribers. Case studies showing authority systems in action for founders and creators."
        schema={{
          "@type": "ItemList",
          "name": "GrowitBuddy Case Studies",
          "url": "https://growitbuddy.com/work",
          "description": "Proof of authority at scale - real results from GrowitBuddy's content and distribution systems.",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Built a SaaS founder into an industry voice - 14M+ impressions", "url": "https://growitbuddy.com/work" },
            { "@type": "ListItem", "position": 2, "name": "Turned content into a $2.4M inbound pipeline", "url": "https://growitbuddy.com/work" },
            { "@type": "ListItem", "position": 3, "name": "Built 250K+ subscribers from a zero-base YouTube channel", "url": "https://growitbuddy.com/work" },
            { "@type": "ListItem", "position": 4, "name": "Turned a quiet operator into a thought leader - 15+ speaking invites/quarter", "url": "https://growitbuddy.com/work" },
            { "@type": "ListItem", "position": 5, "name": "Made a founder synonymous with their category - 400% branded search growth", "url": "https://growitbuddy.com/work" },
            { "@type": "ListItem", "position": 6, "name": "Repositioned a VC firm to attract premium deal flow - 3x deal flow growth", "url": "https://growitbuddy.com/work" }
          ]
        } as Record<string, unknown>}
      />

      {/* ── Hero ── */}
      <section style={{ paddingTop: 128, paddingBottom: 96, paddingLeft: 24, paddingRight: 24, background: "#FFFFFF" }}>
        <div className="max-w-[1100px] mx-auto">
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5 }}
            style={{ width: 40, height: 3, background: "#C2A878", borderRadius: 2, marginBottom: 28, transformOrigin: "left" }}
          />

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 22 }}
          >
            Work
          </motion.p>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 520px" }}>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.1 }}
                style={{ fontWeight: 800, fontSize: "clamp(28px, 6.5vw, 86px)", letterSpacing: "-0.045em", lineHeight: "1.08", color: "#0A0A0A", marginBottom: 28 }}
              >
                {data.headline}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ fontSize: "clamp(15px, 4.5vw, 18px)", color: "#5F5F5F", lineHeight: "1.75", maxWidth: "46ch", marginBottom: 36 }}
              >
                {data.subtext}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}
              >
                <Link href="/contact">
                  <span className="gb-btn" style={{ fontSize: 14, display: "inline-flex" }}>
                    Book a strategy call
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
                <span style={{ fontSize: 13, color: "#8A8A8A", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C2A878", display: "inline-block" }} />
                  200+ founders served
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Cards ── */}
      <section style={{ padding: "80px 24px 96px", background: "#F8F8F6", borderTop: "1px solid #E5E5E0", borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "stretch" }}
            className="stats-grid"
          >
            {heroStats.map((stat, i) => {
              const dark = i === 1;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.6 }}
                  style={{
                    borderRadius: 18,
                    background: dark ? "#1E293B" : "#FFFFFF",
                    border: dark ? "none" : "1.5px solid #E5E5E0",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    boxShadow: dark ? "0 20px 60px rgba(30,41,59,0.22), 0 4px 16px rgba(30,41,59,0.1)" : "0 2px 12px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Gold accent bar */}
                  <div style={{ height: 3, background: dark ? "linear-gradient(90deg,#C2A878,#A89060)" : "linear-gradient(90deg,#C2A878,#D4BB90)", flexShrink: 0 }} />

                  <div style={{ padding: "32px 32px 36px", display: "flex", flexDirection: "column", flex: 1 }}>
                    {/* Eyebrow */}
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: dark ? "rgba(194,168,120,0.7)" : "#8A8A8A", marginBottom: 28 }}>
                      {stat.eyebrow || ""}
                    </p>

                    {/* Number */}
                    <div style={{ fontSize: "clamp(50px, 5.5vw, 70px)", fontWeight: 800, letterSpacing: "-0.055em", color: dark ? "#FFFFFF" : "#0A0A0A", lineHeight: 1, marginBottom: 6 }}>
                      <CountUp value={stat.value} />
                    </div>

                    {/* Number label */}
                    <p style={{ fontSize: 12, color: dark ? "rgba(255,255,255,0.4)" : "#8A8A8A", marginBottom: 24, letterSpacing: "0.03em", textTransform: "lowercase" }}>
                      {stat.valueLabel || ""}
                    </p>

                    {/* Divider */}
                    <div style={{ height: 1, background: dark ? "rgba(255,255,255,0.08)" : "#EFEFEA", marginBottom: 24 }} />

                    {/* Headline */}
                    <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.025em", color: dark ? "#FFFFFF" : "#0A0A0A", lineHeight: 1.45, marginBottom: 14 }}>
                      {stat.headline || ""}
                    </h3>

                    {/* Description */}
                    {stat.description && (
                      <p style={{ fontSize: 13, color: dark ? "rgba(255,255,255,0.5)" : "#5F5F5F", lineHeight: "1.7", display: "flex", gap: 8, marginTop: "auto" }}>
                        <span style={{ color: dark ? "#C2A878" : "#8B3A1A", flexShrink: 0, fontWeight: 600 }}>→</span>
                        <span>{stat.description}</span>
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Client Logos ── */}
      <section style={{ padding: "88px 24px 96px", background: "#F8F8F6", borderTop: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginBottom: 48 }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C2A878", marginBottom: 12 }}>Our Clients</p>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <h2 style={{ fontWeight: 800, fontSize: "clamp(18px, 3.5vw, 38px)", letterSpacing: "-0.04em", color: "#0A0A0A", margin: 0, lineHeight: 1.1 }}>
                Trusted by brands.
              </h2>
              <p style={{ fontSize: 13, color: "#8A8A8A", lineHeight: "1.5", margin: 0 }}>
                Across industries, platforms, and growth stages.
              </p>
            </div>
            <div style={{ height: 1, background: "#E5E5E0", marginTop: 24 }} />
          </motion.div>

          <div className="logo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 2 }}>
            {(logos.length > 0 ? logos.filter(l => l.enabled !== false) : Array.from({ length: 24 })).map((logo, i) => {
              const isReal = logos.length > 0;
              const l = logo as ClientLogo | undefined;
              const inner = (
                <motion.div
                  key={isReal ? (l?.id ?? i) : i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.018, duration: 0.35 }}
                  className="logo-cell"
                  style={{
                    background: "#FFFFFF",
                    padding: "24px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 80,
                    transition: "background 0.2s",
                    border: "1px solid #EEEEEA",
                  }}
                >
                  {isReal && l ? (
                    failedLogos.has(l.id) ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#8A8A8A", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {l.altText.substring(0, 3)}
                      </span>
                    ) : (
                      <img
                        src={l.imageUrl}
                        alt={l.altText || "Client"}
                        loading="lazy"
                        style={{ maxWidth: "80%", maxHeight: 44, objectFit: "contain", opacity: 0.75, transition: "opacity 0.2s" }}
                        className="logo-img"
                        onError={() => setFailedLogos(prev => new Set(prev).add(l.id))}
                      />
                    )
                  ) : (
                    <div style={{ width: 48, height: 12, background: "#E5E5E0", borderRadius: 3 }} />
                  )}
                </motion.div>
              );
              return isReal && l?.link ? (
                <a key={l.id} href={l.link} target="_blank" rel="noopener noreferrer" style={{ display: "contents" }}>
                  {inner}
                </a>
              ) : <div key={isReal ? (l?.id ?? i) : i}>{inner}</div>;
            })}
          </div>
        </div>
      </section>

      {/* ── System Proof ── */}
      <section style={{ padding: "88px 24px", background: "#FFFFFF" }}>
        <div className="max-w-[1100px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginBottom: 56 }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 12 }}>The System</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(28px, 5vw, 50px)", letterSpacing: "-0.04em", color: "#0A0A0A", maxWidth: "22ch", lineHeight: 1.1, marginBottom: 14 }}>
              This is not random. It's a system.
            </h2>
            <p style={{ fontSize: 16, color: "#5F5F5F", lineHeight: "1.7", maxWidth: "50ch" }}>
              Every result you see is built through a repeatable system.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {SYSTEM_STEPS.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                style={{
                  padding: "32px 28px",
                  borderRadius: 14,
                  background: "#F8F8F6",
                  border: "1.5px solid #E5E5E0",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#C2A878", letterSpacing: "0.1em" }}>0{i + 1}</span>
                  {i < SYSTEM_STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 1, background: "#E5E5E0" }} />
                  )}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 10 }}>{step.label}</h3>
                <p style={{ fontSize: 13, color: "#5F5F5F", lineHeight: "1.65" }}>{step.desc}</p>
                {i < SYSTEM_STEPS.length - 1 && (
                  <div style={{ position: "absolute", right: -13, top: "50%", transform: "translateY(-50%)", zIndex: 1 }}>
                    <ArrowRight size={14} style={{ color: "#C2A878" }} className="hidden lg:block" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dark CTA ── */}
      <section style={{ padding: "88px 24px", background: "#1E293B" }}>
        <div className="max-w-[700px] mx-auto" style={{ textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(194,168,120,0.8)", marginBottom: 16 }}>What's next</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(32px, 5vw, 58px)", letterSpacing: "-0.04em", color: "#FFFFFF", marginBottom: 18, lineHeight: 1.08 }}>
              Your results, next.
            </h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.6)", lineHeight: "1.75", maxWidth: "44ch", margin: "0 auto 36px" }}>
              We'll map exactly how to build your authority system.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/contact">
                <span className="gb-btn" style={{ fontSize: 14 }}>
                  Book a strategy call
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
              <Link href="/framework">
                <span className="gb-btn-outline" style={{ fontSize: 14, borderColor: "rgba(255,255,255,0.2)", color: "#FFFFFF" }}>
                  See the framework
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .logo-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 540px) {
          .logo-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        .logo-cell:hover {
          background: #FFFFF8 !important;
          border-color: #D4BB90 !important;
          z-index: 1;
        }
        .logo-cell:hover .logo-img {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
