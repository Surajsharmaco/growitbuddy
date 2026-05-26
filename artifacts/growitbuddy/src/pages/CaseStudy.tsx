import { useEffect, useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Quote } from "lucide-react";

import { API_BASE } from "@/lib/api";
import BlockRenderer, { type Block } from "@/components/blocks/BlockRenderer";
import BlockEditor from "@/components/blocks/BlockEditor";
import CaseStudyInlineEditor from "@/components/CaseStudyInlineEditor";
import { useAdmin } from "@/context/AdminContext";

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
  // Phase 1 inline-editor data model — when present, the public page renders
  // via <BlockRenderer /> instead of the legacy hardcoded layout below.
  blocks?: Block[] | null;
}

// ── Site theme constants (match Home / rest of site) ──
const BG = "#F8F8F6";
const BG_ALT = "#EFEFEA";
const CARD = "#FFFFFF";
const TEXT = "#0A0A0A";
const SLATE = "#1E293B";
const MUTED = "#5F5F5F";
const MUTED_SOFT = "#8A8A8A";
const RULE = "#E5E5E0";
const GOLD = "#C2A878";

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

// Use the shared embed builder so case-study videos support YouTube, Vimeo,
// Google Drive and Gumlet (incl. full <iframe> embed-code paste).
import { getEmbedUrl as buildEmbedUrl } from "@/lib/videoEmbed";
function getEmbedUrl(url: string): string {
  return buildEmbedUrl(url, { autoplay: true });
}

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

// Fixed-position floating button so the admin can always find "Edit inline"
// regardless of where they scroll. On excluded categories (Video Editing),
// shows a disabled state with explanatory tooltip rather than hiding silently
// (silent hiding caused real confusion when the button "wasn't there").
function FloatingEditBtn({ excluded }: { excluded: boolean }) {
  if (excluded) {
    return (
      <div
        title="Inline editor isn't available for Video Editing categories"
        style={{
          position: "fixed", top: 80, right: 20, zIndex: 80,
          fontSize: 12, fontWeight: 700, padding: "10px 16px",
          borderRadius: 999, background: "#94A3B8", color: "#fff",
          display: "inline-flex", alignItems: "center", gap: 6,
          boxShadow: "0 4px 14px rgba(0,0,0,0.18)", cursor: "not-allowed", opacity: 0.85,
        }}
      >
        ✎ Inline edit — N/A for Video
      </div>
    );
  }
  return (
    <a
      href={`${window.location.pathname}?edit=1`}
      title="Open the Wix-style inline editor"
      style={{
        position: "fixed", top: 80, right: 20, zIndex: 80,
        fontSize: 13, fontWeight: 700, padding: "10px 18px",
        borderRadius: 999, background: "#1E293B", color: "#F8F8F6", textDecoration: "none",
        display: "inline-flex", alignItems: "center", gap: 6,
        boxShadow: "0 4px 14px rgba(30,41,59,0.32)",
      }}
    >
      ✎ Edit inline
    </a>
  );
}

