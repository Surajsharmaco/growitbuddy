import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { API_BASE } from "@/lib/api";
import { ArrowRight, Check, ChevronRight, Star, X } from "lucide-react";
import { Link } from "wouter";
import { FadeUp } from "@/components/effects/TextReveal";
import CountUp from "@/components/effects/CountUp";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";
import HalftoneDots from "@/components/effects/HalftoneDots";

interface HomeData {
  heroBadge: string;
  heroHeadline: string;
  heroHeadlineItalic: string;
  heroSubtext: string;
  heroCTAPrimary: string;
  heroCTASecondary: string;
  stats: Array<{ value: string; label: string }>;
  problemLabel: string;
  problemHeadline: string;
  problems: Array<{ title: string; desc: string }>;
  solutionLabel: string;
  solutionHeadline: string;
  solutionBeforeLabel: string;
  solutionAfterLabel: string;
  solutionBefore: string[];
  solutionAfter: string[];
  servicesLabel: string;
  servicesHeadline: string;
  services: Array<{ num: string; title: string; desc: string; href: string }>;
  frameworkLabel: string;
  frameworkHeadline: string;
  frameworkSteps: Array<{ step: string; title: string; desc: string }>;
  frameworkCTA: string;
  proofLabel: string;
  proofHeadline: string;
  proof: Array<{ metric: string; unit: string; name: string; category: string }>;
  processLabel: string;
  processHeadline: string;
  processSteps: Array<{ num: string; title: string; desc: string }>;
  ecosystemLabel: string;
  ecosystemHeadline: string;
  ecosystemCreatorTag: string;
  ecosystemCreatorTitle: string;
  ecosystemCreatorDesc: string;
  ecosystemCreatorCTA: string;
  ecosystemFreelancerTag: string;
  ecosystemFreelancerTitle: string;
  ecosystemFreelancerDesc: string;
  ecosystemFreelancerCTA: string;
  auditLabel: string;
  auditHeadline: string;
  auditSubtext: string;
  auditCTA: string;
  founderLabel: string;
  founderPhoto: string;
  founderInitials: string;
  founderName: string;
  founderQuote: string;
  founderTags: string[];
  testimonialsHeadline: string;
  testimonials: Array<{ quote: string; name: string; role: string; initials: string }>;
  ctaHeadline: string;
  ctaSubtext: string;
  ctaButton: string;
  ctaSuccess: string;
  ctaSecondaryLink: string;
}

