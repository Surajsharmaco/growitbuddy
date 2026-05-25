import { useState, useEffect } from "react";
import { Play, ArrowLeft, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRoute, Link, useLocation } from "wouter";

import { API_BASE } from "@/lib/api";
import { getEmbedUrl, getThumbnail, getHiResThumbnail, isShortVideo } from "@/lib/videoEmbed";
import { PORTFOLIO_CATEGORIES } from "@/lib/portfolioCategories";

type CategoryType = "video" | "case-study";

const CATEGORIES = PORTFOLIO_CATEGORIES;

const CATEGORY_META: Record<string, { slug: string; tagline: string; type: CategoryType }> = {
  "Personal Branding": {
    slug: "personal-branding",
    tagline: "Positioning systems designed to turn founders and creators into category authorities.",
    type: "case-study",
  },
  "Content Creation": {
    slug: "content-creation",
    tagline: "Content production systems built for consistency, trust, and long-term audience attention.",
    type: "video",
  },
  "Video Editing": {
    slug: "video-editing",
    tagline: "Performance-focused edits crafted for creators, founders, and modern digital brands.",
    type: "video",
  },
  "Video Editing Global": {
    slug: "video-editing-global",
    tagline: "High-retention edits engineered for founder-led brands and authority-driven content worldwide.",
    type: "video",
  },
  "Graphics": {
    slug: "graphics",
    tagline: "Visual identity systems that make brands instantly recognizable across modern digital platforms.",
    type: "case-study",
  },
  "Social Media Management": {
    slug: "social-media-management",
    tagline: "Content and distribution built to maintain visibility, consistency, and audience momentum.",
    type: "case-study",
  },
  "Distribution & Growth": {
    slug: "distribution-growth",
    tagline: "Amplification engines designed to push content into the right networks, audiences, and inbound channels.",
    type: "case-study",
  },
  "Web & Funnel Systems": {
    slug: "web-funnel-systems",
    tagline: "Conversion-focused digital infrastructure engineered to turn authority into inbound demand.",
    type: "case-study",
  },
  "AI Automation": {
    slug: "ai-automation",
    tagline: "AI-powered systems that streamline operations, communication, and scalable content workflows.",
    type: "case-study",
  },
  "Digital Products & Growth": {
    slug: "digital-products-growth",
    tagline: "Monetization built around products, offers, communities, and scalable digital distribution.",
    type: "case-study",
  },
};

// Single brand palette accent — used for all service cards and hero backgrounds
const BRAND_ACCENT = "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)";

function slugToCategory(slug: string): string | null {
  for (const [cat, meta] of Object.entries(CATEGORY_META)) {
    if (meta.slug === slug) return cat;
  }
  return null;
}

interface CaseStudyMini {
  clientName?: string;
  clientLogoUrl?: string;
  coverImageUrl?: string;
}

interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  youtubeUrl: string;
  description: string | null;
  sortOrder: number;
  customThumbnailUrl?: string | null;
  caseStudy?: CaseStudyMini | null;
}

