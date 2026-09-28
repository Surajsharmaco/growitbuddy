// Catch-all route that resolves a URL slug to a registered Page Variant and
// renders the underlying source page with that variant's content.
// - If slug matches a live variant: render source component wrapped in
//   VariantProvider so usePublicContent() reads the variant's namespaced key.
// - If slug doesn't match: render NotFound.
import { lazy, Suspense, useEffect, useState } from "react";
import { useRoute } from "wouter";
import { API_BASE } from "@/lib/api";
import { VariantProvider } from "@/context/VariantContext";
import { ContentFreshnessGate } from "@/components/ContentFreshnessGate";
import { SHARED_CONTENT_SECTIONS } from "@/lib/publicContentSections";
import { isBootstrapContentAuthoritative, observeBootstrapRoute } from "@/hooks/usePublicContent";
import { VARIANT_SOURCES, variantContentKey } from "@/lib/variantSources";

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
    .then((r) => {
      if (!r.ok) throw new Error(`Variant service returned HTTP ${r.status}`);
      return r.json();
    })
    .then((rows: VariantRow[]) => { cachedVariants = rows; inFlight = null; return rows; })
    .catch((error) => { inFlight = null; throw error; });
  return inFlight;
}

function bootstrappedVariant(slug: string): VariantRow | undefined {
  if (!slug || !observeBootstrapRoute()) return undefined;
  const bootSections = typeof window === "undefined"
    ? []
    : (window as Window & { __GB_CONTENT_SECTIONS__?: string[] }).__GB_CONTENT_SECTIONS__ ?? [];
  const source = VARIANT_SOURCES.find((candidate) => {
    const namespacedSection = variantContentKey(candidate.key, slug);
    return bootSections.includes(namespacedSection) &&
      isBootstrapContentAuthoritative([namespacedSection, ...SHARED_CONTENT_SECTIONS]);
  });
  return source
    ? { slug, sourceKey: source.key, label: source.label }
    : undefined;
}

export function VariantResolver() {
  const [match, params] = useRoute<{ slug: string }>("/:slug");
  const slug = match ? params?.slug ?? "" : "";
  const bootVariant = bootstrappedVariant(slug);
  const [state, setState] = useState<{ status: "loading" | "ready" | "miss" | "error"; variant?: VariantRow; message?: string }>(
    bootVariant
      ? { status: "ready", variant: bootVariant }
      : cachedVariants
      ? (() => {
          const v = cachedVariants.find((x) => x.slug === slug);
          return v ? { status: "ready", variant: v } : { status: "miss" };
        })()
      : { status: "loading" },
  );

  useEffect(() => {
    if (!slug) { setState({ status: "miss" }); return; }
    const bootVariant = bootstrappedVariant(slug);
    if (bootVariant) {
      setState({ status: "ready", variant: bootVariant });
      return;
    }
    let cancelled = false;
    fetchVariants().then((rows) => {
      if (cancelled) return;
      const v = rows.find((x) => x.slug === slug);
      setState(v ? { status: "ready", variant: v } : { status: "miss" });
    }).catch((error) => {
      if (!cancelled) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Unable to resolve this page.",
        });
      }
    });
    return () => { cancelled = true; };
  }, [slug]);

  if (state.status === "loading" || (state.status === "ready" && state.variant?.slug !== slug)) {
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

  if (state.status === "error") {
    return (
      <div role="alert" className="min-h-[50vh] flex flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-lg font-semibold text-[#1E293B]">Unable to load this page</h1>
        <p className="text-sm text-[#5F5F5F]">{state.message}</p>
        <button type="button" onClick={() => {
          cachedVariants = null;
          inFlight = null;
          setState({ status: "loading" });
          fetchVariants().then((rows) => {
            const v = rows.find((x) => x.slug === slug);
            setState(v ? { status: "ready", variant: v } : { status: "miss" });
          }).catch((error) => setState({
            status: "error",
            message: error instanceof Error ? error.message : "Unable to resolve this page.",
          }));
        }} className="rounded-md bg-[#1E293B] px-4 py-2 text-sm font-semibold text-white">
          Retry
        </button>
      </div>
    );
  }

  if (state.status === "miss" || !state.variant) {
    return <Suspense fallback={null}><NotFound /></Suspense>;
  }

  const Cmp = SOURCE_COMPONENTS[state.variant.sourceKey];
  if (!Cmp) return <Suspense fallback={null}><NotFound /></Suspense>;
  const variantSections = [
    variantContentKey(state.variant.sourceKey, state.variant.slug),
    ...SHARED_CONTENT_SECTIONS,
  ];

  return (
    <VariantProvider value={{ slug: state.variant.slug, sourceKey: state.variant.sourceKey, label: state.variant.label }}>
      <ContentFreshnessGate slug={state.variant.slug} sections={variantSections}>
        <Suspense fallback={null}>
          <Cmp />
        </Suspense>
      </ContentFreshnessGate>
    </VariantProvider>
  );
}
