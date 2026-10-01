import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, ArrowDownToLine, Check, CheckCircle2, ChevronRight, Clipboard, Code2, ExternalLink, FileCode2, Globe2, Image as ImageIcon, Link2, Search, ShieldCheck, X } from "lucide-react";
import type { BlogPost } from "../../data/blogPosts";
import { analyzeBlogSeo } from "../../lib/blogSeoAudit";
import type { SeoCheck } from "../../lib/blogSeoAudit";
import { isBlogInSitemap, resolveBlogSeo, isCmsPageInSitemap, resolveCmsPageSeo } from "@workspace/seo";

interface SeoPreviewDashboardProps {
  post: BlogPost;
  allPosts: BlogPost[];
  globalIndexable: boolean;
  currentlyPublished: boolean;
  onClose: () => void;
  articlePreview: ReactNode;
  pageMode?: boolean;
}

type SectionId = "overview" | "appearance" | "article" | "technical" | "source";
const sections: { id: SectionId; label: string; number: string }[] = [
  { id: "overview", label: "Readiness", number: "01" },
  { id: "appearance", label: "Search & social", number: "02" },
  { id: "article", label: "On-page", number: "03" },
  { id: "technical", label: "Technical", number: "04" },
  { id: "source", label: "Crawler output", number: "05" },
];
const groups = ["on-page", "technical"] as const;
const SITEMAP_ENDPOINT = "https://growitbuddy.com/sitemap-blog.xml";
const PAGE_SITEMAP_ENDPOINT = "https://growitbuddy.com/sitemap.xml";

/** Capture shared template tags from this running document, not invented article tags. */
function readStaticHead(): string {
  if (typeof document === "undefined") return "Static head available in the browser only.";
  const selectors = [
    "meta[charset]", 'meta[name="viewport"]', 'meta[name="author"]',
    'meta[name="theme-color"]', 'meta[name="color-scheme"]',
    'meta[property="og:image:width"]', 'meta[property="og:image:height"]',
    'meta[name="twitter:site"]',
  ];
  return [`<html lang="${document.documentElement.lang}">`, ...selectors.map((selector) =>
    document.head.querySelector(selector)?.outerHTML || `<!-- ${selector}: not present in current document -->`,
  )].join("\n");
}

function StatusMark({ level }: { level: SeoCheck["level"] }) {
  return level === "error" ? <AlertCircle size={16} aria-hidden="true" /> : level === "warning" ? <AlertTriangle size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />;
}

function SectionHeading({ index, eyebrow, title, description }: { index: string; eyebrow: string; title: string; description: string }) {
  return <div className="seo-section-heading">
    <span className="seo-section-index">{index} / {eyebrow}</span>
    <h2>{title}</h2>
    <p>{description}</p>
  </div>;
}

function Fact({ label, value, note, mono = false }: { label: string; value: ReactNode; note?: string; mono?: boolean }) {
  return <div className="seo-fact">
    <dt>{label}</dt>
    <dd className={mono ? "seo-mono" : undefined}>{value}</dd>
    {note && <p>{note}</p>}
  </div>;
}

interface ComparisonRow { label: string; input: string; resolved: string; explanation: string }
function Compare({ label, input, resolved, explanation }: ComparisonRow) {
  const changed = input.trim() !== resolved.trim();
  return <div className="seo-compare">
    <div className="seo-compare-top"><strong>{label}</strong><span className={changed ? "seo-difference" : "seo-same"}>{changed ? "Resolved differently" : "Matches input"}</span></div>
    <div className="seo-compare-grid">
      <div><small>ADMIN INPUT</small><p>{input || <em>Not set</em>}</p></div>
      <div><small>GENERATED OUTPUT</small><p>{resolved || <em>Empty</em>}</p></div>
    </div>
    <p className="seo-compare-explain">{explanation}</p>
  </div>;
}

function CodePanel({ label, code, onCopy }: { label: string; code: string; onCopy: () => void }) {
  return <div className="seo-code-panel">
    <div className="seo-code-head"><span><Code2 size={14} /> {label}</span><button type="button" onClick={onCopy}><Clipboard size={13} /> Copy</button></div>
    <pre tabIndex={0}><code>{code || "No output generated."}</code></pre>
  </div>;
}

