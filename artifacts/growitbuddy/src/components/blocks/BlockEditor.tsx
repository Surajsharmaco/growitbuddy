import React, { useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowDown, Copy, Trash2, Plus, X, Save, ImagePlus, Settings2 } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { API_BASE, resolveMediaUrl } from "@/lib/api";
import BlockRenderer, { type Block, type BlockStyle } from "./BlockRenderer";
import { makeBlock, ADDABLE_BLOCKS } from "./blockDefaults";

// ─────────────────────────────────────────────────────────────────────────────
// BlockEditor — Wix/Elementor-style inline editor for Case Study pages.
//
// What works (Phase 2 + 3 + parts of 5 in one pass):
//   • Click any text → edit inline (contentEditable, native, no library)
//   • Click any image → upload replacement (via existing /admin/upload)
//   • Hover a block → outline + toolbar (↑ ↓ duplicate delete settings)
//   • "+" button between every block → add a new block
//   • Drag block by its handle to reorder (native HTML5 DnD)
//   • Floating top bar: Save / Cancel / Add block at end
//   • Settings popover per block: background color, text color, padding,
//     alignment, max width
//
// Phase 4 (side-by-side columns) and Phase 6 (one-shot legacy migrator
// button on the public page) live elsewhere — this file is the editor only.
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C2A878";
const SLATE = "#1E293B";
const CARD = "#FFFFFF";
const RULE = "#E5E5E0";
const MUTED = "#5F5F5F";
const ACCENT = "#3B82F6"; // editor blue (only visible in edit mode)

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

  // Track unsaved changes for browser-close warning.
  const dirtyRef = useRef(false);
  useEffect(() => { dirtyRef.current = JSON.stringify(initialBlocks) !== JSON.stringify(blocks); }, [blocks, initialBlocks]);
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  function updateBlock(id: string, patch: Partial<Block> | ((b: Block) => Block)) {
    setBlocks(bs => bs.map(b => b.id === id ? (typeof patch === "function" ? patch(b) : { ...b, ...patch }) : b));
  }
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
    if (!confirm("Delete this block? This can't be undone (until you Save / Cancel).")) return;
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
      setSaveMsg("Network error — try again.");
    } finally {
      setSaving(false);
    }
  }

  function exitEditor() {
    if (dirtyRef.current && !confirm("You have unsaved changes. Leave anyway?")) return;
    onExit?.();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6", paddingBottom: 200 }}>
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

      {/* ── Block list ───────────────────────────────────────────────── */}
      <div>
        {blocks.map((b, i) => (
          <React.Fragment key={b.id}>
            {/* Drop indicator */}
            {draggingId && dropIndex === i && <div style={{ height: 3, background: ACCENT, margin: "0 auto", maxWidth: 960 }} />}

            {/* "+" between blocks */}
            <InsertSlot
              isOpen={addOpenAt === i}
              onToggle={() => setAddOpenAt(addOpenAt === i ? null : i)}
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
                    const insertAt = dropIndex > from ? dropIndex - 1 : dropIndex;
                    return [...without.slice(0, insertAt), moving, ...without.slice(insertAt)];
                  });
                }
                setDraggingId(null); setDropIndex(null);
              }}
            />
          </React.Fragment>
        ))}

        {/* "+" at the end */}
        <InsertSlot
          isOpen={addOpenAt === blocks.length}
          onToggle={() => setAddOpenAt(addOpenAt === blocks.length ? null : blocks.length)}
          onPick={(t) => insertAt(blocks.length, t)}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BlockShell — wraps one block with outline, toolbar, and editable handlers.
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
        outline: outlined ? `2px solid ${selected ? ACCENT : "rgba(59,130,246,0.4)"}` : "2px solid transparent",
        outlineOffset: -2,
        margin: "12px 0",
        transition: "outline-color 120ms",
      }}
    >
      {/* Hover/selected toolbar */}
      {outlined && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", top: -34, left: 8, zIndex: 50,
            display: "flex", gap: 4, padding: 4,
            background: SLATE, color: "#fff", borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
          }}
        >
          <span
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            title="Drag to reorder"
            style={{ ...tbBtn, cursor: "grab", padding: "4px 8px", fontWeight: 700 }}
          >⋮⋮</span>
          <button title="Move up" onClick={onMoveUp} disabled={!onMoveUp} style={tbBtn}><ArrowUp size={14} /></button>
          <button title="Move down" onClick={onMoveDown} disabled={!onMoveDown} style={tbBtn}><ArrowDown size={14} /></button>
          <button title="Duplicate" onClick={onDuplicate} style={tbBtn}><Copy size={14} /></button>
          <button title="Settings" onClick={() => setShowSettings(s => !s)} style={tbBtn}><Settings2 size={14} /></button>
          <button title="Delete" onClick={onDelete} style={{ ...tbBtn, color: "#fca5a5" }}><Trash2 size={14} /></button>
          <span style={{ fontSize: 11, padding: "4px 8px", opacity: 0.6 }}>{block.type}</span>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel block={block} onUpdateStyle={onUpdateStyle} onClose={() => setShowSettings(false)} />
      )}

      {/* Editable content based on block type */}
      <EditableBlock block={block} onUpdateProps={onUpdateProps} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EditableBlock — renders the block AND makes its content directly editable.
