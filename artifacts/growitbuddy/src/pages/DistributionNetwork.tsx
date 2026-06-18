import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Search, X, SlidersHorizontal, ChevronDown, Check, Globe, Zap } from "lucide-react";
import { DISTRIBUTION_NICHES, DISTRIBUTION_COUNTRIES, type DistributionPage } from "@/data/distributionPages";
import SEOMeta from "@/components/SEOMeta";
import { useState, useMemo, useRef, useEffect } from "react";
import { usePublicContent } from "@/hooks/usePublicContent";
import { resolveMediaUrl } from "@/lib/api";

import { DISTRIBUTION_NETWORK_DEFAULTS as DN_DEFAULTS, type DistributionNetworkData, type DistNetAdvItem as AdvItem, type DistNetStep as DistStep } from "@/lib/distributionNetworkDefaults";

/* ── Card ────────────────────────────────────────────────── */
function PageCard({ page }: { page: DistributionPage }) {
  const [imgError, setImgError] = useState(false);
  const instagramUrl = page.instagramUrl?.trim();
  return (
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(11,11,11,0.05)",
          border: "1px solid #E5E5E0",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          cursor: instagramUrl ? "pointer" : "default",
        }}
        onClick={() => {
          if (!instagramUrl) return;
          const href = /^https?:\/\//i.test(instagramUrl) ? instagramUrl : `https://${instagramUrl}`;
          window.open(href, "_blank", "noopener,noreferrer");
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1.018)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 48px rgba(11,11,11,0.10)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(11,11,11,0.05)";
        }}
      >
        {/* Image band */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", overflow: "hidden", background: page.accentColor, flexShrink: 0 }}>
          {!imgError ? (
            <img
              src={resolveMediaUrl(page.photo)}
              alt={page.name}
              onError={() => setImgError(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A0A0A", fontWeight: 800, fontSize: 40, letterSpacing: "-0.02em" }}>
              {page.initials}
            </div>
          )}

          {/* Niche badge */}
          <div className="dn-badge dn-badge-niche" style={{ position: "absolute", top: 14, left: 14, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1E293B", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", borderRadius: 100, padding: "4px 12px", border: "1px solid rgba(255,255,255,0.6)", maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {page.niche}
          </div>

          {/* High engagement badge */}
          {page.highEngagement && (
            <div className="dn-badge dn-badge-hot" style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#0A0A0A", background: "#F8F8F6", borderRadius: 100, padding: "4px 10px" }}>
              <Zap style={{ width: 9, height: 9, fill: "#EFEFEA" }} />
              <span className="dn-hot-text">High Engagement</span>
            </div>
          )}

          {/* Followers - bottom left (highlighted pill). Hidden when no count is
              set so we never render an orphan "Followers" label with no number. */}
          {page.followers?.trim() && (
            <div className="dn-stat-followers" style={{ position: "absolute", bottom: 14, left: 14, display: "inline-flex", alignItems: "baseline", gap: 6, background: "#FFFFFF", borderRadius: 100, padding: "7px 14px", border: "1px solid rgba(11,11,11,0.06)", boxShadow: "0 6px 18px rgba(11,11,11,0.22)" }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#0A0A0A", letterSpacing: "-0.03em", lineHeight: 1 }}>{page.followers}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#7A7A85", letterSpacing: "0.08em", textTransform: "uppercase" }}>Followers</span>
            </div>
          )}

          {/* Country - bottom right (pill) */}
          <div className="dn-stat-country" style={{ position: "absolute", bottom: 14, right: 14, maxWidth: "45%", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", borderRadius: 100, padding: "5px 12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#1E293B", letterSpacing: "0.04em" }}>{page.country}</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 20px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 16, color: "#0A0A0A", letterSpacing: "-0.03em", lineHeight: 1.2 }}>{page.name}</p>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#7A7A85", marginTop: 3 }}>{page.handle}</p>
          </div>
          {/* Only show the "View Page" CTA when there is an actual profile link to
              open — otherwise it is a dead button that does nothing on click. */}
          {instagramUrl && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#0A0A0A", whiteSpace: "nowrap", flexShrink: 0 }}>
              View Page <ArrowRight style={{ width: 12, height: 12 }} />
            </div>
          )}
        </div>
      </div>
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
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 16px",
          background: open ? "#FFFFFF" : "#FFFFFF",
          border: `1.5px solid ${open ? "rgba(30,41,59,0.4)" : "#E5E5E0"}`,
          borderRadius: open ? "12px 12px 0 0" : 12,
          borderBottom: open ? "1.5px solid rgba(10,10,10,0.07)" : undefined,
          cursor: "pointer",
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          fontWeight: selected.length > 0 ? 600 : 400,
          color: "#0A0A0A",
          minWidth: 200,
          transition: "background 0.15s, color 0.15s, border-color 0.15s",
        }}
      >
        <span style={{ color: open ? "#5F5F5F" : "#8A8A8A", flexShrink: 0, display: "flex" }}>{icon}</span>
        <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
        <ChevronDown style={{ width: 14, height: 14, flexShrink: 0, color: open ? "#8A8A8A" : "#8A8A8A", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
              background: "#FFFFFF",
              borderRadius: "0 0 12px 12px",
              border: "1.5px solid rgba(30,41,59,0.35)", borderTop: "none",
              maxHeight: 260, overflowY: "auto",
            }}
          >
            {selected.length > 0 && (
              <button
                onClick={() => onChange([])}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "11px 16px", background: "none", border: "none", borderBottom: "1px solid rgba(10,10,10,0.06)", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: "#8A8A8A", textAlign: "left" }}
              >
                <X style={{ width: 12, height: 12 }} />
                Clear all
              </button>
            )}
            {options.map((opt) => {
              const checked = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => toggle(opt)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "13px 16px",
                    background: checked ? "rgba(10,10,10,0.03)" : "none",
                    border: "none", borderBottom: "1px solid rgba(10,10,10,0.03)",
                    cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: 14,
                    fontWeight: checked ? 600 : 400,
                    color: "#0A0A0A",
                    textAlign: "left", transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLButtonElement).style.background = "rgba(10,10,10,0.03)"; }}
                  onMouseLeave={(e) => { if (!checked) (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${checked ? "var(--gb-accent)" : "#CBD0DA"}`, background: checked ? "var(--gb-accent)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease" }}>
                    {checked && <Check style={{ width: 11, height: 11, color: "#F8F8F6", strokeWidth: 3 }} />}
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

function ActiveTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100, background: "#FFFFFF", border: "1px solid #E5E5E0", color: "#0A0A0A", fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: "pointer", letterSpacing: "-0.01em" }}
    >
      {label}
      <X style={{ width: 11, height: 11, opacity: 0.5 }} />
    </button>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function DistributionNetwork() {
  const cms = usePublicContent<DistributionNetworkData>("distribution-network", DN_DEFAULTS);
  const distPagesDb = usePublicContent<{ items?: DistributionPage[] }>("distribution-pages", { items: [] });
  // The admin-managed list is the ONLY source of truth. Never fall back to the
  // hardcoded demo pages: doing so resurrected deleted pages on every refresh
  // and cold start, because the bootstrap/API fetch can be empty, slow, or
  // asleep (Render free-tier / Neon SSR timeout). When there is no live data we
  // render an honest empty state, not stale demo data.
  const distributionPages = Array.isArray(distPagesDb.items) ? distPagesDb.items : [];

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let list = distributionPages.filter((p) => !p.trashed && p.profileEnabled !== false);
    if (selectedGenres.length > 0) list = list.filter((p) => selectedGenres.includes(p.niche));
    if (selectedCountries.length > 0) list = list.filter((p) => selectedCountries.includes(p.country));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q) || p.niche.toLowerCase().includes(q));
    }
    return list;
  }, [distributionPages, selectedGenres, selectedCountries, searchQuery]);

  const hasActiveFilters = selectedGenres.length > 0 || selectedCountries.length > 0;
  function clearAll() { setSelectedGenres([]); setSelectedCountries([]); setSearchQuery(""); }

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .dist-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .dist-filter-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .filter-dropdown-wrap { flex-shrink: 0; }
        .dist-search-wrap { position: relative; flex: 1; min-width: 180px; }
        .dist-search-input {
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
        .dist-search-input:focus { border-color: var(--gb-accent); }
        .dist-search-input::placeholder { color: #8A8A8A; }
        .dist-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #8A8A8A; pointer-events: none; }
        .dist-search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #8A8A8A; display: flex; align-items: center; background: none; border: none; padding: 0; }
        .dist-search-clear:hover { color: var(--gb-accent); }
        .dist-step-num { width: 36px; height: 36px; border-radius: 50%; background: rgba(30,41,59,0.12); border: 1px solid rgba(30,41,59,0.35); color: var(--gb-accent); font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dist-advantage-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }
        .dist-steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
        }
        .dist-cta-box {
          background: #EFEFEA;
          border: 1px solid rgba(30,41,59,0.18);
          border-radius: 24px;
          padding: 56px 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 20px;
        }
        .dist-wyg-section { padding: 80px 24px; border-top: 1px solid #E5E5E0; }
        .dist-hiw-section { padding: 80px 24px; background: #EFEFEA; border-top: 1px solid #E5E5E0; }
        @media (max-width: 1024px) {
          .dist-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .dist-steps-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; }
        }
        @media (max-width: 700px) {
          .filter-dropdown-wrap { flex: 1 1 calc(50% - 5px); min-width: 0; }
          .filter-dropdown-wrap button { min-width: 0 !important; width: 100%; box-sizing: border-box; }
          .dist-search-wrap { flex: 1 1 100%; min-width: 0; }
          .dist-filter-count { display: none; }
          .dist-advantage-grid { grid-template-columns: 1fr; gap: 40px; }
          .dist-cta-box { padding: 44px 28px; border-radius: 20px; }
          .dist-wyg-section { padding: 60px 20px; }
          .dist-hiw-section { padding: 60px 20px; }
        }
        @media (max-width: 480px) {
          .dist-grid { grid-template-columns: 1fr; gap: 14px; }
          .filter-dropdown-wrap { flex: 1 1 100%; }
          .dist-steps-grid { grid-template-columns: 1fr; gap: 28px; }
          .dist-cta-box { padding: 36px 20px; }
        }
        /* Mobile: prevent overlay badge collision on the image */
        @media (max-width: 560px) {
          .dn-badge { font-size: 9px !important; padding: 3px 9px !important; letter-spacing: 0.1em !important; }
          .dn-badge-niche { top: 10px !important; left: 10px !important; max-width: 50% !important; }
          .dn-badge-hot { top: 10px !important; right: 10px !important; gap: 3px !important; padding: 3px 7px !important; }
          .dn-hot-text { display: none; }
          .dn-stat-followers { bottom: 10px !important; left: 12px !important; padding: 5px 11px !important; }
          .dn-stat-followers > span:first-child { font-size: 15px !important; }
          .dn-stat-followers > span:last-child { font-size: 9px !important; }
          .dn-stat-country { bottom: 10px !important; right: 12px !important; max-width: 40% !important; }
          .dn-stat-country > span { font-size: 10px !important; }
        }
      `}</style>

      <SEOMeta
        title="Content Distribution Network | Meme & Theme Page Distribution | GrowitBuddy"
        description="Access GrowitBuddy's curated distribution network of high-reach meme and theme pages with millions of followers. Distribute content at scale, reach your audience faster, and track real results."
      />

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 72, paddingLeft: 24, paddingRight: 24, borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 16 }}>{cms.heroEyebrow}</p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ fontWeight: 800, fontSize: "clamp(28px, 7vw, 80px)", letterSpacing: "-0.04em", lineHeight: "1.08", color: "#0A0A0A", maxWidth: "18ch", marginBottom: 20 }}
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
            <Link href="/contact">
              <span className="gb-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {cms.heroCTA}
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Filter + Grid */}
      <section style={{ padding: "56px 24px" }}>
        <div className="max-w-[1100px] mx-auto">

          {/* Filter row */}
          <div className="dist-filter-row" style={{ marginBottom: 20 }}>
            <div className="filter-dropdown-wrap">
              <FilterDropdown
                icon={<SlidersHorizontal style={{ width: 15, height: 15 }} />}
                placeholder="Select Genre"
                selected={selectedGenres}
                options={[...DISTRIBUTION_NICHES]}
                onChange={setSelectedGenres}
              />
            </div>
            <div className="filter-dropdown-wrap">
              <FilterDropdown
                icon={<Globe style={{ width: 15, height: 15 }} />}
                placeholder="Select Country"
                selected={selectedCountries}
                options={[...DISTRIBUTION_COUNTRIES]}
                onChange={setSelectedCountries}
              />
            </div>
            <div className="dist-search-wrap">
              <Search className="dist-search-icon" style={{ width: 15, height: 15 }} />
              <input
                className="dist-search-input"
                type="text"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="dist-search-clear" onClick={() => setSearchQuery("")}>
                  <X style={{ width: 13, height: 13 }} />
                </button>
              )}
            </div>
            <span className="dist-filter-count" style={{ fontSize: 13, fontWeight: 500, color: "#7A7A85", marginLeft: "auto", whiteSpace: "nowrap", flexShrink: 0 }}>
              {filtered.length} page{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Active tags */}
          {hasActiveFilters && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28, alignItems: "center" }}>
              {selectedGenres.map((g) => <ActiveTag key={g} label={g} onRemove={() => setSelectedGenres(selectedGenres.filter((x) => x !== g))} />)}
              {selectedCountries.map((c) => <ActiveTag key={c} label={c} onRemove={() => setSelectedCountries(selectedCountries.filter((x) => x !== c))} />)}
              <button onClick={clearAll} style={{ fontSize: 12, fontWeight: 600, color: "#7A7A85", background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", marginLeft: 4, textDecoration: "underline", textUnderlineOffset: 3 }}>
                Clear all
              </button>
            </div>
          )}

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="dist-grid">
              {filtered.map((page, i) => <PageCard key={page.slug || page.handle || page.name || i} page={page} />)}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", padding: "80px 24px" }}>
              <p style={{ fontWeight: 800, fontSize: 20, color: "#0A0A0A", letterSpacing: "-0.03em", marginBottom: 10 }}>No pages found</p>
              <p style={{ fontSize: 14, color: "#7A7A85", marginBottom: 24 }}>Try a different genre, country, or search term.</p>
              <button onClick={clearAll} style={{ fontSize: 13, fontWeight: 600, color: "#0A0A0A", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3, fontFamily: "'Inter', sans-serif" }}>
                Clear filters
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* What You Get */}
      <section className="dist-wyg-section">
        <div className="max-w-[1100px] mx-auto dist-advantage-grid">
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 14 }}>{cms.advantageLabel}</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 4vw, 52px)", letterSpacing: "-0.04em", color: "#0A0A0A", lineHeight: 1.08, marginBottom: 20 }}>
              {cms.advantageHeadline}
            </h2>
            <p style={{ fontSize: 16, color: "#5F5F5F", lineHeight: 1.75, maxWidth: "40ch" }}>
              {cms.advantageSubtext}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {(cms.advantageItems || []).map(({ label, desc }) => (
              <div key={label} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gb-accent)", marginTop: 8, flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: "#0A0A0A", marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 14, color: "#5F5F5F", lineHeight: 1.65 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="dist-hiw-section">
        <div className="max-w-[1100px] mx-auto">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 14 }}>{cms.hiwLabel}</p>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 4vw, 52px)", letterSpacing: "-0.04em", color: "#0A0A0A", lineHeight: 1.08, marginBottom: 56 }}>
            {cms.hiwHeadline}
          </h2>
          <div className="dist-steps-grid">
            {(cms.hiwSteps || []).map(({ num, title, desc }) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: parseInt(num) * 0.08 }}
              >
                <div className="dist-step-num" style={{ marginBottom: 16 }}>{num}</div>
                <p style={{ fontWeight: 700, fontSize: 16, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.02em" }}>{title}</p>
                <p style={{ fontSize: 14, color: "#5F5F5F", lineHeight: 1.65 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "0 24px 96px" }}>
        <div className="max-w-[1100px] mx-auto" style={{ paddingTop: 64 }}>
          <div className="dist-cta-box">
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A8A8A" }}>{cms.ctaLabel}</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(18px, 4vw, 48px)", letterSpacing: "-0.04em", color: "#0A0A0A", lineHeight: 1.1, maxWidth: "22ch" }}>
              {cms.ctaHeadline}
            </h2>
            <p style={{ fontSize: "clamp(14px, 2vw, 16px)", color: "#5F5F5F", maxWidth: "44ch", lineHeight: 1.7 }}>
              {cms.ctaSubtext}
            </p>
            <Link href="/contact">
              <span className="gb-btn">
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
