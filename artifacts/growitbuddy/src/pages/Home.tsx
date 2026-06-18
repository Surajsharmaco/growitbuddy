import React, { useState, useEffect, useRef } from "react";
import { m } from "framer-motion";
import { API_BASE } from "@/lib/api";
import { ArrowRight, Bot, Box, Building2, Calendar, Check, ChevronRight, Cloud, GraduationCap, Rocket, ScanLine, Search, Send, ShoppingBag, Sparkles, Star, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { FadeUp } from "@/components/effects/TextReveal";
import CountUp from "@/components/effects/CountUp";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";
import BlueprintLines from "@/components/effects/BlueprintLines";
import DotGrid from "@/components/effects/DotGrid";
import { HOME_DEFAULTS as DEFAULTS, type HomeData } from "@/lib/homeDefaults";
import { getWashCardStyle, getWashBorder, CardGrain, WashIconChip } from "@/components/WashCard";

// Icons for the "Everything you need" services grid, mapped by card order so the
// content stays admin-editable (the services array carries no icon field).
const SERVICE_ICONS: LucideIcon[] = [Search, Calendar, ScanLine, Send, Bot, Box];

// Per-card pastel washes for the home "Services" grid ONLY (blue / peach / blue /
// green / lavender / peach), to match the requested reference. Kept local so the
// shared WashCard gold+slate system used on other pages stays untouched.
const HOME_SERVICE_WASHES: string[] = [
  // 01 — cool blue
  "radial-gradient(70% 60% at 22% 18%, rgba(120,150,196,0.16) 0%, rgba(120,150,196,0) 64%), radial-gradient(64% 58% at 82% 84%, rgba(138,166,206,0.12) 0%, rgba(138,166,206,0) 66%), linear-gradient(160deg, #FBFCFE 0%, #EDF2F8 100%)",
  // 02 — warm peach
  "radial-gradient(70% 60% at 22% 18%, rgba(232,176,128,0.18) 0%, rgba(232,176,128,0) 64%), radial-gradient(64% 58% at 84% 84%, rgba(236,168,120,0.13) 0%, rgba(236,168,120,0) 66%), linear-gradient(160deg, #FFFCF8 0%, #FBEEE0 100%)",
  // 03 — cool blue (variation)
  "radial-gradient(70% 60% at 20% 20%, rgba(110,142,190,0.15) 0%, rgba(110,142,190,0) 64%), radial-gradient(64% 58% at 82% 82%, rgba(132,160,202,0.12) 0%, rgba(132,160,202,0) 66%), linear-gradient(160deg, #FAFCFE 0%, #EBF1F8 100%)",
  // 04 — soft green
  "radial-gradient(70% 60% at 20% 80%, rgba(150,188,142,0.17) 0%, rgba(150,188,142,0) 64%), radial-gradient(64% 58% at 80% 22%, rgba(168,200,160,0.12) 0%, rgba(168,200,160,0) 66%), linear-gradient(160deg, #FBFEF9 0%, #EDF5EA 100%)",
  // 05 — lavender
  "radial-gradient(70% 60% at 22% 20%, rgba(168,156,206,0.16) 0%, rgba(168,156,206,0) 64%), radial-gradient(64% 58% at 82% 84%, rgba(182,172,214,0.12) 0%, rgba(182,172,214,0) 66%), linear-gradient(160deg, #FDFCFE 0%, #F1EEF8 100%)",
  // 06 — warm peach (variation)
  "radial-gradient(70% 60% at 22% 18%, rgba(236,172,124,0.17) 0%, rgba(236,172,124,0) 64%), radial-gradient(64% 58% at 84% 84%, rgba(240,176,128,0.12) 0%, rgba(240,176,128,0) 66%), linear-gradient(160deg, #FFFCF7 0%, #FBEFE1 100%)",
];

const HOME_SERVICE_BORDERS: string[] = [
  "rgba(130,158,196,0.30)",
  "rgba(230,176,130,0.32)",
  "rgba(124,152,194,0.30)",
  "rgba(156,190,146,0.30)",
  "rgba(172,160,206,0.30)",
  "rgba(234,176,128,0.32)",
];

function GrainOverlay() {
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.055 }}
      aria-hidden="true"
    >
      <defs>
        <filter id="grain-filter" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.72"
            numOctaves="4"
            stitchTiles="stitch"
          >
            <animate
              attributeName="seed"
              values="0;20;40;60;80;100;0"
              dur="12s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#grain-filter)" />
    </svg>
  );
}

