import { useState, type CSSProperties, type ReactNode } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Edit2, Eye, EyeOff, Trash2, RotateCcw, Loader2 } from "lucide-react";

type Position = "top-right" | "top-left" | "bottom-right" | "bottom-left";

interface AdminInlineControlsProps {
  itemLabel?: string;
  isHidden?: boolean;
  onEdit?: () => void;
  onToggleHidden?: () => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onRestore?: () => Promise<void> | void;
  position?: Position;
  children: ReactNode;
  wrapperStyle?: CSSProperties;
  className?: string;
}

const POS_STYLE: Record<Position, CSSProperties> = {
  "top-right":   { top: 8,    right: 8 },
  "top-left":    { top: 8,    left: 8  },
  "bottom-right":{ bottom: 8, right: 8 },
  "bottom-left": { bottom: 8, left: 8  },
};

export default function AdminInlineControls({
  itemLabel,
  isHidden,
  onEdit,
  onToggleHidden,
  onDelete,
  onRestore,
  position = "top-right",
  children,
  wrapperStyle,
  className,
}: AdminInlineControlsProps) {
  const { isAuthenticated } = useAdmin();
  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState<null | "hide" | "delete" | "restore">(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  async function run(kind: "hide" | "delete" | "restore", fn?: () => Promise<void> | void) {
    if (!fn) return;
    setBusy(kind);
    try { await fn(); } finally { setBusy(null); }
  }

  return (
    <div
      style={{
        position: "relative",
        outline: hover ? "2px dashed rgba(30,41,59,0.55)" : "2px dashed transparent",
        outlineOffset: 2,
        transition: "outline-color 0.15s",
        ...wrapperStyle,
      }}
      className={className}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setConfirmDelete(false); }}
    >
      {isHidden && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "repeating-linear-gradient(45deg, rgba(251,191,36,0.10) 0 10px, rgba(251,191,36,0.18) 10px 20px)",
            pointerEvents: "none",
            zIndex: 1,
            borderRadius: "inherit",
          }}
        />
      )}
      {isHidden && (
        <div style={{
          position: "absolute", top: 8, left: 8, zIndex: 3,
          padding: "3px 8px", borderRadius: 100,
          background: "#F59E0B", color: "#fff",
          fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
          pointerEvents: "none",
        }}>HIDDEN</div>
      )}

      {children}

      {hover && (
        <div
          style={{
            position: "absolute",
            zIndex: 10,
            display: "flex",
            gap: 4,
            padding: 4,
            background: "rgba(15,23,42,0.97)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.1)",
            ...POS_STYLE[position],
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <CtrlBtn title={`Edit${itemLabel ? ` ${itemLabel}` : ""}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}>
              <Edit2 size={13} />
            </CtrlBtn>
          )}
          {onToggleHidden && (
            <CtrlBtn
              title={isHidden ? "Restore (show to visitors)" : "Hide from visitors"}
              tone={isHidden ? "good" : "warn"}
              disabled={busy !== null}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); run("hide", onToggleHidden); }}
            >
              {busy === "hide" ? <Loader2 size={13} className="animate-spin" /> : isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
            </CtrlBtn>
          )}
          {onRestore && isHidden && (
            <CtrlBtn
              title="Restore"
              tone="good"
              disabled={busy !== null}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); run("restore", onRestore); }}
            >
              {busy === "restore" ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
            </CtrlBtn>
          )}
          {onDelete && (
            confirmDelete ? (
              <CtrlBtn
                title="Click again to permanently delete"
                tone="danger"
                disabled={busy !== null}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); run("delete", onDelete).then(() => setConfirmDelete(false)); }}
              >
                {busy === "delete" ? <Loader2 size={13} className="animate-spin" /> : <span style={{ fontSize: 10, fontWeight: 800, padding: "0 2px" }}>DELETE?</span>}
              </CtrlBtn>
            ) : (
              <CtrlBtn
                title="Delete permanently"
                tone="danger"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(true); }}
              >
                <Trash2 size={13} />
              </CtrlBtn>
            )
          )}
        </div>
      )}
    </div>
  );
}

function CtrlBtn({
  children, title, tone, onClick, disabled,
}: {
  children: ReactNode;
  title: string;
  tone?: "good" | "warn" | "danger";
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  const colors =
    tone === "danger" ? { bg: "rgba(248,113,113,0.18)", fg: "#FCA5A5", hover: "rgba(248,113,113,0.32)" } :
    tone === "warn"   ? { bg: "rgba(251,191,36,0.18)", fg: "#FCD34D", hover: "rgba(251,191,36,0.32)" } :
    tone === "good"   ? { bg: "rgba(34,197,94,0.18)",  fg: "#86EFAC", hover: "rgba(34,197,94,0.32)"  } :
                        { bg: "rgba(255,255,255,0.10)", fg: "#fff",   hover: "rgba(255,255,255,0.22)" };
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        minWidth: 26, height: 26, padding: "0 6px",
        border: "none", borderRadius: 7,
        background: colors.bg, color: colors.fg,
        cursor: disabled ? "wait" : "pointer",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = colors.hover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = colors.bg)}
    >
      {children}
    </button>
  );
}