export default function SeoPreviewDashboard({ post, allPosts, globalIndexable, currentlyPublished, onClose, articlePreview, pageMode = false }: SeoPreviewDashboardProps) {
  const output = useMemo(() => pageMode ? resolveCmsPageSeo(post, { globalIndexable }) : resolveBlogSeo(post, { globalIndexable }), [post, globalIndexable, pageMode]);
  const audit = useMemo(() => analyzeBlogSeo(post, output, allPosts, currentlyPublished, pageMode), [post, output, allPosts, currentlyPublished, pageMode]);
  const errors = audit.checks.filter((check) => check.level === "error");
  const warnings = audit.checks.filter((check) => check.level === "warning");
  const passes = audit.checks.filter((check) => check.level === "pass");
  const readiness = errors.length ? "ERROR" : warnings.length ? "WARNING" : "PASS";
  const links = [...audit.internalLinks, ...audit.externalLinks];
  const imagesWithoutAlt = audit.images.filter((image) => image.missingAlt).length;
  const schemaTypes = output.jsonLd["@graph"].flatMap((node) => {
    const type = node["@type"];
    return Array.isArray(type) ? type.map(String) : type ? [String(type)] : [];
  });
  const sitemapIncluded = pageMode ? isCmsPageInSitemap(post, globalIndexable) : isBlogInSitemap(post, globalIndexable);
  const [active, setActive] = useState<SectionId>("overview");
  const [notice, setNotice] = useState("");
  const [showAllChecks, setShowAllChecks] = useState(false);
  const [previewMode, setPreviewMode] = useState<"mobile" | "wide">("mobile");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onCloseRef.current(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')).filter((node) => node.getClientRects().length > 0);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); previousFocus?.focus(); if (noticeTimer.current) clearTimeout(noticeTimer.current); };
  }, []);

  function flash(message: string) {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 3000);
  }
  async function copy(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); flash(`${label} copied`); }
    catch { flash("Clipboard unavailable. Select the text in the output panel instead."); }
  }
  function navigate(id: SectionId) {
    setActive(id);
    dialogRef.current?.querySelector(`#seo-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const jsonLdText = JSON.stringify(output.jsonLd, null, 2);
  const staticHeadHtml = readStaticHead();
  const metaWithStatic = `<!-- Shared index template tags observed in this document -->\n${staticHeadHtml}\n\n<!-- ${pageMode ? "Page" : "Article"}-specific generated tags -->\n${output.metaTagsHtml}`;
  const schemaHtml = `<script type="application/ld+json">${JSON.stringify(output.jsonLd)}</script>`;
  const fullHtml = [metaWithStatic, !output.metaTagsHtml.includes("application/ld+json") ? schemaHtml : "", output.crawlerBodyHtml].filter(Boolean).join("\n\n");
  const liveLabel = currentlyPublished ? "Published version exists" : "Not live yet";
  const robotsBlocked = /(?:^|,|\s)noindex(?:,|\s|$)/i.test(output.robots);
  const comparisonRows: ComparisonRow[] = [
    { label: "Slug / generated URL", input: post.slug || "", resolved: output.url, explanation: `The slug is a path segment; the resolver constructs the public ${pageMode ? "page (root /slug)" : "article"} URL.` },
    { label: "Search title", input: post.seo?.seoTitle || "", resolved: output.title, explanation: "The SEO title is used as entered. If it is empty, the post title is used; no site-name suffix is added." },
    { label: "Meta description", input: post.seo?.metaDescription || "", resolved: output.description, explanation: "The generated description can use other post fields when the dedicated input is empty." },
    { label: "Canonical URL", input: post.seo?.canonicalUrl || "", resolved: output.canonical, explanation: "A missing override resolves to the canonical article URL. A different URL can be intentional syndication." },
    { label: "Robots / noindex", input: post.seo?.noIndex ? "Noindex requested" : "Noindex off", resolved: output.robots, explanation: "Global indexing and publication rules may affect the generated robots directive." },
    { label: "Open Graph title", input: post.seo?.ogTitle || "", resolved: output.og.title, explanation: "Social title may inherit the resolved search title when an override is absent." },
    { label: "Open Graph description", input: post.seo?.ogDescription || "", resolved: output.og.description, explanation: "The social description may inherit the resolved meta description." },
    { label: "Open Graph image", input: post.seo?.ogImage || "", resolved: output.og.image || "", explanation: "Social image may fall back to the featured image or a site default." },
    { label: "Schema type / JSON-LD", input: post.seo?.schemaType || "Article (default)", resolved: schemaTypes.join(", ") || "No @type in graph", explanation: "The selected type is an input; the generated JSON-LD graph may contain several nodes or adjusted types." },
    { label: "Sitemap status", input: `${pageMode ? "Page" : "Post"}: ${post.status || "not specified"}; visibility: ${pageMode ? (post.visibility === "private" ? "private" : "public") : "n/a"}; global indexable: ${globalIndexable ? "on" : "off"}; noindex: ${post.seo?.noIndex ? "on" : "off"}`, resolved: output.sitemap.included ? "Included" : "Excluded", explanation: "Generated eligibility depends on production sitemap rules. Deployed sitemap was not fetched." },
  ];
  const report = [
    `# SEO pre-publish report — ${post.title || post.slug || "Untitled post"}`,
    `Generated: ${new Date().toISOString()}`,
    `Readiness: ${readiness} (${audit.criticalErrors.length} errors, ${warnings.length} warnings, ${passes.length} passes)`,
    `Publication: ${liveLabel}. This is generated output, not a live HTTP inspection.`,
    pageMode ? "CMS availability: Pages are public only when published and set to Public visibility. Anonymous HTTP access was not tested." : "CMS availability: Posts are public only after publication; no private-post setting is persisted. Anonymous HTTP access was not tested.",
    "",
    "## Resolved output",
    `URL: ${output.url}`, `Title: ${output.title}`, `Description: ${output.description}`,
    `Canonical: ${output.canonical}`, `Robots: ${output.robots}`,
    `Sitemap: ${sitemapIncluded ? "Included in generated sitemap" : "Excluded from generated sitemap"}`,
    `Sitemap endpoint: ${pageMode ? PAGE_SITEMAP_ENDPOINT : SITEMAP_ENDPOINT}`,
    `${pageMode ? "Page" : "Article"} <loc>: ${output.sitemap.url || "Not supplied"}`,
    `Last modified: ${output.sitemap.lastmod || "Not supplied"}`,
    `Open Graph: ${JSON.stringify(output.og, null, 2)}`,
    `Twitter: ${JSON.stringify(output.twitter, null, 2)}`,
    "",
    "## Admin input vs generated output",
    ...comparisonRows.flatMap((row) => [`### ${row.label}`, `Admin input: ${row.input || "(not set)"}`, `Generated output: ${row.resolved || "(empty)"}`, `Explanation: ${row.explanation}`]),
    "",
    "## Checks",
    `Critical errors: ${audit.criticalErrors.length ? audit.criticalErrors.join("; ") : "None"}`,
    `Warnings: ${warnings.length ? warnings.map((check) => `${check.label}: ${check.detail}`).join("; ") : "None"}`,
    ...audit.checks.map((check) => `- [${check.level.toUpperCase()}] ${check.label}: ${check.detail}`),
    "",
    "## Content inventory",
    `Words: ${audit.wordCount}; body images: ${audit.images.length}; missing alt: ${imagesWithoutAlt}`,
    `Expected public page H1: ${post.title || "(missing)"}`,
    ...audit.headings.map((heading) => `- H${heading.level}: ${heading.text}`),
    ...audit.images.map((image) => `- Image: ${image.src || "(missing src)"} | alt: ${image.alt || "(empty)"}${image.missingAlt ? " | missing/empty alt" : ""}`),
    "",
    "## Links (not fetched)",
    ...links.map((link) => `- ${link.internal ? "Internal" : "External"}: ${link.text} — ${link.href}${link.rel ? ` | rel="${link.rel}"` : ""}`),
    "",
    "## JSON-LD", "```json", jsonLdText, "```",
    "",
    "## Shared static template tags and generated meta tags", "```html", metaWithStatic, "```",
    "",
    "## Crawler body", "```html", output.crawlerBodyHtml, "```",
    "",
    "Note: No live HTTP, authentication, link destination, image availability, robots.txt response, indexing, or rich-result eligibility was verified. Google may rewrite search snippets or choose not to index.",
  ].join("\n");
  function downloadReport() {
    const url = URL.createObjectURL(new Blob([report], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `seo-report-${post.slug || "draft"}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    flash("Report downloaded");
  }

  return <div className="seo-room" role="presentation">
    <style>{`
      .seo-room{--ink:#17212b;--muted:#687481;--line:#dce2e2;--surface:#f7f8f5;--paper:#fffefa;--accent:#294d57;--accent-soft:#eaf1f0;position:fixed;inset:0;z-index:9999;background:rgba(15,25,30,.56);font-family:"DM Sans","Inter",sans-serif;color:var(--ink);letter-spacing:-.01em}
      .seo-room *{box-sizing:border-box}.seo-room button{cursor:pointer}.seo-room button:focus-visible,.seo-room a:focus-visible,.seo-room pre:focus-visible{outline:2px solid #29717a;outline-offset:3px}
      .seo-dialog{position:absolute;inset:18px;display:flex;flex-direction:column;overflow:hidden;border-radius:18px;background:var(--surface);box-shadow:0 28px 90px rgba(12,21,26,.25)}
      .seo-header{flex:none;background:var(--paper);border-bottom:1px solid var(--line);display:flex;align-items:center;gap:20px;padding:17px 26px}
      .seo-brand{display:flex;align-items:center;gap:12px;min-width:0}.seo-brand-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;background:var(--ink);color:#fff}
      .seo-brand small,.seo-eyebrow{display:block;color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}.seo-brand strong{display:block;font-size:16px;letter-spacing:-.035em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .seo-head-actions{margin-left:auto;display:flex;align-items:center;gap:8px}.seo-btn{border:1px solid var(--line);background:var(--paper);color:var(--ink);border-radius:8px;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 12px;font-size:12px;font-weight:700;white-space:nowrap;transition:background .15s,transform .15s}.seo-btn:hover{background:#edf2ef;transform:translateY(-1px)}.seo-btn-primary{background:var(--ink);color:#fff;border-color:var(--ink)}.seo-btn-primary:hover{background:#29414a}.seo-icon-btn{width:36px;height:36px;padding:0}
      .seo-shell{min-height:0;display:grid;grid-template-columns:214px minmax(0,1fr);flex:1}.seo-side{padding:25px 13px 20px;border-right:1px solid var(--line);background:#f0f3f0;display:flex;flex-direction:column;gap:4px}.seo-side-label{padding:0 12px 12px;color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.seo-nav{border:0;background:transparent;border-radius:8px;text-align:left;padding:11px 12px;display:flex;align-items:center;gap:12px;color:#5c6971;font-size:13px;font-weight:650;white-space:nowrap}.seo-nav span{font:600 10px ui-monospace,monospace;color:#9aa5aa}.seo-nav:hover{background:#e8eeeb}.seo-nav.active{background:var(--paper);color:var(--ink);box-shadow:0 1px 4px rgba(18,32,38,.06)}.seo-side-foot{margin-top:auto;border-top:1px solid var(--line);padding:17px 12px 0;font-size:11px;color:var(--muted);line-height:1.5}
      .seo-scroll{overflow:auto;scroll-behavior:smooth}.seo-content{max-width:1190px;margin:auto;padding:38px clamp(22px,4vw,64px) 100px}.seo-section{scroll-margin-top:28px;margin-bottom:74px}.seo-section-heading{margin-bottom:24px}.seo-section-index{font:700 11px ui-monospace,monospace;color:#54747a;text-transform:uppercase;letter-spacing:.12em}.seo-section-heading h2{font-size:clamp(25px,3vw,35px);letter-spacing:-.055em;line-height:1.12;margin:9px 0}.seo-section-heading p{color:var(--muted);font-size:13px;line-height:1.6;margin:0;max-width:720px}
      .seo-hero{border:1px solid #cbd8d7;background:#e9f0ed;border-radius:16px;padding:26px 28px;display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:16px}.seo-hero.error{background:#f9ebea;border-color:#eccac5}.seo-hero.warning{background:#f9f2e4;border-color:#e9d8b3}.seo-hero-label{font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#60737b}.seo-hero h3{font-size:30px;letter-spacing:-.055em;margin:7px 0 8px;line-height:1}.seo-hero p{font-size:13px;line-height:1.55;color:#53616a;max-width:560px;margin:0}.seo-hero-symbol{font:700 12px ui-monospace,monospace;border:1px solid currentColor;border-radius:100px;padding:8px 12px;letter-spacing:.1em}
      .seo-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px}.seo-stat{border:1px solid var(--line);background:var(--paper);border-radius:11px;padding:16px}.seo-stat strong{display:block;font-size:23px;letter-spacing:-.06em;line-height:1.1}.seo-stat span{display:block;color:var(--muted);font-size:11px;margin-top:6px}
      .seo-grid{display:grid;grid-template-columns:minmax(0,1.38fr) minmax(250px,.9fr);gap:16px}.seo-panel{background:var(--paper);border:1px solid var(--line);border-radius:13px;overflow:hidden}.seo-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 20px;border-bottom:1px solid var(--line)}.seo-panel-head h3{font-size:14px;letter-spacing:-.025em;margin:0}.seo-panel-body{padding:19px 20px}.seo-panel-note{color:var(--muted);font-size:12px;line-height:1.6;margin:0}
      .seo-check{display:flex;align-items:flex-start;gap:11px;padding:12px 0;border-bottom:1px solid #e9ecea}.seo-check:last-child{border-bottom:0}.seo-check-icon{margin-top:2px;flex:none}.seo-check.error .seo-check-icon{color:#ad514a}.seo-check.warning .seo-check-icon{color:#ac7b32}.seo-check.pass .seo-check-icon{color:#477f66}.seo-check strong{font-size:12px}.seo-check p{margin:3px 0 0;color:var(--muted);font-size:11px;line-height:1.5}
      .seo-link-button{background:none;border:0;color:#315f69;font-size:11px;font-weight:800;padding:0;display:inline-flex;align-items:center;gap:4px}.seo-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 24px}.seo-fact{padding:13px 0;border-bottom:1px solid #e9ecea;min-width:0}.seo-fact dt{font-size:10px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;color:#829099}.seo-fact dd{margin:5px 0 0;font-size:13px;font-weight:650;overflow-wrap:anywhere;line-height:1.5}.seo-fact p{font-size:11px;color:var(--muted);line-height:1.45;margin:4px 0 0}.seo-mono{font-family:ui-monospace,SFMono-Regular,monospace!important;font-size:11px!important;font-weight:500!important}
      .seo-callout{border-left:3px solid #668991;background:#ecf2f0;border-radius:0 8px 8px 0;padding:13px 16px;color:#38515a;font-size:12px;line-height:1.6;margin-top:16px}.seo-callout strong{display:block;color:var(--ink);margin-bottom:2px}
      .seo-search-card{padding:23px;background:var(--paper);border:1px solid var(--line);border-radius:13px}.seo-search-url{color:#44634d;font-size:12px;overflow-wrap:anywhere;margin:0 0 7px}.seo-search-title{font-size:21px;line-height:1.3;color:#234f92;font-weight:500;margin:0 0 7px;letter-spacing:-.025em}.seo-search-description{font-size:13px;color:#53616d;line-height:1.55;margin:0}.seo-card-caption{font-size:11px;color:var(--muted);margin:10px 0 0;line-height:1.5}
      .seo-social{border:1px solid var(--line);background:var(--paper);border-radius:13px;overflow:hidden;min-width:0}.seo-social-image{height:160px;background:#e1e9e7;display:grid;place-items:center;color:#6c838b;overflow:hidden}.seo-social-image img{width:100%;height:100%;object-fit:cover}.seo-social-copy{padding:15px}.seo-social-copy small{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}.seo-social-copy strong{display:block;font-size:14px;margin:6px 0 4px}.seo-social-copy p{font-size:11px;color:var(--muted);margin:0;line-height:1.45}
      .seo-social-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.seo-compare{border-bottom:1px solid var(--line);padding:17px 0}.seo-compare:last-child{border:0}.seo-compare-top{display:flex;align-items:center;gap:10px;justify-content:space-between}.seo-compare-top strong{font-size:12px}.seo-difference,.seo-same{font-size:10px;border-radius:4px;padding:4px 6px;font-weight:700;background:#f6ebd7;color:#8a652a}.seo-same{background:#e8f1eb;color:#3f785d}.seo-compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:11px}.seo-compare-grid>div{min-width:0}.seo-compare-grid small{font-size:9px;color:#819098;font-weight:800;letter-spacing:.1em}.seo-compare-grid p{font-size:12px;overflow-wrap:anywhere;margin:5px 0;line-height:1.45}.seo-compare-grid em{color:#a1a9ab}.seo-compare-explain{font-size:11px;color:var(--muted);margin:5px 0 0;line-height:1.5}
      .seo-article-preview{background:#e6eae7;padding:14px;border:1px solid var(--line);border-radius:13px}.seo-preview-bar{font-size:10px;letter-spacing:.11em;text-transform:uppercase;font-weight:800;color:#698086;margin:2px 3px 13px}.seo-preview-window{height:420px;overflow:auto;background:#fff;border-radius:7px;border:1px solid #d8dfdc}.seo-preview-window>*{min-height:100%}
      .seo-list{list-style:none;margin:0;padding:0}.seo-list li{padding:10px 0;border-bottom:1px solid #e9ecea;font-size:12px;line-height:1.5;overflow-wrap:anywhere}.seo-list li:last-child{border:0}.seo-list small{color:var(--muted);font:700 10px ui-monospace,monospace;margin-right:10px}.seo-list a{color:#315f69;text-decoration:underline;text-underline-offset:2px}.seo-empty{font-size:12px;color:var(--muted);line-height:1.6;margin:0}.seo-link-list{max-height:240px;overflow:auto}
      .seo-code-panel{border:1px solid #344550;background:#17232c;border-radius:11px;overflow:hidden;margin-top:13px}.seo-code-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #344550;color:#d6e4e1;font-size:11px;font-weight:750}.seo-code-head span,.seo-code-head button{display:inline-flex;align-items:center;gap:7px}.seo-code-head button{background:#2a3c45;color:#e7f2ef;border:1px solid #45575e;border-radius:6px;padding:6px 8px;font-size:10px}.seo-code-head button:hover{background:#3c535b}.seo-code-panel pre{margin:0;padding:16px;max-height:300px;overflow:auto;color:#c9dcd6;font:11px/1.7 ui-monospace,SFMono-Regular,monospace;white-space:pre-wrap;overflow-wrap:anywhere}
      .seo-copy-row{display:flex;gap:8px;flex-wrap:wrap}.seo-stack{display:grid;gap:16px}.seo-toast{position:absolute;bottom:20px;right:23px;background:#1b343b;color:#fff;padding:11px 16px;border-radius:9px;font-size:12px;box-shadow:0 12px 30px #0e1e2340;z-index:2}
      .seo-difference{background:#fbe9e8;color:#a23d3c}.seo-preview-bar{display:flex;justify-content:space-between;align-items:center;gap:12px}.seo-preview-bar button{background:#fffefa;border:1px solid #cad7d4;border-radius:6px;padding:5px 9px;color:#31565d;font-size:10px;font-weight:750}.seo-preview-window{height:520px;margin:auto;position:relative;contain:layout paint;overscroll-behavior:contain}.seo-preview-window.mobile{max-width:390px}.seo-preview-window .fixed{position:absolute!important}.seo-preview-window :where([style*="position: fixed"],[style*="position:fixed"]){position:absolute!important}
      .seo-preview-window{container-type:inline-size;container-name:seoprev}.seo-preview-window *{min-width:0;box-sizing:border-box}.seo-preview-window h1,.seo-preview-window h2,.seo-preview-window h3,.seo-preview-window p,.seo-preview-window li,.seo-preview-window a{overflow-wrap:break-word;word-break:normal}.seo-preview-window img,.seo-preview-window video,.seo-preview-window iframe{max-width:100%;height:auto}.seo-preview-window .article-body{overflow-x:auto}.seo-preview-window aside[aria-label="Talk to GrowitBuddy"]{display:none!important}
      @container seoprev (max-width:640px){.article-body p,.article-body li{font-size:16px;line-height:1.72}.article-body h1{font-size:26px;line-height:1.15}.article-body h2{font-size:21px;line-height:1.25}.article-body h3{font-size:17px}.article-body table{display:block;overflow-x:auto;font-size:14px}.article-body pre{font-size:13px;overflow-x:auto}.article-body .wp-block-columns{display:block}.article-body .alignleft,.article-body .alignright{float:none;margin:22px auto;max-width:100%}.gb-hero-img{padding:0!important}.seo-preview-window h1{font-size:clamp(26px,8cqw,34px)!important;line-height:1.12!important;letter-spacing:-.03em!important}}
      @media(max-width:850px){.seo-dialog{inset:0;border-radius:0}.seo-header{padding:12px 16px}.seo-shell{display:flex;flex-direction:column}.seo-side{flex:none;flex-direction:row;overflow:auto;padding:7px 11px;border-right:0;border-bottom:1px solid var(--line)}.seo-side-label,.seo-side-foot{display:none}.seo-nav{padding:9px 12px;font-size:11px}.seo-content{padding:27px 17px 65px}.seo-grid{grid-template-columns:1fr}}
      @media(max-width:600px){.seo-brand-icon{width:32px;height:32px}.seo-brand strong{font-size:13px}.seo-brand small{font-size:8px}.seo-head-actions .seo-btn-text{display:none}.seo-head-actions{gap:5px}.seo-head-actions .seo-btn{padding:8px}.seo-head-actions .seo-icon-btn{width:32px;height:32px}.seo-stats{grid-template-columns:repeat(2,1fr)}.seo-hero{padding:20px;display:block}.seo-hero-symbol{display:inline-block;margin-top:16px}.seo-social-grid,.seo-facts,.seo-compare-grid{grid-template-columns:1fr}.seo-section{margin-bottom:52px}.seo-preview-window{height:350px}}
      @media(prefers-reduced-motion:reduce){.seo-room .seo-btn{transition:none}.seo-scroll{scroll-behavior:auto}}
    `}</style>
    <div className="seo-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="seo-dialog-title" aria-describedby="seo-dialog-description">
      <header className="seo-header">
        <div className="seo-brand"><div className="seo-brand-icon"><ShieldCheck size={19} /></div><div><small>GrowitBuddy / Editorial control room</small><strong id="seo-dialog-title">Pre-publish SEO review</strong></div></div>
        <div className="seo-head-actions">
          <button className="seo-btn" type="button" onClick={() => copy(report, "Full report")} title="Copy full Markdown report"><Clipboard size={14} /><span className="seo-btn-text">Copy report</span></button>
          <button className="seo-btn seo-btn-primary" type="button" onClick={downloadReport} title="Download Markdown report"><ArrowDownToLine size={14} /><span className="seo-btn-text">Download report</span></button>
          <button ref={closeRef} className="seo-btn seo-icon-btn" type="button" onClick={onClose} aria-label="Close SEO review"><X size={18} /></button>
        </div>
      </header>
      <div className="seo-shell">
        <nav className="seo-side" aria-label="SEO review sections">
          <span className="seo-side-label">Inspection map</span>
          {sections.map((section) => <button key={section.id} type="button" className={`seo-nav ${active === section.id ? "active" : ""}`} aria-current={active === section.id ? "location" : undefined} onClick={() => navigate(section.id)}><span>{section.number}</span>{section.label}</button>)}
          <p className="seo-side-foot">A pre-flight review of generated output. This panel makes no live network requests.</p>
        </nav>
        <main className="seo-scroll">
          <div className="seo-content">
            <section id="seo-overview" className="seo-section">
              <SectionHeading index="01" eyebrow="Decision desk" title="Know what is ready." description="Technical readiness, not a ranking score. Critical errors require attention; warnings deserve an editorial decision." />
              <div className={`seo-hero ${readiness.toLowerCase()}`}>
                <div><span className="seo-hero-label">Pre-publish assessment</span><h3>{readiness === "PASS" ? "Ready for review" : readiness === "ERROR" ? "Fix before publishing" : "Review recommended"}</h3><p id="seo-dialog-description">{readiness === "ERROR" ? "Required SEO fields or structured data need correction." : readiness === "WARNING" ? "The generated output is structurally usable, with items worth checking." : "No issues found in the checks available to this local audit."} {currentlyPublished ? "A published version exists; this report may reflect unsaved changes." : "Not live yet; this is projected after-publish output."}</p></div>
                <span className="seo-hero-symbol">{readiness}</span>
              </div>
              <div className="seo-stats">
                <div className="seo-stat"><strong style={{ color: "#a84e47" }}>{audit.criticalErrors.length}</strong><span>Critical errors</span></div>
                <div className="seo-stat"><strong style={{ color: "#a47a37" }}>{warnings.length}</strong><span>Warnings</span></div>
                <div className="seo-stat"><strong style={{ color: "#477f66" }}>{passes.length}</strong><span>Passing checks</span></div>
                <div className="seo-stat"><strong>{audit.wordCount.toLocaleString()}</strong><span>Body words parsed</span></div>
              </div>
              <div className="seo-grid">
                <div className="seo-panel">
                  <div className="seo-panel-head"><h3>Attention queue</h3><button className="seo-link-button" type="button" onClick={() => setShowAllChecks(!showAllChecks)}>{showAllChecks ? "Show issues only" : "Show all checks"} <ChevronRight size={13} /></button></div>
                  <div className="seo-panel-body">{(showAllChecks ? audit.checks : [...errors, ...warnings]).length ? (showAllChecks ? audit.checks : [...errors, ...warnings]).map((check) => <div className={`seo-check ${check.level}`} key={check.key}><span className="seo-check-icon"><StatusMark level={check.level} /></span><div><strong>{check.label}</strong><p>{check.detail}</p></div></div>) : <p className="seo-empty">No errors or warnings in the available static checks. Use “Show all checks” to inspect every result.</p>}</div>
                </div>
                <div className="seo-panel">
                  <div className="seo-panel-head"><h3>Delivery conditions</h3><Globe2 size={16} color="#6b7f87" /></div>
                  <div className="seo-panel-body">
                    <dl className="seo-facts" style={{ display: "block" }}>
                      <Fact label="Live publication" value={liveLabel} note={currentlyPublished ? "Existing live HTTP response was not fetched." : "A draft cannot be presented as an HTTP 200 page."} />
                      <Fact label="Post status" value={post.status || "Not specified"} />
                      <Fact label="CMS availability" value={pageMode ? (post.visibility === "private" ? "Private (not rendered)" : "Public after publish") : "Public after publish"} note={pageMode ? "Pages persist the Visibility selector; private pages are never rendered publicly." : "The sidebar visibility selector is not persisted for CMS posts; no private-post behavior is assumed."} />
                      <Fact label="Anonymous access" value="Not tested" note="No public HTTP request was attempted." />
                      <Fact label="Global indexing switch" value={globalIndexable ? "On" : "Off"} />
                    </dl>
                  </div>
                </div>
              </div>
              <div className="seo-callout"><strong>What this report can and cannot establish</strong>It inspects the production-derived SEO output and saved article content. It does not check the live URL, robots.txt response, image or link HTTP status, Search Console indexing, or Google's eventual search result.</div>
            </section>

            <section id="seo-appearance" className="seo-section">
              <SectionHeading index="02" eyebrow="Appearance" title="How the page may appear." description="These previews use the resolved production fields. Search engines and social platforms control their own display and caching." />
              <div className="seo-grid">
                <div>
                  <div className="seo-panel-head" style={{ paddingLeft: 0, border: 0 }}><h3><Search size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: 7 }} /> Google search appearance</h3></div>
                  <div className="seo-search-card"><p className="seo-search-url">{output.url}</p><h3 className="seo-search-title">{output.title || "No title generated"}</h3><p className="seo-search-description">{output.description || "No description generated."}</p></div>
                  <p className="seo-card-caption">Illustrative only. Google may rewrite the title or snippet, display a different URL treatment, or choose not to index this page.</p>
                </div>
                <div className="seo-panel"><div className="seo-panel-head"><h3>Resolved metadata</h3></div><div className="seo-panel-body"><dl className="seo-facts" style={{ display: "block" }}><Fact label="Title" value={output.title} /><Fact label="Description" value={output.description || "Not set"} /><Fact label="Canonical" value={output.canonical} mono /><Fact label="Robots" value={output.robots} mono /></dl></div></div>
              </div>
              <div style={{ marginTop: 30 }}><span className="seo-eyebrow" style={{ marginBottom: 13 }}>Social cards / generated tags</span>
                <div className="seo-social-grid">
                  <div className="seo-social"><div className="seo-social-image">{output.og.image ? <img src={output.og.image} alt="" /> : <ImageIcon size={26} />}</div><div className="seo-social-copy"><small>Open Graph · {output.og.siteName} · {output.og.type}</small><strong>{output.og.title}</strong><p>{output.og.description}</p><p style={{ marginTop: 9 }}>{output.og.url}</p></div></div>
                  <div className="seo-social"><div className="seo-social-image">{output.twitter.image ? <img src={output.twitter.image} alt="" /> : <ImageIcon size={26} />}</div><div className="seo-social-copy"><small>Twitter / X · {output.twitter.card}</small><strong>{output.twitter.title}</strong><p>{output.twitter.description}</p><p style={{ marginTop: 9 }}>{output.twitter.url}</p></div></div>
                </div>
                <p className="seo-card-caption">Card images are shown from the generated URLs. Their availability and platform previews are not verified.</p>
              </div>
              <div className="seo-panel" style={{ marginTop: 25 }}><div className="seo-panel-head"><h3>Admin input → resolved output</h3><span className="seo-eyebrow">Fallbacks are visible here</span></div><div className="seo-panel-body">
                {comparisonRows.map((row) => <Compare key={row.label} {...row} />)}
              </div></div>
            </section>

            <section id="seo-article" className="seo-section">
              <SectionHeading index="03" eyebrow="The article" title="Inspect the actual page." description="The preview below is the supplied public React article renderer. The inventory is parsed from the saved CMS content, which may differ from renderer-added elements." />
              <div className="seo-article-preview"><div className="seo-preview-bar"><span>Public component preview · not a network-loaded page</span><button type="button" onClick={() => setPreviewMode(previewMode === "mobile" ? "wide" : "mobile")} aria-label={`Switch to ${previewMode === "mobile" ? "wide" : "mobile"} article preview`}>{previewMode === "mobile" ? "390px mobile · switch to wide" : "Wide · switch to mobile"}</button></div><div className={`seo-preview-window ${previewMode}`}>{articlePreview}</div></div>
              <div className="seo-grid" style={{ marginTop: 16 }}>
                <div className="seo-panel"><div className="seo-panel-head"><h3>Heading outline</h3><span className="seo-eyebrow">Page title + {audit.headings.length} body heading(s)</span></div><div className="seo-panel-body"><ol className="seo-list"><li><small>H1 / PAGE TITLE</small>{post.title || "(missing title)"}</li>{audit.headings.map((heading, index) => <li key={`${index}-${heading.text}`} style={{ paddingLeft: (heading.level - 1) * 15 }}><small>H{heading.level} / BODY</small>{heading.text || "(empty heading)"}</li>)}</ol>{!audit.headings.length && <p className="seo-empty">No H1–H3 headings found in saved article body.</p>}</div></div>
                <div className="seo-panel"><div className="seo-panel-head"><h3>Content inventory</h3></div><div className="seo-panel-body"><dl className="seo-facts" style={{ display: "block" }}><Fact label="Saved body" value={`${audit.wordCount.toLocaleString()} words`} /><Fact label="Body images" value={`${audit.images.length} total · ${imagesWithoutAlt} without alt`} /><Fact label="Focus phrase" value={post.seo?.focusKeyword || "Not set"} /><Fact label="Internal / external links" value={`${audit.internalLinks.length} / ${audit.externalLinks.length}`} /></dl><p className="seo-panel-note" style={{ marginTop: 14 }}>Image and link destinations were parsed, not requested. No broken-link claim is made.</p></div></div>
              </div>
              <div className="seo-grid" style={{ marginTop: 16 }}>
                {([true, false] as const).map((internal) => { const selectedLinks = internal ? audit.internalLinks : audit.externalLinks; return <div className="seo-panel" key={String(internal)}><div className="seo-panel-head"><h3><Link2 size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />{internal ? "Internal links" : "External links"}</h3><span className="seo-eyebrow">{selectedLinks.length} found</span></div><div className="seo-panel-body"><ul className="seo-list seo-link-list">{selectedLinks.length ? selectedLinks.map((link, index) => <li key={`${link.href}-${index}`}><strong>{link.text}</strong><br /><span className="seo-mono">{link.href}</span>{link.rel && <><br /><span className="seo-mono">rel="{link.rel}"</span></>}</li>) : <li className="seo-empty">No {internal ? "internal" : "external"} links in the saved body.</li>}</ul></div></div>; })}
              </div>
              <div className="seo-panel" style={{ marginTop: 16 }}><div className="seo-panel-head"><h3>Body image inventory</h3><span className="seo-eyebrow">{audit.images.length} found · URLs not fetched</span></div><div className="seo-panel-body">{audit.images.length ? <ul className="seo-list">{audit.images.map((image, index) => <li key={`${image.src}-${index}`}><span className="seo-mono">{image.src || "(missing src)"}</span><br /><strong>Alt: </strong>{image.alt || "(empty; could be decorative)"}</li>)}</ul> : <p className="seo-empty">No body images in the saved article. A featured image may still appear in the public renderer.</p>}</div></div>
            </section>

            <section id="seo-technical" className="seo-section">
              <SectionHeading index="04" eyebrow="Delivery" title="Indexing is conditional." description="The resolver describes what the site intends to emit. Crawlability and indexing require a published, publicly accessible response and search-engine decisions." />
              <div className="seo-grid">
                <div className="seo-panel"><div className="seo-panel-head"><h3>Indexing & crawlability</h3></div><div className="seo-panel-body"><dl className="seo-facts">
                  <Fact label="Generated URL" value={output.url} mono />
                  <Fact label="Current live state" value={liveLabel} note="Live HTTP response not inspected." />
                  <Fact label="Robots meta" value={output.robots} mono note={robotsBlocked ? "Generated noindex directive requests exclusion." : "Indexing permitted by this meta value, not guaranteed."} />
                  <Fact label="Canonical" value={output.canonical} mono />
                  <Fact label="robots.txt /blog" value="Expected allow rule" note="The /blog path is intended to be allowed; the deployed robots.txt file and its HTTP response were not fetched." />
                  <Fact label="Public access" value={currentlyPublished ? "Published version exists" : "Not live yet"} note="CMS posts become publicly available after publication; an anonymous live request was not made." />
                </dl></div></div>
                <div className="seo-stack">
                  <div className="seo-panel"><div className="seo-panel-head"><h3>Sitemap projection</h3></div><div className="seo-panel-body"><dl className="seo-facts" style={{ display: "block" }}><Fact label="Inclusion" value={sitemapIncluded ? "Included by production sitemap rule" : "Excluded by production sitemap rule"} note={output.sitemap.included !== sitemapIncluded ? "Resolver sitemap flag differs from the sitemap eligibility helper; investigate before publishing." : "Generated eligibility, not proof of a deployed sitemap entry."} /><Fact label="Sitemap endpoint" value={SITEMAP_ENDPOINT} mono note="Endpoint is known from site configuration; its live response was not requested." /><Fact label="Article <loc>" value={output.sitemap.url || "Not supplied"} mono /><Fact label="Last modified" value={output.sitemap.lastmod || "Not supplied"} mono /></dl></div></div>
                  <div className="seo-panel"><div className="seo-panel-head"><h3>Structured data</h3></div><div className="seo-panel-body"><dl className="seo-facts" style={{ display: "block" }}><Fact label="Selected type" value={post.seo?.schemaType || "Article (default)"} /><Fact label="Generated graph types" value={schemaTypes.join(", ") || "None"} /><Fact label="Graph nodes" value={output.jsonLd["@graph"].length} /></dl><p className="seo-panel-note" style={{ marginTop: 13 }}>Validated locally for schema.org context, graph shape, and node types. This is not Google's Rich Results Test.</p></div></div>
                </div>
              </div>
              <div className="seo-panel" style={{ marginTop: 16 }}><div className="seo-panel-head"><h3>Checks by discipline</h3></div><div className="seo-panel-body"><div className="seo-grid">{groups.map((group) => <div key={group}><span className="seo-eyebrow">{group}</span>{audit.checks.filter((check) => check.category === group).map((check) => <div className={`seo-check ${check.level}`} key={check.key}><span className="seo-check-icon"><StatusMark level={check.level} /></span><div><strong>{check.label}</strong><p>{check.detail}</p></div></div>)}</div>)}</div></div></div>
            </section>

            <section id="seo-source" className="seo-section">
              <SectionHeading index="05" eyebrow="Evidence" title="What search engines will receive." description="The exact generated SEO strings from the shared resolver are shown below. They are projected page output, not a captured live response." />
              <div className="seo-copy-row">
                <button className="seo-btn" type="button" onClick={() => copy(metaWithStatic, "Meta tags")}><FileCode2 size={14} /> Copy meta tags</button>
                <button className="seo-btn" type="button" onClick={() => copy(jsonLdText, "JSON-LD")}><Code2 size={14} /> Copy JSON-LD</button>
                <button className="seo-btn" type="button" onClick={() => copy(fullHtml, "Full HTML SEO data")}><Clipboard size={14} /> Copy full HTML SEO data</button>
              </div>
              <p className="seo-card-caption">Shared static tags below are read from the current document head and html element at runtime; generated article tags come from the shared SEO resolver. Runtime metadata may differ from the original template if another component has modified it.</p>
              <CodePanel label="Shared static template metadata / observed runtime" code={staticHeadHtml} onCopy={() => copy(staticHeadHtml, "Shared static metadata")} />
              <CodePanel label="Generated article head / metaTagsHtml" code={output.metaTagsHtml} onCopy={() => copy(metaWithStatic, "Meta tags")} />
              <CodePanel label="Generated JSON-LD / jsonLd" code={jsonLdText} onCopy={() => copy(jsonLdText, "JSON-LD")} />
              <CodePanel label="Crawler article body / crawlerBodyHtml" code={output.crawlerBodyHtml} onCopy={() => copy(output.crawlerBodyHtml, "Crawler body")} />
              <div className="seo-callout"><strong>Before calling this live</strong>Publish and request the public URL anonymously. Verify response status, canonical, robots meta, deployed robots.txt, rendered HTML, sitemap and structured data separately. This review does not perform those requests. <ExternalLink size={12} style={{ display: "inline", verticalAlign: "middle" }} /> Google can still choose not to index.</div>
            </section>
          </div>
        </main>
      </div>
      {notice && <div className="seo-toast" role="status"><Check size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />{notice}</div>}
    </div>
  </div>;
}