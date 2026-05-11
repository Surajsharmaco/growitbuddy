import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Search, X, SlidersHorizontal, ChevronDown, Check, Globe } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { useState, useMemo, useRef, useEffect } from "react";
import { useLiveInfluencers } from "@/hooks/useLiveInfluencers";
import { usePublicContent } from "@/hooks/usePublicContent";

import type { Influencer } from "@/data/influencers";

interface InfluencerExploreData {
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtext: string;
  heroCTA: string;
  ctaEyebrow: string;
  ctaHeadline: string;
  ctaSubtext: string;
  ctaButton: string;
  seoTitle: string;
  seoDesc: string;
}

const IE_DEFAULTS: InfluencerExploreData = {
  heroEyebrow: "Influencer Network",
  heroHeadline: "Work With Proven Influencers.",
  heroSubtext: "Discover creators who build real engagement and drive meaningful results -- not just impressions.",
  heroCTA: "Join as Influencer",
  ctaEyebrow: "Are you a creator?",
  ctaHeadline: "Ready to Get Discovered?",
  ctaSubtext: "Apply to join the Influencer Network. Get reviewed, get listed, and unlock real brand opportunities.",
  ctaButton: "Apply Now",
  seoTitle: "Explore Influencers - GrowitBuddy",
  seoDesc: "Discover proven influencers and content creators who build real engagement and drive meaningful results for ambitious brands.",
};

