import { useEffect, useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Quote } from "lucide-react";

import { API_BASE } from "@/lib/api";

interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  youtubeUrl: string;
  description: string | null;
  sortOrder: number;
}

const BRAND_ACCENT = "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)";

// Stable, neutral hero images per category (picsum seeds — always available)
const HERO_SEEDS: Record<string, string[]> = {
  "Personal Branding": ["pb-1", "pb-2", "pb-3"],
  "Graphics": ["gx-1", "gx-2", "gx-3"],
  "Social Media Management": ["sm-1", "sm-2", "sm-3"],
  "Distribution & Growth": ["dg-1", "dg-2", "dg-3"],
  "Web & Funnel Systems": ["wf-1", "wf-2", "wf-3"],
  "AI Automation": ["ai-1", "ai-2", "ai-3"],
  "Digital Products & Growth": ["dp-1", "dp-2", "dp-3"],
};

function picsum(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

function getEmbedUrl(url: string): string {
  let videoId = "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) videoId = u.pathname.slice(1);
    else if (u.hostname.includes("youtube.com")) {
      if (u.pathname.includes("/shorts/")) videoId = u.pathname.split("/shorts/")[1]?.split("/")[0] ?? "";
      else videoId = u.searchParams.get("v") ?? "";
    }
  } catch {
    const m = url.match(/(?:v=|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
    videoId = m?.[1] ?? "";
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : "";
}

// Category-tailored dummy copy
function dummyContent(item: PortfolioItem) {
  const cat = item.category;
  const verb = cat.includes("Web") ? "build" : cat.includes("AI") ? "automate" : "scale";
  return {
    overview: `${item.title} — a deep-dive case study on how we helped a founder ${verb} their ${cat.toLowerCase()} system end-to-end. From positioning and architecture to launch and post-launch optimization, this engagement compounded into a long-term growth engine.`,
    challenge: `The client came to us with a fractured ${cat.toLowerCase()} setup — inconsistent execution, no measurement framework, and a brand voice that didn't match their level. They needed a partner who could think strategically and ship at pace.`,
    approach: `We started with a discovery sprint, mapped the existing surface area, and rebuilt the system from first principles. Every decision was tied to a measurable outcome — clarity over cleverness, compounding over campaigns.`,
    solution: `A unified ${cat.toLowerCase()} stack that pairs an opinionated framework with a flexible production engine. Owned by the founder, operated by our team, instrumented from day one.`,
    metrics: [
      { label: "Increase in qualified inbound", value: "+247%" },
      { label: "Production cadence", value: "4×" },
      { label: "Avg. engagement lift", value: "+182%" },
      { label: "Time-to-launch", value: "−61%" },
    ],
    testimonial: {
      quote: `GrowitBuddy didn't just ship deliverables — they built a system we now operate ourselves. Best money we've spent on ${cat.toLowerCase()}, full stop.`,
      author: "Founder, Series-A SaaS",
    },
    stack: cat.includes("Web")
      ? ["Next.js", "Framer Motion", "Resend", "Stripe", "Notion"]
      : cat.includes("AI")
      ? ["GPT-4", "Claude", "n8n", "Zapier", "Airtable"]
      : cat.includes("Social")
      ? ["Notion", "Buffer", "Frame.io", "Adobe Suite"]
      : ["Figma", "Notion", "Adobe Suite", "Webflow"],
  };
}

export default function CaseStudy() {
  const [, params] = useRoute<{ category: string; id: string }>("/portfolio/:category/case/:id");
  const [, setLocation] = useLocation();

  const [item, setItem] = useState<PortfolioItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/admin/portfolio/items`);
        if (!res.ok) throw new Error("fetch failed");
        const all: PortfolioItem[] = await res.json();
        if (cancelled) return;
        const found = all.find((i) => String(i.id) === params?.id);
        if (!found) setNotFound(true);
        else setItem(found);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [params?.id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F8F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #E5E5E0", borderTopColor: "#1E293B" }} className="animate-spin" />
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F8F6", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, color: "#5F5F5F", marginBottom: 16 }}>Case study not found.</p>
          <Link href="/portfolio">
            <a style={{ color: "#1E293B", fontWeight: 700, textDecoration: "underline" }}>← Back to portfolio</a>
          </Link>
        </div>
      </div>
    );
  }

  const content = dummyContent(item);
  const seeds = HERO_SEEDS[item.category] ?? ["fallback-1", "fallback-2", "fallback-3"];
  const heroImg = picsum(`${seeds[0]}-${item.id}`, 1600, 900);
  const embedUrl = getEmbedUrl(item.youtubeUrl);
  const categorySlug = params?.category ?? "";

  const go = (e: React.MouseEvent, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    setLocation(href);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6" }}>
      {/* ── HERO ── */}
      <div style={{ background: BRAND_ACCENT, padding: "120px 24px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #C2A878, #D4BB90)" }} />
        <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
          <a
            href={`/portfolio/${categorySlug}`}
            onClick={(e) => go(e, `/portfolio/${categorySlug}`)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600,
              marginBottom: 36, textDecoration: "none",
            }}
            className="hover:!text-white"
          >
            <ArrowLeft size={15} /> Back to {item.category}
          </a>

          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(194,168,120,0.9)", marginBottom: 18 }}>
            Case Study · {item.category}
          </p>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(36px, 6.5vw, 68px)", letterSpacing: "-0.04em", lineHeight: 1.04, color: "#fff", marginBottom: 24, maxWidth: "20ch" }}>
            {item.title}
          </h1>
          {item.description && (
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.72)", lineHeight: 1.65, maxWidth: "62ch", marginBottom: 40 }}>
              {item.description}
            </p>
          )}

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              borderRadius: 20, overflow: "hidden",
              boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
              transform: "translateY(60px)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <img
              src={heroImg}
              alt={item.title}
              loading="lazy"
              style={{ display: "block", width: "100%", aspectRatio: "16/9", objectFit: "cover" }}
            />
          </motion.div>
        </div>
      </div>

      {/* spacer for translated hero image */}
      <div style={{ height: 60 }} />

      {/* ── METRICS STRIP ── */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 24px 24px" }}>
        <div
          className="metrics-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 18,
          }}
        >
          {content.metrics.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
              style={{
                background: "#fff",
                border: "1.5px solid #E5E5E0",
                borderRadius: 16,
                padding: "24px 22px",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 32, letterSpacing: "-0.03em", color: "#1E293B", marginBottom: 6 }}>
                {m.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#8A8A8A" }}>
                {m.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW / CHALLENGE ── */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 24px" }}>
        <div
          className="two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.4fr",
            gap: 48,
          }}
        >
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C2A878", marginBottom: 14 }}>
              Overview
            </p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(26px, 3.4vw, 40px)", letterSpacing: "-0.03em", lineHeight: 1.15, color: "#0A0A0A", margin: 0 }}>
              How we approached this project.
            </h2>
          </div>
          <div>
            <p style={{ fontSize: 16, color: "#3F3F3F", lineHeight: 1.75, marginBottom: 18 }}>
              {content.overview}
            </p>
            <p style={{ fontSize: 16, color: "#3F3F3F", lineHeight: 1.75, margin: 0 }}>
              {content.challenge}
            </p>
          </div>
        </div>
      </div>

      {/* ── IMAGE GALLERY (2 images) ── */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "16px 24px" }}>
        <div
          className="gallery-2"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}
        >
          <img
            src={picsum(`${seeds[1]}-${item.id}`, 900, 600)}
            alt=""
            loading="lazy"
            style={{ width: "100%", aspectRatio: "3/2", objectFit: "cover", borderRadius: 16, border: "1.5px solid #E5E5E0" }}
          />
          <img
            src={picsum(`${seeds[2]}-${item.id}`, 900, 600)}
            alt=""
            loading="lazy"
            style={{ width: "100%", aspectRatio: "3/2", objectFit: "cover", borderRadius: 16, border: "1.5px solid #E5E5E0" }}
          />
        </div>
      </div>

      {/* ── APPROACH ── */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 24px 24px" }}>
        <div
          className="two-col"
          style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 48 }}
        >
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C2A878", marginBottom: 14 }}>
              Approach
            </p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(26px, 3.4vw, 40px)", letterSpacing: "-0.03em", lineHeight: 1.15, color: "#0A0A0A", margin: 0 }}>
              First-principles, then execution.
            </h2>
          </div>
          <div>
            <p style={{ fontSize: 16, color: "#3F3F3F", lineHeight: 1.75, marginBottom: 22 }}>
              {content.approach}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "Discovery sprint and surface-area audit",
                "Strategic framework tailored to the founder's positioning",
                "Production engine handover with SOPs and tooling",
                "Weekly performance review and optimization",
              ].map((line, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 15, color: "#3F3F3F", lineHeight: 1.6 }}>
                  <CheckCircle2 size={20} style={{ color: "#1E293B", flexShrink: 0, marginTop: 2 }} />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── EMBEDDED VIDEO (uses item's actual YouTube URL) ── */}
      {embedUrl && (
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 24px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C2A878", marginBottom: 14, textAlign: "center" }}>
            Project Walkthrough
          </p>
          <div
            style={{
              borderRadius: 20, overflow: "hidden",
              border: "1.5px solid #E5E5E0",
              background: "#0A0A0A",
              boxShadow: "0 20px 60px rgba(15,23,42,0.18)",
            }}
          >
            <div style={{ position: "relative", aspectRatio: "16/9" }}>
              <iframe
                src={embedUrl}
                title={item.title}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── SOLUTION + STACK ── */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 24px" }}>
        <div
          className="two-col"
          style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 48 }}
        >
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C2A878", marginBottom: 14 }}>
              Solution
            </p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(26px, 3.4vw, 40px)", letterSpacing: "-0.03em", lineHeight: 1.15, color: "#0A0A0A", margin: 0 }}>
              The system we shipped.
            </h2>
          </div>
          <div>
            <p style={{ fontSize: 16, color: "#3F3F3F", lineHeight: 1.75, marginBottom: 24 }}>
              {content.solution}
            </p>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 12 }}>
              Stack
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {content.stack.map((s) => (
                <span
                  key={s}
                  style={{
                    fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
                    padding: "8px 14px", borderRadius: 100,
                    background: "#fff", border: "1.5px solid #E5E5E0", color: "#1E293B",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── TESTIMONIAL ── */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 24px" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            background: BRAND_ACCENT,
            borderRadius: 22,
            padding: "56px 48px",
            position: "relative",
            overflow: "hidden",
            color: "#fff",
          }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #C2A878, #D4BB90)" }} />
          <Quote size={48} style={{ color: "rgba(194,168,120,0.5)", marginBottom: 18 }} />
          <p style={{ fontSize: "clamp(20px, 2.4vw, 26px)", lineHeight: 1.4, fontWeight: 600, letterSpacing: "-0.015em", margin: 0, marginBottom: 26, maxWidth: "44ch" }}>
            "{content.testimonial.quote}"
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            — {content.testimonial.author}
          </p>
        </motion.div>
      </div>

      {/* ── CTA ── */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px 112px", textAlign: "center" }}>
        <h3 style={{ fontWeight: 800, fontSize: "clamp(26px, 3.6vw, 40px)", letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 16 }}>
          Want results like these?
        </h3>
        <p style={{ fontSize: 16, color: "#5F5F5F", marginBottom: 28, maxWidth: "48ch", marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
          We work with a small number of founders each quarter. If you're serious about building a system that compounds, let's talk.
        </p>
        <a
          href="/contact"
          onClick={(e) => go(e, "/contact")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "16px 30px", borderRadius: 100,
            background: "#1E293B", color: "#fff",
            fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
            textDecoration: "none",
            transition: "background 0.2s, transform 0.2s",
          }}
          className="hover:!bg-[#0A0A0A] hover:scale-105"
        >
          Start a project <ArrowUpRight size={18} />
        </a>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .two-col { grid-template-columns: 1fr !important; gap: 24px !important; }
          .gallery-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
