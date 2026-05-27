import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api";
import { useVariant } from "@/context/VariantContext";
import { variantContentKey } from "@/lib/variantSources";

// Session-level cache - persists for the lifetime of the tab
const cache = new Map<string, object>();
// Dedup: if a fetch for a section is already in-flight, reuse the same promise
const inFlight = new Map<string, Promise<object | null>>();

// localStorage key used by the admin to signal "I just saved this section,
// public tabs should refetch". The value is `${section}|${timestamp}` —
// section may itself contain ":" (e.g. "seo:home"), so we use "|" as the
// separator to keep parsing unambiguous.
const BROADCAST_KEY = "gb-content-updated";

function parseBroadcast(value: string | null): string | null {
  if (!value) return null;
  // Support both old (":") and new ("|") separators; the timestamp is always
  // a numeric tail, so strip from the last separator that has a numeric tail.
  const pipe = value.lastIndexOf("|");
  if (pipe !== -1) return value.slice(0, pipe);
  // Legacy: strip trailing ":<digits>" if present, otherwise return as-is.
  const m = value.match(/^(.+):\d+$/);
  return m ? m[1] : value;
}

export { parseBroadcast };

// Per-section monotonic version counter — prevents an older in-flight fetch
// from overwriting newer data when refresh() is called multiple times.
const versionCounter = new Map<string, number>();
function nextVersion(section: string): number {
  const v = (versionCounter.get(section) ?? 0) + 1;
  versionCounter.set(section, v);
  return v;
}
function currentVersion(section: string): number {
  return versionCounter.get(section) ?? 0;
}

function fetchSection(section: string): Promise<object | null> {
  if (inFlight.has(section)) return inFlight.get(section)!;

  // Append a cache-busting query so intermediaries/browsers never serve stale.
  const req = fetch(`${API_BASE}/admin/public/content/${section}?t=${Date.now()}`, {
    cache: "no-store",
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((res) => {
      inFlight.delete(section);
      if (res?.data && typeof res.data === "object") {
        cache.set(section, res.data as object);
        return res.data as object;
      }
      return null;
    })
    .catch(() => {
      inFlight.delete(section);
      return null;
    });

  inFlight.set(section, req);
  return req;
}

// Call this once at app startup to warm the cache for all sections.
// Components that mount later will get data instantly from cache.
export function prefetchSections(sections: string[]): void {
  for (const section of sections) {
    if (!cache.has(section)) fetchSection(section);
  }
}

/**
 * Called by the admin app after a successful save. Bumps the BROADCAST_KEY
 * which fires a `storage` event in every other tab on the same browser —
 * public tabs listen and re-fetch the affected section so the user never
 * sees the old content lingering.
 */
export function broadcastContentUpdate(section: string): void {
  try {
    localStorage.setItem(BROADCAST_KEY, `${section}|${Date.now()}`);
  } catch {
    /* localStorage might be unavailable; non-fatal */
  }
}

function shallowEqual(a: object, b: object): boolean {
  if (a === b) return true;
  const ak = Object.keys(a as Record<string, unknown>);
  const bk = Object.keys(b as Record<string, unknown>);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if ((a as Record<string, unknown>)[k] !== (b as Record<string, unknown>)[k]) {
      // Fall back to JSON compare for nested objects/arrays so we don't
      // re-render (and flash) on referentially-different but equal payloads.
      try {
        if (
          JSON.stringify((a as Record<string, unknown>)[k]) !==
          JSON.stringify((b as Record<string, unknown>)[k])
        ) return false;
      } catch {
        return false;
      }
    }
  }
  return true;
}

export function usePublicContent<T extends object>(
  section: string,
  defaults: T,
): T {
  // When rendered inside a variant page (via VariantResolver), redirect the
  // fetch for the matching sourceKey to the namespaced variant key so each
  // variant can have its own content. Sections that don't match (e.g. shared
  // "navbar", "settings") still read from the base key.
  const variant = useVariant();
  const effectiveSection =
    variant && variant.sourceKey === section
      ? variantContentKey(variant.sourceKey, variant.slug)
      : section;

  // Initialize from cache immediately - no flash on repeat visits or after prefetch
  const [data, setData] = useState<T>(() => {
    const cached = cache.get(effectiveSection);
    return cached ? { ...defaults, ...(cached as Partial<T>) } : defaults;
  });

  useEffect(() => {
    let cancelled = false;

    function applyIfCurrent(myVersion: number, fresh: object | null) {
      if (cancelled || !fresh) return;
      // Guard against out-of-order responses: only apply if this is still
      // the latest version we've requested for this section.
      if (myVersion !== currentVersion(effectiveSection)) return;
      setData((prev) => {
        const next = { ...prev, ...(fresh as Partial<T>) } as T;
        // Skip the state update (and re-render) when nothing actually
        // changed — eliminates the visible "flash" on background refreshes.
        return shallowEqual(prev as object, next as object) ? prev : next;
      });
    }

    function refresh() {
      // Clear in-memory cache so we actually hit the network instead of
      // resolving with a stale value from the previous fetch.
      cache.delete(effectiveSection);
      inFlight.delete(effectiveSection);
      const myVersion = nextVersion(effectiveSection);
      fetchSection(effectiveSection).then((fresh) => applyIfCurrent(myVersion, fresh));
    }

    // Initial silent refresh on mount to pick up any admin edits made since
    // the cache was warmed.
    const initialVersion = nextVersion(effectiveSection);
    fetchSection(effectiveSection).then((fresh) => applyIfCurrent(initialVersion, fresh));

    // Cross-tab live update: when the admin saves, BROADCAST_KEY changes
    // and we re-fetch immediately so the public tab never shows stale data.
    function onStorage(e: StorageEvent) {
      if (e.key !== BROADCAST_KEY) return;
      const sec = parseBroadcast(e.newValue);
      if (sec === effectiveSection) refresh();
    }
    // When the tab regains focus, also re-validate — covers the case where
    // a user updates the admin in one window and switches back to the public
    // window in another browser session that wasn't open at save time.
    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [effectiveSection]);

  return data;
}