// Falls back to read-only BlockRenderer for blocks with no editable props.
// ─────────────────────────────────────────────────────────────────────────────

function EditableBlock({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  switch (block.type) {
    case "heading":      return <EditHeading block={block} onUpdateProps={onUpdateProps} />;
    case "paragraph":    return <EditParagraph block={block} onUpdateProps={onUpdateProps} />;
    case "image":        return <EditImage block={block} onUpdateProps={onUpdateProps} />;
    case "video":        return <EditVideo block={block} onUpdateProps={onUpdateProps} />;
    case "metricsGrid":  return <EditMetricsGrid block={block} onUpdateProps={onUpdateProps} />;
    case "bulletList":   return <EditBulletList block={block} onUpdateProps={onUpdateProps} />;
    case "testimonial":  return <EditTestimonial block={block} onUpdateProps={onUpdateProps} />;
    case "tagList":      return <EditTagList block={block} onUpdateProps={onUpdateProps} />;
    case "gallery":      return <EditGallery block={block} onUpdateProps={onUpdateProps} />;
    case "button":       return <EditButton block={block} onUpdateProps={onUpdateProps} />;
    default:             return <BlockRenderer blocks={[block]} />;
  }
}

// ── Inline-editable primitives ─────────────────────────────────────────────

function InlineText({ value, onChange, style, placeholder, multiline }: {
  value: string; onChange: (v: string) => void; style?: React.CSSProperties; placeholder?: string; multiline?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // Use a key to force re-mount only on initial value, not on every keystroke,
  // so the caret doesn't jump while typing.
  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder ?? ""}
      onBlur={(e) => onChange(e.currentTarget.innerText)}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") { e.preventDefault(); (e.target as HTMLElement).blur(); }
        if (e.key === "Escape") (e.target as HTMLElement).blur();
      }}
      style={{ outline: "none", display: "inline-block", minWidth: 24, ...style }}
    />
  );
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
      onBlur={(e) => onChange(e.currentTarget.innerHTML)}
      style={{ outline: "none", ...style }}
    />
  );
}

// ── Edit components per block type ─────────────────────────────────────────

