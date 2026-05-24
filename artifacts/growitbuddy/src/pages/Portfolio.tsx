import { useState, useEffect } from "react";
import { Play, ArrowLeft, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRoute, Link, useLocation } from "wouter";

import { API_BASE } from "@/lib/api";
import { getEmbedUrl, getThumbnail, getHiResThumbnail } from "@/lib/videoEmbed";

type CategoryType = "video" | "reel" | "case-study";

const CATEGORIES = [
  "Personal Branding",
  "Content Creation",
  "Video Editing",
  "Reels / Shorts",
  "Graphics",
  "Social Media Management",
  "Distribution & Growth",
  "Web & Funnel Systems",
  "AI Automation",
  "Digital Products & Growth",
] as const;

const CATEGORY_META: Record<string, { slug: string; tagline: string; type: CategoryType }> = {
  "Personal Branding": {
    slug: "personal-branding",
    tagline: "Positioning and authority systems for founders, creators, and operators.",
    type: "case-study",
  },
  "Content Creation": {
    slug: "content-creation",
    tagline: "High-signal content production engineered for trust and consistency at scale.",
    type: "video",
  },
  "Video Editing": {
    slug: "video-editing",
    tagline: "Cinematic long-form edits crafted to convert attention into authority.",
    type: "video",
  },
  "Reels / Shorts": {
    slug: "reels-shorts",
    tagline: "Scroll-stopping short-form built for reach and retention.",
    type: "reel",
  },
  "Graphics": {
    slug: "graphics",
    tagline: "Visual systems and design that make brands unforgettable.",
    type: "case-study",
  },
  "Social Media Management": {
    slug: "social-media-management",
    tagline: "End-to-end social systems that turn channels into engines.",
    type: "case-study",
  },
  "Distribution & Growth": {
    slug: "distribution-growth",
    tagline: "Amplification networks and performance systems that push content to the right audiences.",
    type: "case-study",
  },
  "Web & Funnel Systems": {
    slug: "web-funnel-systems",
    tagline: "Digital infrastructure — sites and funnels engineered to convert.",
    type: "case-study",
  },
  "AI Automation": {
    slug: "ai-automation",
    tagline: "AI-powered authority systems that compound output without scaling headcount.",
    type: "case-study",
  },
  "Digital Products & Growth": {
    slug: "digital-products-growth",
    tagline: "Monetization systems — products, offers, and funnels built to grow.",
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

interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  youtubeUrl: string;
  description: string | null;
  sortOrder: number;
}

// ── Video Tile (16:9) — long-form ──
function VideoTile({ item, featured = false }: { item: PortfolioItem; featured?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const embedUrl = getEmbedUrl(item.youtubeUrl);
  const thumb = featured ? getHiResThumbnail(item.youtubeUrl) : getThumbnail(item.youtubeUrl);

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
            src={`${embedUrl}&autoplay=1`}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  const fallback = getThumbnail(item.youtubeUrl);
                  if (el.src !== fallback) el.src = fallback;
                }}
              />
            )}
            <div
              style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
              onClick={() => setPlaying(true)}
            >
              <div
                style={{
                  width: featured ? 76 : 60, height: featured ? 76 : 60,
                  borderRadius: "50%", background: "rgba(255,255,255,0.95)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                  transition: "transform 0.2s",
                }}
                className="hover:scale-110"
              >
                <Play size={featured ? 30 : 24} style={{ color: "#0A0A0A", marginLeft: 3 }} fill="#0A0A0A" />
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ padding: featured ? "26px 26px 28px" : "20px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <span
          style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
            padding: "5px 11px", borderRadius: 100, background: "#EFEFEA", color: "#1E293B",
            alignSelf: "flex-start",
          }}
        >
          {item.category}
        </span>
        <h3
          style={{
            fontWeight: 800,
            fontSize: featured ? 24 : 17,
            letterSpacing: "-0.025em",
            color: "#0A0A0A",
            lineHeight: 1.25,
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
  const embedUrl = getEmbedUrl(item.youtubeUrl);
  const thumb = getHiResThumbnail(item.youtubeUrl);

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
            src={`${embedUrl}&autoplay=1`}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  const fallback = getThumbnail(item.youtubeUrl);
                  if (el.src !== fallback) el.src = fallback;
                }}
              />
            )}
            {/* Bottom info overlay — title visible on the reel */}
            <div
              style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)",
                cursor: "pointer",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                padding: 16,
              }}
              onClick={() => setPlaying(true)}
            >
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div
                  style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: "rgba(255,255,255,0.95)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                    transition: "transform 0.2s",
                  }}
                  className="hover:scale-110"
                >
                  <Play size={22} style={{ color: "#0A0A0A", marginLeft: 3 }} fill="#0A0A0A" />
                </div>
              </div>
              <div>
                <h3
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                    letterSpacing: "-0.02em",
                    color: "#fff",
                    lineHeight: 1.3,
                    margin: 0,
                  }}
                >
                  {item.title}
                </h3>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Case Study Tile Palette ──
