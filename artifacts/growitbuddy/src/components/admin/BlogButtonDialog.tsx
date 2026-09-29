import { useState, type FormEvent } from "react";

export type BlogButtonSettings = {
  label: string;
  url: string;
  background: string;
  color: string;
  borderColor: string;
  borderWidth: number;
  radius: number;
  fontSize: number;
  paddingX: number;
  paddingY: number;
  align: "left" | "center" | "right";
  fullWidth: boolean;
  newTab: boolean;
};

export const DEFAULT_BLOG_BUTTON: BlogButtonSettings = {
  label: "Learn more",
  url: "",
  background: "#0b0b0b",
  color: "#ffffff",
  borderColor: "#0b0b0b",
  borderWidth: 0,
  radius: 12,
  fontSize: 16,
  paddingX: 28,
  paddingY: 14,
  align: "center",
  fullWidth: false,
  newTab: false,
};

export function readBlogButton(anchor: HTMLAnchorElement): BlogButtonSettings {
  const { dataset } = anchor;
  const number = (key: string, fallback: number) => {
    const value = Number(dataset[key]);
    return Number.isFinite(value) ? value : fallback;
  };
  return {
    ...DEFAULT_BLOG_BUTTON,
    label: anchor.textContent || DEFAULT_BLOG_BUTTON.label,
    url: anchor.getAttribute("href") || DEFAULT_BLOG_BUTTON.url,
    background: dataset.background || DEFAULT_BLOG_BUTTON.background,
    color: dataset.color || DEFAULT_BLOG_BUTTON.color,
    borderColor: dataset.borderColor || DEFAULT_BLOG_BUTTON.borderColor,
    borderWidth: number("borderWidth", 0),
    radius: number("radius", 12),
    fontSize: number("fontSize", 16),
    paddingX: number("paddingX", 28),
    paddingY: number("paddingY", 14),
    align: dataset.align === "left" || dataset.align === "right" ? dataset.align : "center",
    fullWidth: dataset.fullWidth === "true",
    newTab: anchor.target === "_blank",
  };
}

