// Sticky banner shown at the top of any admin page when the URL contains
// ?variant=<slug>. Makes it unmistakable that edits will save to the variant,
// not the base page. Includes "Back to original" link and "Open public URL".
import { useLocation } from "wouter";
import { useAdmin } from "@/context/AdminContext";

export function VariantBanner() {
  const { currentVariant } = useAdmin();
  const [location, setLocation] = useLocation();
  if (!currentVariant) return null;

  function clearVariant() {
    // Strip ?variant=... from URL and stay on same admin page.
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("variant");
      const search = url.searchParams.toString();
      setLocation(location + (search ? `?${search}` : ""));
    } catch {
      setLocation(location);
    }
  }

  return (
    <div
      className="sticky top-0 z-50 -mx-6 -mt-8 mb-6 px-6 py-2.5 border-b flex items-center gap-3 text-[12px]"
      style={{ background: "#FFF7E0", borderColor: "#C2A878", color: "#0A0A0A", fontFamily: "Inter, sans-serif" }}
    >
      <span
        className="px-2 py-0.5 rounded-full font-bold tracking-wide uppercase text-[10px]"
        style={{ background: "#C2A878", color: "#0A0A0A" }}
      >
        Editing variant
      </span>
      <span className="font-semibold truncate">{currentVariant.label || currentVariant.slug}</span>
      <span className="text-black/50">·</span>
      <code className="text-[11px] text-black/60 truncate">/{currentVariant.slug}</code>
      <div className="ml-auto flex items-center gap-3">
        <a
          href={`/${currentVariant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline hover:no-underline"
          style={{ color: "#0A0A0A" }}
        >
          Open public URL ↗
        </a>
        <button
          type="button"
          onClick={clearVariant}
          className="font-semibold underline hover:no-underline"
          style={{ color: "#0A0A0A" }}
        >
          ← Back to original
        </button>
      </div>
    </div>
  );
}