/* ── Influencer Card ─────────────────────────────────────── */
function InfluencerCard({ inf, i }: { inf: Influencer; i: number }) {
  const [imgError, setImgError] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ delay: i * 0.04, duration: 0.4 }}
    >
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(11,11,11,0.05)",
            border: "1px solid #E5E5E0",
            height: "100%",
          }}
        >
          {/* Photo */}
          <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", overflow: "hidden", background: inf.accentColor }}>
            {!imgError ? (
              <img
                src={inf.photo}
                alt={inf.name}
                onError={() => setImgError(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A0A0A", fontWeight: 800, fontSize: 48, letterSpacing: "-0.02em" }}>
                {inf.initials}
              </div>
            )}
            <div style={{ position: "absolute", top: 14, left: 14, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1E293B", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", borderRadius: 100, padding: "4px 12px", border: "1px solid rgba(255,255,255,0.6)" }}>
              {inf.niche}
            </div>
          </div>

          {/* Info */}
          <div style={{ padding: "20px 20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
              <p style={{ fontWeight: 800, fontSize: 16, color: "#0A0A0A", letterSpacing: "-0.03em", minWidth: 0 }}>{inf.name}</p>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#7A7A85", whiteSpace: "nowrap", flexShrink: 0 }}>{inf.followers}</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#7A7A85", marginBottom: 12 }}>{inf.username}</p>
            <p className="card-description" style={{ fontSize: 13, color: "#5F5F5F", lineHeight: 1.6, marginBottom: 16 }}>{inf.description}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7A7A85", background: "rgba(10,10,10,0.03)", borderRadius: 100, padding: "3px 10px", whiteSpace: "nowrap" }}>
                {inf.engagementRate} eng.
              </span>
            </div>
          </div>
        </div>
    </motion.div>
  );
}

/* ── Shared Dropdown ─────────────────────────────────────── */
function FilterDropdown({
  icon,
  placeholder,
  selected,
  options,
  onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  selected: string[];
  options: string[];
  onChange: (vals: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(val: string) {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
  }

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? selected[0]
      : `${selected.length} selected`;

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 16px",
          background: open ? "#FFFFFF" : "#FFFFFF",
          border: `1.5px solid ${open ? "rgba(30,41,59,0.4)" : "#E5E5E0"}`,
          borderRadius: open ? "12px 12px 0 0" : 12,
          borderBottom: open ? "1.5px solid rgba(10,10,10,0.07)" : undefined,
          cursor: "pointer",
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          fontWeight: selected.length > 0 ? 600 : 400,
          color: open ? "#0A0A0A" : "#5F5F5F", // rgba(11,11,11,0.45)",
          minWidth: 200,
          transition: "background 0.15s, color 0.15s, border-color 0.15s",
        }}
      >
        <span style={{ color: open ? "#8A8A8A" : "rgba(11,11,11,0.35)", flexShrink: 0, display: "flex" }}>{icon}</span>
        <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
        <ChevronDown
          style={{
            width: 14,
            height: 14,
            flexShrink: 0,
            color: open ? "#8A8A8A" : "rgba(11,11,11,0.3)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#FFFFFF",
              border: "1.5px solid rgba(10,10,10,0.06)",
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              zIndex: 50,
              maxHeight: 380,
              overflowY: "auto",
              scrollbarWidth: "none",
            }}
          >
            {/* Clear row */}
            {selected.length > 0 && (
              <button
                onClick={() => onChange([])}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "11px 16px",
                  background: "none",
                  border: "none",
                  borderBottom: "1px solid rgba(10,10,10,0.05)",
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#8A8A8A",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                <X style={{ width: 12, height: 12 }} />
                Clear all
              </button>
            )}

            {/* Options */}
            {options.map((opt) => {
              const checked = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => toggle(opt)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    width: "100%",
                    padding: "13px 16px",
                    background: checked ? "rgba(10,10,10,0.03)" : "none",
                    border: "none",
                    borderBottom: "1px solid rgba(10,10,10,0.03)",
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 14,
                    fontWeight: checked ? 600 : 400,
                    color: "#0A0A0A",
                    textAlign: "left",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLButtonElement).style.background = "rgba(10,10,10,0.03)"; }}
                  onMouseLeave={(e) => { if (!checked) (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      border: `1.5px solid ${checked ? "var(--gb-accent)" : "#CBD0DA"}`,
                      background: checked ? "var(--gb-accent)" : "transparent",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {checked && <Check style={{ width: 11, height: 11, color: "#0A0A0A", strokeWidth: 3 }} />}
                  </div>
                  {opt}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Active tag pill ─────────────────────────────────────── */
function ActiveTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        borderRadius: 100,
        background: "#EFEFEA",
        border: "none",
        color: "#0A0A0A",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif",
        cursor: "pointer",
        letterSpacing: "-0.01em",
      }}
    >
      {label}
      <X style={{ width: 11, height: 11, opacity: 0.5 }} />
    </button>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function InfluencerExplore() {
  const cms = usePublicContent<InfluencerExploreData>("influencer-explore", IE_DEFAULTS);
  const { influencers, genres: NICHE_CATEGORIES, countries: COUNTRIES } = useLiveInfluencers();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let list = influencers.filter((inf) => inf.profileEnabled !== false);
    if (selectedGenres.length > 0) {
      list = list.filter((inf) => selectedGenres.includes(inf.niche));
    }
    if (selectedCountries.length > 0) {
      list = list.filter((inf) =>
        selectedCountries.some((c) => inf.audienceCountries.includes(c))
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (inf) =>
          inf.name.toLowerCase().includes(q) ||
          inf.username.toLowerCase().includes(q) ||
          inf.niche.toLowerCase().includes(q) ||
          inf.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [influencers, selectedGenres, selectedCountries, searchQuery]);

  const hasActiveFilters = selectedGenres.length > 0 || selectedCountries.length > 0;

  function clearAll() {
    setSelectedGenres([]);
    setSelectedCountries([]);
    setSearchQuery("");
  }

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .influencer-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .filter-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .search-wrap { position: relative; flex: 1; min-width: 180px; }
        .search-input {
          width: 100%;
          padding: 10px 14px 10px 38px;
          border-radius: 12px;
          border: 1.5px solid #E5E5E0;
          background: #FFFFFF;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #0A0A0A;
          outline: none;
          transition: border-color 0.15s ease;
          box-sizing: border-box;
        }
        .search-input:focus { border-color: var(--gb-accent); }
        .search-input::placeholder { color: rgba(11,11,11,0.3); }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: rgba(11,11,11,0.3); pointer-events: none; }
        .search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: rgba(11,11,11,0.3); display: flex; align-items: center; background: none; border: none; padding: 0; }
        .search-clear:hover { color: var(--gb-accent); }
        @media (max-width: 900px) {
          .influencer-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
        }
        @media (max-width: 600px) {
          .influencer-grid { grid-template-columns: 1fr; gap: 14px; }
          .influencer-hero { padding-top: 100px !important; padding-bottom: 48px !important; }
          .influencer-grid-section { padding: 40px 16px !important; }
          .influencer-cta-section { padding: 0 16px 64px !important; }
          .influencer-cta-box { padding: 36px 20px !important; border-radius: 16px !important; }
          .card-description { display: none; }
          .filter-row { flex-wrap: wrap; }
          .filter-dropdown-wrap { flex: 1 1 calc(50% - 5px); min-width: 0; }
          .filter-dropdown-wrap button { min-width: unset !important; width: 100%; box-sizing: border-box; }
          .search-wrap { flex: 1 1 100%; max-width: 100% !important; }
          .filter-count { display: none; }
        }
      `}</style>

      <SEOMeta
        title={cms.seoTitle}
        description={cms.seoDesc}
      />

      {/* Hero */}
      <section className="influencer-hero" style={{ paddingTop: 120, paddingBottom: 72, paddingLeft: 24, paddingRight: 24, borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 16 }}>{cms.heroEyebrow}</p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ fontWeight: 800, fontSize: "clamp(28px, 7vw, 88px)", letterSpacing: "-0.04em", lineHeight: "1.08", color: "#0A0A0A", maxWidth: "16ch", marginBottom: 20 }}
          >
            {cms.heroHeadline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: "clamp(15px, 2.5vw, 18px)", color: "#5F5F5F", lineHeight: "1.75", maxWidth: "52ch", marginBottom: 32 }}
          >
            {cms.heroSubtext}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <Link href="/creators">
              <span className="gb-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {cms.heroCTA}
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="influencer-grid-section" style={{ padding: "56px 24px" }}>
        <div className="max-w-[1100px] mx-auto">

          {/* Filter row */}
          <div className="filter-row" style={{ marginBottom: 20 }}>
            {/* Genre dropdown */}
            <div className="filter-dropdown-wrap">
              <FilterDropdown
                icon={<SlidersHorizontal style={{ width: 15, height: 15 }} />}
                placeholder="Select Genre"
                selected={selectedGenres}
                options={NICHE_CATEGORIES}
                onChange={setSelectedGenres}
              />
            </div>

            {/* Country dropdown */}
            <div className="filter-dropdown-wrap">
              <FilterDropdown
                icon={<Globe style={{ width: 15, height: 15 }} />}
                placeholder="Select Country"
                selected={selectedCountries}
                options={COUNTRIES}
                onChange={setSelectedCountries}
              />
            </div>

            {/* Search */}
            <div className="search-wrap">
              <Search className="search-icon" style={{ width: 15, height: 15 }} />
              <input
                className="search-input"
                type="text"
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery("")}>
                  <X style={{ width: 13, height: 13 }} />
                </button>
              )}
            </div>

            {/* Count */}
            <span className="filter-count" style={{ fontSize: 13, fontWeight: 500, color: "#7A7A85", marginLeft: "auto", whiteSpace: "nowrap", flexShrink: 0 }}>
              {filtered.length} creator{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Active filter tags */}
          {hasActiveFilters && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28, alignItems: "center" }}>
              {selectedGenres.map((g) => (
                <ActiveTag key={g} label={g} onRemove={() => setSelectedGenres(selectedGenres.filter((x) => x !== g))} />
              ))}
              {selectedCountries.map((c) => (
                <ActiveTag key={c} label={c} onRemove={() => setSelectedCountries(selectedCountries.filter((x) => x !== c))} />
              ))}
              <button
                onClick={clearAll}
                style={{ fontSize: 12, fontWeight: 600, color: "#7A7A85", background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", marginLeft: 4, textDecoration: "underline", textUnderlineOffset: 3 }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Grid */}
          {filtered.length > 0 ? (
            <motion.div layout className="influencer-grid">
              <AnimatePresence mode="popLayout">
                {filtered.map((inf, i) => (
                  <InfluencerCard key={inf.slug} inf={inf} i={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: "center", padding: "80px 24px" }}
            >
              <p style={{ fontWeight: 800, fontSize: 20, color: "#0A0A0A", letterSpacing: "-0.03em", marginBottom: 10 }}>
                No creators found
              </p>
              <p style={{ fontSize: 14, color: "#5F5F5F", marginBottom: 24 }}>
                Try a different genre, country, or search term.
              </p>
              <button
                onClick={clearAll}
                style={{ fontSize: 13, fontWeight: 600, color: "#0A0A0A", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3, fontFamily: "'Inter', sans-serif" }}
              >
                Clear filters
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="influencer-cta-section" style={{ padding: "0 24px 96px" }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="influencer-cta-box" style={{ background: "#EFEFEA", borderRadius: 24, padding: "56px 48px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A8A8A" }}>{cms.ctaEyebrow}</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(18px, 4vw, 48px)", letterSpacing: "-0.04em", color: "#0A0A0A", lineHeight: 1.1, maxWidth: "20ch" }}>
              {cms.ctaHeadline}
            </h2>
            <p style={{ fontSize: "clamp(14px, 2vw, 16px)", color: "#8A8A8A", maxWidth: "44ch", lineHeight: 1.7 }}>
              {cms.ctaSubtext}
            </p>
            <Link href="/creators">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FFFFFF", color: "#0A0A0A", fontWeight: 700, fontSize: 14, borderRadius: 100, padding: "12px 24px", cursor: "pointer" }}>
                {cms.ctaButton}
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
