import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, Field, SaveBar } from "@/components/admin/AdminField";
import { ImageUrlField } from "@/components/admin/ImageUrlField";
import {
  PAGE_REGISTRY,
  findEntryBySlug,
  seoSectionKey,
  type PageRegistryEntry,
  type PageSEOData,
} from "@/lib/pageRegistry";
import {
  Search, Globe, Check, X, ExternalLink, AlertTriangle, CheckCircle2,
  Image as ImageIcon, Code2, Sparkles,
} from "lucide-react";

const SITE = "https://growitbuddy.com";
const DEFAULT_IMAGE = `${SITE}/opengraph.jpg`;

// ─── Toggle row ─────────────────────────────────────────────────────
function Toggle({ label, checked, onChange, hint }:
  { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-[#0B0B0B]">{label}</div>
        {hint && <div className="text-[11px] text-[#0B0B0B]/45 mt-0.5">{hint}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-emerald-600" : "bg-[#0B0B0B]/15"}`}
        aria-pressed={checked}
      >
        <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

// ─── Truncate util ─────────────────────────────────────────────────
function truncate(s: string, n: number) { return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…"; }

// ─── SERP preview ──────────────────────────────────────────────────
function SerpPreview({ url, title, description }: { url: string; title: string; description: string }) {
  return (
    <div className="border border-[#0B0B0B]/8 rounded-xl p-4 bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
      <div className="text-[12px] text-[#202124] flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-[#1E293B] flex items-center justify-center text-white text-[9px] font-bold">G</div>
        <span>{url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
      </div>
      <div className="text-[20px] text-[#1a0dab] mt-1 leading-tight font-normal hover:underline cursor-pointer">{truncate(title || "Untitled page", 60)}</div>
      <div className="text-[14px] text-[#4d5156] leading-snug mt-1">{truncate(description || "No description provided.", 160)}</div>
    </div>
  );
}

// ─── Twitter/X preview ─────────────────────────────────────────────
function TwitterPreview({ url, title, description, image, card }:
  { url: string; title: string; description: string; image: string; card: string }) {
  const large = card !== "summary";
  return (
    <div className="border border-[#0B0B0B]/12 rounded-2xl overflow-hidden bg-white max-w-[500px]">
      {large && (
        <div className="aspect-[1.91/1] bg-[#0B0B0B]/5 flex items-center justify-center overflow-hidden">
          {image
            ? <img src={image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            : <ImageIcon size={32} className="text-[#0B0B0B]/20" />}
        </div>
      )}
      <div className="px-3 py-2.5 flex gap-3 items-center">
        {!large && (
          <div className="w-[88px] h-[88px] shrink-0 bg-[#0B0B0B]/5 rounded-lg flex items-center justify-center overflow-hidden">
            {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-[#0B0B0B]/20" />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[12px] text-[#536471] truncate">{url.replace(/^https?:\/\//, "")}</div>
          <div className="text-[14px] text-[#0F1419] font-normal mt-0.5 leading-snug" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{truncate(title, 70)}</div>
          {large && description && (
            <div className="text-[13px] text-[#536471] mt-0.5 leading-snug" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{truncate(description, 200)}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Facebook/LinkedIn preview (OG) ─────────────────────────────────
function OGPreview({ url, title, description, image }:
  { url: string; title: string; description: string; image: string }) {
  return (
    <div className="border border-[#0B0B0B]/12 rounded-md overflow-hidden bg-white max-w-[500px]">
      <div className="aspect-[1.91/1] bg-[#0B0B0B]/5 flex items-center justify-center overflow-hidden">
        {image ? <img src={image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <ImageIcon size={32} className="text-[#0B0B0B]/20" />}
      </div>
      <div className="px-3 py-2.5 bg-[#F2F3F5]">
        <div className="text-[12px] uppercase text-[#606770] truncate">{url.replace(/^https?:\/\//, "").replace(/\/.*$/, "")}</div>
        <div className="text-[16px] font-semibold text-[#1d2129] leading-tight mt-0.5" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{truncate(title, 88)}</div>
        <div className="text-[13px] text-[#606770] mt-1 leading-snug" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{truncate(description, 200)}</div>
      </div>
    </div>
  );
}

// ─── Validation issues ─────────────────────────────────────────────
interface Issue { level: "warn" | "error" | "ok"; message: string; }
function validate(seo: PageSEOData, eff: { title: string; description: string }): Issue[] {
  const out: Issue[] = [];
  if (!eff.title.trim()) out.push({ level: "error", message: "Missing title" });
  else if (eff.title.length > 60) out.push({ level: "warn", message: `Title is ${eff.title.length} chars (recommended ≤ 60)` });
  else if (eff.title.length < 25) out.push({ level: "warn", message: `Title is short — ${eff.title.length} chars (recommended 25–60)` });
  else out.push({ level: "ok", message: `Title length OK (${eff.title.length} chars)` });

  if (!eff.description.trim()) out.push({ level: "error", message: "Missing meta description" });
  else if (eff.description.length > 160) out.push({ level: "warn", message: `Description is ${eff.description.length} chars (recommended ≤ 160)` });
  else if (eff.description.length < 70) out.push({ level: "warn", message: `Description is short — ${eff.description.length} chars (recommended 70–160)` });
  else out.push({ level: "ok", message: `Description length OK (${eff.description.length} chars)` });

  if (seo.canonical && !/^(https?:\/\/|\/)/.test(seo.canonical)) {
    out.push({ level: "error", message: "Canonical must be an absolute URL or start with /" });
  }

  if (seo.schema && seo.schema.trim()) {
    try { JSON.parse(seo.schema); out.push({ level: "ok", message: "JSON-LD schema valid" }); }
    catch { out.push({ level: "error", message: "JSON-LD schema is invalid JSON — will be skipped" }); }
  }

  if (seo.index === false && seo.sitemap !== false) {
    out.push({ level: "warn", message: "Page is noindex but still in sitemap — usually you want both off" });
  }

  return out;
}

// ─── Main component ────────────────────────────────────────────────
export default function AdminSEO() {
  const { getContent, saveContent, isSuperAdmin } = useAdmin();
  const [selectedSlug, setSelectedSlug] = useState<string>(PAGE_REGISTRY[0].slug);
  const [filter, setFilter] = useState("");
  const [seoBySlug, setSeoBySlug] = useState<Record<string, PageSEOData>>({});
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const entry: PageRegistryEntry = findEntryBySlug(selectedSlug) ?? PAGE_REGISTRY[0];
  const seo: PageSEOData = seoBySlug[selectedSlug] ?? {};

  // Load selected slug's SEO data on demand
  useEffect(() => {
    if (seoBySlug[selectedSlug] !== undefined) return;
    setLoadingSlug(selectedSlug);
    getContent(seoSectionKey(selectedSlug))
      .then((d) => setSeoBySlug((p) => ({ ...p, [selectedSlug]: (d as PageSEOData) ?? {} })))
      .catch(() => setSeoBySlug((p) => ({ ...p, [selectedSlug]: {} })))
      .finally(() => setLoadingSlug(null));
  }, [selectedSlug, getContent, seoBySlug]);

  function update<K extends keyof PageSEOData>(key: K, val: PageSEOData[K]) {
    setDirty(true); setSaved(false);
    setSeoBySlug((p) => ({ ...p, [selectedSlug]: { ...(p[selectedSlug] ?? {}), [key]: val } }));
  }

  async function save() {
    setSaving(true);
    try {
      await saveContent(seoSectionKey(selectedSlug), seo as unknown as Record<string, unknown>);
      setSaved(true); setDirty(false);
    } catch { setSaved(false); }
    finally { setSaving(false); }
  }

  // Effective values (overrides cascade onto defaults)
  const eff = useMemo(() => {
    const title = seo.title || entry.defaults.title;
    const description = seo.description || entry.defaults.description;
    const url = seo.canonical
      ? (seo.canonical.startsWith("http") ? seo.canonical : `${SITE}${seo.canonical}`)
      : `${SITE}${entry.path}`;
    const ogTitle = seo.ogTitle || title;
    const ogDesc = seo.ogDescription || description;
    const ogImg = seo.ogImage
      ? (seo.ogImage.startsWith("http") ? seo.ogImage : `${SITE}${seo.ogImage}`)
      : DEFAULT_IMAGE;
    const twTitle = seo.twitterTitle || ogTitle;
    const twDesc = seo.twitterDescription || ogDesc;
    const twImg = seo.twitterImage
      ? (seo.twitterImage.startsWith("http") ? seo.twitterImage : `${SITE}${seo.twitterImage}`)
      : ogImg;
    return { title, description, url, ogTitle, ogDesc, ogImg, twTitle, twDesc, twImg };
  }, [seo, entry]);

  const issues = validate(seo, eff);
  const filteredRegistry = PAGE_REGISTRY.filter(
    (p) => p.label.toLowerCase().includes(filter.toLowerCase()) || p.path.toLowerCase().includes(filter.toLowerCase()),
  );

  const indexOn   = seo.index   !== false;
  const followOn  = seo.follow  !== false;
  const sitemapOn = seo.sitemap !== false;

  if (!isSuperAdmin) {
    return (
      <div>
        <PageHeader title="SEO Control" />
        <Card>
          <div className="py-10 text-center">
            <div className="text-[15px] font-semibold text-[#0B0B0B]">Restricted</div>
            <div className="text-[13px] text-[#0B0B0B]/50 mt-1">SEO controls are available to super admins only.</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="SEO Control"
        description={
          <>Manage indexing, meta, social previews, and structured data for every public page.{" "}
            <a href="/seo-guide" target="_blank" rel="noopener noreferrer" className="underline">Read the team guide</a>
            {" · "}
            <a href="https://growitbuddy-api.onrender.com/api/sitemap.xml" target="_blank" rel="noopener noreferrer" className="underline">View live sitemap</a>
          </>
        }
      />

      <div className="grid grid-cols-[260px_1fr] gap-5">
        {/* ── LEFT: page list ───────────────────────────────────── */}
        <aside className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0B0B0B]/30" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search pages…"
              className="w-full border border-[#0B0B0B]/12 rounded-xl pl-9 pr-3 py-2 text-[13px] outline-none focus:border-[#0B0B0B]/40 bg-white"
            />
          </div>
          <Card className="!p-0 overflow-hidden">
            <div className="max-h-[70vh] overflow-y-auto">
              {(["Core", "Services", "Network", "Pools", "Legal", "Utility"] as const).map((group) => {
                const items = filteredRegistry.filter((p) => p.group === group);
                if (!items.length) return null;
                return (
                  <div key={group} className="border-b border-[#0B0B0B]/6 last:border-0">
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#0B0B0B]/35 bg-[#0B0B0B]/[0.02]">{group}</div>
                    {items.map((p) => {
                      const active = p.slug === selectedSlug;
                      const data = seoBySlug[p.slug];
                      const noindex = data?.index === false;
                      return (
                        <button
                          key={p.slug}
                          onClick={() => { if (dirty && !confirm("Discard unsaved changes?")) return; setSelectedSlug(p.slug); setDirty(false); setSaved(false); }}
                          className={`w-full flex items-center justify-between text-left px-3 py-2 text-[13px] transition-colors border-l-2 ${active ? "bg-[#0B0B0B]/5 border-l-[#0B0B0B] font-semibold" : "border-l-transparent hover:bg-[#0B0B0B]/[0.03]"}`}
                        >
                          <div className="min-w-0">
                            <div className="truncate text-[#0B0B0B]">{p.label}</div>
                            <div className="text-[10px] text-[#0B0B0B]/40 truncate">{p.path}</div>
                          </div>
                          {noindex && <span className="text-[9px] font-bold uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded">noindex</span>}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </Card>
        </aside>

        {/* ── RIGHT: editor ────────────────────────────────────── */}
        <div className="space-y-5 min-w-0">
          {/* Header bar */}
          <Card className="!py-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-[#0B0B0B]/40 font-semibold">Editing</div>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-[18px] font-bold text-[#0B0B0B] truncate">{entry.label}</h2>
                <a
                  href={`${entry.path}${entry.path.includes("?") ? "&" : "?"}_seoPreview=${Date.now()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open the live page in a new tab (cache-busted)"
                  className="text-[12px] text-[#0B0B0B]/50 hover:text-[#0B0B0B] inline-flex items-center gap-1"
                >
                  {entry.path} <ExternalLink size={11} />
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {indexOn ? <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-1 rounded">Indexable</span>
                       : <span className="text-[10px] font-bold uppercase text-red-700 bg-red-50 px-2 py-1 rounded">No-index</span>}
              {sitemapOn ? <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-2 py-1 rounded">In Sitemap</span>
                         : <span className="text-[10px] font-bold uppercase text-[#0B0B0B]/60 bg-[#0B0B0B]/8 px-2 py-1 rounded">Hidden</span>}
            </div>
          </Card>

          {loadingSlug === selectedSlug ? (
            <Card><div className="text-[13px] text-[#0B0B0B]/40 py-8 text-center">Loading…</div></Card>
          ) : (
            <>
              {/* ── Indexability ── */}
              <Card>
                <SectionTitle>Indexability & Sitemap</SectionTitle>
                <Toggle label="Allow Search Engine Indexing" checked={indexOn} onChange={(v) => update("index", v)}
                  hint="When off, injects <meta name='robots' content='noindex'>" />
                <div className="border-t border-[#0B0B0B]/6" />
                <Toggle label="Allow Search Engine Following" checked={followOn} onChange={(v) => update("follow", v)}
                  hint="When off, injects nofollow directive" />
                <div className="border-t border-[#0B0B0B]/6" />
                <Toggle label="Include In Sitemap" checked={sitemapOn} onChange={(v) => update("sitemap", v)}
                  hint="When off, page is excluded from /api/sitemap.xml" />
              </Card>

              {/* ── Core meta ── */}
              <Card>
                <SectionTitle>Core Meta</SectionTitle>
                <div className="space-y-3.5">
                  <Input label="Meta Title" value={seo.title ?? ""} placeholder={entry.defaults.title}
                    onChange={(e) => update("title", e.target.value)}
                    hint={`${(seo.title ?? "").length} / 60 recommended`} />
                  <Textarea label="Meta Description" value={seo.description ?? ""} placeholder={entry.defaults.description}
                    onChange={(e) => update("description", e.target.value)} rows={3}
                    hint={`${(seo.description ?? "").length} / 160 recommended`} />
                  <Input label="Canonical URL" value={seo.canonical ?? ""} placeholder={`${SITE}${entry.path}`}
                    onChange={(e) => update("canonical", e.target.value)}
                    hint="Absolute URL or path starting with /. Leave empty to auto-use the page URL." />
                </div>
              </Card>

              {/* ── SERP preview ── */}
              <Card>
                <SectionTitle>Google SERP Preview</SectionTitle>
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#0B0B0B]/40 mb-1.5 font-semibold flex items-center gap-1.5"><Globe size={11}/> Desktop</div>
                    <SerpPreview url={eff.url} title={eff.title} description={eff.description} />
                  </div>
                </div>
              </Card>

              {/* ── Open Graph ── */}
              <Card>
                <SectionTitle>Open Graph (Facebook, LinkedIn, WhatsApp, Discord)</SectionTitle>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-3.5">
                    <Input label="OG Title" value={seo.ogTitle ?? ""} placeholder={eff.title}
                      onChange={(e) => update("ogTitle", e.target.value)} />
                    <Textarea label="OG Description" value={seo.ogDescription ?? ""} placeholder={eff.description}
                      onChange={(e) => update("ogDescription", e.target.value)} rows={2} />
                    <ImageUrlField label="OG Image" value={seo.ogImage ?? ""}
                      placeholder="/opengraph.jpg or https://..."
                      onChange={(url) => update("ogImage", url)}
                      hint="Recommended 1200×630px. Paste a URL, upload a file, or pick from the Media Library. Leave empty to use site default." />
                    <Field label="OG Type">
                      <select value={seo.ogType ?? "website"} onChange={(e) => update("ogType", e.target.value as "website" | "article")}
                        className="w-full border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[14px] bg-white outline-none focus:border-[#0B0B0B]/40">
                        <option value="website">website</option>
                        <option value="article">article</option>
                      </select>
                    </Field>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#0B0B0B]/40 mb-2 font-semibold">Preview</div>
                    <OGPreview url={eff.url} title={eff.ogTitle} description={eff.ogDesc} image={eff.ogImg} />
                  </div>
                </div>
              </Card>

              {/* ── Twitter ── */}
              <Card>
                <SectionTitle>Twitter / X</SectionTitle>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-3.5">
                    <Field label="Card Type">
                      <select value={seo.twitterCard ?? "summary_large_image"} onChange={(e) => update("twitterCard", e.target.value as "summary" | "summary_large_image")}
                        className="w-full border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[14px] bg-white outline-none focus:border-[#0B0B0B]/40">
                        <option value="summary_large_image">Large image card</option>
                        <option value="summary">Summary (small image)</option>
                      </select>
                    </Field>
                    <Input label="Twitter Title" value={seo.twitterTitle ?? ""} placeholder={eff.ogTitle}
                      onChange={(e) => update("twitterTitle", e.target.value)} />
                    <Textarea label="Twitter Description" value={seo.twitterDescription ?? ""} placeholder={eff.ogDesc}
                      onChange={(e) => update("twitterDescription", e.target.value)} rows={2} />
                    <ImageUrlField label="Twitter Image" value={seo.twitterImage ?? ""}
                      placeholder="Leave empty to use OG image"
                      onChange={(url) => update("twitterImage", url)}
                      hint="Paste a URL, upload a file, or pick from the Media Library." />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#0B0B0B]/40 mb-2 font-semibold">Preview</div>
                    <TwitterPreview url={eff.url} title={eff.twTitle} description={eff.twDesc} image={eff.twImg} card={seo.twitterCard ?? "summary_large_image"} />
                  </div>
                </div>
              </Card>

              {/* ── JSON-LD schema ── */}
              <Card>
                <SectionTitle><span className="inline-flex items-center gap-2"><Code2 size={14}/>Structured Data (JSON-LD)</span></SectionTitle>
                <Textarea
                  value={seo.schema ?? ""}
                  placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "Page name"\n}'}
                  onChange={(e) => update("schema", e.target.value)}
                  rows={10}
                  className="font-mono text-[12px]"
                  hint="Paste raw JSON-LD. It is validated and injected into the page as a <script type=&quot;application/ld+json&quot;> tag. Use schema.org types like Organization, WebSite, BreadcrumbList, FAQPage."
                />
              </Card>

              {/* ── AI/AEO/GEO ── */}
              <Card>
                <SectionTitle><span className="inline-flex items-center gap-2"><Sparkles size={14}/>AI Search / AEO / GEO</span></SectionTitle>
                <p className="text-[12px] text-[#0B0B0B]/50 mb-4 -mt-2">Optimization signals for AI-driven search engines (ChatGPT, Perplexity, Google AI Overviews).</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <Input label="Primary Topic" value={seo.primaryTopic ?? ""} onChange={(e) => update("primaryTopic", e.target.value)}
                    placeholder="e.g. Creator agency services" />
                  <Input label="Search Intent" value={seo.searchIntent ?? ""} onChange={(e) => update("searchIntent", e.target.value)}
                    placeholder="informational | commercial | transactional | navigational" />
                  <Input label="Entity Mentions" value={seo.entityMentions ?? ""} onChange={(e) => update("entityMentions", e.target.value)}
                    placeholder="comma-separated, e.g. GrowitBuddy, YouTube, content marketing" />
                  <Input label="Key Concepts" value={seo.keyConcepts ?? ""} onChange={(e) => update("keyConcepts", e.target.value)}
                    placeholder="comma-separated topics" />
                  <Input label="GEO Relevance" value={seo.geoRelevance ?? ""} onChange={(e) => update("geoRelevance", e.target.value)}
                    placeholder="e.g. India, Global, US" />
                </div>
                <div className="mt-3.5">
                  <Textarea label="AI Summary" value={seo.aiSummary ?? ""} onChange={(e) => update("aiSummary", e.target.value)}
                    rows={3} placeholder="One-paragraph summary an AI engine should cite when answering questions about this page." />
                </div>
              </Card>

              {/* ── Validation ── */}
              <Card>
                <SectionTitle>Validation</SectionTitle>
                <div className="space-y-2">
                  {issues.map((it, i) => (
                    <div key={i} className={`flex items-start gap-2 text-[13px] ${it.level === "error" ? "text-red-700" : it.level === "warn" ? "text-amber-700" : "text-emerald-700"}`}>
                      {it.level === "error" && <X size={14} className="mt-0.5 shrink-0"/>}
                      {it.level === "warn"  && <AlertTriangle size={14} className="mt-0.5 shrink-0"/>}
                      {it.level === "ok"    && <CheckCircle2 size={14} className="mt-0.5 shrink-0"/>}
                      <span>{it.message}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <SaveBar onSave={save} saving={saving} saved={saved} />
              <div className="flex justify-end pt-1">
                <button onClick={save} disabled={saving || !dirty}
                  className="px-5 py-2.5 rounded-xl bg-[#0B0B0B] text-white text-[13px] font-semibold disabled:opacity-30 inline-flex items-center gap-2">
                  <Check size={14}/>{saving ? "Saving…" : "Save SEO"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
