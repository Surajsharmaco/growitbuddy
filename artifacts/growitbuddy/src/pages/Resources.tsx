import { useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, Download, ExternalLink, FileText, FileType, BookOpen, Video, Database,
  PenTool, Layout, Zap, GraduationCap, Sheet, Figma, Headphones, Link2, Lock,
} from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";
import { API_BASE, resolveMediaUrl } from "@/lib/api";
import { SOLID_LIGHT_BG, CardGrain } from "@/components/WashCard";
import { RESOURCES_DEFAULTS as DEFAULTS, type ResourcesData, type ResourceItem, type ResourceType } from "@/lib/resourcesDefaults";

const UNLOCK_KEY = "gb_resources_unlocked";

const SITE = "https://growitbuddy.com";

// ── Type → icon + label ──────────────────────────────────────────────────────
function typeIcon(t?: ResourceType) {
  const props = { size: 18, strokeWidth: 1.8 } as const;
  switch (t) {
    case "ebook":    return <BookOpen {...props} />;
    case "pdf":      return <FileText {...props} />;
    case "doc":      return <FileType {...props} />;
    case "drive":    return <Database {...props} />;
    case "notion":   return <PenTool {...props} />;
    case "video":    return <Video {...props} />;
    case "template": return <Layout {...props} />;
    case "toolkit":  return <Zap {...props} />;
    case "guide":    return <BookOpen {...props} />;
    case "course":   return <GraduationCap {...props} />;
    case "sheet":    return <Sheet {...props} />;
    case "figma":    return <Figma {...props} />;
    case "audio":    return <Headphones {...props} />;
    case "link":     return <Link2 {...props} />;
    default:         return <FileText {...props} />;
  }
}

function typeLabel(item: ResourceItem): string {
  if (item.fileFormat) return item.fileFormat;
  const map: Record<string, string> = {
    ebook: "eBook", pdf: "PDF", doc: "Document", drive: "Google Drive", notion: "Notion",
    video: "Video", template: "Template", toolkit: "Toolkit", guide: "Guide",
    course: "Course", sheet: "Spreadsheet", figma: "Figma", audio: "Audio", link: "Link",
  };
  return item.type ? (map[item.type] ?? "Resource") : "Resource";
}

