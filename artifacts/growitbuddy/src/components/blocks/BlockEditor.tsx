import React, { useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowDown, Copy, Trash2, Plus, X, Save, ImagePlus, Settings2 } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { API_BASE, resolveMediaUrl } from "@/lib/api";
import BlockRenderer, { type Block, type BlockStyle } from "./BlockRenderer";
import { makeBlock, ADDABLE_BLOCKS } from "./blockDefaults";

// ─────────────────────────────────────────────────────────────────────────────
// BlockEditor - Wix-style inline editor that renders IDENTICALLY to the public
// case study page (BlockRenderer). The only differences in edit mode are:
//
//   • Hover any block → outline appears + per-block toolbar (drag, move,
//     duplicate, settings, delete) floats above
//   • Click any text → contentEditable, edit in place, blur to save
//   • Click any image → upload replacement (uses existing /admin/upload)
//   • "+" button between every block → inserts a new block
//   • Floating top bar: Save / Exit (status to the right)
//   • Settings popover per block: bg / text color / align / padding / max-width
//
// Visual fidelity is preserved by mirroring BlockRenderer's exact CSS values
// (fonts, sizes, colors, padding, Container) inside each Edit* component. No
// extra padding, controls, or chrome leaks into the layout - controls only
// appear on hover/selection, layered above via absolute positioning.
// ─────────────────────────────────────────────────────────────────────────────

// Theme constants - must match BlockRenderer.tsx exactly.
const BG    = "#F8F8F6";
const TEXT  = "#0A0A0A";
const SLATE = "#1E293B";
const MUTED = "#5F5F5F";
const RULE  = "#E5E5E0";
const GOLD  = "#C2A878";
const CARD  = "#FFFFFF";
const ACCENT = "#3B82F6";

interface Props {
  portfolioId: number;
  initialBlocks: Block[];
  onSaved?: (blocks: Block[]) => void;
  onExit?: () => void;
}

