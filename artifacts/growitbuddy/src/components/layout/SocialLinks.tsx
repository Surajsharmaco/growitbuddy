import { usePublicContent } from "@/hooks/usePublicContent";
import { FOOTER_DEFAULTS, type FooterData } from "@/lib/footerDefaults";

type SocialKey = "instagram" | "linkedin" | "twitter" | "youtube";

const PLATFORMS: { key: SocialKey; label: string; path: string }[] = [
  {
    key: "instagram",
    label: "Instagram",
    path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.62c-3.15 0-3.52.01-4.76.07-.9.04-1.39.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.81-.32 1.71-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.04.9.19 1.39.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.81.28 1.71.32 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c.9-.04 1.39-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.81.32-1.71.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.04-.9-.19-1.39-.32-1.71a2.85 2.85 0 0 0-.69-1.06 2.85 2.85 0 0 0-1.06-.69c-.32-.13-.81-.28-1.71-.32-1.24-.06-1.61-.07-4.76-.07zm0 2.76a5.46 5.46 0 1 1 0 10.92 5.46 5.46 0 0 1 0-10.92zm0 9a3.54 3.54 0 1 0 0-7.08 3.54 3.54 0 0 0 0 7.08zm6.95-9.22a1.28 1.28 0 1 1-2.55 0 1.28 1.28 0 0 1 2.55 0z",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z",
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    path: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zM17.61 20.64h2.04L6.49 3.24H4.3l13.31 17.4z",
  },
  {
    key: "youtube",
    label: "YouTube",
    path: "M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z",
  },
];

/**
 * Renders the brand's social icons as links. URLs live in the admin-editable
 * "footer" content (Admin -> Footer), so the header and footer share one
 * source of truth. Falls back to the brand defaults when a URL is empty so the
 * icons reliably appear even when the stored content has blank social fields.
 */
export function SocialLinks({
  variant = "dark",
  size = 18,
  gap = 16,
  className,
}: {
  variant?: "dark" | "light";
  size?: number;
  gap?: number;
  className?: string;
}) {
  const data = usePublicContent<FooterData>("footer", FOOTER_DEFAULTS);

  const active = PLATFORMS.map((p) => ({
    ...p,
    url: (data[p.key] || "").trim() || FOOTER_DEFAULTS[p.key],
  })).filter((p) => p.url);

  if (active.length === 0) return null;

  const base = variant === "dark" ? "rgba(255,255,255,0.45)" : "#7A7A7A";
  const hover = variant === "dark" ? "#FFFFFF" : "#0A0A0A";

  // Invisible padding enlarges the touch target (icon + 2*pad >= ~32px) without
  // changing the icon size; the container gap is reduced by the padding so the
  // visual spacing between icons stays equal to `gap`.
  const pad = 8;

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: Math.max(0, gap - pad * 2) }}
      className={className}
    >
      {active.map((p) => (
        <a
          key={p.key}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={p.label}
          title={p.label}
          style={{
            color: base,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: pad,
            lineHeight: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = hover)}
          onMouseLeave={(e) => (e.currentTarget.style.color = base)}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={p.path} />
          </svg>
        </a>
      ))}
    </div>
  );
}
