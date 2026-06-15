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
 * It reads live data by querying the Neon Postgres database DIRECTLY (the same
 * `site_content` table the admin API writes to), with a hard timeout and a total
 * fallback to @workspace/seo registry defaults + the plain shell. Reading the DB
 * directly is deliberate: the Render API is on a free tier that cold-starts for
 * 30-60s, so depending on it for first render meant a sleeping API could serve a
 * crawler the default meta. Neon's serverless HTTP driver has no cold start, so
 * the SSR head/content always reflect current admin values. It NEVER throws to
 * the client — every path returns HTTP 200 with valid HTML, so a DB outage can
 * never take the site down (it just falls back to registry defaults).
 *
 * @workspace/seo is the single source of truth for the page list + defaults.
 *
 * REQUIRES the Vercel env var NEON_DATABASE_URL (server-side, NOT VITE_-prefixed)
 * set to the same Neon connection string the API uses. Without it, loadData
 * returns registry defaults (no live admin content) but the site still works.
 */

import {
  findEntryByPath,
  SITE_URL,
  type PageRegistryEntry,
  type PageSEOData,
} from "@workspace/seo";
import { neon } from "@neondatabase/serverless";
// The built index.html (with hashed asset tags) is embedded at build time by
// scripts/postbuild-ssr.mjs as a generated, import-only module. esbuild bundles
// the string straight into this function — no runtime fs reads, no includeFiles.
import { TEMPLATE } from "./_template.js";
import { CONTENT_DEFAULTS } from "./contentDefaults";

// Server-side only. Same precedence as the API (lib/db): prefer the dedicated
// Neon URL, fall back to a generic DATABASE_URL if that is what Vercel holds.
const DB_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || "";

const SITE = SITE_URL; // https://growitbuddy.com
const SITE_NAME = "GrowitBuddy";
const DEFAULT_IMAGE = `${SITE}/opengraph.jpg`;
const TWITTER_HANDLE = "@growitbuddy";

// Most pages read their admin content from a section whose key === the registry
// slug, so loadData(entry.slug) already bootstraps them. These pages, however,
// read content from section key(s) that DIFFER from the slug (verified against
// every usePublicContent() call site in src/). Without bootstrapping these keys
// the page first-paints defaults and then swaps to live content (the "flash").
// Keep this in lockstep with the usePublicContent() keys used by each page.
const EXTRA_CONTENT_SECTIONS: Record<string, string[]> = {
  insights: ["blog"], // /blog (Insights.tsx)
  career: ["fulltime", "internship", "freelancers"], // /career (Career.tsx)
  distribution: ["distribution-network", "distribution-pages"], // /distribution
  influencers: ["influencer-explore"], // /influencers (InfluencerExplore.tsx)
  join: ["joinnetwork"], // /join (JoinNetwork.tsx)
  creators: ["creators-form"], // /creators (NetworkApplyForm type="influencer")
  "join-page-owner": ["page-owner-form"], // /join/page-owner (NetworkApplyForm type="page")
};

// Hard cap on how long we wait for the DB before falling back to defaults.
// Neon's HTTP driver is fast (no cold start), but we still bail rather than make
// a crawler wait if the DB is briefly unreachable; the CDN holds good HTML.
const DATA_TIMEOUT_MS = 2500;

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
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (NONCONTENT_KEY.test(k)) continue;
      collectBlocks(v, k, out, depth + 1);
    }
  }
}

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

function injectBody(html: string, bodyHtml: string): string {
  if (!bodyHtml) return html;
  const re = /<div id="root"[^>]*>\s*<\/div>/i;
  return re.test(html)
    ? html.replace(re, `<div id="root">${bodyHtml}</div>`)
    : html;
}

/* ───────────────────────────── data ───────────────────────────────── */
interface Bundle {
  seo: PageSEOData;
  globalIndexable: boolean;
  content: Record<string, unknown>;
  live: boolean;
}

const EMPTY_BUNDLE: Bundle = { seo: {}, globalIndexable: true, content: {}, live: false };

