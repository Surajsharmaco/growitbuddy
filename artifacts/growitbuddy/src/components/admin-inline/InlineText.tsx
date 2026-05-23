import { useEffect, useRef, useState, type CSSProperties, type ElementType } from "react";
import { useAdmin } from "@/context/AdminContext";

interface InlineTextProps {
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
  multiline?: boolean;
  placeholder?: string;
  as?: ElementType;
  style?: CSSProperties;
  className?: string;
  ariaLabel?: string;
}

/**
 * Click-to-edit text. Renders plain text for visitors; for signed-in admins
 * renders a contentEditable element with hover outline, blur-to-save,
 * Esc-to-cancel, and Enter-to-commit (Shift+Enter inserts newline if multiline).
 */
export default function InlineText({
  value,
  onSave,
  multiline = false,
  placeholder = "Click to edit",
  as,
  style,
  className,
  ariaLabel,
}: InlineTextProps) {
  const { isAuthenticated } = useAdmin();
  const ref = useRef<HTMLElement | null>(null);
  const originalRef = useRef<string>(value);
  const [editing, setEditing] = useState(false);
  const [hover, setHover] = useState(false);

  // Keep DOM in sync with prop when not editing (so server updates show up).
  useEffect(() => {
    if (!editing && ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value, editing]);

  if (!isAuthenticated) {
    const Tag = (as ?? "span") as ElementType;
    return (
      <Tag style={style} className={className}>
        {value}
      </Tag>
    );
  }

  const Tag = (as ?? "span") as ElementType;

  const commit = async () => {
    const next = (ref.current?.textContent ?? "").trim();
    setEditing(false);
    if (next === originalRef.current) return;
    originalRef.current = next;
    await onSave(next);
  };

  const cancel = () => {
    if (ref.current) ref.current.textContent = originalRef.current;
    setEditing(false);
    ref.current?.blur();
  };

  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        ref.current = el;
        if (el && !editing && el.textContent !== value) el.textContent = value;
      }}
      role="textbox"
      aria-label={ariaLabel ?? "Edit text"}
      aria-multiline={multiline}
      contentEditable
      suppressContentEditableWarning
      spellCheck={editing}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => {
        setEditing(true);
        originalRef.current = ref.current?.textContent ?? value;
      }}
      onBlur={() => { void commit(); }}
      onPaste={(e: React.ClipboardEvent) => {
        // Force plain-text paste so we don't import stray formatting.
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        sel.deleteFromDocument();
        sel.getRangeAt(0).insertNode(document.createTextNode(text));
        sel.collapseToEnd();
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Escape") { e.preventDefault(); cancel(); return; }
        if (e.key === "Enter" && !multiline) { e.preventDefault(); ref.current?.blur(); return; }
        if (e.key === "Enter" && multiline && !e.shiftKey) { e.preventDefault(); ref.current?.blur(); return; }
      }}
      data-placeholder={placeholder}
      className={className}
      style={{
        outline: editing
          ? "2px solid rgba(34,197,94,0.7)"
          : hover
            ? "2px dashed rgba(30,41,59,0.55)"
            : "2px dashed transparent",
        outlineOffset: 3,
        borderRadius: 4,
        cursor: editing ? "text" : "pointer",
        transition: "outline-color 0.15s",
        whiteSpace: multiline ? "pre-wrap" : undefined,
        ...style,
      }}
    />
  );
}
