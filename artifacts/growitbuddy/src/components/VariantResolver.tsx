// Catch-all route that resolves a URL slug to a registered Page Variant and
// renders the underlying source page with that variant's content.
// - If slug matches a live variant: render source component wrapped in
//   VariantProvider so usePublicContent() reads the variant's namespaced key.
// - If slug doesn't match: render NotFound.
import { lazy, Suspense, useEffect, useState } from "react";
import { useRoute } from "wouter";
import { API_BASE } from "@/lib/api";
import { VariantProvider } from "@/context/VariantContext";

const NotFound = lazy(() => import("@/pages/not-found"));

// Lazy-import all variant-capable source components on demand. Mirror of the
// VARIANT_SOURCES registry in lib/variantSources.ts - keep in sync when
// adding a new source page.
const SOURCE_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType<unknown>>> = {
  "home":                     lazy(() => import("@/pages/Home")),
  "about":                    lazy(() => import("@/pages/About")),
  "services":                 lazy(() => import("@/pages/Services")),
  "framework":                lazy(() => import("@/pages/Framework")),
  "work":                     lazy(() => import("@/pages/Work")),
  "blog":                     lazy(() => import("@/pages/Insights")),
  "resources":                lazy(() => import("@/pages/Resources")),
  "contact":                  lazy(() => import("@/pages/Contact")),
  "creators":                 lazy(() => import("@/pages/Creators")),
  "joinnetwork":              lazy(() => import("@/pages/JoinNetwork")),
  "career":                   lazy(() => import("@/pages/Career")),
  "authority-audit":          lazy(() => import("@/pages/AuthorityAudit")),
  "distribution-network":     lazy(() => import("@/pages/DistributionNetwork")),
  "creator-school":           lazy(() => import("@/pages/CreatorSchool")),
  "pool-designers":           lazy(() => import("@/pages/DesignersPool")),
  "pool-thumbnail-designers": lazy(() => import("@/pages/ThumbnailDesignersPool")),
  "pool-writers":             lazy(() => import("@/pages/WritersPool")),
  "pool-social-managers":     lazy(() => import("@/pages/SocialMediaManagersPool")),
  "pool-motion-designers":    lazy(() => import("@/pages/MotionDesignersPool")),
  "pool-ai-creators":         lazy(() => import("@/pages/AICreatorsPool")),
  "pool-ugc-creators":        lazy(() => import("@/pages/UGCCreatorsPool")),
  "pool-meme-designers":      lazy(() => import("@/pages/MemeDesignersPool")),
  "pool-editors":             lazy(() => import("@/pages/EditorsPool")),
};

interface VariantRow { slug: string; sourceKey: string; label: string; }

// Module-level cache so a navigation away and back doesn't re-fetch.
let cachedVariants: VariantRow[] | null = null;
let inFlight: Promise<VariantRow[]> | null = null;

function fetchVariants(): Promise<VariantRow[]> {
  if (cachedVariants) return Promise.resolve(cachedVariants);
  if (inFlight) return inFlight;
  inFlight = fetch(`${API_BASE}/admin/public/variants`, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : []))
    .then((rows: VariantRow[]) => { cachedVariants = rows; inFlight = null; return rows; })
    .catch(() => { inFlight = null; return []; });
  return inFlight;
}

export function VariantResolver() {
  const [match, params] = useRoute<{ slug: string }>("/:slug");
  const slug = match ? params?.slug ?? "" : "";
  const [state, setState] = useState<{ status: "loading" | "ready" | "miss"; variant?: VariantRow }>(
    cachedVariants
      ? (() => {
          const v = cachedVariants.find((x) => x.slug === slug);
          return v ? { status: "ready", variant: v } : { status: "miss" };
        })()
      : { status: "loading" },
  );

  useEffect(() => {
    if (!slug) { setState({ status: "miss" }); return; }
    let cancelled = false;
    fetchVariants().then((rows) => {
      if (cancelled) return;
      const v = rows.find((x) => x.slug === slug);
      setState(v ? { status: "ready", variant: v } : { status: "miss" });
    });
    return () => { cancelled = true; };
  }, [slug]);

  if (state.status === "loading") {
    return (
      <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: 18, height: 18, borderRadius: "50%",
          border: "2px solid #E5E5E0", borderTopColor: "#1E293B",
          animation: "gb-spin 0.65s linear infinite",
        }} />
        <style>{`@keyframes gb-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (state.status === "miss" || !state.variant) {
    return <Suspense fallback={null}><NotFound /></Suspense>;
  }

  const Cmp = SOURCE_COMPONENTS[state.variant.sourceKey];
  if (!Cmp) return <Suspense fallback={null}><NotFound /></Suspense>;

  return (
    <VariantProvider value={{ slug: state.variant.slug, sourceKey: state.variant.sourceKey, label: state.variant.label }}>
      <Suspense fallback={null}>
        <Cmp />
      </Suspense>
    </VariantProvider>
  );
}
