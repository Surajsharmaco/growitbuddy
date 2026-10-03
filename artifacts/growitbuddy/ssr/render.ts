/**
 * Vercel Node serverless renderer for GrowitBuddy (a Vite client-only SPA).
 *
 * WHY THIS EXISTS
 * The app is a pure SPA: every URL used to serve the SAME static index.html,
 * whose <head> had ONE hard-coded default title/description/OG/canonical. Per-
 * page meta + content only appeared AFTER JavaScript called the (slow, cold-
 * starting) Render API. Googlebot indexed the static defaults, and real users
 * saw a 1-2s flash of default content.
 *
 * This function serves HTML at request time for public routes. It:
 *   1. Injects the correct per-page <title>, description, canonical, robots,
 *      OG/Twitter tags, and per-page JSON-LD into the head.
 *   2. Bootstraps the page's CURRENT content into window.__GB_PUBLIC_CONTENT__
 *      and the resolved SEO into window.__GB_SEO__, so the SPA's first paint
 *      (and Googlebot's JS render) use current data with NO network wait.
 *
 * It reads live data from the same site_content table written by the admin API,
 * either through a direct Neon connection or the public bulk Render API. Dynamic
 * HTML is never cached. If neither authoritative source is available, it returns
 * a no-store 503 shell with noindex so the client can retry instead of displaying
 * baked defaults as though they were fresh.
 *
 * @workspace/seo is the single source of truth for the page list + defaults.
 *
 * Vercel can use VITE_API_URL (the Render API base ending in /api) without a
 * database credential. NEON_DATABASE_URL / DATABASE_URL enables direct DB reads.
 */

import {
  findEntryByPath,
  SITE_URL,
  BLOG_PATH,
  buildSitemapXml,
  getSitemapPages,
  wrapUrlset,
  isBlogInSitemap,
  isPublicBlogPost,
  resolveBlogSeo,
  isCmsPageInSitemap,
  isPublicCmsPage,
  resolveCmsPageSeo,
  type BlogSeoPost,
  type CmsPageSeoPost,
  type PageRegistryEntry,
  type PageSEOData,
} from "@workspace/seo";
import { neon } from "@neondatabase/serverless";
// The built index.html (with hashed asset tags) is embedded at build time by
// scripts/postbuild-ssr.mjs as a generated, import-only module. esbuild bundles
// the string straight into this function — no runtime fs reads, no includeFiles.
import { TEMPLATE } from "./_template.js";
import { CONTENT_DEFAULTS } from "./contentDefaults";
import {
  sectionsForSlug,
  SHARED_CONTENT_SECTIONS,
} from "../src/lib/publicContentSections";
import { VARIANT_SOURCES } from "../src/lib/variantSources";
import { sanitizePublicContent } from "./publicContent";

// Server-side only. Prefer a dedicated Neon URL; the public API is used when
// direct database access is unavailable.
const DB_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || "";

const SITE = SITE_URL; // https://growitbuddy.com
const SITE_NAME = "GrowitBuddy";
const DEFAULT_IMAGE = `${SITE}/opengraph.jpg`;
const TWITTER_HANDLE = "@growitbuddy";
const WP_API = "https://blog.growitbuddy.com/wp-json/wp/v2";

// Bound both database and Render API waits. Dynamic responses are never cached,
// so a timeout must fail visibly rather than serving stale/default content.
const DATA_TIMEOUT_MS = 8000;
// Render's free tier can need several seconds to wake after inactivity. Keep
// API requests bounded, but don't turn ordinary cold starts into stale shells.
const PUBLIC_API_TIMEOUT_MS = 20_000;

