import { useState, useEffect } from "react";
import {
  influencers as DEFAULT_INFLUENCERS,
  NICHE_CATEGORIES,
  COUNTRIES,
  type Influencer,
} from "@/data/influencers";

import { API_BASE } from "@/lib/api";

interface InfluencerCache {
  items: Influencer[];
  genres: string[];
  countries: string[];
}

// Seed the session cache from the SSR bootstrap (window.__GB_PUBLIC_CONTENT__.
// influencers), written server-side straight from Neon (no API cold start). This
// makes the FIRST paint reflect CURRENT admin data and, crucially, respect an
// intentionally-empty directory. Without it the page first-painted hardcoded demo
// influencers and - if the free-tier API was asleep when the client refresh fired
// - stayed stuck on that demo data (the "deleted influencers reappear / alternate
// every refresh" bug).
function readBootstrapInfluencers(): InfluencerCache | null {
  if (typeof window === "undefined") return null;
  const boot = (
    window as unknown as { __GB_PUBLIC_CONTENT__?: Record<string, unknown> }
  ).__GB_PUBLIC_CONTENT__;
  const d = boot?.influencers as
    | { items?: Influencer[]; genres?: string[]; countries?: string[] }
    | undefined;
  if (!d || typeof d !== "object") return null;
  return {
    items: Array.isArray(d.items) ? d.items : DEFAULT_INFLUENCERS,
    genres: d.genres?.length ? d.genres : [...NICHE_CATEGORIES],
    countries: d.countries?.length ? d.countries : [...COUNTRIES],
  };
}

// Session-level cache - persists for the lifetime of the tab
let cachedInfluencers: InfluencerCache | null = readBootstrapInfluencers();
let inFlightInfluencers: Promise<InfluencerCache | null> | null = null;

// Per-fetch version guard so an older in-flight response can't overwrite a
// newer one when refresh() is called multiple times (broadcast + visibility).
let influencersVersion = 0;

function parseBroadcastSection(value: string | null): string | null {
  if (!value) return null;
  const pipe = value.lastIndexOf("|");
  if (pipe !== -1) return value.slice(0, pipe);
  const m = value.match(/^(.+):\d+$/);
  return m ? m[1] : value;
}

function fetchInfluencers(): Promise<InfluencerCache | null> {
  if (inFlightInfluencers) return inFlightInfluencers;

  inFlightInfluencers = fetch(
    `${API_BASE}/admin/public/content/influencers?t=${Date.now()}`,
    { cache: "no-store" },
  )
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      inFlightInfluencers = null;
      if (!json?.data) return null;
      const d = json.data as { items?: Influencer[]; genres?: string[]; countries?: string[] };
      const result: InfluencerCache = {
        // Respect an explicitly-empty directory: an admin who deleted everyone
        // must see an empty list, NOT the hardcoded demo data. Fall back to the
        // demo seed only when the section has never been configured (no array).
        items: Array.isArray(d.items) ? d.items : DEFAULT_INFLUENCERS,
        genres: d.genres?.length ? d.genres : [...NICHE_CATEGORIES],
        countries: d.countries?.length ? d.countries : [...COUNTRIES],
      };
      cachedInfluencers = result;
      return result;
    })
    .catch(() => {
      inFlightInfluencers = null;
      return null;
    });

  return inFlightInfluencers;
}

// Call at app startup to warm the influencer cache
export function prefetchInfluencers(): void {
  if (!cachedInfluencers) fetchInfluencers();
}

interface LiveInfluencersResult {
  influencers: Influencer[];
  genres: string[];
  countries: string[];
  loading: boolean;
}

export function useLiveInfluencers(): LiveInfluencersResult {
  const [influencers, setInfluencers] = useState<Influencer[]>(
    // Never seed hardcoded demo influencers: start from the SSR/bootstrap cache
    // when present, otherwise empty + loading until the fetch resolves. This is
    // what stops deleted/demo creators from ghosting in when the cache is cold.
    () => cachedInfluencers?.items ?? [],
  );
  const [genres, setGenres] = useState<string[]>(
    () => cachedInfluencers?.genres ?? [...NICHE_CATEGORIES],
  );
  const [countries, setCountries] = useState<string[]>(
    () => cachedInfluencers?.countries ?? [...COUNTRIES],
  );
  const [loading, setLoading] = useState(!cachedInfluencers);

  useEffect(() => {
    let cancelled = false;

    function apply(data: InfluencerCache | null, myVersion: number) {
      if (cancelled) return;
      if (myVersion !== influencersVersion) return;
      if (data) {
        setInfluencers(data.items);
        setGenres(data.genres);
        setCountries(data.countries);
      }
      // Resolve loading on BOTH success and failure: a sleeping API should
      // surface an honest empty state, never an endless spinner - and never the
      // hardcoded demo data we deliberately stopped seeding into initial state.
      setLoading(false);
    }

    function refresh() {
      // Bypass cache so the admin's most recent save wins.
      cachedInfluencers = null;
      inFlightInfluencers = null;
      const myVersion = ++influencersVersion;
      fetchInfluencers().then((data) => apply(data, myVersion));
    }

    if (cachedInfluencers) {
      setInfluencers(cachedInfluencers.items);
      setGenres(cachedInfluencers.genres);
      setCountries(cachedInfluencers.countries);
      setLoading(false);
    }

    const initialVersion = ++influencersVersion;
    fetchInfluencers().then((data) => apply(data, initialVersion));

    // Cross-tab live update: admin saved → public tab re-fetches.
    function onStorage(e: StorageEvent) {
      if (e.key !== "gb-content-updated") return;
      const sec = parseBroadcastSection(e.newValue);
      if (sec === "influencers") refresh();
    }
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
  }, []);

  return { influencers, genres, countries, loading };
}