function slugForItem(item: ResourceItem, i: number): string {
  if (item.slug) return item.slug;
  return (item.title || `resource-${i + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || `resource-${i + 1}`;
}

export default function Resources() {
  const cms = usePublicContent<ResourcesData>("resources", DEFAULTS);
  const items = cms.items || [];
  const faqs = cms.faqs || [];

  // Categories — explicit list wins; otherwise derive from item tags.
  const derivedTags = useMemo(() => Array.from(new Set(items.map((it) => it.tag).filter(Boolean))), [items]);
  const categories = useMemo(() => {
    const explicit = (cms.categories || []).filter(Boolean);
    return explicit.length > 0 ? explicit : derivedTags;
  }, [cms.categories, derivedTags]);

  const [activeTag, setActiveTag] = useState<string>("All");
  const filtered = activeTag === "All" ? items : items.filter((it) => it.tag === activeTag);
  const featured = items.filter((it) => it.isFeatured);

  // ── Email gate: gated resources require an email before access is granted.
  // Once a visitor submits their email, all gated resources unlock (persisted).
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try { return localStorage.getItem(UNLOCK_KEY) === "1"; } catch { return false; }
  });
  const [gateItem, setGateItem] = useState<ResourceItem | null>(null);
  const [gateUrl, setGateUrl] = useState<string | null>(null);
  const openGate = (item: ResourceItem, targetUrl?: string) => {
    setGateItem(item);
    setGateUrl(targetUrl ?? null);
  };
  const closeGate = () => { setGateItem(null); setGateUrl(null); };
  const handleUnlocked = (email: string) => {
    try {
      localStorage.setItem(UNLOCK_KEY, "1");
      localStorage.setItem("gb_resources_email", email);
    } catch { /* storage may be unavailable */ }
    const target = gateUrl ?? gateItem?.link ?? null;
    setUnlocked(true);
    closeGate();
    if (target) window.open(resolveMediaUrl(target), "_blank", "noopener,noreferrer");
  };

  // ── JSON-LD graph: CollectionPage + ItemList + FAQPage + BreadcrumbList ────
  // Each resource emits a DigitalDocument node so AI/answer engines have rich,
  // citable, per-item metadata — not just a flat list. Page-level AI fields
  // (aiSummary, primaryEntity, audience, mentions) feed CollectionPage `about`
  // / `mentions` / `audience` for entity-SEO and topical authority.
  const canonical = cms.canonicalUrl || `${SITE}/resources`;
  const schema = useMemo(() => {
    const mentions = (cms.relatedTopics || "")
      .split(",").map((s) => s.trim()).filter(Boolean)
      .map((name) => ({ "@type": "Thing", name }));

    const itemListElements = items.map((it, i) => {
      const slug = slugForItem(it, i);
      const node: Record<string, unknown> = {
        "@type": "ListItem",
        position: i + 1,
        url: `${canonical}#${slug}`,
        item: {
          "@type": "DigitalDocument",
          name: it.title,
          description: it.longDesc || it.aiSummary || it.desc,
          url: resolveMediaUrl(it.link || `${canonical}#${slug}`),
          inLanguage: cms.geoLanguage || "en",
          encodingFormat: typeLabel(it),
          datePublished: it.publishedDate || undefined,
          dateModified: it.updatedDate || it.publishedDate || undefined,
          author: { "@type": "Organization", name: it.author || "GrowitBuddy", url: SITE },
          publisher: { "@id": `${SITE}/#organization` },
          isAccessibleForFree: !it.isGated,
          keywords: it.keywords || undefined,
          about: it.aiSummary || undefined,
          image: it.coverImage || undefined,
          genre: it.tag || undefined,
        },
      };
      return node;
    });

    const collectionPage: Record<string, unknown> = {
      "@type": "CollectionPage",
      name: cms.seoTitle,
      description: cms.aiSummary || cms.seoDesc,
      url: canonical,
      inLanguage: cms.geoLanguage || "en",
      isPartOf: { "@id": `${SITE}/#website` },
      publisher: { "@id": `${SITE}/#organization` },
      audience: cms.audience ? { "@type": "Audience", audienceType: cms.audience } : undefined,
      about: cms.primaryEntity ? { "@type": "Thing", name: cms.primaryEntity } : undefined,
      mentions: mentions.length > 0 ? mentions : undefined,
      abstract: cms.aiSummary || undefined,
      keywords: cms.aiKeywords || undefined,
      spatialCoverage: cms.geoLocation ? { "@type": "Place", name: cms.geoLocation } : undefined,
      mainEntity: {
        "@type": "ItemList",
        name: "Free Resources",
        numberOfItems: items.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: itemListElements,
      },
    };

    const breadcrumb: Record<string, unknown> = {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Resources", item: canonical },
      ],
    };

    const nodes: Record<string, unknown>[] = [collectionPage, breadcrumb];

    if (faqs.length > 0) {
      nodes.push({
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      });
    }

    return nodes;
  }, [items, faqs, cms, canonical]);

  const factsList = (cms.factualClaims || "").split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif" }}>
      <SEOMeta
        title={cms.seoTitle}
        description={cms.seoDesc}
        canonical={canonical}
        ogImage={cms.ogImage || undefined}
        schema={schema}
      />

      {/* ── Hero ── */}
      <section style={{ paddingTop: "clamp(80px, 12vw, 140px)", paddingBottom: 56, paddingLeft: 24, paddingRight: 24, borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[1180px] mx-auto">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 18 }}>
            {cms.heroEyebrow}
          </p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ fontWeight: 800, fontSize: "clamp(34px, 7vw, 84px)", letterSpacing: "-0.04em", lineHeight: "1.05", color: "#0A0A0A", maxWidth: "18ch", marginBottom: 24 }}
          >
            {cms.heroHeadline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: "clamp(15px, 4.5vw, 19px)", color: "#5F5F5F", lineHeight: "1.7", maxWidth: "56ch" }}
          >
            {cms.heroSubtext}
          </motion.p>

          {cms.ctaLabel && cms.ctaUrl && (
            <a href={resolveMediaUrl(cms.ctaUrl)} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 28, padding: "13px 22px", borderRadius: 100, background: "#0A0A0A", color: "#F8F8F6", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              {cms.ctaLabel} <ArrowRight size={14} />
            </a>
          )}

          {/* ── Quick Answer / AI summary block — VISIBLE for users, also a
              canonical answer source for LLMs and AEO (People-Also-Ask). ── */}
          {(cms.aiSummary || factsList.length > 0) && (
            <div
              style={{
                marginTop: 40,
                padding: "20px 22px",
                borderRadius: 14,
                background: "#FFFFFF",
                border: "1px solid rgba(20,32,46,0.14)",
                boxShadow: "0 18px 44px -22px rgba(20,32,46,0.22), 0 4px 12px -6px rgba(20,32,46,0.08)",
                maxWidth: 720,
              }}
            >
              {cms.aiSummary && (
                <p style={{ fontSize: 14, color: "#0A0A0A", lineHeight: 1.65, margin: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#C2A878", marginRight: 10, verticalAlign: "middle" }}>Quick Answer</span>
                  {cms.aiSummary}
                </p>
              )}
              {factsList.length > 0 && (
                <ul style={{ margin: "14px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                  {factsList.map((f, i) => (
                    <li key={i} style={{ fontSize: 13, color: "#5F5F5F", paddingLeft: 16, position: "relative" }}>
                      <span style={{ position: "absolute", left: 0, top: 9, width: 6, height: 6, borderRadius: "50%", background: "#C2A878" }} />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Featured strip ── */}
      {featured.length > 0 && (
        <section style={{ background: "#FFFFFF", padding: "48px 24px 8px" }}>
          <div className="max-w-[1180px] mx-auto">
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#0A0A0A", margin: 0 }}>Featured</h2>
              <span style={{ fontSize: 11, color: "#7A7A85" }}>{featured.length} pick{featured.length === 1 ? "" : "s"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {featured.map((item, i) => (
                <FeaturedCard key={i} item={item} index={i} unlocked={unlocked} onLockedClick={openGate} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Category filter ── */}
      {categories.length > 0 && (
        <section style={{ background: "#FFFFFF", padding: "32px 24px 0" }}>
          <div className="max-w-[1180px] mx-auto" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["All", ...categories].map((tag) => {
              const active = tag === activeTag;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "8px 16px",
                    borderRadius: 100,
                    border: `1px solid ${active ? "#0A0A0A" : "#E5E5E0"}`,
                    background: active ? "#0A0A0A" : "transparent",
                    color: active ? "#F8F8F6" : "#0A0A0A",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    letterSpacing: "0.02em",
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Resources grid ── */}
      <section style={{ padding: "32px 24px 100px", background: "#FFFFFF" }}>
        <div className="max-w-[1180px] mx-auto">
          {filtered.length === 0 ? (
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#F8F8F6", borderRadius: 12, height: 280, border: "1px solid #E5E5E0",
              }}
            >
              <span style={{ fontSize: 14, color: "#7A7A85" }}>
                {items.length === 0 ? "Content coming soon" : "Nothing in this category yet."}
              </span>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
              {filtered.map((item, i) => {
                const slug = slugForItem(item, items.indexOf(item));
                return (
                  <motion.div
                    key={`${slug}-${i}`}
                    id={slug}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.45 }}
                  >
                    <ResourceCard item={item} index={i} unlocked={unlocked} onLockedClick={openGate} />
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ section (also emitted as FAQPage JSON-LD above) ── */}
      {faqs.length > 0 && (
        <section style={{ padding: "80px 24px 120px", background: "#F8F8F6", borderTop: "1px solid #E5E5E0" }}>
          <div className="max-w-[820px] mx-auto">
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 14 }}>FAQ</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(28px, 5vw, 48px)", letterSpacing: "-0.03em", lineHeight: 1.1, color: "#0A0A0A", marginBottom: 40 }}>
              Frequently asked questions.
            </h2>
            <div style={{ display: "grid", gap: 14 }}>
              {faqs.map((f, i) => (
                <details
                  key={i}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E5E5E0",
                    borderRadius: 14,
                    padding: "18px 22px",
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer", listStyle: "none",
                      fontSize: 15, fontWeight: 700, color: "#0A0A0A",
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
                    }}
                  >
                    {f.q}
                    <span style={{ fontSize: 18, color: "#C2A878" }}>+</span>
                  </summary>
                  <p style={{ marginTop: 12, fontSize: 14, color: "#5F5F5F", lineHeight: 1.7 }}>
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {gateItem && (
        <EmailGateModal item={gateItem} onClose={closeGate} onSuccess={handleUnlocked} />
      )}
    </div>
  );
}

// ── Email gate modal — captures an email before a gated resource is revealed ──
function EmailGateModal({ item, onClose, onSuccess }: { item: ResourceItem; onClose: () => void; onSuccess: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/forms/resource-unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, resourceTitle: item.title, resourceType: item.type }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Something went wrong. Please try again.");
      }
      onSuccess(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(10,10,10,0.55)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF", borderRadius: 18, padding: "30px 28px",
          width: "100%", maxWidth: 420, border: "1px solid rgba(20,32,46,0.14)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8A6A2E", background: "#FFF7E0", padding: "5px 12px", borderRadius: 100, marginBottom: 14 }}>
          <Lock size={12} /> Email required
        </div>
        <h3 style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em", color: "#0A0A0A", marginBottom: 8, lineHeight: 1.3 }}>
          Get instant access
        </h3>
        <p style={{ fontSize: 14, color: "#5F5F5F", lineHeight: 1.6, marginBottom: 18 }}>
          Enter your email to unlock <strong style={{ color: "#0A0A0A" }}>{item.title}</strong>. You will get instant access to this and all other gated resources.
        </p>
        <form onSubmit={submit}>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
            placeholder="you@email.com"
            autoFocus
            style={{
              width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10,
              border: `1.5px solid ${error ? "#D9534F" : "#E5E5E0"}`, fontSize: 14, outline: "none", marginBottom: error ? 8 : 14,
            }}
          />
          {error && (
            <p style={{ fontSize: 12.5, color: "#D9534F", marginBottom: 14 }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 100, border: "none",
              background: "#0A0A0A", color: "#F8F8F6", fontSize: 13, fontWeight: 700,
              cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1,
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading ? "Unlocking..." : "Unlock resource"} {!loading && <ArrowRight size={14} />}
          </button>
        </form>
        <p style={{ fontSize: 11, color: "#9A9AA5", textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
          We will email you occasional resources. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}

// ── CTA buttons row — used by both featured & standard cards. Buttons are
// real <a> elements (not nested inside a card-wrapping anchor) so secondary
// CTAs actually receive clicks. ─────────────────────────────────────────────
function CtaRow({ item, dark = false, unlocked, onLockedClick }: { item: ResourceItem; dark?: boolean; unlocked: boolean; onLockedClick: (item: ResourceItem, targetUrl?: string) => void }) {
  const primaryLabel = item.ctaLabel || (item.type === "drive" || item.type === "notion" || item.type === "link" ? "Open" : "Download");
  const PrimaryIcon = item.type === "drive" || item.type === "notion" || item.type === "link" ? ExternalLink : Download;
  const locked = !!item.isGated && !unlocked;
  const primaryStyle = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "10px 16px", borderRadius: 100,
    background: dark ? "#F8F8F6" : "#0A0A0A",
    color: dark ? "#0A0A0A" : "#F8F8F6",
    fontSize: 12, fontWeight: 700, letterSpacing: "0.01em",
    textDecoration: "none", whiteSpace: "nowrap", border: "none", cursor: "pointer",
  } as const;
  const secondaryStyle = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "10px 16px", borderRadius: 100,
    background: "transparent",
    color: dark ? "#F8F8F6" : "#0A0A0A",
    border: `1px solid ${dark ? "rgba(248,248,246,0.25)" : "#E5E5E0"}`,
    fontSize: 12, fontWeight: 700,
    textDecoration: "none", whiteSpace: "nowrap", cursor: "pointer",
  } as const;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
      {item.link && (
        locked ? (
          <button type="button" onClick={() => onLockedClick(item, item.link)} style={primaryStyle}>
            <Lock size={13} /> {primaryLabel}
          </button>
        ) : (
          <a href={resolveMediaUrl(item.link)} target="_blank" rel="noopener noreferrer" style={primaryStyle}>
            <PrimaryIcon size={13} /> {primaryLabel}
          </a>
        )
      )}
      {item.secondaryCtaUrl && (
        locked ? (
          <button type="button" onClick={() => onLockedClick(item, item.secondaryCtaUrl)} style={secondaryStyle}>
            <Lock size={13} /> {item.secondaryCtaLabel || "Preview"}
          </button>
        ) : (
          <a href={resolveMediaUrl(item.secondaryCtaUrl)} target="_blank" rel="noopener noreferrer" style={secondaryStyle}>
            {item.secondaryCtaLabel || "Preview"} <ArrowRight size={13} />
          </a>
        )
      )}
    </div>
  );
}

function BadgePill({ text, accent }: { text: string; accent?: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
      padding: "4px 10px", borderRadius: 100,
      background: accent ? "#C2A878" : "#FFF7E0",
      color: accent ? "#0A0A0A" : "#8A6A2E",
      whiteSpace: "nowrap",
    }}>
      {text}
    </span>
  );
}

// ── Featured card ──────────────────────────────────────────────────────────
function FeaturedCard({ item, index, unlocked, onLockedClick }: { item: ResourceItem; index: number; unlocked: boolean; onLockedClick: (item: ResourceItem, targetUrl?: string) => void }) {
  return (
    <div
      style={{
        position: "relative",
        background: SOLID_LIGHT_BG,
        color: "#0F1822",
        borderRadius: 18,
        padding: "26px 26px 22px",
        border: `1px solid rgba(20,32,46,0.14)`,
        boxShadow: "0 18px 44px -22px rgba(20,32,46,0.22), 0 4px 12px -6px rgba(20,32,46,0.08)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        isolation: "isolate",
        transition: "transform 0.22s, box-shadow 0.22s",
      }}
      className="hover:-translate-y-1"
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 26px 60px -24px rgba(20,32,46,0.28), 0 10px 24px -10px rgba(20,32,46,0.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 18px 44px -22px rgba(20,32,46,0.22), 0 4px 12px -6px rgba(20,32,46,0.08)"; }}
    >
      <CardGrain />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 8 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase",
          padding: "5px 12px", borderRadius: 100,
          background: "rgba(255,255,255,0.7)",
          border: `1px solid rgba(20,32,46,0.10)`,
          color: "#0F1822",
        }}>
          {typeIcon(item.type)} {item.tag}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {item.badgeText && <BadgePill text={item.badgeText} />}
          {item.isGated && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "#5A6675" }}>
              <Lock size={11} /> Email
            </span>
          )}
        </div>
      </div>
      <h3 style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em", lineHeight: 1.18, marginBottom: 10 }}>
        {item.title}
      </h3>
      <p style={{ fontSize: 14, lineHeight: 1.65, flex: 1, color: "#374151" }}>
        {item.desc}
      </p>
      <div style={{ marginTop: 18, fontSize: 12, color: "#5A6675" }}>
        {typeLabel(item)}{item.fileSize ? ` · ${item.fileSize}` : ""}
      </div>
      <CtaRow item={item} unlocked={unlocked} onLockedClick={onLockedClick} />
    </div>
  );
}

// ── Standard resource card ──────────────────────────────────────────────────
function ResourceCard({ item, index, unlocked, onLockedClick }: { item: ResourceItem; index: number; unlocked: boolean; onLockedClick: (item: ResourceItem, targetUrl?: string) => void }) {
  return (
    <div
      style={{
        position: "relative",
        background: SOLID_LIGHT_BG,
        border: `1px solid rgba(20,32,46,0.14)`,
        borderRadius: 18,
        boxShadow: "0 18px 44px -22px rgba(20,32,46,0.22), 0 4px 12px -6px rgba(20,32,46,0.08)",
        padding: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        isolation: "isolate",
        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
      }}
      className="hover:-translate-y-1"
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 26px 60px -24px rgba(20,32,46,0.28), 0 10px 24px -10px rgba(20,32,46,0.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 18px 44px -22px rgba(20,32,46,0.22), 0 4px 12px -6px rgba(20,32,46,0.08)"; }}
    >
      <CardGrain />
      {item.badgeText && (
        <div style={{ position: "absolute", top: 14, right: 14, zIndex: 2 }}>
          <BadgePill text={item.badgeText} />
        </div>
      )}
      {item.coverImage ? (
        <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", background: "#EFEFEA" }}>
          <img src={item.coverImage} alt={item.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : (
        <div style={{ width: "100%", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "rgba(15,24,34,0.5)", borderBottom: "1px solid rgba(15,24,34,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {typeIcon(item.type)}
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>{typeLabel(item)}</span>
          </div>
        </div>
      )}

      <div style={{ padding: "20px 22px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
            padding: "4px 10px", borderRadius: 100, background: "#FFFFFF", border: "1px solid #E5E5E0", color: "#0A0A0A",
          }}>
            {item.tag}
          </span>
          {item.isGated && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "#7A7A85" }}>
              <Lock size={10} /> Email required
            </span>
          )}
        </div>
        <h3 style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.025em", color: "#0F1822", marginBottom: 8, lineHeight: 1.3 }}>
          {item.title}
        </h3>
        <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.65, flex: 1, marginBottom: 4 }}>
          {item.desc}
        </p>
        <div style={{ paddingTop: 14, marginTop: 8, borderTop: "1px solid #E5E5E0", fontSize: 12, color: "#7A7A85" }}>
          {typeLabel(item)}{item.fileSize ? ` · ${item.fileSize}` : ""}
        </div>
        <CtaRow item={item} unlocked={unlocked} onLockedClick={onLockedClick} />
      </div>
    </div>
  );
}