/* ───────────────────────── escaping helpers ───────────────────────── */
function escAttr(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Safe JSON for inline <script> bodies: neutralize </script>, <!--, and the
// line/paragraph separators that break inline scripts.
function safeJson(value: unknown): string {
  return JSON.stringify(value ?? null)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/* ─────────────────────── head tag replacement ─────────────────────── */
function setTitle(html: string, title: string): string {
  const tag = `<title>${escAttr(title)}</title>`;
  if (/<title>[\s\S]*?<\/title>/i.test(html))
    return html.replace(/<title>[\s\S]*?<\/title>/i, tag);
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function setMeta(
  html: string,
  attr: "name" | "property",
  key: string,
  content: string,
): string {
  const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<meta\\s+${attr}=["']${safeKey}["'][^>]*>`, "i");
  const tag = `<meta ${attr}="${key}" content="${escAttr(content)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function setCanonical(html: string, href: string): string {
  const re = /<link\s+rel=["']canonical["'][^>]*>/i;
  const tag = `<link rel="canonical" href="${escAttr(href)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

/* ─────────────── server-rendered content body (for SEO) ───────────────
 * The SPA mounts with createRoot().render() (NOT hydrateRoot), so React
 * CLEARS #root and renders fresh on the client. That lets us safely place the
 * page's CURRENT text INSIDE #root: crawlers and no-JS requests see real,
 * route-specific content in the raw HTML source, and the client instantly
 * replaces it with the live React app (which itself first-paints from the
 * window.__GB_PUBLIC_CONTENT__ bootstrap, so users see no visible swap).
 *
 * Admin content is free-form JSONB that differs per page, so we render it
 * generically: walk the page's OWN section(s), keep human-readable strings
 * (dropping ids/urls/colours/sizes/tokens), and emit them as <h1>/<h2>/<p>. */

// String VALUES that are structural/asset data, never human-readable copy.
function isNoiseValue(s: string): boolean {
  const t = s.trim();
  if (t.length < 2) return true;
  if (/^https?:\/\//i.test(t)) return true; // absolute URL
  if (/^data:/i.test(t)) return true; // data URI
  if (/^#[0-9a-fA-F]{3,8}$/.test(t)) return true; // hex colour
  if (/^(rgb|rgba|hsl|hsla)\(/i.test(t)) return true; // css colour fn
  if (/^-?\d+(\.\d+)?(px|rem|em|vh|vw|%|s|ms)?$/i.test(t)) return true; // number/unit
  if (/^(true|false|null|undefined)$/i.test(t)) return true;
  // asset path / filename with a media extension and no spaces
  if (/\.(png|jpe?g|svg|webp|gif|avif|ico|mp4|webm|pdf)(\?|#|$)/i.test(t) && !/\s/.test(t))
    return true;
  // a single slug/token with no spaces, e.g. "hero-1", "primary_cta"
  if (/^[a-z0-9]+(?:[-_][a-z0-9]+)+$/i.test(t)) return true;
  return false;
}

// KEYS whose values are structural/asset data (skipped regardless of value).
const NONCONTENT_KEY =
  /^(_?id|key|slug|type|kind|variant|order|index|sort|position|icon|iconname|color|colour|bg|background|gradient|fill|stroke|classname|class|style|theme|href|link|to|url|src|image|img|imageurl|imagesrc|photo|avatar|logo|cover|banner|thumbnail|video|media|poster|file|filename|alt|width|height|size|align|valign|duration|delay|speed|ratio|aspect|tabid|anchor|hash|target|rel|format|mime|ext|hex|rgb|rgba|hsl)$/i;

// KEYS that mark a value as a heading rather than body copy.
const HEADING_KEY = /(title|heading|headline|header|question)/i;

interface ContentBlock {
  tag: "h2" | "p";
  text: string;
}

function collectBlocks(
  value: unknown,
  keyHint: string,
  out: ContentBlock[],
  depth: number,
): void {
  if (depth > 8 || out.length >= 400) return;
  if (typeof value === "string") {
    if (isNoiseValue(value)) return;
    out.push({ tag: HEADING_KEY.test(keyHint) ? "h2" : "p", text: value.trim() });
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectBlocks(item, keyHint, out, depth + 1);
    return;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // Skip trashed / draft / hidden entries entirely so soft-deleted, unpublished
    // (status==="draft") or hidden (profileEnabled===false) items never leak into
    // the server-rendered crawler markup (mirrors the public-site filters).
    if (obj.trashed === true || obj.status === "draft" || obj.profileEnabled === false)
      return;
    for (const [k, v] of Object.entries(obj)) {
      if (NONCONTENT_KEY.test(k)) continue;
      collectBlocks(v, k, out, depth + 1);
    }
  }
}

// Strip soft-deleted (trashed), unpublished (blog status!=="published") and hidden
// (profileEnabled===false) entries from the public content BEFORE it is both
// bootstrapped into the page (window.__GB_PUBLIC_CONTENT__) and rendered into the
// SEO body. Without this, the raw HTML SOURCE / no-JS view / JSON bootstrap would
// still expose content the React app hides. Mirrors the public-site filters
// exactly (Insights, DistributionNetwork, InfluencerExplore).
// Build the visible content markup placed inside #root for crawlers/no-JS.
function renderContentBody(
  content: Record<string, unknown>,
  sections: string[],
  h1: string,
): string {
  const blocks: ContentBlock[] = [];
  for (const sec of sections) {
    const data = content[sec];
    if (data && typeof data === "object") collectBlocks(data, sec, blocks, 0);
  }

  const seen = new Set<string>();
  const parts: string[] = [];
  const h1Text = (h1 || "").trim();
  if (h1Text) {
    parts.push(`<h1>${escAttr(h1Text)}</h1>`);
    seen.add(h1Text.toLowerCase());
  }
  for (const b of blocks) {
    const dedupe = b.text.toLowerCase();
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    parts.push(`<${b.tag}>${escAttr(b.text)}</${b.tag}>`);
    if (parts.length >= 300) break;
  }

  // Just the <h1> (no real body copy found) is not worth emitting.
  if (parts.length <= 1) return "";
  return parts.join("");
}

// True when a value carries no human-readable copy at all: null/empty string,
// empty array, or an object whose every value is itself empty (e.g. the blog
// section's admin override is `{"posts":[]}` — present but with no real content).
function isEmptyContent(v: unknown, depth = 0): boolean {
  // Past the cap, assume "not empty" so we keep the DB value rather than blank a
  // page; collectBlocks applies the same depth bound when it later walks it.
  if (depth > 8) return false;
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim().length === 0;
  if (Array.isArray(v)) return v.every((x) => isEmptyContent(x, depth + 1));
  if (typeof v === "object") {
    const vals = Object.values(v as Record<string, unknown>);
    return vals.length === 0 || vals.every((x) => isEmptyContent(x, depth + 1));
  }
  return false; // numbers/booleans are "content" enough to keep the DB value
}

// Merge a page's CODE defaults with its DB content the same way the client does
// (shallow {...defaults, ...db}) so default-only pages still render real copy and
// admin-edited pages render the CURRENT content. When the DB value is empty (no
// row, or a content-free override like `{posts:[]}`) we fall back to the defaults;
// arrays/type mismatches otherwise prefer the live DB value.
function mergeForBody(def: unknown, db: unknown): unknown {
  if (isEmptyContent(db)) return def;
  if (
    def &&
    db &&
    typeof def === "object" &&
    typeof db === "object" &&
    !Array.isArray(def) &&
    !Array.isArray(db)
  ) {
    return { ...(def as object), ...(db as object) };
  }
  return db;
}

// The prerendered SEO body is for crawlers only — it is plain semantic markup
// (no app styles), and the client mounts with createRoot(), which CLEARS #root
// and re-renders from scratch. If this block were visible, the browser would
// paint the unstyled text for a beat before the styled app mounts (a FOUC). So
// wrap it in a visually-hidden (sr-only) container: still in the DOM for crawlers,
// invisible to users, and discarded by createRoot on mount. No flash, SEO intact.
const SEO_HIDE =
  "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);clip-path:inset(50%);white-space:nowrap;border:0";
function injectBody(html: string, bodyHtml: string): string {
  if (!bodyHtml) return html;
  const re = /<div id="root"[^>]*>\s*<\/div>/i;
  return re.test(html)
    ? html.replace(re, `<div id="root"><div data-ssr-seo style="${SEO_HIDE}">${bodyHtml}</div></div>`)
    : html;
}

function applyBlogSeo(html: string, metaTagsHtml: string): string {
  const cleaned = html
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\b[^>]*>/gi, (tag) => {
      const name = /\bname=["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
      const property = /\bproperty=["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
      return name === "description" ||
        name === "robots" ||
        /^twitter:(card|title|description|image|url)$/.test(name ?? "") ||
        /^og:(title|description|url|type|image|site_name)$/.test(property ?? "")
        ? ""
        : tag;
    })
    .replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i, "")
    .replace(/<script\b(?=[^>]*\bid=["']gb-jsonld["'])[^>]*>[\s\S]*?<\/script>/i, "")
    .replace(/<script\b(?=[^>]*\bid=["']gb-blog-jsonld["'])[^>]*>[\s\S]*?<\/script>/i, "");
  return cleaned.replace(/<\/head>/i, `    ${metaTagsHtml}\n  </head>`);
}

function injectArticleBody(html: string, bodyHtml: string): string {
  return html.replace(
    /<div id="root"[^>]*>[\s\S]*?<\/div>/i,
    `<div id="root"><div data-ssr-seo style="${SEO_HIDE}">${bodyHtml}</div></div>`,
  );
}

/* ───────────────────────────── data ───────────────────────────────── */
interface Bundle {
  seo: PageSEOData;
  globalIndexable: boolean;
  content: Record<string, unknown>;
  contentSections: string[];
}

function buildBundle(
  slug: string,
  sections: string[],
  bySection: Map<string, unknown>,
): Bundle {
  const seoKey = `seo:${slug}`;
  const seoData = bySection.get(seoKey);
  const seo: PageSEOData =
    seoData && typeof seoData === "object" ? (seoData as PageSEOData) : {};
  const globalData = bySection.get("seo-global") as
    | { siteIndexable?: boolean }
    | undefined;
  const content: Record<string, unknown> = {};
  for (const section of sections) content[section] = bySection.get(section) ?? null;
  return {
    seo,
    globalIndexable: !(globalData && globalData.siteIndexable === false),
    content,
    contentSections: sections,
  };
}

async function loadFromPublicApi(
  slug: string,
  keys: string[],
  contentSections: string[],
): Promise<Bundle> {
  const apiBase = process.env.VITE_API_URL?.replace(/\/+$/, "");
  if (!apiBase) throw new Error("VITE_API_URL is not configured for SSR content");
  const response = await fetch(
    `${apiBase}/admin/public/content-bulk?sections=${encodeURIComponent(keys.join(","))}`,
    { cache: "no-store", signal: AbortSignal.timeout(PUBLIC_API_TIMEOUT_MS) },
  );
  if (!response.ok) throw new Error(`Public content API returned HTTP ${response.status}`);
  const payload = (await response.json()) as { data?: Record<string, unknown> };
  const responseData = payload.data;
  if (
    !responseData ||
    keys.some((key) => !Object.prototype.hasOwnProperty.call(responseData, key))
  ) {
    throw new Error("Public content API returned an incomplete section response");
  }
  return buildBundle(slug, contentSections, new Map(Object.entries(responseData)));
}

async function loadPublicSections(keys: string[]): Promise<Record<string, unknown>> {
  if (DB_URL) {
    try {
      return await loadDatabaseSections(keys);
    } catch {
      // A live API read remains a secondary source, never a default snapshot.
    }
  }
  const apiBase = process.env.VITE_API_URL?.replace(/\/+$/, "");
  if (!apiBase) throw new Error("VITE_API_URL is not configured for public content");
  const response = await fetch(
    `${apiBase}/admin/public/content-bulk?sections=${encodeURIComponent(keys.join(","))}`,
    { cache: "no-store", signal: AbortSignal.timeout(PUBLIC_API_TIMEOUT_MS) },
  );
  if (!response.ok) throw new Error(`Public content API returned HTTP ${response.status}`);
  const payload = (await response.json()) as { data?: Record<string, unknown> };
  if (!payload.data || keys.some((key) => !Object.prototype.hasOwnProperty.call(payload.data, key)))
    throw new Error("Public content API returned an incomplete section response");
  return payload.data;
}

// Missing rows are authoritative nulls, not failed reads. Parameterized queries
// fetch only the requested content/SEO sections; credentials never enter HTML.
async function loadDatabaseSections(keys: string[]): Promise<Record<string, unknown>> {
  const uniqueKeys = Array.from(new Set(keys));
  if (!uniqueKeys.length) return {};
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DATA_TIMEOUT_MS);
  try {
    const sql = neon(DB_URL, { fetchOptions: { signal: ctrl.signal } });
    const rows = (await sql`
      SELECT section, data FROM site_content WHERE section = ANY(${uniqueKeys})
    `) as Array<{ section: string; data: unknown }>;
    return Object.fromEntries([
      ...uniqueKeys.map((key) => [key, null] as const),
      ...rows.map((row) => [row.section, row.data] as const),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// Both HTML and sitemaps prefer the same live database, independent of a
// sleeping Render API. The existing public projection still applies at render.
async function loadData(slug: string, sections: string[]): Promise<Bundle> {
  const contentSections = Array.from(new Set(sections));
  const keys = Array.from(new Set([`seo:${slug}`, "seo-global", ...contentSections]));
  if (!DB_URL) return loadFromPublicApi(slug, keys, contentSections);
  const data = await loadPublicSections(keys);
  return buildBundle(slug, contentSections, new Map(Object.entries(data)));
}
/* ──────────────────────────── render ──────────────────────────────── */
function buildHtml(
  template: string,
  entry: PageRegistryEntry,
  pathname: string,
  b: Bundle,
  options: {
    seoSlug?: string;
    bodySections?: string[];
    bodyDefaultsKey?: string;
  } = {},
): string {
  const seo = b.seo;
  const title = seo.title ?? entry.defaults.title;
  const description = seo.description ?? entry.defaults.description;

  const indexResolved = b.globalIndexable
    ? seo.index ?? entry.defaults.index ?? true
    : false;
  const followResolved = b.globalIndexable ? seo.follow ?? true : false;
  const robots = `${indexResolved ? "index" : "noindex"},${followResolved ? "follow" : "nofollow"}`;

  const canonical = seo.canonical
    ? seo.canonical.startsWith("http")
      ? seo.canonical
      : `${SITE}${seo.canonical}`
    : `${SITE}${pathname}`;

  const ogImage = seo.ogImage
    ? seo.ogImage.startsWith("http")
      ? seo.ogImage
      : `${SITE}${seo.ogImage}`
    : DEFAULT_IMAGE;

  const ogTitle = seo.ogTitle ?? title;
  const ogDescription = seo.ogDescription ?? description;
  const twitterImage = seo.twitterImage
    ? seo.twitterImage.startsWith("http")
      ? seo.twitterImage
      : `${SITE}${seo.twitterImage}`
    : ogImage;

  let html = template;
  html = setTitle(html, title);
  html = setMeta(html, "name", "description", description);
  html = setMeta(html, "name", "robots", robots);
  html = setMeta(html, "property", "og:title", ogTitle);
  html = setMeta(html, "property", "og:description", ogDescription);
  html = setMeta(html, "property", "og:url", canonical);
  html = setMeta(html, "property", "og:type", seo.ogType ?? "website");
  html = setMeta(html, "property", "og:image", ogImage);
  html = setMeta(html, "property", "og:site_name", SITE_NAME);
  html = setMeta(html, "name", "twitter:card", seo.twitterCard ?? "summary_large_image");
  html = setMeta(html, "name", "twitter:title", seo.twitterTitle ?? ogTitle);
  html = setMeta(html, "name", "twitter:description", seo.twitterDescription ?? ogDescription);
  html = setMeta(html, "name", "twitter:image", twitterImage);
  html = setMeta(html, "name", "twitter:site", TWITTER_HANDLE);
  html = setCanonical(html, canonical);

  // Per-page JSON-LD (admin-authored raw JSON). Validate before injecting.
  let schemaScript = "";
  if (seo.schema && seo.schema.trim()) {
    try {
      const parsed = JSON.parse(seo.schema);
      schemaScript = `<script type="application/ld+json" id="gb-jsonld">${safeJson(parsed)}</script>`;
    } catch {
      /* invalid JSON -> skip rather than emit broken structured data */
    }
  }

  // Bootstrap current content + resolved SEO so the SPA renders correct data
  // on first paint (no flash) and crawlers' JS render needs no network wait.
  // Sanitize FIRST so trashed/draft/hidden items never reach the JSON bootstrap
  // or the SEO body (the React app filters them, but the raw source would not).
  const publicContent = sanitizePublicContent(b.content);
  const bootstrap =
    `<script>` +
    `window.__GB_PUBLIC_CONTENT__=${safeJson(publicContent)};` +
    `window.__GB_CONTENT_SECTIONS__=${safeJson(b.contentSections)};` +
    `window.__GB_SEO__=${safeJson({
      slug: options.seoSlug ?? entry.slug,
      path: pathname,
      data: seo,
      globalIndexable: b.globalIndexable,
    })};` +
    `</script>`;

  html = html.replace(
    /<\/head>/i,
    `    ${bootstrap}\n    ${schemaScript}\n  </head>`,
  );

  // Render the page's CURRENT content into #root so the raw HTML SOURCE (no JS)
  // shows real, route-specific text for crawlers. createRoot() replaces it on
  // the client. Only the page's OWN section(s) — not the shared navbar/footer —
  // so each route's body is genuinely distinct.
  const shared = new Set<string>(SHARED_CONTENT_SECTIONS);
  const bodySections =
    options.bodySections ??
    sectionsForSlug(entry.slug).filter((section) => !shared.has(section));
  const mergedContent: Record<string, unknown> = {};
  for (const sec of bodySections) {
    mergedContent[sec] = mergeForBody(
      CONTENT_DEFAULTS[options.bodyDefaultsKey ?? sec],
      publicContent[sec],
    );
  }
  const bodyHtml = renderContentBody(mergedContent, bodySections, title);
  return injectBody(html, bodyHtml);
}

function sendHtml(res: any, html: string, cacheControl: string, status = 200): void {
  res.statusCode = status;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", cacheControl);
  res.end(html);
}

function sendContentFailure(res: any, template: string): void {
  let shell = template.replace(
    /<div id="root"[^>]*>[\s\S]*?<\/div>/i,
    '<div id="root"></div>',
  );
  shell = setTitle(shell, "GrowitBuddy");
  shell = shell.replace(/<meta\s+name=["']description["'][^>]*>/i, "");
  shell = shell.replace(/<link\s+rel=["']canonical["'][^>]*>/i, "");
  shell = setMeta(shell, "name", "robots", "noindex,nofollow");
  res.setHeader("x-robots-tag", "noindex, nofollow");
  sendHtml(res, shell, "no-store", 503);
}

function sendXml(res: any, xml: string, cacheControl: string): void {
  res.statusCode = 200;
  res.setHeader("content-type", "application/xml; charset=utf-8");
  res.setHeader("cache-control", cacheControl);
  res.end(xml);
}

/* ─────────────────────────────── sitemaps ──────────────────────────────────
 * Served directly from THIS function (Neon-direct, no Render cold start) so the
 * sitemaps live on the primary domain and crawlers never wait on a sleeping API.
 * Logic mirrors artifacts/api-server/src/routes/sitemap.ts. An unavailable
 * authoritative policy/content source must fail, not publish default URLs. */
interface SEOFlags {
  index?: boolean;
  sitemap?: boolean;
}
interface WPPost {
  slug: string;
  date: string;
  modified: string;
}

// Main sitemap from the shared @workspace/seo registry, excluding pages the admin
// flagged noindex/no-sitemap (seo:<slug>) and honoring the seo-global kill switch.
async function buildMainSitemap(): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  const seoMap = new Map<string, SEOFlags>();
  const pages = getSitemapPages();
  const keys = ["seo-global", "cms-pages", ...pages.map((page) => `seo:${page.slug}`)];
  const data = await loadPublicSections(keys);
  const globalIndexable = (data["seo-global"] as { siteIndexable?: boolean } | null)?.siteIndexable !== false;
  const cms = sanitizePublicContent({ "cms-pages": data["cms-pages"] });
  const section = cms["cms-pages"] as { posts?: CmsPageSeoPost[] } | null;
  const cmsPages = Array.isArray(section?.posts) ? section.posts : [];
  for (const page of pages) {
    seoMap.set(page.slug, (data[`seo:${page.slug}`] as SEOFlags) ?? {});
  }

  if (!globalIndexable) return wrapUrlset([]);
  const registryXml = buildSitemapXml({
    lastmod: today,
    siteUrl: SITE,
    include: (page) => {
      const seo = seoMap.get(page.slug);
      return !(seo && (seo.index === false || seo.sitemap === false));
    },
  });
  const registryUrls = [...registryXml.matchAll(/  <url>[\s\S]*?<\/url>/g)].map((match) => match[0]);
  const cmsUrls = cmsPages.flatMap((page) => {
    if (!isCmsPageInSitemap(page, globalIndexable)) return [];
    const resolved = resolveCmsPageSeo(page, { globalIndexable });
    const loc = resolved.sitemap.url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const lastmod = resolved.sitemap.lastmod;
    return [`  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`];
  });
  return wrapUrlset([...registryUrls, ...cmsUrls]);
}

// Blog sitemap: WordPress posts (blog.growitbuddy.com) + CMS posts in the
// site_content "blog" section. CMS policy/content is required; WordPress is
// optional and must not cause known live CMS URLs to disappear.
async function buildBlogSitemap(): Promise<string> {
  const data = await loadPublicSections(["seo-global", "blog"]);
  const globalIndexable = (data["seo-global"] as { siteIndexable?: boolean } | null)?.siteIndexable !== false;
  const content = sanitizePublicContent({ blog: data.blog });
  const blog = content.blog as { posts?: BlogSeoPost[] } | null;
  const cmsPosts = Array.isArray(blog?.posts) ? blog.posts : [];
  if (!globalIndexable) return wrapUrlset([]);

  const urls: string[] = [];

  try {
    const wpRes = await fetch(
      `${WP_API}/posts?per_page=100&status=publish&_fields=slug,date,modified`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (wpRes.ok) {
      const wpPosts = (await wpRes.json()) as WPPost[];
      for (const post of wpPosts) {
        const lastmod =
          post.modified?.split("T")[0] ?? post.date?.split("T")[0] ?? "";
        urls.push(
          `  <url>\n    <loc>${SITE}${BLOG_PATH}/wp-${post.slug}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
        );
      }
    }
  } catch {
    /* WP unreachable — skip gracefully */
  }

  for (const post of cmsPosts) {
    if (!post.slug || !isBlogInSitemap(post, globalIndexable)) continue;
    const resolved = resolveBlogSeo(post, { globalIndexable });
    const lastmod = resolved.sitemap.lastmod;
    const escapedUrl = resolved.sitemap.url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    urls.push(
      `  <url>\n    <loc>${escapedUrl}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
    );
  }

  return wrapUrlset(urls);
}

/* ──────────────────────── legacy "gone" URLs ───────────────────────────────
 * growitbuddy.com previously hosted a Shopify-style store/template, and Google
 * still has those old e-commerce URLs indexed (e.g. /product/glasses-mockup,
 * /layouts/header-border-logo-center, /layouts). They never existed in this app
 * and are gone for good — but because the SPA shell answered HTTP 200 for every
 * unknown path (a "soft 404"), search engines never dropped them.
 *
 * These prefixes can NEVER collide with a real GrowitBuddy route: the blog is
 * `/blog` (singular), and no page lives under /product, /collections, /cart,
 * /layouts, /pages, etc. Matching paths get HTTP 410 Gone + a noindex robots
 * tag, the strongest signal for Google to purge them, while still serving the
 * styled SPA so a human who clicks an old link sees the normal not-found page. */
const LEGACY_GONE_PATHS: RegExp[] = [
  /^\/products?(?:\/|$)/i,
  /^\/collections?(?:\/|$)/i,
  /^\/cart(?:\/|$)/i,
  /^\/checkouts?(?:\/|$)/i,
  /^\/accounts?(?:\/|$)/i,
  /^\/orders?(?:\/|$)/i,
  /^\/pages(?:\/|$)/i,
  /^\/policies(?:\/|$)/i,
  /^\/apps(?:\/|$)/i,
  /^\/layouts?(?:\/|$)/i,
  /^\/blogs(?:\/|$)/i,
];

function isLegacyGone(pathname: string): boolean {
  return LEGACY_GONE_PATHS.some((re) => re.test(pathname));
}

/* ──────────────────── legacy client-redirect paths ─────────────────────────
 * The SPA redirects these old URLs to their canonical home client-side. Doing
 * the redirect server-side as a 301 is strictly better for SEO: a crawler gets
 * the canonical target immediately instead of a 200 "soft duplicate" that only
 * redirects after JavaScript runs. Returns the destination PATH (or null). */
function legacyRedirect(pathname: string): string | null {
  if (pathname === "/insights") return BLOG_PATH;
  const ins = pathname.match(/^\/insights\/(.+)$/);
  if (ins) return `${BLOG_PATH}/${ins[1]}`;
  if (pathname === "/freelancers") return "/career?type=freelancer";
  if (pathname === "/full-time") return "/career?type=full-time";
  if (pathname === "/internship") return "/career?type=internship";
  if (pathname === "/portfolio-private") return "/portfolio";
  const pp = pathname.match(/^\/portfolio-private\/(.+)$/);
  if (pp) return `/portfolio/${pp[1]}`;
  return null;
}

// Valid single-segment slug shape (mirrors the admin isSafeSlug guard). Anything
// that isn't this shape cannot be a registry page or a live page variant.
function isSafeSlug(s: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(s);
}

// App routes that legitimately have NO registry entry and must never 404: the
// password-gated portfolio sub-tree and the admin SPA (both already noindex).
function isKnownNonRegistryRoute(pathname: string): boolean {
  return (
    pathname === "/portfolio" || pathname.startsWith("/portfolio/") ||
    pathname === "/admin" || pathname.startsWith("/admin/")
  );
}

/* ───────────────────── live page-variant resolution ─────────────────────── */
interface LiveVariant {
  slug: string;
  sourceKey: string;
  label: string;
}

async function getVariantFromPublicApi(slug: string): Promise<LiveVariant | null> {
  const apiBase = process.env.VITE_API_URL?.replace(/\/+$/, "");
  if (!apiBase) throw new Error("VITE_API_URL is not configured for variant resolution");
  const response = await fetch(`${apiBase}/admin/public/variants`, {
    cache: "no-store",
    signal: AbortSignal.timeout(PUBLIC_API_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Public variants API returned HTTP ${response.status}`);
  const rows = (await response.json()) as unknown;
  if (!Array.isArray(rows)) throw new Error("Public variants API returned an invalid response");
  if (
    rows.some(
      (row) =>
        !row ||
        typeof row !== "object" ||
        typeof (row as LiveVariant).slug !== "string" ||
        typeof (row as LiveVariant).sourceKey !== "string" ||
        typeof (row as LiveVariant).label !== "string",
    )
  ) {
    throw new Error("Public variants API returned malformed variant records");
  }
  return (rows as LiveVariant[]).find((row) =>
    row.slug === slug && VARIANT_SOURCES.some((source) => source.key === row.sourceKey),
  ) ?? null;
}

// Null means the authoritative source confirmed this slug is not a live variant.
// A DB/API error throws so callers return a 503 rather than a misleading 404 shell.
async function resolveLiveVariant(slug: string): Promise<LiveVariant | null> {
  if (!DB_URL) return getVariantFromPublicApi(slug);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DATA_TIMEOUT_MS);
  try {
    const sql = neon(DB_URL, { fetchOptions: { signal: ctrl.signal } });
    const rows = (await sql`
      SELECT slug, source_key AS "sourceKey", label
      FROM page_variants
      WHERE slug = ${slug} AND is_live = true
      LIMIT 1
    `) as LiveVariant[];
    const variant = rows[0];
    if (!variant) return null;
    if (
      typeof variant.slug !== "string" ||
      typeof variant.sourceKey !== "string" ||
      typeof variant.label !== "string"
    ) {
      throw new Error("Database returned malformed variant metadata");
    }
    if (!VARIANT_SOURCES.some((source) => source.key === variant.sourceKey)) return null;
    return variant;
  } catch {
    return getVariantFromPublicApi(slug);
  } finally {
    clearTimeout(timer);
  }
}

// Authoritative miss: HTTP 404 + noindex (header + meta), without caching so a
// newly created live variant is discoverable on the next request.
function send404(res: any, template: string): void {
  const html = setMeta(template, "name", "robots", "noindex,follow");
  res.setHeader("x-robots-tag", "noindex, follow");
  sendHtml(res, html, "no-store", 404);
}

/* ──────────────────────────── handler ─────────────────────────────── */
export default async function handler(req: any, res: any): Promise<void> {
  const template = TEMPLATE;

  // If the template is somehow missing, emit a minimal noindex shell rather
  // than a 500 (which would surface a broken page). Should never happen.
  if (!template) {
    sendHtml(
      res,
      "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex\"></head><body><div id=\"root\"></div></body></html>",
      "no-store",
    );
    return;
  }

  try {
    const host = (req.headers && req.headers.host) || "growitbuddy.com";
    const reqUrl = new URL(req.url || "/", `https://${host}`);
    // ?path= lets us test SSR before flipping routing (Phase 1 validation).
    const pathname = reqUrl.searchParams.get("path") || reqUrl.pathname || "/";

    // Same-domain sitemaps served straight from this function (Neon-direct), so
    // crawlers never depend on the cold-starting Render API. The static
    // public/sitemap.xml was removed so this route reaches the function (Vercel
    // serves filesystem assets before applying the catch-all rewrite).
    if (pathname === "/sitemap.xml") {
      const xml = await buildMainSitemap();
      sendXml(res, xml, "no-store");
      return;
    }
    if (pathname === "/sitemap-blog.xml") {
      const xml = await buildBlogSitemap();
      sendXml(res, xml, "no-store");
      return;
    }

    // Legacy e-commerce/template URLs left over from a previous site on this
    // domain: permanently gone. Answer 410 + noindex so Google deindexes them
    // (a 200 shell kept them indexed as soft 404s). Still serve the SPA shell so
    // a human who follows an old link sees the styled not-found page.
    if (isLegacyGone(pathname)) {
      const goneHtml = setMeta(template, "name", "robots", "noindex,follow");
      // X-Robots-Tag is read straight from the HTTP response (no JS render
      // needed), the most reliable deindex directive alongside the 410 status.
      res.setHeader("x-robots-tag", "noindex, follow");
      sendHtml(res, goneHtml, "public, max-age=3600, s-maxage=3600", 410);
      return;
    }

    // Legacy URLs the SPA only redirects client-side: answer with a real 301 to
    // the canonical target so crawlers never index the 200 soft-duplicate.
    const redirectTo = legacyRedirect(pathname);
    if (redirectTo) {
      res.statusCode = 301;
      res.setHeader("location", redirectTo.startsWith("http") ? redirectTo : `${SITE}${redirectTo}`);
      res.setHeader("cache-control", "public, max-age=3600, s-maxage=3600");
      res.end();
      return;
    }

    // CMS articles get a dedicated SSR path so every crawl-visible SEO field and
    // the semantic article body come from the shared @workspace/seo resolver.
    // WordPress slugs retain their existing read-only handler below.
    const blogMatch = pathname.match(/^\/blog\/([^/]+)$/);
    if (blogMatch && !blogMatch[1].startsWith("wp-")) {
      let slug: string;
      try { slug = decodeURIComponent(blogMatch[1]); } catch { send404(res, template); return; }
      const sections = sectionsForSlug("insights");
      const bundle = await loadData("insights", sections);
      const blog = bundle.content.blog as { posts?: BlogSeoPost[] } | null;
      const post = blog?.posts?.find((candidate) => candidate.slug === slug);
      if (!post || !isPublicBlogPost(post)) {
        send404(res, template);
        return;
      }
      const resolved = resolveBlogSeo(post, { globalIndexable: bundle.globalIndexable });
      const entry = findEntryByPath("/blog");
      if (!entry) throw new Error("Insights registry entry is missing");
      const page = buildHtml(template, entry, pathname, bundle, {
        bodySections: [],
        seoSlug: "insights",
      });
      let articleHtml = applyBlogSeo(page, resolved.metaTagsHtml);
      articleHtml = injectArticleBody(articleHtml, resolved.crawlerBodyHtml);
      if (resolved.robots.startsWith("noindex")) {
        res.setHeader("x-robots-tag", resolved.robots.replace(",", ", "));
      }
      sendHtml(res, articleHtml, "no-store");
      return;
    }

    const entry = findEntryByPath(pathname);
    if (!entry) {
      // Valid app routes with no registry entry (portfolio sub-tree, admin SPA):
      // serve the shell at 200 so the SPA renders them, but NEVER index them —
      // these are private/share URLs and admin screens. /portfolio/* is not even
      // covered by robots.txt, so emit an explicit noindex (meta + header).
      if (isKnownNonRegistryRoute(pathname)) {
        const shell = setMeta(template, "name", "robots", "noindex,follow");
        res.setHeader("x-robots-tag", "noindex, follow");
        sendHtml(res, shell, "public, s-maxage=30, stale-while-revalidate=300");
        return;
      }
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length === 1 && isSafeSlug(segments[0])) {
        const slug = segments[0];

        // CMS Pages own root-level slugs after exact registry routes have had
        // priority. Load their authoritative collection before checking legacy
        // page variants; a source failure becomes a noindex 503, never a soft 404.
        const cmsBundle = await loadData("cms-pages", ["cms-pages"]);
        const rawCmsSection = cmsBundle.content["cms-pages"] as { posts?: CmsPageSeoPost[] } | null;
        const reservedCmsSlug = rawCmsSection?.posts?.some((candidate) => candidate?.slug === slug) ?? false;
        const publicCmsContent = sanitizePublicContent(cmsBundle.content);
        const cmsSection = publicCmsContent["cms-pages"] as { posts?: CmsPageSeoPost[] } | null;
        const cmsPage = cmsSection?.posts?.find((candidate) => candidate.slug === slug);
        if (reservedCmsSlug && !cmsPage) {
          send404(res, template);
          return;
        }
        if (cmsPage && isPublicCmsPage(cmsPage)) {
          const resolved = resolveCmsPageSeo(cmsPage, { globalIndexable: cmsBundle.globalIndexable });
          const homeEntry = findEntryByPath("/");
          if (!homeEntry) throw new Error("Home registry entry is missing");
          const shell = buildHtml(template, homeEntry, pathname, cmsBundle, {
            bodySections: [],
            seoSlug: "cms-pages",
          });
          let cmsHtml = applyBlogSeo(shell, resolved.metaTagsHtml);
          cmsHtml = injectArticleBody(cmsHtml, resolved.crawlerBodyHtml);
          if (resolved.robots.startsWith("noindex")) {
            res.setHeader("x-robots-tag", resolved.robots.replace(",", ", "));
          }
          sendHtml(res, cmsHtml, "no-store");
          return;
        }

        // A single-segment /:slug may be a live Page Variant. The resolver
        // distinguishes an authoritative miss from a database/API failure.
        const variant = await resolveLiveVariant(slug);
        if (!variant) {
          send404(res, template);
          return;
        }

        const source = VARIANT_SOURCES.find((item) => item.key === variant.sourceKey);
        const sourceEntry = source ? findEntryByPath(source.basePath) : undefined;
        if (!source || !sourceEntry) {
          throw new Error(`No SSR source page registered for variant source "${variant.sourceKey}"`);
        }
        const variantSection = `${variant.sourceKey}__v__${variant.slug}`;
        const contentSections = [
          variantSection,
          ...SHARED_CONTENT_SECTIONS,
        ];
        const bundle = await loadData(variant.slug, contentSections);
        const html = buildHtml(template, sourceEntry, pathname, bundle, {
          seoSlug: variant.slug,
          bodySections: [variantSection],
          bodyDefaultsKey: variant.sourceKey,
        });
        sendHtml(res, html, "no-store");
        return;
      }
      // Anything else (unknown multi-segment path, malformed slug) matches no SPA
      // route → genuine 404 + noindex so it never becomes a soft 404.
      send404(res, template);
      return;
    }

    // Query this route's live sections plus shared chrome and visibility policy.
    const sections = sectionsForSlug(entry.slug);
    const bundle = await loadData(entry.slug, sections);
    const html = buildHtml(template, entry, pathname, bundle);

    sendHtml(res, html, "no-store");
  } catch {
    sendContentFailure(res, template);
  }
}
