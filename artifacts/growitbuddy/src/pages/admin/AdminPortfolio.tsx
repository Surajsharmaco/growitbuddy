import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Card } from "@/components/admin/AdminField";
import { Plus, Edit2, Trash2, X, Save, ExternalLink, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { API_BASE } from "@/lib/api";

const CATEGORIES = ["Video Editing", "Reels / Shorts", "Graphics", "Social Media Management"];

interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  youtubeUrl: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
}

interface FormState {
  title: string;
  category: string;
  youtubeUrl: string;
  description: string;
  sortOrder: number;
}

const EMPTY_FORM: FormState = {
  title: "", category: "Video Editing", youtubeUrl: "", description: "", sortOrder: 0,
};

function toEmbedUrl(url: string): string {
  let videoId = "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      videoId = u.pathname.slice(1);
    } else if (u.hostname.includes("youtube.com")) {
      if (u.pathname.includes("/shorts/")) {
        videoId = u.pathname.split("/shorts/")[1]?.split("/")[0] ?? "";
      } else {
        videoId = u.searchParams.get("v") ?? "";
      }
    }
  } catch {
    const m = url.match(/(?:v=|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
    videoId = m?.[1] ?? "";
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
}

function getThumbnail(url: string): string {
  const embed = toEmbedUrl(url);
  const m = embed.match(/embed\/([a-zA-Z0-9_-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : "";
}

// ── Item Form ──
function ItemForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: FormState;
  onSave: (data: FormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const thumb = form.youtubeUrl ? getThumbnail(form.youtubeUrl) : "";
  const embedOk = !!toEmbedUrl(form.youtubeUrl);

  function set(key: keyof FormState, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", fontSize: 14,
    border: "1.5px solid #E5E5E0", borderRadius: 8,
    outline: "none", background: "#F8F8F6", color: "#0A0A0A", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#0A0A0A", marginBottom: 6, display: "block" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* YouTube URL */}
      <div>
        <label style={labelStyle}>YouTube URL *</label>
        <input
          style={{ ...inputStyle, borderColor: form.youtubeUrl && !embedOk ? "#e53e3e" : "#E5E5E0" }}
          placeholder="https://www.youtube.com/watch?v=..."
          value={form.youtubeUrl}
          onChange={(e) => set("youtubeUrl", e.target.value)}
        />
        {form.youtubeUrl && !embedOk && (
          <p style={{ fontSize: 12, color: "#e53e3e", marginTop: 4 }}>Invalid YouTube URL</p>
        )}
        {thumb && (
          <div style={{ marginTop: 10, borderRadius: 8, overflow: "hidden", maxWidth: 280, position: "relative" }}>
            <img src={thumb} alt="preview" style={{ width: "100%", display: "block" }} />
            <div style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Play size={28} style={{ color: "#fff" }} />
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label style={labelStyle}>Title *</label>
        <input style={inputStyle} placeholder="e.g. Client Brand Reel" value={form.title} onChange={(e) => set("title", e.target.value)} />
      </div>

      {/* Category */}
      <div>
        <label style={labelStyle}>Category *</label>
        <select
          style={{ ...inputStyle, cursor: "pointer" }}
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>Description (optional)</label>
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
          placeholder="Short note about this piece of work…"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      {/* Sort Order */}
      <div>
        <label style={labelStyle}>Sort Order</label>
        <input
          type="number"
          style={inputStyle}
          value={form.sortOrder}
          onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)}
        />
        <p style={{ fontSize: 11, color: "#8A8A8A", marginTop: 4 }}>Lower numbers appear first.</p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.title || !form.category || !embedOk}
          style={{
            flex: 1, padding: "11px 0", borderRadius: 8, border: "none",
            background: saving || !form.title || !form.category || !embedOk ? "#EFEFEA" : "#1E293B",
            color: saving || !form.title || !form.category || !embedOk ? "#8A8A8A" : "#fff",
            fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Save size={14} /> {saving ? "Saving…" : "Save Item"}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "11px 18px", borderRadius: 8, border: "1.5px solid #E5E5E0",
            background: "#fff", color: "#0A0A0A", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main Admin Portfolio Page ──
export default function AdminPortfolio() {
  const { authFetch, isSuperAdmin } = useAdmin();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  async function loadItems() {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/portfolio`);
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadItems(); }, []);

  async function handleAdd(form: FormState) {
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/portfolio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, description: form.description || null }),
      });
      if (res.ok) {
        const item = await res.json();
        setItems((prev) => [item, ...prev]);
        setAdding(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(id: number, form: FormState) {
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/portfolio/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, description: form.description || null }),
      });
      if (res.ok) {
        const updated = await res.json();
        setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
        setEditId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this portfolio item?")) return;
    setDeleting(id);
    try {
      await authFetch(`${API_BASE}/admin/portfolio/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const allCategories = ["All", ...CATEGORIES];
  const filtered = activeCategory === "All" ? items : items.filter((i) => i.category === activeCategory);

  const portfolioUrl = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "") + "/portfolio-private";

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 8 }}>
          Admin → Portfolio
        </p>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 6 }}>
              Private Portfolio
            </h1>
            <p style={{ fontSize: 13, color: "#8A8A8A" }}>
              Manage portfolio items. Share the private link with clients.
            </p>
          </div>
          <button
            onClick={() => { setAdding(true); setEditId(null); }}
            style={{
              padding: "10px 18px", borderRadius: 8, border: "none",
              background: "#1E293B", color: "#fff",
              fontWeight: 700, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Plus size={15} /> Add Item
          </button>
        </div>
      </div>

      {/* Private Link */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#0A0A0A", marginBottom: 4 }}>Private Portfolio Link</p>
            <p style={{ fontSize: 13, color: "#8A8A8A", fontFamily: "monospace", wordBreak: "break-all" }}>{portfolioUrl}</p>
          </div>
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8, border: "1.5px solid #E5E5E0",
              background: "#fff", color: "#0A0A0A", fontSize: 13, fontWeight: 600,
              textDecoration: "none", flexShrink: 0,
            }}
          >
            <ExternalLink size={13} /> Open
          </a>
        </div>
        <p style={{ fontSize: 12, color: "#8A8A8A", marginTop: 12, padding: "10px 12px", background: "#F8F8F6", borderRadius: 8 }}>
          🔒 Set <code style={{ fontFamily: "monospace", background: "#EFEFEA", padding: "1px 6px", borderRadius: 4 }}>PORTFOLIO_PASSWORD</code> in your environment secrets to protect this page.
        </p>
      </Card>

      {/* Add Form */}
      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ marginTop: 24 }}>
            <Card>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h2 style={{ fontWeight: 700, fontSize: 16, color: "#0A0A0A" }}>Add Portfolio Item</h2>
                <button onClick={() => setAdding(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8A8A" }}>
                  <X size={18} />
                </button>
              </div>
              <ItemForm initial={EMPTY_FORM} onSave={handleAdd} onCancel={() => setAdding(false)} saving={saving} />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filter */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "28px 0 20px" }}>
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600,
              border: "1.5px solid",
              borderColor: activeCategory === cat ? "#1E293B" : "#E5E5E0",
              background: activeCategory === cat ? "#1E293B" : "#fff",
              color: activeCategory === cat ? "#fff" : "#0A0A0A",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {cat}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#8A8A8A", alignSelf: "center" }}>
          {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Item List */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #E5E5E0", borderTopColor: "#1E293B" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#8A8A8A", fontSize: 14 }}>
          {items.length === 0 ? 'No items yet. Click "Add Item" to get started.' : `No items in "${activeCategory}".`}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <AnimatePresence>
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {editId === item.id ? (
                  <Card>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                      <h2 style={{ fontWeight: 700, fontSize: 15, color: "#0A0A0A" }}>Edit Item</h2>
                      <button onClick={() => setEditId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8A8A" }}>
                        <X size={16} />
                      </button>
                    </div>
                    <ItemForm
                      initial={{ title: item.title, category: item.category, youtubeUrl: item.youtubeUrl, description: item.description ?? "", sortOrder: item.sortOrder }}
                      onSave={(form) => handleEdit(item.id, form)}
                      onCancel={() => setEditId(null)}
                      saving={saving}
                    />
                  </Card>
                ) : (
                  <div style={{
                    background: "#fff", border: "1.5px solid #E5E5E0", borderRadius: 12,
                    padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
                  }}>
                    {/* Thumbnail */}
                    <div style={{ width: 80, height: 52, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#EFEFEA", position: "relative" }}>
                      {getThumbnail(item.youtubeUrl) && (
                        <img src={getThumbnail(item.youtubeUrl)} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
                        <Play size={16} style={{ color: "#fff" }} />
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                          padding: "2px 8px", borderRadius: 100, background: "#EFEFEA", color: "#1E293B",
                        }}>
                          {item.category}
                        </span>
                        <span style={{ fontSize: 11, color: "#8A8A8A" }}>#{item.sortOrder}</span>
                      </div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: "#0A0A0A", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.title}
                      </p>
                      {item.description && (
                        <p style={{ fontSize: 12, color: "#8A8A8A", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => { setEditId(item.id); setAdding(false); }}
                        style={{ padding: "7px 12px", borderRadius: 7, border: "1.5px solid #E5E5E0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A0A0A" }}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleting === item.id}
                        style={{ padding: "7px 12px", borderRadius: 7, border: "1.5px solid rgba(30,41,59,0.20)", background: "rgba(30,41,59,0.06)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#1E293B" }}
                      >
                        <Trash2 size={13} /> {deleting === item.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