// Read all needed rows from Neon in ONE round-trip. The admin API writes content
// to `site_content` (section TEXT primary key, data JSONB): per-page SEO under
// `seo:<slug>`, the global indexable flag under `seo-global`, and each page's
// content under its section key. We query the very same table directly, so a
// sleeping Render API can never make a crawler see stale/default meta.
async function loadData(slug: string, sections: string[]): Promise<Bundle> {
  if (!DB_URL) return EMPTY_BUNDLE;

  const seoKey = `seo:${slug}`;
  const keys = Array.from(new Set([seoKey, "seo-global", ...sections]));

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DATA_TIMEOUT_MS);
  try {
    const sql = neon(DB_URL, { fetchOptions: { signal: ctrl.signal } });
    const rows = (await sql`
      SELECT section, data FROM site_content WHERE section = ANY(${keys})
    `) as Array<{ section: string; data: unknown }>;

    const bySection = new Map(rows.map((r) => [r.section, r.data]));

    const seoData = bySection.get(seoKey);
    const seo: PageSEOData =
      seoData && typeof seoData === "object" ? (seoData as PageSEOData) : {};

    const globalData = bySection.get("seo-global") as
      | { siteIndexable?: boolean }
      | undefined;
    const globalIndexable = !(globalData && globalData.siteIndexable === false);

    const content: Record<string, unknown> = {};
    for (const s of sections) {
      const d = bySection.get(s);
      if (d && typeof d === "object") content[s] = d;
    }

    // A successful query is authoritative current data — even if a given page has
    // no admin overrides (0 rows), registry defaults ARE the correct answer here,
    // so cache it hard. Only a DB failure/timeout yields live:false (short cache).
    return { seo, globalIndexable, content, live: true };
  } catch {
    return EMPTY_BUNDLE;
  } finally {
    clearTimeout(timer);
  }
}

/* ──────────────────────────── render ──────────────────────────────── */
function buildHtml(
  template: string,
  entry: PageRegistryEntry,
  pathname: string,
  b: Bundle,
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
  const bootstrap =
    `<script>` +
    `window.__GB_PUBLIC_CONTENT__=${safeJson(b.content)};` +
    `window.__GB_SEO__=${safeJson({
      slug: entry.slug,
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
  const bodySections = Array.from(
    new Set([entry.slug, ...(EXTRA_CONTENT_SECTIONS[entry.slug] || [])]),
  );
  const mergedContent: Record<string, unknown> = {};
  for (const sec of bodySections) {
    mergedContent[sec] = mergeForBody(CONTENT_DEFAULTS[sec], b.content[sec]);
  }
  const bodyHtml = renderContentBody(mergedContent, bodySections, title);
  return injectBody(html, bodyHtml);
}

function sendHtml(res: any, html: string, cacheControl: string): void {
  res.statusCode = 200;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", cacheControl);
  res.end(html);
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

    const entry = findEntryByPath(pathname);
    if (!entry) {
      // Unknown route: hand the plain shell to the SPA router. Short cache so a
      // mistaken miss isn't held long.
      sendHtml(res, template, "public, s-maxage=30, stale-while-revalidate=300");
      return;
    }

    // Bootstrap the page's own content section(s) plus shared globals. Most
    // pages key content by slug; some use different keys (EXTRA_CONTENT_SECTIONS).
    const sections = Array.from(
      new Set([
        entry.slug,
        ...(EXTRA_CONTENT_SECTIONS[entry.slug] || []),
        "navbar",
        "footer",
        "settings",
      ]),
    );
    const bundle = await loadData(entry.slug, sections);
    const html = buildHtml(template, entry, pathname, bundle);

    // Cache good (live) HTML hard at the edge with long stale-while-revalidate
    // so cold Render starts never reach a crawler twice. Cache fallback HTML
    // only briefly so admin values get picked up quickly once the API warms.
    sendHtml(
      res,
      html,
      bundle.live
        ? "public, s-maxage=60, stale-while-revalidate=86400"
        : "public, s-maxage=10, stale-while-revalidate=30",
    );
  } catch {
    // Last resort: serve the plain shell (still a working SPA), never a 500.
    sendHtml(res, template, "no-store");
  }
}