function EditHeading({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const level = (block.props.level as number) ?? 2;
  const text = (block.props.text as string) ?? "";
  const eyebrow = (block.props.eyebrow as string) ?? "";
  const sizes: Record<number, number> = { 1: 48, 2: 34, 3: 22 };
  const fontSize = sizes[level] ?? 28;
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", textAlign: block.style?.align ?? "left" }}>
      <InlineText
        value={eyebrow}
        onChange={(v) => onUpdateProps({ eyebrow: v })}
        placeholder="Eyebrow (optional)"
        style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 12, minHeight: 16 }}
      />
      <div>
        <select
          value={level}
          onChange={(e) => onUpdateProps({ level: Number(e.target.value) })}
          onClick={(e) => e.stopPropagation()}
          style={{ fontSize: 10, padding: "2px 4px", marginRight: 8, border: `1px solid ${RULE}`, borderRadius: 4, background: "#fff" }}
        >
          <option value={1}>H1</option><option value={2}>H2</option><option value={3}>H3</option>
        </select>
        <InlineText
          value={text}
          onChange={(v) => onUpdateProps({ text: v })}
          placeholder="Type a heading…"
          style={{ fontSize, lineHeight: 1.15, color: SLATE, fontWeight: 800, letterSpacing: "-0.01em" }}
        />
      </div>
    </div>
  );
}

function EditParagraph({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const html = (block.props.html as string) ?? "";
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", textAlign: block.style?.align ?? "left" }}>
      <InlineHTML
        html={html}
        onChange={(v) => onUpdateProps({ html: v })}
        style={{ fontSize: 17, lineHeight: 1.7, color: MUTED, minHeight: 28 }}
      />
    </div>
  );
}

function EditImage({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const { authFetch } = useAdmin();
  const src = (block.props.src as string) ?? "";
  const alt = (block.props.alt as string) ?? "";
  const caption = (block.props.caption as string) ?? "";
  const width = (block.props.width as "full" | "wide" | "normal") ?? "normal";
  const widths = { full: 1400, wide: 1100, normal: 880 };
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
      } else {
        alert(`Upload failed (${res.status})`);
      }
    } catch { alert("Upload network error"); }
    finally { setUploading(false); }
  }

  return (
    <div style={{ width: "100%" }}>
      <figure style={{ maxWidth: widths[width], margin: "0 auto", padding: "0 24px" }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }} />
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#F2F0EB", aspectRatio: src ? undefined : "16/9" }}>
          {src ? (
            <img src={src} alt={alt} style={{ width: "100%", display: "block" }} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, color: MUTED, fontSize: 14, height: "100%" }}>
              <ImagePlus size={18} style={{ marginRight: 8 }} /> No image yet — click to upload
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
            disabled={uploading}
            style={{
              position: "absolute", top: 10, right: 10, padding: "6px 12px",
              background: "rgba(10,10,10,0.85)", color: "#fff", border: 0, borderRadius: 999,
              fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          ><ImagePlus size={14} /> {uploading ? "Uploading…" : src ? "Replace" : "Upload"}</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
          <select value={width} onChange={(e) => onUpdateProps({ width: e.target.value })} onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 12, padding: "4px 6px", border: `1px solid ${RULE}`, borderRadius: 4 }}>
            <option value="normal">Normal</option><option value="wide">Wide</option><option value="full">Full</option>
          </select>
          <input
            value={alt} onChange={(e) => onUpdateProps({ alt: e.target.value })} onClick={(e) => e.stopPropagation()}
            placeholder="Alt text (for accessibility)"
            style={{ flex: 1, fontSize: 12, padding: "4px 8px", border: `1px solid ${RULE}`, borderRadius: 4 }}
          />
        </div>
        <InlineText value={caption} onChange={(v) => onUpdateProps({ caption: v })} placeholder="Caption (optional)"
          style={{ display: "block", fontSize: 13, color: MUTED, marginTop: 8, textAlign: "center", minHeight: 18 }} />
      </figure>
    </div>
  );
}

