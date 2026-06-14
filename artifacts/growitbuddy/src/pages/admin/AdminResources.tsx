// Admin: Resources — rich CMS for the public Resources page.
// Supports unlimited resources of any type (eBook, PDF, Drive link, Notion,
// video, template, toolkit, etc.) plus full page-level SEO + GEO/AEO/AIO
// signals that get baked into the page's JSON-LD CollectionPage + ItemList
// + FAQPage graph automatically (see Resources.tsx).

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar, Field } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Copy as CopyIcon, ChevronRight,
  Star, Eye, EyeOff, Sparkles, FileText, FileType, BookOpen, Video, Database,
  PenTool, Layout, Zap, GraduationCap, Sheet, Figma, Headphones, Link2,
} from "lucide-react";
import {
  RESOURCES_DEFAULTS as DEFAULTS, type ResourcesData, type ResourceItem,
  type ResourceType, type ResourceFAQ,
} from "@/lib/resourcesDefaults";

const TYPE_OPTIONS: { value: ResourceType; label: string; icon: ReactNode }[] = [
  { value: "ebook",    label: "eBook",          icon: <BookOpen size={13} /> },
  { value: "pdf",      label: "PDF",            icon: <FileText size={13} /> },
  { value: "doc",      label: "Document",       icon: <FileType size={13} /> },
  { value: "drive",    label: "Google Drive",   icon: <Database size={13} /> },
  { value: "notion",   label: "Notion",         icon: <PenTool size={13} /> },
  { value: "video",    label: "Video",          icon: <Video size={13} /> },
  { value: "template", label: "Template",       icon: <Layout size={13} /> },
  { value: "toolkit",  label: "Toolkit",        icon: <Zap size={13} /> },
  { value: "guide",    label: "Guide",          icon: <BookOpen size={13} /> },
  { value: "course",   label: "Course",         icon: <GraduationCap size={13} /> },
  { value: "sheet",    label: "Spreadsheet",    icon: <Sheet size={13} /> },
  { value: "figma",    label: "Figma File",     icon: <Figma size={13} /> },
  { value: "audio",    label: "Audio",          icon: <Headphones size={13} /> },
  { value: "link",     label: "External Link",  icon: <Link2 size={13} /> },
];