export default function BlockEditor({ portfolioId, initialBlocks, onSaved, onExit }: Props) {
  const { authFetch } = useAdmin();
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [addOpenAt, setAddOpenAt] = useState<number | null>(null);

  const dirtyRef = useRef(false);
  useEffect(() => { dirtyRef.current = JSON.stringify(initialBlocks) !== JSON.stringify(blocks); }, [blocks, initialBlocks]);
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  function updateProps(id: string, propPatch: Record<string, unknown>) {
    setBlocks(bs => bs.map(b => b.id === id ? { ...b, props: { ...b.props, ...propPatch } } : b));
  }
  function updateStyle(id: string, stylePatch: Partial<BlockStyle>) {
    setBlocks(bs => bs.map(b => b.id === id ? { ...b, style: { ...(b.style ?? {}), ...stylePatch } } : b));
  }
  function moveBlock(id: string, dir: -1 | 1) {
    setBlocks(bs => {
      const i = bs.findIndex(b => b.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= bs.length) return bs;
      const copy = [...bs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }
  function duplicateBlock(id: string) {
    setBlocks(bs => {
      const i = bs.findIndex(b => b.id === id);
      if (i < 0) return bs;
      const orig = bs[i];
      const copy: Block = { ...orig, id: `b_${Math.random().toString(36).slice(2, 10)}` };
      return [...bs.slice(0, i + 1), copy, ...bs.slice(i + 1)];
    });
  }
  function deleteBlock(id: string) {
    if (!confirm("Delete this block? This can't be undone (until you Save / Exit).")) return;
    setBlocks(bs => bs.filter(b => b.id !== id));
    setSelected(null);
  }
  function insertAt(idx: number, type: Parameters<typeof makeBlock>[0]) {
    const b = makeBlock(type);
    setBlocks(bs => [...bs.slice(0, idx), b, ...bs.slice(idx)]);
    setAddOpenAt(null);
    setSelected(b.id);
  }

  async function save() {
    setSaving(true); setSaveMsg(null);
    try {
      const res = await authFetch(`${API_BASE}/admin/portfolio/${portfolioId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setSaveMsg(`Save failed: ${(e as { error?: string }).error ?? res.status}`);
      } else {
        setSaveMsg("Saved ✓");
        dirtyRef.current = false;
        onSaved?.(blocks);
        setTimeout(() => setSaveMsg(null), 2500);
      }
    } catch {
      setSaveMsg("Network error - try again.");
    } finally {
      setSaving(false);
    }
  }
  function exitEditor() {
    if (dirtyRef.current && !confirm("You have unsaved changes. Leave anyway?")) return;
    onExit?.();
  }

  return (
    <div
      onClick={() => setSelected(null)}
      style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Floating top bar ─────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 16px", background: "rgba(10,10,10,0.95)", color: "#fff",
        borderBottom: `1px solid ${ACCENT}`,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: ACCENT }}>
          Editing
        </span>
        <span style={{ fontSize: 13, color: "#fff", opacity: 0.85 }}>
          Click any text or image to edit · Hover a block for tools
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {saveMsg && <span style={{ fontSize: 13, color: saveMsg.startsWith("Saved") ? "#84cc16" : "#f87171" }}>{saveMsg}</span>}
          <button onClick={exitEditor} disabled={saving} style={btn("ghost")}><X size={14} /> Exit</button>
          <button onClick={save} disabled={saving} style={btn("primary")}>
            <Save size={14} /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {blocks.length === 0 && (
        <div style={{ padding: 60, textAlign: "center", color: MUTED }}>
          <p style={{ fontSize: 15, marginBottom: 14 }}>No blocks yet. Add your first one:</p>
          <AddBlockMenu onPick={(t) => insertAt(0, t)} onClose={() => {}} alwaysOpen />
        </div>
      )}

      {/* ── Block list - visual mirror of BlockRenderer ─────────────── */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {blocks.map((b, i) => (
          <React.Fragment key={b.id}>
            {draggingId && dropIndex === i && <div style={{ height: 3, background: ACCENT, margin: "0 auto", maxWidth: 960 }} />}
            <InsertSlot
              isOpen={addOpenAt === i}
              onToggle={(e) => { e.stopPropagation(); setAddOpenAt(addOpenAt === i ? null : i); }}
              onPick={(t) => insertAt(i, t)}
            />
            <BlockShell
              block={b}
              selected={selected === b.id}
              onSelect={() => setSelected(b.id)}
              onMoveUp={i > 0 ? () => moveBlock(b.id, -1) : undefined}
              onMoveDown={i < blocks.length - 1 ? () => moveBlock(b.id, 1) : undefined}
              onDuplicate={() => duplicateBlock(b.id)}
              onDelete={() => deleteBlock(b.id)}
              onUpdateProps={(p) => updateProps(b.id, p)}
              onUpdateStyle={(s) => updateStyle(b.id, s)}
              onDragStart={() => setDraggingId(b.id)}
              onDragOver={() => setDropIndex(i)}
              onDragEnd={() => { setDraggingId(null); setDropIndex(null); }}
              onDrop={() => {
                if (draggingId && draggingId !== b.id && dropIndex !== null) {
                  setBlocks(bs => {
                    const from = bs.findIndex(x => x.id === draggingId);
                    if (from < 0) return bs;
                    const moving = bs[from];
                    const without = bs.filter(x => x.id !== draggingId);
                    const dst = dropIndex > from ? dropIndex - 1 : dropIndex;
                    return [...without.slice(0, dst), moving, ...without.slice(dst)];
                  });
                }
                setDraggingId(null); setDropIndex(null);
              }}
            />
          </React.Fragment>
        ))}
        <InsertSlot
          isOpen={addOpenAt === blocks.length}
          onToggle={(e) => { e.stopPropagation(); setAddOpenAt(addOpenAt === blocks.length ? null : blocks.length); }}
          onPick={(t) => insertAt(blocks.length, t)}
        />
      </div>

      {/* Tail spacer so the last block isn't flush against the viewport */}
      <div style={{ height: 120 }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Container - mirrors BlockRenderer's <Container> exactly so edit-mode layout
// matches public-mode 1:1.
// ─────────────────────────────────────────────────────────────────────────────

function applyStyle(style?: BlockStyle): React.CSSProperties {
  if (!style) return {};
  const css: React.CSSProperties = {};
  if (style.padding) css.padding = style.padding;
  if (style.margin) css.margin = style.margin;
  if (style.bg) css.background = style.bg;
  if (style.color) css.color = style.color;
  if (style.align) css.textAlign = style.align;
  return css;
}
function Container({ block, children }: { block: Block; children: React.ReactNode }) {
  const max = block.style?.maxWidth ?? 960;
  return (
    <div style={{ ...applyStyle(block.style), width: "100%" }}>
      <div style={{ maxWidth: max, margin: "0 auto", padding: "0 24px" }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BlockShell - wraps one block. Visual matches BlockRenderer's outer wrapper
// (padding "20px 0"). All editing chrome is layered absolutely so it never
// shifts content.
// ─────────────────────────────────────────────────────────────────────────────

interface ShellProps {
  block: Block;
  selected: boolean;
  onSelect: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUpdateProps: (p: Record<string, unknown>) => void;
  onUpdateStyle: (s: Partial<BlockStyle>) => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
}

function BlockShell({
  block, selected, onSelect, onMoveUp, onMoveDown, onDuplicate, onDelete,
  onUpdateProps, onUpdateStyle, onDragStart, onDragOver, onDragEnd, onDrop,
}: ShellProps) {
  const [hover, setHover] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const outlined = hover || selected;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      style={{
        position: "relative",
        padding: "20px 0",                  // matches BlockRenderer outer wrapper
        outline: outlined ? `2px solid ${selected ? ACCENT : "rgba(59,130,246,0.35)"}` : "2px solid transparent",
        outlineOffset: -2,
        transition: "outline-color 120ms",
      }}
    >
      {/* Hover/selected toolbar - absolute, doesn't affect layout */}
      {outlined && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", top: -10, left: 16, zIndex: 50,
            display: "flex", gap: 2, padding: 4,
            background: SLATE, color: "#fff", borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
          }}
        >
          <span draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
            title="Drag to reorder" style={{ ...tbBtn, cursor: "grab", padding: "4px 8px", fontWeight: 700 }}>⋮⋮</span>
          <button title="Move up" onClick={onMoveUp} disabled={!onMoveUp} style={tbBtn}><ArrowUp size={14} /></button>
          <button title="Move down" onClick={onMoveDown} disabled={!onMoveDown} style={tbBtn}><ArrowDown size={14} /></button>
          <button title="Duplicate" onClick={onDuplicate} style={tbBtn}><Copy size={14} /></button>
          <button title="Block settings" onClick={() => setShowSettings(s => !s)} style={tbBtn}><Settings2 size={14} /></button>
          <button title="Delete" onClick={onDelete} style={{ ...tbBtn, color: "#fca5a5" }}><Trash2 size={14} /></button>
          {/* Per-type quick controls in the toolbar so block content stays pure */}
          <BlockQuickControls block={block} onUpdateProps={onUpdateProps} />
          <span style={{ fontSize: 11, padding: "4px 8px", opacity: 0.6 }}>{block.type}</span>
        </div>
      )}

      {showSettings && <SettingsPanel block={block} onUpdateStyle={onUpdateStyle} onClose={() => setShowSettings(false)} />}

      <EditableBlock block={block} onUpdateProps={onUpdateProps} />
    </div>
  );
}

// Per-type secondary toolbar (heading level, image width, etc.) - kept INSIDE
// the dark toolbar bar so it never leaks into the content area.
function BlockQuickControls({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  switch (block.type) {
    case "heading":
      return (
        <select value={(block.props.level as number) ?? 2}
          onChange={(e) => onUpdateProps({ level: Number(e.target.value) })}
          onClick={(e) => e.stopPropagation()} style={tbSelect}>
          <option value={1}>H1</option><option value={2}>H2</option><option value={3}>H3</option>
        </select>
      );
    case "image":
      return (
        <select value={(block.props.width as string) ?? "normal"}
          onChange={(e) => onUpdateProps({ width: e.target.value })}
          onClick={(e) => e.stopPropagation()} style={tbSelect}>
          <option value="normal">Normal</option><option value="wide">Wide</option><option value="full">Full</option>
        </select>
      );
    case "bulletList":
      return (
        <select value={(block.props.style as string) ?? "check"}
          onChange={(e) => onUpdateProps({ style: e.target.value })}
          onClick={(e) => e.stopPropagation()} style={tbSelect}>
          <option value="check">✓ Check</option><option value="dot">• Dot</option>
        </select>
      );
    case "gallery":
      return (
        <select value={(block.props.columns as number) ?? 2}
          onChange={(e) => onUpdateProps({ columns: Number(e.target.value) })}
          onClick={(e) => e.stopPropagation()} style={tbSelect}>
          <option value={2}>2 cols</option><option value={3}>3 cols</option>
        </select>
      );
    case "button":
      return (
        <select value={(block.props.variant as string) ?? "primary"}
          onChange={(e) => onUpdateProps({ variant: e.target.value })}
          onClick={(e) => e.stopPropagation()} style={tbSelect}>
          <option value="primary">Primary</option><option value="secondary">Secondary</option>
        </select>
      );
    case "spacer":
      return (
        <select value={(block.props.size as string) ?? "md"}
          onChange={(e) => onUpdateProps({ size: e.target.value })}
          onClick={(e) => e.stopPropagation()} style={tbSelect}>
          <option value="sm">Small</option><option value="md">Med</option><option value="lg">Large</option><option value="xl">XL</option>
        </select>
      );
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EditableBlock - picks the right editor per block type. Each editor mirrors
// the public BlockRenderer styling exactly. Blocks with no editable inline
// surface (divider, spacer, columns) defer to BlockRenderer directly.
// ─────────────────────────────────────────────────────────────────────────────

function EditableBlock({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  switch (block.type) {
    case "heading":     return <EditHeading block={block} onUpdateProps={onUpdateProps} />;
    case "paragraph":   return <EditParagraph block={block} onUpdateProps={onUpdateProps} />;
    case "image":       return <EditImage block={block} onUpdateProps={onUpdateProps} />;
    case "video":       return <EditVideo block={block} onUpdateProps={onUpdateProps} />;
    case "metricsGrid": return <EditMetricsGrid block={block} onUpdateProps={onUpdateProps} />;
    case "bulletList":  return <EditBulletList block={block} onUpdateProps={onUpdateProps} />;
    case "testimonial": return <EditTestimonial block={block} onUpdateProps={onUpdateProps} />;
    case "tagList":     return <EditTagList block={block} onUpdateProps={onUpdateProps} />;
    case "gallery":     return <EditGallery block={block} onUpdateProps={onUpdateProps} />;
    case "button":      return <EditButton block={block} onUpdateProps={onUpdateProps} />;
    default:
      // divider, spacer, columns - no editable text/image surface, just render.
      return <BlockRenderer blocks={[block]} />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline editable primitives - contentEditable kept in a ref to avoid React
// re-mount caret jumps. innerText/innerHTML is synced ONCE on mount; further
// updates come from blur only.
// ─────────────────────────────────────────────────────────────────────────────

function InlineText({ value, onChange, style, placeholder, multiline, as: As = "span" }: {
  value: string; onChange: (v: string) => void; style?: React.CSSProperties;
  placeholder?: string; multiline?: boolean; as?: keyof React.JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) ref.current.innerText = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const placeholderCSS: React.CSSProperties = !value ? { minHeight: "1em", opacity: 0.55 } : {};
  return React.createElement(As as string, {
    ref,
    contentEditable: true,
    suppressContentEditableWarning: true,
    "data-placeholder": placeholder ?? "",
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onBlur: (e: React.FocusEvent<HTMLElement>) => onChange(e.currentTarget.innerText),
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (!multiline && e.key === "Enter") { e.preventDefault(); (e.target as HTMLElement).blur(); }
      if (e.key === "Escape") (e.target as HTMLElement).blur();
    },
    style: { outline: "none", ...placeholderCSS, ...style },
  });
}

function InlineHTML({ html, onChange, style }: { html: string; onChange: (v: string) => void; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== html) ref.current.innerHTML = html;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => onChange(e.currentTarget.innerHTML)}
      style={{ outline: "none", ...style }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-type editors - each mirrors BlockRenderer's exact markup + styles.
// ─────────────────────────────────────────────────────────────────────────────

function EditHeading({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const level = (block.props.level as number) ?? 2;
  const text = (block.props.text as string) ?? "";
  const eyebrow = (block.props.eyebrow as string) ?? "";
  const sizes: Record<number, number> = { 1: 48, 2: 34, 3: 22 };
  const fontSize = sizes[level] ?? 28;
  const Tag = (level === 1 ? "h1" : level === 2 ? "h2" : "h3") as keyof React.JSX.IntrinsicElements;
  return (
    <Container block={block}>
      <InlineText as="p" value={eyebrow} onChange={(v) => onUpdateProps({ eyebrow: v })} placeholder="Eyebrow (optional)"
        style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, margin: "0 0 12px 0", display: eyebrow || true ? "block" : "none" }} />
      <InlineText as={Tag} value={text} onChange={(v) => onUpdateProps({ text: v })} placeholder="Heading…"
        style={{ fontSize, lineHeight: 1.15, color: SLATE, fontWeight: 800, margin: 0, letterSpacing: "-0.01em", display: "block" }} />
    </Container>
  );
}

function EditParagraph({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const html = (block.props.html as string) ?? "";
  return (
    <Container block={block}>
      <InlineHTML html={html} onChange={(v) => onUpdateProps({ html: v })}
        style={{ fontSize: 17, lineHeight: 1.7, color: MUTED, minHeight: "1.7em" }} />
    </Container>
  );
}

function EditImage({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const { authFetch } = useAdmin();
  const src = (block.props.src as string) ?? "";
  const alt = (block.props.alt as string) ?? "";
  const caption = (block.props.caption as string) ?? "";
  const width = (block.props.width as "full" | "wide" | "normal") ?? "normal";
  const widths = { full: 1400, wide: 1100, normal: 880 };
  const max = widths[width] ?? 880;
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await authFetch(`${API_BASE}/admin/upload`, { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json() as { url: string };
        onUpdateProps({ src: resolveMediaUrl(url) });
      } else { alert(`Upload failed (${res.status})`); }
    } catch { alert("Upload network error"); }
    finally { setUploading(false); }
  }

  return (
    <div style={{ ...applyStyle(block.style), width: "100%" }}>
      <figure style={{ maxWidth: max, margin: "0 auto", padding: "0 24px" }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }} />
        <div
          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
          style={{ position: "relative", borderRadius: 12, overflow: "hidden", cursor: "pointer",
                   background: src ? "transparent" : "#F2F0EB", minHeight: src ? undefined : 240 }}
          title="Click to upload / replace image"
        >
          {src ? (
            <img src={src} alt={alt} style={{ width: "100%", borderRadius: 12, display: "block" }} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, color: MUTED, fontSize: 14 }}>
              <ImagePlus size={18} style={{ marginRight: 8 }} /> Click to upload image
            </div>
          )}
          {src && (
            <span style={{ position: "absolute", top: 10, right: 10, padding: "6px 12px",
              background: "rgba(10,10,10,0.85)", color: "#fff", borderRadius: 999,
              fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6,
              opacity: uploading ? 0.6 : 0.95 }}>
              <ImagePlus size={14} /> {uploading ? "Uploading…" : "Replace"}
            </span>
          )}
        </div>
        <InlineText as="figcaption" value={caption} onChange={(v) => onUpdateProps({ caption: v })} placeholder="Caption (optional)"
          style={{ fontSize: 13, color: MUTED, marginTop: 10, textAlign: "center", display: "block" }} />
      </figure>
    </div>
  );
}

function EditVideo({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const url = (block.props.url as string) ?? "";
  return (
    <Container block={block}>
      {url ? (
        <>
          <BlockRenderer blocks={[{ ...block, style: undefined }]} />
          <input value={url} onChange={(e) => onUpdateProps({ url: e.target.value })} onClick={(e) => e.stopPropagation()}
            placeholder="Video URL"
            style={{ width: "100%", marginTop: 10, padding: "8px 12px", border: `1px solid ${RULE}`, borderRadius: 6, fontSize: 13, color: MUTED }} />
        </>
      ) : (
        <div style={{ background: "#F2F0EB", borderRadius: 12, padding: 32, textAlign: "center" }}>
          <input value={url} onChange={(e) => onUpdateProps({ url: e.target.value })} onClick={(e) => e.stopPropagation()}
            placeholder="Paste YouTube / Vimeo / Gumlet URL here"
            style={{ width: "100%", maxWidth: 480, padding: "10px 14px", border: `1px solid ${RULE}`, borderRadius: 6, fontSize: 14 }} />
        </div>
      )}
    </Container>
  );
}

function EditMetricsGrid({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const items = (block.props.items as Array<{ value: string; label: string }>) ?? [];
  const update = (i: number, k: "value" | "label", v: string) => {
    onUpdateProps({ items: items.map((m, idx) => idx === i ? { ...m, [k]: v } : m) });
  };
  return (
    <Container block={block}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`, gap: 16 }}>
        {items.map((m, i) => (
          <div key={i} style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 12, padding: "22px 18px", position: "relative" }}>
            <InlineText as="div" value={m.value} onChange={(v) => update(i, "value", v)} placeholder="+200%"
              style={{ fontSize: 28, fontWeight: 800, color: SLATE, letterSpacing: "-0.01em" }} />
            <InlineText as="div" value={m.label} onChange={(v) => update(i, "label", v)} placeholder="Label"
              style={{ fontSize: 13, color: MUTED, marginTop: 6 }} />
            <button onClick={(e) => { e.stopPropagation(); onUpdateProps({ items: items.filter((_, idx) => idx !== i) }); }}
              style={cornerXBtn} title="Remove metric"><X size={12} /></button>
          </div>
        ))}
        <button onClick={(e) => { e.stopPropagation(); onUpdateProps({ items: [...items, { value: "", label: "" }] }); }}
          style={addCardBtn} title="Add metric"><Plus size={16} /> Add</button>
      </div>
    </Container>
  );
}

function EditBulletList({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const items = (block.props.items as string[]) ?? [];
  const variant = ((block.props.style as string) ?? "check") as "check" | "dot";
  return (
    <Container block={block}>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 0", fontSize: 16, color: TEXT, position: "relative" }}>
            <span style={{ color: GOLD, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>{variant === "check" ? "✓" : "•"}</span>
            <InlineText as="span" value={it} onChange={(v) => onUpdateProps({ items: items.map((x, idx) => idx === i ? v : x) })}
              placeholder="List item" multiline style={{ lineHeight: 1.6, flex: 1, display: "block" }} />
            <button onClick={(e) => { e.stopPropagation(); onUpdateProps({ items: items.filter((_, idx) => idx !== i) }); }}
              style={{ ...cornerXBtn, position: "static", marginLeft: 8, alignSelf: "center" }} title="Remove"><X size={12} /></button>
          </li>
        ))}
      </ul>
      <button onClick={(e) => { e.stopPropagation(); onUpdateProps({ items: [...items, ""] }); }}
        style={{ ...addLinkBtn, marginTop: 8 }}><Plus size={14} /> Add item</button>
    </Container>
  );
}

function EditTestimonial({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const quote = (block.props.quote as string) ?? "";
  const author = (block.props.author as string) ?? "";
  const role = (block.props.role as string) ?? "";
  return (
    <Container block={block}>
      <blockquote style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 14, padding: "30px 28px", margin: 0 }}>
        <InlineText as="p" value={quote} onChange={(v) => onUpdateProps({ quote: v })} placeholder="Quote…" multiline
          style={{ fontSize: 20, lineHeight: 1.55, color: SLATE, margin: 0, fontStyle: "italic" }} />
        <footer style={{ marginTop: 18, fontSize: 14, color: MUTED }}>
          <InlineText as="strong" value={author} onChange={(v) => onUpdateProps({ author: v })} placeholder="Author"
            style={{ color: TEXT, fontWeight: 700 }} />
          <span> · </span>
          <InlineText as="span" value={role} onChange={(v) => onUpdateProps({ role: v })} placeholder="Role" />
        </footer>
      </blockquote>
    </Container>
  );
}

