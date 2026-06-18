import { useEffect, useState, useRef, useCallback } from "react";
import { PageHeader, Card } from "@/components/admin/AdminField";
import { useAdmin } from "@/context/AdminContext";
import {
  Upload, Trash2, Copy, Check, RefreshCw, ImageIcon,
  Search, X, ZoomIn, AlertCircle, Wand2, Loader2, CheckSquare, Square, MinusSquare,
} from "lucide-react";

import { API_BASE as API, resolveMediaUrl } from "@/lib/api";

interface MediaItem {
  filename: string;
  url: string;
  uploadedAt: number;
  size?: number;
  originalName?: string;
}

function fmtDate(ts: number) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function cleanName(filename: string) {
  return filename.replace(/^\d+_/, "");
}

function fmtBytes(n?: number) {
  if (!n || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminMediaLibrary() {
  const { authFetch } = useAdmin();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [converting, setConverting] = useState(false);
  const [convertResult, setConvertResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API}/admin/media`);
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  async function uploadFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) {
      setUploadError("Please select image files only (PNG, JPG, WebP, GIF, SVG).");
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(0);
    let succeeded = 0;
    const errors: string[] = [];
    try {
      await Promise.all(arr.map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        try {
          const res = await authFetch(`${API}/admin/upload`, {
            method: "POST",
            body: fd,
          });
          if (res.ok) {
            succeeded++;
          } else {
            const data = await res.json().catch(() => ({}));
            errors.push((data as { error?: string }).error ?? `Failed to upload "${file.name}" (${res.status})`);
          }
        } catch {
          errors.push(`Network error uploading "${file.name}"`);
        }
      }));
      if (errors.length > 0) {
        setUploadError(errors.join(" · "));
      }
      if (succeeded > 0) {
        setUploadSuccess(succeeded);
        setTimeout(() => setUploadSuccess(0), 3000);
        await load();
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Delete "${cleanName(item.filename)}"? This cannot be undone.`)) return;
    setDeleting(item.filename);
    try {
      await authFetch(`${API}/admin/media/${encodeURIComponent(item.filename)}`, {
        method: "DELETE",
      });
      setItems((prev) => prev.filter((i) => i.filename !== item.filename));
      if (preview?.filename === item.filename) setPreview(null);
    } finally {
      setDeleting(null);
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(url);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    return !q || cleanName(item.filename).toLowerCase().includes(q);
  });

  const idOf = (item: MediaItem) => Number(item.filename);
  const allFilteredSelected = filtered.length > 0 && filtered.every((i) => selected.has(idOf(i)));
  const selectedSize = items.filter((i) => selected.has(idOf(i))).reduce((s, i) => s + (i.size ?? 0), 0);

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((i) => next.delete(idOf(i)));
      else filtered.forEach((i) => next.add(idOf(i)));
      return next;
    });
  }
  function clearSelection() { setSelected(new Set()); }

  async function runConvert(format: "webp" | "avif") {
    const ids = Array.from(selected);
    if (!ids.length || converting) return;
    const label = format.toUpperCase();
    const plural = ids.length !== 1;
    const ok = window.confirm(
      `Convert ${ids.length} image${plural ? "s" : ""} to ${label}?\n\n` +
      `This replaces the original${plural ? "s" : ""} in place with a smaller, compressed ${label} ` +
      `version (no visible quality loss). Images already optimal or unsupported (SVG, animated GIF) ` +
      `are skipped automatically. This cannot be undone.`,
    );
    if (!ok) return;
    setConverting(true);
    setConvertResult(null);
    setUploadError(null);
    try {
      const res = await authFetch(`${API}/admin/media/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, format }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError((data as { error?: string }).error ?? `Conversion failed (${res.status})`);
        return;
      }
      const d = data as {
        converted?: number; total?: number; savedBytes?: number;
        results?: Array<{ ok: boolean }>; warning?: string;
      };
      const converted = d.converted ?? 0;
      const total = d.total ?? ids.length;
      const savedBytes = d.savedBytes ?? 0;
      const skipped = (d.results ?? []).filter((r) => !r.ok).length;
      let msg = `${converted} of ${total} image${total !== 1 ? "s" : ""} converted to ${label}`;
      if (savedBytes > 0) msg += ` · saved ${fmtBytes(savedBytes)}`;
      if (skipped > 0) msg += ` · ${skipped} skipped (already optimal or unsupported)`;
      setConvertResult(msg);
      if (d.warning) setUploadError(d.warning);
      clearSelection();
      await load();
    } catch {
      setUploadError("Network error during conversion.");
    } finally {
      setConverting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Media Library"
        description={`${items.length} image${items.length !== 1 ? "s" : ""} · click an image to preview or copy its URL`}
      />

      {/* Upload status banners */}
      {uploadError && (
        <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-[12px] text-red-700 flex-1">{uploadError}</p>
          <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600 shrink-0"><X size={13} /></button>
        </div>
      )}
      {uploadSuccess > 0 && (
        <div className="mb-4 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <Check size={15} className="text-emerald-500 shrink-0" />
          <p className="text-[12px] text-emerald-700">{uploadSuccess} image{uploadSuccess !== 1 ? "s" : ""} uploaded successfully</p>
        </div>
      )}
      {convertResult && (
        <div className="mb-4 flex items-start gap-2.5 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
          <Wand2 size={15} className="text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-[12px] text-indigo-700 flex-1">{convertResult}</p>
          <button onClick={() => setConvertResult(null)} className="text-indigo-400 hover:text-indigo-600 shrink-0"><X size={13} /></button>
        </div>
      )}

      {/* Upload drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mb-5 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
          dragging
            ? "border-[#0B0B0B] bg-[#0B0B0B]/5"
            : "border-[#0B0B0B]/15 hover:border-[#0B0B0B]/35 hover:bg-[#0B0B0B]/3"
        }`}
        style={{ padding: "28px 24px" }}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) uploadFiles(e.target.files); e.target.value = ""; }}
        />
        <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
          <Upload size={20} className={`transition-colors ${dragging ? "text-[#0B0B0B]" : "text-[#0B0B0B]/30"}`} />
          <p className="text-[13px] font-semibold text-[#0B0B0B]/50">
            {uploading ? "Uploading..." : dragging ? "Drop to upload" : "Click or drag images here to upload"}
          </p>
          <p className="text-[11px] text-[#0B0B0B]/30">PNG, JPG, WebP, GIF, SVG</p>
          <p className="text-[10px] text-[#0B0B0B]/35 mt-1 max-w-[420px]">
            Tip: Upload at the recommended size for each use. Hero / OG / featured: <b>1200 × 630</b>. Avatars: <b>400 × 400</b>. Client logos: <b>240 × 80 PNG transparent</b>. Favicons: <b>64 × 64</b>.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0B0B0B]/35" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename..."
            className="w-full pl-9 pr-9 py-2.5 border border-[#0B0B0B]/12 rounded-xl text-[13px] text-[#0B0B0B] placeholder-[#0B0B0B]/30 outline-none focus:border-[#0B0B0B]/30 bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0B0B0B]/30 hover:text-[#0B0B0B]">
              <X size={13} />
            </button>
          )}
        </div>
        <button
          onClick={toggleSelectAll}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 px-3 py-2.5 border border-[#0B0B0B]/12 rounded-xl hover:bg-[#0B0B0B]/5 text-[#0B0B0B]/60 text-[12px] font-semibold transition-colors disabled:opacity-40"
          title={allFilteredSelected ? "Clear selection" : "Select all"}
        >
          {allFilteredSelected ? <MinusSquare size={15} /> : <CheckSquare size={15} />}
          {allFilteredSelected ? "Clear" : "Select all"}
        </button>
        <button
          onClick={load}
          className="p-2.5 border border-[#0B0B0B]/12 rounded-xl hover:bg-[#0B0B0B]/5 text-[#0B0B0B]/50 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Grid */}
      <Card className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-[13px] text-[#0B0B0B]/35">Loading images...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <ImageIcon size={36} className="text-[#0B0B0B]/15" />
            <p className="text-[14px] font-semibold text-[#0B0B0B]/30">
              {search ? "No images match your search." : "No images uploaded yet."}
            </p>
            {!search && (
              <button
                onClick={() => fileRef.current?.click()}
                className="text-[12px] font-semibold text-[#0B0B0B]/40 hover:text-[#0B0B0B] underline underline-offset-2 transition-colors"
              >
                Upload your first image
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {filtered.map((item) => {
              const isCopied = copied === item.url;
              const isDeleting = deleting === item.filename;
              const id = idOf(item);
              const isSelected = selected.has(id);
              return (
                <div
                  key={item.filename}
                  className={`group relative rounded-xl overflow-hidden border bg-[#F7F7F5] flex flex-col transition-all ${
                    isSelected ? "border-indigo-500 ring-2 ring-indigo-400/40" : "border-[#0B0B0B]/8"
                  }`}
                  style={{ aspectRatio: "1" }}
                >
                  <div
                    className="relative flex-1 overflow-hidden cursor-pointer"
                    onClick={() => toggleSelect(id)}
                  >
                    <img
                      src={resolveMediaUrl(item.url)}
                      alt={cleanName(item.filename)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(id); }}
                      className={`absolute top-2 left-2 z-10 rounded-md p-0.5 transition-all ${
                        isSelected
                          ? "bg-indigo-500 text-white"
                          : "bg-white/85 text-[#0B0B0B]/40 opacity-0 group-hover:opacity-100"
                      }`}
                      title={isSelected ? "Deselect" : "Select"}
                    >
                      {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreview(item); }}
                        className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                        title="Preview"
                      >
                        <ZoomIn size={14} className="text-[#0B0B0B]" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); copyUrl(item.url); }}
                        className={`p-2 rounded-lg transition-colors ${isCopied ? "bg-emerald-500" : "bg-white/90 hover:bg-white"}`}
                        title="Copy URL"
                      >
                        {isCopied
                          ? <Check size={14} className="text-white" />
                          : <Copy size={14} className="text-[#0B0B0B]" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                        disabled={isDeleting}
                        className="p-2 bg-red-500/90 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={14} className="text-white" />
                      </button>
                    </div>
                  </div>
                  <div className="px-2 py-1.5 bg-white border-t border-[#0B0B0B]/6 shrink-0 flex items-center justify-between gap-1">
                    <p className="text-[9px] text-[#0B0B0B]/30">{fmtDate(item.uploadedAt)}</p>
                    {item.size ? <p className="text-[9px] font-semibold text-[#0B0B0B]/45 shrink-0">{fmtBytes(item.size)}</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {filtered.length > 0 && (
        <p className="text-[11px] text-[#0B0B0B]/30 text-center mt-3">
          {filtered.length} image{filtered.length !== 1 ? "s" : ""}
          {search ? ` matching "${search}"` : " total"} · hover to copy URL or delete
        </p>
      )}

      {/* Lightbox */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setPreview(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxWidth: "min(90vw, 900px)", maxHeight: "88vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#0B0B0B]/8 shrink-0">
              <div>
                <p className="text-[13px] font-bold text-[#0B0B0B]">{cleanName(preview.filename)}</p>
                <p className="text-[11px] text-[#0B0B0B]/40">{fmtDate(preview.uploadedAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyUrl(preview.url)}
                  className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl border transition-all ${
                    copied === preview.url
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "border-[#0B0B0B]/12 text-[#0B0B0B]/60 hover:bg-[#0B0B0B]/5"
                  }`}
                >
                  {copied === preview.url ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy URL</>}
                </button>
                <button
                  onClick={() => handleDelete(preview)}
                  disabled={deleting === preview.filename}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-all disabled:opacity-40"
                >
                  <Trash2 size={13} /> Delete
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="p-2 rounded-xl hover:bg-[#0B0B0B]/5 text-[#0B0B0B]/40 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[#F7F7F5]" style={{ minHeight: 300 }}>
              <img
                src={resolveMediaUrl(preview.url)}
                alt={cleanName(preview.filename)}
                style={{ maxWidth: "100%", maxHeight: "68vh", objectFit: "contain", borderRadius: 12 }}
              />
            </div>
            <div className="px-5 py-3 border-t border-[#0B0B0B]/8 bg-white shrink-0">
              <p className="text-[11px] text-[#0B0B0B]/40 font-mono truncate">{preview.url}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bulk-convert action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-[#0B0B0B] text-white rounded-2xl shadow-2xl px-4 py-3">
          <span className="text-[12px] font-semibold whitespace-nowrap">
            {selected.size} selected{selectedSize > 0 ? ` · ${fmtBytes(selectedSize)}` : ""}
          </span>
          <div className="h-5 w-px bg-white/20" />
          <button
            onClick={() => runConvert("webp")}
            disabled={converting}
            className="flex items-center gap-1.5 text-[12px] font-semibold bg-white text-[#0B0B0B] px-3 py-2 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {converting ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            Convert to WebP
          </button>
          <button
            onClick={() => runConvert("avif")}
            disabled={converting}
            className="flex items-center gap-1.5 text-[12px] font-semibold bg-indigo-500 text-white px-3 py-2 rounded-xl hover:bg-indigo-400 transition-colors disabled:opacity-50"
          >
            {converting ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            Convert to AVIF
          </button>
          <button
            onClick={clearSelection}
            disabled={converting}
            className="text-white/60 hover:text-white transition-colors disabled:opacity-40"
            title="Clear selection"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
