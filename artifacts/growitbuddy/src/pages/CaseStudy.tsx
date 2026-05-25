import { useEffect, useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { API_BASE } from "@/lib/api";

interface CaseStudyData {
  clientName?: string;
  clientLogoUrl?: string;
  coverImageUrl?: string;
  heroImageUrl?: string;
  galleryImages?: string[];
  metrics?: Array<{ value: string; label: string }>;
  stack?: string[];
  testimonial?: { quote: string; author: string };
  overview?: string;
  challenge?: string;
  approach?: string;
  approachBullets?: string[];
  solution?: string;
  videoUrl?: string;
}

interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  youtubeUrl: string;
  description: string | null;
  sortOrder: number;
  caseStudy?: CaseStudyData | null;
}

const SERIF = `'Fraunces', 'Times New Roman', Georgia, serif`;
const CREAM = "#F8F8F6";
const CREAM_DEEP = "#EFEFEA";
const INK = "#0A0A0A";
const SLATE = "#1E293B";
const MUTED = "#5F5F5F";
const GOLD = "#C2A878";
const RULE = "#E0DED6";

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
      <div style={{ minHeight: "100vh", background: CREAM, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #E5E5E0", borderTopColor: SLATE }} className="animate-spin" />
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div style={{ minHeight: "100vh", background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, color: MUTED, marginBottom: 16 }}>Case study not found.</p>
          <Link href="/portfolio" style={{ color: SLATE, fontWeight: 700, textDecoration: "underline" }}>
            ← Back to portfolio
          </Link>
        </div>
      </div>
    );
  }

  const cs = item.caseStudy ?? null;
  const fallback = dummyContent(item);
  const seeds = HERO_SEEDS[item.category] ?? ["fallback-1", "fallback-2", "fallback-3"];

  const content = {
    overview: cs?.overview || fallback.overview,
    challenge: cs?.challenge || fallback.challenge,
    approach: cs?.approach || fallback.approach,
    solution: cs?.solution || fallback.solution,
    metrics: cs?.metrics && cs.metrics.length > 0 ? cs.metrics : fallback.metrics,
    testimonial: cs?.testimonial?.quote ? cs.testimonial : fallback.testimonial,
    stack: cs?.stack && cs.stack.length > 0 ? cs.stack : fallback.stack,
    approachBullets: cs?.approachBullets && cs.approachBullets.length > 0
      ? cs.approachBullets
      : [
          "Discovery sprint and surface-area audit",
          "Strategic framework tailored to the founder's positioning",
          "Production engine handover with SOPs and tooling",
          "Weekly performance review and optimization",
        ],
  };

  const heroImg = cs?.heroImageUrl || cs?.coverImageUrl || picsum(`${seeds[0]}-${item.id}`, 1800, 1100);
  const gallery = (cs?.galleryImages && cs.galleryImages.length > 0)
    ? cs.galleryImages.slice(0, 3)
    : [
        picsum(`${seeds[1]}-${item.id}`, 1200, 1500),
        picsum(`${seeds[2]}-${item.id}`, 900, 600),
        picsum(`${seeds[0]}-alt-${item.id}`, 900, 600),
      ];
  const embedUrl = getEmbedUrl(cs?.videoUrl || item.youtubeUrl);
  const categorySlug = params?.category ?? "";

  const yearLabel = new Date().getFullYear().toString();
  const roleLabel = item.category.includes("Web") ? "Design & Build"
    : item.category.includes("AI") ? "Strategy & Automation"
    : item.category.includes("Graphics") ? "Brand & Identity"
    : "Strategy & Production";

  const go = (e: React.MouseEvent, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    setLocation(href);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK }}>
      {/* ── BACK STRIP ── */}
      <div style={{ borderBottom: `1px solid ${RULE}`, background: CREAM }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 28px" }}>
          <a
            href={`/portfolio/${categorySlug}`}
            onClick={(e) => go(e, `/portfolio/${categorySlug}`)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              color: MUTED, fontSize: 12, fontWeight: 600,
              letterSpacing: "0.08em", textTransform: "uppercase",
              textDecoration: "none",
            }}
            className="hover:!text-[#0A0A0A]"
          >
            <ArrowLeft size={14} /> {item.category}
          </a>
        </div>
      </div>

      {/* ── EDITORIAL HERO ── */}
      <section style={{ padding: "72px 28px 56px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          {/* Kicker row */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <span style={{ width: 36, height: 1, background: GOLD }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD }}>
              Case Study № {String(item.id).padStart(3, "0")}
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: "clamp(44px, 7.8vw, 104px)",
              letterSpacing: "-0.03em",
              lineHeight: 0.98,
              color: INK,
              margin: 0,
              maxWidth: "16ch",
              fontStyle: "normal",
            }}
          >
            {item.title}
          </h1>

          {/* Dek (subtitle) */}
          {item.description && (
            <p
              style={{
                fontFamily: SERIF,
                fontWeight: 300,
                fontStyle: "italic",
                fontSize: "clamp(20px, 2.2vw, 26px)",
                color: MUTED,
                lineHeight: 1.45,
                marginTop: 28,
                marginBottom: 0,
                maxWidth: "48ch",
              }}
            >
              {item.description}
            </p>
          )}

          {/* Byline / meta row */}
          <div
            className="byline"
            style={{
              marginTop: 48,
              paddingTop: 24,
              borderTop: `1px solid ${RULE}`,
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 24,
            }}
          >
            {[
              { label: "Client", value: cs?.clientName || "Confidential" },
              { label: "Category", value: item.category },
              { label: "Role", value: roleLabel },
              { label: "Year", value: yearLabel },
            ].map((m) => (
              <div key={m.label}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: INK, letterSpacing: "-0.005em" }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FULL-BLEED HERO IMAGE ── */}
      <section style={{ padding: "0 28px 96px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              overflow: "hidden",
              borderRadius: 4,
              background: CREAM_DEEP,
              boxShadow: "0 40px 80px -30px rgba(10,10,10,0.25)",
            }}
          >
            {cs?.clientLogoUrl && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 2,
                  margin: 20,
                  background: "rgba(255,255,255,0.95)",
                  borderRadius: 6,
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                }}
              >
                <img src={cs.clientLogoUrl} alt={cs.clientName ?? "Client"} style={{ width: 22, height: 22, objectFit: "contain" }} />
                {cs.clientName && (
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", color: INK }}>{cs.clientName}</span>
                )}
              </div>
            )}
            <img
              src={heroImg}
              alt={item.title}
              loading="eager"
              style={{ display: "block", width: "100%", aspectRatio: "16/9", objectFit: "cover" }}
            />
          </motion.div>
        </div>
      </section>

      {/* ── METRICS — editorial numerals ── */}
      <section style={{ padding: "0 28px 96px" }}>
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            borderTop: `1px solid ${RULE}`,
            borderBottom: `1px solid ${RULE}`,
          }}
        >
          <div
            className="metrics-grid"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${content.metrics.length}, 1fr)`,
            }}
          >
            {content.metrics.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                style={{
                  padding: "56px 28px",
                  textAlign: "left",
                  borderLeft: i === 0 ? "none" : `1px solid ${RULE}`,
                }}
                className="metric-cell"
              >
                <div
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 400,
                    fontSize: "clamp(48px, 6vw, 84px)",
                    letterSpacing: "-0.04em",
                    color: INK,
                    lineHeight: 0.95,
                    marginBottom: 14,
                  }}
                >
                  {m.value}
                </div>
                <div style={{ width: 28, height: 1, background: GOLD, marginBottom: 14 }} />
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: MUTED,
                    lineHeight: 1.4,
                  }}
                >
                  {m.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OVERVIEW + CHALLENGE ── */}
      <Section label="Overview" heading="The brief, and the bigger picture.">
        <p
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: "clamp(22px, 2.2vw, 28px)",
            lineHeight: 1.45,
            color: INK,
            margin: 0,
            marginBottom: 28,
            letterSpacing: "-0.01em",
          }}
        >
          <span
            style={{
              fontFamily: SERIF,
              fontSize: "clamp(56px, 7vw, 88px)",
              fontWeight: 500,
              float: "left",
              lineHeight: 0.85,
              marginRight: 14,
              marginTop: 6,
              color: GOLD,
            }}
          >
            {content.overview.charAt(0)}
          </span>
          {content.overview.slice(1)}
        </p>
        <p style={{ fontSize: 16.5, color: MUTED, lineHeight: 1.8, margin: 0 }}>
          {content.challenge}
        </p>
      </Section>

      {/* ── PULL QUOTE 1 ── */}
      {content.testimonial.quote && (
        <section style={{ padding: "16px 28px 48px" }}>
          <div style={{ maxWidth: 1040, margin: "0 auto", textAlign: "center" }}>
            <span style={{ fontFamily: SERIF, fontSize: 80, fontWeight: 500, color: GOLD, lineHeight: 0.4, display: "inline-block", marginBottom: 8 }}>
              “
            </span>
            <p
              style={{
                fontFamily: SERIF,
                fontWeight: 400,
                fontStyle: "italic",
                fontSize: "clamp(26px, 3.4vw, 44px)",
                lineHeight: 1.3,
                color: INK,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              {content.testimonial.quote}
            </p>
            <div style={{ marginTop: 28, display: "inline-flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 24, height: 1, background: GOLD }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED }}>
                {content.testimonial.author}
              </span>
              <span style={{ width: 24, height: 1, background: GOLD }} />
            </div>
          </div>
        </section>
      )}

      {/* ── ASYMMETRIC GALLERY ── */}
      <section style={{ padding: "48px 28px 24px" }}>
        <div
          className="gallery-grid"
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1.15fr 1fr",
            gap: 22,
          }}
        >
          <div style={{ borderRadius: 4, overflow: "hidden", background: CREAM_DEEP }}>
            <img
              src={gallery[0]}
              alt=""
              loading="lazy"
              style={{ display: "block", width: "100%", aspectRatio: "4/5", objectFit: "cover" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 22 }}>
            {gallery.slice(1, 3).map((src, i) => (
              <div key={i} style={{ borderRadius: 4, overflow: "hidden", background: CREAM_DEEP }}>
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APPROACH ── */}
      <Section label="Approach" heading="First principles, then execution.">
        <p style={{ fontSize: 17, color: INK, lineHeight: 1.75, marginBottom: 32, fontWeight: 400 }}>
          {content.approach}
        </p>
        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            counterReset: "step",
          }}
        >
          {content.approachBullets.map((line, i) => (
            <li
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 24,
                padding: "22px 0",
                borderTop: i === 0 ? `1px solid ${RULE}` : "none",
                borderBottom: `1px solid ${RULE}`,
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  fontFamily: SERIF,
                  fontWeight: 400,
                  fontSize: 22,
                  color: GOLD,
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ fontSize: 16.5, color: INK, lineHeight: 1.6, fontWeight: 500 }}>
                {line}
              </span>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── EMBEDDED VIDEO ── */}
      {embedUrl && (
        <section style={{ padding: "24px 28px 48px" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <span style={{ width: 36, height: 1, background: GOLD }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD }}>
                Project Walkthrough
              </span>
            </div>
            <div style={{ borderRadius: 4, overflow: "hidden", background: INK, boxShadow: "0 30px 60px -20px rgba(10,10,10,0.35)" }}>
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
        </section>
      )}

      {/* ── SOLUTION + STACK ── */}
      <Section label="Outcome" heading="The system we shipped.">
        <p style={{ fontSize: 17, color: INK, lineHeight: 1.75, marginBottom: 36, fontWeight: 400 }}>
          {content.solution}
        </p>
        <div style={{ paddingTop: 24, borderTop: `1px solid ${RULE}` }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 16 }}>
            Tools & Stack
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {content.stack.map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  padding: "9px 16px",
                  borderRadius: 100,
                  background: "transparent",
                  border: `1px solid ${INK}`,
                  color: INK,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA ── */}
      <section style={{ padding: "96px 28px 140px", borderTop: `1px solid ${RULE}`, marginTop: 64 }}>
        <div style={{ maxWidth: 920, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <span style={{ width: 36, height: 1, background: GOLD }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD }}>
              Next Chapter
            </span>
            <span style={{ width: 36, height: 1, background: GOLD }} />
          </div>
          <h3
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: "clamp(34px, 5.2vw, 64px)",
              letterSpacing: "-0.03em",
              color: INK,
              lineHeight: 1.05,
              margin: 0,
              marginBottom: 24,
            }}
          >
            Want a case study<br />
            <em style={{ fontWeight: 400, color: GOLD }}>with your name on it?</em>
          </h3>
          <p style={{ fontSize: 17, color: MUTED, marginBottom: 40, maxWidth: "52ch", marginLeft: "auto", marginRight: "auto", lineHeight: 1.65 }}>
            We work with a small number of founders each quarter. If you're serious about building a system that compounds, let's talk.
          </p>
          <a
            href="/contact"
            onClick={(e) => go(e, "/contact")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "18px 34px", borderRadius: 100,
              background: INK, color: "#fff",
              fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              textDecoration: "none",
              transition: "background 0.2s, transform 0.2s",
            }}
            className="hover:!bg-[#1E293B] hover:scale-[1.03]"
          >
            Start a project <ArrowUpRight size={18} />
          </a>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .metric-cell { border-left: none !important; border-top: 1px solid ${RULE}; }
          .metric-cell:nth-child(-n+2) { border-top: none; }
          .metric-cell:nth-child(even) { border-left: 1px solid ${RULE} !important; }
          .two-col { grid-template-columns: 1fr !important; gap: 28px !important; }
          .gallery-grid { grid-template-columns: 1fr !important; }
          .byline { grid-template-columns: repeat(2, 1fr) !important; row-gap: 20px !important; }
        }
      `}</style>
    </div>
  );
}

// ── Reusable editorial section (sticky label column, narrow editorial body) ──
function Section({ label, heading, children }: { label: string; heading: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: "72px 28px" }}>
      <div
        className="two-col"
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "0.7fr 1.6fr",
          gap: 64,
          alignItems: "start",
        }}
      >
        <div style={{ position: "sticky", top: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ width: 20, height: 1, background: GOLD }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD }}>
              {label}
            </span>
          </div>
          <h2
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: "clamp(28px, 3.4vw, 44px)",
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              color: INK,
              margin: 0,
            }}
          >
            {heading}
          </h2>
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}
