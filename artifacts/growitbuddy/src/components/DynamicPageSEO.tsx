/**
 * Mounted ONCE at app root. Watches location changes, fetches the admin-
 * managed SEO record for the current page (via public GET /api/seo/:slug),
 * and overrides every meta tag, canonical link, robots directive, and
 * JSON-LD script on the document.
 *
 * Falls back to PAGE_REGISTRY defaults when no admin override exists.
 * Runs AFTER any page-level <SEOMeta>, so admin values always win.
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

function setMeta(selector: string, keyAttr: string, keyVal: string, content: string) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(keyAttr, keyVal);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setOrRemoveSchema(json: string | undefined) {
  // Use the SAME script id ("gb-jsonld") that SEOMeta writes to, so admin
  // overrides REPLACE the page-level schema instead of coexisting with it.
  // Also defensively remove any legacy admin-id script in case of leftovers.
  const id = "gb-jsonld";
  document.getElementById("gb-admin-jsonld")?.remove();
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (!json || !json.trim()) {
    existing?.remove();
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
  } catch {
    // Invalid JSON — remove any previous so we don't ship broken markup
    existing?.remove();
  }
}

function applySEO(entry: PageRegistryEntry, seo: PageSEOData, pathname: string) {
  const title       = seo.title       ?? entry.defaults.title;
  const description = seo.description ?? entry.defaults.description;

  // Robots
  const indexDirective  = seo.index  === false ? "noindex" : "index";
  const followDirective = seo.follow === false ? "nofollow" : "follow";
  const robots = `${indexDirective},${followDirective}`;

  // Canonical
  const canonical = seo.canonical
    ? (seo.canonical.startsWith("http") ? seo.canonical : `${SITE}${seo.canonical}`)
    : `${SITE}${pathname}`;

  // OG image
  const ogImage = seo.ogImage
    ? (seo.ogImage.startsWith("http") ? seo.ogImage : `${SITE}${seo.ogImage}`)
    : DEFAULT_IMAGE;

  // Core
  document.title = title;
  setMeta('meta[name="description"]', "name", "description", description);
  setMeta('meta[name="robots"]',      "name", "robots",      robots);

  // Open Graph
  setMeta('meta[property="og:title"]',        "property", "og:title",        seo.ogTitle       ?? title);
  setMeta('meta[property="og:description"]',  "property", "og:description",  seo.ogDescription ?? description);
  setMeta('meta[property="og:url"]',          "property", "og:url",          canonical);
  setMeta('meta[property="og:type"]',         "property", "og:type",         seo.ogType ?? "website");
  setMeta('meta[property="og:image"]',        "property", "og:image",        ogImage);
  setMeta('meta[property="og:image:width"]',  "property", "og:image:width",  "1200");
  setMeta('meta[property="og:image:height"]', "property", "og:image:height", "630");
  setMeta('meta[property="og:site_name"]',    "property", "og:site_name",    SITE_NAME);

  // Twitter
  setMeta('meta[name="twitter:card"]',        "name", "twitter:card",        seo.twitterCard ?? "summary_large_image");
  setMeta('meta[name="twitter:title"]',       "name", "twitter:title",       seo.twitterTitle       ?? seo.ogTitle       ?? title);
  setMeta('meta[name="twitter:description"]', "name", "twitter:description", seo.twitterDescription ?? seo.ogDescription ?? description);
  setMeta('meta[name="twitter:image"]',       "name", "twitter:image",       (seo.twitterImage && (seo.twitterImage.startsWith("http") ? seo.twitterImage : `${SITE}${seo.twitterImage}`)) ?? ogImage);
  setMeta('meta[name="twitter:site"]',        "name", "twitter:site",        TWITTER_HANDLE);

  // Canonical link
  setLink("canonical", canonical);

  // JSON-LD (free-form, admin-edited)
  setOrRemoveSchema(seo.schema);
}

// In-memory cache so route changes don't re-fetch the same slug repeatedly
const cache = new Map<string, PageSEOData>();

export default function DynamicPageSEO() {
  const [location] = useLocation();

  useEffect(() => {
    const entry = findEntryByPath(location);
    if (!entry) return; // No registry match (admin / verify / etc) — leave whatever existing tags
    let cancelled = false;

    async function load() {
      const cached = cache.get(entry!.slug);
      if (cached) {
        applySEO(entry!, cached, location);
        return;
      }
      try {
        const r = await fetch(`${API_BASE}/seo/${encodeURIComponent(entry!.slug)}`, { cache: "no-cache" });
        if (!r.ok) {
          applySEO(entry!, {}, location);
          return;
        }
        const body = (await r.json()) as { data: PageSEOData | null };
        const seo: PageSEOData = body.data ?? {};
        cache.set(entry!.slug, seo);
        if (!cancelled) applySEO(entry!, seo, location);
      } catch {
        if (!cancelled) applySEO(entry!, {}, location);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [location]);

  return null;
}
