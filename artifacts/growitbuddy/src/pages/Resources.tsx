import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, Download, ExternalLink, FileText, BookOpen, Video, Database,
  PenTool, Layout, Zap, GraduationCap, Sheet, Figma, Headphones, Link2, Lock,
} from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";
import { RESOURCES_DEFAULTS as DEFAULTS, type ResourcesData, type ResourceItem, type ResourceType } from "@/lib/resourcesDefaults";

const SITE = "https://growitbuddy.com";

// ── Type → icon + label ──────────────────────────────────────────────────────
function typeIcon(t?: ResourceType) {
  const props = { size: 18, strokeWidth: 1.8 } as const;
  switch (t) {
    case "ebook":    return <BookOpen {...props} />;
    case "pdf":      return <FileText {...props} />;
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
    ebook: "eBook", pdf: "PDF", drive: "Google Drive", notion: "Notion",
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
          url: it.link || `${canonical}#${slug}`,
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
            <a href={cms.ctaUrl} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 28, padding: "13px 22px", borderRadius: 100, background: "#0A0A0A", color: "#F8F8F6", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
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
                border: "1px solid #E5E5E0",
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
                <FeaturedCard key={i} item={item} index={i} />
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
                    <ResourceCard item={item} />
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
    </div>
  );
}

// ── Featured card — emphasised look for `isFeatured: true` items ────────────
function FeaturedCard({ item, index }: { item: ResourceItem; index: number }) {
  const content = (
    <div
      style={{
        position: "relative",
        background: index === 0 ? "#0A0A0A" : "#F8F8F6",
        color: index === 0 ? "#F8F8F6" : "#0A0A0A",
        borderRadius: 18,
        padding: "26px 26px 22px",
        border: index === 0 ? "1px solid #1F1F1F" : "1.5px solid #E5E5E0",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "transform 0.22s, box-shadow 0.22s",
      }}
      className={item.link ? "hover:-translate-y-1 hover:shadow-lg" : ""}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase",
          padding: "5px 12px", borderRadius: 100,
          background: index === 0 ? "rgba(194,168,120,0.18)" : "#EFEFEA",
          color: index === 0 ? "#C2A878" : "#0A0A0A",
        }}>
          {typeIcon(item.type)} {item.tag}
        </span>
        {item.isGated && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: index === 0 ? "rgba(248,248,246,0.55)" : "#7A7A85" }}>
            <Lock size={11} /> Email
          </span>
        )}
      </div>
      <h3 style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em", lineHeight: 1.18, marginBottom: 10 }}>
        {item.title}
      </h3>
      <p style={{ fontSize: 14, lineHeight: 1.65, flex: 1, color: index === 0 ? "rgba(248,248,246,0.7)" : "#5F5F5F" }}>
        {item.desc}
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22, fontSize: 12, color: index === 0 ? "rgba(248,248,246,0.55)" : "#7A7A85" }}>
        <span>{typeLabel(item)}{item.fileSize ? ` · ${item.fileSize}` : ""}</span>
        {item.link && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, color: index === 0 ? "#F8F8F6" : "#0A0A0A" }}>
            {item.ctaLabel || "Download"} <ArrowRight size={13} />
          </span>
        )}
      </div>
    </div>
  );
  return item.link ? (
    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", height: "100%" }}>{content}</a>
  ) : content;
}

// ── Standard resource card ──────────────────────────────────────────────────
function ResourceCard({ item }: { item: ResourceItem }) {
  const isExternal = !!item.link;
  const content = (
    <div
      style={{
        background: "#F8F8F6",
        border: "1.5px solid #E5E5E0",
        borderRadius: 18,
        padding: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        cursor: isExternal ? "pointer" : "default",
        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
      }}
      className={isExternal ? "hover:-translate-y-1 hover:shadow-md hover:border-[#C2A878]" : ""}
    >
      {item.coverImage ? (
        <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", background: "#EFEFEA" }}>
          <img src={item.coverImage} alt={item.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : (
        <div style={{ width: "100%", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #EFEFEA 0%, #F8F8F6 100%)", color: "#C2A878", borderBottom: "1px solid #E5E5E0" }}>
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
        <h3 style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.025em", color: "#0A0A0A", marginBottom: 8, lineHeight: 1.3 }}>
          {item.title}
        </h3>
        <p style={{ fontSize: 14, color: "#5F5F5F", lineHeight: 1.65, flex: 1, marginBottom: 16 }}>
          {item.desc}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid #E5E5E0", fontSize: 12, color: "#7A7A85" }}>
          <span>{typeLabel(item)}{item.fileSize ? ` · ${item.fileSize}` : ""}</span>
          {isExternal && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, color: "#0A0A0A" }}>
              {item.ctaLabel || (item.type === "drive" || item.type === "notion" || item.type === "link" ? "Open" : "Download")}
              {item.type === "drive" || item.type === "notion" || item.type === "link" ? <ExternalLink size={12} /> : <Download size={12} />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
  return isExternal ? (
    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", height: "100%" }}>{content}</a>
  ) : content;
}
