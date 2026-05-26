import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Quote, ImagePlus, Plus, X, Save } from "lucide-react";
import { motion } from "framer-motion";
import { useAdmin } from "@/context/AdminContext";
import { API_BASE, resolveMediaUrl } from "@/lib/api";
import { getEmbedUrl as buildEmbedUrl } from "@/lib/videoEmbed";

// ─────────────────────────────────────────────────────────────────────────────
// CaseStudyInlineEditor — Wix-style WYSIWYG editor that renders a 1:1 visual
// replica of the public CaseStudy page (pages/CaseStudy.tsx legacy layout).
//
// Every section (hero title, byline, hero image, metrics strip, overview,
// gallery, approach + bullets, video, solution + stack, testimonial) keeps
// the EXACT typography, colors, spacing, and structure of the public page.
// The only edit-mode additions are layered absolutely on top:
//   • Text → contentEditable (click and type)
//   • Images → click overlay to upload via /admin/upload
//   • Lists (metrics, bullets, stack) → inline +/− buttons
// Saves back to the existing `caseStudy` JSON column via PUT /admin/portfolio/:id.
// ─────────────────────────────────────────────────────────────────────────────

// Theme constants — must match pages/CaseStudy.tsx
const BG = "#F8F8F6";
const BG_ALT = "#EFEFEA";
const CARD = "#FFFFFF";
const TEXT = "#0A0A0A";
const SLATE = "#1E293B";
const MUTED = "#5F5F5F";
const MUTED_SOFT = "#8A8A8A";
const RULE = "#E5E5E0";
const GOLD = "#C2A878";
const ACCENT = "#3B82F6";

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

interface Props {
  item: PortfolioItem;
  onSaved?: (item: PortfolioItem) => void;
  onExit?: () => void;
}

