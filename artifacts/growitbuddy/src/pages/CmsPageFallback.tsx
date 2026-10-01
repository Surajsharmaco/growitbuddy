import { lazy, Suspense } from "react";
import { useParams } from "wouter";
import type { BlogPost } from "@/data/blogPosts";
import { isPublicCmsPage, isReservedCmsPageSlug } from "@workspace/seo";
import { usePublicContent } from "@/hooks/usePublicContent";
import { VariantResolver } from "@/components/VariantResolver";

const InsightDetail = lazy(() => import("@/pages/InsightDetail"));
const NotFound = lazy(() => import("@/pages/not-found"));

/**
 * Root /:slug resolution, mirroring SSR order: public CMS page first; reserved
 * slugs (static routes) never reach variants; everything else is delegated to
 * VariantResolver, which owns the authoritative variant miss / 404.
 * The public cms-pages projection only contains public pages, so a private CMS
 * page is simply absent here; the backend rejects slug collisions with variants.
 */
export default function CmsPageResolver() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { posts } = usePublicContent<{ posts: BlogPost[] }>("cms-pages", { posts: [] });
  const page = (posts ?? []).find((p) => p.slug === slug && isPublicCmsPage(p));
  if (page && !isReservedCmsPageSlug(slug)) {
    return <Suspense fallback={null}><InsightDetail pageMode /></Suspense>;
  }
  if (isReservedCmsPageSlug(slug)) {
    return <Suspense fallback={null}><NotFound /></Suspense>;
  }
  return <VariantResolver />;
}
