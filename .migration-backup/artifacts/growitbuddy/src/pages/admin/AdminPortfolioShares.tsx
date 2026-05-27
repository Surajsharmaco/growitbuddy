import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Card } from "@/components/admin/AdminField";
import { Plus, Trash2, Copy, Check, ExternalLink, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { API_BASE } from "@/lib/api";
import { PORTFOLIO_CATEGORIES } from "@/lib/portfolioCategories";

const CATEGORIES = PORTFOLIO_CATEGORIES;

interface PortfolioItem {
  id: number;
  title: string;
  category: string;
}

interface Share {
  id: number;
  slug: string;
  title: string;
  hiddenCategories: string[];
  hiddenItemIds: number[];
  createdAt: string;
  updatedAt: string;
  // Set by the server: count of hidden item IDs that no longer exist in the
  // portfolio (because the item was deleted after the share was created).
  staleItemCount?: number;
}

interface DraftState {
  title: string;
  hiddenCategories: Set<string>;
  hiddenItemIds: Set<number>;
}

function publicUrl(slug: string): string {
  // Use the same origin the admin is on (browser will resolve cleanly in both
  // local dev and prod).
  if (typeof window === "undefined") return `/portfolio/shared/${slug}`;
  return `${window.location.origin}/portfolio/shared/${slug}`;
}

export default function AdminPortfolioShares() {
  const { authFetch } = useAdmin();
  const [shares, setShares] = useState<Share[]>([]);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<DraftState>({ title: "", hiddenCategories: new Set(), hiddenItemIds: new Set() });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [sharesRes, itemsRes] = await Promise.all([
        authFetch(`${API_BASE}/admin/portfolio/shares`).then((r) => r.json()),
        fetch(`${API_BASE}/admin/portfolio/items`).then((r) => r.json()),
      ]);
      setShares(Array.isArray(sharesRes) ? sharesRes : []);
      setItems(Array.isArray(itemsRes) ? itemsRes : []);
    } catch (err) {
      console.error("Failed to load shares", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startNew() {
    setEditingId("new");
    setDraft({ title: "", hiddenCategories: new Set(), hiddenItemIds: new Set() });
  }

  function startEdit(s: Share) {
    setEditingId(s.id);
    setDraft({
      title: s.title ?? "",
      hiddenCategories: new Set(s.hiddenCategories ?? []),
      hiddenItemIds: new Set(s.hiddenItemIds ?? []),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({ title: "", hiddenCategories: new Set(), hiddenItemIds: new Set() });
  }

  function toggleCategory(cat: string) {
    setDraft((d) => {
      const next = new Set(d.hiddenCategories);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return { ...d, hiddenCategories: next };
    });
  }

  function toggleItem(id: number) {
    setDraft((d) => {
      const next = new Set(d.hiddenItemIds);
      if (next.has(id)) next.delete(id); else next.add(id);
      return { ...d, hiddenItemIds: next };
    });
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        title: draft.title.trim(),
        hiddenCategories: Array.from(draft.hiddenCategories),
        hiddenItemIds: Array.from(draft.hiddenItemIds),
      };
      if (editingId === "new") {
        await authFetch(`${API_BASE}/admin/portfolio/shares`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (typeof editingId === "number") {
        await authFetch(`${API_BASE}/admin/portfolio/shares/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      await load();
      cancelEdit();
    } catch (err) {
      console.error("Failed to save share", err);
      alert("Failed to save share link.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this share link? Anyone with the link will lose access.")) return;
    try {
      await authFetch(`${API_BASE}/admin/portfolio/shares/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      console.error("Failed to delete share", err);
    }
  }

  async function copy(s: Share) {
    try {
      await navigator.clipboard.writeText(publicUrl(s.slug));
      setCopiedId(s.id);
      setTimeout(() => setCopiedId((c) => (c === s.id ? null : c)), 1800);
    } catch {
      // fallback
      prompt("Copy this URL:", publicUrl(s.slug));
    }
  }

  const itemsByCat = items.reduce<Record<string, PortfolioItem[]>>((acc, it) => {
    (acc[it.category] ??= []).push(it);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black tracking-tight text-[#0B0B0B]">Portfolio Share Links</h1>
          <p className="text-[14px] text-[#0B0B0B]/50 mt-1">
            Create a custom share URL where some categories or individual projects are hidden from the client view.
          </p>
        </div>
        {editingId === null && (
          <button
            onClick={startNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B0B0B] text-white text-[13px] font-bold hover:bg-[#1E293B] transition"
          >
            <Plus size={15} /> New share link
          </button>
        )}
      </div>

      <AnimatePresence>
        {editingId !== null && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="mb-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[15px] font-bold text-[#0B0B0B]">
                  {editingId === "new" ? "New share link" : "Edit share link"}
                </h2>
                <button onClick={cancelEdit} className="text-[#0B0B0B]/50 hover:text-[#0B0B0B]"><X size={16} /></button>
              </div>

              <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#0B0B0B]/55 mb-2">
                Label (private — only you see this)
              </label>
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="e.g. Acme Corp pitch — no SMM"
                className="w-full px-3 py-2 border border-[#E5E5E0] rounded-lg bg-white text-[14px] text-[#0B0B0B] mb-6 focus:outline-none focus:border-[#1E293B]"
              />

              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0B0B0B]/55 mb-3">
                  Hide entire categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const hidden = draft.hiddenCategories.has(cat);
                    const count = itemsByCat[cat]?.length ?? 0;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`text-[12px] px-3 py-1.5 rounded-full border transition font-semibold ${
                          hidden
                            ? "bg-[#0B0B0B] text-white border-[#0B0B0B]"
                            : "bg-white text-[#0B0B0B] border-[#E5E5E0] hover:border-[#0B0B0B]"
                        }`}
                      >
                        {hidden ? "✓ " : ""}{cat} <span className="opacity-50">· {count}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[12px] text-[#0B0B0B]/45 mt-2">
                  Selected categories will be completely removed from the shared view.
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0B0B0B]/55 mb-3">
                  Hide individual projects
                </p>
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                  {CATEGORIES.map((cat) => {
                    const list = itemsByCat[cat] ?? [];
                    if (list.length === 0) return null;
                    const catHidden = draft.hiddenCategories.has(cat);
                    return (
                      <div key={cat} className={catHidden ? "opacity-40 pointer-events-none" : ""}>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1E293B] mb-2">{cat}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {list.map((it) => {
                            const hidden = draft.hiddenItemIds.has(it.id);
                            return (
                              <label
                                key={it.id}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition text-[13px] ${
                                  hidden
                                    ? "bg-[#FEF3F3] border-[#FCA5A5] text-[#7F1D1D]"
                                    : "bg-white border-[#E5E5E0] text-[#0B0B0B] hover:border-[#0B0B0B]"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={hidden}
                                  onChange={() => toggleItem(it.id)}
                                  className="accent-[#0B0B0B]"
                                />
                                <span className="truncate">{it.title}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-[#E5E5E0]">
                <button onClick={cancelEdit} className="px-4 py-2 text-[13px] font-semibold text-[#0B0B0B]/70 hover:text-[#0B0B0B]">
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B0B0B] text-white text-[13px] font-bold hover:bg-[#1E293B] transition disabled:opacity-60"
                >
                  <Save size={14} /> {saving ? "Saving…" : "Save & generate link"}
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <Card><p className="text-[14px] text-[#0B0B0B]/50">Loading…</p></Card>
      ) : shares.length === 0 ? (
        <Card>
          <p className="text-[14px] text-[#0B0B0B]/60 mb-3">No share links yet.</p>
          <p className="text-[13px] text-[#0B0B0B]/45">
            Click <span className="font-semibold">"New share link"</span> above to create one. You can hide entire categories or specific projects per link.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {shares.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[260px]">
                  <h3 className="text-[15px] font-bold text-[#0B0B0B] mb-1">
                    {s.title || <span className="text-[#0B0B0B]/40">Untitled share</span>}
                  </h3>
                  <div className="text-[12px] text-[#0B0B0B]/55 mb-3 flex items-center gap-2 flex-wrap">
                    <code className="px-2 py-1 rounded bg-[#F4F4EF] text-[#1E293B] font-mono text-[11px]">
                      /portfolio/shared/{s.slug}
                    </code>
                    <span>· created {new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {(s.hiddenCategories ?? []).map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded-full bg-[#FEF3F3] text-[#7F1D1D] border border-[#FCA5A5]">
                        hidden: {c}
                      </span>
                    ))}
                    {(s.hiddenItemIds ?? []).length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FEF3F3] text-[#7F1D1D] border border-[#FCA5A5]">
                        {(s.hiddenItemIds ?? []).length} item{s.hiddenItemIds.length === 1 ? "" : "s"} hidden
                      </span>
                    )}
                    {(s.hiddenCategories ?? []).length === 0 && (s.hiddenItemIds ?? []).length === 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#86EFAC]">
                        Shows everything
                      </span>
                    )}
                    {(s.staleItemCount ?? 0) > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FFF7ED] text-[#9A3412] border border-[#FDBA74]">
                        ⚠ {s.staleItemCount} hidden item{s.staleItemCount === 1 ? "" : "s"} deleted — edit to clean up
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copy(s)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#0B0B0B] text-white text-[12px] font-bold hover:bg-[#1E293B]"
                    title="Copy public link"
                  >
                    {copiedId === s.id ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy link</>}
                  </button>
                  <a
                    href={publicUrl(s.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#E5E5E0] text-[#0B0B0B] text-[12px] font-semibold hover:border-[#0B0B0B]"
                    title="Open in new tab"
                  >
                    <ExternalLink size={13} /> Open
                  </a>
                  <button
                    onClick={() => startEdit(s)}
                    className="px-3 py-2 rounded-full border border-[#E5E5E0] text-[#0B0B0B] text-[12px] font-semibold hover:border-[#0B0B0B]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(s.id)}
                    className="p-2 rounded-full border border-[#E5E5E0] text-[#7F1D1D] hover:bg-[#FEF3F3] hover:border-[#FCA5A5]"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
