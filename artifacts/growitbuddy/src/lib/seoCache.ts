/**
 * Client-side SEO cache shared by DynamicPageSEO.
 *
 * Why this exists: client-side navigation must apply the admin-managed SEO
 * SYNCHRONOUSLY (in useLayoutEffect), or the page briefly shows the registry
 * DEFAULT title/meta before the async /api/seo fetch resolves — i.e. the "old
 * value flashes, then the current one appears" bug the user reported.
 *
 * The cache only supplies the value painted on navigation; every navigation
 * still re-fetches with Cache-Control: no-store, so an admin edit shows on the
 * very next visit. prefetchAllSEO() warms the whole cache once at startup (one
 * bulk request) so even first-time navigations are flash-free.
 */
import type { PageSEOData } from "@/lib/pageRegistry";
import { API_BASE } from "@/lib/api";

const seoCache = new Map<string, PageSEOData>();
let globalIndexableCache: boolean | null = null;

/** SSR bootstrap injected for the initial page (matches by slug). */
export function readBootstrap(slug: string): { boot: PageSEOData; bootGlobal: boolean } {
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

/**
 * Best synchronously-available SEO for a slug, in priority order:
 * client cache (warmed by prefetch / a prior fetch) → SSR bootstrap → empty
 * (which makes applySEO fall back to registry defaults). This closes the
 * default→admin flash on client-side navigation.
 */
export function syncSeoFor(slug: string): { data: PageSEOData; global: boolean } {
  const { boot, bootGlobal } = readBootstrap(slug);
  return {
    data: seoCache.get(slug) ?? boot,
    global: globalIndexableCache ?? bootGlobal,
  };
}

export function cachedSEO(slug: string): PageSEOData | undefined {
  return seoCache.get(slug);
}

export function cachedGlobal(): boolean | null {
  return globalIndexableCache;
}

export function recordSEO(slug: string, data: PageSEOData): void {
  seoCache.set(slug, data);
}

export function recordGlobal(global: boolean): void {
  globalIndexableCache = global;
}

/**
 * Fetch every per-page SEO override + the global switch in ONE request and warm
 * the cache. Call once at app startup. Non-fatal on failure — the per-page
 * fetch still runs on each navigation.
 */
export async function prefetchAllSEO(): Promise<void> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(`${API_BASE}/seo?t=${Date.now()}`, {
      cache: "no-store",
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!r.ok) return;
    const body = (await r.json()) as {
      global?: { siteIndexable?: boolean };
      pages?: Record<string, PageSEOData | null>;
    };
    globalIndexableCache = body.global?.siteIndexable !== false;
    if (body.pages) {
      for (const [slug, data] of Object.entries(body.pages)) {
        if (data && typeof data === "object") seoCache.set(slug, data);
      }
    }
  } catch {
    /* non-fatal — per-page fetch on navigation still applies the latest SEO */
  }
}
