import { useRef, useState, useId } from "react";
import { Upload, Images, X } from "lucide-react";
import { MediaLibrary } from "./MediaLibrary";
import { CropModal, type AspectKey } from "./CropModal";
import { useAdmin } from "@/context/AdminContext";
import { API_BASE as API, resolveMediaUrl } from "@/lib/api";

interface Props {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  hint?: string;
  previewHeight?: number;
  cropAspect?: AspectKey;
  /** Skip the crop step and upload the original file as-is (logos: never crop). */
  skipCrop?: boolean;
  /** How the preview fits its box. "contain" mirrors logo grids (whole image, no crop). */
  objectFit?: "cover" | "contain";
}

export function ImageUrlField({
  label,
  value,
  onChange,
  placeholder = "https://...  (or upload / pick from library)",
  hint,
  previewHeight = 80,
  cropAspect = "free",
  skipCrop = false,
  objectFit = "cover",
}: Props) {
  const { authFetch } = useAdmin();
  const uid = useId();
  const inputId = `imgurl_${uid.replace(/:/g, "")}`;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    setUploadError(null);
    if (skipCrop) {
      void uploadBlob(file, file.name);
      return;
    }
    setPendingFile(file);
  }

  async function uploadBlob(blob: Blob, filename: string) {
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", blob, filename);
      const res = await authFetch(`${API}/admin/upload`, { method: "POST", body: fd });
      if (res.ok) {
        const { url } = (await res.json()) as { url: string };
        onChange(resolveMediaUrl(url));
      } else {
        const data = await res.json().catch(() => ({}));
        setUploadError((data as { error?: string }).error ?? `Upload failed (${res.status})`);
      }
    } catch {
      setUploadError("Network error - please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-[11px] font-semibold text-[#0B0B0B]/55 uppercase tracking-wider">
          {label}
        </label>
      )}

      {showLibrary && (
        <MediaLibrary
          onSelect={(url) => { onChange(url); setShowLibrary(false); }}
          onClose={() => setShowLibrary(false)}
        />
      )}

      {pendingFile && (
        <CropModal
          file={pendingFile}
          defaultAspect={cropAspect}
          title={label ? `Crop ${label.toLowerCase()}` : "Crop image"}
          hint={hint}
          onComplete={async (blob) => {
            const fname = pendingFile.name.replace(/\.[^.]+$/, "") + ".png";
            setPendingFile(null);
            await uploadBlob(blob, fname);
          }}
          onCancel={() => setPendingFile(null)}
        />
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }}
      />

      <div className="flex gap-2 items-stretch">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[14px] bg-white outline-none focus:border-[#0B0B0B]/40"
        />
        <button
          type="button"
          onClick={() => { setUploadError(null); fileRef.current?.click(); }}
          disabled={uploading}
          title={hint ? `Upload image • ${hint}` : "Upload image"}
          data-testid="button-upload-image"
          className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0B0B0B]/70 hover:text-[#0B0B0B] border border-[#0B0B0B]/12 hover:border-[#0B0B0B]/30 px-3 rounded-xl transition-colors disabled:opacity-40 whitespace-nowrap"
        >
          <Upload size={13} />
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          title="Pick from media library"
          data-testid="button-library-image"
          className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0B0B0B]/70 hover:text-[#0B0B0B] border border-[#0B0B0B]/12 hover:border-[#0B0B0B]/30 px-3 rounded-xl transition-colors whitespace-nowrap"
        >
          <Images size={13} /> Library
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            title="Clear image"
            aria-label="Clear image"
            className="flex items-center gap-1 text-[12px] font-semibold text-red-400 hover:text-red-600 border border-red-200 hover:border-red-300 px-2.5 rounded-xl transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {value && (objectFit === "contain" ? (
        // Mirror the public Work logo cell exactly: white, centered, 80% × 44px, contain (never cropped).
        <div
          className="mt-2 rounded-lg overflow-hidden border border-[#0B0B0B]/10 bg-white flex items-center justify-center"
          style={{ height: previewHeight }}
        >
          <img
            src={resolveMediaUrl(value)}
            alt={label ?? "preview"}
            style={{ maxWidth: "80%", maxHeight: 44, objectFit: "contain" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      ) : (
        <div
          className="mt-2 rounded-lg overflow-hidden border border-[#0B0B0B]/10 bg-[#0B0B0B]/5"
          style={{ height: previewHeight }}
        >
          <img
            src={resolveMediaUrl(value)}
            alt={label ?? "preview"}
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      ))}

      {uploadError && <p className="text-[11px] text-red-600">{uploadError}</p>}
      {hint && !uploadError && (
        <p className="text-[11px] text-[#0B0B0B]/55 font-medium flex items-center gap-1.5">
          <Upload size={10} className="text-[#0B0B0B]/40 shrink-0" />
          <span>{hint}</span>
        </p>
      )}
    </div>
  );
}