function EditTagList({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const items = (block.props.items as string[]) ?? [];
  const label = (block.props.label as string) ?? "";
  return (
    <Container block={block}>
      <InlineText as="p" value={label} onChange={(v) => onUpdateProps({ label: v })} placeholder="Label (optional)"
        style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, margin: "0 0 10px 0" }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((t, i) => (
          <span key={i} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 999, background: CARD, border: `1px solid ${RULE}`, color: SLATE, display: "inline-flex", gap: 6, alignItems: "center" }}>
            <InlineText as="span" value={t} onChange={(v) => onUpdateProps({ items: items.map((x, idx) => idx === i ? v : x) })} placeholder="Tag" />
            <button onClick={(e) => { e.stopPropagation(); onUpdateProps({ items: items.filter((_, idx) => idx !== i) }); }}
              style={{ background: "transparent", border: 0, cursor: "pointer", color: MUTED, padding: 0 }} title="Remove tag"><X size={11} /></button>
          </span>
        ))}
        <button onClick={(e) => { e.stopPropagation(); onUpdateProps({ items: [...items, "New tag"] }); }}
          style={{ fontSize: 13, padding: "6px 12px", borderRadius: 999, background: "transparent", border: `1px dashed ${ACCENT}`, color: ACCENT, cursor: "pointer" }}>
          <Plus size={12} style={{ display: "inline", marginRight: 4 }} /> Add tag
        </button>
      </div>
    </Container>
  );
}

