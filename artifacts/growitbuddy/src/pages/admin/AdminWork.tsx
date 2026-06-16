import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { ImageCropUploader } from "@/components/admin/ImageCropUploader";
import { ImageUrlField } from "@/components/admin/ImageUrlField";
import { Plus, Trash2, Pencil, X, Check, Image } from "lucide-react";

import { API_BASE } from "@/lib/api";

import { WORK_DEFAULTS, type WorkHeroStat as HeroStat, type ClientLogo } from "@/lib/workDefaults";
const DEFAULT_STATS = WORK_DEFAULTS.heroStats;

// ─── Logos Section ────────────────────────────────────────────────────────────

interface AddLogoFormState {
  imageUrl: string;
  altText: string;
  sortOrder: string;
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
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AddLogoFormState>({ imageUrl: "", altText: "", sortOrder: "0" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setForm({ imageUrl: "", altText: "", sortOrder: "0" });
    setError("");
    setOpen(false);
  }

  async function handleAdd() {
    if (!form.imageUrl.trim()) { setError("Paste a logo URL, or upload / pick an image first."); return; }
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("imageUrl", form.imageUrl.trim());
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

      <ImageUrlField
        value={form.imageUrl}
        onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
        placeholder="https://cdn.simpleicons.org/stripe/635BFF — or upload / pick from library"
        previewHeight={52}
      />

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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [headline, setHeadline] = useState("Proof of authority at scale.");
  const [subtext, setSubtext] = useState("Real systems. Real execution. Real outcomes.");
  const [heroStats, setHeroStats] = useState<HeroStat[]>(DEFAULT_STATS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getContent("work")
      .then((d) => {
        if (!d) return;
        if (d.headline) setHeadline(d.headline as string);
        if (d.subtext) setSubtext(d.subtext as string);
        if (d.heroStats) setHeroStats(d.heroStats as HeroStat[]);
      })
      .finally(() => setLoaded(true));
  }, [getContent]);

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent("work", { headline, subtext, heroStats });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function setStat(i: number, patch: Partial<HeroStat>) {
    setSaved(false);
    setHeroStats((p) => p.map((s, si) => si === i ? { ...s, ...patch } : s));
  }

  if (!loaded) {
    return (
      <div>
        <PageHeader title="Work / Portfolio" description="Manage the work page hero, stats, and client logos." />
        <div className="flex items-center justify-center py-24 text-[13px] text-[#0B0B0B]/40">Loading content…</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Work / Portfolio" description="Manage the work page hero, stats, and client logos." />

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

      <PageVisibilityCard slug="work" />
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
