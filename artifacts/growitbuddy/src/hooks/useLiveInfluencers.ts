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

function fetchInfluencers(): Promise<InfluencerCache | null> {
  if (inFlightInfluencers) return inFlightInfluencers;

  inFlightInfluencers = fetch(`${API_BASE}/admin/public/content/influencers`)
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
    if (cachedInfluencers) {
      // Already have data - apply it immediately, then refresh silently
      setInfluencers(cachedInfluencers.items);
      setGenres(cachedInfluencers.genres);
      setCountries(cachedInfluencers.countries);
      setLoading(false);
    }

    let cancelled = false;
    fetchInfluencers().then((data) => {
      if (cancelled || !data) return;
      setInfluencers(data.items);
      setGenres(data.genres);
      setCountries(data.countries);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { influencers, genres, countries, loading };
}
