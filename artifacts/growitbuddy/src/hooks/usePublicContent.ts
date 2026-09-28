import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import { useVariant } from "@/context/VariantContext";
import { variantContentKey } from "@/lib/variantSources";

type ContentRow = object | null;

const cache = new Map<string, ContentRow>();
const authoritative = new Set<string>();
const versions = new Map<string, number>();
const inFlight = new Map<string, Promise<void>>();
const latestRequestBySection = new Map<string, Promise<void>>();
const committedVersionBySection = new Map<string, number>();
const listeners = new Set<() => void>();
let initialBootstrapPath: string | null = null;
let bootstrapRouteChanged = false;

/**
 * SSR rows may be trusted only while the browser remains on its initial URL.
 * Keeping this route-scoped (rather than globally consuming bootstrap on the
 * first gate) allows nested shell/variant gates to share the same SSR snapshot.
 */
export function observeBootstrapRoute(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  if (initialBootstrapPath === null) initialBootstrapPath = path;
  else if (path !== initialBootstrapPath) bootstrapRouteChanged = true;
  return !bootstrapRouteChanged && path === initialBootstrapPath;
}

function publish() {
  listeners.forEach((listener) => listener());
}

function nextVersion(section: string): number {
  const value = (versions.get(section) ?? 0) + 1;
  versions.set(section, value);
  return value;
}

function seedBootstrap() {
  if (typeof window === "undefined") return;
  const bootWindow = window as Window & {
    __GB_CONTENT_SECTIONS__?: string[];
    __GB_PUBLIC_CONTENT__?: Record<string, unknown>;
  };
  const sections = bootWindow.__GB_CONTENT_SECTIONS__;
  const content = bootWindow.__GB_PUBLIC_CONTENT__;
  if (!Array.isArray(sections) || !content || typeof content !== "object") return;
  sections.forEach((section) => {
    if (!Object.prototype.hasOwnProperty.call(content, section)) return;
    const value = content[section];
    if (value === null || (value && typeof value === "object")) {
      cache.set(section, value as ContentRow);
      authoritative.add(section);
    }
  });
}

seedBootstrap();

export function isPublicContentAuthoritative(section: string): boolean {
  return authoritative.has(section);
}

export function isBootstrapContentAuthoritative(sections: string[]): boolean {
  if (!observeBootstrapRoute()) return false;
  return sections.every((section) => {
    const bootSections = typeof window === "undefined"
      ? []
      : (window as Window & { __GB_CONTENT_SECTIONS__?: string[] }).__GB_CONTENT_SECTIONS__ ?? [];
    return bootSections.includes(section) && authoritative.has(section);
  });
}

export function subscribePublicContent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Fetches any missing/invalidated sections through the bulk public endpoint.
 * Per-section generations ensure an older overlapping response can never
 * replace a newer result in the shared cache.
 */
export function ensurePublicContent(sections: string[], force = false): Promise<void> {
  const unique = [...new Set(sections)];
  const wanted = unique.filter((section) => force || !authoritative.has(section));
  if (!wanted.length) return Promise.resolve();
  const requestKey = wanted.slice().sort().join(",");
  if (!force) {
    const existing = inFlight.get(requestKey);
    if (existing) return existing;
  }

  const requestVersions = new Map(wanted.map((section) => [section, nextVersion(section)]));
  const request = fetch(
    `${API_BASE}/admin/public/content-bulk?sections=${encodeURIComponent(wanted.join(","))}&t=${Date.now()}`,
    { cache: "no-store" },
  )
    .then(async (response) => {
      if (!response.ok) throw new Error(`Content service returned HTTP ${response.status}`);
      const result = await response.json() as { data?: Record<string, unknown> };
      if (!result?.data || typeof result.data !== "object") {
        throw new Error("Content service returned an invalid response.");
      }
      for (const section of wanted) {
        if (!Object.prototype.hasOwnProperty.call(result.data, section)) {
          throw new Error(`Content service omitted the "${section}" section.`);
        }
        const value = result.data[section];
        if (!(value === null || (value && typeof value === "object"))) {
          throw new Error(`Content service returned invalid data for "${section}".`);
        }
      }
      wanted.forEach((section) => {
        if (versions.get(section) !== requestVersions.get(section)) return;
        cache.set(section, result.data![section] as ContentRow);
        authoritative.add(section);
        committedVersionBySection.set(section, requestVersions.get(section)!);
      });
      publish();

      // If a newer overlapping bulk request started while this request was in
      // flight, this response cannot make its gate ready by itself. Join the
      // newest section requests and only settle once they have committed (or
      // surface their failure), so an older gate cannot reveal stale shared UI.
      const superseded = wanted.filter(
        (section) => versions.get(section) !== requestVersions.get(section),
      );
      if (superseded.length) {
        const newest = [...new Set(
          superseded
            .map((section) => latestRequestBySection.get(section))
            .filter((pending): pending is Promise<void> => !!pending && pending !== request),
        )];
        await Promise.all(newest);
        const unresolved = superseded.filter(
          (section) => committedVersionBySection.get(section) !== versions.get(section),
        );
        if (unresolved.length) {
          throw new Error("A newer public content refresh did not complete successfully.");
        }
      }
    })
    .finally(() => {
      if (inFlight.get(requestKey) === request) inFlight.delete(requestKey);
    });
  inFlight.set(requestKey, request);
  wanted.forEach((section) => latestRequestBySection.set(section, request));
  return request;
}

// Admin pages use this localStorage signal after a save. The public route gate
// handles revalidation/withholding; this parser remains exported for callers.
const BROADCAST_KEY = "gb-content-updated";

export function parseBroadcast(value: string | null): string | null {
  if (!value) return null;
  const pipe = value.lastIndexOf("|");
  if (pipe !== -1) return value.slice(0, pipe);
  const match = value.match(/^(.+):\d+$/);
  return match ? match[1] : value;
}

export function broadcastContentUpdate(section: string): void {
  try {
    localStorage.setItem(BROADCAST_KEY, `${section}|${Date.now()}`);
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
}

function merged<T extends object>(section: string, defaults: T): T {
  if (!authoritative.has(section)) return defaults;
  const row = cache.get(section);
  return row && typeof row === "object" ? { ...defaults, ...(row as Partial<T>) } : defaults;
}

export function usePublicContent<T extends object>(section: string, defaults: T): T {
  const variant = useVariant();
  const effectiveSection =
    variant && variant.sourceKey === section
      ? variantContentKey(variant.sourceKey, variant.slug)
      : section;
  const [, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    const update = () => { if (active) setRevision((revision) => revision + 1); };
    const unsubscribe = subscribePublicContent(update);
    if (!isPublicContentAuthoritative(effectiveSection)) {
      ensurePublicContent([effectiveSection]).catch(() => {
        // Public routes are held by ContentFreshnessGate and show its error UI.
      });
    }
    return () => {
      active = false;
      unsubscribe();
    };
  }, [effectiveSection]);

  return merged(effectiveSection, defaults);
}

/** Retained for legacy callers; now uses one bulk request instead of N requests. */
export function prefetchSections(sections: string[]): void {
  ensurePublicContent(sections).catch(() => undefined);
}
