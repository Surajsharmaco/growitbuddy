// Page Variants admin — list, create, edit, delete variants of any source page.
// Each variant has its own URL and its own per-section content (edited via the
// existing admin form for that page, with ?variant=<slug> appended).
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useAdmin } from "@/context/AdminContext";
import { API_BASE } from "@/lib/api";
import { VARIANT_SOURCES, findVariantSource, slugify, type VariantSource } from "@/lib/variantSources";
import { Copy as CopyIcon, ExternalLink, Trash2, Edit3, Plus, Eye, EyeOff } from "lucide-react";

interface VariantRow {
  id: number;
  sourceKey: string;
  slug: string;
  label: string;
  isLive: boolean;
  createdAt: string;
  updatedAt: string;
}

const SITE_BASE = (typeof window !== "undefined" ? window.location.origin : "") || "";

export default function AdminPageVariants() {
  const { authFetch } = useAdmin();
  const [rows, setRows] = useState<VariantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // New variant form state
  const [newSourceKey, setNewSourceKey] = useState<string>(VARIANT_SOURCES[0]?.key ?? "");
  const [newLabel, setNewLabel] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newIsLive, setNewIsLive] = useState(false);
  const [newCopyFromBase, setNewCopyFromBase] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true); setError(null);
    try {
      const r = await authFetch(`${API_BASE}/admin/variants`);
      if (!r.ok) throw new Error(`Load failed (${r.status})`);
      setRows(await r.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load variants.");
    } finally { setLoading(false); }
  }

  // Tell the sidebar (AdminLayout) to refresh its "Published Variants" group
  // immediately after any create/update/delete. localStorage fires `storage`
  // in other tabs; the custom event handles the SAME tab where this admin
  // form lives (storage doesn't dispatch within the originating tab).
  function broadcastVariantsChanged() {
    try { localStorage.setItem("gb-variants-updated", String(Date.now())); } catch { /* no-op */ }
    try { window.dispatchEvent(new CustomEvent("gb-variants-updated")); } catch { /* no-op */ }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const existingSlugs = useMemo(() => new Set(rows.map((r) => r.slug)), [rows]);

  function suggestSlug(sourceKey: string, label: string): string {
    const baseFromLabel = label ? slugify(label) : "";
    const baseFromKey = slugify(sourceKey + "-copy");
    let candidate = baseFromLabel || baseFromKey;
    if (!candidate) candidate = "page-copy";
    if (!existingSlugs.has(candidate)) return candidate;
    for (let i = 2; i < 999; i++) {
      const next = `${candidate}-${i}`;
      if (!existingSlugs.has(next)) return next;
    }
    return candidate;
  }

  function openCreate() {
    setCreating(true);
    setCreateError(null);
    setNewSourceKey(VARIANT_SOURCES[0]?.key ?? "");
    setNewLabel("");
    setNewSlug(suggestSlug(VARIANT_SOURCES[0]?.key ?? "", ""));
    setNewIsLive(false);
    setNewCopyFromBase(true);
  }

  async function submitCreate() {
    setCreateError(null);
    const slug = slugify(newSlug);
    if (!slug) { setCreateError("URL slug is required."); return; }
    if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug)) { setCreateError("Slug must be lowercase letters/digits/dashes only."); return; }
    if (existingSlugs.has(slug)) { setCreateError(`Slug "${slug}" is already taken.`); return; }
    setSaving(true);
    try {
      const r = await authFetch(`${API_BASE}/admin/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceKey: newSourceKey,
          slug,
          label: newLabel,
          isLive: newIsLive,
          copyFromBase: newCopyFromBase,
        }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Create failed (${r.status})`);
      }
      setCreating(false);
      await load();
      broadcastVariantsChanged();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Create failed.");
    } finally { setSaving(false); }
  }

  async function updateRow(id: number, patch: Partial<Pick<VariantRow, "slug" | "label" | "isLive">>) {
    const r = await authFetch(`${API_BASE}/admin/variants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `Save failed (${r.status})`);
    }
    await load();
    broadcastVariantsChanged();
  }

  async function deleteRow(id: number, slug: string) {
    if (!confirm(`Delete variant "/${slug}"? This removes the page AND its custom content. The original page is unaffected.`)) return;
    const r = await authFetch(`${API_BASE}/admin/variants/${id}`, { method: "DELETE" });
    if (!r.ok) {
      alert("Delete failed.");
      return;
    }
    await load();
    broadcastVariantsChanged();
  }

  function duplicateVariant(v: VariantRow) {
    const src = findVariantSource(v.sourceKey);
    setCreating(true);
    setCreateError(null);
    setNewSourceKey(v.sourceKey);
    setNewLabel(v.label ? `${v.label} (Copy)` : `${src?.label ?? v.sourceKey} (Copy)`);
    setNewSlug(suggestSlug(v.sourceKey, v.slug + "-copy"));
    setNewIsLive(false);
    setNewCopyFromBase(true);
  }

  // Group by source for tidy display.
  const grouped = useMemo(() => {
    const map = new Map<string, VariantRow[]>();
    for (const r of rows) {
      const list = map.get(r.sourceKey) ?? [];
      list.push(r);
      map.set(r.sourceKey, list);
    }
    return map;
  }, [rows]);

  return (
    <div className="space-y-6" style={{ fontFamily: "Inter, sans-serif", color: "#0A0A0A" }}>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Page Variants</h1>
          <p className="text-[13px] text-black/55 mt-1 max-w-2xl">
            Duplicate any page (Home, About, Services, Talent Pools, Blog, etc.) at a new URL with its own per-section content.
            Same design, different content. Edit each variant just like you edit the original — open the variant, click Edit Content,
            and the existing admin form lets you change every section.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold"
          style={{ background: "#0A0A0A", color: "#F8F8F6" }}
        >
          <Plus size={14} /> New variant
        </button>
      </header>

      {creating && (
        <div className="rounded-xl border p-4 space-y-3" style={{ background: "#F8F8F6", borderColor: "#E5E5E0" }}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[14px]">Create a new variant</h3>
            <button type="button" onClick={() => setCreating(false)} className="text-[12px] text-black/50 hover:text-black underline">Cancel</button>
          </div>

          <label className="block">
            <span className="block text-[11px] font-semibold text-black/60 uppercase tracking-wider mb-1">Source page</span>
            <select
              value={newSourceKey}
              onChange={(e) => {
                const k = e.target.value;
                setNewSourceKey(k);
                if (!newSlug) setNewSlug(suggestSlug(k, newLabel));
              }}
              className="w-full px-3 py-2 rounded-lg border text-[13px] bg-white"
              style={{ borderColor: "#E5E5E0" }}
            >
              {VARIANT_SOURCES.map((s) => (
                <option key={s.key} value={s.key}>{s.label} (original: {s.basePath})</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[11px] font-semibold text-black/60 uppercase tracking-wider mb-1">Label (internal name)</span>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Home for Students, About — Diwali Campaign"
              className="w-full px-3 py-2 rounded-lg border text-[13px] bg-white"
              style={{ borderColor: "#E5E5E0" }}
            />
          </label>

          <label className="block">
            <span className="block text-[11px] font-semibold text-black/60 uppercase tracking-wider mb-1">URL slug</span>
            <div className="flex items-stretch rounded-lg border overflow-hidden bg-white" style={{ borderColor: "#E5E5E0" }}>
              <span className="px-3 py-2 text-[12px] text-black/45 bg-black/[0.03] border-r" style={{ borderColor: "#E5E5E0" }}>{SITE_BASE}/</span>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(slugify(e.target.value))}
                placeholder="home-students"
                className="flex-1 px-3 py-2 text-[13px] outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setNewSlug(suggestSlug(newSourceKey, newLabel))}
                className="px-3 text-[11px] font-semibold text-black/55 hover:text-black border-l"
                style={{ borderColor: "#E5E5E0" }}
              >
                Suggest
              </button>
            </div>
            {newSlug && existingSlugs.has(newSlug) && (
              <p className="mt-1 text-[11px] text-red-600">⚠ Slug "{newSlug}" already exists.</p>
            )}
          </label>

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-[12px]">
              <input type="checkbox" checked={newCopyFromBase} onChange={(e) => setNewCopyFromBase(e.target.checked)} />
              <span>Start with a copy of the original page's content (recommended)</span>
            </label>
            <label className="inline-flex items-center gap-2 text-[12px]">
              <input type="checkbox" checked={newIsLive} onChange={(e) => setNewIsLive(e.target.checked)} />
              <span>Publish immediately (otherwise hidden — only you can preview)</span>
            </label>
          </div>

          {createError && <p className="text-[12px] text-red-600">{createError}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={saving}
              onClick={submitCreate}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold disabled:opacity-60"
              style={{ background: "#C2A878", color: "#0A0A0A" }}
            >
              {saving ? "Creating…" : "Create variant"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-[13px] text-red-600">{error}</p>}
      {loading ? (
        <p className="text-[13px] text-black/45">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-[13px] text-black/50" style={{ borderColor: "#E5E5E0", background: "#F8F8F6" }}>
          No variants yet. Click <strong>New variant</strong> above to clone any page.
        </div>
      ) : (
        <div className="space-y-5">
          {VARIANT_SOURCES.map((src) => {
            const list = grouped.get(src.key);
            if (!list || list.length === 0) return null;
            return (
              <section key={src.key} className="space-y-2">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-black/45">
                  {src.label} — original at <code>{src.basePath}</code> · {list.length} {list.length === 1 ? "variant" : "variants"}
                </h2>
                <div className="space-y-2">
                  {list.map((v) => (
                    <VariantCard
                      key={v.id}
                      row={v}
                      source={src}
                      existingSlugs={existingSlugs}
                      onUpdate={updateRow}
                      onDelete={deleteRow}
                      onDuplicate={duplicateVariant}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Single variant row ──
function VariantCard({
  row, source, existingSlugs, onUpdate, onDelete, onDuplicate,
}: {
  row: VariantRow;
  source: VariantSource;
  existingSlugs: Set<string>;
  onUpdate: (id: number, patch: Partial<Pick<VariantRow, "slug" | "label" | "isLive">>) => Promise<void>;
  onDelete: (id: number, slug: string) => Promise<void>;
  onDuplicate: (v: VariantRow) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftSlug, setDraftSlug] = useState(row.slug);
  const [draftLabel, setDraftLabel] = useState(row.label);
  const [savingPatch, setSavingPatch] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const publicUrl = `${SITE_BASE}/${row.slug}`;
  const editContentUrl = `${source.adminPath}?variant=${encodeURIComponent(row.slug)}`;

  async function toggleLive() {
    setRowError(null);
    try { await onUpdate(row.id, { isLive: !row.isLive }); }
    catch (err) { setRowError(err instanceof Error ? err.message : "Failed to toggle."); }
  }

  async function saveEdit() {
    setRowError(null);
    const slug = slugify(draftSlug);
    if (!slug) { setRowError("Slug required."); return; }
    if (slug !== row.slug && existingSlugs.has(slug)) { setRowError(`Slug "${slug}" already taken.`); return; }
    setSavingPatch(true);
    try {
      await onUpdate(row.id, { slug, label: draftLabel });
      setEditing(false);
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Save failed.");
    } finally { setSavingPatch(false); }
  }

  function copyLink() {
    navigator.clipboard?.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }

  return (
    <div className="rounded-lg border p-3 bg-white" style={{ borderColor: "#E5E5E0" }}>
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[13px]">{row.label || <em className="text-black/45">(no label)</em>}</span>
            <code className="text-[11px] text-black/55 bg-black/[0.04] px-1.5 py-0.5 rounded">/{row.slug}</code>
            {row.isLive ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: "#DCFCE7", color: "#166534" }}>Live</span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: "#F1F1EE", color: "#52525B" }}>Hidden</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Link href={editContentUrl} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[12px] font-semibold" style={{ background: "#0A0A0A", color: "#F8F8F6" }}>
            <Edit3 size={12} /> Edit content
          </Link>
          <button type="button" onClick={toggleLive} title={row.isLive ? "Make hidden" : "Make live"} className="p-1.5 rounded hover:bg-black/5">
            {row.isLive ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button type="button" onClick={() => onDuplicate(row)} title="Duplicate this variant" className="p-1.5 rounded hover:bg-black/5">
            <CopyIcon size={14} />
          </button>
          <button type="button" onClick={() => setEditing((e) => !e)} title="Rename / change slug" className="p-1.5 rounded hover:bg-black/5">
            <Edit3 size={14} />
          </button>
          <button type="button" onClick={() => onDelete(row.id, row.slug)} title="Delete variant" className="p-1.5 rounded hover:bg-red-50 text-red-600">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3 text-[11px] text-black/55 flex-wrap">
        <button type="button" onClick={copyLink} className="inline-flex items-center gap-1 hover:text-black">
          <CopyIcon size={11} /> {copied ? "Copied!" : "Copy URL"}
        </button>
        <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-black">
          <ExternalLink size={11} /> Open public page
        </a>
        <span className="text-black/35">·</span>
        <span className="font-mono">{publicUrl}</span>
      </div>

      {editing && (
        <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: "#E5E5E0" }}>
          <label className="block">
            <span className="block text-[10px] font-semibold text-black/55 uppercase tracking-wider mb-1">Label</span>
            <input type="text" value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)} className="w-full px-2.5 py-1.5 rounded border text-[12px]" style={{ borderColor: "#E5E5E0" }} />
          </label>
          <label className="block">
            <span className="block text-[10px] font-semibold text-black/55 uppercase tracking-wider mb-1">URL slug</span>
            <div className="flex items-stretch rounded border overflow-hidden" style={{ borderColor: "#E5E5E0" }}>
              <span className="px-2 py-1.5 text-[11px] text-black/45 bg-black/[0.03]">{SITE_BASE}/</span>
              <input type="text" value={draftSlug} onChange={(e) => setDraftSlug(slugify(e.target.value))} className="flex-1 px-2 py-1.5 text-[12px] outline-none font-mono" />
            </div>
            <p className="mt-1 text-[10px] text-black/45">Changing the slug will redirect this variant's URL. Existing custom content is preserved.</p>
          </label>
          {rowError && <p className="text-[11px] text-red-600">{rowError}</p>}
          <div className="flex items-center gap-2">
            <button type="button" disabled={savingPatch} onClick={saveEdit} className="px-3 py-1.5 rounded text-[12px] font-semibold disabled:opacity-60" style={{ background: "#C2A878", color: "#0A0A0A" }}>
              {savingPatch ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => { setEditing(false); setDraftSlug(row.slug); setDraftLabel(row.label); }} className="text-[11px] text-black/50 hover:text-black underline">
              Cancel
            </button>
          </div>
        </div>
      )}

      {!editing && rowError && <p className="mt-2 text-[11px] text-red-600">{rowError}</p>}
    </div>
  );
}