// ── Video Tile (16:9) — long-form ──
function VideoTile({ item, featured = false }: { item: PortfolioItem; featured?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const embedUrl = getEmbedUrl(item.youtubeUrl, { autoplay: true });
  // Admin-set poster takes priority over auto-generated platform thumbnail.
  const thumb = item.customThumbnailUrl?.trim()
    ? item.customThumbnailUrl
    : (featured ? getHiResThumbnail(item.youtubeUrl) : getThumbnail(item.youtubeUrl));

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: "#fff",
        border: "1.5px solid #E5E5E0",
        borderRadius: 18,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
      }}
      className="hover:-translate-y-1 hover:shadow-2xl hover:border-[#C2A878]"
    >
      <div style={{ position: "relative", aspectRatio: "16/9", background: "#0A0A0A" }}>
        {playing && embedUrl ? (
          <iframe
            src={embedUrl}
            title={item.title}
            referrerPolicy="origin"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <>
            {thumb && (
              <img
                src={thumb}
                alt={item.title}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  const fallback = getThumbnail(item.youtubeUrl);
                  if (el.src !== fallback) {
                    el.src = fallback;
                  } else {
                    // Both hi-res and standard failed (common for private Drive files) — hide so play button shows on clean bg
                    el.style.display = "none";
                  }
                }}
              />
            )}
            {/* Click surface — subtle dark veil only on hover so the
                creator's branding/logo in the thumbnail stays visible
                at rest. Play button sits center, gold-ringed, premium. */}
            <div
              className="portfolio-play-surface"
              style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(180deg, rgba(10,10,10,0) 55%, rgba(10,10,10,0.35) 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.3s ease",
              }}
              onClick={() => setPlaying(true)}
            >
              <div
                className="portfolio-play-btn"
                style={{
                  width: featured ? 72 : 58, height: featured ? 72 : 58,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1.5px solid rgba(255,255,255,0.65)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                  transition: "transform 0.3s cubic-bezier(.2,.8,.2,1), background 0.3s, border-color 0.3s",
                }}
              >
                <Play size={featured ? 26 : 22} style={{ color: "#fff", marginLeft: 3 }} fill="#fff" />
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ padding: featured ? "26px 26px 28px" : "20px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <h3
          style={{
            fontWeight: 800,
            fontSize: featured ? 26 : 18,
            letterSpacing: "-0.028em",
            color: "#0A0A0A",
            lineHeight: 1.22,
            margin: 0,
          }}
        >
          {item.title}
        </h3>
        {item.description && (
          <p style={{ fontSize: featured ? 15 : 13, color: "#5F5F5F", lineHeight: 1.6, margin: 0 }}>
            {item.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Reel Tile (9:16) — short-form, aligned grid ──
function ReelTile({ item }: { item: PortfolioItem }) {
  const [playing, setPlaying] = useState(false);
  const embedUrl = getEmbedUrl(item.youtubeUrl, { autoplay: true });
  // Admin-set poster takes priority over auto-generated platform thumbnail.
  const thumb = item.customThumbnailUrl?.trim()
    ? item.customThumbnailUrl
    : getHiResThumbnail(item.youtubeUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        background: "#0A0A0A",
        borderRadius: 18,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        border: "1.5px solid #E5E5E0",
        transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
      }}
      className="hover:-translate-y-1 hover:shadow-2xl hover:border-[#C2A878]"
    >
      <div style={{ position: "relative", aspectRatio: "9/16", background: "#0A0A0A" }}>
        {playing && embedUrl ? (
          <iframe
            src={embedUrl}
            title={item.title}
            referrerPolicy="origin"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <>
            {thumb && (
              <img
                src={thumb}
                alt={item.title}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  const fallback = getThumbnail(item.youtubeUrl);
                  if (el.src !== fallback) {
                    el.src = fallback;
                  } else {
                    el.style.display = "none";
                  }
                }}
              />
            )}
            {/* Click surface — entire tile, with centered glass play
                button. Top half is fully clear (no overlay) so brand
                logos visible at rest. Veil deepens on hover. */}
            <div
              className="portfolio-play-surface"
              style={{
                position: "absolute", inset: 0,
                background: "rgba(10,10,10,0)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.3s ease",
                zIndex: 1,
              }}
              onClick={() => setPlaying(true)}
            >
              <div
                className="portfolio-play-btn"
                style={{
                  width: 60, height: 60,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1.5px solid rgba(255,255,255,0.6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                  transition: "transform 0.3s cubic-bezier(.2,.8,.2,1), background 0.3s, border-color 0.3s",
                }}
              >
                <Play size={22} style={{ color: "#fff", marginLeft: 3 }} fill="#fff" />
              </div>
            </div>
            {/* Title overlay — rendered AFTER the click surface and
                given z-index:2 so the hover veil cannot bury it.
                Strong dark gradient + gold accent bar make the title
                pop even at rest; hover adds a gold underline reveal. */}
            <div
              className="portfolio-reel-title"
              style={{
                position: "absolute", left: 0, right: 0, bottom: 0,
                paddingTop: 70, paddingLeft: 16, paddingRight: 16, paddingBottom: 18,
                background: "linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.7) 45%, rgba(10,10,10,0.96) 100%)",
                pointerEvents: "none",
                zIndex: 2,
              }}
            >
              <h3
                style={{
                  fontWeight: 800,
                  fontSize: 15,
                  letterSpacing: "-0.018em",
                  color: "#fff",
                  lineHeight: 1.3,
                  margin: 0,
                  textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                }}
              >
                {item.title}
              </h3>
              <span
                className="portfolio-reel-underline"
                style={{
                  display: "block",
                  marginTop: 8,
                  height: 2,
                  width: 0,
                  background: "linear-gradient(90deg, #C2A878, #D4BB90)",
                  borderRadius: 2,
                  transition: "width 0.4s cubic-bezier(.2,.8,.2,1)",
                }}
              />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// Stable picsum dummy image per case-study item, or real cover when provided.
function caseHeroImage(item: PortfolioItem, w: number, h: number) {
  if (item.caseStudy?.coverImageUrl) return item.caseStudy.coverImageUrl;
  return `https://picsum.photos/seed/cs-${item.id}/${w}/${h}`;
}

// ── Case Study Tile — image only, title separated below as highlighted heading ──
function CaseStudyTile({ item, featured = false, sharePrefix = "/portfolio" }: { item: PortfolioItem; featured?: boolean; sharePrefix?: string }) {
  const [, setLocation] = useLocation();
  const meta = CATEGORY_META[item.category];
  const href = meta ? `${sharePrefix}/${meta.slug}/case/${item.id}` : "#";
  const dim = featured ? { w: 1400, h: 800 } : { w: 800, h: 600 };
  const img = caseHeroImage(item, dim.w, dim.h);

  const go = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    setLocation(href);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: "flex", flexDirection: "column", gap: 18 }}
      className="group"
    >
      {/* Image-only card */}
      <a
        href={href}
        onClick={go}
        style={{
          position: "relative",
          display: "block",
          aspectRatio: featured ? "16/9" : "4/3",
          borderRadius: 18,
          overflow: "hidden",
          background: BRAND_ACCENT,
          border: "1.5px solid #E5E5E0",
          transition: "transform 0.3s, box-shadow 0.3s, border-color 0.3s",
          textDecoration: "none",
        }}
        className="hover:-translate-y-1 hover:shadow-2xl hover:border-[#C2A878]"
      >
        <img
          src={img}
          alt={item.title}
          loading="lazy"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover",
            transition: "transform 0.6s",
          }}
          className="group-hover:scale-105"
        />
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(15,23,42,0) 55%, rgba(15,23,42,0.5) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute", top: 14, left: 14,
            fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
            padding: "5px 11px", borderRadius: 100,
            background: "rgba(255,255,255,0.95)", color: "#1E293B",
          }}
        >
          Case Study
        </div>
        <div
          style={{
            position: "absolute", bottom: 14, right: 14,
            width: 42, height: 42, borderRadius: "50%",
            background: "rgba(255,255,255,0.95)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            transition: "transform 0.25s, background 0.25s",
          }}
          className="group-hover:scale-110 group-hover:!bg-[#C2A878]"
        >
          <ArrowUpRight size={18} style={{ color: "#0A0A0A" }} />
        </div>
      </a>

      {/* Separated, highlighted title below the card */}
      <a
        href={href}
        onClick={go}
        style={{ textDecoration: "none", display: "block" }}
      >
        <p
          style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
            color: "#C2A878", margin: 0, marginBottom: 8,
          }}
        >
          {item.caseStudy?.clientName || item.category}
        </p>
        <h3
          style={{
            fontWeight: 800,
            fontSize: featured ? "clamp(26px, 3vw, 34px)" : "clamp(18px, 2vw, 22px)",
            letterSpacing: "-0.03em",
            color: "#0A0A0A",
            lineHeight: 1.2,
            margin: 0,
            transition: "color 0.2s",
          }}
          className="group-hover:!text-[#1E293B]"
        >
          {item.title}
        </h3>
      </a>
    </motion.div>
  );
}

