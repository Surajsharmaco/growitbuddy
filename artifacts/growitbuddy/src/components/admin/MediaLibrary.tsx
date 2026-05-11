import { useEffect, useState, useRef } from "react";
import { X, ImageIcon, Upload } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { API_BASE as API, resolveMediaUrl } from "@/lib/api";

interface MediaItem {
  filename: string;
  url: string;
  uploadedAt: number;
}

interface Props {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export function MediaLibrary({ onSelect, onClose }: Props) {
  const { authFetch } = useAdmin();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await authFetch(`${API}/admin/media`);
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file (PNG, JPG, WebP, GIF, SVG).");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await authFetch(`${API}/admin/upload`, {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        setUploadError((data as { error?: string }).error ?? `Upload failed (${res.status})`);
      }
    } catch {
      setUploadError("Network error — please check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col"
        style={{ width: "min(92vw, 780px)", maxHeight: "82vh" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#0B0B0B]/8 shrink-0">
          <div>
            <p className="text-[14px] font-700 text-[#0B0B0B]" style={{ fontWeight: 700 }}>Media Library</p>
            <p className="text-[11px] text-[#0B0B0B]/40 mt-0.5">{items.length} image{items.length !== 1 ? "s" : ""} uploaded</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setUploadError(null); fileRef.current?.click(); }}
              disabled={uploading}
              className="flex items-center gap-1.5 text-[12px] font-semibold bg-[#0B0B0B] text-white px-3 py-2 rounded-xl hover:bg-[#0B0B0B]/85 transition-colors disabled:opacity-50"
            >
              <Upload size={13} />
              {uploading ? "Uploading..." : "Upload new"}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#0B0B0B]/5 text-[#0B0B0B]/40 hover:text-[#0B0B0B] transition-colors">
              <X size={18} />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
          />
        </div>

        {uploadError && (
          <div className="mx-4 mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 shrink-0">
            <span className="text-red-500 text-[13px] shrink-0">⚠</span>
            <p className="text-[12px] text-red-700 flex-1">{uploadError}</p>
            <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600 text-[13px] shrink-0">✕</button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-[13px] text-[#0B0B0B]/35">Loading...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <ImageIcon size={32} className="text-[#0B0B0B]/20" />
              <p className="text-[13px] text-[#0B0B0B]/35">No images uploaded yet.</p>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-[12px] font-semibold text-[#0B0B0B]/50 hover:text-[#0B0B0B] underline underline-offset-2"
              >
                Upload your first image
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {items.map((item) => (
                <button
                  key={item.filename}
                  onClick={() => { onSelect(resolveMediaUrl(item.url)); onClose(); }}
                  className="group relative rounded-xl overflow-hidden border-2 border-transparent hover:border-[#0B0B0B] transition-colors focus:outline-none focus:border-[#0B0B0B]"
                  style={{ aspectRatio: "1" }}
                  title={item.filename}
                >
                  <img
                    src={resolveMediaUrl(item.url)}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[9px] text-white font-semibold truncate bg-black/50 rounded px-1.5 py-0.5">
                      {item.filename.replace(/^\d+_/, "")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
