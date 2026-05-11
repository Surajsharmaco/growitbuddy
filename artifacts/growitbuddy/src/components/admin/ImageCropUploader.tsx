import { useState, useRef, useCallback, useId } from "react";
import { Upload, X, RotateCcw, Check, Crop, Images } from "lucide-react";
import { MediaLibrary } from "./MediaLibrary";
import { useAdmin } from "@/context/AdminContext";
import { API_BASE as API } from "@/lib/api";

type Handle = "tl" | "tr" | "bl" | "br" | "move" | "new";
type AspectKey = "free" | "16:9" | "4:3" | "1:1" | "3:4";

const ASPECTS: { key: AspectKey; label: string; ratio: number | null }[] = [
  { key: "free", label: "Free", ratio: null },
  { key: "16:9", label: "16:9", ratio: 16 / 9 },
  { key: "4:3", label: "4:3", ratio: 4 / 3 },
  { key: "1:1", label: "Square", ratio: 1 },
  { key: "3:4", label: "3:4", ratio: 3 / 4 },
];

interface Box { x: number; y: number; w: number; h: number; }

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

interface Props { value: string; onChange: (url: string) => void; }

export function ImageCropUploader({ value, onChange }: Props) {
  const { authFetch } = useAdmin();
  const uid = useId();
  const inputId = `img_upload_${uid.replace(/:/g, "")}`;

  const [stage, setStage] = useState<"empty" | "crop" | "done">(value ? "done" : "empty");
  const [rawSrc, setRawSrc] = useState<string>("");
  const [finalSrc, setFinalSrc] = useState<string>(value || "");
  const [hovering, setHovering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const [aspectKey, setAspectKey] = useState<AspectKey>("free");
  const [roundness, setRoundness] = useState(0);
  const [crop, setCrop] = useState<Box>({ x: 0, y: 0, w: 100, h: 100 });
  const [imgDisplay, setImgDisplay] = useState({ w: 0, h: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const dragState = useRef<{
    handle: Handle;
    startX: number; startY: number;
    startCrop: Box;
    imgW: number; imgH: number;
    aspect: number | null;
  } | null>(null);

  function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setRawSrc(e.target?.result as string);
      setStage("crop");
    };
    reader.readAsDataURL(file);
  }

  const initCrop = useCallback(() => {
    if (!imgRef.current) return;
    const w = imgRef.current.clientWidth;
    const h = imgRef.current.clientHeight;
    setImgDisplay({ w, h });
    const pad = Math.min(w, h) * 0.08;
    setCrop({ x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 });
  }, []);

  function relPos(e: React.PointerEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function detectHandle(pos: { x: number; y: number }): Handle {
    const HS = 14;
    const { x, y } = pos;
    const corners: [Handle, number, number][] = [
      ["tl", crop.x, crop.y],
      ["tr", crop.x + crop.w, crop.y],
      ["bl", crop.x, crop.y + crop.h],
      ["br", crop.x + crop.w, crop.y + crop.h],
    ];
    for (const [h, cx, cy] of corners) {
      if (Math.abs(x - cx) < HS && Math.abs(y - cy) < HS) return h;
    }
    if (x > crop.x && x < crop.x + crop.w && y > crop.y && y < crop.y + crop.h) return "move";
    return "new";
  }

  function onPointerDown(e: React.PointerEvent) {
    const pos = relPos(e);
    const handle = detectHandle(pos);
    const aspect = ASPECTS.find((a) => a.key === aspectKey)?.ratio ?? null;
    dragState.current = {
      handle, startX: pos.x, startY: pos.y,
      startCrop: { ...crop },
      imgW: imgDisplay.w, imgH: imgDisplay.h, aspect,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragState.current) return;
    const { x, y } = relPos(e);
    const { handle, startX, startY, startCrop: sc, imgW, imgH, aspect } = dragState.current;
    const dx = x - startX;
    const dy = y - startY;
    const MIN = 24;
    let nc: Box;

    if (handle === "new") {
      const x0 = Math.min(startX, x);
      const y0 = Math.min(startY, y);
      let bw = Math.abs(dx);
      let bh = aspect ? bw / aspect : Math.abs(dy);
      bw = clamp(bw, MIN, imgW - x0);
      bh = clamp(bh, MIN, imgH - y0);
      nc = { x: clamp(x0, 0, imgW - MIN), y: clamp(y0, 0, imgH - MIN), w: bw, h: bh };
    } else if (handle === "move") {
      nc = { x: clamp(sc.x + dx, 0, imgW - sc.w), y: clamp(sc.y + dy, 0, imgH - sc.h), w: sc.w, h: sc.h };
    } else {
      let nw = sc.w, nh = sc.h, nx = sc.x, ny = sc.y;
      if (handle === "tl") {
        nw = clamp(sc.w - dx, MIN, sc.x + sc.w);
        nh = aspect ? nw / aspect : clamp(sc.h - dy, MIN, sc.y + sc.h);
        nx = sc.x + sc.w - nw; ny = sc.y + sc.h - nh;
      } else if (handle === "tr") {
        nw = clamp(sc.w + dx, MIN, imgW - sc.x);
        nh = aspect ? nw / aspect : clamp(sc.h - dy, MIN, sc.y + sc.h);
        ny = sc.y + sc.h - nh;
      } else if (handle === "bl") {
        nw = clamp(sc.w - dx, MIN, sc.x + sc.w);
        nh = aspect ? nw / aspect : clamp(sc.h + dy, MIN, imgH - sc.y);
        nx = sc.x + sc.w - nw;
      } else {
        nw = clamp(sc.w + dx, MIN, imgW - sc.x);
        nh = aspect ? nw / aspect : clamp(sc.h + dy, MIN, imgH - sc.y);
      }
      nc = { x: nx, y: ny, w: nw, h: nh };
    }
    setCrop(nc);
  }

  function onPointerUp() { dragState.current = null; }

  async function applyCrop() {
    const img = imgRef.current;
    if (!img) return;
    const scaleX = img.naturalWidth / imgDisplay.w;
    const scaleY = img.naturalHeight / imgDisplay.h;
    const outW = Math.max(1, Math.round(crop.w * 2));
    const outH = Math.max(1, Math.round(crop.h * 2));
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, outW, outH);
    if (roundness > 0) {
      const r = (Math.min(outW, outH) * roundness) / 100;
      roundedRectPath(ctx, 0, 0, outW, outH, r);
      ctx.clip();
    }
    ctx.drawImage(
      img,
      crop.x * scaleX, crop.y * scaleY,
      crop.w * scaleX, crop.h * scaleY,
      0, 0, outW, outH
    );

    setUploading(true);
    setUploadError(null);
    try {
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error("canvas empty")), "image/png", 0.92)
      );
      const fd = new FormData();
      fd.append("file", blob, "image.png");
      const res = await authFetch(`${API}/admin/upload`, {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        const { url } = await res.json() as { url: string };
        setFinalSrc(url);
        setStage("done");
        setUploadError(null);
        onChange(url);
      } else {
        const data = await res.json().catch(() => ({}));
        setUploadError((data as { error?: string }).error ?? `Upload failed (${res.status}) — please try again`);
      }
    } catch {
      setUploadError("Network error — please check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  function reset() {
    setStage("empty"); setRawSrc(""); setFinalSrc(""); onChange("");
  }

  function handleLibrarySelect(url: string) {
    setFinalSrc(url);
    setStage("done");
    onChange(url);
    setShowLibrary(false);
  }

  const svgRx = roundness > 0 ? (Math.min(crop.w, crop.h) * roundness) / 100 : 0;

  return (
    <>
      {showLibrary && <MediaLibrary onSelect={handleLibrarySelect} onClose={() => setShowLibrary(false)} />}

      {stage === "empty" && (
        <div className="space-y-2">
          <div
            onDragOver={(e) => { e.preventDefault(); setHovering(true); }}
            onDragLeave={() => setHovering(false)}
            onDrop={(e) => { e.preventDefault(); setHovering(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
            onClick={() => document.getElementById(inputId)?.click()}
            className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2.5 transition-colors cursor-pointer ${hovering ? "border-[#0B0B0B]/40 bg-[#0B0B0B]/5" : "border-[#0B0B0B]/15 bg-[#fafafa] hover:border-[#0B0B0B]/30 hover:bg-[#0B0B0B]/3"}`}
            style={{ minHeight: 120 }}
          >
            <input id={inputId} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.currentTarget.value = ""; }} />
            <Upload size={20} className="text-[#0B0B0B]/30" />
            <div className="text-center">
              <p className="text-[13px] font-semibold text-[#0B0B0B]/50">Click to upload or drag & drop</p>
              <p className="text-[10px] text-[#0B0B0B]/30 mt-0.5">PNG, JPG, WebP · max 8 MB</p>
            </div>
          </div>
          <button
            onClick={() => setShowLibrary(true)}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#0B0B0B]/40 hover:text-[#0B0B0B] border border-[#0B0B0B]/10 hover:border-[#0B0B0B]/25 rounded-xl py-2 transition-colors"
          >
            <Images size={13} /> Choose from library
          </button>
        </div>
      )}

      {stage === "done" && (
        <div className="space-y-2">
          <div className="relative rounded-xl overflow-hidden group" style={{ height: 150 }}>
            <img src={finalSrc} alt="Featured" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button onClick={() => setStage("crop")}
                className="bg-white text-[#0B0B0B] text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#f5f5f5] flex items-center gap-1">
                <Crop size={11} /> Re-crop
              </button>
              <button onClick={() => setShowLibrary(true)}
                className="bg-white text-[#0B0B0B] text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#f5f5f5] flex items-center gap-1">
                <Images size={11} /> Library
              </button>
              <button onClick={reset}
                className="bg-white text-red-600 text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 flex items-center gap-1">
                <X size={11} /> Remove
              </button>
            </div>
          </div>
          <p className="text-[10px] text-[#0B0B0B]/35 text-center">Hover to re-crop, pick from library, or remove</p>
        </div>
      )}

      {stage === "crop" && (
        <div className="space-y-3">
          <div
            ref={containerRef}
            className="relative rounded-xl overflow-hidden bg-black select-none"
            style={{ cursor: "crosshair", maxHeight: 340 }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <img
              ref={imgRef}
              src={rawSrc}
              alt="crop source"
              className="w-full block"
              style={{ maxHeight: 340, objectFit: "contain", pointerEvents: "none", userSelect: "none" }}
              onLoad={initCrop}
              draggable={false}
            />
            {imgDisplay.w > 0 && (
              <svg
                className="absolute inset-0 pointer-events-none"
                width={imgDisplay.w}
                height={imgDisplay.h}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                viewBox={`0 0 ${imgDisplay.w} ${imgDisplay.h}`}
                preserveAspectRatio="none"
              >
                <defs>
                  <mask id={`cmask_${inputId}`}>
                    <rect width={imgDisplay.w} height={imgDisplay.h} fill="white" />
                    <rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} rx={svgRx} fill="black" />
                  </mask>
                </defs>
                <rect width={imgDisplay.w} height={imgDisplay.h} fill="rgba(0,0,0,0.55)" mask={`url(#cmask_${inputId})`} />
                <rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} rx={svgRx}
                  fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={1.5} strokeDasharray="5 3" />
                {[1, 2].map((n) => (
                  <g key={n}>
                    <line x1={crop.x + (crop.w * n) / 3} y1={crop.y} x2={crop.x + (crop.w * n) / 3} y2={crop.y + crop.h} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                    <line x1={crop.x} y1={crop.y + (crop.h * n) / 3} x2={crop.x + crop.w} y2={crop.y + (crop.h * n) / 3} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                  </g>
                ))}
                {([["tl", crop.x, crop.y, "nwse-resize"], ["tr", crop.x + crop.w, crop.y, "nesw-resize"], ["bl", crop.x, crop.y + crop.h, "nesw-resize"], ["br", crop.x + crop.w, crop.y + crop.h, "nwse-resize"]] as [string, number, number, string][]).map(([, cx, cy, cur], i) => (
                  <rect key={i} x={cx - 7} y={cy - 7} width={14} height={14} rx={3} fill="white" stroke="rgba(0,0,0,0.15)" strokeWidth={1} style={{ cursor: cur, pointerEvents: "none" }} />
                ))}
                <rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} rx={svgRx} fill="transparent" style={{ cursor: "move", pointerEvents: "none" }} />
              </svg>
            )}
          </div>

          <p className="text-[10px] text-[#0B0B0B]/35 text-center">
            {Math.round(crop.w)} × {Math.round(crop.h)} px &bull; Drag to move &bull; Drag corners to resize
          </p>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest mr-0.5">Ratio</span>
            {ASPECTS.map((a) => (
              <button key={a.key} onClick={() => setAspectKey(a.key)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${aspectKey === a.key ? "bg-[#0B0B0B] text-white border-[#0B0B0B]" : "text-[#0B0B0B]/50 border-[#0B0B0B]/15 hover:border-[#0B0B0B]/30 bg-white"}`}>
                {a.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest shrink-0">Round</span>
            <input type="range" min={0} max={50} value={roundness}
              onChange={(e) => setRoundness(Number(e.target.value))}
              className="flex-1 accent-[#0B0B0B]" style={{ height: 4 }} />
            <span className="text-[11px] text-[#0B0B0B]/45 font-mono w-8 text-right">{roundness}%</span>
          </div>

          {uploadError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <span className="text-red-500 text-[12px] shrink-0">⚠</span>
              <p className="text-[11px] text-red-700 flex-1">{uploadError}</p>
              <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600 text-[12px] shrink-0">✕</button>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={reset}
              className="flex items-center gap-1.5 text-[12px] text-[#0B0B0B]/45 hover:text-[#0B0B0B] px-3 py-2 rounded-xl border border-[#0B0B0B]/12 hover:border-[#0B0B0B]/25 transition-colors">
              <RotateCcw size={12} /> Cancel
            </button>
            <button onClick={applyCrop} disabled={uploading}
              className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold bg-[#0B0B0B] text-white px-3 py-2 rounded-xl hover:bg-[#0B0B0B]/85 transition-colors disabled:opacity-50">
              {uploading ? (
                <>Uploading…</>
              ) : (
                <><Check size={12} /> Apply & Upload</>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