export default function AdminResources() {
  const { getContent, saveContent } = useAdmin();
  const [data, setData] = useState<ResourcesData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    getContent("resources").then((d) => {
      if (d) {
        // Merge stored data over defaults so older rows without new fields
        // still load without losing data; arrays must be replaced, not merged.
        const stored = d as Partial<ResourcesData>;
        setData({
          ...DEFAULTS,
          ...stored,
          items: Array.isArray(stored.items) ? stored.items : DEFAULTS.items,
          categories: Array.isArray(stored.categories) ? stored.categories : DEFAULTS.categories,
          faqs: Array.isArray(stored.faqs) ? stored.faqs : DEFAULTS.faqs,
        });
      }
    });
  }, [getContent]);

  function set<K extends keyof ResourcesData>(key: K, val: ResourcesData[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  // ── Items helpers ──────────────────────────────────────────────────────────
  function setItem(i: number, patch: Partial<ResourceItem>) {
    setSaved(false);
    const next = [...data.items];
    next[i] = { ...next[i], ...patch };
    set("items", next);
  }
  function addItem() {
    setSaved(false);
    const next = [...data.items, {
      title: "New Resource",
      desc: "Short description shown on the card.",
      tag: "Template",
      link: "",
      type: "pdf" as ResourceType,
      ctaLabel: "Download",
    }];
    set("items", next);
    setExpanded((s) => new Set(s).add(next.length - 1));
  }
  function removeItem(i: number) {
    if (!confirm(`Delete "${data.items[i]?.title || "this resource"}"?`)) return;
    setSaved(false);
    set("items", data.items.filter((_, idx) => idx !== i));
  }
  function duplicateItem(i: number) {
    setSaved(false);
    const copy = { ...data.items[i], title: `${data.items[i].title} (Copy)`, slug: undefined, isFeatured: false };
    const next = [...data.items.slice(0, i + 1), copy, ...data.items.slice(i + 1)];
    set("items", next);
  }
  function moveItem(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= data.items.length) return;
    setSaved(false);
    const next = [...data.items];
    [next[i], next[j]] = [next[j], next[i]];
    set("items", next);
  }
  function toggleExpand(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  // ── FAQ helpers ────────────────────────────────────────────────────────────
  const faqs = data.faqs || [];
  function setFaq(i: number, patch: Partial<ResourceFAQ>) {
    setSaved(false);
    const next = [...faqs];
    next[i] = { ...next[i], ...patch };
    set("faqs", next);
  }
  function addFaq() { setSaved(false); set("faqs", [...faqs, { q: "New question?", a: "Answer that resolves the visitor's concern in 1-2 sentences." }]); }
  function removeFaq(i: number) { setSaved(false); set("faqs", faqs.filter((_, idx) => idx !== i)); }

  // ── Categories helper (free-text comma list) ───────────────────────────────
  const categoriesText = (data.categories || []).join(", ");

  // ── Derived stats for sidebar/header ───────────────────────────────────────
  const stats = useMemo(() => ({
    total: data.items.length,
    featured: data.items.filter((i) => i.isFeatured).length,
    gated: data.items.filter((i) => i.isGated).length,
    types: new Set(data.items.map((i) => i.type || "—")).size,
  }), [data.items]);

  async function handleSave() {
    setSaving(true);
    await saveContent("resources", data as unknown as Record<string, unknown>);
    setSaving(false);
    setSaved(true);
  }

  return (
    <div>
      <PageHeader
        title="Resources Page"
        description="Add unlimited resources of any format — Drive links, Notion templates, eBooks, PDFs, videos. Each resource has its own SEO. Page-level AI / GEO / AEO signals are baked into structured data automatically."
      />

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Stat label="Total resources" value={stats.total} />
        <Stat label="Featured" value={stats.featured} />
        <Stat label="Gated" value={stats.gated} />
        <Stat label="Formats" value={stats.types} />
      </div>

      {/* ── Hero ── */}
      <Card>
        <SectionTitle>Hero</SectionTitle>
        <Input label="Eyebrow Label" value={data.heroEyebrow} onChange={(e) => set("heroEyebrow", e.target.value)} />
        <Input label="Headline" value={data.heroHeadline} onChange={(e) => set("heroHeadline", e.target.value)} />
        <Textarea label="Subtext" value={data.heroSubtext} onChange={(e) => set("heroSubtext", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Hero CTA Label (optional)" value={data.ctaLabel ?? ""} onChange={(e) => set("ctaLabel", e.target.value)} placeholder="e.g. Book a Strategy Call" />
          <Input label="Hero CTA URL (optional)" value={data.ctaUrl ?? ""} onChange={(e) => set("ctaUrl", e.target.value)} placeholder="https://..." />
        </div>
      </Card>

      {/* ── Categories ── */}
      <Card>
        <SectionTitle>Categories</SectionTitle>
        <Field
          label="Filter chips (comma separated — order matters)"
          hint="Leave blank to auto-build from the unique tags on your resources. Use this to enforce a custom order or hide niche tags."
        >
          <input
            type="text"
            value={categoriesText}
            onChange={(e) => set("categories", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            className="w-full px-3 py-2 rounded-lg border text-[13px] bg-white"
            style={{ borderColor: "#E5E5E0" }}
            placeholder="e.g. Template, Playbook, Checklist, Toolkit"
          />
        </Field>
      </Card>

      {/* ── Resources ── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Resources ({data.items.length})</SectionTitle>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
            style={{ background: "#0A0A0A", color: "#F8F8F6" }}
          >
            <Plus size={13} /> Add resource
          </button>
        </div>

        {data.items.length === 0 && (
          <p className="text-[13px] text-[#0B0B0B]/40 italic">No resources yet. Add your first one above.</p>
        )}

        <div className="space-y-2">
          {data.items.map((item, i) => {
            const isExpanded = expanded.has(i);
            const typeMeta = TYPE_OPTIONS.find((t) => t.value === item.type);
            return (
              <div
                key={i}
                className="border rounded-xl bg-white"
                style={{ borderColor: item.isFeatured ? "#C2A878" : "#E5E5E0" }}
              >
                {/* Row header — always visible */}
                <div className="flex items-center gap-2 p-3">
                  <button
                    type="button"
                    onClick={() => toggleExpand(i)}
                    className="p-1 rounded hover:bg-black/5 shrink-0"
                    aria-label="Toggle details"
                  >
                    <ChevronRight size={15} style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
                  </button>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0" style={{ background: "#EFEFEA", color: "#0A0A0A" }}>
                    {typeMeta?.icon}{typeMeta?.label ?? "Resource"}
                  </span>
                  <span className="text-[13px] font-semibold truncate flex-1" title={item.title}>{item.title}</span>
                  {item.isFeatured && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0" style={{ background: "#FFF7E0", color: "#8A6A2E" }}>
                      <Star size={10} /> Featured
                    </span>
                  )}
                  <span className="text-[11px] text-[#0B0B0B]/40 hidden sm:inline shrink-0">{item.tag}</span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button type="button" onClick={() => moveItem(i, -1)} className="p-1 rounded hover:bg-black/5 disabled:opacity-30" disabled={i === 0} aria-label="Move up"><ChevronUp size={14} /></button>
                    <button type="button" onClick={() => moveItem(i, 1)} className="p-1 rounded hover:bg-black/5 disabled:opacity-30" disabled={i === data.items.length - 1} aria-label="Move down"><ChevronDown size={14} /></button>
                    <button type="button" onClick={() => duplicateItem(i)} className="p-1 rounded hover:bg-black/5" aria-label="Duplicate"><CopyIcon size={13} /></button>
                    <button type="button" onClick={() => removeItem(i)} className="p-1 rounded hover:bg-red-50 text-red-600" aria-label="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t p-4 space-y-3" style={{ borderColor: "#F0F0EC" }}>
                    {/* Type picker */}
                    <Field label="Resource Type" hint="Drives the icon, format badge, and default CTA label on the public card.">
                      <div className="flex flex-wrap gap-1.5">
                        {TYPE_OPTIONS.map((opt) => {
                          const active = (item.type || "pdf") === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setItem(i, { type: opt.value })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors"
                              style={{
                                background: active ? "#0A0A0A" : "transparent",
                                color: active ? "#F8F8F6" : "#0A0A0A",
                                borderColor: active ? "#0A0A0A" : "#E5E5E0",
                              }}
                            >
                              {opt.icon} {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </Field>

                    <Input label="Title" value={item.title} onChange={(e) => setItem(i, { title: e.target.value })} />
                    <Textarea label="Short Description (card)" value={item.desc} onChange={(e) => setItem(i, { desc: e.target.value })} />
                    <Textarea label="Long Description (optional — used in structured data + AI)" value={item.longDesc ?? ""} onChange={(e) => setItem(i, { longDesc: e.target.value })} />

                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Tag / Category" value={item.tag} onChange={(e) => setItem(i, { tag: e.target.value })} placeholder="e.g. Template, Playbook" />
                      <Input label="Slug (auto if blank)" value={item.slug ?? ""} onChange={(e) => setItem(i, { slug: e.target.value })} placeholder="distribution-stack" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Primary Link (Drive / Notion / file)" value={item.link} onChange={(e) => setItem(i, { link: e.target.value })} placeholder="https://drive.google.com/..." />
                      <Input label="Primary Button Label" value={item.ctaLabel ?? ""} onChange={(e) => setItem(i, { ctaLabel: e.target.value })} placeholder="Download / Open / Watch" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Secondary Link (optional — Preview / Walkthrough)" value={item.secondaryCtaUrl ?? ""} onChange={(e) => setItem(i, { secondaryCtaUrl: e.target.value })} placeholder="https://..." />
                      <Input label="Secondary Button Label" value={item.secondaryCtaLabel ?? ""} onChange={(e) => setItem(i, { secondaryCtaLabel: e.target.value })} placeholder="Preview / Watch demo" />
                    </div>

                    <Input label="Corner Badge (optional)" value={item.badgeText ?? ""} onChange={(e) => setItem(i, { badgeText: e.target.value })} placeholder='e.g. "New", "Most popular", "Updated"' />

                    <div className="grid grid-cols-3 gap-3">
                      <Input label="File Format" value={item.fileFormat ?? ""} onChange={(e) => setItem(i, { fileFormat: e.target.value })} placeholder="PDF / Notion / Drive" />
                      <Input label="File Size" value={item.fileSize ?? ""} onChange={(e) => setItem(i, { fileSize: e.target.value })} placeholder="12 MB" />
                      <Input label="Author" value={item.author ?? ""} onChange={(e) => setItem(i, { author: e.target.value })} placeholder="GrowitBuddy" />
                    </div>

                    <Input label="Cover Image URL (optional)" value={item.coverImage ?? ""} onChange={(e) => setItem(i, { coverImage: e.target.value })} placeholder="https://..." />

                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Published Date (YYYY-MM-DD)" type="date" value={item.publishedDate ?? ""} onChange={(e) => setItem(i, { publishedDate: e.target.value })} />
                      <Input label="Updated Date (YYYY-MM-DD)" type="date" value={item.updatedDate ?? ""} onChange={(e) => setItem(i, { updatedDate: e.target.value })} />
                    </div>

                    <div className="flex flex-wrap gap-3 pt-1">
                      <ToggleChip active={!!item.isFeatured} onChange={(v) => setItem(i, { isFeatured: v })} icon={<Star size={12} />} label="Featured" />
                      <ToggleChip active={!!item.isGated} onChange={(v) => setItem(i, { isGated: v })} icon={<EyeOff size={12} />} label="Gated (email required)" />
                    </div>

                    {/* Per-resource SEO/AI */}
                    <div className="pt-3 mt-3 border-t" style={{ borderColor: "#F0F0EC" }}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#0B0B0B]/45 mb-2 flex items-center gap-1.5">
                        <Sparkles size={11} /> SEO / AI per resource
                      </p>
                      <Input label="Keywords (comma separated)" value={item.keywords ?? ""} onChange={(e) => setItem(i, { keywords: e.target.value })} placeholder="founder branding, distribution playbook" />
                      <Textarea label="AI Summary (1-2 sentences — used by LLM citations)" value={item.aiSummary ?? ""} onChange={(e) => setItem(i, { aiSummary: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── FAQs ── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <SectionTitle>FAQs</SectionTitle>
            <p className="text-[12px] text-[#0B0B0B]/50 -mt-2">Shown at the bottom of the page AND emitted as FAQPage schema for Google + AI assistants (AEO / People-Also-Ask).</p>
          </div>
          <button
            type="button"
            onClick={addFaq}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
            style={{ background: "#0A0A0A", color: "#F8F8F6" }}
          >
            <Plus size={13} /> Add FAQ
          </button>
        </div>
        <div className="space-y-3">
          {faqs.length === 0 && <p className="text-[13px] text-[#0B0B0B]/40 italic">No FAQs yet. Add one above.</p>}
          {faqs.map((f, i) => (
            <div key={i} className="border rounded-xl p-3 bg-white" style={{ borderColor: "#E5E5E0" }}>
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <Input label={`Question ${i + 1}`} value={f.q} onChange={(e) => setFaq(i, { q: e.target.value })} />
                  <Textarea label="Answer" value={f.a} onChange={(e) => setFaq(i, { a: e.target.value })} />
                </div>
                <button type="button" onClick={() => removeFaq(i)} className="p-1.5 rounded text-red-600 hover:bg-red-50 mt-6" aria-label="Delete FAQ">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── SEO basics ── */}
      <Card>
        <SectionTitle>SEO — Basics</SectionTitle>
        <Input label="Page Title (60 chars ideal)" value={data.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} hint={`${(data.seoTitle || "").length} chars`} />
        <Textarea label="Meta Description (155 chars ideal)" value={data.seoDesc} onChange={(e) => set("seoDesc", e.target.value)} hint={`${(data.seoDesc || "").length} chars`} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Canonical URL" value={data.canonicalUrl ?? ""} onChange={(e) => set("canonicalUrl", e.target.value)} placeholder="https://growitbuddy.com/resources" />
          <Input label="OG / Social Image URL" value={data.ogImage ?? ""} onChange={(e) => set("ogImage", e.target.value)} placeholder="https://..." />
        </div>
      </Card>

      {/* ── Advanced SEO — collapsible ── */}
      <Card>
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <SectionTitle>SEO — Advanced (AI / GEO / AEO / AISEO)</SectionTitle>
            <p className="text-[12px] text-[#0B0B0B]/50 -mt-2">
              Signals for AI search (ChatGPT/Perplexity), Generative Engine Optimization, Answer Engine Optimization, and entity SEO. All fields below are injected into the page's structured data and rendered as a citable "Quick Answer" block at the top of the public page.
            </p>
          </div>
          <ChevronRight size={18} style={{ transform: advancedOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
        </button>

        {advancedOpen && (
          <div className="space-y-3 mt-4 pt-4 border-t" style={{ borderColor: "#F0F0EC" }}>
            <Field label="AI Quick-Answer Summary" hint="2-3 sentences that directly answer 'What is GrowitBuddy Resources?' — surfaced as a Quick Answer card on the page AND fed to JSON-LD `abstract` for LLM citation.">
              <textarea
                rows={3}
                value={data.aiSummary ?? ""}
                onChange={(e) => set("aiSummary", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-[13px] bg-white"
                style={{ borderColor: "#E5E5E0", fontFamily: "inherit" }}
              />
            </Field>
            <Input label="AI Target Keywords (comma separated)" value={data.aiKeywords ?? ""} onChange={(e) => set("aiKeywords", e.target.value)} placeholder="free distribution playbook, founder content templates, ..." />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Primary Entity / Topic" value={data.primaryEntity ?? ""} onChange={(e) => set("primaryEntity", e.target.value)} placeholder="Content marketing resources" />
              <Input label="Related Topics (comma separated)" value={data.relatedTopics ?? ""} onChange={(e) => set("relatedTopics", e.target.value)} placeholder="Personal branding, Distribution, ..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Target Audience" value={data.audience ?? ""} onChange={(e) => set("audience", e.target.value)} placeholder="Founders, creators" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Geo Location" value={data.geoLocation ?? ""} onChange={(e) => set("geoLocation", e.target.value)} placeholder="India" />
                <Input label="Language" value={data.geoLanguage ?? ""} onChange={(e) => set("geoLanguage", e.target.value)} placeholder="en" />
              </div>
            </div>
            <Field label="Factual Claims (one per line)" hint="Verifiable facts about your offering — shown as a bullet list under the Quick Answer block. Strong signal for AI citation and AEO.">
              <textarea
                rows={4}
                value={data.factualClaims ?? ""}
                onChange={(e) => set("factualClaims", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-[13px] bg-white"
                style={{ borderColor: "#E5E5E0", fontFamily: "inherit" }}
              />
            </Field>
          </div>
        )}
      </Card>

      <PageVisibilityCard slug="resources" />
      <SaveBar saving={saving} saved={saved} onSave={handleSave} />
    </div>
  );
}

// ── Small UI bits ──────────────────────────────────────────────────────────
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-3" style={{ borderColor: "#E5E5E0" }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#0B0B0B]/45">{label}</p>
      <p className="text-[20px] font-black mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>{value}</p>
    </div>
  );
}

function ToggleChip({ active, onChange, icon, label }: { active: boolean; onChange: (v: boolean) => void; icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors"
      style={{
        background: active ? "#0A0A0A" : "transparent",
        color: active ? "#F8F8F6" : "#0A0A0A",
        borderColor: active ? "#0A0A0A" : "#E5E5E0",
      }}
    >
      {active ? <Eye size={12} /> : icon} {label}
    </button>
  );
}
