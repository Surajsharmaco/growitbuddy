import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { SHARED_CONTENT_SECTIONS, sectionsForSlug } from "@/lib/publicContentSections";
import {
  consumeBootstrapContent,
  ensurePublicContent,
  isBootstrapContentAuthoritative,
} from "@/hooks/usePublicContent";

const BROADCAST_KEY = "gb-content-updated";

interface ContentFreshnessGateProps {
  slug: string;
  children: ReactNode;
  /** Allows variant routes to request their namespaced source page sections. */
  sections?: string[];
}

type GateState =
  | { slug: string; status: "loading" }
  | { slug: string; status: "ready" }
  | { slug: string; status: "error"; message: string };

function Spinner() {
  return (
    <div role="status" aria-label="Loading current page content" className="min-h-[50vh] flex items-center justify-center">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#E5E5E0] border-t-[#1E293B]" />
    </div>
  );
}

export function ContentFreshnessGate({ slug, children, sections }: ContentFreshnessGateProps) {
  const required = [...new Set([...SHARED_CONTENT_SECTIONS, ...(sections ?? sectionsForSlug(slug))])];
  const requestGeneration = useRef(0);
  const [state, setState] = useState<GateState>(() =>
    isBootstrapContentAuthoritative(required)
      ? { slug, status: "ready" }
      : { slug, status: "loading" },
  );

  const refresh = useCallback(async (showLoading = true) => {
    const generation = ++requestGeneration.current;
    if (showLoading) setState({ slug, status: "loading" });
    try {
      await ensurePublicContent(required, true);
      if (generation !== requestGeneration.current) return;
      setState({ slug, status: "ready" });
    } catch (error) {
      if (generation !== requestGeneration.current) return;
      setState({
        slug,
        status: "error",
        message: error instanceof Error ? error.message : "Unable to load current page content.",
      });
    }
  }, [slug, required.join("\u0000")]);

  useEffect(() => {
    // Only the SSR-injected rows are trusted for the first visible render.
    if (state.slug === slug && state.status === "ready" && consumeBootstrapContent(required)) return;
    void refresh(true);
  // required is represented by a stable content key in the dependency list.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, required.join("\u0000")]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== BROADCAST_KEY || !event.newValue) return;
      // Revalidating this route as one bulk unit also catches renamed/legacy
      // section aliases and shared-page relationships.
      void refresh(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh(true);
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh, required.join("\u0000")]);

  // A route transition must never briefly render the previous route's ready
  // state before its new request effect runs.
  if (state.slug !== slug || state.status === "loading") return <Spinner />;
  if (state.status === "error") {
    return (
      <div role="alert" className="min-h-[50vh] flex flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-lg font-semibold text-[#1E293B]">Current content is temporarily unavailable</h1>
        <p className="max-w-lg text-sm text-[#5F5F5F]">{state.message}</p>
        <button
          type="button"
          onClick={() => void refresh(true)}
          className="rounded-md bg-[#1E293B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#34445F]"
        >
          Retry
        </button>
      </div>
    );
  }
  return <>{children}</>;
}