export function normalizeButtonUrl(input: string): string | null {
  const value = input.trim();
  if (/^\/(?!\/)\S*$/.test(value) || /^#[\w-]+$/.test(value)) return value;
  const candidate = /^[\w-]+(?:\.[\w-]+)+(?:[/:?#]\S*)?$/i.test(value) ? `https://${value}` : value;
  try {
    const url = new URL(candidate);
    if (["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) return candidate;
  } catch { /* invalid URL */ }
  return null;
}

export function createBlogButton(settings: BlogButtonSettings): HTMLParagraphElement {
  const wrapper = document.createElement("p");
  wrapper.className = "gb-blog-button-wrap";
  wrapper.style.textAlign = settings.align;
  wrapper.dataset.align = settings.align;
  const anchor = document.createElement("a");
  anchor.className = "gb-blog-button";
  anchor.href = settings.url;
  anchor.textContent = settings.label.trim();
  anchor.dataset.background = settings.background;
  anchor.dataset.color = settings.color;
  anchor.dataset.borderColor = settings.borderColor;
  anchor.dataset.borderWidth = String(settings.borderWidth);
  anchor.dataset.radius = String(settings.radius);
  anchor.dataset.fontSize = String(settings.fontSize);
  anchor.dataset.paddingX = String(settings.paddingX);
  anchor.dataset.paddingY = String(settings.paddingY);
  anchor.dataset.align = settings.align;
  anchor.dataset.fullWidth = String(settings.fullWidth);
  if (settings.newTab) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  }
  anchor.style.display = settings.fullWidth ? "block" : "inline-block";
  anchor.style.maxWidth = "100%";
  anchor.style.boxSizing = "border-box";
  anchor.style.textAlign = "center";
  anchor.style.backgroundColor = settings.background;
  anchor.style.color = settings.color;
  anchor.style.border = settings.borderWidth ? `${settings.borderWidth}px solid ${settings.borderColor}` : "none";
  anchor.style.borderRadius = `${settings.radius}px`;
  anchor.style.fontSize = `${settings.fontSize}px`;
  anchor.style.fontWeight = "700";
  anchor.style.lineHeight = "1.3";
  anchor.style.padding = `${settings.paddingY}px ${settings.paddingX}px`;
  anchor.style.textDecoration = "none";
  anchor.style.whiteSpace = "normal";
  anchor.style.overflowWrap = "anywhere";
  wrapper.append(anchor);
  return wrapper;
}

const fieldClass = "w-full rounded-lg border border-[#0B0B0B]/15 bg-white px-3 py-2 text-sm text-[#0B0B0B] outline-none focus:border-[#0B0B0B]";
const labelClass = "block text-xs font-semibold text-[#0B0B0B]/65 mb-1";

export function BlogButtonDialog({
  initial, editing, onClose, onSave, onDelete,
}: {
  initial: BlogButtonSettings;
  editing: boolean;
  onClose: () => void;
  onSave: (settings: BlogButtonSettings) => void;
  onDelete?: () => void;
}) {
  const [settings, setSettings] = useState(initial);
  const [hexInputs, setHexInputs] = useState({
    background: initial.background, color: initial.color, borderColor: initial.borderColor,
  });
  const [error, setError] = useState("");
  const set = <K extends keyof BlogButtonSettings>(key: K, value: BlogButtonSettings[K]) =>
    setSettings((previous) => ({ ...previous, [key]: value }));
  const inputNumber = (key: "borderWidth" | "radius" | "fontSize" | "paddingX" | "paddingY", min: number, max: number) =>
    (value: string) => set(key, Math.max(min, Math.min(max, Number(value) || 0)));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!settings.label.trim()) { setError("Add button text."); return; }
    const url = normalizeButtonUrl(settings.url);
    if (!url) { setError("Enter a valid https://, /page, #section, mailto: or tel: link."); return; }
    onSave({ ...settings, label: settings.label.trim(), url });
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/55 p-3 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-label={editing ? "Edit blog button" : "Insert blog button"}
        className="w-full max-w-[570px] max-h-[min(90vh,850px)] overflow-y-auto rounded-2xl bg-white p-5 sm:p-7 shadow-2xl">
        <h3 className="text-lg font-bold text-[#0B0B0B]">{editing ? "Edit button" : "Insert button"}</h3>
        <p className="mt-1 mb-5 text-xs text-[#0B0B0B]/55">Customize how this button looks in your blog post.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="sm:col-span-2"><span className={labelClass}>Button text</span>
            <input className={fieldClass} value={settings.label} onChange={(e) => set("label", e.target.value)} maxLength={120} placeholder="e.g. Get started" autoFocus />
          </label>
          <label className="sm:col-span-2"><span className={labelClass}>Link URL</span>
            <input className={fieldClass} value={settings.url} onChange={(e) => set("url", e.target.value)} placeholder="https://example.com or /contact" />
          </label>
          {([
            ["background", "Background color"], ["color", "Text color"], ["borderColor", "Border color"],
          ] as const).map(([key, title]) => (
            <label key={key}><span className={labelClass}>{title}</span>
              <span className="flex gap-2">
                <input type="color" aria-label={`${title} picker`} value={settings[key]} onChange={(e) => {
                  set(key, e.target.value);
                  setHexInputs((previous) => ({ ...previous, [key]: e.target.value }));
                }}
                  className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-[#0B0B0B]/15 p-0.5" />
                <input className={fieldClass} value={hexInputs[key]} onChange={(e) => {
                  const value = e.target.value;
                  setHexInputs((previous) => ({ ...previous, [key]: value }));
                  if (/^#[\da-f]{6}$/i.test(value)) set(key, value);
                }} onBlur={() => setHexInputs((previous) => ({ ...previous, [key]: settings[key] }))}
                  aria-label={`${title} hex`} maxLength={7} />
              </span>
            </label>
          ))}
          {([
            ["fontSize", "Text size (px)", 12, 28], ["borderWidth", "Border width (px)", 0, 6],
            ["radius", "Corner radius (px)", 0, 50], ["paddingX", "Side padding (px)", 8, 60],
            ["paddingY", "Top / bottom padding (px)", 6, 32],
          ] as const).map(([key, title, min, max]) => (
            <label key={key}><span className={labelClass}>{title}: {settings[key]}</span>
              <input type="range" min={min} max={max} className="w-full accent-[#0B0B0B]" value={settings[key]} onChange={(e) => inputNumber(key, min, max)(e.target.value)} />
            </label>
          ))}
          <label><span className={labelClass}>Alignment</span>
            <select className={fieldClass} value={settings.align} onChange={(e) => set("align", e.target.value as BlogButtonSettings["align"])}>
              <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.fullWidth} onChange={(e) => set("fullWidth", e.target.checked)} /> Full-width button</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.newTab} onChange={(e) => set("newTab", e.target.checked)} /> Open in new tab</label>
        </div>
        <div className="mt-5 rounded-xl border border-[#0B0B0B]/10 bg-[#fafafa] p-4" style={{ textAlign: settings.align }}>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#0B0B0B]/40">Preview</span>
          <span className="mt-2 max-w-full box-border text-center font-bold leading-[1.3] no-underline whitespace-normal break-words"
            style={{ display: settings.fullWidth ? "block" : "inline-block", backgroundColor: settings.background, color: settings.color,
              border: settings.borderWidth ? `${settings.borderWidth}px solid ${settings.borderColor}` : "none",
              borderRadius: settings.radius, fontSize: settings.fontSize, padding: `${settings.paddingY}px ${settings.paddingX}px` }}>
            {settings.label || "Button text"}
          </span>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex items-center justify-end gap-2">
          {editing && onDelete && <button type="button" onClick={onDelete} className="mr-auto rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">Remove button</button>}
          <button type="button" onClick={onClose} className="rounded-lg border border-[#0B0B0B]/15 px-4 py-2 text-sm">Cancel</button>
          <button type="submit" className="rounded-lg bg-[#0B0B0B] px-4 py-2 text-sm font-semibold text-white">{editing ? "Update button" : "Insert button"}</button>
        </div>
      </form>
    </div>
  );
}