function EditGallery({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const { authFetch } = useAdmin();
  const images = (block.props.images as string[]) ?? [];
  const cols = (block.props.columns as number) ?? 2;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function addFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await authFetch(`${API_BASE}/admin/upload`, { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json() as { url: string };
        onUpdateProps({ images: [...images, resolveMediaUrl(url)] });
      }
    } finally { setUploading(false); }
  }

  return (
    <Container block={block}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) addFile(f); e.currentTarget.value = ""; }} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }}>
        {images.map((src, i) => (
          <div key={i} style={{ position: "relative" }}>
            <img src={src} alt="" style={{ width: "100%", borderRadius: 10, display: "block" }} />
            <button onClick={(e) => { e.stopPropagation(); onUpdateProps({ images: images.filter((_, idx) => idx !== i) }); }}
              style={cornerXBtn} title="Remove image"><X size={12} /></button>
          </div>
        ))}
        <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }} disabled={uploading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            background: "#F2F0EB", color: ACCENT, border: `1px dashed ${ACCENT}`,
            borderRadius: 10, minHeight: 140, fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}><Plus size={16} /> {uploading ? "Uploading…" : "Add image"}</button>
      </div>
    </Container>
  );
}

function EditButton({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const label = (block.props.label as string) ?? "";
  const href = (block.props.href as string) ?? "";
  const variant = ((block.props.variant as string) ?? "primary") as "primary" | "secondary";
  const primary = variant === "primary";
  return (
    <Container block={block}>
      <span style={{
        display: "inline-block", padding: "12px 22px", borderRadius: 999, fontSize: 14, fontWeight: 700,
        background: primary ? SLATE : "transparent", color: primary ? BG : SLATE, border: `1px solid ${SLATE}`,
      }}>
        <InlineText as="span" value={label} onChange={(v) => onUpdateProps({ label: v })} placeholder="Button label" />
      </span>
      <input value={href} onChange={(e) => onUpdateProps({ href: e.target.value })} onClick={(e) => e.stopPropagation()}
        placeholder="Link URL (e.g. /contact)"
        style={{ display: "block", marginTop: 10, width: "100%", maxWidth: 360, padding: "6px 10px", border: `1px solid ${RULE}`, borderRadius: 6, fontSize: 12, color: MUTED }} />
    </Container>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings popover (per-block style)
// ─────────────────────────────────────────────────────────────────────────────

function SettingsPanel({ block, onUpdateStyle, onClose }: { block: Block; onUpdateStyle: (s: Partial<BlockStyle>) => void; onClose: () => void }) {
  const s = block.style ?? {};
  return (
    <div onClick={(e) => e.stopPropagation()} style={{
      position: "absolute", top: 24, right: 16, zIndex: 60, width: 260,
      background: "#fff", border: `1px solid ${RULE}`, borderRadius: 10, padding: 14,
      boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <strong style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: SLATE }}>Block settings</strong>
        <button onClick={onClose} style={{ background: "transparent", border: 0, cursor: "pointer", color: MUTED }}><X size={14} /></button>
      </div>
      <Row label="Background">
        <input type="color" value={s.bg ?? "#ffffff"} onChange={(e) => onUpdateStyle({ bg: e.target.value })} style={colorInp} />
        <button onClick={() => onUpdateStyle({ bg: undefined })} style={smallBtn}>Clear</button>
      </Row>
      <Row label="Text color">
        <input type="color" value={s.color ?? "#0A0A0A"} onChange={(e) => onUpdateStyle({ color: e.target.value })} style={colorInp} />
        <button onClick={() => onUpdateStyle({ color: undefined })} style={smallBtn}>Clear</button>
      </Row>
      <Row label="Align">
        <select value={s.align ?? "left"} onChange={(e) => onUpdateStyle({ align: e.target.value as BlockStyle["align"] })} style={selectInp}>
          <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
        </select>
      </Row>
      <Row label="Padding">
        <input value={s.padding ?? ""} placeholder="e.g. 40px 0"
          onChange={(e) => onUpdateStyle({ padding: e.target.value || undefined })} style={txtInp} />
      </Row>
      <Row label="Max width">
        <input type="number" value={s.maxWidth ?? ""} placeholder="960"
          onChange={(e) => onUpdateStyle({ maxWidth: e.target.value ? Number(e.target.value) : undefined })} style={txtInp} />
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: MUTED, minWidth: 90 }}>{label}</span>
      <span style={{ display: "flex", gap: 6, alignItems: "center" }}>{children}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Insert slot between blocks
// ─────────────────────────────────────────────────────────────────────────────

function InsertSlot({ isOpen, onToggle, onPick }: {
  isOpen: boolean; onToggle: (e: React.MouseEvent) => void;
  onPick: (t: Parameters<typeof makeBlock>[0]) => void;
}) {
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center", padding: "2px 0" }}>
      <button onClick={onToggle} title="Add block here"
        style={{
          width: 26, height: 26, borderRadius: "50%", background: isOpen ? ACCENT : "#fff",
          color: isOpen ? "#fff" : ACCENT, border: `1px solid ${ACCENT}`, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 6px rgba(59,130,246,0.18)", opacity: isOpen ? 1 : 0.7,
        }}
      ><Plus size={14} /></button>
      {isOpen && <AddBlockMenu onPick={onPick} onClose={() => onToggle({ stopPropagation: () => {} } as React.MouseEvent)} />}
    </div>
  );
}

function AddBlockMenu({ onPick, onClose, alwaysOpen }: {
  onPick: (t: Parameters<typeof makeBlock>[0]) => void; onClose: () => void; alwaysOpen?: boolean;
}) {
  return (
    <div onClick={(e) => e.stopPropagation()} style={{
      ...(alwaysOpen ? { position: "static", display: "inline-block" } : { position: "absolute", top: 32, zIndex: 70 }),
      background: "#fff", border: `1px solid ${RULE}`, borderRadius: 10, padding: 8,
      boxShadow: "0 10px 30px rgba(0,0,0,0.12)", minWidth: 280,
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        {ADDABLE_BLOCKS.map(b => (
          <button key={b.type} onClick={() => { onPick(b.type); if (!alwaysOpen) onClose(); }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "10px 6px", border: `1px solid ${RULE}`, borderRadius: 6,
              background: "#fff", cursor: "pointer", fontSize: 11, color: SLATE,
            }}
          >
            <span style={{ fontSize: 18 }}>{b.icon}</span>
            <span>{b.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Style helpers
// ─────────────────────────────────────────────────────────────────────────────

const tbBtn: React.CSSProperties = {
  background: "transparent", color: "#fff", border: 0, padding: "4px 6px",
  borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center",
};
const tbSelect: React.CSSProperties = {
  background: "rgba(255,255,255,0.1)", color: "#fff", border: `1px solid rgba(255,255,255,0.2)`,
  borderRadius: 4, fontSize: 11, padding: "2px 4px", marginLeft: 4,
};
const cornerXBtn: React.CSSProperties = {
  position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%",
  background: "rgba(10,10,10,0.85)", color: "#fff", border: 0, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const addCardBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  background: "transparent", color: ACCENT, border: `1px dashed ${ACCENT}`,
  borderRadius: 12, padding: "22px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
};
const addLinkBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700,
  color: ACCENT, background: "transparent", border: `1px dashed ${ACCENT}`,
  padding: "6px 12px", borderRadius: 6, cursor: "pointer",
};
const colorInp: React.CSSProperties = { width: 36, height: 28, padding: 0, border: `1px solid ${RULE}`, borderRadius: 4 };
const selectInp: React.CSSProperties = { fontSize: 12, padding: "4px 8px", border: `1px solid ${RULE}`, borderRadius: 4 };
const txtInp: React.CSSProperties = { fontSize: 12, padding: "4px 8px", border: `1px solid ${RULE}`, borderRadius: 4, width: 110 };
const smallBtn: React.CSSProperties = { fontSize: 11, padding: "3px 6px", border: `1px solid ${RULE}`, borderRadius: 4, background: "#fff", cursor: "pointer", color: MUTED };

function btn(variant: "primary" | "ghost"): React.CSSProperties {
  if (variant === "primary") {
    return { display: "inline-flex", alignItems: "center", gap: 6,
      background: ACCENT, color: "#fff", border: 0, padding: "8px 14px",
      borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" };
  }
  return { display: "inline-flex", alignItems: "center", gap: 6,
    background: "transparent", color: "#fff", border: `1px solid rgba(255,255,255,0.25)`,
    padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" };
}