// ── Service Card Palettes ──
// 4 variants cycled by index — strict brand palette only.
type ServiceCardPalette = {
  bg: string;
  border: string;
  shadow: string;
  text: string;
  mutedText: string;
  eyebrow: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
  arrowBg: string;
  arrowText: string;
  arrowBorder: string;
  dotDivider: string;
  dotColor: string;
};

const SERVICE_PALETTES: ServiceCardPalette[] = [
  // 0 — Dark slate (signature)
  {
    bg: "linear-gradient(160deg, #1E293B 0%, #0F172A 100%)",
    border: "1px solid rgba(255,255,255,0.06)",
    shadow: "0 8px 32px rgba(15,23,42,0.18)",
    text: "#F8F8F6",
    mutedText: "rgba(248,248,246,0.7)",
    eyebrow: "rgba(194,168,120,0.92)",
    pillBg: "rgba(255,255,255,0.10)",
    pillText: "#F8F8F6",
    pillBorder: "1px solid rgba(255,255,255,0.16)",
    arrowBg: "rgba(255,255,255,0.10)",
    arrowText: "#F8F8F6",
    arrowBorder: "1px solid rgba(255,255,255,0.18)",
    dotDivider: "#C2A878",
    dotColor: "rgba(194,168,120,0.10)",
  },
  // 1 — Cream + dark slate text
  {
    bg: "linear-gradient(160deg, #FFFFFF 0%, #F8F8F6 100%)",
    border: "1.5px solid #E5E5E0",
    shadow: "0 8px 28px rgba(30,41,59,0.08)",
    text: "#0A0A0A",
    mutedText: "#5F5F5F",
    eyebrow: "#C2A878",
    pillBg: "#1E293B",
    pillText: "#FFFFFF",
    pillBorder: "1px solid #1E293B",
    arrowBg: "#1E293B",
    arrowText: "#FFFFFF",
    arrowBorder: "1px solid #1E293B",
    dotDivider: "#C2A878",
    dotColor: "rgba(30,41,59,0.07)",
  },
  // 2 — Off-cream with stronger gold corner
  {
    bg: "linear-gradient(160deg, #EFEFEA 0%, #F8F8F6 100%)",
    border: "1.5px solid rgba(194,168,120,0.35)",
    shadow: "0 8px 28px rgba(30,41,59,0.10)",
    text: "#0A0A0A",
    mutedText: "#5F5F5F",
    eyebrow: "#1E293B",
    pillBg: "#C2A878",
    pillText: "#0A0A0A",
    pillBorder: "1px solid #C2A878",
    arrowBg: "#0A0A0A",
    arrowText: "#C2A878",
    arrowBorder: "1px solid #0A0A0A",
    dotDivider: "#1E293B",
    dotColor: "rgba(10,10,10,0.06)",
  },
];

