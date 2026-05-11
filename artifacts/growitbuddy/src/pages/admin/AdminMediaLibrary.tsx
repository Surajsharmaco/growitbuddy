import { useEffect, useState, useRef, useCallback } from "react";
import { PageHeader, Card } from "@/components/admin/AdminField";
import { useAdmin } from "@/context/AdminContext";
import {
  Upload, Trash2, Copy, Check, RefreshCw, ImageIcon,
  Search, X, ZoomIn, AlertCircle,
} from "lucide-react";

import { API_BASE as API, resolveMediaUrl } from "@/lib/api";

interface MediaItem {
  filename: string;
  url: string;
  uploadedAt: number;
}

function fmtDate(ts: number) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function cleanName(filename: string) {
  return filename.replace(/^\d+_/, "");
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
              return (
                <div
                  key={item.filename}
                  className="group relative rounded-xl overflow-hidden border border-[#0B0B0B]/8 bg-[#F7F7F5] flex flex-col"
                  style={{ aspectRatio: "1" }}
                >
                  <div className="relative flex-1 overflow-hidden">
                    <img
                      src={resolveMediaUrl(item.url)}
                      alt={cleanName(item.filename)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => setPreview(item)}
                        className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                        title="Preview"
                      >
                        <ZoomIn size={14} className="text-[#0B0B0B]" />
                      </button>
                      <button
                        onClick={() => copyUrl(item.url)}
                        className={`p-2 rounded-lg transition-colors ${isCopied ? "bg-emerald-500" : "bg-white/90 hover:bg-white"}`}
                        title="Copy URL"
                      >
                        {isCopied
                          ? <Check size={14} className="text-white" />
                          : <Copy size={14} className="text-[#0B0B0B]" />}
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={isDeleting}
                        className="p-2 bg-red-500/90 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={14} className="text-white" />
                      </button>
                    </div>
                  </div>
                  <div className="px-2 py-1.5 bg-white border-t border-[#0B0B0B]/6 shrink-0">
                    <p className="text-[10px] font-semibold text-[#0B0B0B]/60 truncate">{cleanName(item.filename)}</p>
                    <p className="text-[9px] text-[#0B0B0B]/30 mt-0.5">{fmtDate(item.uploadedAt)}</p>
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
    </div>
  );
}
