import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowUpRight, CheckCircle2, Quote, ImagePlus, Plus, X, Save,
  Eye, EyeOff, Copy, Trash2, Crop, Maximize2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAdmin } from "@/context/AdminContext";
import { API_BASE, resolveMediaUrl } from "@/lib/api";
import { getEmbedUrl as buildEmbedUrl } from "@/lib/videoEmbed";

// ─────────────────────────────────────────────────────────────────────────────
// CaseStudyInlineEditor — Wix-style WYSIWYG editor that renders a 1:1 visual
// replica of the public case study page and gives the admin true Wix freedom:
//   • Per-section toolbar (hide / show, when applicable)
//   • Aspect-ratio control on any image or video (16/9, 4/3, 1/1, 9/16, 21/9)
//   • Multi-image gallery (unlimited add / remove / duplicate)
//   • Multi-video (unlimited add / remove / duplicate, individual aspect ratio)
//   • Multi-paragraph text sections (Overview / Approach / Solution)
//   • Inline +/duplicate/remove for every list item (metric, bullet, tag)
// All edits save to the existing caseStudy JSON column via PUT /admin/portfolio/:id.
// New fields are 100% backward-compatible (the public renderer falls back to
// legacy fields when the new ones aren't present).
// ─────────────────────────────────────────────────────────────────────────────

// Theme — must match pages/CaseStudy.tsx
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

// Aspect-ratio choices (label → CSS aspect-ratio value)
const RATIOS: Array<{ label: string; value: string }> = [
  { label: "16:9", value: "16/9" },
  { label: "4:3",  value: "4/3"  },
  { label: "1:1",  value: "1/1"  },
  { label: "9:16", value: "9/16" },
  { label: "3:2",  value: "3/2"  },
  { label: "21:9", value: "21/9" },
];

// Media types kept rich enough to carry per-item aspect ratio + width %.
type MediaItem = { url: string; ratio?: string; width?: number };
type VideoItem = { url: string; ratio?: string; width?: number };

// Section keys eligible for hide/show. Hero is always visible.
type SectionKey = "metrics" | "overview" | "gallery" | "approach" | "video" | "solution" | "testimonial";