// 4 variants cycled by item id — strict brand palette only.
type CaseTilePalette = {
  bg: string;
  watermark: string;
  pillBg: string;
  pillText: string;
  arrowBg: string;
  arrowText: string;
  border: string;
  dotColor: string;
  categoryColor: string;
};

const CASE_TILE_PALETTES: CaseTilePalette[] = [
  // 0 — Cream + dark slate watermark
  {
    bg: "linear-gradient(135deg, #F8F8F6 0%, #EFEFEA 100%)",
    watermark: "rgba(30,41,59,0.10)",
    pillBg: "#1E293B",
    pillText: "#FFFFFF",
    arrowBg: "#1E293B",
    arrowText: "#FFFFFF",
    border: "1.5px solid #E5E5E0",
    dotColor: "rgba(30,41,59,0.10)",
    categoryColor: "#1E293B",
  },
  // 1 — Dark slate + gold watermark
  {
    bg: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
    watermark: "rgba(194,168,120,0.18)",
    pillBg: "rgba(255,255,255,0.95)",
    pillText: "#1E293B",
    arrowBg: "#C2A878",
    arrowText: "#0A0A0A",
    border: "1.5px solid #1E293B",
    dotColor: "rgba(194,168,120,0.16)",
    categoryColor: "#C2A878",
  },
  // 2 — Gold-tinted soft + dark watermark
  {
    bg: "linear-gradient(135deg, #EFEFEA 0%, rgba(194,168,120,0.22) 100%)",
    watermark: "rgba(10,10,10,0.10)",
    pillBg: "#0A0A0A",
    pillText: "#C2A878",
    arrowBg: "#0A0A0A",
    arrowText: "#C2A878",
    border: "1.5px solid rgba(194,168,120,0.45)",
    dotColor: "rgba(10,10,10,0.08)",
    categoryColor: "#0A0A0A",
  },
  // 3 — Off-cream + slate watermark with gold accents
  {
    bg: "linear-gradient(135deg, #EFEFEA 0%, #F8F8F6 100%)",
    watermark: "rgba(30,41,59,0.12)",
    pillBg: "#C2A878",
    pillText: "#0A0A0A",
    arrowBg: "#1E293B",
    arrowText: "#FFFFFF",
    border: "1.5px solid #E5E5E0",
    dotColor: "rgba(30,41,59,0.09)",
    categoryColor: "#1E293B",
  },
];

// Decorative dotted grid for case study tile backgrounds
function DottedGrid({ color, opacity = 1 }: { color: string; opacity?: number }) {
  return (
    <div
      style={{
        position: "absolute", inset: 0, opacity,
        backgroundImage: `radial-gradient(${color} 1.2px, transparent 1.2px)`,
        backgroundSize: "22px 22px",
        backgroundPosition: "0 0",
        pointerEvents: "none",
      }}
    />
  );
}

