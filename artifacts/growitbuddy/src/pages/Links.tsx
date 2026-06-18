import { motion } from "framer-motion";
import {
  Instagram, Youtube, Twitter, Linkedin, Facebook, Github,
  Mail, Globe, Send, MessageCircle, Music2, AtSign, Ghost,
  ArrowUpRight, BadgeCheck, Play, type LucideIcon,
} from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import BlueprintLines from "@/components/effects/BlueprintLines";
import { usePublicContent } from "@/hooks/usePublicContent";
import { resolveMediaUrl } from "@/lib/api";
import {
  LINKS_DEFAULTS, normalizeLinkUrl, migrateLinksData,
  type LinksData, type LinkItem, type LinkSection,
  type LinksSection, type SocialsSection, type VideoSection,
  type TextSection, type ImageSection, type SpacerSection,
} from "@/lib/linksDefaults";
import { getEmbedUrl, isShortVideo } from "@/lib/videoEmbed";

// ── Brand palette (strictly navy / soft gold / cream) ──────────────────
const BG = "#F8F8F6";
const NAVY = "#1E293B";
const TEXT = "#0A0A0A";
const MUTED = "#5F5F5F";
const FAINT = "#8A8A8A";
const CARD = "#FFFFFF";
const BORDER = "#E5E5E0";

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  instagram: Instagram,
  youtube: Youtube,
  x: Twitter,
  twitter: Twitter,
  tiktok: Music2,
  linkedin: Linkedin,
  facebook: Facebook,
  threads: AtSign,
  whatsapp: MessageCircle,
  telegram: Send,
  snapchat: Ghost,
  github: Github,
  website: Globe,
  email: Mail,
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(194,168,120,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "GB"
  );
}

/** Animated film-grain — same recipe used across the site (no dot grids). */
function GrainOverlay() {
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.05 }}
      aria-hidden="true"
    >
      <defs>
        <filter id="links-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch">
            <animate attributeName="seed" values="0;20;40;60;80;100;0" dur="12s" repeatCount="indefinite" />
          </feTurbulence>
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#links-grain)" />
    </svg>
  );
}

function SectionHeading({ title, accent }: { title?: string; accent: string }) {
  if (!title) return null;
  return (
    <p
      style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
        color: accent, textAlign: "center", marginBottom: 16,
      }}
    >
      {title}
    </p>
  );
}

// ── Link button (list layout) ─────────────────────────────────────────
function LinkButton({ link, accent }: { link: LinkItem; accent: string }) {
  const href = normalizeLinkUrl(link.url);
  const isExternal = /^https?:\/\//i.test(href);
  const iconBg = link.featured ? accent : NAVY;
  const iconColor = link.featured ? NAVY : "#F5EFE2";

  return (
    <motion.a
      href={href || undefined}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      style={{
        position: "relative", display: "flex", alignItems: "center", gap: 14, width: "100%",
        textDecoration: "none", borderRadius: 16, padding: "14px 16px", cursor: "pointer",
        background: link.featured
          ? `linear-gradient(135deg, ${hexToRgba(accent, 0.18)}, ${hexToRgba(accent, 0.06)})`
          : CARD,
        border: `1px solid ${link.featured ? hexToRgba(accent, 0.55) : BORDER}`,
        boxShadow: link.featured
          ? `0 10px 30px ${hexToRgba(accent, 0.2)}`
          : "0 1px 2px rgba(16,24,40,0.04), 0 6px 16px rgba(16,24,40,0.05)",
        transition: "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (link.featured) return;
        const t = e.currentTarget;
        t.style.background = "#FFFDF8";
        t.style.borderColor = hexToRgba(accent, 0.45);
      }}
      onMouseLeave={(e) => {
        if (link.featured) return;
        const t = e.currentTarget;
        t.style.background = CARD;
        t.style.borderColor = BORDER;
      }}
    >
      {link.thumbnailUrl ? (
        <img
          src={resolveMediaUrl(link.thumbnailUrl)}
          alt=""
          style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover", flexShrink: 0, border: `1px solid ${BORDER}` }}
        />
      ) : (
        <span
          style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: "flex",
            alignItems: "center", justifyContent: "center", background: iconBg, color: iconColor,
            fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em",
          }}
        >
          {initialsOf(link.label)}
        </span>
      )}

      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: NAVY, letterSpacing: "-0.01em", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {link.label || "Untitled link"}
        </span>
        {link.sublabel && (
          <span style={{ display: "block", fontSize: 12, fontWeight: 500, color: MUTED, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {link.sublabel}
          </span>
        )}
      </span>

      <ArrowUpRight size={18} style={{ color: link.featured ? accent : FAINT, flexShrink: 0 }} />
    </motion.a>
  );
}