type ServiceCardVariant = "standard" | "spotlight" | "compact" | "horizontal";

// ── Service Category Card (landing) — colour-differentiated branded design ──
function ServiceCard({
  category, count, index, variant = "standard", sharePrefix = "/portfolio",
}: { category: string; count: number; index: number; variant?: ServiceCardVariant; sharePrefix?: string }) {
  const meta = CATEGORY_META[category];
  const [, setLocation] = useLocation();
  const href = `${sharePrefix}/${meta.slug}`;
  const p = SERVICE_PALETTES[index % SERVICE_PALETTES.length];

  const go = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // allow new-tab
    e.preventDefault();
    setLocation(href);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  // Variant-driven sizing
  const isSpotlight = variant === "spotlight";
  const isCompact = variant === "compact";
  const isHorizontal = variant === "horizontal";

  const minHeight =
    isSpotlight ? 506 :
    isCompact ? 240 :
    isHorizontal ? 240 :
    340;

  const padding =
    isSpotlight ? "40px 44px 38px" :
    isCompact ? "26px 26px 24px" :
    isHorizontal ? "40px 44px" :
    "32px 32px 30px";

  const titleSize =
    isSpotlight ? "clamp(40px, 4.6vw, 60px)" :
    isCompact ? "clamp(22px, 1.8vw, 26px)" :
    isHorizontal ? "clamp(32px, 3.4vw, 44px)" :
    "clamp(28px, 3.6vw, 40px)";

  const arrowSize = isSpotlight ? 56 : isCompact ? 38 : isHorizontal ? 52 : 44;
  const arrowIcon = isSpotlight ? 24 : isCompact ? 16 : isHorizontal ? 22 : 20;

  const gridSpanClass =
    isSpotlight ? "sc-spotlight" :
    isHorizontal ? "sc-horizontal" :
    isCompact ? "sc-compact" : "";

  return (
    <motion.a
      href={href}
      onClick={go}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.06, duration: 0.55 }}
      whileHover={{ y: -6 }}
      style={{
        position: "relative",
        display: "block",
        borderRadius: 22,
        overflow: "hidden",
        cursor: "pointer",
        minHeight,
        background: p.bg,
        border: p.border,
        boxShadow: p.shadow,
        transition: "box-shadow 0.3s, border-color 0.3s",
        textDecoration: "none",
      }}
      className={`service-card group hover:shadow-2xl ${gridSpanClass}`}
    >
      {/* Subtle dotted-grid pattern */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `radial-gradient(${p.dotColor} 1.2px, transparent 1.2px)`,
          backgroundSize: isSpotlight ? "26px 26px" : "22px 22px",
          pointerEvents: "none",
        }}
      />

      {/* Gold accent rail — top */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: "linear-gradient(90deg, #C2A878, #D4BB90)",
        }}
      />

      {/* Dotted-grid corner decoration — bottom-right (hidden on compact) */}
      {!isCompact && (
        <div
          style={{
            position: "absolute",
            bottom: isSpotlight ? 22 : 16,
            right: isSpotlight ? 96 : 78,
            width: isSpotlight ? 56 : 36,
            height: isSpotlight ? 56 : 36,
            backgroundImage: `radial-gradient(${p.eyebrow} 1.3px, transparent 1.3px)`,
            backgroundSize: "8px 8px",
            opacity: 0.45,
            pointerEvents: "none",
          }}
        />
      )}

      {isHorizontal ? (
        // ── Horizontal cinematic layout ──
        <div
          style={{
            position: "relative", height: "100%", minHeight,
            padding,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            alignItems: "center",
            gap: 32,
            color: p.text,
          }}
        >
          <div>
            <span
              style={{
                display: "inline-block",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase",
                color: p.eyebrow, marginBottom: 14,
              }}
            >
              0{index + 1} · Service · Featured
            </span>
            <h3
              style={{
                fontWeight: 800,
                fontSize: titleSize,
                letterSpacing: "-0.035em",
                lineHeight: 1.04,
                marginBottom: 12,
                color: p.text,
              }}
            >
              {category}
            </h3>
            <p
              style={{
                fontSize: 15, color: p.mutedText,
                lineHeight: 1.6, marginBottom: 18, maxWidth: "62ch",
              }}
            >
              {meta.tagline}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                  padding: "6px 14px", borderRadius: 100,
                  background: p.pillBg, color: p.pillText, border: p.pillBorder,
                }}
              >
                {count} {count === 1 ? "project" : "projects"}
              </span>
              <span
                style={{
                  fontSize: 12, color: p.mutedText,
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: p.dotDivider }} />
                Open the system
              </span>
            </div>
          </div>
          <div
            style={{
              width: arrowSize, height: arrowSize, borderRadius: "50%",
              background: p.arrowBg, border: p.arrowBorder,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.25s, transform 0.25s",
              flexShrink: 0,
            }}
            className="group-hover:!bg-[#C2A878] group-hover:scale-110"
          >
            <ArrowUpRight size={arrowIcon} style={{ color: p.arrowText }} />
          </div>
        </div>
      ) : (
        <div
          style={{
            position: "relative", height: "100%", minHeight,
            padding,
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            color: p.text,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span
              style={{
                fontSize: isCompact ? 9 : 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase",
                color: p.eyebrow,
              }}
            >
              {isSpotlight ? "Featured · 01 · Service" : `0${index + 1} · Service`}
            </span>
            <div
              style={{
                width: arrowSize, height: arrowSize, borderRadius: "50%",
                background: p.arrowBg,
                border: p.arrowBorder,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.25s, transform 0.25s",
              }}
              className="group-hover:!bg-[#C2A878] group-hover:scale-110"
            >
              <ArrowUpRight size={arrowIcon} style={{ color: p.arrowText }} />
            </div>
          </div>

          <div>
            <h3
              style={{
                fontWeight: 800,
                fontSize: titleSize,
                letterSpacing: "-0.035em",
                lineHeight: 1.04,
                marginBottom: isSpotlight ? 18 : isCompact ? 10 : 14,
                color: p.text,
              }}
            >
              {category}
          </h3>
          <p
            style={{
              fontSize: 14, color: p.mutedText,
              lineHeight: 1.55, marginBottom: 22, maxWidth: "36ch",
            }}
          >
            {meta.tagline}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                padding: "6px 14px", borderRadius: 100,
                background: p.pillBg, color: p.pillText, border: p.pillBorder,
              }}
            >
              {count} {count === 1 ? "project" : "projects"}
            </span>
            <span
              style={{
                fontSize: 12, color: p.mutedText,
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: p.dotDivider }} />
              View collection
            </span>
          </div>
          </div>
        </div>
      )}
    </motion.a>
  );
}