// ── Case Study Tile — color-differentiated branded design (no photo) ──
function CaseStudyTile({ item, featured = false }: { item: PortfolioItem; featured?: boolean }) {
  const [, setLocation] = useLocation();
  const meta = CATEGORY_META[item.category];
  const href = meta ? `/portfolio/${meta.slug}/case/${item.id}` : "#";
  const palette = CASE_TILE_PALETTES[item.id % CASE_TILE_PALETTES.length];

  // Big watermark — initials of title (up to 2 letters)
  const initials = item.title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "GB";

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
      {/* Branded card — no photo */}
      <a
        href={href}
        onClick={go}
        style={{
          position: "relative",
          display: "block",
          aspectRatio: featured ? "16/9" : "4/3",
          borderRadius: 18,
          overflow: "hidden",
          background: palette.bg,
          border: palette.border,
          transition: "transform 0.3s, box-shadow 0.3s, border-color 0.3s",
          textDecoration: "none",
        }}
        className="hover:-translate-y-1 hover:shadow-2xl hover:border-[#C2A878]"
      >
        {/* Subtle dotted-grid decoration */}
        <DottedGrid color={palette.dotColor} />

        {/* Gold corner accent strip — top-right */}
        <div
          style={{
            position: "absolute", top: 0, right: 0,
            width: 64, height: 4,
            background: "#C2A878",
            opacity: 0.9,
          }}
        />

        {/* Huge initials watermark — center-right */}
        <div
          style={{
            position: "absolute",
            right: featured ? "-2%" : "-4%",
            bottom: featured ? "-12%" : "-14%",
            fontSize: featured ? "clamp(180px, 22vw, 320px)" : "clamp(120px, 18vw, 200px)",
            fontWeight: 800,
            letterSpacing: "-0.06em",
            color: palette.watermark,
            lineHeight: 0.85,
            transition: "transform 0.5s, opacity 0.3s",
            userSelect: "none",
            fontFamily: "inherit",
          }}
          className="group-hover:scale-105"
        >
          {initials}
        </div>

        {/* Category label — large, prominent */}
        <div
          style={{
            position: "absolute",
            top: featured ? 28 : 22,
            left: featured ? 28 : 22,
            right: featured ? 28 : 22,
            display: "flex", flexDirection: "column", gap: 8,
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
              padding: "5px 11px", borderRadius: 100,
              background: palette.pillBg, color: palette.pillText,
              alignSelf: "flex-start",
            }}
          >
            Case Study
          </span>
          <span
            style={{
              fontSize: featured ? 13 : 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: palette.categoryColor,
              opacity: 0.85,
            }}
          >
            {item.category}
          </span>
        </div>

        {/* Arrow button — bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: featured ? 22 : 18,
            right: featured ? 22 : 18,
            width: featured ? 48 : 42,
            height: featured ? 48 : 42,
            borderRadius: "50%",
            background: palette.arrowBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            transition: "transform 0.25s, background 0.25s",
            zIndex: 2,
          }}
          className="group-hover:scale-110 group-hover:!bg-[#C2A878] group-hover:!text-[#0A0A0A]"
        >
          <ArrowUpRight size={featured ? 20 : 18} style={{ color: palette.arrowText }} />
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
          {item.category}
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

// ── Service Category Card (landing) — uniform brand palette ──
function ServiceCard({
  category, count, previewThumb, index,
}: { category: string; count: number; previewThumb: string; index: number }) {
  const meta = CATEGORY_META[category];
  const [, setLocation] = useLocation();
  const href = `/portfolio/${meta.slug}`;
  const go = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // allow new-tab
    e.preventDefault();
    setLocation(href);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };
  return (
    <motion.a
      href={href}
      onClick={go}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.55 }}
      whileHover={{ y: -6 }}
      style={{
        position: "relative",
        display: "block",
        borderRadius: 22,
        overflow: "hidden",
        cursor: "pointer",
        minHeight: 340,
        background: BRAND_ACCENT,
        boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
        transition: "box-shadow 0.3s",
        textDecoration: "none",
      }}
      className="service-card group hover:shadow-2xl"
    >
        {previewThumb && (
          <img
            src={previewThumb}
            alt=""
            loading="lazy"
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", opacity: 0.32,
              transition: "transform 0.6s, opacity 0.3s",
            }}
            className="group-hover:scale-110 group-hover:opacity-50"
          />
        )}
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(160deg, rgba(15,23,42,0.65) 0%, rgba(15,23,42,0.92) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: "linear-gradient(90deg, #C2A878, #D4BB90)",
          }}
        />

        <div
          style={{
            position: "relative", height: "100%", minHeight: 340,
            padding: "32px 32px 30px",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase",
                color: "rgba(194,168,120,0.9)",
              }}
            >
              0{index + 1} · Service
            </span>
            <div
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.25s, transform 0.25s",
              }}
              className="group-hover:bg-[#C2A878] group-hover:scale-110"
            >
              <ArrowUpRight size={20} />
            </div>
          </div>

          <div>
            <h3
              style={{
                fontWeight: 800,
                fontSize: "clamp(28px, 3.6vw, 40px)",
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
                marginBottom: 14,
              }}
            >
              {category}
            </h3>
            <p
              style={{
                fontSize: 14, color: "rgba(255,255,255,0.72)",
                lineHeight: 1.55, marginBottom: 20, maxWidth: "36ch",
              }}
            >
              {meta.tagline}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                  padding: "6px 14px", borderRadius: 100,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
              >
                {count} {count === 1 ? "project" : "projects"}
              </span>
              <span
                style={{
                  fontSize: 12, color: "rgba(255,255,255,0.6)",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#C2A878" }} />
                View collection
              </span>
            </div>
          </div>
        </div>
    </motion.a>
  );
}

// ── Main Portfolio Page ──
export default function Portfolio() {
  const [, params] = useRoute<{ category?: string }>("/portfolio/:category");
  const categorySlug = params?.category;
  const activeCategory = categorySlug ? slugToCategory(categorySlug) : null;

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/admin/portfolio/items`);
        if (!cancelled && res.ok) {
          setItems(await res.json());
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── CATEGORY VIEW ──
  if (categorySlug) {
    if (!activeCategory) {
      return (
        <div style={{ minHeight: "100vh", background: "#F8F8F6", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 16, color: "#5F5F5F", marginBottom: 16 }}>Category not found.</p>
            <Link href="/portfolio">
              <a style={{ color: "#1E293B", fontWeight: 700, textDecoration: "underline" }}>← Back to portfolio</a>
            </Link>
          </div>
        </div>
      );
    }

    const categoryItems = items.filter((i) => i.category === activeCategory);
    const meta = CATEGORY_META[activeCategory];

    // Chunk video items into [1 big, 2 normal] repeating blocks
    const videoBlocks: PortfolioItem[][] = [];
    if (meta.type === "video") {
      for (let i = 0; i < categoryItems.length; i += 3) {
        videoBlocks.push(categoryItems.slice(i, i + 3));
      }
    }

    return (
      <div style={{ minHeight: "100vh", background: "#F8F8F6" }}>
        {/* Hero */}
        <div style={{ background: BRAND_ACCENT, padding: "120px 24px 72px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #C2A878, #D4BB90)" }} />
          <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
            <Link href="/portfolio">
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
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(194,168,120,0.9)", marginBottom: 18 }}>
              Portfolio · Collection
            </p>
            <h1 style={{ fontWeight: 800, fontSize: "clamp(36px, 7vw, 72px)", letterSpacing: "-0.04em", lineHeight: 1.04, color: "#fff", marginBottom: 22 }}>
              {activeCategory}
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.72)", lineHeight: 1.65, maxWidth: "54ch", marginBottom: 26 }}>
              {meta.tagline}
            </p>
            <span
              style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
                padding: "7px 14px", borderRadius: 100,
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                display: "inline-block",
              }}
            >
              {categoryItems.length} {categoryItems.length === 1 ? "project" : "projects"}
            </span>
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
          ) : meta.type === "reel" ? (
            // ── REEL: 3 per row, bigger tiles ──
            <div
              className="reel-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 24,
              }}
            >
              {categoryItems.map((item) => <ReelTile key={item.id} item={item} />)}
            </div>
          ) : meta.type === "video" ? (
            // ── VIDEO: pattern of [1 big, 2 normal] repeating ──
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {videoBlocks.map((block, bi) => (
                <div key={bi} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                  {block[0] && <VideoTile item={block[0]} featured />}
                  {block.length > 1 && (
                    <div
                      className="video-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 22,
                      }}
                    >
                      {block.slice(1).map((item) => <VideoTile key={item.id} item={item} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // ── CASE STUDY: featured + grid ──
            <>
              {categoryItems[0] && (
                <div style={{ marginBottom: 28 }}>
                  <CaseStudyTile item={categoryItems[0]} featured />
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
                  {categoryItems.slice(1).map((item) => <CaseStudyTile key={item.id} item={item} />)}
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
            Portfolio
          </p>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(40px, 7vw, 78px)", letterSpacing: "-0.04em", lineHeight: 1.03, color: "#F8F8F6", marginBottom: 24 }}>
            Our Work, by service.
          </h1>
          <p style={{ fontSize: 17, color: "rgba(248,248,246,0.65)", lineHeight: 1.7, maxWidth: "54ch" }}>
            A curated look at what we build — pick a service to explore the full collection.
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
          <div
            className="service-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 26,
            }}
          >
            {CATEGORIES.map((cat, i) => {
              const list = itemsByCategory(cat);
              const preview = list[0] ? getHiResThumbnail(list[0].youtubeUrl) : "";
              return (
                <ServiceCard
                  key={cat}
                  category={cat}
                  count={list.length}
                  previewThumb={preview}
                  index={i}
                />
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .service-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .reel-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .service-grid { grid-template-columns: 1fr !important; gap: 18px !important; }
          .reel-grid { grid-template-columns: 1fr !important; }
          .video-row { grid-template-columns: 1fr !important; }
          .services-wrap { padding-left: 20px !important; padding-right: 20px !important; }
        }
        .service-card a, .service-card { text-decoration: none; }
      `}</style>
    </div>
  );
}
