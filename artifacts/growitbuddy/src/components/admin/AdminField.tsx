import { type ReactNode, useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, X, ChevronUp, ChevronDown } from "lucide-react";

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-[#0B0B0B]/40">{hint}</p>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className = "", ...props }: InputProps) {
  const el = (
    <input
      {...props}
      className={`w-full border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[14px] text-[#0B0B0B] placeholder-[#0B0B0B]/30 outline-none focus:border-[#0B0B0B]/40 bg-white transition-colors ${className}`}
    />
  );
  if (!label) return el;
  return <Field label={label} hint={hint}>{el}</Field>;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export function Textarea({ label, hint, className = "", ...props }: TextareaProps) {
  const el = (
    <textarea
      {...props}
      className={`w-full border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[14px] text-[#0B0B0B] placeholder-[#0B0B0B]/30 outline-none focus:border-[#0B0B0B]/40 bg-white transition-colors resize-y min-h-[90px] ${className}`}
    />
  );
  if (!label) return el;
  return <Field label={label} hint={hint}>{el}</Field>;
}

type ToastState = { msg: string; type: "success" | "error" } | null;

export function SaveBar({
  onSave,
  saving,
  saved,
  successMsg = "Changes saved successfully!",
  errorMsg = "Failed to save. Please try again.",
}: {
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  successMsg?: string;
  errorMsg?: string;
}) {
  const [toast, setToast] = useState<ToastState>(null);
  const prevSaving = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prevSaving.current && !saving) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast(saved
        ? { msg: successMsg, type: "success" }
        : { msg: errorMsg, type: "error" }
      );
      timerRef.current = setTimeout(() => setToast(null), 3500);
    }
    prevSaving.current = saving;
  }, [saving, saved, successMsg, errorMsg]);

  return (
    <>
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-[13px] font-medium text-white pointer-events-none
            ${toast.type === "success" ? "bg-emerald-600" : "bg-red-500"}`}
        >
          {toast.type === "success"
            ? <CheckCircle size={15} className="shrink-0" />
            : <XCircle size={15} className="shrink-0" />}
          {toast.msg}
        </div>
      )}
      <div className="flex items-center justify-between pt-5 border-t border-[#0B0B0B]/8 mt-6">
        <span className="text-[12px] text-[#0B0B0B]/40">
          {saving ? "Saving..." : saved ? "All changes saved" : "Unsaved changes"}
        </span>
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-[#0B0B0B] text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0B0B0B]/85 transition-colors disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </>
  );
}

/* ── Order control: a numbered position box + up/down nudge buttons ──────────
   Lets an admin type the exact position an item should take on the public page
   (1 = first, 2 = second, …) instead of clicking the chevrons many times. */
export function PositionControl({
  position,
  total,
  disabled = false,
  onMove,
  onSet,
}: {
  position: number;
  total: number;
  disabled?: boolean;
  onMove: (dir: -1 | 1) => void;
  onSet: (pos: number) => void;
}) {
  const [draft, setDraft] = useState(String(position));
  useEffect(() => { setDraft(String(position)); }, [position]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isNaN(n)) { setDraft(String(position)); return; }
    const clamped = Math.max(1, Math.min(n, total));
    if (clamped !== position) onSet(clamped);
    else setDraft(String(position));
  };

  return (
    <div className="flex items-center gap-1 shrink-0 pl-3 text-[#0B0B0B]/30">
      <input
        type="number"
        min={1}
        max={total}
        value={draft}
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
            (e.target as HTMLInputElement).blur();
          }
        }}
        title={disabled ? "Clear filters to change the order" : "Position on the public page (1 = first). Type a number, then press Enter."}
        aria-label="Position on the public page"
        className="w-9 text-center text-[12px] font-semibold border border-[#0B0B0B]/15 rounded-md py-1 text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/45 bg-white disabled:opacity-40 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <div className="flex flex-col">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMove(-1); }}
          disabled={disabled || position <= 1}
          aria-label="Move up one position"
          title="Move up one position"
          className="p-0.5 rounded hover:bg-[#0B0B0B]/8 hover:text-[#0B0B0B] disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-[#0B0B0B]/30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronUp size={13} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMove(1); }}
          disabled={disabled || position >= total}
          aria-label="Move down one position"
          title="Move down one position"
          className="p-0.5 rounded hover:bg-[#0B0B0B]/8 hover:text-[#0B0B0B] disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-[#0B0B0B]/30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronDown size={13} />
        </button>
      </div>
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="mb-7">
      <h1 className="text-[22px] font-black tracking-tight text-[#0B0B0B]">{title}</h1>
      {description && <div className="text-[14px] text-[#0B0B0B]/50 mt-1">{description}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#0B0B0B]/8 p-6 ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[14px] font-bold text-[#0B0B0B] mb-4 pb-3 border-b border-[#0B0B0B]/8">
      {children}
    </h2>
  );
}

/**
 * Centered popup/modal that appears near the top of the viewport. Used for the
 * "Add" flows so creating a new item opens a focused popup instead of scrolling
 * a blank row to the bottom of a long list or replacing the whole page.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-[#0B0B0B]/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${maxWidth} bg-white rounded-2xl border border-[#0B0B0B]/10 shadow-2xl my-6 sm:my-10`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#0B0B0B]/8">
          <div className="min-w-0">
            <h2 className="text-[17px] font-black tracking-tight text-[#0B0B0B]">{title}</h2>
            {description && <p className="text-[12px] text-[#0B0B0B]/45 mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-[#0B0B0B]/35 hover:text-[#0B0B0B] hover:bg-[#0B0B0B]/6 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#0B0B0B]/8 bg-[#fafafa] rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      {text}
    </span>
  );
}