const DEFAULTS: HomeData = {
  heroBadge: "700M+ views generated for our clients",
  heroHeadline: "We create and distribute content that builds your",
  heroHeadlineItalic: "authority.",
  heroSubtext:
    "We help founders, creators, and businesses turn expertise into authority and that authority into consistent inbound demand through content strategy and distribution.",
  heroCTAPrimary: "Book a Strategy Call",
  heroCTASecondary: "See Our Work",
  stats: [
    { value: "700M+", label: "Views Generated Across Content Networks" },
    { value: "200+",  label: "Founders & Brands Served" },
    { value: "90K+",  label: "Content Assets Created Across High-Volume Pages" },
  ],
  problemLabel: "The Problem",
  problemHeadline: "Most content gets attention. Very little builds authority.",
  problems: [
    {
      title: "You're creating content. But it's not part of a real content strategy.",
      desc: "Most content gets a few likes, then disappears. Without a clear content strategy and positioning, your output doesn't build the kind of trust that turns followers into paying clients.",
    },
    {
      title: "You're getting attention - but not reaching the right audience.",
      desc: "Reach without relevance leads nowhere. Without precise audience targeting, your content misses the decision-makers and buyers who actually matter to your business.",
    },
    {
      title: "You have no system - just constant effort.",
      desc: "Showing up consistently is exhausting when every post is a new decision. Without a structured content system, growth stays unpredictable no matter how much effort you put in.",
    },
  ],
  solutionLabel: "The Solution",
  solutionHeadline: "From random content - to a system that builds authority.",
  solutionBeforeLabel: "Content without a system",
  solutionAfterLabel: "With GrowitBuddy",
  solutionBefore: [
    "Content with no strategic direction",
    "Reach without the right audience",
    "Metrics without real business outcomes",
    "Inconsistency and creative burnout",
    "No compounding effect over time",
  ],
  solutionAfter: [
    "Clear positioning before any content",
    "Consistent reach to the right people",
    "Content that builds trust and drives demand",
    "A system that runs without daily effort",
    "Authority that compounds with every piece",
  ],
  servicesLabel: "Services",
  servicesHeadline:
    "Everything you need to build authority and generate inbound demand.",
  services: [
    {
      num: "01",
      title: "Content Creation",
      desc: "High-volume content systems designed to build visibility, trust, and long-term authority across modern platforms.",
      href: "/services#service-1",
    },
    {
      num: "02",
      title: "Personal Branding",
      desc: "Authority positioning systems that help founders, creators, and brands become recognized voices in their category.",
      href: "/services#service-2",
    },
    {
      num: "03",
      title: "Distribution & Growth",
      desc: "Distribution infrastructure designed to amplify reach, compound attention, and generate inbound demand.",
      href: "/services#service-3",
    },
    {
      num: "04",
      title: "Web & Funnel Systems",
      desc: "Digital systems built to convert authority into inbound leads, trust, and scalable opportunities.",
      href: "/services#service-4",
    },
    {
      num: "05",
      title: "AI Automation",
      desc: "AI-powered systems that automate communication, support, lead flow, and creator operations.",
      href: "/services#service-5",
    },
    {
      num: "06",
      title: "Digital Products & Growth",
      desc: "Systems designed to help creators and brands monetize attention through products, communities, and scalable offers.",
      href: "/services#service-6",
    },
  ],
  frameworkLabel: "Framework",
  frameworkHeadline: "The GrowitBuddy System.",
  frameworkSteps: [
    {
      step: "01",
      title: "Content",
      desc: "High-quality content built around your positioning - video, graphics, and copy that captures attention and communicates authority.",
    },
    {
      step: "02",
      title: "Distribution",
      desc: "A structured system to push your content to the right audiences through ads, creators, and our owned network - at scale.",
    },
    {
      step: "03",
      title: "Authority",
      desc: "Consistent visibility to the right people builds recognition and trust. Your name becomes the first one they think of in your space.",
    },
    {
      step: "04",
      title: "Inbound",
      desc: "Authority compounds. Qualified leads, partnerships, and opportunities start coming to you - without chasing them.",
    },
  ],
  frameworkCTA: "Explore the Full Framework",
  proofLabel: "Results",
  proofHeadline: "Real results. Real inbound growth.",
  proof: [
    { metric: "700M+", unit: "views generated", name: "Across content networks and brand campaigns", category: "Distribution · Multi-channel" },
    { metric: "200+",  unit: "founders & brands served", name: "Across industries and content verticals", category: "Network · Global" },
    { metric: "90K+",  unit: "content assets created", name: "Across high-volume pages and channels", category: "Content · High-Volume" },
  ],
  processLabel: "Process",
  processHeadline: "How we build your authority system.",
  processSteps: [
    {
      num: "01",
      title: "Understand",
      desc: "We study your market, your audience, and your current positioning to identify exactly where your content marketing opportunity is.",
    },
    {
      num: "02",
      title: "Strategize",
      desc: "We design your content planning roadmap - what to say, where to say it, and how to say it in a way that builds trust and drives real inbound demand.",
    },
    {
      num: "03",
      title: "Execute",
      desc: "Our team handles content creation and distribution every week - so you can focus entirely on running your business.",
    },
    {
      num: "04",
      title: "Scale",
      desc: "We track performance, refine your growth strategy, and expand your content reach as your authority compounds over time.",
    },
  ],
  ecosystemLabel: "Ecosystem",
  ecosystemHeadline: "Built for creators and freelancers too.",
  ecosystemCreatorTag: "For Creators",
  ecosystemCreatorTitle: "Turn your platform into consistent income.",
  ecosystemCreatorDesc:
    "We help creators build a positioned, monetized content system - so your audience turns into a real business, not just a following.",
  ecosystemCreatorCTA: "Join as a Creator",
  ecosystemFreelancerTag: "For Freelancers",
  ecosystemFreelancerTitle: "Join the GrowitBuddy network.",
  ecosystemFreelancerDesc:
    "Are you a writer, editor, or strategist? Apply to work with ambitious founders and help them build the authority they deserve.",
  ecosystemFreelancerCTA: "Apply to Join",
  auditLabel: "Content Growth Diagnosis",
  auditHeadline: "Find out exactly what's limiting your content growth.",
  auditSubtext:
    "Answer 6 questions and get a personalized breakdown of exactly what's holding your content marketing back - free, in under 2 minutes.",
  auditCTA: "Get My Growth Diagnosis",
  founderLabel: "Founder",
  founderPhoto: "",
  founderInitials: "SS",
  founderName: "Suraj Sharma",
  founderQuote:
    "\"I built GrowitBuddy after watching brilliant founders lose market position to louder, less qualified voices. Authority isn't given - it's built. We built the systems to do it consistently.\"",
  founderTags: ["Founder & CEO", "Content Strategist", "Authority Architect"],
  testimonialsHeadline: "What our clients say.",
  testimonials: [
    {
      quote:
        "We went from 0 to 50K LinkedIn followers in 90 days and closed 3 enterprise deals from content alone.",
      name: "Marcus Johnson",
      role: "Founder, TechScale Labs",
      initials: "MJ",
    },
    {
      quote:
        "GrowitBuddy helped us create content that drives investor interest and partnership deals. Creative, fast, and reliable.",
      name: "Sarah Chen",
      role: "CEO, VentureEdge",
      initials: "SC",
    },
    {
      quote:
        "Real engagement growth and inbound leads after partnering with GrowitBuddy. They're experts at authority-driven content.",
      name: "Jordan Lally",
      role: "Founder & CEO, SaaSGrowth Co.",
      initials: "JL",
    },
  ],
  ctaHeadline: "If your content isn't driving results, it's not a content problem.",
  ctaSubtext:
    "It's a distribution and authority problem. Book a free growth breakdown - we'll show you exactly what to fix and how.",
  ctaButton: "Get your growth breakdown",
  ctaSuccess: "You're on the list. We'll be in touch within 24 hours.",
  ctaSecondaryLink: "Take the Authority Audit",
};

function PremiumBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;
    const GAP = 24;
    const MAX_R = 5.5;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / GAP) + 2;
      const rows = Math.ceil(height / GAP) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * GAP + (r % 2 === 0 ? 0 : GAP / 2);
          const y = r * GAP * 0.866;

          const w1 = Math.sin(c * 0.22 + r * 0.14 - t * 1.8) * 0.5 + 0.5;
          const w2 = Math.sin(c * 0.11 - r * 0.19 + t * 1.3 + 2.4) * 0.5 + 0.5;
          const w3 = Math.cos(c * 0.08 + r * 0.28 - t * 0.9 + 1.1) * 0.5 + 0.5;

          const val = w1 * 0.5 + w2 * 0.3 + w3 * 0.2;
          const radius = Math.pow(val, 1.6) * MAX_R;

          if (radius < 0.25) continue;

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(30,41,59,${(val * 0.04).toFixed(3)})`;
          ctx.fill();
        }
      }

      t += 0.018;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        filter: "blur(8px)",
      }}
    />
  );
}

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
        <PremiumBackground />
        <HalftoneDots
          style={{ position: "absolute", bottom: 0, left: 0, zIndex: 0, opacity: 0.14, pointerEvents: "none" }}
          origin="bottom-left" width={320} height={270}
        />
        <HalftoneDots
          style={{ position: "absolute", top: 80, right: 0, zIndex: 0, opacity: 0.10, pointerEvents: "none" }}
          origin="top-right" width={240} height={210}
        />

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
          <motion.div
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
          </motion.div>

          <motion.h1
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
          </motion.h1>

          <motion.p
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
          </motion.p>

          <motion.div
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
          </motion.div>
        </div>
      </section>

      {/* ══ 2. STATS ══ */}
      <section style={{ borderTop: "1px solid #E5E5E0", borderBottom: "1px solid #E5E5E0", background: "#FFFFFF", padding: "0 24px" }}>
        <div className="max-w-[1100px] mx-auto home-stats-grid">
          {hm.stats.map((stat, i) => (
            <motion.div
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
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ 3. PROBLEM ══ */}
      <section className="home-problem-section" style={{ background: "#1E293B", position: "relative", overflow: "hidden" }}>
        <HalftoneDots
          style={{ position: "absolute", bottom: 0, right: 0, opacity: 0.07, pointerEvents: "none" }}
          origin="bottom-right" width={400} height={300} maxRadius={2.8} spacing={18}
        />
        <HalftoneDots
          style={{ position: "absolute", top: 0, left: 0, opacity: 0.05, pointerEvents: "none" }}
          origin="top-left" width={300} height={220} maxRadius={2.4} spacing={16}
        />
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
            {hm.problems.map((p, i) => (
              <motion.div
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. YOUR CONTENT GROWTH SYSTEM ══ */}
      <section style={{ padding: "100px 24px", background: "#EFEFEA", borderTop: "1px solid #E5E5E0" }}>
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
            {hm.services.map((s, i) => {
              const isAccent = i === 5;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.09, duration: 0.5 }}
                  style={{
                    background: isAccent ? "var(--gb-accent)" : "#FFFFFF",
                    border: isAccent ? "none" : "1.5px solid #E5E5E0",
                    borderRadius: 16,
                    padding: "32px 28px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: isAccent ? "rgba(255,255,255,0.15)" : "rgba(10,10,10,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, letterSpacing: "0.05em",
                    color: isAccent ? "#FFFFFF" : "#8A8A8A",
                    marginBottom: 20, flexShrink: 0,
                  }}>
                    {s.num}
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", color: isAccent ? "#FFFFFF" : TEXT, marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: isAccent ? "rgba(255,255,255,0.7)" : "#5F5F5F", lineHeight: "1.7", flex: 1 }}>{s.desc}</p>
                  <div style={{ marginTop: 24 }}>
                    <a
                      href={s.href}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        padding: "8px 16px",
                        borderRadius: 6,
                        textDecoration: "none",
                        transition: "opacity 0.15s",
                        background: isAccent ? "rgba(255,255,255,0.15)" : "rgba(30,41,59,0.06)",
                        color: isAccent ? "#FFFFFF" : "var(--gb-authority)",
                        border: isAccent ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(30,41,59,0.12)",
                      }}
                    >
                      Explore Service <span style={{ fontSize: 14 }}>→</span>
                    </a>
                  </div>
                </motion.div>
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
      <section style={{ padding: "100px 24px", background: BG }}>
        <div className="max-w-[1100px] mx-auto">
          <FadeUp>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 16 }}>{hm.proofLabel}</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 5vw, 54px)", letterSpacing: "-0.035em", lineHeight: "1.08", color: TEXT, maxWidth: "16ch", marginBottom: 60 }}>
              {hm.proofHeadline}
            </h2>
          </FadeUp>
          <div className="home-proof-grid">
            {hm.proof.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                style={{
                  background: i % 2 === 0 ? "#F5F5F2" : "#FFFFFF",
                  border: i % 2 === 0 ? "none" : "1.5px solid #E5E5E0",
                  borderRadius: 16,
                  padding: "32px 28px",
                }}
              >
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: i % 2 === 0 ? "#8A8A8A" : "rgba(11,11,11,0.3)", marginBottom: 20 }}>{p.category}</p>
                <div style={{ fontSize: "clamp(36px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#0A0A0A", lineHeight: 1, marginBottom: 4 }}>
                  <CountUp value={p.metric} />
                </div>
                <p style={{ fontSize: 13, color: i % 2 === 0 ? "#8A8A8A" : "rgba(11,11,11,0.4)", marginBottom: 16 }}>{p.unit}</p>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0A0A0A", lineHeight: 1.4 }}>{p.name}</h3>
              </motion.div>
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
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                style={{ background: card.dark ? "#EFEFEA" : "#FFFFFF", border: card.dark ? "1px solid #E5E5E0" : "1px solid rgba(30,41,59,0.18)", borderRadius: 20, padding: "40px 36px" }}
              >
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gb-accent)", marginBottom: 20 }}>{card.tag}</p>
                <h3 style={{ fontWeight: 800, fontSize: "clamp(22px, 3vw, 30px)", letterSpacing: "-0.03em", lineHeight: "1.15", color: "#0A0A0A", marginBottom: 16 }}>{card.title}</h3>
                <p style={{ fontSize: 15, color: "#5F5F5F", lineHeight: "1.75", marginBottom: 32 }}>{card.desc}</p>
                <Link href={card.href}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 100, background: "var(--gb-accent)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }} className="hover:opacity-80">
                    {card.cta}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 7. BUILT FOR ══ */}
      <section style={{ padding: "100px 24px", background: "#FFFFFF", borderTop: "1px solid #E5E5E0" }}>
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
                title: "Founders",
                problem: "Expertise that stays invisible",
                outcome: "A personal brand that generates inbound leads, speaking invites, and partnerships without cold outreach.",
              },
              {
                title: "Creators",
                problem: "Content without a distribution system",
                outcome: "A monetizable audience built on a content system designed for compounding long-term growth.",
              },
              {
                title: "Agencies",
                problem: "Content output that doesn't scale",
                outcome: "A white-label or collaborative content and distribution engine - without building an in-house team.",
              },
              {
                title: "Ecommerce Brands",
                problem: "Ad spend with no organic flywheel",
                outcome: "Brand equity and organic reach through content that converts browsers into buyers.",
              },
              {
                title: "SaaS Companies",
                problem: "Long sales cycles and low organic visibility",
                outcome: "Thought leadership content that shortens deal cycles and brings qualified inbound consistently.",
              },
              {
                title: "Coaches & Experts",
                problem: "Premium knowledge packaged poorly",
                outcome: "A distribution-first brand that attracts premium clients and positions you as the obvious authority.",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                style={{
                  background: i === 1 ? "#1E293B" : "#F8F8F6",
                  border: i === 1 ? "none" : "1.5px solid #E5E5E0",
                  borderRadius: 16,
                  padding: "32px 28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                <h3 style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.025em", color: i === 1 ? "#FFFFFF" : "#0A0A0A", marginBottom: 12 }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: 13, fontWeight: 600, color: i === 1 ? "rgba(194,168,120,0.8)" : "var(--gb-accent)", marginBottom: 16, letterSpacing: "0.01em" }}>
                  ↳ {card.problem}
                </p>
                <p style={{ fontSize: 14, color: i === 1 ? "rgba(255,255,255,0.6)" : "#5F5F5F", lineHeight: "1.75", marginTop: "auto" }}>
                  {card.outcome}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8. TESTIMONIALS ══ */}
      <section style={{ padding: "80px 24px 100px", background: "#FFFFFF" }}>
        <div className="max-w-[1100px] mx-auto">
          <FadeUp>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(26px, 4vw, 48px)", letterSpacing: "-0.035em", textAlign: "center", color: TEXT, marginBottom: 48 }}>
              {hm.testimonialsHeadline}
            </h2>
          </FadeUp>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {hm.testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                style={{ background: BG, border: "1.5px solid #E5E5E0", borderRadius: 16, padding: "28px" }}
              >
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4" style={{ color: "#C2A878", fill: "#C2A878" }} />)}
                </div>
                <p style={{ fontSize: 15, color: "#5F5F5F", lineHeight: "1.75", marginBottom: 24 }}>"{t.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(30,41,59,0.18)", border: "1px solid rgba(30,41,59,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--gb-accent-hover)", flexShrink: 0 }}>{t.initials}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: "#7A7A85" }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8. FINAL CTA ══ */}
      <section style={{ padding: "100px 24px", background: "#EFEFEA", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <HalftoneDots
          style={{ position: "absolute", top: 0, left: 0, opacity: 0.15, pointerEvents: "none" }}
          origin="top-left" width={280} height={220}
        />
        <HalftoneDots
          style={{ position: "absolute", bottom: 0, right: 0, opacity: 0.15, pointerEvents: "none" }}
          origin="bottom-right" width={280} height={220}
        />
        <div className="max-w-[700px] mx-auto">
          <motion.div
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
          </motion.div>
        </div>
      </section>
    </div>
  );
}
