import { useState, useEffect, useRef } from "react";
import { Play, X, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { API_BASE } from "@/lib/api";

const CATEGORIES = ["All Work", "Video Editing", "Reels / Shorts", "Graphics", "Social Media Management"];

interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  youtubeUrl: string;
  description: string | null;
  sortOrder: number;
}

function getEmbedUrl(url: string): string {
  let videoId = "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      videoId = u.pathname.slice(1);
    } else if (u.hostname.includes("youtube.com")) {
      if (u.pathname.includes("/shorts/")) {
        videoId = u.pathname.split("/shorts/")[1]?.split("/")[0] ?? "";
      } else {
        videoId = u.searchParams.get("v") ?? "";
      }
    }
  } catch {
    const m = url.match(/(?:v=|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
    videoId = m?.[1] ?? "";
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : "";
}

function getThumbnail(url: string): string {
  const embed = getEmbedUrl(url);
  const m = embed.match(/embed\/([a-zA-Z0-9_-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : "";
}

// ── Video Card ──
function VideoCard({ item }: { item: PortfolioItem }) {
  const [playing, setPlaying] = useState(false);
  const embedUrl = getEmbedUrl(item.youtubeUrl);
  const thumb = getThumbnail(item.youtubeUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: "#fff", border: "1.5px solid #E5E5E0", borderRadius: 16,
        overflow: "hidden", display: "flex", flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      className="hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Thumbnail / Player */}
      <div style={{ position: "relative", aspectRatio: "16/9", background: "#0A0A0A", flexShrink: 0 }}>
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
              />
            )}
            <div style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }} onClick={() => setPlaying(true)}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.92)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)", transition: "transform 0.2s",
              }}
              className="hover:scale-110">
                <Play size={22} style={{ color: "#0A0A0A", marginLeft: 3 }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "20px 20px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
          padding: "4px 10px", borderRadius: 100, background: "#EFEFEA", color: "#1E293B",
          alignSelf: "flex-start",
        }}>
          {item.category}
        </span>
        <h3 style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", color: "#0A0A0A", lineHeight: 1.3, margin: 0 }}>
          {item.title}
        </h3>
        {item.description && (
          <p style={{ fontSize: 13, color: "#8A8A8A", lineHeight: 1.6, margin: 0 }}>
            {item.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Portfolio Page ──
export default function Portfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All Work");

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/portfolio/items`);
      if (res.ok) {
        setItems(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  const filtered = activeCategory === "All Work"
    ? items
    : items.filter((i) => i.category === activeCategory);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6" }}>
      {/* Header */}
      <div style={{ background: "#1E293B", padding: "60px 24px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(248,248,246,0.5)", marginBottom: 16 }}>
            Private Portfolio
          </p>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(32px, 6vw, 64px)", letterSpacing: "-0.04em", lineHeight: 1.05, color: "#F8F8F6", marginBottom: 16 }}>
            Our Work
          </h1>
          <p style={{ fontSize: 16, color: "rgba(248,248,246,0.6)", lineHeight: 1.6, maxWidth: "48ch" }}>
            A curated selection of content, campaigns, and creative work - shared privately with you.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Category Filter */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 40 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                border: "1.5px solid",
                borderColor: activeCategory === cat ? "#1E293B" : "#E5E5E0",
                background: activeCategory === cat ? "#1E293B" : "#fff",
                color: activeCategory === cat ? "#fff" : "#0A0A0A",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #E5E5E0", borderTopColor: "#1E293B" }}
              className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: 16, color: "#8A8A8A" }}>
              {items.length === 0 ? "No portfolio items yet." : `No items in "${activeCategory}".`}
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
          }}>
            <AnimatePresence mode="popLayout">
              {filtered.map((item) => (
                <VideoCard key={item.id} item={item} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