function EditVideo({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const url = (block.props.url as string) ?? "";
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>
      <input
        value={url} onChange={(e) => onUpdateProps({ url: e.target.value })} onClick={(e) => e.stopPropagation()}
        placeholder="Paste YouTube / Vimeo / Gumlet URL or embed code"
        style={{ width: "100%", padding: "10px 12px", border: `1px solid ${RULE}`, borderRadius: 6, marginBottom: 10, fontSize: 14 }}
      />
      {url && <BlockRenderer blocks={[block]} />}
    </div>
  );
}

function EditMetricsGrid({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const items = (block.props.items as Array<{ value: string; label: string }>) ?? [];
  const update = (i: number, k: "value" | "label", v: string) => {
    const copy = items.map((m, idx) => idx === i ? { ...m, [k]: v } : m);
    onUpdateProps({ items: copy });
  };
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`, gap: 16 }}>
        {items.map((m, i) => (
          <div key={i} style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 12, padding: "22px 18px", position: "relative" }}>
            <InlineText value={m.value} onChange={(v) => update(i, "value", v)} placeholder="+200%"
              style={{ display: "block", fontSize: 28, fontWeight: 800, color: SLATE, letterSpacing: "-0.01em", minHeight: 32 }} />
            <InlineText value={m.label} onChange={(v) => update(i, "label", v)} placeholder="Label"
              style={{ display: "block", fontSize: 13, color: MUTED, marginTop: 6, minHeight: 18 }} />
            <button onClick={(e) => { e.stopPropagation(); onUpdateProps({ items: items.filter((_, idx) => idx !== i) }); }}
              style={iconBtnSmall} title="Remove metric"><X size={12} /></button>
          </div>
        ))}
        <button onClick={(e) => { e.stopPropagation(); onUpdateProps({ items: [...items, { value: "", label: "" }] }); }}
          style={{ ...addCardBtn }}><Plus size={16} /> Add</button>
      </div>
    </div>
  );
}

function EditBulletList({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const items = (block.props.items as string[]) ?? [];
  const variant = (block.props.style as string) ?? "check";
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>
      <select value={variant} onChange={(e) => onUpdateProps({ style: e.target.value })} onClick={(e) => e.stopPropagation()}
        style={{ fontSize: 12, padding: "4px 6px", border: `1px solid ${RULE}`, borderRadius: 4, marginBottom: 8 }}>
        <option value="check">✓ Check</option><option value="dot">• Dot</option>
      </select>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 0", fontSize: 16 }}>
            <span style={{ color: GOLD, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>{variant === "check" ? "✓" : "•"}</span>
            <span style={{ flex: 1 }}>
              <InlineText value={it} onChange={(v) => onUpdateProps({ items: items.map((x, idx) => idx === i ? v : x) })}
                placeholder="List item" multiline style={{ lineHeight: 1.6, display: "block", width: "100%" }} />
            </span>
            <button onClick={(e) => { e.stopPropagation(); onUpdateProps({ items: items.filter((_, idx) => idx !== i) }); }}
              style={iconBtnSmall} title="Remove"><X size={12} /></button>
          </li>
        ))}
      </ul>
      <button onClick={(e) => { e.stopPropagation(); onUpdateProps({ items: [...items, ""] }); }}
        style={{ ...addLinkBtn, marginTop: 6 }}><Plus size={14} /> Add item</button>
    </div>
  );
}

function EditTestimonial({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const quote = (block.props.quote as string) ?? "";
  const author = (block.props.author as string) ?? "";
  const role = (block.props.role as string) ?? "";
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>
      <blockquote style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 14, padding: "30px 28px", margin: 0 }}>
        <InlineText value={quote} onChange={(v) => onUpdateProps({ quote: v })} placeholder="Their quote…" multiline
          style={{ display: "block", fontSize: 20, lineHeight: 1.55, color: SLATE, fontStyle: "italic", minHeight: 30 }} />
        <footer style={{ marginTop: 18, fontSize: 14, color: MUTED }}>
          <strong style={{ color: SLATE }}>
            <InlineText value={author} onChange={(v) => onUpdateProps({ author: v })} placeholder="Author name" />
          </strong>
          {" · "}
          <InlineText value={role} onChange={(v) => onUpdateProps({ role: v })} placeholder="Role (optional)" />
        </footer>
      </blockquote>
    </div>
  );
}

function EditTagList({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const items = (block.props.items as string[]) ?? [];
  const label = (block.props.label as string) ?? "";
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>
      <InlineText value={label} onChange={(v) => onUpdateProps({ label: v })} placeholder="Label (optional)"
        style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 10 }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((t, i) => (
          <span key={i} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 999, background: CARD, border: `1px solid ${RULE}`, color: SLATE, display: "inline-flex", gap: 6, alignItems: "center" }}>
            <InlineText value={t} onChange={(v) => onUpdateProps({ items: items.map((x, idx) => idx === i ? v : x) })} placeholder="Tag" />
            <button onClick={(e) => { e.stopPropagation(); onUpdateProps({ items: items.filter((_, idx) => idx !== i) }); }}
              style={{ background: "transparent", border: 0, cursor: "pointer", color: MUTED }}><X size={11} /></button>
          </span>
        ))}
        <button onClick={(e) => { e.stopPropagation(); onUpdateProps({ items: [...items, "New tag"] }); }}
          style={{ fontSize: 13, padding: "6px 12px", borderRadius: 999, background: "#EEF4FF", border: `1px dashed ${ACCENT}`, color: ACCENT, cursor: "pointer" }}>
          <Plus size={12} style={{ display: "inline", marginRight: 4 }} /> Add tag
        </button>
      </div>
    </div>
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
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
        <select value={cols} onChange={(e) => onUpdateProps({ columns: Number(e.target.value) })} onClick={(e) => e.stopPropagation()}
          style={{ fontSize: 12, padding: "4px 6px", border: `1px solid ${RULE}`, borderRadius: 4 }}>
          <option value={2}>2 columns</option><option value={3}>3 columns</option>
        </select>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) addFile(f); e.currentTarget.value = ""; }} />
        <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }} disabled={uploading}
          style={{ ...addLinkBtn }}><Plus size={14} /> {uploading ? "Uploading…" : "Add image"}</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }}>
        {images.map((src, i) => (
          <div key={i} style={{ position: "relative" }}>
            <img src={src} alt="" style={{ width: "100%", borderRadius: 10, display: "block" }} />
            <button onClick={(e) => { e.stopPropagation(); onUpdateProps({ images: images.filter((_, idx) => idx !== i) }); }}
              style={{ ...iconBtnSmall, top: 8, right: 8 }} title="Remove image"><X size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditButton({ block, onUpdateProps }: { block: Block; onUpdateProps: (p: Record<string, unknown>) => void }) {
  const label = (block.props.label as string) ?? "";
  const href = (block.props.href as string) ?? "";
  const variant = (block.props.variant as string) ?? "primary";
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", textAlign: block.style?.align ?? "left" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
        <select value={variant} onChange={(e) => onUpdateProps({ variant: e.target.value })} onClick={(e) => e.stopPropagation()}
          style={{ fontSize: 12, padding: "4px 6px", border: `1px solid ${RULE}`, borderRadius: 4 }}>
          <option value="primary">Primary</option><option value="secondary">Secondary</option>
        </select>
        <input value={href} onChange={(e) => onUpdateProps({ href: e.target.value })} onClick={(e) => e.stopPropagation()}
          placeholder="Link URL (e.g. /contact)" style={{ flex: 1, fontSize: 12, padding: "4px 8px", border: `1px solid ${RULE}`, borderRadius: 4 }} />
      </div>
      <span style={{
        display: "inline-block", padding: "12px 22px", borderRadius: 999, fontSize: 14, fontWeight: 700,
        background: variant === "primary" ? SLATE : "transparent",
        color: variant === "primary" ? "#F8F8F6" : SLATE,
        border: `1px solid ${SLATE}`,
      }}>
        <InlineText value={label} onChange={(v) => onUpdateProps({ label: v })} placeholder="Button label" />
      </span>
    </div>
  );
}

// ── Settings popover (per-block style) ─────────────────────────────────────

function SettingsPanel({ block, onUpdateStyle, onClose }: { block: Block; onUpdateStyle: (s: Partial<BlockStyle>) => void; onClose: () => void }) {
  const s = block.style ?? {};
  return (
    <div onClick={(e) => e.stopPropagation()} style={{
      position: "absolute", top: -6, right: 8, zIndex: 60, width: 260,
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
        <input value={s.padding ?? ""} placeholder="e.g. 40px 0" onChange={(e) => onUpdateStyle({ padding: e.target.value || undefined })} style={txtInp} />
      </Row>
      <Row label="Max width (px)">
        <input type="number" value={s.maxWidth ?? ""} placeholder="960" onChange={(e) => onUpdateStyle({ maxWidth: e.target.value ? Number(e.target.value) : undefined })} style={txtInp} />
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

// ── Insert slot between blocks ─────────────────────────────────────────────

function InsertSlot({ isOpen, onToggle, onPick }: { isOpen: boolean; onToggle: () => void; onPick: (t: Parameters<typeof makeBlock>[0]) => void }) {
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center", padding: "4px 0" }}>
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }}
        style={{
          width: 28, height: 28, borderRadius: "50%", background: isOpen ? ACCENT : "#fff",
          color: isOpen ? "#fff" : ACCENT, border: `1px solid ${ACCENT}`, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 6px rgba(59,130,246,0.18)",
        }}
        title="Add block here"
      ><Plus size={14} /></button>
      {isOpen && <AddBlockMenu onPick={onPick} onClose={onToggle} />}
    </div>
  );
}

function AddBlockMenu({ onPick, onClose, alwaysOpen }: { onPick: (t: Parameters<typeof makeBlock>[0]) => void; onClose: () => void; alwaysOpen?: boolean }) {
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

// ── Style helpers ──────────────────────────────────────────────────────────

const tbBtn: React.CSSProperties = {
  background: "transparent", color: "#fff", border: 0, padding: "4px 6px",
  borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center",
};
const iconBtnSmall: React.CSSProperties = {
  position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%",
  background: "rgba(10,10,10,0.85)", color: "#fff", border: 0, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const addCardBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  background: "#EEF4FF", color: ACCENT, border: `1px dashed ${ACCENT}`,
  borderRadius: 12, padding: "22px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
};
const addLinkBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700,
  color: ACCENT, background: "#EEF4FF", border: `1px dashed ${ACCENT}`,
  padding: "6px 12px", borderRadius: 6, cursor: "pointer",
};
const colorInp: React.CSSProperties = { width: 36, height: 28, padding: 0, border: `1px solid ${RULE}`, borderRadius: 4 };
const selectInp: React.CSSProperties = { fontSize: 12, padding: "4px 8px", border: `1px solid ${RULE}`, borderRadius: 4 };
const txtInp: React.CSSProperties = { fontSize: 12, padding: "4px 8px", border: `1px solid ${RULE}`, borderRadius: 4, width: 110 };
const smallBtn: React.CSSProperties = { fontSize: 11, padding: "3px 6px", border: `1px solid ${RULE}`, borderRadius: 4, background: "#fff", cursor: "pointer", color: MUTED };

function btn(variant: "primary" | "ghost"): React.CSSProperties {
  if (variant === "primary") {
    return {
      display: "inline-flex", alignItems: "center", gap: 6,
      background: ACCENT, color: "#fff", border: 0, padding: "8px 14px",
      borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer",
    };
  }
  return {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "transparent", color: "#fff", border: `1px solid rgba(255,255,255,0.25)`,
    padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer",
  };
}
