import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Pencil, ExternalLink, X, LogOut, Eye, EyeOff } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";

// Route → existing admin editor URL + friendly page name.
// Matched longest-prefix-first so /portfolio/foo still maps to /admin/portfolio.
const PAGE_MAP: Array<{ prefix: string; name: string; admin: string; exact?: boolean }> = [
  { prefix: "/", name: "Home", admin: "/admin/home", exact: true },
  { prefix: "/services", name: "Services", admin: "/admin/services" },
  { prefix: "/work", name: "Work", admin: "/admin/work" },
  { prefix: "/framework", name: "Framework", admin: "/admin/framework" },
  { prefix: "/insights", name: "Blog / Insights", admin: "/admin/blog" },
  { prefix: "/about", name: "About", admin: "/admin/about" },
  { prefix: "/contact", name: "Contact", admin: "/admin/contact" },
  { prefix: "/career", name: "Careers", admin: "/admin/career" },
  { prefix: "/influencers", name: "Influencers", admin: "/admin/influencers" },
  { prefix: "/distribution", name: "Distribution Network", admin: "/admin/distribution-network" },
  { prefix: "/join", name: "Join Network", admin: "/admin/join-network" },
  { prefix: "/authority-audit", name: "Authority Audit", admin: "/admin/authority-audit" },
  { prefix: "/portfolio", name: "Portfolio", admin: "/admin/portfolio" },
  { prefix: "/verify", name: "Certificates", admin: "/admin/certificates" },
  { prefix: "/resources", name: "Resources", admin: "/admin/resources" },
  { prefix: "/creators", name: "Creators", admin: "/admin/influencers" },
  { prefix: "/designers-pool", name: "Designers Pool", admin: "/admin/pool-designers" },
  { prefix: "/thumbnail-designers", name: "Thumbnail Designers", admin: "/admin/pool-thumbnail-designers" },
  { prefix: "/writers-pool", name: "Writers Pool", admin: "/admin/pool-writers" },
  { prefix: "/social-media-managers", name: "Social Media Managers", admin: "/admin/pool-social-managers" },
  { prefix: "/motion-designers", name: "Motion Designers", admin: "/admin/pool-motion-designers" },
  { prefix: "/ai-creators", name: "AI Creators", admin: "/admin/pool-ai-creators" },
  { prefix: "/ugc-creators", name: "UGC Creators", admin: "/admin/pool-ugc-creators" },
  { prefix: "/meme-designers", name: "Meme Designers", admin: "/admin/pool-meme-designers" },
  { prefix: "/video-editors", name: "Video Editors", admin: "/admin/pool-editors" },
  { prefix: "/editors-pool", name: "Creator School", admin: "/admin/editors-pool" },
];

function matchPage(pathname: string) {
  // Exact "/" first
  if (pathname === "/" || pathname === "") return PAGE_MAP[0];
  // Longest non-root prefix match
  let best: typeof PAGE_MAP[number] | null = null;
  for (const entry of PAGE_MAP) {
    if (entry.exact) continue;
    if (pathname === entry.prefix || pathname.startsWith(entry.prefix + "/")) {
      if (!best || entry.prefix.length > best.prefix.length) best = entry;
    }
  }
  return best;
}

const HIDE_KEY = "gb-admin-bar-hidden";
const PREVIEW_KEY = "gb-admin-preview-mode";

/**
 * Floating bar on every public page. Only visible to authenticated admins.
 * - Shows current page name
 * - "Open page editor" → existing admin editor (new tab)
 * - "Preview as visitor" toggle hides all inline-admin chrome by setting a
 *   body data-attr that InlineText / AdminInlineControls honor.
 * - "X" hides the bar for the current tab session.
 */
export default function AdminPageBar() {
  const { isAuthenticated, logout, role } = useAdmin();
  const [location] = useLocation();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return sessionStorage.getItem(HIDE_KEY) === "1"; } catch { return false; }
  });
  const [previewMode, setPreviewMode] = useState<boolean>(() => {
    try { return sessionStorage.getItem(PREVIEW_KEY) === "1"; } catch { return false; }
  });

  // Reflect preview mode on <body> so consumers (InlineText etc.) can hide chrome.
  useEffect(() => {
    if (previewMode) document.body.setAttribute("data-gb-preview", "1");
    else document.body.removeAttribute("data-gb-preview");
    try { sessionStorage.setItem(PREVIEW_KEY, previewMode ? "1" : "0"); } catch { /* noop */ }
  }, [previewMode]);

  if (!isAuthenticated) return null;
  if (dismissed) return null;
  // Don't show on admin routes (already in editor).
  if (location.startsWith("/admin")) return null;

  const page = matchPage(location);

  return (
    <div
      role="region"
      aria-label="Admin page tools"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px 8px 14px",
        background: "rgba(10,15,26,0.96)",
        color: "#fff",
        borderRadius: 999,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)",
        backdropFilter: "blur(8px)",
        fontFamily: "'Inter', sans-serif",
        fontSize: 13,
        maxWidth: "calc(100vw - 40px)",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontWeight: 600,
          letterSpacing: "0.01em",
          color: "#fff",
        }}
      >
        <span style={{
          width: 8, height: 8, borderRadius: 999,
          background: previewMode ? "#94A3B8" : "#22C55E",
          boxShadow: previewMode ? "none" : "0 0 8px rgba(34,197,94,0.6)",
        }} />
        {previewMode ? "Preview mode" : "Admin"}
        <span style={{ opacity: 0.55, fontWeight: 500 }}>· {page?.name ?? "Page"}</span>
      </span>

      <span style={{ width: 1, height: 18, background: "rgba(255,255,255,0.12)" }} />

      <button
        type="button"
        title={previewMode ? "Exit preview" : "Preview as visitor"}
        onClick={() => setPreviewMode((v) => !v)}
        style={pillBtnStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
      >
        {previewMode ? <Eye size={13} /> : <EyeOff size={13} />}
        <span>{previewMode ? "Edit" : "Preview"}</span>
      </button>

      {page && (
        <a
          href={page.admin}
          target="_blank"
          rel="noopener noreferrer"
          title="Open the existing admin editor for this page in a new tab"
          style={{ ...pillBtnStyle, background: "#22C55E", color: "#06210F" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#16A34A")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#22C55E")}
        >
          <Pencil size={13} />
          <span>Open editor</span>
          <ExternalLink size={11} style={{ opacity: 0.7 }} />
        </a>
      )}

      <a
        href="/admin"
        title="Admin dashboard"
        style={pillBtnStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
      >
        Dashboard
      </a>

      {role === "super" && (
        <button
          type="button"
          title="Sign out"
          onClick={() => { void logout(); }}
          style={pillBtnStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(248,113,113,0.18)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
        >
          <LogOut size={13} />
        </button>
      )}

      <button
        type="button"
        title="Hide this bar (this tab only)"
        onClick={() => {
          setDismissed(true);
          try { sessionStorage.setItem(HIDE_KEY, "1"); } catch { /* noop */ }
        }}
        style={{ ...pillBtnStyle, padding: "4px 6px" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
      >
        <X size={13} />
      </button>
    </div>
  );
}

const pillBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "6px 11px",
  border: "none",
  borderRadius: 999,
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontFamily: "'Inter', sans-serif",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
  transition: "background 0.15s",
  whiteSpace: "nowrap",
};