// ── Link card (grid layout) ───────────────────────────────────────────
function LinkCard({ link, accent }: { link: LinkItem; accent: string }) {
  const href = normalizeLinkUrl(link.url);
  const isExternal = /^https?:\/\//i.test(href);
  const iconBg = link.featured ? accent : NAVY;
  const iconColor = link.featured ? NAVY : "#F5EFE2";

  return (
    <motion.a
      href={href || undefined}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        gap: 10, padding: "18px 14px", textDecoration: "none", borderRadius: 16, cursor: "pointer",
        background: link.featured
          ? `linear-gradient(135deg, ${hexToRgba(accent, 0.18)}, ${hexToRgba(accent, 0.06)})`
          : CARD,
        border: `1px solid ${link.featured ? hexToRgba(accent, 0.55) : BORDER}`,
        boxShadow: link.featured
          ? `0 10px 30px ${hexToRgba(accent, 0.2)}`
          : "0 1px 2px rgba(16,24,40,0.04), 0 6px 16px rgba(16,24,40,0.05)",
        transition: "border-color 0.2s ease",
      }}
    >
      {link.thumbnailUrl ? (
        <img src={resolveMediaUrl(link.thumbnailUrl)} alt="" style={{ width: 52, height: 52, borderRadius: 14, objectFit: "cover", border: `1px solid ${BORDER}` }} />
      ) : (
        <span
          style={{
            width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center",
            justifyContent: "center", background: iconBg, color: iconColor, fontWeight: 800, fontSize: 17,
          }}
        >
          {initialsOf(link.label)}
        </span>
      )}
      <span style={{ fontSize: 13.5, fontWeight: 700, color: NAVY, lineHeight: 1.3 }}>
        {link.label || "Untitled link"}
      </span>
      {link.sublabel && (
        <span style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, lineHeight: 1.4 }}>{link.sublabel}</span>
      )}
    </motion.a>
  );
}

// ── Large link card (big thumbnail on top, text below) ────────────────
function LinkLarge({ link, accent }: { link: LinkItem; accent: string }) {
  const href = normalizeLinkUrl(link.url);
  const isExternal = /^https?:\/\//i.test(href);
  return (
    <motion.a
      href={href || undefined}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      style={{
        display: "block", width: "100%", textDecoration: "none", borderRadius: 18,
        overflow: "hidden", cursor: "pointer",
        background: link.featured
          ? `linear-gradient(135deg, ${hexToRgba(accent, 0.18)}, ${hexToRgba(accent, 0.06)})`
          : CARD,
        border: `1px solid ${link.featured ? hexToRgba(accent, 0.55) : BORDER}`,
        boxShadow: link.featured
          ? `0 12px 34px ${hexToRgba(accent, 0.22)}`
          : "0 1px 2px rgba(16,24,40,0.04), 0 8px 22px rgba(16,24,40,0.06)",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      }}
    >
      {link.thumbnailUrl ? (
        <img
          src={resolveMediaUrl(link.thumbnailUrl)}
          alt={link.label || ""}
          style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", display: "block", borderBottom: `1px solid ${BORDER}` }}
        />
      ) : (
        <div
          style={{
            width: "100%", aspectRatio: "16 / 9", display: "flex", alignItems: "center", justifyContent: "center",
            background: NAVY, color: "#F5EFE2", fontWeight: 800, fontSize: 30, letterSpacing: "-0.02em",
          }}
        >
          {initialsOf(link.label)}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 15.5, fontWeight: 700, color: NAVY, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
            {link.label || "Untitled link"}
          </span>
          {link.sublabel && (
            <span style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: MUTED, marginTop: 3, lineHeight: 1.4 }}>
              {link.sublabel}
            </span>
          )}
        </span>
        <ArrowUpRight size={19} style={{ color: link.featured ? accent : FAINT, flexShrink: 0 }} />
      </div>
    </motion.a>
  );
}