interface CaseStudyData {
  clientName?: string;
  clientLogoUrl?: string;
  coverImageUrl?: string;
  heroImageUrl?: string;
  heroImageRatio?: string;
  heroImageWidth?: number;                      // % width 20-100 (default 100)
  galleryImages?: Array<string | MediaItem>;   // legacy: string[]; new: MediaItem[]
  metrics?: Array<{ value: string; label: string }>;
  stack?: string[];
  testimonial?: { quote: string; author: string };
  overview?: string;
  overviewLabel?: string;
  overviewHeading?: string;
  overviewExtras?: string[];
  challenge?: string;
  approach?: string;
  approachLabel?: string;
  approachHeading?: string;
  approachExtras?: string[];
  approachBullets?: string[];
  solution?: string;
  solutionLabel?: string;
  solutionHeading?: string;
  solutionExtras?: string[];
  videoUrl?: string;                            // legacy single
  videos?: VideoItem[];                         // new multi
  videoEyebrow?: string;
  hiddenSections?: SectionKey[];
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

// Normalizers — keep old-shape data working transparently
function normalizeGallery(input: Array<string | MediaItem> | undefined): MediaItem[] {
  if (!Array.isArray(input)) return [];
  return input.map((x) => typeof x === "string" ? { url: x } : { url: x.url, ratio: x.ratio, width: x.width });
}
function normalizeVideos(cs: CaseStudyData): VideoItem[] {
  if (Array.isArray(cs.videos) && cs.videos.length > 0) return cs.videos;
  if (cs.videoUrl) return [{ url: cs.videoUrl }];
  return [];
}

export default function CaseStudyInlineEditor({ item: initialItem, onSaved, onExit }: Props) {
  const { authFetch } = useAdmin();
  const [item, setItem] = useState<PortfolioItem>(initialItem);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const dirtyRef = useRef(false);
  useEffect(() => { dirtyRef.current = JSON.stringify(initialItem) !== JSON.stringify(item); }, [item, initialItem]);
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  const cs: CaseStudyData = item.caseStudy ?? {};
  const setItemField = <K extends keyof PortfolioItem>(k: K, v: PortfolioItem[K]) => setItem(p => ({ ...p, [k]: v }));
  const setCs = (patch: Partial<CaseStudyData>) =>
    setItem(p => ({ ...p, caseStudy: { ...(p.caseStudy ?? {}), ...patch } }));

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
  const gallery = normalizeGallery(cs.galleryImages);
  const videos = normalizeVideos(cs);
  const heroImg = cs.heroImageUrl || cs.coverImageUrl || "";
  const heroRatio = cs.heroImageRatio ?? "16/9";
  const hiddenSet = new Set<SectionKey>(cs.hiddenSections ?? []);
  const overviewExtras = cs.overviewExtras ?? [];
  const approachExtras = cs.approachExtras ?? [];
  const solutionExtras = cs.solutionExtras ?? [];

  const yearLabel = new Date().getFullYear().toString();
  const roleLabel = item.category.includes("Web") ? "Design & Build"
    : item.category.includes("AI") ? "Strategy & Automation"
    : item.category.includes("Graphics") ? "Brand & Identity"
    : "Strategy & Production";

  const isHidden = (k: SectionKey) => hiddenSet.has(k);
  const toggleHidden = (k: SectionKey) => {
    const next = new Set(hiddenSet);
    if (next.has(k)) next.delete(k); else next.add(k);
    setCs({ hiddenSections: Array.from(next) as SectionKey[] });
  };

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
        caseStudy: {
          ...cs,
          metrics, approachBullets, stack,
          galleryImages: gallery,           // canonical: MediaItem[]
          videos,                            // canonical: VideoItem[]
          videoUrl: videos[0]?.url ?? "",   // keep legacy field in sync for old renderers
          overviewExtras, approachExtras, solutionExtras,
          heroImageRatio: heroRatio,
          hiddenSections: Array.from(hiddenSet),
        },
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

  const eyebrowSty: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, margin: 0 };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 16px", background: "rgba(10,10,10,0.95)", color: "#fff",
        borderBottom: `1px solid ${ACCENT}`,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: ACCENT }}>Editing</span>
        <span style={{ fontSize: 13, opacity: 0.85 }}>Click text · Click image to replace · Hover section for tools</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {saveMsg && <span style={{ fontSize: 13, color: saveMsg.startsWith("Saved") ? "#84cc16" : "#f87171" }}>{saveMsg}</span>}
          <button onClick={exitEditor} disabled={saving} style={btn("ghost")}><X size={14} /> Exit</button>
          <button onClick={save} disabled={saving} style={btn("primary")}><Save size={14} /> {saving ? "Saving…" : "Save"}</button>
        </div>
      </div>

      {/* ── Back strip ────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${RULE}`, background: BG }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: MUTED, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            <ArrowLeft size={14} /> {item.category}
          </span>
        </div>
      </div>

      {/* ── HERO (always visible — can't hide your own title) ─────────────── */}
      <SectionFrame label="Hero">
        <section style={{ padding: "80px 24px 56px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
              <span style={{ width: 32, height: 1, background: GOLD }} />
              <p style={eyebrowSty}>Case Study · {item.category}</p>
            </div>
            <Editable as="h1" value={item.title} onChange={(v) => setItemField("title", v)} placeholder="Project title…"
              style={{ fontWeight: 800, fontSize: "clamp(36px, 6.5vw, 72px)", letterSpacing: "-0.04em", lineHeight: 1.04, color: TEXT, margin: 0, maxWidth: "20ch" }} />
            <Editable as="p" multiline value={item.description ?? ""} onChange={(v) => setItemField("description", v)} placeholder="One-line description (optional)…"
              style={{ fontSize: "clamp(17px, 1.6vw, 20px)", color: MUTED, lineHeight: 1.6, marginTop: 24, marginBottom: 0, maxWidth: "62ch", fontWeight: 500 }} />
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
            <WidthBox widthPct={cs.heroImageWidth ?? 100} onChange={(w) => setCs({ heroImageWidth: w })}>
              <div style={{ position: "relative", borderRadius: 22, overflow: "hidden", border: `1px solid ${RULE}`, background: BG_ALT, boxShadow: "0 30px 80px -30px rgba(10,10,10,0.25)" }}>
                <ClientLogoChip logoUrl={cs.clientLogoUrl ?? ""} clientName={cs.clientName ?? ""}
                  onUpload={async (f) => { const u = await uploadImage(f); if (u) setCs({ clientLogoUrl: u }); }}
                  onRemove={() => setCs({ clientLogoUrl: undefined })} />
                <MediaTile
                  src={heroImg} alt={item.title} ratio={heroRatio}
                  widthPct={cs.heroImageWidth ?? 100}
                  onChangeWidth={(w) => setCs({ heroImageWidth: w })}
                  onUpload={async (f) => { const u = await uploadImage(f); if (u) setCs({ heroImageUrl: u, coverImageUrl: cs.coverImageUrl ?? u }); }}
                  onChangeRatio={(r) => setCs({ heroImageRatio: r })}
                  onRemove={() => setCs({ heroImageUrl: undefined, coverImageUrl: undefined })}
                  placeholder="Click to upload hero image"
                />
              </div>
            </WidthBox>
          </div>
        </section>
      </SectionFrame>

      {/* ── METRICS STRIP ─────────────────────────────────────────────────── */}
      <SectionFrame label="Metrics" hidden={isHidden("metrics")} onToggleHide={() => toggleHidden("metrics")}>
        <section style={{ borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}`, background: CARD }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
            <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(metrics.length, 1)}, 1fr)` }}>
              {metrics.map((m, i) => (
                <div key={i} style={{ padding: "56px 28px", textAlign: "center", borderLeft: i === 0 ? "none" : `1px solid ${RULE}`, position: "relative" }} className="metric-cell">
                  <div style={{ width: 32, height: 2, background: GOLD, borderRadius: 2, margin: "0 auto 20px" }} />
                  <Editable as="div" value={m.value}
                    onChange={(v) => setCs({ metrics: metrics.map((x, idx) => idx === i ? { ...x, value: v } : x) })} placeholder="+200%"
                    style={{ fontSize: "clamp(36px, 4.5vw, 56px)", fontWeight: 800, letterSpacing: "-0.04em", color: TEXT, lineHeight: 1, marginBottom: 12, textAlign: "center" }} />
                  <Editable as="div" multiline value={m.label}
                    onChange={(v) => setCs({ metrics: metrics.map((x, idx) => idx === i ? { ...x, label: v } : x) })} placeholder="Label"
                    style={{ fontSize: 13, color: MUTED_SOFT, fontWeight: 500, maxWidth: "20ch", lineHeight: 1.6, margin: "0 auto", textAlign: "center" }} />
                  <ItemActions
                    onDuplicate={() => setCs({ metrics: [...metrics.slice(0, i + 1), { ...m }, ...metrics.slice(i + 1)] })}
                    onRemove={() => setCs({ metrics: metrics.filter((_, idx) => idx !== i) })}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "0 0 16px" }}>
              <button onClick={() => setCs({ metrics: [...metrics, { value: "0%", label: "New metric" }] })} style={addPillBtn}>
                <Plus size={14} /> Add metric
              </button>
            </div>
          </div>
        </section>
      </SectionFrame>

      {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
      <SectionFrame label="Overview" hidden={isHidden("overview")} onToggleHide={() => toggleHidden("overview")}>
        <SectionShell
          label={cs.overviewLabel ?? "Overview"}
          heading={cs.overviewHeading ?? "How we approached this project."}
          onChangeLabel={(v) => setCs({ overviewLabel: v })}
          onChangeHeading={(v) => setCs({ overviewHeading: v })}
        >
          <Editable as="div" multiline value={cs.overview ?? ""} onChange={(v) => setCs({ overview: v })} placeholder="Overview paragraph…"
            style={{ fontSize: 17, color: TEXT, lineHeight: 1.75, marginTop: 0, marginBottom: 22, fontWeight: 500 }} />
          <Editable as="div" multiline value={cs.challenge ?? ""} onChange={(v) => setCs({ challenge: v })} placeholder="Challenge paragraph…"
            style={{ fontSize: 16, color: MUTED, lineHeight: 1.75, margin: 0 }} />
          <ExtraParagraphs items={overviewExtras} onChange={(arr) => setCs({ overviewExtras: arr })} muted />
        </SectionShell>
      </SectionFrame>

      {/* ── GALLERY ───────────────────────────────────────────────────────── */}
      <SectionFrame label="Gallery" hidden={isHidden("gallery")} onToggleHide={() => toggleHidden("gallery")}>
        <section style={{ padding: "0 24px 56px" }}>
          <div className="gallery-2" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
            {gallery.map((g, i) => (
              <WidthBox key={i} widthPct={g.width ?? 100}
                onChange={(w) => setCs({ galleryImages: gallery.map((x, idx) => idx === i ? { ...x, width: w } : x) })}>
                <div style={{ borderRadius: 22, overflow: "hidden", border: `1px solid ${RULE}`, background: BG_ALT, position: "relative" }}>
                  <MediaTile
                    src={g.url} alt="" ratio={g.ratio ?? "3/2"}
                    widthPct={g.width ?? 100}
                    onChangeWidth={(w) => setCs({ galleryImages: gallery.map((x, idx) => idx === i ? { ...x, width: w } : x) })}
                    onUpload={async (f) => {
                      const u = await uploadImage(f); if (!u) return;
                      const arr = gallery.map((x, idx) => idx === i ? { ...x, url: u } : x);
                      setCs({ galleryImages: arr });
                    }}
                    onChangeRatio={(r) => setCs({ galleryImages: gallery.map((x, idx) => idx === i ? { ...x, ratio: r } : x) })}
                    onDuplicate={() => setCs({ galleryImages: [...gallery.slice(0, i + 1), { ...g }, ...gallery.slice(i + 1)] })}
                    onRemove={() => setCs({ galleryImages: gallery.filter((_, idx) => idx !== i) })}
                    placeholder={`Click to upload image ${i + 1}`}
                  />
                </div>
              </WidthBox>
            ))}
            <button onClick={async () => {
              // Add an empty slot so user can click and upload
              setCs({ galleryImages: [...gallery, { url: "", ratio: "3/2" }] });
            }} style={{ borderRadius: 22, border: `2px dashed ${ACCENT}`, background: "transparent", color: ACCENT,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 200, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
              <Plus size={18} /> Add image
            </button>
          </div>
        </section>
      </SectionFrame>

      {/* ── APPROACH ──────────────────────────────────────────────────────── */}
      <SectionFrame label="Approach" hidden={isHidden("approach")} onToggleHide={() => toggleHidden("approach")}>
        <SectionShell
          label={cs.approachLabel ?? "Approach"}
          heading={cs.approachHeading ?? "First-principles, then execution."}
          onChangeLabel={(v) => setCs({ approachLabel: v })}
          onChangeHeading={(v) => setCs({ approachHeading: v })}
        >
          <Editable as="div" multiline value={cs.approach ?? ""} onChange={(v) => setCs({ approach: v })} placeholder="Approach paragraph…"
            style={{ fontSize: 17, color: TEXT, lineHeight: 1.75, marginTop: 0, marginBottom: 28, fontWeight: 500 }} />
          <ExtraParagraphs items={approachExtras} onChange={(arr) => setCs({ approachExtras: arr })} />
          <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0", display: "flex", flexDirection: "column", gap: 14 }}>
            {approachBullets.map((line, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 20px", background: CARD, border: `1px solid ${RULE}`, borderRadius: 14, fontSize: 15, color: TEXT, lineHeight: 1.55, fontWeight: 500, position: "relative" }}>
                <CheckCircle2 size={20} style={{ color: SLATE, flexShrink: 0, marginTop: 1 }} />
                <Editable as="div" multiline value={line}
                  onChange={(v) => setCs({ approachBullets: approachBullets.map((x, idx) => idx === i ? v : x) })} placeholder="Bullet…"
                  style={{ flex: 1 }} />
                <span style={{ display: "flex", gap: 4 }}>
                  <IconBtn title="Duplicate" onClick={() => setCs({ approachBullets: [...approachBullets.slice(0, i + 1), line, ...approachBullets.slice(i + 1)] })}><Copy size={13} /></IconBtn>
                  <IconBtn title="Remove" danger onClick={() => setCs({ approachBullets: approachBullets.filter((_, idx) => idx !== i) })}><X size={14} /></IconBtn>
                </span>
              </li>
            ))}
          </ul>
          <button onClick={() => setCs({ approachBullets: [...approachBullets, ""] })} style={{ ...addLinkBtn, marginTop: 14 }}>
            <Plus size={14} /> Add bullet
          </button>
        </SectionShell>
      </SectionFrame>

      {/* ── VIDEO (multi) ─────────────────────────────────────────────────── */}
      <SectionFrame label="Videos" hidden={isHidden("video")} onToggleHide={() => toggleHidden("video")}>
        <section style={{ padding: "24px 24px 48px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, justifyContent: "center" }}>
              <span style={{ width: 32, height: 1, background: GOLD }} />
              <Editable as="p" value={cs.videoEyebrow ?? "Project Walkthrough"}
                onChange={(v) => setCs({ videoEyebrow: v })} placeholder="Video eyebrow…" style={eyebrowSty} />
              <span style={{ width: 32, height: 1, background: GOLD }} />
            </div>
            {videos.length === 0 ? (
              <EmptyVideoSlot onAdd={(url) => setCs({ videos: [{ url, ratio: "16/9" }] })} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {videos.map((v, i) => (
                  <WidthBox key={i} widthPct={v.width ?? 100}
                    onChange={(w) => setCs({ videos: videos.map((x, idx) => idx === i ? { ...x, width: w } : x) })}>
                    <VideoTile
                      video={v}
                      onChangeUrl={(url) => setCs({ videos: videos.map((x, idx) => idx === i ? { ...x, url } : x) })}
                      onChangeRatio={(r) => setCs({ videos: videos.map((x, idx) => idx === i ? { ...x, ratio: r } : x) })}
                      onChangeWidth={(w) => setCs({ videos: videos.map((x, idx) => idx === i ? { ...x, width: w } : x) })}
                      onDuplicate={() => setCs({ videos: [...videos.slice(0, i + 1), { ...v }, ...videos.slice(i + 1)] })}
                      onRemove={() => setCs({ videos: videos.filter((_, idx) => idx !== i) })}
                    />
                  </WidthBox>
                ))}
                <button onClick={() => setCs({ videos: [...videos, { url: "", ratio: "16/9" }] })}
                  style={{ ...addLinkBtn, alignSelf: "center" }}>
                  <Plus size={14} /> Add another video
                </button>
              </div>
            )}
          </div>
        </section>
      </SectionFrame>

      {/* ── SOLUTION + STACK ──────────────────────────────────────────────── */}
      <SectionFrame label="Solution" hidden={isHidden("solution")} onToggleHide={() => toggleHidden("solution")}>
        <SectionShell
          label={cs.solutionLabel ?? "Solution"}
          heading={cs.solutionHeading ?? "The system we shipped."}
          onChangeLabel={(v) => setCs({ solutionLabel: v })}
          onChangeHeading={(v) => setCs({ solutionHeading: v })}
        >
          <Editable as="div" multiline value={cs.solution ?? ""} onChange={(v) => setCs({ solution: v })} placeholder="Solution paragraph…"
            style={{ fontSize: 17, color: TEXT, lineHeight: 1.75, marginTop: 0, marginBottom: 28, fontWeight: 500 }} />
          <ExtraParagraphs items={solutionExtras} onChange={(arr) => setCs({ solutionExtras: arr })} />
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED_SOFT, marginBottom: 14, marginTop: 20 }}>Stack</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {stack.map((s, i) => (
              <span key={i} style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", padding: "8px 14px", borderRadius: 100, background: CARD, border: `1px solid ${RULE}`, color: SLATE, display: "inline-flex", gap: 8, alignItems: "center" }}>
                <Editable value={s} onChange={(v) => setCs({ stack: stack.map((x, idx) => idx === i ? v : x) })} placeholder="Tool" />
                <button onClick={() => setCs({ stack: [...stack.slice(0, i + 1), s, ...stack.slice(i + 1)] })}
                  style={{ background: "transparent", border: 0, cursor: "pointer", color: MUTED, padding: 0 }} title="Duplicate"><Copy size={11} /></button>
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
      </SectionFrame>

      {/* ── TESTIMONIAL ───────────────────────────────────────────────────── */}
      <SectionFrame label="Testimonial" hidden={isHidden("testimonial")} onToggleHide={() => toggleHidden("testimonial")}>
        <section style={{ padding: "32px 24px 64px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              style={{ background: SLATE, borderRadius: 22, padding: "56px 48px", position: "relative", overflow: "hidden", color: "#FFFFFF" }}>
              <div style={{ position: "absolute", top: 0, left: 32, right: 32, height: 2, background: "linear-gradient(90deg, #C2A878 0%, transparent 100%)", borderRadius: 1 }} />
              <Quote size={44} style={{ color: "rgba(194,168,120,0.45)", marginBottom: 18 }} />
              <Editable as="p" multiline value={cs.testimonial?.quote ?? ""}
                onChange={(v) => setCs({ testimonial: { ...(cs.testimonial ?? { author: "" }), quote: v } })} placeholder="Client testimonial quote…"
                style={{ fontSize: "clamp(20px, 2.4vw, 28px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.4, color: "#FFFFFF", margin: 0, marginBottom: 26, maxWidth: "48ch" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 24, height: 1, background: GOLD }} />
                <Editable as="p" value={cs.testimonial?.author ?? ""}
                  onChange={(v) => setCs({ testimonial: { ...(cs.testimonial ?? { quote: "" }), author: v } })} placeholder="Author · Role"
                  style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, margin: 0 }} />
              </div>
            </motion.div>
          </div>
        </section>
      </SectionFrame>

      {/* ── CTA (fixed, not editable) ─────────────────────────────────────── */}
      <section style={{ padding: "32px 24px 112px", textAlign: "center" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <h3 style={{ fontWeight: 800, fontSize: "clamp(26px, 3.6vw, 42px)", letterSpacing: "-0.035em", color: TEXT, lineHeight: 1.08, margin: 0, marginBottom: 18 }}>Want results like these?</h3>
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
        .gb-section { position: relative; }
        .gb-section .gb-section-tools { opacity: 0; transition: opacity 120ms; }
        .gb-section:hover .gb-section-tools { opacity: 1; }
        .gb-section.gb-hidden { opacity: 0.45; }
        .gb-section.gb-hidden::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: repeating-linear-gradient(45deg, rgba(148,163,184,0.06) 0 12px, transparent 12px 24px);
        }
        .gb-media-tools { opacity: 0; transition: opacity 120ms; }
        .gb-media-wrap:hover .gb-media-tools { opacity: 1; }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section frame — adds the per-section hover toolbar (Hide / Show)
// ─────────────────────────────────────────────────────────────────────────────

function SectionFrame({ label, hidden, onToggleHide, children }: {
  label: string; hidden?: boolean; onToggleHide?: () => void; children: React.ReactNode;
}) {
  return (
    <div className={`gb-section${hidden ? " gb-hidden" : ""}`}>
      <div className="gb-section-tools" style={{
        position: "absolute", top: 8, right: 16, zIndex: 30,
        display: "flex", gap: 6, alignItems: "center",
        background: SLATE, color: "#fff", padding: "4px 10px", borderRadius: 6,
        boxShadow: "0 4px 12px rgba(0,0,0,0.18)", fontSize: 11, fontWeight: 700,
      }}>
        <span style={{ letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.8 }}>{label}</span>
        {onToggleHide && (
          <button onClick={onToggleHide} title={hidden ? "Show on public page" : "Hide from public page"}
            style={{ background: "transparent", border: 0, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "2px 6px" }}>
            {hidden ? <Eye size={13} /> : <EyeOff size={13} />}
            {hidden ? "Show" : "Hide"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MediaTile — image with hover toolbar (replace / ratio / duplicate / remove)
// ─────────────────────────────────────────────────────────────────────────────

function MediaTile({ src, alt, ratio, widthPct, onUpload, onChangeRatio, onChangeWidth, onDuplicate, onRemove, placeholder }: {
  src: string; alt: string; ratio: string;
  widthPct?: number;
  onUpload: (f: File) => Promise<void> | void;
  onChangeRatio?: (r: string) => void;
  onChangeWidth?: (w: number) => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
  placeholder?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  return (
    <div className="gb-media-wrap" style={{ position: "relative", width: "100%" }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return;
          setUploading(true); try { await onUpload(f); } finally { setUploading(false); e.currentTarget.value = ""; }
        }} />
      {src ? (
        <img src={src} alt={alt} loading="eager" style={{ width: "100%", display: "block", aspectRatio: ratio, objectFit: "cover" }} />
      ) : (
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ width: "100%", aspectRatio: ratio, border: 0, background: BG_ALT, color: MUTED,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
          <ImagePlus size={18} /> {uploading ? "Uploading…" : (placeholder ?? "Click to upload")}
        </button>
      )}
      <div className="gb-media-tools" style={mediaToolbarStyle}>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} style={mediaToolBtn} title="Replace image">
          <ImagePlus size={13} /> {uploading ? "…" : "Replace"}
        </button>
        {onChangeRatio && (
          <label style={{ ...mediaToolBtn, display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" }} title="Change aspect ratio">
            <Crop size={13} />
            <select value={ratio} onChange={(e) => onChangeRatio(e.target.value)}
              style={{ background: "transparent", color: "#fff", border: 0, fontSize: 11, fontWeight: 700, cursor: "pointer", outline: "none" }}>
              {RATIOS.map(r => <option key={r.value} value={r.value} style={{ color: "#000" }}>{r.label}</option>)}
            </select>
          </label>
        )}
        {onChangeWidth && (
          <span style={{ ...mediaToolBtn, display: "inline-flex", alignItems: "center", gap: 4 }} title={`Width: ${widthPct ?? 100}%`}>
            <Maximize2 size={12} />
            <input type="range" min={20} max={100} step={1} value={widthPct ?? 100}
              onChange={(e) => onChangeWidth(parseInt(e.target.value, 10))}
              style={{ width: 70, accentColor: ACCENT, cursor: "pointer" }} />
            <span style={{ fontSize: 10, opacity: 0.85, minWidth: 26, textAlign: "right" }}>{widthPct ?? 100}%</span>
          </span>
        )}
        {onDuplicate && <button onClick={onDuplicate} style={mediaToolBtn} title="Duplicate"><Copy size={13} /></button>}
        {onRemove && <button onClick={onRemove} style={{ ...mediaToolBtn, color: "#fca5a5" }} title="Remove"><Trash2 size={13} /></button>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VideoTile — embed + URL input + per-video aspect ratio + duplicate / remove
// ─────────────────────────────────────────────────────────────────────────────

function VideoTile({ video, onChangeUrl, onChangeRatio, onChangeWidth, onDuplicate, onRemove }: {
  video: VideoItem;
  onChangeUrl: (url: string) => void;
  onChangeRatio: (r: string) => void;
  onChangeWidth?: (w: number) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const ratio = video.ratio ?? "16/9";
  const embed = video.url ? buildEmbedUrl(video.url, { autoplay: false }) : "";
  return (
    <div className="gb-media-wrap" style={{ position: "relative" }}>
      <div style={{ borderRadius: 22, overflow: "hidden", border: `1px solid ${RULE}`, background: TEXT, boxShadow: "0 20px 60px -20px rgba(15,23,42,0.25)" }}>
        <div style={{ position: "relative", aspectRatio: ratio }}>
          {embed ? (
            <iframe src={embed} title="Embedded video"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, opacity: 0.7 }}>
              Paste a video URL below to embed
            </div>
          )}
        </div>
      </div>
      <input value={video.url} onChange={(e) => onChangeUrl(e.target.value)} placeholder="Video URL (YouTube / Vimeo / Gumlet / Drive)"
        style={{ display: "block", marginTop: 12, width: "100%", maxWidth: 560, marginLeft: "auto", marginRight: "auto",
          padding: "8px 12px", border: `1px solid ${RULE}`, borderRadius: 8, fontSize: 13, color: MUTED, background: "#fff" }} />
      <div className="gb-media-tools" style={{ ...mediaToolbarStyle, top: 12 }}>
        <label style={{ ...mediaToolBtn, display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" }} title="Change aspect ratio">
          <Crop size={13} />
          <select value={ratio} onChange={(e) => onChangeRatio(e.target.value)}
            style={{ background: "transparent", color: "#fff", border: 0, fontSize: 11, fontWeight: 700, cursor: "pointer", outline: "none" }}>
            {RATIOS.map(r => <option key={r.value} value={r.value} style={{ color: "#000" }}>{r.label}</option>)}
          </select>
        </label>
        {onChangeWidth && (
          <span style={{ ...mediaToolBtn, display: "inline-flex", alignItems: "center", gap: 4 }} title={`Width: ${video.width ?? 100}%`}>
            <Maximize2 size={12} />
            <input type="range" min={20} max={100} step={1} value={video.width ?? 100}
              onChange={(e) => onChangeWidth(parseInt(e.target.value, 10))}
              style={{ width: 70, accentColor: ACCENT, cursor: "pointer" }} />
            <span style={{ fontSize: 10, opacity: 0.85, minWidth: 26, textAlign: "right" }}>{video.width ?? 100}%</span>
          </span>
        )}
        <button onClick={onDuplicate} style={mediaToolBtn} title="Duplicate"><Copy size={13} /></button>
        <button onClick={onRemove} style={{ ...mediaToolBtn, color: "#fca5a5" }} title="Remove"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

function EmptyVideoSlot({ onAdd }: { onAdd: (url: string) => void }) {
  const [url, setUrl] = useState("");
  return (
    <div style={{ background: "#F2F0EB", borderRadius: 18, padding: 36, textAlign: "center" }}>
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 12 }}>Paste a video URL to embed your first video</p>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="YouTube / Vimeo / Gumlet / Drive URL"
        style={{ width: "100%", maxWidth: 460, padding: "10px 14px", border: `1px solid ${RULE}`, borderRadius: 8, fontSize: 14 }} />
      <div style={{ marginTop: 12 }}>
        <button onClick={() => { if (url.trim()) onAdd(url.trim()); }} style={btn("primary")}><Plus size={14} /> Add video</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Extra paragraphs — adds N freeform paragraphs to a text section
// ─────────────────────────────────────────────────────────────────────────────

function ExtraParagraphs({ items, onChange, muted }: { items: string[]; onChange: (next: string[]) => void; muted?: boolean }) {
  const baseStyle: React.CSSProperties = muted
    ? { fontSize: 16, color: MUTED, lineHeight: 1.75, margin: "16px 0 0" }
    : { fontSize: 17, color: TEXT, lineHeight: 1.75, margin: "16px 0 0", fontWeight: 500 };
  return (
    <>
      {items.map((p, i) => (
        <div key={i} style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8 }}>
          <Editable as="div" multiline value={p}
            onChange={(v) => onChange(items.map((x, idx) => idx === i ? v : x))} placeholder="Additional paragraph…"
            style={{ ...baseStyle, flex: 1 }} />
          <span style={{ display: "flex", gap: 4, paddingTop: 18 }}>
            <IconBtn title="Duplicate paragraph" onClick={() => onChange([...items.slice(0, i + 1), p, ...items.slice(i + 1)])}><Copy size={13} /></IconBtn>
            <IconBtn title="Remove paragraph" danger onClick={() => onChange(items.filter((_, idx) => idx !== i))}><X size={14} /></IconBtn>
          </span>
        </div>
      ))}
      <button onClick={() => onChange([...items, ""])} style={{ ...addLinkBtn, marginTop: 14 }}>
        <Plus size={14} /> Add another paragraph
      </button>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small primitives
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

function SectionShell({ label, heading, onChangeLabel, onChangeHeading, children }: {
  label: string; heading: string;
  onChangeLabel?: (v: string) => void;
  onChangeHeading?: (v: string) => void;
  children: React.ReactNode;
}) {
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, margin: 0 };
  const headingStyle: React.CSSProperties = { fontWeight: 800, fontSize: "clamp(26px, 3.4vw, 40px)", letterSpacing: "-0.035em", lineHeight: 1.1, color: TEXT, margin: 0 };
  return (
    <section style={{ padding: "72px 24px" }}>
      <div className="two-col" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 48, alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ width: 20, height: 1, background: GOLD }} />
            {onChangeLabel
              ? <Editable as="p" value={label} onChange={onChangeLabel} placeholder="Section label…" style={labelStyle} />
              : <p style={labelStyle}>{label}</p>}
          </div>
          {onChangeHeading
            ? <Editable as="h2" multiline value={heading} onChange={onChangeHeading} placeholder="Section heading…" style={headingStyle} />
            : <h2 style={headingStyle}>{heading}</h2>}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WidthBox — wraps any element with a centered width % container and a
// Wix-style corner drag handle to resize. Used to shrink hero / gallery /
// video tiles. Width clamped 20-100. Pure CSS resize — no layout thrash.
// ─────────────────────────────────────────────────────────────────────────────

function WidthBox({ widthPct, onChange, children }: {
  widthPct: number; onChange: (w: number) => void; children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const parent = wrapRef.current?.parentElement;
    const containerW = parent?.getBoundingClientRect().width || 1000;
    const startX = e.clientX;
    const startPct = widthPct;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      // Centered box grows on both sides => 2x effective delta
      const next = Math.max(20, Math.min(100, startPct + (dx / containerW) * 100 * 2));
      onChange(Math.round(next));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = "nwse-resize";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  return (
    <div ref={wrapRef} style={{ width: `${widthPct}%`, margin: "0 auto", position: "relative" }}>
      {children}
      <div onMouseDown={startDrag} title={`Drag to resize · ${widthPct}%`}
        style={{
          position: "absolute", right: -10, bottom: -10, width: 22, height: 22,
          background: ACCENT, border: "3px solid #fff", borderRadius: 6,
          cursor: "nwse-resize", boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
          zIndex: 12, opacity: 0.95,
        }}
      />
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
      {clientName && <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", color: TEXT }}>{clientName}</span>}
      {logoUrl && (
        <button onClick={onRemove} title="Remove logo" style={{ background: "transparent", border: 0, cursor: "pointer", color: MUTED, padding: 0 }}><X size={12} /></button>
      )}
    </div>
  );
}

function ItemActions({ onDuplicate, onRemove }: { onDuplicate: () => void; onRemove: () => void }) {
  return (
    <span style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
      <IconBtn title="Duplicate" onClick={onDuplicate}><Copy size={12} /></IconBtn>
      <IconBtn title="Remove" danger onClick={onRemove}><X size={12} /></IconBtn>
    </span>
  );
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 22, height: 22, borderRadius: "50%", border: 0,
      background: danger ? "rgba(220,38,38,0.85)" : "rgba(10,10,10,0.7)", color: "#fff", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.9,
    }}>{children}</button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const mediaToolbarStyle: React.CSSProperties = {
  position: "absolute", top: 14, right: 14, zIndex: 5,
  display: "inline-flex", gap: 4, padding: 4,
  background: "rgba(10,10,10,0.85)", color: "#fff",
  borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
};
const mediaToolBtn: React.CSSProperties = {
  background: "transparent", color: "#fff", border: 0, padding: "4px 8px",
  borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 700,
  display: "inline-flex", alignItems: "center", gap: 4,
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
    return { display: "inline-flex", alignItems: "center", gap: 6, background: ACCENT, color: "#fff",
      border: 0, padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" };
  }
  return { display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", color: "#fff",
    border: `1px solid rgba(255,255,255,0.25)`, padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" };
}
