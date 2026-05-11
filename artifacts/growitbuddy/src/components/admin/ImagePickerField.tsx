import { useRef, useState, useId } from "react";
import { Upload, Images, X, UserCircle2 } from "lucide-react";
import { MediaLibrary } from "./MediaLibrary";
import { useAdmin } from "@/context/AdminContext";
import { API_BASE as API } from "@/lib/api";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  shape?: "square" | "circle";
  size?: number;
}

export function ImagePickerField({ value, onChange, label, shape = "circle", size = 56 }: Props) {
  const { authFetch } = useAdmin();
  const uid = useId();
  const inputId = `imgpick_${uid.replace(/:/g, "")}`;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
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
        const { url } = await res.json() as { url: string };
        onChange(url);
      } else {
        const data = await res.json().catch(() => ({}));
        setUploadError((data as { error?: string }).error ?? `Upload failed (${res.status})`);
      }
    } catch {
      setUploadError("Network error — please try again.");
    } finally {
      setUploading(false);
    }
  }

  const radius = shape === "circle" ? "50%" : "10px";

  return (
    <div className="flex items-center gap-3">
      <input
        id={inputId}
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }}
      />

      {showLibrary && (
        <MediaLibrary
          onSelect={(url) => { onChange(url); setShowLibrary(false); }}
          onClose={() => setShowLibrary(false)}
        />
      )}

      <div
        style={{ width: size, height: size, borderRadius: radius, flexShrink: 0, border: "1.5px solid rgba(11,11,11,0.1)", overflow: "hidden", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {value ? (
          <img src={value} alt={label ?? "photo"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <UserCircle2 size={size * 0.45} style={{ color: "rgba(11,11,11,0.2)" }} />
        )}
      </div>

      <div className="flex flex-col gap-1.5 min-w-0">
        {label && <p className="text-[11px] font-semibold text-[#0B0B0B]/50">{label}</p>}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => { setUploadError(null); fileRef.current?.click(); }}
            disabled={uploading}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#0B0B0B]/55 hover:text-[#0B0B0B] border border-[#0B0B0B]/12 hover:border-[#0B0B0B]/30 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          >
            <Upload size={11} />
            {uploading ? "Uploading..." : "Upload"}
          </button>
          <button
            onClick={() => setShowLibrary(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#0B0B0B]/55 hover:text-[#0B0B0B] border border-[#0B0B0B]/12 hover:border-[#0B0B0B]/30 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Images size={11} /> Library
          </button>
          {value && (
            <button
              onClick={() => onChange("")}
              className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-600 border border-red-200 hover:border-red-300 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <X size={11} /> Remove
            </button>
          )}
        {uploadError && (
          <p className="text-[10px] text-red-600 mt-1">{uploadError}</p>
        )}
        </div>
      </div>
    </div>
  );
}
