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

import { useEffect, useLayoutEffect } from "react";
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

function applySEO(entry: PageRegistryEntry, seo: PageSEOData, pathname: string, globalIndexable: boolean) {
  const title       = seo.title       ?? entry.defaults.title;
  const description = seo.description ?? entry.defaults.description;

  // Indexability — global master switch overrides everything when OFF.
  // Otherwise: admin per-page value > registry default > true.
  const indexResolved  = globalIndexable ? (seo.index  ?? entry.defaults.index  ?? true) : false;
  const followResolved = globalIndexable ? (seo.follow ?? true)                          : false;
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
// Per-component monotonic load id so an older in-flight SEO fetch can't
// overwrite a newer one (e.g. route change + broadcast firing in quick
// succession).
let loadId = 0;

function parseBroadcastSection(value: string | null): string | null {
  if (!value) return null;
  const pipe = value.lastIndexOf("|");
  if (pipe !== -1) return value.slice(0, pipe);
  const m = value.match(/^(.+):\d+$/);
  return m ? m[1] : value;
}

function readBootstrap(slug: string): { boot: PageSEOData; bootGlobal: boolean } {
  const w = window as unknown as {
    __GB_SEO__?: { slug?: string; data?: PageSEOData; globalIndexable?: boolean };
  };
  const bootSeo =
    typeof window !== "undefined" && w.__GB_SEO__ && w.__GB_SEO__.slug === slug
      ? w.__GB_SEO__
      : null;
  return {
    boot: bootSeo?.data ?? {},
    bootGlobal:
      bootSeo && typeof bootSeo.globalIndexable === "boolean" ? bootSeo.globalIndexable : true,
  };
}

export default function DynamicPageSEO() {
  const [location] = useLocation();

  // Synchronously lock the SSR-injected (bootstrap) SEO for this page BEFORE any
  // page-level <SEOMeta> passive effect runs. useLayoutEffect fires before
  // useEffect, and the bootstrap matches what the server already put in <head>,
  // so the correct <title> is stamped data-gb-admin first and <SEOMeta> yields —
  // closing the race that let a hardcoded client title flicker in and made Google
  // index an inconsistent desktop title.
  useLayoutEffect(() => {
    const entry = findEntryByPath(location);
    if (!entry) return;
    const { boot, bootGlobal } = readBootstrap(entry.slug);
    applySEO(entry, boot, location, bootGlobal);
  }, [location]);

  useEffect(() => {
    const entry = findEntryByPath(location);
    if (!entry) return;
    let cancelled = false;

    // Server-injected bootstrap for THIS page (written into the HTML by the
    // Vercel SSR renderer in api/render.ts). Used as the fallback base so a
    // failed client fetch can never downgrade correct server-rendered meta
    // back to bare registry defaults.
    const { boot, bootGlobal } = readBootstrap(entry.slug);

    async function loadGlobalIndexable(): Promise<boolean> {
      try {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 8000);
        const r = await fetch(
          `${API_BASE}/admin/public/content/seo-global?t=${Date.now()}`,
          { cache: "no-store", signal: ctrl.signal },
        );
        if (!r.ok) return bootGlobal;
        const body = (await r.json()) as { data: { siteIndexable?: boolean } | null };
        return body?.data?.siteIndexable !== false;
      } catch { return bootGlobal; }
    }

    async function load() {
      const myId = ++loadId;
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        const [r, globalIndexable] = await Promise.all([
          fetch(`${API_BASE}/seo/${encodeURIComponent(entry!.slug)}?t=${Date.now()}`, { cache: "no-store", signal: ctrl.signal }),
          loadGlobalIndexable(),
        ]);
        clearTimeout(timer);
        if (cancelled || myId !== loadId) return;
        if (!r.ok) { applySEO(entry!, boot, location, globalIndexable); return; }
        const body = (await r.json()) as { data: PageSEOData | null };
        if (cancelled || myId !== loadId) return;
        applySEO(entry!, body.data ?? boot, location, globalIndexable);
      } catch {
        if (!cancelled && myId === loadId) applySEO(entry!, boot, location, bootGlobal);
      }
    }

    load();

    // Cross-tab live update: when the admin saves SEO (sections are stored
    // under "seo:<slug>"), reload so the public tab reflects the change
    // without the user needing to refresh.
    function onStorage(e: StorageEvent) {
      if (e.key !== "gb-content-updated") return;
      const sec = parseBroadcastSection(e.newValue);
      if (!sec) return;
      // SEO sections have keys like "seo:home"; refresh when the SEO record
      // for the current page slug changes, or when the global master switch
      // ("seo-global") changes.
      if (sec === `seo:${entry!.slug}` || sec === "seo-global") load();
    }
    // Re-validate when the tab regains focus — covers the case where the
    // user edited in another window and switches back to the public tab.
    function onVisible() {
      if (document.visibilityState === "visible") load();
    }

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [location]);

  return null;
}
