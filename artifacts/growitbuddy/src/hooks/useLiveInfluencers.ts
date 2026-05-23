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

// Session-level cache - persists for the lifetime of the tab
let cachedInfluencers: InfluencerCache | null = null;
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
        items: d.items?.length ? d.items : DEFAULT_INFLUENCERS,
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
    () => cachedInfluencers?.items ?? DEFAULT_INFLUENCERS,
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
      if (cancelled || !data) return;
      if (myVersion !== influencersVersion) return;
      setInfluencers(data.items);
      setGenres(data.genres);
      setCountries(data.countries);
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