export default function CaseStudyInlineEditor({ item: initialItem, onSaved, onExit }: Props) {
  const { authFetch } = useAdmin();
  const [item, setItem] = useState<PortfolioItem>(initialItem);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = JSON.stringify(initialItem) !== JSON.stringify(item);
  }, [item, initialItem]);
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  const cs: CaseStudyData = item.caseStudy ?? {};
  const setItemField = <K extends keyof PortfolioItem>(k: K, v: PortfolioItem[K]) => setItem(p => ({ ...p, [k]: v }));
  const setCs = (patch: Partial<CaseStudyData>) =>
    setItem(p => ({ ...p, caseStudy: { ...(p.caseStudy ?? {}), ...patch } }));

  // Sensible defaults when the case study has empty fields — match public-page fallbacks
  const metrics = cs.metrics && cs.metrics.length > 0 ? cs.metrics : [
    { value: "+247%", label: "Increase in qualified inbound" },
    { value: "4×",    label: "Production cadence" },
    { value: "+182%", label: "Avg. engagement lift" },
    { value: "−61%",  label: "Time-to-launch" },
  ];
  const approachBullets = cs.approachBullets && cs.approachBullets.length > 0 ? cs.approachBullets : [
    "Discovery sprint and surface-area audit",
    "Strategic framework tailored to the founder's positioning",
    "Production engine handover with SOPs and tooling",
    "Weekly performance review and optimization",
  ];
  const stack = cs.stack && cs.stack.length > 0 ? cs.stack : ["Notion", "Figma", "Adobe Suite"];
  const gallery = cs.galleryImages && cs.galleryImages.length >= 2 ? cs.galleryImages.slice(0, 2) : [cs.galleryImages?.[0] ?? "", cs.galleryImages?.[1] ?? ""];
  const heroImg = cs.heroImageUrl || cs.coverImageUrl || "";
  const videoUrlInput = cs.videoUrl ?? "";
  const embedUrl = videoUrlInput ? buildEmbedUrl(videoUrlInput, { autoplay: false }) : (item.youtubeUrl ? buildEmbedUrl(item.youtubeUrl, { autoplay: false }) : "");
  const yearLabel = new Date().getFullYear().toString();
  const roleLabel = item.category.includes("Web") ? "Design & Build"
    : item.category.includes("AI") ? "Strategy & Automation"
    : item.category.includes("Graphics") ? "Brand & Identity"
    : "Strategy & Production";

  async function uploadImage(file: File): Promise<string | null> {
    const fd = new FormData(); fd.append("file", file);
    const res = await authFetch(`${API_BASE}/admin/upload`, { method: "POST", body: fd });
    if (!res.ok) { alert(`Upload failed (${res.status})`); return null; }
    const { url } = await res.json() as { url: string };
    return resolveMediaUrl(url);
  }

  async function save() {
    setSaving(true); setSaveMsg(null);
    try {
      const body = {
        title: item.title,
        category: item.category,
        youtubeUrl: item.youtubeUrl,
        description: item.description ?? "",
        sortOrder: item.sortOrder,
        caseStudy: { ...cs, metrics, approachBullets, stack, galleryImages: gallery, videoUrl: videoUrlInput },
      };
      const res = await authFetch(`${API_BASE}/admin/portfolio/${item.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setSaveMsg(`Save failed: ${(e as { error?: string }).error ?? res.status}`);
      } else {
        setSaveMsg("Saved ✓");
        dirtyRef.current = false;
        onSaved?.(item);
        setTimeout(() => setSaveMsg(null), 2500);
      }
    } catch { setSaveMsg("Network error — try again."); }
    finally { setSaving(false); }
  }
  function exitEditor() {
    if (dirtyRef.current && !confirm("You have unsaved changes. Leave anyway?")) return;
    onExit?.();
  }

  const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, margin: 0 };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      {/* ── Sticky top bar (only edit-mode chrome) ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 16px", background: "rgba(10,10,10,0.95)", color: "#fff",
        borderBottom: `1px solid ${ACCENT}`,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: ACCENT }}>Editing</span>
        <span style={{ fontSize: 13, opacity: 0.85 }}>Click any text to edit · Click any image to replace</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {saveMsg && <span style={{ fontSize: 13, color: saveMsg.startsWith("Saved") ? "#84cc16" : "#f87171" }}>{saveMsg}</span>}
          <button onClick={exitEditor} disabled={saving} style={btn("ghost")}><X size={14} /> Exit</button>
          <button onClick={save} disabled={saving} style={btn("primary")}><Save size={14} /> {saving ? "Saving…" : "Save"}</button>
        </div>
      </div>

      {/* ── Back strip (display only) ── */}
      <div style={{ borderBottom: `1px solid ${RULE}`, background: BG }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: MUTED, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            <ArrowLeft size={14} /> {item.category}
          </span>
        </div>
      </div>

      {/* ── HERO ── */}
      <section style={{ padding: "80px 24px 56px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <span style={{ width: 32, height: 1, background: GOLD }} />
            <p style={eyebrow}>Case Study · {item.category}</p>
          </div>

          <Editable
            as="h1"
            value={item.title}
            onChange={(v) => setItemField("title", v)}
            placeholder="Project title…"
            style={{ fontWeight: 800, fontSize: "clamp(36px, 6.5vw, 72px)", letterSpacing: "-0.04em", lineHeight: 1.04, color: TEXT, margin: 0, maxWidth: "20ch" }}
          />

          <Editable
            as="p"
            multiline
            value={item.description ?? ""}
            onChange={(v) => setItemField("description", v)}
            placeholder="One-line description (optional)…"
            style={{ fontSize: "clamp(17px, 1.6vw, 20px)", color: MUTED, lineHeight: 1.6, marginTop: 24, marginBottom: 0, maxWidth: "62ch", fontWeight: 500 }}
          />

          {/* Byline grid */}
          <div className="byline" style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${RULE}`, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            <BylineCell label="Client">
              <Editable value={cs.clientName ?? ""} onChange={(v) => setCs({ clientName: v })} placeholder="Client name"
                style={{ fontSize: 15, fontWeight: 700, color: TEXT, letterSpacing: "-0.01em" }} />
            </BylineCell>
            <BylineCell label="Category"><span style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{item.category}</span></BylineCell>
            <BylineCell label="Role"><span style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{roleLabel}</span></BylineCell>
            <BylineCell label="Year"><span style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{yearLabel}</span></BylineCell>
          </div>
        </div>
      </section>

      {/* ── HERO IMAGE ── */}
      <section style={{ padding: "0 24px 88px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ position: "relative", borderRadius: 22, overflow: "hidden", border: `1px solid ${RULE}`, background: BG_ALT, boxShadow: "0 30px 80px -30px rgba(10,10,10,0.25)" }}>
            {/* Client logo chip — also editable */}
            <ClientLogoChip
              logoUrl={cs.clientLogoUrl ?? ""} clientName={cs.clientName ?? ""}
              onUpload={async (f) => { const u = await uploadImage(f); if (u) setCs({ clientLogoUrl: u }); }}
              onRemove={() => setCs({ clientLogoUrl: undefined })}
            />
            <ImageDrop
              src={heroImg}
              alt={item.title}
              onUpload={async (f) => { const u = await uploadImage(f); if (u) setCs({ heroImageUrl: u, coverImageUrl: cs.coverImageUrl ?? u }); }}
              aspectRatio="16/9"
              placeholder="Click to upload hero image"
              style={{ width: "100%", display: "block" }}
            />
          </div>
        </div>
      </section>

      {/* ── METRICS STRIP ── */}
      <section style={{ borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}`, background: CARD }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${metrics.length}, 1fr)` }}>
            {metrics.map((m, i) => (
              <div key={i} style={{ padding: "56px 28px", textAlign: "center", borderLeft: i === 0 ? "none" : `1px solid ${RULE}`, position: "relative" }} className="metric-cell">
                <div style={{ width: 32, height: 2, background: GOLD, borderRadius: 2, margin: "0 auto 20px" }} />
                <Editable
                  as="div" value={m.value}
                  onChange={(v) => setCs({ metrics: metrics.map((x, idx) => idx === i ? { ...x, value: v } : x) })}
                  placeholder="+200%"
                  style={{ fontSize: "clamp(36px, 4.5vw, 56px)", fontWeight: 800, letterSpacing: "-0.04em", color: TEXT, lineHeight: 1, marginBottom: 12, textAlign: "center" }}
                />
                <Editable
                  as="div" multiline value={m.label}
                  onChange={(v) => setCs({ metrics: metrics.map((x, idx) => idx === i ? { ...x, label: v } : x) })}
                  placeholder="Label"
                  style={{ fontSize: 13, color: MUTED_SOFT, fontWeight: 500, maxWidth: "20ch", lineHeight: 1.6, margin: "0 auto", textAlign: "center" }}
                />
                <button onClick={() => setCs({ metrics: metrics.filter((_, idx) => idx !== i) })} style={cornerXBtnOnLight} title="Remove metric"><X size={12} /></button>
              </div>
            ))}
          </div>
          {metrics.length < 6 && (
            <div style={{ display: "flex", justifyContent: "center", padding: "0 0 16px" }}>
              <button onClick={() => setCs({ metrics: [...metrics, { value: "0%", label: "New metric" }] })} style={addPillBtn}>
                <Plus size={14} /> Add metric
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── OVERVIEW ── */}
      <SectionShell label="Overview" heading="How we approached this project.">
        <Editable as="div" multiline value={cs.overview ?? ""} onChange={(v) => setCs({ overview: v })}
          placeholder="Overview paragraph…"
          style={{ fontSize: 17, color: TEXT, lineHeight: 1.75, marginTop: 0, marginBottom: 22, fontWeight: 500 }} />
        <Editable as="div" multiline value={cs.challenge ?? ""} onChange={(v) => setCs({ challenge: v })}
          placeholder="Challenge paragraph…"
          style={{ fontSize: 16, color: MUTED, lineHeight: 1.75, margin: 0 }} />
      </SectionShell>

      {/* ── GALLERY (2 images) ── */}
      <section style={{ padding: "0 24px 56px" }}>
        <div className="gallery-2" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
          {gallery.map((src, i) => (
            <div key={i} style={{ borderRadius: 22, overflow: "hidden", border: `1px solid ${RULE}`, background: BG_ALT }}>
              <ImageDrop
                src={src} alt=""
                onUpload={async (f) => {
                  const u = await uploadImage(f); if (!u) return;
                  const arr = [...gallery]; arr[i] = u;
                  setCs({ galleryImages: arr });
                }}
                aspectRatio="3/2"
                placeholder={`Click to upload image ${i + 1}`}
                style={{ width: "100%", display: "block" }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── APPROACH ── */}
      <SectionShell label="Approach" heading="First-principles, then execution.">
        <Editable as="div" multiline value={cs.approach ?? ""} onChange={(v) => setCs({ approach: v })}
          placeholder="Approach paragraph…"
          style={{ fontSize: 17, color: TEXT, lineHeight: 1.75, marginTop: 0, marginBottom: 28, fontWeight: 500 }} />
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          {approachBullets.map((line, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 20px", background: CARD, border: `1px solid ${RULE}`, borderRadius: 14, fontSize: 15, color: TEXT, lineHeight: 1.55, fontWeight: 500, position: "relative" }}>
              <CheckCircle2 size={20} style={{ color: SLATE, flexShrink: 0, marginTop: 1 }} />
              <Editable as="div" multiline value={line}
                onChange={(v) => setCs({ approachBullets: approachBullets.map((x, idx) => idx === i ? v : x) })}
                placeholder="Bullet…"
                style={{ flex: 1 }} />
              <button onClick={() => setCs({ approachBullets: approachBullets.filter((_, idx) => idx !== i) })}
                style={{ background: "transparent", border: 0, cursor: "pointer", color: MUTED }} title="Remove bullet"><X size={14} /></button>
            </li>
          ))}
        </ul>
        <button onClick={() => setCs({ approachBullets: [...approachBullets, ""] })} style={{ ...addLinkBtn, marginTop: 14 }}>
          <Plus size={14} /> Add bullet
        </button>
      </SectionShell>

      {/* ── VIDEO ── */}
      <section style={{ padding: "24px 24px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, justifyContent: "center" }}>
            <span style={{ width: 32, height: 1, background: GOLD }} />
            <p style={eyebrow}>Project Walkthrough</p>
            <span style={{ width: 32, height: 1, background: GOLD }} />
          </div>
          <div style={{ borderRadius: 22, overflow: "hidden", border: `1px solid ${RULE}`, background: TEXT, boxShadow: "0 20px 60px -20px rgba(15,23,42,0.25)" }}>
            <div style={{ position: "relative", aspectRatio: "16/9" }}>
              {embedUrl ? (
                <iframe src={embedUrl} title={item.title}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, opacity: 0.7 }}>
                  Paste a video URL below to embed
                </div>
              )}
            </div>
          </div>
          <input value={videoUrlInput} onChange={(e) => setCs({ videoUrl: e.target.value })}
            placeholder="Video URL (YouTube / Vimeo / Gumlet / Drive)"
            style={{ display: "block", marginTop: 12, width: "100%", maxWidth: 560, marginLeft: "auto", marginRight: "auto",
              padding: "8px 12px", border: `1px solid ${RULE}`, borderRadius: 8, fontSize: 13, color: MUTED, background: "#fff" }} />
        </div>
      </section>

      {/* ── SOLUTION + STACK ── */}
      <SectionShell label="Solution" heading="The system we shipped.">
        <Editable as="div" multiline value={cs.solution ?? ""} onChange={(v) => setCs({ solution: v })}
          placeholder="Solution paragraph…"
          style={{ fontSize: 17, color: TEXT, lineHeight: 1.75, marginTop: 0, marginBottom: 28, fontWeight: 500 }} />
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED_SOFT, marginBottom: 14 }}>Stack</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {stack.map((s, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", padding: "8px 14px", borderRadius: 100, background: CARD, border: `1px solid ${RULE}`, color: SLATE, display: "inline-flex", gap: 8, alignItems: "center" }}>
              <Editable value={s} onChange={(v) => setCs({ stack: stack.map((x, idx) => idx === i ? v : x) })} placeholder="Tool" />
              <button onClick={() => setCs({ stack: stack.filter((_, idx) => idx !== i) })}
                style={{ background: "transparent", border: 0, cursor: "pointer", color: MUTED, padding: 0 }} title="Remove"><X size={11} /></button>
            </span>
          ))}
          <button onClick={() => setCs({ stack: [...stack, "New tool"] })}
            style={{ fontSize: 12, fontWeight: 700, padding: "8px 14px", borderRadius: 100, background: "transparent", border: `1px dashed ${ACCENT}`, color: ACCENT, cursor: "pointer" }}>
            <Plus size={12} style={{ display: "inline", marginRight: 4 }} /> Add
          </button>
        </div>
      </SectionShell>

      {/* ── TESTIMONIAL ── */}
      <section style={{ padding: "32px 24px 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            style={{ background: SLATE, borderRadius: 22, padding: "56px 48px", position: "relative", overflow: "hidden", color: "#FFFFFF" }}>
            <div style={{ position: "absolute", top: 0, left: 32, right: 32, height: 2, background: "linear-gradient(90deg, #C2A878 0%, transparent 100%)", borderRadius: 1 }} />
            <Quote size={44} style={{ color: "rgba(194,168,120,0.45)", marginBottom: 18 }} />
            <Editable as="p" multiline value={cs.testimonial?.quote ?? ""}
              onChange={(v) => setCs({ testimonial: { ...(cs.testimonial ?? { author: "" }), quote: v } })}
              placeholder="Client testimonial quote…"
              style={{ fontSize: "clamp(20px, 2.4vw, 28px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.4, color: "#FFFFFF", margin: 0, marginBottom: 26, maxWidth: "48ch" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 24, height: 1, background: GOLD }} />
              <Editable as="p" value={cs.testimonial?.author ?? ""}
                onChange={(v) => setCs({ testimonial: { ...(cs.testimonial ?? { quote: "" }), author: v } })}
                placeholder="Author · Role"
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, margin: 0 }} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA (display only — same on every case study) ── */}
      <section style={{ padding: "32px 24px 112px", textAlign: "center" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <h3 style={{ fontWeight: 800, fontSize: "clamp(26px, 3.6vw, 42px)", letterSpacing: "-0.035em", color: TEXT, lineHeight: 1.08, margin: 0, marginBottom: 18 }}>
            Want results like these?
          </h3>
          <p style={{ fontSize: 16, color: MUTED, marginBottom: 32, maxWidth: "48ch", marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
            We work with a small number of founders each quarter. If you're serious about building a system that compounds, let's talk.
          </p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 30px", borderRadius: 100, background: SLATE, color: "#FFFFFF", fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Start a project <ArrowUpRight size={18} />
          </span>
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
        [contenteditable=true]:focus { outline: 2px solid ${ACCENT}; outline-offset: 4px; border-radius: 2px; }
        [contenteditable=true]:hover:not(:focus) { outline: 1px dashed rgba(59,130,246,0.45); outline-offset: 4px; border-radius: 2px; }
        [contenteditable=true]:empty::before { content: attr(data-placeholder); opacity: 0.45; }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable bits
// ─────────────────────────────────────────────────────────────────────────────

function Editable({ value, onChange, style, placeholder, multiline, as: As = "span" }: {
  value: string; onChange: (v: string) => void; style?: React.CSSProperties;
  placeholder?: string; multiline?: boolean; as?: keyof React.JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) ref.current.innerText = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return React.createElement(As as string, {
    ref,
    contentEditable: true,
    suppressContentEditableWarning: true,
    "data-placeholder": placeholder ?? "",
    onBlur: (e: React.FocusEvent<HTMLElement>) => onChange(e.currentTarget.innerText),
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (!multiline && e.key === "Enter") { e.preventDefault(); (e.target as HTMLElement).blur(); }
      if (e.key === "Escape") (e.target as HTMLElement).blur();
    },
    style: { outline: "none", ...style },
  });
}

function BylineCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function SectionShell({ label, heading, children }: { label: string; heading: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: "72px 24px" }}>
      <div className="two-col" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 48, alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ width: 20, height: 1, background: GOLD }} />
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, margin: 0 }}>{label}</p>
          </div>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(26px, 3.4vw, 40px)", letterSpacing: "-0.035em", lineHeight: 1.1, color: TEXT, margin: 0 }}>{heading}</h2>
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

function ImageDrop({ src, alt, onUpload, aspectRatio, placeholder, style }: {
  src: string; alt: string; onUpload: (f: File) => Promise<void> | void;
  aspectRatio?: string; placeholder?: string; style?: React.CSSProperties;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          setUploading(true); try { await onUpload(f); } finally { setUploading(false); e.currentTarget.value = ""; }
        }} />
      {src ? (
        <>
          <img src={src} alt={alt} loading="eager" style={{ aspectRatio, objectFit: "cover", ...style }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ position: "absolute", top: 14, right: 14, padding: "8px 14px", borderRadius: 999,
              background: "rgba(10,10,10,0.85)", color: "#fff", border: 0, cursor: "pointer",
              fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
            <ImagePlus size={14} /> {uploading ? "Uploading…" : "Replace"}
          </button>
        </>
      ) : (
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ width: "100%", aspectRatio, border: 0, background: BG_ALT, color: MUTED,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
          <ImagePlus size={18} /> {uploading ? "Uploading…" : (placeholder ?? "Click to upload")}
        </button>
      )}
    </div>
  );
}

function ClientLogoChip({ logoUrl, clientName, onUpload, onRemove }: {
  logoUrl: string; clientName: string; onUpload: (f: File) => Promise<void> | void; onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div style={{ position: "absolute", zIndex: 2, top: 20, left: 20, background: "rgba(255,255,255,0.95)", borderRadius: 100, padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: 10, border: `1px solid ${RULE}`, boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={async (e) => { const f = e.target.files?.[0]; if (f) await onUpload(f); e.currentTarget.value = ""; }} />
      {logoUrl ? (
        <img src={logoUrl} alt={clientName || "Client logo"} onClick={() => fileRef.current?.click()}
          style={{ width: 22, height: 22, objectFit: "contain", borderRadius: 4, cursor: "pointer" }} title="Click to replace logo" />
      ) : (
        <button onClick={() => fileRef.current?.click()} title="Upload client logo"
          style={{ width: 22, height: 22, border: `1px dashed ${ACCENT}`, borderRadius: 4, background: "transparent", color: ACCENT, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
          <Plus size={12} />
        </button>
      )}
      {clientName && (
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", color: TEXT }}>{clientName}</span>
      )}
      {logoUrl && (
        <button onClick={onRemove} title="Remove logo" style={{ background: "transparent", border: 0, cursor: "pointer", color: MUTED, padding: 0 }}><X size={12} /></button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Style helpers
// ─────────────────────────────────────────────────────────────────────────────

const cornerXBtnOnLight: React.CSSProperties = {
  position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%",
  background: "rgba(10,10,10,0.7)", color: "#fff", border: 0, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.85,
};
const addPillBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700,
  padding: "6px 14px", borderRadius: 999, background: "transparent",
  border: `1px dashed ${ACCENT}`, color: ACCENT, cursor: "pointer",
};
const addLinkBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700,
  color: ACCENT, background: "transparent", border: `1px dashed ${ACCENT}`,
  padding: "6px 12px", borderRadius: 6, cursor: "pointer",
};
function btn(variant: "primary" | "ghost"): React.CSSProperties {
  if (variant === "primary") {
    return { display: "inline-flex", alignItems: "center", gap: 6,
      background: ACCENT, color: "#fff", border: 0, padding: "8px 14px",
      borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" };
  }
  return { display: "inline-flex", alignItems: "center", gap: 6,
    background: "transparent", color: "#fff", border: `1px solid rgba(255,255,255,0.25)`,
    padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" };
}
