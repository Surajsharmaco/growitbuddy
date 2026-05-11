import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api";

// Session-level cache - persists for the lifetime of the tab
const cache = new Map<string, object>();
// Dedup: if a fetch for a section is already in-flight, reuse the same promise
const inFlight = new Map<string, Promise<object | null>>();

function fetchSection(section: string): Promise<object | null> {
  if (inFlight.has(section)) return inFlight.get(section)!;

  const req = fetch(`${API_BASE}/admin/public/content/${section}`)
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

export function usePublicContent<T extends object>(
  section: string,
  defaults: T,
): T {
  // Initialize from cache immediately - no flash on repeat visits or after prefetch
  const [data, setData] = useState<T>(() => {
    const cached = cache.get(section);
    return cached ? { ...defaults, ...(cached as Partial<T>) } : defaults;
  });

  useEffect(() => {
    // If already cached, still refresh silently in background to pick up any edits
    fetchSection(section).then((fresh) => {
      if (fresh) setData((prev) => ({ ...prev, ...(fresh as Partial<T>) }));
    });
  }, [section]);

  return data;
}
