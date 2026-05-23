/**
 * Mounted ONCE at app root. Watches location changes, fetches the admin-
 * managed SEO record for the current page (via public GET /api/seo/:slug),
 * and overrides every meta tag, canonical link, robots directive, and
 * JSON-LD script on the document.
 *
 * Falls back to PAGE_REGISTRY defaults when no admin override exists.
 *
 * IMPORTANT: every tag this component writes is stamped with
 * `data-gb-admin="1"`. Page-level <SEOMeta> checks for that flag and
 * refuses to overwrite — so admin overrides always win, even across
 * re-renders.
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { API_BASE } from "@/lib/api";
import {
  findEntryByPath,
  type PageRegistryEntry,
  type PageSEOData,
} from "@/lib/pageRegistry";

const SITE = "https://growitbuddy.com";
const SITE_NAME = "GrowitBuddy";
const DEFAULT_IMAGE = `${SITE}/opengraph.jpg`;
const TWITTER_HANDLE = "@growitbuddy";

/** Force-set a meta tag and stamp it so SEOMeta won't overwrite. */
function setMeta(selector: string, keyAttr: string, keyVal: string, content: string) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(keyAttr, keyVal);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  el.setAttribute("data-gb-admin", "1");
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  el.setAttribute("data-gb-admin", "1");
}

function setOrRemoveSchema(json: string | undefined) {
  const id = "gb-jsonld";
  document.getElementById("gb-admin-jsonld")?.remove();
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (!json || !json.trim()) {
    existing?.removeAttribute("data-gb-admin");
    return;
  }
  try {
    JSON.parse(json); // validate
    let el = existing;
    if (!el) {
      el = document.createElement("script");
      el.id = id;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    el.textContent = json;
    el.setAttribute("data-gb-admin", "1");
  } catch {
    existing?.remove();
  }
}

function applySEO(entry: PageRegistryEntry, seo: PageSEOData, pathname: string) {
  const title       = seo.title       ?? entry.defaults.title;
  const description = seo.description ?? entry.defaults.description;

  // Indexability — admin value > registry default > true
  const indexResolved  = seo.index  ?? entry.defaults.index  ?? true;
  const followResolved = seo.follow ?? true;
  const indexDirective  = indexResolved  ? "index"  : "noindex";
  const followDirective = followResolved ? "follow" : "nofollow";
  const robots = `${indexDirective},${followDirective}`;

  // Canonical
  const canonical = seo.canonical
    ? (seo.canonical.startsWith("http") ? seo.canonical : `${SITE}${seo.canonical}`)
    : `${SITE}${pathname}`;

  // OG image
  const ogImage = seo.ogImage
    ? (seo.ogImage.startsWith("http") ? seo.ogImage : `${SITE}${seo.ogImage}`)
    : DEFAULT_IMAGE;

  // Title (mark via attribute on <title> so SEOMeta can detect)
  document.title = title;
  document.querySelector("title")?.setAttribute("data-gb-admin", "1");

  setMeta('meta[name="description"]', "name", "description", description);
  setMeta('meta[name="robots"]',      "name", "robots",      robots);

  setMeta('meta[property="og:title"]',        "property", "og:title",        seo.ogTitle       ?? title);
  setMeta('meta[property="og:description"]',  "property", "og:description",  seo.ogDescription ?? description);
  setMeta('meta[property="og:url"]',          "property", "og:url",          canonical);
  setMeta('meta[property="og:type"]',         "property", "og:type",         seo.ogType ?? "website");
  setMeta('meta[property="og:image"]',        "property", "og:image",        ogImage);
  setMeta('meta[property="og:image:width"]',  "property", "og:image:width",  "1200");
  setMeta('meta[property="og:image:height"]', "property", "og:image:height", "630");
  setMeta('meta[property="og:site_name"]',    "property", "og:site_name",    SITE_NAME);

  setMeta('meta[name="twitter:card"]',        "name", "twitter:card",        seo.twitterCard ?? "summary_large_image");
  setMeta('meta[name="twitter:title"]',       "name", "twitter:title",       seo.twitterTitle       ?? seo.ogTitle       ?? title);
  setMeta('meta[name="twitter:description"]', "name", "twitter:description", seo.twitterDescription ?? seo.ogDescription ?? description);
  setMeta('meta[name="twitter:image"]',       "name", "twitter:image",       (seo.twitterImage && (seo.twitterImage.startsWith("http") ? seo.twitterImage : `${SITE}${seo.twitterImage}`)) ?? ogImage);
  setMeta('meta[name="twitter:site"]',        "name", "twitter:site",        TWITTER_HANDLE);

  setLink("canonical", canonical);

  setOrRemoveSchema(seo.schema);
}

/**
 * NO in-memory cache. The /api/seo/:slug response is small (~1 KB) and the
 * server now sets Cache-Control: no-store. This means: edit in admin →
 * navigate to the public page → see new SEO immediately. No staleness.
 *
 * Cross-tab live updates: when admin saves, it broadcasts via localStorage;
 * any open public tab on the same browser will re-apply on the next route
 * change (good enough for v1).
 */
export default function DynamicPageSEO() {
  const [location] = useLocation();

  useEffect(() => {
    const entry = findEntryByPath(location);
    if (!entry) return;
    let cancelled = false;

    async function load() {
      try {
        const r = await fetch(
          `${API_BASE}/seo/${encodeURIComponent(entry!.slug)}?t=${Date.now()}`,
          { cache: "no-store" },
        );
        if (!r.ok) {
          if (!cancelled) applySEO(entry!, {}, location);
          return;
        }
        const body = (await r.json()) as { data: PageSEOData | null };
        if (!cancelled) applySEO(entry!, body.data ?? {}, location);
      } catch {
        if (!cancelled) applySEO(entry!, {}, location);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [location]);

  return null;
}
