import { useEffect, useRef, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { ImageCropUploader } from "@/components/admin/ImageCropUploader";
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil, X, Check, Upload, Image, GripVertical } from "lucide-react";

import { API_BASE } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkStat {
  label: string;
  value: string;
}

interface WorkItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  metric: string;
  metricLabel: string;
  description: string;
  tags: string[];
  stats: WorkStat[];
  imageUrl: string;
}

interface HeroStat {
  eyebrow: string;
  value: string;
  valueLabel: string;
  headline: string;
  description: string;
}

interface ClientLogo {
  id: number;
  imageUrl: string;
  altText: string;
  sortOrder: number;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_WORK: WorkItem[] = [
  { id: "1", title: "Tech Founder to Industry Voice", subtitle: "LinkedIn Authority Campaign", category: "B2B SaaS · LinkedIn", metric: "14M", metricLabel: "impressions", description: "A full content marketing system took this founder from zero online presence to the most-cited authority in their SaaS niche - in 6 months.", tags: ["LinkedIn", "B2B SaaS"], stats: [], imageUrl: "" },
  { id: "2", title: "Agency Owner Authority Engine", subtitle: "Multi-channel content strategy", category: "Services · Multi-channel", metric: "$2.4M", metricLabel: "inbound pipeline", description: "A systematic content strategy and distribution system drove inbound pipeline that exceeded prior annual revenue.", tags: ["Content Strategy"], stats: [], imageUrl: "" },
  { id: "3", title: "Creator Monetization System", subtitle: "YouTube authority build", category: "Creator Economy · YouTube", metric: "250K", metricLabel: "subscribers", description: "A content strategy built around a proprietary framework compounded into 250K subscribers and $40K/mo in revenue.", tags: ["YouTube", "Creator"], stats: [], imageUrl: "" },
  { id: "4", title: "Executive Personal Brand", subtitle: "Podcast & PR strategy", category: "Leadership · Podcast & PR", metric: "15+", metricLabel: "speaking invites / qtr", description: "Personal branding strategy turned a quiet operator into a recognized industry thought leader with consistent media placement.", tags: ["Personal Brand", "PR"], stats: [], imageUrl: "" },
  { id: "5", title: "E-commerce Founder Growth", subtitle: "X / Twitter brand build", category: "E-commerce · X / Twitter", metric: "400%", metricLabel: "branded search growth", description: "A personal brand-first content marketing approach made this founder synonymous with their product category.", tags: ["X / Twitter", "E-commerce"], stats: [], imageUrl: "" },
  { id: "6", title: "VC Authority Engine", subtitle: "LinkedIn positioning", category: "Finance · LinkedIn", metric: "3x", metricLabel: "deal flow growth", description: "Content strategy and personal branding positioned this venture firm as the category expert - attracting better deals at higher velocity.", tags: ["Finance", "LinkedIn"], stats: [], imageUrl: "" },
];

const DEFAULT_STATS: HeroStat[] = [
  { eyebrow: "Multi-Channel · Content Networks", value: "700M+", valueLabel: "views generated", headline: "Built large-scale visibility across content ecosystems", description: "Distributed content across platforms and campaigns to generate massive reach." },
  { eyebrow: "Services · Authority System", value: "200+", valueLabel: "founders & brands", headline: "Built authority systems for founders and growing brands", description: "Positioned creators and businesses into recognized voices in their niche." },
  { eyebrow: "Content Engine · High Volume", value: "90K+", valueLabel: "content assets", headline: "Executed high-volume content production at scale", description: "Consistent output across short-form, long-form, and platform-native formats." },
];

// ─── Work Case Study Row ──────────────────────────────────────────────────────

function WorkRow({
  item, index, onChange, onDelete,
}: {
  item: WorkItem;
  index: number;
  onChange: (i: number, val: WorkItem) => void;
  onDelete: (i: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<WorkItem>) => onChange(index, { ...item, ...patch });

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center gap-2 pr-3 hover:bg-[#0B0B0B]/3 transition-colors">
        <button
          onClick={() => setOpen((p) => !p)}
          className="flex-1 flex items-center gap-3 px-5 py-3.5 text-left min-w-0"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#0B0B0B]/50 bg-[#0B0B0B]/6 px-2 py-0.5 rounded-full shrink-0">{item.category}</span>
              <p className="text-[13px] font-semibold text-[#0B0B0B] truncate">{item.title || "Untitled Case Study"}</p>
            </div>
            <p className="text-[11px] text-[#0B0B0B]/40 mt-0.5">{item.subtitle}</p>
          </div>
          {open ? <ChevronUp size={14} className="text-[#0B0B0B]/40 shrink-0" /> : <ChevronDown size={14} className="text-[#0B0B0B]/40 shrink-0" />}
        </button>
        <button
          onClick={() => onDelete(index)}
          className="p-1.5 rounded hover:bg-red-50 hover:text-red-500 text-[#0B0B0B]/30 transition-colors shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {open && (
        <div className="border-t border-[#0B0B0B]/8 px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Title" value={item.title} onChange={(e) => set({ title: e.target.value })} />
            <Input label="Subtitle" value={item.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
            <Input label="Category" value={item.category} onChange={(e) => set({ category: e.target.value })} placeholder="Founder Brand" />
            <div className="col-span-2">
              <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-2 uppercase tracking-wider">Case Study Image</label>
              <ImageCropUploader value={item.imageUrl} onChange={(url) => set({ imageUrl: url })} />
            </div>
            <Input label="Key Metric" value={item.metric} onChange={(e) => set({ metric: e.target.value })} placeholder="10x" />
            <Input label="Metric Label" value={item.metricLabel} onChange={(e) => set({ metricLabel: e.target.value })} placeholder="inbound leads in 90 days" />
          </div>
          <Textarea
            label="One-liner outcome (shown as → result line on card)"
            value={item.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={2}
          />
          <Input
            label="Tags (comma-separated)"
            value={item.tags.join(", ")}
            onChange={(e) => set({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
            placeholder="LinkedIn, B2B SaaS, Content Strategy"
          />
          <div>
            <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-2 uppercase tracking-wider">Stats (up to 3)</label>
            <div className="space-y-2">
              {(item.stats.length > 0 ? item.stats : [{ label: "", value: "" }]).map((stat, si) => (
                <div key={si} className="flex gap-2 items-center">
                  <Input value={stat.label} onChange={(e) => { const u = [...item.stats]; u[si] = { ...stat, label: e.target.value }; set({ stats: u }); }} placeholder="Stat label" />
                  <Input value={stat.value} onChange={(e) => { const u = [...item.stats]; u[si] = { ...stat, value: e.target.value }; set({ stats: u }); }} placeholder="+420%" />
                  <button onClick={() => set({ stats: item.stats.filter((_, sIdx) => sIdx !== si) })} className="p-1.5 text-[#0B0B0B]/25 hover:text-red-500 shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {item.stats.length < 3 && (
                <button onClick={() => set({ stats: [...item.stats, { label: "", value: "" }] })} className="text-[12px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] flex items-center gap-1">
                  <Plus size={12} /> Add stat
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Logos Section ────────────────────────────────────────────────────────────

interface AddLogoFormState {
  imageUrl: string;
  altText: string;
  sortOrder: string;
  file: File | null;
  mode: "url" | "file";
}

function LogoCard({
  logo,
  onDelete,
  onSave,
}: {
  logo: ClientLogo;
  onDelete: (id: number) => void;
  onSave: (id: number, data: { altText: string; sortOrder: number; imageUrl?: string }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [altText, setAltText] = useState(logo.altText);
  const [sortOrder, setSortOrder] = useState(String(logo.sortOrder));
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(logo.id, { altText, sortOrder: parseInt(sortOrder) || 0 });
    setSaving(false);
    setEditing(false);
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: editing ? "1.5px solid #C2A878" : "1px solid #E5E5E0",
        borderRadius: 12,
        overflow: "hidden",
        transition: "border-color 0.15s",
      }}
    >
      {/* Logo preview */}
      <div
        style={{
          background: "#F8F8F6",
          height: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px 16px",
          position: "relative",
        }}
      >
        {!imgError ? (
          <img
            src={logo.imageUrl}
            alt={logo.altText || "Logo"}
            onError={() => setImgError(true)}
            style={{ maxWidth: "100%", maxHeight: 44, objectFit: "contain" }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <Image size={18} style={{ color: "#C2A878" }} />
            <span style={{ fontSize: 10, color: "#8A8A8A" }}>No preview</span>
          </div>
        )}
        <span
          style={{
            position: "absolute",
            top: 6,
            left: 8,
            fontSize: 9,
            fontWeight: 700,
            color: "#8A8A8A",
            background: "#EFEFEA",
            borderRadius: 4,
            padding: "1px 5px",
            letterSpacing: "0.05em",
          }}
        >
          #{logo.sortOrder}
        </span>
      </div>

      {/* Footer row */}
      <div style={{ padding: "8px 10px", borderTop: "1px solid #EFEFEA" }}>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Brand name / alt text"
              style={{ fontSize: 12, padding: "5px 8px", border: "1px solid #E5E5E0", borderRadius: 6, outline: "none", width: "100%", color: "#0A0A0A" }}
            />
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="Sort order"
              style={{ fontSize: 12, padding: "5px 8px", border: "1px solid #E5E5E0", borderRadius: 6, outline: "none", width: "100%", color: "#0A0A0A" }}
            />
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(false)} style={{ fontSize: 11, color: "#8A8A8A", padding: "3px 8px", borderRadius: 5, border: "1px solid #E5E5E0", background: "#fff", cursor: "pointer" }}>
                <X size={12} />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ fontSize: 11, color: "#fff", padding: "3px 10px", borderRadius: 5, border: "none", background: "#1E293B", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                {saving ? "…" : <><Check size={11} /> Save</>}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#5F5F5F", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={logo.altText}>
              {logo.altText || <span style={{ color: "#AAAAAA", fontStyle: "italic" }}>No label</span>}
            </span>
            <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
              <button
                onClick={() => setEditing(true)}
                style={{ padding: "3px 5px", borderRadius: 5, border: "none", background: "transparent", cursor: "pointer", color: "#8A8A8A" }}
                title="Edit"
              >
                <Pencil size={11} />
              </button>
              <button
                onClick={() => { if (confirm(`Remove "${logo.altText || "this logo"}"?`)) onDelete(logo.id); }}
                style={{ padding: "3px 5px", borderRadius: 5, border: "none", background: "transparent", cursor: "pointer", color: "#8A8A8A" }}
                title="Delete"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddLogoPanel({ onAdd }: { onAdd: (logo: ClientLogo) => void }) {
  const { authFetch } = useAdmin();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AddLogoFormState>({ imageUrl: "", altText: "", sortOrder: "0", file: null, mode: "url" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setForm({ imageUrl: "", altText: "", sortOrder: "0", file: null, mode: "url" });
    setError("");
    setOpen(false);
  }

  async function handleAdd() {
    if (form.mode === "url" && !form.imageUrl.trim()) { setError("Paste a logo URL first."); return; }
    if (form.mode === "file" && !form.file) { setError("Pick an image file first."); return; }
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      if (form.mode === "file" && form.file) {
        fd.append("image", form.file);
      } else {
        fd.append("imageUrl", form.imageUrl.trim());
      }
      fd.append("altText", form.altText.trim());
      fd.append("sortOrder", form.sortOrder || "0");
      const res = await authFetch(`${API_BASE}/admin/logos`, { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error((d as { error?: string }).error || "Upload failed"); }
      const created = await res.json() as ClientLogo;
      onAdd(created);
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add logo");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          background: "#FFFFFF",
          border: "1.5px dashed #C2A878",
          borderRadius: 12,
          height: 120,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          cursor: "pointer",
          color: "#C2A878",
          width: "100%",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFFDF7"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; }}
      >
        <Plus size={20} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Add Logo</span>
      </button>
    );
  }

  return (
    <div style={{ background: "#FFFFFF", border: "1.5px solid #C2A878", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0A0A0A", letterSpacing: "0.05em", textTransform: "uppercase" }}>New Logo</span>
        <button onClick={reset} style={{ padding: 2, border: "none", background: "transparent", cursor: "pointer", color: "#8A8A8A" }}><X size={14} /></button>
      </div>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 0, borderRadius: 7, overflow: "hidden", border: "1px solid #E5E5E0" }}>
        {(["url", "file"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setForm((f) => ({ ...f, mode: m, file: null, imageUrl: "" }))}
            style={{
              flex: 1, fontSize: 11, fontWeight: 600, padding: "6px 0",
              background: form.mode === m ? "#1E293B" : "#FAFAF8",
              color: form.mode === m ? "#FFFFFF" : "#5F5F5F",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            {m === "url" ? <><Image size={11} /> URL</> : <><Upload size={11} /> Upload</>}
          </button>
        ))}
      </div>

      {form.mode === "url" ? (
        <input
          value={form.imageUrl}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
          placeholder="https://cdn.simpleicons.org/stripe/635BFF or any image URL"
          style={{ fontSize: 12, padding: "7px 10px", border: "1px solid #E5E5E0", borderRadius: 7, outline: "none", color: "#0A0A0A", width: "100%" }}
        />
      ) : (
        <div>
          <input ref={fileRef} type="file" accept="image/*,image/svg+xml" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setForm((prev) => ({ ...prev, file: f })); }} />
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width: "100%", fontSize: 12, padding: "7px 10px", border: "1px solid #E5E5E0", borderRadius: 7,
              background: "#FAFAF8", cursor: "pointer", color: form.file ? "#0A0A0A" : "#8A8A8A",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Upload size={13} style={{ color: "#C2A878" }} />
            {form.file ? form.file.name : "Choose image or SVG…"}
          </button>
        </div>
      )}

      {/* Preview of URL */}
      {form.mode === "url" && form.imageUrl.trim() && (
        <div style={{ background: "#F8F8F6", borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 52 }}>
          <img src={form.imageUrl.trim()} alt="preview" style={{ maxHeight: 36, maxWidth: "100%", objectFit: "contain" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}

      <input
        value={form.altText}
        onChange={(e) => setForm((f) => ({ ...f, altText: e.target.value }))}
        placeholder="Brand / company name (alt text)"
        style={{ fontSize: 12, padding: "7px 10px", border: "1px solid #E5E5E0", borderRadius: 7, outline: "none", color: "#0A0A0A", width: "100%" }}
      />
      <input
        type="number"
        value={form.sortOrder}
        onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
        placeholder="Sort order (lower = first)"
        style={{ fontSize: 12, padding: "7px 10px", border: "1px solid #E5E5E0", borderRadius: 7, outline: "none", color: "#0A0A0A", width: "100%" }}
      />

      {error && <p style={{ fontSize: 11, color: "#DC2626", margin: 0 }}>{error}</p>}

      <button
        onClick={handleAdd}
        disabled={saving}
        style={{
          fontSize: 12, fontWeight: 700, padding: "8px 0", borderRadius: 8,
          background: saving ? "#8A8A8A" : "#8B3A1A",
          color: "#FFFFFF", border: "none", cursor: saving ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}
      >
        {saving ? "Adding…" : <><Check size={13} /> Add Logo</>}
      </button>
    </div>
  );
}

function LogosSection() {
  const { authFetch } = useAdmin();
  const [logos, setLogos] = useState<ClientLogo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`${API_BASE}/admin/logos`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setLogos(d as ClientLogo[]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authFetch]);

  async function handleDelete(id: number) {
    await authFetch(`${API_BASE}/admin/logos/${id}`, { method: "DELETE" });
    setLogos((p) => p.filter((l) => l.id !== id));
  }

  async function handleSave(id: number, data: { altText: string; sortOrder: number }) {
    const fd = new FormData();
    fd.append("altText", data.altText);
    fd.append("sortOrder", String(data.sortOrder));
    const res = await authFetch(`${API_BASE}/admin/logos/${id}`, { method: "PUT", body: fd });
    if (res.ok) {
      const updated = await res.json() as ClientLogo;
      setLogos((p) => p.map((l) => l.id === id ? updated : l));
    }
  }

  return (
    <Card className="mb-5">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <SectionTitle>Client Logos</SectionTitle>
        <span style={{ fontSize: 11, color: "#8A8A8A" }}>{logos.length} logo{logos.length !== 1 ? "s" : ""}</span>
      </div>
      <p className="text-[12px] text-[#0B0B0B]/40 mb-4">
        Logos shown in the "Our Clients" grid on the Work page. Add by URL (e.g. Simple Icons CDN) or upload a file.
      </p>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 120, background: "#F0F0EC", borderRadius: 12, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
          {logos
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
            .map((logo) => (
              <LogoCard
                key={logo.id}
                logo={logo}
                onDelete={handleDelete}
                onSave={handleSave}
              />
            ))}
          <AddLogoPanel onAdd={(logo) => setLogos((p) => [...p, logo])} />
        </div>
      )}

      <p style={{ fontSize: 10, color: "#8A8A8A", marginTop: 12, lineHeight: 1.5 }}>
        <strong>Tip:</strong> Use Simple Icons for branded SVG logos with colour - e.g.{" "}
        <code style={{ background: "#F0F0EC", padding: "1px 4px", borderRadius: 3, fontSize: 10 }}>
          https://cdn.simpleicons.org/stripe/635BFF
        </code>
      </p>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminWork() {
  const { getContent, saveContent } = useAdmin();
  const [items, setItems] = useState<WorkItem[]>(DEFAULT_WORK);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [headline, setHeadline] = useState("Proof of authority at scale.");
  const [subtext, setSubtext] = useState("Real systems. Real execution. Real outcomes.");
  const [heroStats, setHeroStats] = useState<HeroStat[]>(DEFAULT_STATS);

  useEffect(() => {
    getContent("work").then((d) => {
      if (!d) return;
      if (d.items) setItems(d.items as WorkItem[]);
      if (d.headline) setHeadline(d.headline as string);
      if (d.subtext) setSubtext(d.subtext as string);
      if (d.heroStats) setHeroStats(d.heroStats as HeroStat[]);
    });
  }, [getContent]);

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent("work", { headline, subtext, heroStats, items });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function setStat(i: number, patch: Partial<HeroStat>) {
    setSaved(false);
    setHeroStats((p) => p.map((s, si) => si === i ? { ...s, ...patch } : s));
  }

  return (
    <div>
      <PageHeader title="Work / Portfolio" description="Manage the work page hero, stats, client logos, and case studies." />

      <Card className="mb-5">
        <SectionTitle>Hero Copy</SectionTitle>
        <div className="space-y-3">
          <Input label="Headline" value={headline} onChange={(e) => { setHeadline(e.target.value); setSaved(false); }} />
          <Textarea label="Subtext" value={subtext} onChange={(e) => { setSubtext(e.target.value); setSaved(false); }} rows={2} />
        </div>
      </Card>

      <Card className="mb-5">
        <SectionTitle>Stats Strip</SectionTitle>
        <p className="text-[12px] text-[#0B0B0B]/40 mb-3">Three numbers shown below the hero headline.</p>
        <div className="space-y-5">
          {heroStats.map((stat, i) => (
            <div key={i} className="p-4 rounded-xl border border-[#E5E5E0] bg-[#FAFAF8] space-y-3">
              <Input label="Eyebrow" value={stat.eyebrow ?? ""} onChange={(e) => setStat(i, { eyebrow: e.target.value })} placeholder="Multi-Channel · Content Networks" />
              <div className="flex gap-3">
                <Input label="Number" value={stat.value} onChange={(e) => setStat(i, { value: e.target.value })} placeholder="700M+" />
                <Input label="Number Label" value={stat.valueLabel ?? ""} onChange={(e) => setStat(i, { valueLabel: e.target.value })} placeholder="views generated" />
              </div>
              <Input label="Headline" value={stat.headline ?? ""} onChange={(e) => setStat(i, { headline: e.target.value })} placeholder="Built large-scale visibility…" />
              <Textarea label="Description" value={stat.description ?? ""} onChange={(e) => { setStat(i, { description: e.target.value }); }} rows={2} placeholder="One-liner description…" />
            </div>
          ))}
        </div>
      </Card>

      {/* ── Client Logos Manager ── */}
      <LogosSection />

      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setSaved(false); setItems((p) => [...p, { id: Date.now().toString(), title: "", subtitle: "", category: "", metric: "", metricLabel: "", description: "", tags: [], stats: [], imageUrl: "" }]); }}
          className="flex items-center gap-2 bg-[#0B0B0B] text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0B0B0B]/85 transition-colors"
        >
          <Plus size={15} /> Add Case Study
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <WorkRow
            key={item.id + i}
            item={item}
            index={i}
            onChange={(idx, val) => { setSaved(false); setItems((p) => p.map((x, xi) => xi === idx ? val : x)); }}
            onDelete={(idx) => { if (!confirm("Remove?")) return; setSaved(false); setItems((p) => p.filter((_, xi) => xi !== idx)); }}
          />
        ))}
      </div>

      <PageVisibilityCard slug="work" />
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