// ── Image-only link (big thumbnail, no text) ──────────────────────────
function LinkImageOnly({ link, accent }: { link: LinkItem; accent: string }) {
  const href = normalizeLinkUrl(link.url);
  const isExternal = /^https?:\/\//i.test(href);
  return (
    <motion.a
      href={href || undefined}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      aria-label={link.label || link.url || "Untitled link"}
      style={{
        display: "block", width: "100%", textDecoration: "none", borderRadius: 18, overflow: "hidden",
        cursor: "pointer",
        border: `1px solid ${link.featured ? hexToRgba(accent, 0.55) : BORDER}`,
        boxShadow: link.featured
          ? `0 12px 34px ${hexToRgba(accent, 0.22)}`
          : "0 1px 2px rgba(16,24,40,0.04), 0 8px 22px rgba(16,24,40,0.06)",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      }}
    >
      {link.thumbnailUrl ? (
        <img
          src={resolveMediaUrl(link.thumbnailUrl)}
          alt=""
          style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div
          style={{
            width: "100%", aspectRatio: "16 / 9", display: "flex", alignItems: "center", justifyContent: "center",
            background: NAVY, color: "#F5EFE2", fontWeight: 800, fontSize: 22, padding: 16, textAlign: "center",
          }}
        >
          {link.label || "Untitled link"}
        </div>
      )}
    </motion.a>
  );
}

