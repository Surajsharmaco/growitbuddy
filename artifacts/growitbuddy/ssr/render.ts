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
 * It reads live data by calling the existing public API server-side, with a
 * hard timeout and a total fallback to @workspace/seo registry defaults +
 * the plain shell. It NEVER throws to the client — every path returns HTTP 200
 * with valid HTML, so a data/API outage can never take the site down.
 *
 * @workspace/seo is the single source of truth for the page list + defaults.
 */

import {
  findEntryByPath,
  SITE_URL,
  type PageRegistryEntry,
  type PageSEOData,
} from "@workspace/seo";
// The built index.html (with hashed asset tags) is embedded at build time by
// scripts/postbuild-ssr.mjs as a generated, import-only module. esbuild bundles
// the string straight into this function — no runtime fs reads, no includeFiles.
import { TEMPLATE } from "./_template.js";

const API_BASE =
  process.env.SSR_API_BASE?.replace(/\/$/, "") ||
  "https://growitbuddy-api.onrender.com/api";

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
};

// Hard cap on how long we wait for live data before falling back to defaults.
// Googlebot won't wait long, and a cold Render API can take 30-60s, so we
// bail fast and let the CDN + post-deploy priming hold good HTML.
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

/* ───────────────────────────── data ───────────────────────────────── */
async function fetchJson(url: string, signal: AbortSignal): Promise<any | null> {
  try {
    const r = await fetch(url, { signal, headers: { accept: "application/json" } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

interface Bundle {
  seo: PageSEOData;
  globalIndexable: boolean;
  content: Record<string, unknown>;
  live: boolean;
}

async function loadData(slug: string, sections: string[]): Promise<Bundle> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DATA_TIMEOUT_MS);
  try {
    const [seoRes, globalRes, ...contentRes] = await Promise.all([
      fetchJson(`${API_BASE}/seo/${encodeURIComponent(slug)}`, ctrl.signal),
      fetchJson(`${API_BASE}/admin/public/content/seo-global`, ctrl.signal),
      ...sections.map((s) =>
        fetchJson(`${API_BASE}/admin/public/content/${encodeURIComponent(s)}`, ctrl.signal),
      ),
    ]);

    const seo: PageSEOData = seoRes && seoRes.data ? (seoRes.data as PageSEOData) : {};
    const globalIndexable = !(
      globalRes &&
      globalRes.data &&
      (globalRes.data as { siteIndexable?: boolean }).siteIndexable === false
    );
    const content: Record<string, unknown> = {};
    sections.forEach((s, i) => {
      const d = contentRes[i];
      if (d && d.data && typeof d.data === "object") content[s] = d.data;
    });
    const live =
      seoRes !== null || globalRes !== null || contentRes.some((d) => d !== null);
    return { seo, globalIndexable, content, live };
  } catch {
    return { seo: {}, globalIndexable: true, content: {}, live: false };
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

  return html.replace(
    /<\/head>/i,
    `    ${bootstrap}\n    ${schemaScript}\n  </head>`,
  );
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