export default function CaseStudy() {
  // Support both /portfolio/:category/case/:id and /portfolio/shared/:slug/:category/case/:id
  const [, sharedParams] = useRoute<{ slug: string; category: string; id: string }>("/portfolio/shared/:slug/:category/case/:id");
  const [, plainParams] = useRoute<{ category: string; id: string }>("/portfolio/:category/case/:id");
  const params = sharedParams ?? plainParams;
  const shareSlug = sharedParams?.slug ?? null;
  const sharePrefix = shareSlug ? `/portfolio/shared/${shareSlug}` : "/portfolio";

  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAdmin();
  // Show the Edit-inline button to any logged-in admin (permission gating
  // is enforced server-side on PUT /portfolio/:id, so this is safe).
  const canEdit = isAuthenticated;

  // Edit mode is enabled via ?edit=1 in the URL (admin-only). Re-evaluate
  // when the URL string changes (wouter doesn't expose search separately).
  const editFlag = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("edit") === "1";
  const editing = canEdit && editFlag;

  // Video Editing categories are excluded from the block editor by product req.
  const VIDEO_EDITING_CATS = new Set(["Video Editing", "Video Editing Global"]);

  const [item, setItem] = useState<PortfolioItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const url = shareSlug
          ? `${API_BASE}/admin/portfolio/shares/public/${encodeURIComponent(shareSlug)}`
          : `${API_BASE}/admin/portfolio/items`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("fetch failed");
        const payload = await res.json();
        const all: PortfolioItem[] = shareSlug ? (payload.items ?? []) : payload;
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
  }, [params?.id, shareSlug]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${RULE}`, borderTopColor: SLATE }} className="animate-spin" />
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, color: MUTED, marginBottom: 16 }}>Case study not found.</p>
          <Link href={sharePrefix} style={{ color: SLATE, fontWeight: 700, textDecoration: "underline" }}>
            ← Back to portfolio
          </Link>
        </div>
      </div>
    );
  }

  const isExcludedCategory = VIDEO_EDITING_CATS.has(item.category);

  // ── Inline editor mode (?edit=1 + admin logged in) ─────────────────────
  // For legacy case studies we use the WYSIWYG CaseStudyInlineEditor — it
  // renders a 1:1 visual replica of the public page layout. For already-
  // migrated case studies (blocks present) we still use the generic
  // BlockEditor since the public page renders blocks via BlockRenderer.
  if (editing && !isExcludedCategory) {
    const exitToView = () => setLocation(window.location.pathname);
    if (Array.isArray(item.blocks) && item.blocks.length > 0) {
      return (
        <BlockEditor
          portfolioId={item.id}
          initialBlocks={item.blocks}
          onSaved={(blocks) => setItem({ ...item, blocks })}
          onExit={exitToView}
        />
      );
    }
    return (
      <CaseStudyInlineEditor
        item={item}
        onSaved={(updated) => setItem(updated)}
        onExit={exitToView}
      />
    );
  }

  // ── Public block-rendered mode (case study already migrated) ───────────
  if (Array.isArray(item.blocks) && item.blocks.length > 0) {
    return (
      <div style={{ minHeight: "100vh", background: BG, color: TEXT }}>
        {canEdit && <FloatingEditBtn excluded={isExcludedCategory} />}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
          <Link
            href={`${sharePrefix}/${params?.category ?? ""}`}
            onClick={(e) => go(e as React.MouseEvent, `${sharePrefix}/${params?.category ?? ""}`)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: MUTED, textDecoration: "none" }}
          >
            <ArrowLeft size={16} /> Back to {item.category}
          </Link>
        </div>
        <BlockRenderer blocks={item.blocks} />
      </div>
    );
  }

  // ── Legacy-layout mode: show floating admin button to switch to blocks ─

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

  const heroImg = cs?.heroImageUrl || cs?.coverImageUrl || picsum(`${seeds[0]}-${item.id}`, 1600, 900);
  const gallery = (cs?.galleryImages && cs.galleryImages.length > 0)
    ? cs.galleryImages.slice(0, 2)
    : [picsum(`${seeds[1]}-${item.id}`, 900, 600), picsum(`${seeds[2]}-${item.id}`, 900, 600)];
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

  // Eyebrow style used site-wide
  const eyebrow: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase",
    color: GOLD, margin: 0,
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      {canEdit && <FloatingEditBtn excluded={isExcludedCategory} />}
      {/* ── Back strip ── */}
      <div style={{ borderBottom: `1px solid ${RULE}`, background: BG }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px" }}>
          <a
            href={`${sharePrefix}/${categorySlug}`}
            onClick={(e) => go(e, `${sharePrefix}/${categorySlug}`)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              color: MUTED, fontSize: 12, fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
              textDecoration: "none",
            }}
            className="hover:!text-[#0A0A0A]"
          >
            <ArrowLeft size={14} /> {item.category}
          </a>
        </div>
      </div>

      {/* ── HERO ── */}
      <section style={{ padding: "80px 24px 56px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <span style={{ width: 32, height: 1, background: GOLD }} />
            <p style={eyebrow}>Case Study · {item.category}</p>
          </div>

          <h1
            style={{
              fontWeight: 800,
              fontSize: "clamp(36px, 6.5vw, 72px)",
              letterSpacing: "-0.04em",
              lineHeight: 1.04,
              color: TEXT,
              margin: 0,
              maxWidth: "20ch",
            }}
          >
            {item.title}
          </h1>

          {item.description && (
            <p
              style={{
                fontSize: "clamp(17px, 1.6vw, 20px)",
                color: MUTED,
                lineHeight: 1.6,
                marginTop: 24,
                marginBottom: 0,
                maxWidth: "62ch",
                fontWeight: 500,
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
                <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, letterSpacing: "-0.01em" }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HERO IMAGE ── */}
      <section style={{ padding: "0 24px 88px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            style={{
              position: "relative",
              borderRadius: 22,
              overflow: "hidden",
              border: `1px solid ${RULE}`,
              background: BG_ALT,
              boxShadow: "0 30px 80px -30px rgba(10,10,10,0.25)",
            }}
          >
            {cs?.clientLogoUrl && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 2,
                  top: 20, left: 20,
                  background: "rgba(255,255,255,0.95)",
                  borderRadius: 100,
                  padding: "8px 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  border: `1px solid ${RULE}`,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                }}
              >
                <img src={cs.clientLogoUrl} alt={cs.clientName ?? "Client"} style={{ width: 22, height: 22, objectFit: "contain", borderRadius: 4 }} />
                {cs.clientName && (
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", color: TEXT }}>{cs.clientName}</span>
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

      {/* ── METRICS STRIP — same visual language as Home stats ── */}
      <section
        style={{
          borderTop: `1px solid ${RULE}`,
          borderBottom: `1px solid ${RULE}`,
          background: CARD,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
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
                transition={{ delay: i * 0.06, duration: 0.45 }}
                style={{
                  padding: "56px 28px",
                  textAlign: "center",
                  borderLeft: i === 0 ? "none" : `1px solid ${RULE}`,
                }}
                className="metric-cell"
              >
                <div style={{ width: 32, height: 2, background: GOLD, borderRadius: 2, margin: "0 auto 20px" }} />
                <div
                  style={{
                    fontSize: "clamp(36px, 4.5vw, 56px)",
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    color: TEXT,
                    lineHeight: 1,
                    marginBottom: 12,
                  }}
                >
                  {m.value}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: MUTED_SOFT,
                    fontWeight: 500,
                    maxWidth: "20ch",
                    lineHeight: 1.6,
                    margin: "0 auto",
                  }}
                >
                  {m.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OVERVIEW ── */}
      <Section label="Overview" heading="How we approached this project.">
        <p style={{ fontSize: 17, color: TEXT, lineHeight: 1.75, marginTop: 0, marginBottom: 22, fontWeight: 500 }}>
          {content.overview}
        </p>
        <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.75, margin: 0 }}>
          {content.challenge}
        </p>
      </Section>

      {/* ── IMAGE GALLERY ── */}
      <section style={{ padding: "0 24px 56px" }}>
        <div
          className="gallery-2"
          style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}
        >
          {gallery.map((src, i) => (
            <div
              key={i}
              style={{
                borderRadius: 22,
                overflow: "hidden",
                border: `1px solid ${RULE}`,
                background: BG_ALT,
              }}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                style={{ display: "block", width: "100%", aspectRatio: "3/2", objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── APPROACH ── */}
      <Section label="Approach" heading="First-principles, then execution.">
        <p style={{ fontSize: 17, color: TEXT, lineHeight: 1.75, marginTop: 0, marginBottom: 28, fontWeight: 500 }}>
          {content.approach}
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          {content.approachBullets.map((line, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                padding: "16px 20px",
                background: CARD,
                border: `1px solid ${RULE}`,
                borderRadius: 14,
                fontSize: 15,
                color: TEXT,
                lineHeight: 1.55,
                fontWeight: 500,
              }}
            >
              <CheckCircle2 size={20} style={{ color: SLATE, flexShrink: 0, marginTop: 1 }} />
              {line}
            </li>
          ))}
        </ul>
      </Section>

      {/* ── VIDEO ── */}
      {embedUrl && (
        <section style={{ padding: "24px 24px 48px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, justifyContent: "center" }}>
              <span style={{ width: 32, height: 1, background: GOLD }} />
              <p style={eyebrow}>Project Walkthrough</p>
              <span style={{ width: 32, height: 1, background: GOLD }} />
            </div>
            <div
              style={{
                borderRadius: 22,
                overflow: "hidden",
                border: `1px solid ${RULE}`,
                background: TEXT,
                boxShadow: "0 20px 60px -20px rgba(15,23,42,0.25)",
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
        </section>
      )}

      {/* ── SOLUTION + STACK ── */}
      <Section label="Solution" heading="The system we shipped.">
        <p style={{ fontSize: 17, color: TEXT, lineHeight: 1.75, marginTop: 0, marginBottom: 28, fontWeight: 500 }}>
          {content.solution}
        </p>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED_SOFT, marginBottom: 14 }}>
          Stack
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {content.stack.map((s) => (
            <span
              key={s}
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "8px 14px",
                borderRadius: 100,
                background: CARD,
                border: `1px solid ${RULE}`,
                color: SLATE,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </Section>

      {/* ── TESTIMONIAL — dark slate card like Home problem section ── */}
      <section style={{ padding: "32px 24px 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              background: SLATE,
              borderRadius: 22,
              padding: "56px 48px",
              position: "relative",
              overflow: "hidden",
              color: "#FFFFFF",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 32, right: 32, height: 2, background: "linear-gradient(90deg, #C2A878 0%, transparent 100%)", borderRadius: 1 }} />
            <Quote size={44} style={{ color: "rgba(194,168,120,0.45)", marginBottom: 18 }} />
            <p
              style={{
                fontSize: "clamp(20px, 2.4vw, 28px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.4,
                color: "#FFFFFF",
                margin: 0,
                marginBottom: 26,
                maxWidth: "48ch",
              }}
            >
              "{content.testimonial.quote}"
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 24, height: 1, background: GOLD }} />
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, margin: 0 }}>
                {content.testimonial.author}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "32px 24px 112px", textAlign: "center" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <h3
            style={{
              fontWeight: 800,
              fontSize: "clamp(26px, 3.6vw, 42px)",
              letterSpacing: "-0.035em",
              color: TEXT,
              lineHeight: 1.08,
              margin: 0,
              marginBottom: 18,
            }}
          >
            Want results like these?
          </h3>
          <p style={{ fontSize: 16, color: MUTED, marginBottom: 32, maxWidth: "48ch", marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
            We work with a small number of founders each quarter. If you're serious about building a system that compounds, let's talk.
          </p>
          <a
            href="/contact"
            onClick={(e) => go(e, "/contact")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "16px 30px", borderRadius: 100,
              background: SLATE, color: "#FFFFFF",
              fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
              textDecoration: "none",
              transition: "background 0.2s, transform 0.2s",
            }}
            className="hover:!bg-[#0A0A0A] hover:scale-[1.03]"
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
          .two-col { grid-template-columns: 1fr !important; gap: 24px !important; }
          .gallery-2 { grid-template-columns: 1fr !important; }
          .byline { grid-template-columns: repeat(2, 1fr) !important; row-gap: 20px !important; }
        }
      `}</style>
    </div>
  );
}

// ── Reusable section with label column + body column (same as site convention) ──
function Section({ label, heading, children }: { label: string; heading: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: "72px 24px" }}>
      <div
        className="two-col"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr",
          gap: 48,
          alignItems: "start",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ width: 20, height: 1, background: GOLD }} />
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, margin: 0 }}>
              {label}
            </p>
          </div>
          <h2
            style={{
              fontWeight: 800,
              fontSize: "clamp(26px, 3.4vw, 40px)",
              letterSpacing: "-0.035em",
              lineHeight: 1.1,
              color: TEXT,
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