export default function Home() {
  const BG = "#F8F8F6";
  const TEXT = "#0A0A0A";

  // Wash-card palette + helpers now live in @/components/WashCard (shared site-wide).

  const softTex = {
    backgroundImage:
      "radial-gradient(120% 75% at 50% -8%, rgba(194,168,120,0.07) 0%, rgba(194,168,120,0) 58%)",
    backgroundSize: "100% 100%",
  } as React.CSSProperties;

  const hm = usePublicContent<HomeData>("home", DEFAULTS);

  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const handle = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      setMouse({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };
    hero.addEventListener("mousemove", handle);
    return () => hero.removeEventListener("mousemove", handle);
  }, []);

  const [ctaEmail, setCtaEmail] = useState("");
  const [ctaSubmitted, setCtaSubmitted] = useState(false);
  const [ctaSubmitting, setCtaSubmitting] = useState(false);
  const [ctaError, setCtaError] = useState("");

  const handleCtaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctaEmail.trim()) return;
    setCtaSubmitting(true);
    setCtaError("");
    try {
      const res = await fetch(`${API_BASE}/forms/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ctaEmail, source: "Homepage CTA" }),
      });
      if (res.ok) {
        setCtaSubmitted(true);
      } else {
        setCtaError("Something went wrong. Please try again.");
      }
    } catch {
      setCtaError("Something went wrong. Please try again.");
    } finally {
      setCtaSubmitting(false);
    }
  };

  return (
    <div style={{ background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      <SEOMeta
        title="GrowitBuddy - Content Marketing Agency | Authority Systems for Founders & Creators"
        description="Build real authority and inbound growth. GrowitBuddy creates content systems, personal branding strategies, and distribution infrastructure that compounds over time for founders and creators."
        schema={{
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What does GrowitBuddy do?",
              "acceptedAnswer": { "@type": "Answer", "text": "GrowitBuddy builds content and distribution systems for founders and creators. We combine content creation, personal branding strategy, and distribution infrastructure to generate real inbound leads and authority." }
            },
            {
              "@type": "Question",
              "name": "What is an authority system?",
              "acceptedAnswer": { "@type": "Answer", "text": "An authority system is a repeatable content and distribution infrastructure that consistently positions you as the most recognized expert in your niche - attracting inbound opportunities without cold outreach." }
            },
            {
              "@type": "Question",
              "name": "Who does GrowitBuddy work with?",
              "acceptedAnswer": { "@type": "Answer", "text": "We work with founders, startup CEOs, coaches, consultants, and content creators who want to build authority, grow their audience, and generate consistent inbound leads through content marketing." }
            },
            {
              "@type": "Question",
              "name": "How is GrowitBuddy different from other content marketing agencies?",
              "acceptedAnswer": { "@type": "Answer", "text": "We don't just create content - we build the full Content → Distribution → Authority → Inbound system. Most agencies create content and hope it spreads. We build infrastructure that compounds over time." }
            }
          ]
        } as Record<string, unknown>}
      />

      <style>{`
        .home-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
        .home-stats-item { border-right: 1px solid rgba(10,10,10,0.06); }
        .home-stats-item:last-child { border-right: none; }
        .home-proof-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .home-system-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

        .home-problem-section { padding: 100px 24px; }
        .home-problem-headline { margin-bottom: 64px; }
        .home-problem-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .home-problem-card { padding: 36px 32px; }

        @media (max-width: 900px) {
          .home-system-grid { grid-template-columns: repeat(2, 1fr); }
          .home-proof-grid { grid-template-columns: repeat(2, 1fr); }
          .home-problem-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
        @media (max-width: 600px) {
          .home-stats-grid { grid-template-columns: 1fr; }
          .home-stats-item { border-right: none; border-bottom: 1px solid rgba(10,10,10,0.06); padding: 36px 24px !important; }
          .home-stats-item:last-child { border-bottom: none; }
          .home-proof-grid { grid-template-columns: 1fr; }
          .home-system-grid { grid-template-columns: 1fr; }
          .home-problem-section { padding: 64px 16px; }
          .home-problem-headline { margin-bottom: 36px; }
          .home-problem-grid { grid-template-columns: 1fr; gap: 10px; }
          .home-problem-card { padding: 28px 22px; }
        }
      `}</style>

      {/* ══ 1. HERO ══ */}
      <section
        ref={heroRef}
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          paddingTop: 120,
          paddingBottom: 60,
        }}
      >
        <GrainOverlay />
        <BlueprintLines hatch midCrosses topCrosses={false} bottomCrosses={false} hatchFrom={52} />
        <DotGrid />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle 600px at ${mouse.x}% ${mouse.y}%, rgba(30,41,59,0.06) 0%, rgba(30,41,59,0.03) 50%, transparent 75%)`,
            transition: "background 0.15s ease-out",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 900, padding: "0 24px" }}>
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#FFFFFF",
              border: "1px solid #E5E5E0",
              borderRadius: 100,
              padding: "6px 14px",
              marginBottom: 32,
            }}
          >
            <Star className="w-3 h-3" style={{ color: "#C2A878", fill: "#C2A878" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0A0A0A", letterSpacing: "0.04em" }}>
              {hm.heroBadge}
            </span>
          </m.div>

          <m.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontWeight: 800,
              fontSize: "clamp(28px, 8vw, 80px)",
              lineHeight: "1.05",
              letterSpacing: "-0.04em",
              margin: "0 0 28px",
              color: TEXT,
              maxWidth: "18ch",
              textWrap: "balance" as React.CSSProperties["textWrap"],
            }}
          >
            {hm.heroHeadline}{" "}
            <span style={{ fontStyle: "italic" }}>{hm.heroHeadlineItalic}</span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            style={{
              fontSize: "clamp(15px, 2vw, 19px)",
              color: "#5F5F5F",
              maxWidth: "52ch",
              margin: "0 auto 44px",
              lineHeight: "1.7",
              fontWeight: 400,
            }}
          >
            {hm.heroSubtext}
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
          >
            <Link href="/contact?to=cal">
              <span className="gb-btn" style={{ fontSize: 15, padding: "14px 28px" }} data-testid="button-book-demo">
                {hm.heroCTAPrimary}
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link href="/work">
              <span className="gb-btn-outline" style={{ fontSize: 15, padding: "13px 28px" }}>
                {hm.heroCTASecondary}
              </span>
            </Link>
          </m.div>
        </div>
      </section>

      {/* ══ 2. STATS ══ */}
      <section style={{ borderTop: "1px solid #E5E5E0", borderBottom: "1px solid #E5E5E0", backgroundColor: "#FFFFFF", padding: "0 24px", ...softTex }}>
        <div className="max-w-[1100px] mx-auto home-stats-grid">
          {(hm.stats || []).map((stat, i) => (
            <m.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              className="home-stats-item"
              style={{
                padding: "48px 32px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ width: 32, height: 2, background: "#C2A878", borderRadius: 2, marginBottom: 20 }} />
              <div style={{ fontSize: "clamp(36px, 4.5vw, 56px)", fontWeight: 800, letterSpacing: "-0.04em", color: TEXT, lineHeight: 1, marginBottom: 12 }}>
                <CountUp value={stat.value} />
              </div>
              <div style={{ fontSize: 13, color: "#8A8A8A", fontWeight: 500, maxWidth: "20ch", lineHeight: 1.6, textAlign: "center" }}>{stat.label}</div>
            </m.div>
          ))}
        </div>
      </section>

      {/* ══ 3. PROBLEM ══ */}
      <section className="home-problem-section" style={{ background: "#171F2D", backgroundImage: "var(--gb-grain)", backgroundSize: "150px 150px", backgroundRepeat: "repeat", position: "relative", overflow: "hidden" }}>
        <div className="max-w-[1100px] mx-auto" style={{ position: "relative", zIndex: 1 }}>
          <FadeUp>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 32, height: 1, background: "#C2A878" }} />
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C2A878", margin: 0 }}>
                {hm.problemLabel}
              </p>
            </div>
            <h2 className="home-problem-headline" style={{ fontWeight: 800, fontSize: "clamp(22px, 5vw, 54px)", letterSpacing: "-0.035em", lineHeight: "1.08", color: "#FFFFFF", maxWidth: "20ch" }}>
              {hm.problemHeadline}
            </h2>
          </FadeUp>
          <div className="home-problem-grid">
            {(hm.problems || []).map((p, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-5%" }}
                transition={{ delay: i * 0.12, duration: 0.55 }}
                className="home-problem-card"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Gold top accent bar */}
                <div style={{ position: "absolute", top: 0, left: 32, right: 32, height: 2, background: "linear-gradient(90deg, #C2A878 0%, transparent 100%)", borderRadius: 1 }} />

                {/* Large decorative number */}
                <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1, color: "rgba(194,168,120,0.15)", marginBottom: 8, fontFamily: "'Inter', sans-serif", userSelect: "none" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>

                {/* Label */}
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C2A878", marginBottom: 16 }}>
                  Problem {String(i + 1).padStart(2, "0")}
                </p>

                <h3 style={{ fontWeight: 800, fontSize: "clamp(17px, 2vw, 20px)", letterSpacing: "-0.025em", color: "#FFFFFF", marginBottom: 16, lineHeight: "1.3", flex: 1 }}>{p.title}</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: "1.8", margin: 0 }}>{p.desc}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. YOUR CONTENT GROWTH SYSTEM ══ */}
      <section style={{ padding: "100px 24px", backgroundColor: "#EFEFEA", borderTop: "1px solid #E5E5E0", ...softTex }}>
        <div className="max-w-[1100px] mx-auto">
          <FadeUp>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 16 }}>
              {hm.servicesLabel}
            </p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 5vw, 54px)", letterSpacing: "-0.035em", lineHeight: "1.08", color: "#0A0A0A", maxWidth: "22ch", marginBottom: 16 }}>
              {hm.servicesHeadline}
            </h2>
            <p style={{ fontSize: 16, color: "#5F5F5F", lineHeight: "1.7", marginBottom: 56, maxWidth: "48ch" }}>
              One complete system to go from invisible to inbound.
            </p>
          </FadeUp>

          <div className="home-system-grid">
            {(hm.services || []).map((s, i) => {
              const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
              return (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.09, duration: 0.5 }}
                  style={getWashCardStyle(i, {
                    padding: "30px 28px 28px",
                    display: "flex",
                    flexDirection: "column",
                    background: HOME_SERVICE_WASHES[i % HOME_SERVICE_WASHES.length],
                    border: `1px solid ${HOME_SERVICE_BORDERS[i % HOME_SERVICE_BORDERS.length]}`,
                  })}
                >
                  <CardGrain />
                  {/* Outline icon at the top of the card */}
                  <div style={{ position: "relative", marginBottom: 26, color: "#14202E" }}>
                    <Icon size={26} strokeWidth={1.6} aria-hidden="true" focusable="false" />
                  </div>
                  {/* Card number, then the title beneath it */}
                  <div style={{ position: "relative", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "#9A9488", marginBottom: 10 }}>
                    {s.num}
                  </div>
                  <h3 style={{ position: "relative", fontWeight: 800, fontSize: 19, letterSpacing: "-0.02em", color: "#0F1822", margin: 0, marginBottom: 12 }}>
                    {s.title}
                  </h3>
                  <p style={{ position: "relative", fontSize: 14, color: "#4B5563", lineHeight: "1.7", flex: 1, margin: 0 }}>{s.desc}</p>
                  <div style={{ position: "relative", marginTop: 26 }}>
                    <a
                      href={s.href}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        padding: "9px 16px",
                        borderRadius: 9,
                        textDecoration: "none",
                        transition: "box-shadow 0.15s ease, transform 0.15s ease",
                        background: "#FFFFFF",
                        color: "#1E293B",
                        border: "1px solid rgba(15,24,34,0.10)",
                        boxShadow: "0 4px 12px -6px rgba(30,41,59,0.22)",
                      }}
                    >
                      Explore Service <span aria-hidden="true" style={{ fontSize: 14 }}>→</span>
                    </a>
                  </div>
                </m.div>
              );
            })}
          </div>

          <div style={{ textAlign: "center", marginTop: 52 }}>
            <Link href="/contact?to=cal">
              <span className="gb-btn" style={{ fontSize: 15 }}>
                Get your growth breakdown
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ 5. PROOF OF WORK ══ */}
      <section className="gb-dots" style={{ padding: "100px 24px", backgroundColor: BG }}>
        <div className="max-w-[1100px] mx-auto">
          <FadeUp>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 16 }}>{hm.proofLabel}</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 5vw, 54px)", letterSpacing: "-0.035em", lineHeight: "1.08", color: TEXT, maxWidth: "16ch", marginBottom: 60 }}>
              {hm.proofHeadline}
            </h2>
          </FadeUp>
          <div className="home-proof-grid">
            {(hm.proof || []).map((p, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                style={getWashCardStyle(i, { padding: "32px 28px" })}
              >
                <CardGrain />
                <p style={{ position: "relative", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5A6675", marginBottom: 20 }}>{p.category}</p>
                <div style={{ position: "relative", fontSize: "clamp(36px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#0F1822", lineHeight: 1, marginBottom: 4 }}>
                  <CountUp value={p.metric} />
                </div>
                <p style={{ position: "relative", fontSize: 13, color: "#5A6675", marginBottom: 16 }}>{p.unit}</p>
                <h3 style={{ position: "relative", fontSize: 16, fontWeight: 700, color: "#0F1822", lineHeight: 1.4 }}>{p.name}</h3>
              </m.div>
            ))}
          </div>
          <div style={{ marginTop: 40, textAlign: "center" }}>
            <Link href="/work">
              <span className="gb-btn-outline" style={{ fontSize: 14 }}>See All Case Studies <ArrowRight className="w-4 h-4" /></span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ 6. ECOSYSTEM ══ */}
      <section style={{ padding: "100px 24px", background: BG, borderTop: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">
          <FadeUp>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 16 }}>{hm.ecosystemLabel}</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 5vw, 54px)", letterSpacing: "-0.035em", lineHeight: "1.08", color: TEXT, maxWidth: "22ch", marginBottom: 60 }}>
              {hm.ecosystemHeadline}
            </h2>
          </FadeUp>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {[
              { tag: hm.ecosystemCreatorTag, title: hm.ecosystemCreatorTitle, desc: hm.ecosystemCreatorDesc, cta: hm.ecosystemCreatorCTA, href: "/creators", dark: false },
              { tag: hm.ecosystemFreelancerTag, title: hm.ecosystemFreelancerTitle, desc: hm.ecosystemFreelancerDesc, cta: hm.ecosystemFreelancerCTA, href: "/freelancers", dark: true },
            ].map((card, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                style={getWashCardStyle(i, { padding: "40px 36px" })}
              >
                <CardGrain />
                <p style={{ position: "relative", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gb-accent)", marginBottom: 20 }}>{card.tag}</p>
                <h3 style={{ position: "relative", fontWeight: 800, fontSize: "clamp(22px, 3vw, 30px)", letterSpacing: "-0.03em", lineHeight: "1.15", color: "#0F1822", marginBottom: 16 }}>{card.title}</h3>
                <p style={{ position: "relative", fontSize: 15, color: "#374151", lineHeight: "1.75", marginBottom: 32 }}>{card.desc}</p>
                <Link href={card.href}>
                  <span className="gb-btn">
                    {card.cta}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 7. BUILT FOR ══ */}
      <section style={{ padding: "100px 24px", backgroundColor: "#FFFFFF", borderTop: "1px solid #E5E5E0", ...softTex }}>
        <div className="max-w-[1100px] mx-auto">
          <FadeUp>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 16 }}>
              Who we work with
            </p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 5vw, 54px)", letterSpacing: "-0.035em", lineHeight: "1.08", color: "#0A0A0A", maxWidth: "18ch", marginBottom: 60 }}>
              Built for people who are serious about growth.
            </h2>
          </FadeUp>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 14 }}>
            {[
              {
                icon: Rocket,
                title: "Founders",
                problem: "Expertise that stays invisible",
                outcome: "A personal brand that generates inbound leads, speaking invites, and partnerships without cold outreach.",
              },
              {
                icon: Sparkles,
                title: "Creators",
                problem: "Content without a distribution system",
                outcome: "A monetizable audience built on a content system designed for compounding long-term growth.",
              },
              {
                icon: Building2,
                title: "Agencies",
                problem: "Content output that doesn't scale",
                outcome: "A white-label or collaborative content and distribution engine - without building an in-house team.",
              },
              {
                icon: ShoppingBag,
                title: "Ecommerce Brands",
                problem: "Ad spend with no organic flywheel",
                outcome: "Brand equity and organic reach through content that converts browsers into buyers.",
              },
              {
                icon: Cloud,
                title: "SaaS Companies",
                problem: "Long sales cycles and low organic visibility",
                outcome: "Thought leadership content that shortens deal cycles and brings qualified inbound consistently.",
              },
              {
                icon: GraduationCap,
                title: "Coaches & Experts",
                problem: "Premium knowledge packaged poorly",
                outcome: "A distribution-first brand that attracts premium clients and positions you as the obvious authority.",
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                style={getWashCardStyle(i, {
                  padding: "26px 26px 28px",
                  minHeight: 320,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                })}
              >
                <CardGrain />
                <WashIconChip index={i} icon={Icon} />
                <h3 style={{ position: "relative", fontWeight: 800, fontSize: 23, letterSpacing: "-0.02em", color: "#0F1822", marginTop: "auto", marginBottom: 10 }}>
                  {card.title}
                </h3>
                <p style={{ position: "relative", fontSize: 13.5, fontWeight: 700, color: "#283440", marginBottom: 10, letterSpacing: "0.01em" }}>
                  ↳ {card.problem}
                </p>
                <p style={{ position: "relative", fontSize: 14, fontWeight: 500, color: "#374151", lineHeight: "1.7" }}>
                  {card.outcome}
                </p>
              </m.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ 8. TESTIMONIALS ══ */}
      <section style={{ padding: "80px 24px 100px", backgroundColor: "#FFFFFF", ...softTex }}>
        <div className="max-w-[1100px] mx-auto">
          <FadeUp>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(26px, 4vw, 48px)", letterSpacing: "-0.035em", textAlign: "center", color: TEXT, marginBottom: 48 }}>
              {hm.testimonialsHeadline}
            </h2>
          </FadeUp>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {(hm.testimonials || []).map((t, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                style={getWashCardStyle(i, { padding: "28px" })}
              >
                <CardGrain />
                <div style={{ position: "relative", display: "flex", gap: 2, marginBottom: 16 }}>
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4" style={{ color: "#C2A878", fill: "#C2A878" }} />)}
                </div>
                <p style={{ position: "relative", fontSize: 15, color: "#374151", lineHeight: "1.75", marginBottom: 24 }}>"{t.quote}"</p>
                <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.62)", border: `1px solid ${getWashBorder(i)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#1E293B", flexShrink: 0 }}>{t.initials}</div>
                  <div>
                    <p style={{ position: "relative", fontSize: 14, fontWeight: 700, color: "#0F1822" }}>{t.name}</p>
                    <p style={{ position: "relative", fontSize: 12, color: "#5A6675" }}>{t.role}</p>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8. FINAL CTA ══ */}
      <section style={{ padding: "100px 24px", background: "#EFEFEA", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="max-w-[700px] mx-auto">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", margin: "0 auto 28px", background: "#1E293B", border: "2px solid rgba(30,41,59,0.3)", flexShrink: 0 }}>
              <video autoPlay loop muted playsInline style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}>
                <source src="/logo-circle.mp4?v=2" type="video/mp4" />
              </video>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(28px, 8vw, 68px)", letterSpacing: "-0.04em", lineHeight: "1.05", color: "#0A0A0A", marginBottom: 24, textAlign: "center", maxWidth: "100%", marginLeft: "auto", marginRight: "auto" }}>
              {hm.ctaHeadline.includes("authority") ? (
                <>
                  {hm.ctaHeadline.split("authority")[0]}authority
                  <br />
                  {hm.ctaHeadline.split("authority")[1]}
                </>
              ) : hm.ctaHeadline}
            </h2>
            <p style={{ fontSize: 17, color: "#5F5F5F", lineHeight: "1.75", marginBottom: 40, maxWidth: "46ch", margin: "0 auto 40px" }}>
              {hm.ctaSubtext}
            </p>

            {ctaSubmitted ? (
              <div style={{ background: "rgba(10,10,10,0.06)", border: "1.5px solid #CBD0DA", borderRadius: 16, padding: "20px 28px", marginBottom: 24 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#0A0A0A" }}>{hm.ctaSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleCtaSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-2 sm:justify-center mb-6 w-full" data-testid="home-cta-form">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={ctaEmail}
                  onChange={(e) => setCtaEmail(e.target.value)}
                  className="w-full sm:w-auto"
                  style={{ height: 52, padding: "0 20px", borderRadius: 100, border: "1.5px solid rgba(10,10,10,0.1)", background: "rgba(10,10,10,0.03)", color: "#0A0A0A", fontSize: 15, fontFamily: "'Inter', sans-serif", outline: "none", flexShrink: 0, minWidth: 0 }}
                />
                <button
                  type="submit"
                  disabled={ctaSubmitting}
                  className="gb-btn w-full sm:w-auto justify-center"
                  style={{ fontSize: 15, padding: "14px 28px", height: 52 }}
                  data-testid="home-cta-submit"
                >
                  {ctaSubmitting ? "Submitting…" : hm.ctaButton}
                  {!ctaSubmitting && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}
            {ctaError && (
              <p style={{ fontSize: 14, color: "rgba(255,100,100,0.85)", marginBottom: 12, marginTop: -8 }}>{ctaError}</p>
            )}

            <Link href="/authority-audit">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#8A8A8A", fontSize: 14, fontWeight: 500, cursor: "pointer", borderBottom: "1px solid rgba(10,10,10,0.15)", paddingBottom: 1, transition: "color 0.18s" }} className="hover:text-[#0A0A0A]">
                {hm.ctaSecondaryLink}
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </m.div>
        </div>
      </section>
    </div>
  );
}