// ── Social icon row ───────────────────────────────────────────────────
function SocialRow({ section, accent }: { section: SocialsSection; accent: string }) {
  const socials = (section.socials || []).filter((s) => s.url);
  if (socials.length === 0) return null;
  return (
    <div>
      <SectionHeading title={section.title} accent={accent} />
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
        {socials.map((s) => {
          const Icon = SOCIAL_ICONS[s.platform] || Globe;
          const href = normalizeLinkUrl(s.url);
          const isExternal = /^https?:\/\//i.test(href);
          return (
            <a
              key={s.id}
              href={href || undefined}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              aria-label={s.platform}
              style={{
                width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", background: CARD, border: `1px solid ${BORDER}`, color: NAVY,
                boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
                transition: "transform 0.18s ease, background 0.18s ease, color 0.18s ease, border-color 0.18s ease",
              }}
              onMouseEnter={(e) => {
                const t = e.currentTarget;
                t.style.transform = "translateY(-3px)";
                t.style.background = NAVY;
                t.style.color = "#F5EFE2";
                t.style.borderColor = NAVY;
              }}
              onMouseLeave={(e) => {
                const t = e.currentTarget;
                t.style.transform = "translateY(0)";
                t.style.background = CARD;
                t.style.color = NAVY;
                t.style.borderColor = BORDER;
              }}
            >
              <Icon size={18} />
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ── Video block ───────────────────────────────────────────────────────
function VideoBlock({ section, accent }: { section: VideoSection; accent: string }) {
  const url = (section.videoUrl || "").trim();
  if (!url) return null;
  const border = `1px solid ${BORDER}`;
  const isRawFile = /\.(mp4|webm|ogg)(\?|#|$)/i.test(url);

  let player: React.ReactNode = null;
  if (isRawFile) {
    player = (
      <video
        src={url}
        controls
        playsInline
        style={{ width: "100%", display: "block", borderRadius: 16, border, background: "#000" }}
      />
    );
  } else {
    const embed = getEmbedUrl(url);
    if (embed) {
      const vertical = isShortVideo(url);
      player = (
        <div
          style={{
            width: vertical ? "min(100%, 300px)" : "100%",
            margin: vertical ? "0 auto" : undefined,
            aspectRatio: vertical ? "9 / 16" : "16 / 9",
            borderRadius: 16, overflow: "hidden", border, background: "#000",
            boxShadow: "0 8px 24px rgba(16,24,40,0.08)",
          }}
        >
          <iframe
            src={embed}
            title={section.title || "Video"}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: 0, display: "block" }}
          />
        </div>
      );
    } else {
      // Unrecognized provider — degrade to a tappable link rather than failing.
      const href = normalizeLinkUrl(url);
      player = (
        <a
          href={href || undefined}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%",
            padding: "16px 18px", borderRadius: 16, border, background: CARD, color: NAVY,
            fontSize: 14, fontWeight: 700, textDecoration: "none",
          }}
        >
          <Play size={16} style={{ color: accent }} /> Watch video
        </a>
      );
    }
  }

  return (
    <div>
      <SectionHeading title={section.title} accent={accent} />
      {player}
      {section.caption && (
        <p style={{ fontSize: 12.5, color: MUTED, textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
          {section.caption}
        </p>
      )}
    </div>
  );
}

// ── Text block ────────────────────────────────────────────────────────
function TextBlock({ section }: { section: TextSection }) {
  const align = section.align === "center" ? "center" : "left";
  if (!section.heading && !section.body && !section.title) return null;
  return (
    <div style={{ textAlign: align }}>
      {section.title && (
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C2A878", marginBottom: 10, textAlign: "center" }}>
          {section.title}
        </p>
      )}
      {section.heading && (
        <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, letterSpacing: "-0.02em", lineHeight: 1.25, marginBottom: section.body ? 8 : 0 }}>
          {section.heading}
        </h2>
      )}
      {section.body && (
        <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{section.body}</p>
      )}
    </div>
  );
}

// ── Image block ───────────────────────────────────────────────────────
function ImageBlock({ section, accent }: { section: ImageSection; accent: string }) {
  if (!section.imageUrl) return null;
  const radius = section.rounded === false ? 0 : 16;
  const img = (
    <img
      src={resolveMediaUrl(section.imageUrl)}
      alt={section.caption || section.title || ""}
      style={{ width: "100%", display: "block", borderRadius: radius, border: `1px solid ${BORDER}`, objectFit: "cover" }}
    />
  );
  const href = section.linkUrl ? normalizeLinkUrl(section.linkUrl) : "";
  const isExternal = /^https?:\/\//i.test(href);
  return (
    <div>
      <SectionHeading title={section.title} accent={accent} />
      {href ? (
        <a href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined} style={{ display: "block" }}>
          {img}
        </a>
      ) : (
        img
      )}
      {section.caption && (
        <p style={{ fontSize: 12.5, color: MUTED, textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
          {section.caption}
        </p>
      )}
    </div>
  );
}

function Spacer({ section }: { section: SpacerSection }) {
  const h = section.size === "sm" ? 8 : section.size === "lg" ? 44 : 22;
  return <div aria-hidden style={{ height: h }} />;
}

function SectionRenderer({ section, accent }: { section: LinkSection; accent: string }) {
  switch (section.type) {
    case "links": {
      const s = section as LinksSection;
      const items = (s.items || []).filter((l) => l.enabled !== false && (l.label || l.url));
      if (items.length === 0) return null;
      const isGrid = s.layout === "grid";
      return (
        <div>
          <SectionHeading title={s.title} accent={accent} />
          <div
            style={
              isGrid
                ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }
                : { display: "flex", flexDirection: "column", gap: 12 }
            }
          >
            {items.map((link) => {
              // "large" and "image" always render as a full-width block — in a
              // grid they span both columns so they never get squeezed.
              if (link.display === "large") {
                return (
                  <div key={link.id} style={isGrid ? { gridColumn: "1 / -1" } : undefined}>
                    <LinkLarge link={link} accent={accent} />
                  </div>
                );
              }
              if (link.display === "image") {
                return (
                  <div key={link.id} style={isGrid ? { gridColumn: "1 / -1" } : undefined}>
                    <LinkImageOnly link={link} accent={accent} />
                  </div>
                );
              }
              // "normal" follows the section layout: compact card in a grid,
              // full-width row in a list.
              return isGrid ? (
                <LinkCard key={link.id} link={link} accent={accent} />
              ) : (
                <LinkButton key={link.id} link={link} accent={accent} />
              );
            })}
          </div>
        </div>
      );
    }
    case "socials":
      return <SocialRow section={section as SocialsSection} accent={accent} />;
    case "video":
      return <VideoBlock section={section as VideoSection} accent={accent} />;
    case "text":
      return <TextBlock section={section as TextSection} />;
    case "image":
      return <ImageBlock section={section as ImageSection} accent={accent} />;
    case "spacer":
      return <Spacer section={section as SpacerSection} />;
    default:
      return null;
  }
}

export default function Links() {
  const raw = usePublicContent<LinksData>("links", LINKS_DEFAULTS);
  const data = migrateLinksData(raw);
  const accent = data.accentColor || LINKS_DEFAULTS.accentColor;
  const sections = (data.sections || []).filter((s) => s.enabled !== false);

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: BG, fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
      <SEOMeta
        title={`${data.profileName} — Links`}
        description={data.bio || "All my links in one place."}
      />

      {/* Soft brand wash + grain (no aurora, no dots) */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: `radial-gradient(120% 60% at 50% -6%, ${hexToRgba(accent, 0.1)} 0%, ${hexToRgba(accent, 0)} 55%)`,
        }}
      />
      <GrainOverlay />
      <BlueprintLines maxWidth={620} hatch midCrosses />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 540, margin: "0 auto", padding: "72px 22px 64px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "relative", marginBottom: 18 }}
        >
          <div style={{ width: 104, height: 104, borderRadius: "50%", padding: 3, background: `linear-gradient(135deg, ${accent}, ${hexToRgba(accent, 0.3)})`, boxShadow: `0 12px 36px ${hexToRgba(accent, 0.28)}` }}>
            {data.avatarUrl ? (
              <img src={resolveMediaUrl(data.avatarUrl)} alt={data.profileName} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block", border: `3px solid ${BG}` }} />
            ) : (
              <img src={`${import.meta.env.BASE_URL}logo-circle.png`} alt={data.profileName} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block", background: NAVY, border: `3px solid ${BG}` }} />
            )}
          </div>
        </motion.div>

        {/* Name */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.5 }}
          style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 800, color: NAVY, letterSpacing: "-0.03em" }}>{data.profileName}</h1>
          {data.verified && <BadgeCheck size={20} style={{ color: accent, flexShrink: 0 }} fill={hexToRgba(accent, 0.2)} />}
        </motion.div>

        {/* Handle */}
        {data.username && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{ fontSize: 13.5, fontWeight: 600, color: MUTED, marginBottom: 12 }}
          >
            {data.username}
          </motion.p>
        )}

        {/* Bio */}
        {data.bio && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.13, duration: 0.5 }}
            style={{ fontSize: 14.5, color: MUTED, textAlign: "center", lineHeight: 1.65, maxWidth: "42ch", marginBottom: 8 }}
          >
            {data.bio}
          </motion.p>
        )}

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 30, width: "100%", marginTop: 22 }}>
          {sections.map((section, i) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(0.18 + i * 0.06, 0.6), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <SectionRenderer section={section} accent={accent} />
            </motion.div>
          ))}
        </div>

        {sections.length === 0 && (
          <p style={{ fontSize: 13, color: FAINT, marginTop: 24 }}>No links yet.</p>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{ marginTop: 44, textAlign: "center" }}
        >
          {data.footerNote && (
            <p style={{ fontSize: 12, color: FAINT, marginBottom: 10, lineHeight: 1.6 }}>{data.footerNote}</p>
          )}
          <a href="/" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: FAINT, textDecoration: "none" }}>
            GrowitBuddy
          </a>
        </motion.div>
      </div>
    </div>
  );
}