// ── Main Portfolio Page ──
export default function Portfolio() {
  // Routes: /portfolio, /portfolio/:category, /portfolio/shared/:slug, /portfolio/shared/:slug/:category
  const [, sharedCatMatch] = useRoute<{ slug: string; category: string }>("/portfolio/shared/:slug/:category");
  const [, sharedRootMatch] = useRoute<{ slug: string }>("/portfolio/shared/:slug");
  const [, plainCatMatch] = useRoute<{ category: string }>("/portfolio/:category");

  const shareSlug = sharedCatMatch?.slug ?? sharedRootMatch?.slug ?? null;
  const sharePrefix = shareSlug ? `/portfolio/shared/${shareSlug}` : "/portfolio";
  const rawCategorySlug = sharedCatMatch?.category ?? (sharedRootMatch ? undefined : plainCatMatch?.category);
  // Guard against the literal "shared" being treated as a category slug.
  const categorySlug = rawCategorySlug === "shared" ? undefined : rawCategorySlug;
  const activeCategory = categorySlug ? slugToCategory(categorySlug) : null;

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareNotFound, setShareNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setShareNotFound(false);
      try {
        if (shareSlug) {
          const res = await fetch(`${API_BASE}/admin/portfolio/shares/public/${encodeURIComponent(shareSlug)}`);
          if (res.status === 404) { if (!cancelled) setShareNotFound(true); return; }
          if (res.ok) {
            const data = await res.json() as { items: PortfolioItem[]; share: { hiddenCategories: string[] } };
            if (!cancelled) {
              setItems(data.items ?? []);
              setHiddenCategories(data.share?.hiddenCategories ?? []);
            }
          }
        } else {
          const res = await fetch(`${API_BASE}/admin/portfolio/items`);
          if (!cancelled && res.ok) {
            setItems(await res.json());
            setHiddenCategories([]);
          }
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [shareSlug]);

  // In share mode, drop entire categories that the admin hid (so they don't show as empty 0-count cards).
  const visibleCategories = shareSlug ? CATEGORIES.filter((c) => !hiddenCategories.includes(c)) : CATEGORIES;

  if (shareNotFound) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F8F6", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, color: "#5F5F5F", marginBottom: 16 }}>This share link is no longer active.</p>
          <Link href="/portfolio" style={{ color: "#1E293B", fontWeight: 700, textDecoration: "underline" }}>
            ← Browse all work
          </Link>
        </div>
      </div>
    );
  }

  // ── CATEGORY VIEW ──
  if (categorySlug) {
    if (!activeCategory) {
      return (
        <div style={{ minHeight: "100vh", background: "#F8F8F6", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 16, color: "#5F5F5F", marginBottom: 16 }}>Category not found.</p>
            <Link href={sharePrefix}>
              <a style={{ color: "#1E293B", fontWeight: 700, textDecoration: "underline" }}>← Back to portfolio</a>
            </Link>
          </div>
        </div>
      );
    }

    const categoryItems = items.filter((i) => i.category === activeCategory);
    const meta = CATEGORY_META[activeCategory];

    // Split video-type items into shorts (9:16) and longs (16:9),
    // then weave: 3 shorts row → 1 long full-width → repeat.
    type VideoBlock =
      | { kind: "shorts"; items: PortfolioItem[] }
      | { kind: "long"; item: PortfolioItem };
    const videoBlocks: VideoBlock[] = [];
    if (meta.type === "video") {
      const shorts = categoryItems.filter((i) => isShortVideo(i.youtubeUrl));
      const longs = categoryItems.filter((i) => !isShortVideo(i.youtubeUrl));
      let sIdx = 0;
      let lIdx = 0;
      while (sIdx < shorts.length || lIdx < longs.length) {
        if (sIdx < shorts.length) {
          videoBlocks.push({ kind: "shorts", items: shorts.slice(sIdx, sIdx + 3) });
          sIdx += 3;
        }
        if (lIdx < longs.length) {
          videoBlocks.push({ kind: "long", item: longs[lIdx] });
          lIdx += 1;
        }
      }
    }

    return (
      <div style={{ minHeight: "100vh", background: "#F8F8F6" }}>
        {/* Hero */}
        <div style={{ background: BRAND_ACCENT, padding: "120px 24px 84px", position: "relative", overflow: "hidden" }}>
          {/* Top accent line */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #C2A878, #D4BB90)" }} />
          {/* Soft gold radial glow — adds depth without colour shift */}
          <div
            aria-hidden
            style={{
              position: "absolute", top: -180, right: -120, width: 520, height: 520,
              background: "radial-gradient(circle, rgba(194,168,120,0.22) 0%, rgba(194,168,120,0) 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute", bottom: -160, left: -100, width: 440, height: 440,
              background: "radial-gradient(circle, rgba(194,168,120,0.12) 0%, rgba(194,168,120,0) 70%)",
              pointerEvents: "none",
            }}
          />
          {/* Subtle film grain for premium texture */}
          <div
            aria-hidden
            style={{
              position: "absolute", inset: 0, opacity: 0.04, pointerEvents: "none",
              backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
            }}
          />
          <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
            <Link href={sharePrefix}>
              <a
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600,
                  marginBottom: 36, textDecoration: "none",
                  transition: "color 0.2s",
                }}
                className="hover:!text-white"
              >
                <ArrowLeft size={15} /> All services
              </a>
            </Link>
            <h1 style={{ fontWeight: 800, fontSize: "clamp(38px, 7.2vw, 78px)", letterSpacing: "-0.045em", lineHeight: 1.02, color: "#fff", marginBottom: 24 }}>
              {activeCategory}
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.78)", lineHeight: 1.65, maxWidth: "56ch", marginBottom: 32, fontWeight: 400 }}>
              {meta.tagline}
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
                  padding: "8px 16px", borderRadius: 100,
                  background: "rgba(194,168,120,0.14)",
                  border: "1px solid rgba(194,168,120,0.35)",
                  color: "#D4BB90",
                  display: "inline-flex", alignItems: "center", gap: 8,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C2A878", boxShadow: "0 0 8px rgba(194,168,120,0.8)" }} />
                {categoryItems.length} {categoryItems.length === 1 ? "project" : "projects"}
              </span>
            </div>
          </div>
        </div>

        {/* Collage */}
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "64px 32px 112px" }} className="services-wrap">
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #E5E5E0", borderTopColor: "#1E293B" }} className="animate-spin" />
            </div>
          ) : categoryItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <p style={{ fontSize: 16, color: "#8A8A8A" }}>
                No projects in {activeCategory} yet.
              </p>
            </div>
          ) : meta.type === "video" ? (
            // ── VIDEO: 3 shorts row → 1 long full-width → repeat ──
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {videoBlocks.map((block, bi) =>
                block.kind === "shorts" ? (
                  <div
                    key={bi}
                    className="reel-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 24,
                    }}
                  >
                    {block.items.map((item) => <ReelTile key={item.id} item={item} />)}
                  </div>
                ) : (
                  <div key={bi}>
                    <VideoTile item={block.item} featured />
                  </div>
                )
              )}
            </div>
          ) : (
            // ── CASE STUDY: featured + grid ──
            <>
              {categoryItems[0] && (
                <div style={{ marginBottom: 28 }}>
                  <CaseStudyTile item={categoryItems[0]} featured sharePrefix={sharePrefix} />
                </div>
              )}
              {categoryItems.length > 1 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: 22,
                  }}
                >
                  {categoryItems.slice(1).map((item) => <CaseStudyTile key={item.id} item={item} sharePrefix={sharePrefix} />)}
                </div>
              )}
            </>
          )}
        </div>
        <style>{`
          @media (max-width: 1100px) {
            .reel-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (max-width: 768px) {
            .video-row { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 640px) {
            .reel-grid { grid-template-columns: 1fr !important; }
            .services-wrap { padding-left: 20px !important; padding-right: 20px !important; }
          }
        `}</style>
      </div>
    );
  }

  // ── LANDING (service grid) ──
  const itemsByCategory = (cat: string) => items.filter((i) => i.category === cat);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6" }}>
      {/* Hero */}
      <div style={{ background: "#1E293B", padding: "128px 24px 88px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #C2A878, #D4BB90)" }} />
        <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(194,168,120,0.9)", marginBottom: 22 }}>
            Work &amp; Systems
          </p>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(40px, 7vw, 78px)", letterSpacing: "-0.04em", lineHeight: 1.03, color: "#F8F8F6", marginBottom: 24 }}>
            Authority systems, by service.
          </h1>
          <p style={{ fontSize: 17, color: "rgba(248,248,246,0.72)", lineHeight: 1.7, maxWidth: "58ch" }}>
            Content, positioning, production, and distribution built to compound visibility into inbound demand.
          </p>
        </div>
      </div>

      {/* Service grid */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "72px 32px 112px" }} className="services-wrap">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #E5E5E0", borderTopColor: "#1E293B" }} className="animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Zone 1: spotlight + compact stack ── */}
            <div
              className="service-grid sg-featured"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gridAutoRows: "minmax(240px, auto)",
                gap: 26,
              }}
            >
              {visibleCategories.slice(0, 3).map((cat, i) => {
                const list = itemsByCategory(cat);
                const variant: ServiceCardVariant =
                  i === 0 ? "spotlight" : "compact";
                return (
                  <ServiceCard
                    key={cat}
                    category={cat}
                    count={list.length}
                    index={i}
                    variant={variant}
                    sharePrefix={sharePrefix}
                  />
                );
              })}
            </div>

            {/* ── Zone 2: cinematic ecosystem strip ── */}
            <EcosystemStrip />

            {/* ── Zone 3: main grid ── */}
            <div
              className="service-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 26,
              }}
            >
              {visibleCategories.slice(3, 9).map((cat, i) => {
                const list = itemsByCategory(cat);
                return (
                  <ServiceCard
                    key={cat}
                    category={cat}
                    count={list.length}
                    index={i + 3}
                    sharePrefix={sharePrefix}
                  />
                );
              })}
            </div>

            {/* ── Zone 4: horizontal cinematic finisher ── */}
            {visibleCategories[9] && (
              <div
                className="service-grid sg-finisher"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  marginTop: 26,
                }}
              >
                <ServiceCard
                  key={visibleCategories[9]}
                  category={visibleCategories[9]}
                  count={itemsByCategory(visibleCategories[9]).length}
                  index={9}
                  variant="horizontal"
                  sharePrefix={sharePrefix}
                />
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        /* Featured zone grid spans */
        .sg-featured .sc-spotlight { grid-column: span 2; grid-row: span 2; }
        .sg-featured .sc-compact   { grid-column: span 1; }

        @media (max-width: 1100px) {
          .service-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .reel-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .sg-featured .sc-spotlight { grid-column: span 2 !important; grid-row: span 1 !important; }
          .sg-featured .sc-compact   { grid-column: span 1 !important; }
          .ecosystem-strip-pillars { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .service-grid { grid-template-columns: 1fr !important; gap: 18px !important; }
          .sg-featured  { grid-template-columns: 1fr !important; gap: 18px !important; }
          .sg-featured .sc-spotlight { grid-column: span 1 !important; grid-row: span 1 !important; }
          .sg-featured .sc-compact   { grid-column: span 1 !important; }
          .reel-grid { grid-template-columns: 1fr !important; }
          .video-row { grid-template-columns: 1fr !important; }
          .services-wrap { padding-left: 20px !important; padding-right: 20px !important; }
          .ecosystem-strip { padding: 32px 24px !important; }
          .ecosystem-strip h3 { font-size: 26px !important; }
          .ecosystem-strip-horizontal-row { flex-direction: column !important; align-items: flex-start !important; gap: 18px !important; }
        }
        .service-card a, .service-card { text-decoration: none; }
      `}</style>
    </div>
  );
}

// ── Cinematic ecosystem strip — between featured zone and main grid ──
function EcosystemStrip() {
  const pillars = [
    { num: "01", title: "Position",   sub: "Authority-first messaging that compounds trust." },
    { num: "02", title: "Produce",    sub: "High-signal content engineered for retention." },
    { num: "03", title: "Distribute", sub: "Inbound systems that turn reach into demand." },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="ecosystem-strip"
      style={{
        position: "relative",
        margin: "44px 0",
        padding: "44px 48px",
        borderRadius: 22,
        background: "linear-gradient(160deg, #EFEFEA 0%, #F8F8F6 100%)",
        border: "1.5px solid rgba(194,168,120,0.30)",
        overflow: "hidden",
      }}
    >
      {/* Gold rail */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: "linear-gradient(90deg, #C2A878, #D4BB90)",
        }}
      />
      {/* Subtle dot pattern */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(30,41,59,0.06) 1.2px, transparent 1.2px)",
          backgroundSize: "22px 22px",
          pointerEvents: "none",
        }}
      />

      <div
        className="ecosystem-strip-horizontal-row"
        style={{
          position: "relative",
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          gap: 24, marginBottom: 28,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "#C2A878", marginBottom: 12,
            }}
          >
            Built as an ecosystem
          </p>
          <h3
            style={{
              fontWeight: 800, fontSize: "clamp(28px, 3.2vw, 38px)",
              letterSpacing: "-0.03em", lineHeight: 1.08, color: "#0A0A0A",
              maxWidth: "22ch",
            }}
          >
            Where authority meets distribution.
          </h3>
        </div>
        <p
          style={{
            fontSize: 14, color: "#5F5F5F", lineHeight: 1.65,
            maxWidth: "40ch",
          }}
        >
          Every service functions as part of a connected ecosystem designed to compound visibility into inbound growth.
        </p>
      </div>

      <div
        className="ecosystem-strip-pillars"
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 24,
          paddingTop: 24,
          borderTop: "1px solid rgba(30,41,59,0.10)",
        }}
      >
        {pillars.map((p) => (
          <div key={p.num} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span
              style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.16em",
                color: "#C2A878", paddingTop: 2, flexShrink: 0,
              }}
            >
              {p.num}
            </span>
            <div>
              <p
                style={{
                  fontWeight: 700, fontSize: 15, color: "#0A0A0A",
                  letterSpacing: "-0.01em", marginBottom: 4,
                }}
              >
                {p.title}
              </p>
              <p style={{ fontSize: 13, color: "#5F5F5F", lineHeight: 1.55 }}>
                {p.sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
