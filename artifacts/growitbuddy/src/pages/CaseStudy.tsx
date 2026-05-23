import {
  createContext, createElement, useCallback, useContext, useEffect,
  useMemo, useRef, useState, type CSSProperties, type ReactNode,
} from "react";
import { useRoute, useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Quote, X, Settings, RotateCcw } from "lucide-react";

import { API_BASE } from "@/lib/api";
import { useAdmin } from "@/context/AdminContext";

interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  youtubeUrl: string;
  description: string | null;
  sortOrder: number;
}

const BRAND_ACCENT = "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)";

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
    approachList: [
      "Discovery sprint and surface-area audit",
      "Strategic framework tailored to the founder's positioning",
      "Production engine handover with SOPs and tooling",
      "Weekly performance review and optimization",
    ],
  };
}

// ─── Editor (admin-only inline edit/hide; preview-only via localStorage) ───
type Overrides = { hidden: string[]; text: Record<string, string> };
const storageKey = (id: number) => `gb_cs_v1_${id}`;

interface EditCtx {
  isAdmin: boolean;
  isHidden: (k: string) => boolean;
  hide: (k: string) => void;
  restore: (k: string) => void;
  getText: (k: string, fallback: string) => string;
  setText: (k: string, v: string) => void;
  hiddenList: string[];
  resetAll: () => void;
}
const EditContext = createContext<EditCtx | null>(null);
const useEdit = () => {
  const ctx = useContext(EditContext);
  if (!ctx) throw new Error("useEdit must be inside EditProvider");
  return ctx;
};

function EditProvider({ itemId, children }: { itemId: number; children: ReactNode }) {
  const { isAuthenticated } = useAdmin();
  const [data, setData] = useState<Overrides>({ hidden: [], text: {} });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(itemId));
      setData(raw ? JSON.parse(raw) : { hidden: [], text: {} });
    } catch {
      setData({ hidden: [], text: {} });
    }
  }, [itemId]);

  const persist = useCallback(
    (next: Overrides) => {
      setData(next);
      try { localStorage.setItem(storageKey(itemId), JSON.stringify(next)); } catch { /* ignore */ }
    },
    [itemId],
  );

  const value = useMemo<EditCtx>(
    () => ({
      isAdmin: isAuthenticated,
      isHidden: (k) => data.hidden.includes(k),
      hide: (k) => persist({ ...data, hidden: Array.from(new Set([...data.hidden, k])) }),
      restore: (k) => persist({ ...data, hidden: data.hidden.filter((x) => x !== k) }),
      getText: (k, fallback) => data.text[k] ?? fallback,
      setText: (k, v) => {
        const trimmed = v.replace(/\s+$/g, "");
        const next = { ...data, text: { ...data.text, [k]: trimmed } };
        persist(next);
      },
      hiddenList: data.hidden,
      resetAll: () => persist({ hidden: [], text: {} }),
    }),
    [data, isAuthenticated, persist],
  );

  return <EditContext.Provider value={value}>{children}</EditContext.Provider>;
}

function Section({ k, children, style }: { k: string; children: ReactNode; style?: CSSProperties }) {
  const { isAdmin, isHidden, hide } = useEdit();
  if (isHidden(k)) return null;
  if (!isAdmin) return <div style={style}>{children}</div>;
  return (
    <div style={{ position: "relative", ...style }} className="group/sec">
      <div
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          border: "1.5px dashed transparent", borderRadius: 14,
          transition: "border-color 0.2s",
          margin: 6,
        }}
        className="group-hover/sec:!border-[#C2A878]/40"
      />
      <button
        onClick={() => hide(k)}
        title="Hide this section (only you see the change)"
        style={{
          position: "absolute", top: 8, right: 8, zIndex: 50,
          width: 34, height: 34, borderRadius: "50%",
          background: "rgba(220, 38, 38, 0.96)", color: "#fff",
          border: "2px solid #fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 20px rgba(220,38,38,0.4)",
          opacity: 0, transition: "opacity 0.2s, transform 0.15s",
        }}
        className="group-hover/sec:!opacity-100 hover:!scale-110"
      >
        <X size={16} strokeWidth={3} />
      </button>
      {children}
    </div>
  );
}

type EditableProps = {
  k: string;
  fallback: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div" | "li";
  style?: CSSProperties;
  className?: string;
  multiline?: boolean;
};

