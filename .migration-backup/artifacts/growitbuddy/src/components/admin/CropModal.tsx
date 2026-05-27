import { useState, useRef, useCallback, useEffect, useId } from "react";
import { X, Check, RotateCcw } from "lucide-react";

type Handle = "tl" | "tr" | "bl" | "br" | "move" | "new";
export type AspectKey = "free" | "16:9" | "4:3" | "1:1" | "3:4" | "3:1";

const ASPECTS: { key: AspectKey; label: string; ratio: number | null }[] = [
  { key: "free", label: "Free", ratio: null },
  { key: "16:9", label: "16:9", ratio: 16 / 9 },
  { key: "4:3", label: "4:3", ratio: 4 / 3 },
  { key: "1:1", label: "Square", ratio: 1 },
  { key: "3:4", label: "3:4", ratio: 3 / 4 },
  { key: "3:1", label: "3:1", ratio: 3 },
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

interface Props {
  file: File;
  onComplete: (blob: Blob) => void;
  onCancel: () => void;
  defaultAspect?: AspectKey;
  defaultRoundness?: number;
  title?: string;
  hint?: string;
}

export function CropModal({
  file,
  onComplete,
  onCancel,
  defaultAspect = "free",
  defaultRoundness = 0,
  title = "Crop image",
  hint,
}: Props) {
  const uid = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [rawSrc, setRawSrc] = useState<string>("");
  const [aspectKey, setAspectKey] = useState<AspectKey>(defaultAspect);
  const [roundness, setRoundness] = useState(defaultRoundness);
  const [crop, setCrop] = useState<Box>({ x: 0, y: 0, w: 100, h: 100 });
  const [imgDisplay, setImgDisplay] = useState({ w: 0, h: 0 });
  const [working, setWorking] = useState(false);

  const dragState = useRef<{
    handle: Handle;
    startX: number; startY: number;
    startCrop: Box;
    imgW: number; imgH: number;
    aspect: number | null;
  } | null>(null);

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setRawSrc(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  const initCrop = useCallback(() => {
    if (!imgRef.current) return;
    const w = imgRef.current.clientWidth;
    const h = imgRef.current.clientHeight;
    setImgDisplay({ w, h });
    const ratio = ASPECTS.find((a) => a.key === aspectKey)?.ratio ?? null;
    if (ratio) {
      let cw = w * 0.9;
      let ch = cw / ratio;
      if (ch > h * 0.9) { ch = h * 0.9; cw = ch * ratio; }
      setCrop({ x: (w - cw) / 2, y: (h - ch) / 2, w: cw, h: ch });
    } else {
      const pad = Math.min(w, h) * 0.08;
      setCrop({ x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 });
    }
  }, [aspectKey]);

  useEffect(() => {
    if (imgDisplay.w === 0) return;
    const ratio = ASPECTS.find((a) => a.key === aspectKey)?.ratio ?? null;
    if (!ratio) return;
    setCrop((c) => {
      let nh = c.w / ratio;
      let nw = c.w;
      if (nh > imgDisplay.h) { nh = imgDisplay.h; nw = nh * ratio; }
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2;
      const nx = clamp(cx - nw / 2, 0, imgDisplay.w - nw);
      const ny = clamp(cy - nh / 2, 0, imgDisplay.h - nh);
      return { x: nx, y: ny, w: nw, h: nh };
    });
  }, [aspectKey, imgDisplay.w, imgDisplay.h]);

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

  async function apply() {
    const img = imgRef.current;
    if (!img) return;
    setWorking(true);
    try {
      const scaleX = img.naturalWidth / imgDisplay.w;
      const scaleY = img.naturalHeight / imgDisplay.h;
      const outW = Math.max(1, Math.round(crop.w * scaleX));
      const outH = Math.max(1, Math.round(crop.h * scaleY));
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
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error("canvas empty")), "image/png", 0.92)
      );
      onComplete(blob);
    } finally {
      setWorking(false);
    }
  }

  async function useOriginal() {
    setWorking(true);
    try {
      onComplete(file);
    } finally {
      setWorking(false);
    }
  }

  const svgRx = roundness > 0 ? (Math.min(crop.w, crop.h) * roundness) / 100 : 0;

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !working) onCancel(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#0B0B0B]/10 sticky top-0 bg-white z-10">
          <div className="min-w-0">
            <h3 className="text-[14px] font-bold text-[#0B0B0B]">{title}</h3>
            {hint && <p className="text-[11px] text-[#0B0B0B]/55 mt-0.5 truncate">{hint}</p>}
          </div>
          <button
            onClick={onCancel}
            disabled={working}
            className="text-[#0B0B0B]/45 hover:text-[#0B0B0B] disabled:opacity-30 shrink-0"
            title="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {!rawSrc ? (
            <div className="flex items-center justify-center py-16 text-[12px] text-[#0B0B0B]/40">Loading image…</div>
          ) : (
            <>
              <div
                ref={containerRef}
                className="relative rounded-xl overflow-hidden bg-black select-none"
                style={{ cursor: "crosshair", maxHeight: "55vh" }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              >
                <img
                  ref={imgRef}
                  src={rawSrc}
                  alt="crop source"
                  className="w-full block"
                  style={{ maxHeight: "55vh", objectFit: "contain", pointerEvents: "none", userSelect: "none" }}
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
                      <mask id={`cmask_${uid.replace(/:/g, "")}`}>
                        <rect width={imgDisplay.w} height={imgDisplay.h} fill="white" />
                        <rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} rx={svgRx} fill="black" />
                      </mask>
                    </defs>
                    <rect width={imgDisplay.w} height={imgDisplay.h} fill="rgba(0,0,0,0.55)" mask={`url(#cmask_${uid.replace(/:/g, "")})`} />
                    <rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} rx={svgRx}
                      fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={1.5} strokeDasharray="5 3" />
                    {[1, 2].map((n) => (
                      <g key={n}>
                        <line x1={crop.x + (crop.w * n) / 3} y1={crop.y} x2={crop.x + (crop.w * n) / 3} y2={crop.y + crop.h} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                        <line x1={crop.x} y1={crop.y + (crop.h * n) / 3} x2={crop.x + crop.w} y2={crop.y + (crop.h * n) / 3} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                      </g>
                    ))}
                    {([["tl", crop.x, crop.y], ["tr", crop.x + crop.w, crop.y], ["bl", crop.x, crop.y + crop.h], ["br", crop.x + crop.w, crop.y + crop.h]] as [string, number, number][]).map(([k, cx, cy]) => (
                      <rect key={k} x={cx - 7} y={cy - 7} width={14} height={14} rx={3} fill="white" stroke="rgba(0,0,0,0.15)" strokeWidth={1} style={{ pointerEvents: "none" }} />
                    ))}
                  </svg>
                )}
              </div>

              <p className="text-[10px] text-[#0B0B0B]/35 text-center">
                {Math.round(crop.w)} × {Math.round(crop.h)} px (preview) • Drag to move • Drag corners to resize
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
            </>
          )}
        </div>

        <div className="flex items-center gap-2 px-5 py-3 border-t border-[#0B0B0B]/10 sticky bottom-0 bg-white">
          <button
            onClick={onCancel}
            disabled={working}
            className="flex items-center gap-1.5 text-[12px] text-[#0B0B0B]/55 hover:text-[#0B0B0B] px-3 py-2 rounded-xl border border-[#0B0B0B]/12 hover:border-[#0B0B0B]/25 transition-colors disabled:opacity-40"
          >
            <RotateCcw size={12} /> Cancel
          </button>
          <button
            onClick={useOriginal}
            disabled={working || !rawSrc}
            className="text-[12px] font-semibold text-[#0B0B0B]/65 hover:text-[#0B0B0B] px-3 py-2 rounded-xl border border-[#0B0B0B]/12 hover:border-[#0B0B0B]/25 transition-colors disabled:opacity-40"
            title="Upload without cropping"
          >
            Skip crop
          </button>
          <button
            onClick={apply}
            disabled={working || !rawSrc}
            className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold bg-[#0B0B0B] text-white px-3 py-2 rounded-xl hover:bg-[#0B0B0B]/85 transition-colors disabled:opacity-50"
          >
            {working ? <>Working…</> : <><Check size={12} /> Apply crop</>}
          </button>
        </div>
      </div>
    </div>
  );
}
