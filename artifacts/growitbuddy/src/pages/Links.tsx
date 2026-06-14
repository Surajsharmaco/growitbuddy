import { motion } from "framer-motion";
import {
  Instagram, Youtube, Twitter, Linkedin, Facebook, Github,
  Mail, Globe, Send, MessageCircle, Music2, AtSign, Ghost,
  ArrowUpRight, BadgeCheck, type LucideIcon,
} from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";
import { LINKS_DEFAULTS, normalizeLinkUrl, type LinksData, type LinkItem } from "@/lib/linksDefaults";

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

interface Theme {
  bg: string;
  bgAccent1: string;
  bgAccent2: string;
  text: string;
  muted: string;
  faint: string;
  cardBg: string;
  cardBorder: string;
  cardHoverBg: string;
}

function buildTheme(mode: "dark" | "light", accent: string): Theme {
  if (mode === "light") {
    return {
      bg: "#F4F4EF",
      bgAccent1: accent,
      bgAccent2: "#0A0A0A",
      text: "#0A0A0A",
      muted: "rgba(10,10,10,0.62)",
      faint: "rgba(10,10,10,0.42)",
      cardBg: "rgba(255,255,255,0.78)",
      cardBorder: "rgba(10,10,10,0.10)",
      cardHoverBg: "rgba(255,255,255,1)",
    };
  }
  return {
    bg: "#0A0A0A",
    bgAccent1: accent,
    bgAccent2: "#3a2f8f",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.68)",
    faint: "rgba(255,255,255,0.42)",
    cardBg: "rgba(255,255,255,0.055)",
    cardBorder: "rgba(255,255,255,0.12)",
    cardHoverBg: "rgba(255,255,255,0.10)",
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(201,162,39,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "GB";
}

function LinkButton({ link, theme, accent, index }: { link: LinkItem; theme: Theme; accent: string; index: number }) {
  const href = normalizeLinkUrl(link.url);
  const isExternal = /^https?:\/\//i.test(href);

  return (
    <motion.a
      href={href || undefined}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 + index * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        textDecoration: "none",
        borderRadius: 18,
        padding: "15px 18px",
        cursor: "pointer",
        background: link.featured ? hexToRgba(accent, theme.bg === "#0A0A0A" ? 0.16 : 0.14) : theme.cardBg,
        border: `1px solid ${link.featured ? hexToRgba(accent, 0.55) : theme.cardBorder}`,
        boxShadow: link.featured ? `0 8px 30px ${hexToRgba(accent, 0.18)}` : "0 2px 10px rgba(0,0,0,0.12)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
      onMouseEnter={(e) => { if (!link.featured) (e.currentTarget as HTMLAnchorElement).style.background = theme.cardHoverBg; }}
      onMouseLeave={(e) => { if (!link.featured) (e.currentTarget as HTMLAnchorElement).style.background = theme.cardBg; }}
    >
      {link.thumbnailUrl ? (
        <img
          src={link.thumbnailUrl}
          alt=""
          style={{ width: 42, height: 42, borderRadius: 12, objectFit: "cover", flexShrink: 0, border: `1px solid ${theme.cardBorder}` }}
        />
      ) : (
        <span
          style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: hexToRgba(accent, theme.bg === "#0A0A0A" ? 0.18 : 0.12),
            color: accent, fontWeight: 800, fontSize: 15,
          }}
        >
          {initialsOf(link.label)}
        </span>
      )}

      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: theme.text, letterSpacing: "-0.01em", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {link.label}
        </span>
        {link.sublabel && (
          <span style={{ display: "block", fontSize: 12, fontWeight: 500, color: theme.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {link.sublabel}
          </span>
        )}
      </span>

      <ArrowUpRight size={18} style={{ color: link.featured ? accent : theme.faint, flexShrink: 0 }} />
    </motion.a>
  );
}

export default function Links() {
  const data = usePublicContent<LinksData>("links", LINKS_DEFAULTS);
  const accent = data.accentColor || LINKS_DEFAULTS.accentColor;
  const theme = buildTheme(data.theme === "light" ? "light" : "dark", accent);
  const links = (data.links || []).filter((l) => l.enabled !== false && (l.label || l.url));
  const socials = (data.socials || []).filter((s) => s.url);

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: theme.bg, fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
      <SEOMeta
        title={`${data.profileName} — Links`}
        description={data.bio || "All my links in one place."}
      />

      {/* Aurora background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: [1, 1.12, 1], x: [0, 24, 0], y: [0, -18, 0] }}
          transition={{ opacity: { duration: 1 }, scale: { duration: 14, repeat: Infinity, ease: "easeInOut" }, x: { duration: 16, repeat: Infinity, ease: "easeInOut" }, y: { duration: 18, repeat: Infinity, ease: "easeInOut" } }}
          style={{ position: "absolute", top: "-12%", left: "-18%", width: 460, height: 460, borderRadius: "50%", background: hexToRgba(theme.bgAccent1, 0.42), filter: "blur(120px)" }}
        />
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: [1, 1.16, 1], x: [0, -28, 0], y: [0, 22, 0] }}
          transition={{ opacity: { duration: 1 }, scale: { duration: 17, repeat: Infinity, ease: "easeInOut" }, x: { duration: 19, repeat: Infinity, ease: "easeInOut" }, y: { duration: 15, repeat: Infinity, ease: "easeInOut" } }}
          style={{ position: "absolute", bottom: "-14%", right: "-16%", width: 420, height: 420, borderRadius: "50%", background: hexToRgba(theme.bgAccent2, 0.38), filter: "blur(120px)" }}
        />
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "72px 22px 56px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "relative", marginBottom: 18 }}
        >
          <div style={{ width: 100, height: 100, borderRadius: "50%", padding: 3, background: `linear-gradient(135deg, ${accent}, ${hexToRgba(accent, 0.25)})`, boxShadow: `0 10px 36px ${hexToRgba(accent, 0.3)}` }}>
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt={data.profileName} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block", border: `3px solid ${theme.bg}` }} />
            ) : (
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: theme.bg, color: theme.text, fontWeight: 800, fontSize: 34, letterSpacing: "-0.02em" }}>
                {initialsOf(data.profileName)}
              </div>
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
          <h1 style={{ fontSize: 23, fontWeight: 800, color: theme.text, letterSpacing: "-0.03em" }}>{data.profileName}</h1>
          {data.verified && <BadgeCheck size={20} style={{ color: accent, flexShrink: 0 }} fill={hexToRgba(accent, 0.2)} />}
        </motion.div>

        {/* Handle */}
        {data.username && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{ fontSize: 13.5, fontWeight: 600, color: theme.muted, marginBottom: 12 }}
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
            style={{ fontSize: 14, color: theme.muted, textAlign: "center", lineHeight: 1.65, maxWidth: "40ch", marginBottom: 18 }}
          >
            {data.bio}
          </motion.p>
        )}

        {/* Socials */}
        {socials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginBottom: 30 }}
          >
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
                    width: 42, height: 42, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: theme.cardBg, border: `1px solid ${theme.cardBorder}`,
                    color: theme.text, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                    transition: "transform 0.18s ease, background 0.18s ease, color 0.18s ease",
                  }}
                  onMouseEnter={(e) => { const t = e.currentTarget; t.style.transform = "translateY(-3px)"; t.style.background = hexToRgba(accent, 0.16); t.style.color = accent; }}
                  onMouseLeave={(e) => { const t = e.currentTarget; t.style.transform = "translateY(0)"; t.style.background = theme.cardBg; t.style.color = theme.text; }}
                >
                  <Icon size={18} />
                </a>
              );
            })}
          </motion.div>
        )}

        {/* Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
          {links.map((link, i) => (
            <LinkButton key={link.id} link={link} theme={theme} accent={accent} index={i} />
          ))}
        </div>

        {links.length === 0 && (
          <p style={{ fontSize: 13, color: theme.faint, marginTop: 24 }}>No links yet.</p>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{ marginTop: 40, textAlign: "center" }}
        >
          {data.footerNote && (
            <p style={{ fontSize: 12, color: theme.faint, marginBottom: 10, lineHeight: 1.6 }}>{data.footerNote}</p>
          )}
          <a href="/" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.faint, textDecoration: "none" }}>
            GrowitBuddy
          </a>
        </motion.div>
      </div>
    </div>
  );
}