function EditableText({ k, fallback, as = "span", style, className, multiline }: EditableProps) {
  const { isAdmin, getText, setText } = useEdit();
  const value = getText(k, fallback);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value]);

  if (!isAdmin) {
    return createElement(as, { style, className }, value);
  }

  return createElement(as, {
    ref,
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: true,
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      const text = (e.currentTarget.innerText ?? "").trim();
      if (text !== value) setText(k, text);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (!multiline && e.key === "Enter") {
        e.preventDefault();
        (e.currentTarget as HTMLElement).blur();
      }
    },
    style: {
      ...style,
      outline: "1px dashed rgba(194,168,120,0.55)",
      outlineOffset: 4,
      borderRadius: 4,
      cursor: "text",
      minWidth: 12,
      display: as === "span" ? "inline-block" : style?.display,
    },
    className,
  });
}

const SECTION_LABELS: Record<string, string> = {
  "hero-desc": "Hero description",
  "metrics-strip": "Metrics strip",
  "overview": "Overview section",
  "gallery": "Image gallery",
  "approach": "Approach section",
  "video": "Project walkthrough video",
  "solution": "Solution & stack",
  "testimonial": "Testimonial",
  "cta": "Call to action",
};

function RestorePanel() {
  const { isAdmin, hiddenList, restore, resetAll } = useEdit();
  const [open, setOpen] = useState(false);
  if (!isAdmin) return null;

  return (
    <div style={{ position: "fixed", bottom: 22, right: 22, zIndex: 100 }}>
      {open && (
        <div
          style={{
            position: "absolute", bottom: 56, right: 0, width: 300,
            background: "#fff", borderRadius: 14,
            border: "1.5px solid #E5E5E0",
            boxShadow: "0 24px 56px rgba(0,0,0,0.22)",
            padding: 16,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 12 }}>
            Hidden sections
          </div>
          {hiddenList.length === 0 ? (
            <p style={{ fontSize: 13, color: "#5F5F5F", margin: 0, lineHeight: 1.55 }}>
              Nothing hidden. Hover any section and click the red × to hide it.
              Click any heading or paragraph to edit it.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {hiddenList.map((kk) => (
                <button
                  key={kk}
                  onClick={() => restore(kk)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "9px 12px", borderRadius: 8,
                    background: "#F8F8F6", border: "1px solid #E5E5E0",
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                    color: "#1E293B", textAlign: "left",
                  }}
                >
                  <span>{SECTION_LABELS[kk] ?? kk}</span>
                  <RotateCcw size={14} />
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              if (confirm("Reset all your edits on this case study?")) resetAll();
            }}
            style={{
              marginTop: 12, width: "100%",
              padding: "9px 12px", borderRadius: 8,
              background: "transparent", border: "1px dashed #C2A878",
              cursor: "pointer", fontSize: 12, fontWeight: 700,
              color: "#C2A878", letterSpacing: "0.04em",
            }}
          >
            Reset all edits
          </button>
          <p style={{ fontSize: 11, color: "#8A8A8A", marginTop: 12, lineHeight: 1.5, margin: "12px 0 0" }}>
            Saved in your browser only — public visitors see the original.
          </p>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: "12px 18px", borderRadius: 100, border: "none",
          background: "#1E293B", color: "#fff", cursor: "pointer",
          fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
          boxShadow: "0 12px 32px rgba(15,23,42,0.32)",
          display: "inline-flex", alignItems: "center", gap: 8,
        }}
      >
        <Settings size={15} /> Editor
        {hiddenList.length > 0 && (
          <span
            style={{
              background: "#C2A878", color: "#0A0A0A",
              borderRadius: 100, padding: "2px 8px",
              fontSize: 11, fontWeight: 800,
            }}
          >
            {hiddenList.length}
          </span>
        )}
      </button>
    </div>
  );
}

// ─── Page ───
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

  return (
    <EditProvider itemId={item.id}>
      <CaseStudyBody item={item} categorySlug={params?.category ?? ""} setLocation={setLocation} />
      <RestorePanel />
    </EditProvider>
  );
}

function CaseStudyBody({
  item, categorySlug, setLocation,
}: {
  item: PortfolioItem;
  categorySlug: string;
  setLocation: (path: string) => void;
}) {
  const content = dummyContent(item);
  const seeds = HERO_SEEDS[item.category] ?? ["fallback-1", "fallback-2", "fallback-3"];
  const heroImg = picsum(`${seeds[0]}-${item.id}`, 1600, 900);
  const embedUrl = getEmbedUrl(item.youtubeUrl);

  const go = (e: React.MouseEvent, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    setLocation(href);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6" }}>
      {/* ── HERO (title always shown — never hidden) ── */}
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

          <EditableText
            k="hero-eyebrow"
            as="p"
            fallback={`Case Study · ${item.category}`}
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(194,168,120,0.9)", marginBottom: 18, margin: 0 }}
          />
          <EditableText
            k="hero-title"
            as="h1"
            fallback={item.title}
            style={{ fontWeight: 800, fontSize: "clamp(36px, 6.5vw, 68px)", letterSpacing: "-0.04em", lineHeight: 1.04, color: "#fff", marginTop: 18, marginBottom: 24, maxWidth: "20ch" }}
          />

          <Section k="hero-desc">
            <EditableText
              k="hero-desc-text"
              as="p"
              multiline
              fallback={item.description || "Add a short, punchy summary of this case study here. Click to edit."}
              style={{ fontSize: 17, color: "rgba(255,255,255,0.72)", lineHeight: 1.65, maxWidth: "62ch", marginBottom: 40, marginTop: 0 }}
            />
          </Section>

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
            <img src={heroImg} alt={item.title} loading="lazy" style={{ display: "block", width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />
          </motion.div>
        </div>
      </div>
      <div style={{ height: 60 }} />

      {/* ── METRICS STRIP ── */}
      <Section k="metrics-strip" style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 24px 24px" }}>
        <div
          className="metrics-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}
        >
          {content.metrics.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
              style={{ background: "#fff", border: "1.5px solid #E5E5E0", borderRadius: 16, padding: "24px 22px" }}
            >
              <EditableText
                k={`metric-${i}-value`}
                as="div"
                fallback={m.value}
                style={{ fontWeight: 800, fontSize: 32, letterSpacing: "-0.03em", color: "#1E293B", marginBottom: 6 }}
              />
              <EditableText
                k={`metric-${i}-label`}
                as="div"
                fallback={m.label}
                style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#8A8A8A" }}
              />
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── OVERVIEW / CHALLENGE ── */}
      <Section k="overview" style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 24px" }}>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 48 }}>
          <div>
            <EditableText k="overview-eyebrow" as="p" fallback="Overview"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C2A878", marginBottom: 14, margin: 0 }} />
            <EditableText k="overview-heading" as="h2" fallback="How we approached this project."
              style={{ fontWeight: 800, fontSize: "clamp(26px, 3.4vw, 40px)", letterSpacing: "-0.03em", lineHeight: 1.15, color: "#0A0A0A", marginTop: 14, marginBottom: 0 }} />
          </div>
          <div>
            <EditableText k="overview-p1" as="p" multiline fallback={content.overview}
              style={{ fontSize: 16, color: "#3F3F3F", lineHeight: 1.75, marginBottom: 18, marginTop: 0 }} />
            <EditableText k="overview-p2" as="p" multiline fallback={content.challenge}
              style={{ fontSize: 16, color: "#3F3F3F", lineHeight: 1.75, margin: 0 }} />
          </div>
        </div>
      </Section>

      {/* ── IMAGE GALLERY ── */}
      <Section k="gallery" style={{ maxWidth: 1180, margin: "0 auto", padding: "16px 24px" }}>
        <div className="gallery-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
          <img src={picsum(`${seeds[1]}-${item.id}`, 900, 600)} alt="" loading="lazy"
            style={{ width: "100%", aspectRatio: "3/2", objectFit: "cover", borderRadius: 16, border: "1.5px solid #E5E5E0" }} />
          <img src={picsum(`${seeds[2]}-${item.id}`, 900, 600)} alt="" loading="lazy"
            style={{ width: "100%", aspectRatio: "3/2", objectFit: "cover", borderRadius: 16, border: "1.5px solid #E5E5E0" }} />
        </div>
      </Section>

      {/* ── APPROACH ── */}
      <Section k="approach" style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 24px 24px" }}>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 48 }}>
          <div>
            <EditableText k="approach-eyebrow" as="p" fallback="Approach"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C2A878", marginBottom: 14, margin: 0 }} />
            <EditableText k="approach-heading" as="h2" fallback="First-principles, then execution."
              style={{ fontWeight: 800, fontSize: "clamp(26px, 3.4vw, 40px)", letterSpacing: "-0.03em", lineHeight: 1.15, color: "#0A0A0A", marginTop: 14, marginBottom: 0 }} />
          </div>
          <div>
            <EditableText k="approach-p" as="p" multiline fallback={content.approach}
              style={{ fontSize: 16, color: "#3F3F3F", lineHeight: 1.75, marginBottom: 22, marginTop: 0 }} />
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {content.approachList.map((line, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 15, color: "#3F3F3F", lineHeight: 1.6 }}>
                  <CheckCircle2 size={20} style={{ color: "#1E293B", flexShrink: 0, marginTop: 2 }} />
                  <EditableText k={`approach-li-${i}`} as="span" fallback={line} style={{ flex: 1 }} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ── EMBEDDED VIDEO ── */}
      {embedUrl && (
        <Section k="video" style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 24px" }}>
          <EditableText k="video-eyebrow" as="p" fallback="Project Walkthrough"
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C2A878", marginBottom: 14, textAlign: "center", marginTop: 0 }} />
          <div style={{ borderRadius: 20, overflow: "hidden", border: "1.5px solid #E5E5E0", background: "#0A0A0A", boxShadow: "0 20px 60px rgba(15,23,42,0.18)" }}>
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
        </Section>
      )}

      {/* ── SOLUTION + STACK ── */}
      <Section k="solution" style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 24px" }}>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 48 }}>
          <div>
            <EditableText k="solution-eyebrow" as="p" fallback="Solution"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C2A878", marginBottom: 14, margin: 0 }} />
            <EditableText k="solution-heading" as="h2" fallback="The system we shipped."
              style={{ fontWeight: 800, fontSize: "clamp(26px, 3.4vw, 40px)", letterSpacing: "-0.03em", lineHeight: 1.15, color: "#0A0A0A", marginTop: 14, marginBottom: 0 }} />
          </div>
          <div>
            <EditableText k="solution-p" as="p" multiline fallback={content.solution}
              style={{ fontSize: 16, color: "#3F3F3F", lineHeight: 1.75, marginBottom: 24, marginTop: 0 }} />
            <EditableText k="stack-label" as="p" fallback="Stack"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 12, margin: 0 }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {content.stack.map((s, i) => (
                <EditableText
                  key={i}
                  k={`stack-${i}`}
                  as="span"
                  fallback={s}
                  style={{
                    fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
                    padding: "8px 14px", borderRadius: 100,
                    background: "#fff", border: "1.5px solid #E5E5E0", color: "#1E293B",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── TESTIMONIAL ── */}
      <Section k="testimonial" style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 24px" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ background: BRAND_ACCENT, borderRadius: 22, padding: "56px 48px", position: "relative", overflow: "hidden", color: "#fff" }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #C2A878, #D4BB90)" }} />
          <Quote size={48} style={{ color: "rgba(194,168,120,0.5)", marginBottom: 18 }} />
          <EditableText
            k="testimonial-quote"
            as="p"
            multiline
            fallback={`"${content.testimonial.quote}"`}
            style={{ fontSize: "clamp(20px, 2.4vw, 26px)", lineHeight: 1.4, fontWeight: 600, letterSpacing: "-0.015em", marginTop: 0, marginBottom: 26, maxWidth: "44ch" }}
          />
          <EditableText
            k="testimonial-author"
            as="p"
            fallback={`— ${content.testimonial.author}`}
            style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}
          />
        </motion.div>
      </Section>

      {/* ── CTA ── */}
      <Section k="cta" style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px 112px", textAlign: "center" }}>
        <EditableText k="cta-heading" as="h3" fallback="Want results like these?"
          style={{ fontWeight: 800, fontSize: "clamp(26px, 3.6vw, 40px)", letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 16, marginTop: 0 }} />
        <EditableText
          k="cta-sub"
          as="p"
          multiline
          fallback="We work with a small number of founders each quarter. If you're serious about building a system that compounds, let's talk."
          style={{ fontSize: 16, color: "#5F5F5F", marginBottom: 28, maxWidth: "48ch", marginLeft: "auto", marginRight: "auto", lineHeight: 1.6, marginTop: 0 }}
        />
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
          <EditableText k="cta-button" as="span" fallback="Start a project" />
          <ArrowUpRight size={18} />
        </a>
      </Section>

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
