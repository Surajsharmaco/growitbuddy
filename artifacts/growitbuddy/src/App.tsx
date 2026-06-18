import { lazy, Suspense, useEffect } from "react";
import { LazyMotion, domAnimation } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { prefetchSections, usePublicContent } from "@/hooks/usePublicContent";
import { prefetchInfluencers } from "@/hooks/useLiveInfluencers";
import Home from "@/pages/Home";
import PageIntro from "@/components/effects/PageIntro";
import ScrollToTop from "@/components/ScrollToTop";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import { AdminLayout, NAV_GATING } from "@/components/admin/AdminLayout";
import { PageGate } from "@/components/PageGate";
import DynamicPageSEO from "@/components/DynamicPageSEO";
import { VariantResolver } from "@/components/VariantResolver";
import { RouteErrorBoundary } from "@/components/ErrorBoundary";
import { resolveMediaUrl } from "@/lib/api";

// ── Lazy-loaded public pages ──────────────────────────────────────────────────
// Home stays eager (it's the LCP page). Everything else loads on demand.
const Services             = lazy(() => import("@/pages/Services"));
const Work                 = lazy(() => import("@/pages/Work"));
const Framework            = lazy(() => import("@/pages/Framework"));
const Insights             = lazy(() => import("@/pages/Insights"));
const InsightDetail        = lazy(() => import("@/pages/InsightDetail"));
const Creators             = lazy(() => import("@/pages/Creators"));
const Career               = lazy(() => import("@/pages/Career"));
const InfluencerExplore    = lazy(() => import("@/pages/InfluencerExplore"));
const DistributionNetwork  = lazy(() => import("@/pages/DistributionNetwork"));
const Links                = lazy(() => import("@/pages/Links"));
const JoinNetwork          = lazy(() => import("@/pages/JoinNetwork"));
const PageOwnerApply       = lazy(() => import("@/pages/PageOwnerApply"));
const AuthorityAudit       = lazy(() => import("@/pages/AuthorityAudit"));
const Portfolio            = lazy(() => import("@/pages/Portfolio"));
const CaseStudy            = lazy(() => import("@/pages/CaseStudy"));
const Resources            = lazy(() => import("@/pages/Resources"));
const About                = lazy(() => import("@/pages/About"));
const Contact              = lazy(() => import("@/pages/Contact"));
const Verify               = lazy(() => import("@/pages/Verify"));
const VerifyCertificate    = lazy(() => import("@/pages/VerifyCertificate"));
const Privacy              = lazy(() => import("@/pages/Privacy"));
const Terms                = lazy(() => import("@/pages/Terms"));
const NotFound             = lazy(() => import("@/pages/not-found"));
const SEOGuide             = lazy(() => import("@/pages/SEOGuide"));
const SiteGuide            = lazy(() => import("@/pages/SiteGuide"));
const CreatorSchool        = lazy(() => import("@/pages/CreatorSchool"));
const DesignersPool        = lazy(() => import("@/pages/DesignersPool"));
const ThumbnailDesignersPool = lazy(() => import("@/pages/ThumbnailDesignersPool"));
const WritersPool          = lazy(() => import("@/pages/WritersPool"));
const SocialMediaManagersPool = lazy(() => import("@/pages/SocialMediaManagersPool"));
const MotionDesignersPool  = lazy(() => import("@/pages/MotionDesignersPool"));
const AICreatorsPool       = lazy(() => import("@/pages/AICreatorsPool"));
const UGCCreatorsPool      = lazy(() => import("@/pages/UGCCreatorsPool"));
const MemeDesignersPool    = lazy(() => import("@/pages/MemeDesignersPool"));
const EditorsPool          = lazy(() => import("@/pages/EditorsPool"));

// ── Lazy-loaded admin pages ───────────────────────────────────────────────────
const AdminLogin              = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminDashboard          = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminSettings           = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminInfluencers        = lazy(() => import("@/pages/admin/AdminInfluencers"));
const AdminBlog               = lazy(() => import("@/pages/admin/AdminBlog"));
const AdminServices           = lazy(() => import("@/pages/admin/AdminServices"));
const AdminWork               = lazy(() => import("@/pages/admin/AdminWork"));
const AdminHome               = lazy(() => import("@/pages/admin/AdminHome"));
const AdminAbout              = lazy(() => import("@/pages/admin/AdminAbout"));
const AdminNavbar             = lazy(() => import("@/pages/admin/AdminNavbar"));
const AdminFooter             = lazy(() => import("@/pages/admin/AdminFooter"));
const AdminLeads              = lazy(() => import("@/pages/admin/AdminLeads"));
const AdminTalentPoolLeads    = lazy(() => import("@/pages/admin/AdminTalentPoolLeads"));
const AdminCertificates       = lazy(() => import("@/pages/admin/AdminCertificates"));
const AdminContact            = lazy(() => import("@/pages/admin/AdminContact"));
const AdminJoinNetwork        = lazy(() => import("@/pages/admin/AdminJoinNetwork"));
const AdminCareer             = lazy(() => import("@/pages/admin/AdminCareer"));
const AdminFramework          = lazy(() => import("@/pages/admin/AdminFramework"));
const AdminDistributionNetwork = lazy(() => import("@/pages/admin/AdminDistributionNetwork"));
const AdminDistributionPages  = lazy(() => import("@/pages/admin/AdminDistributionPages"));
const AdminLinks              = lazy(() => import("@/pages/admin/AdminLinks"));
const AdminInfluencerExplore  = lazy(() => import("@/pages/admin/AdminInfluencerExplore"));
const AdminAuthorityAudit     = lazy(() => import("@/pages/admin/AdminAuthorityAudit"));
const AdminResources          = lazy(() => import("@/pages/admin/AdminResources"));
const AdminMediaLibrary       = lazy(() => import("@/pages/admin/AdminMediaLibrary"));
const AdminTeamMembers        = lazy(() => import("@/pages/admin/AdminTeamMembers"));
const AdminOptimize           = lazy(() => import("@/pages/admin/AdminOptimize"));
const AdminPortfolio          = lazy(() => import("@/pages/admin/AdminPortfolio"));
const AdminPortfolioShares    = lazy(() => import("@/pages/admin/AdminPortfolioShares"));
const AdminLogos              = lazy(() => import("@/pages/admin/AdminLogos"));
const AdminCreatorSchool      = lazy(() => import("@/pages/admin/AdminCreatorSchool"));
const AdminTalentPool         = lazy(() => import("@/pages/admin/AdminTalentPool"));
const AdminPageVisibility     = lazy(() => import("@/pages/admin/AdminPageVisibility"));
const AdminSEO                = lazy(() => import("@/pages/admin/AdminSEO"));
const AdminPageVariants       = lazy(() => import("@/pages/admin/AdminPageVariants"));
const AdminPrivacy            = lazy(() => import("@/pages/admin/AdminPrivacy"));
const AdminTerms              = lazy(() => import("@/pages/admin/AdminTerms"));
const AdminNetworkForm        = lazy(() => import("@/pages/admin/AdminNetworkForm"));
const AdminSeoGuide           = lazy(() => import("@/pages/admin/AdminSeoGuide"));
const AdminSiteGuide          = lazy(() => import("@/pages/admin/AdminSiteGuide"));
const AdminBackup             = lazy(() => import("@/pages/admin/AdminBackup"));

// ── Minimal spinner (no layout shift, no external deps) ──────────────────────
function PageSpinner() {
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

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: "60vh", padding: 24 }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(11,11,11,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 24 }}>🔒</div>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0B0B0B", letterSpacing: "-0.02em", margin: 0 }}>Access restricted</h1>
      <p style={{ marginTop: 8, fontSize: 14, color: "rgba(11,11,11,0.55)", maxWidth: 440, lineHeight: 1.55 }}>
        You don't have permission to view this section. Ask a super-admin to grant you access if you need it.
      </p>
    </div>
  );
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, verifying, isSuperAdmin, hasPermission } = useAdmin();
  const [location] = useLocation();
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B0B0F" }}>
        <div className="w-5 h-5 rounded-full animate-spin" style={{ border: "2px solid rgba(30,41,59,0.2)", borderTopColor: "var(--gb-accent)" }} />
      </div>
    );
  }
  if (!isAuthenticated) return <Redirect to="/admin/login" />;
  const path = (location.split("?")[0].replace(/\/+$/, "")) || "/admin";
  const isVariantEdit =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("variant");
  const gating = NAV_GATING[path];
  const allowed = isVariantEdit
    ? isSuperAdmin
    : !gating
      ? true
      : gating.superOnly
        ? isSuperAdmin
        : gating.anyPermission?.length
          ? gating.anyPermission.some((p) => hasPermission(p))
          : gating.permission
            ? hasPermission(gating.permission)
            : true;
  return (
    <AdminLayout>
      <RouteErrorBoundary>
        <Suspense fallback={<PageSpinner />}>{allowed ? children : <AccessDenied />}</Suspense>
      </RouteErrorBoundary>
    </AdminLayout>
  );
}

function AdminRoutes() {
  return (
    <Switch>
      <Route path="/admin/login">{() => <Suspense fallback={<PageSpinner />}><AdminLogin /></Suspense>}</Route>
      <Route path="/admin/settings">{() => <AdminGuard><AdminSettings /></AdminGuard>}</Route>
      <Route path="/admin/home">{() => <AdminGuard><AdminHome /></AdminGuard>}</Route>
      <Route path="/admin/services">{() => <AdminGuard><AdminServices /></AdminGuard>}</Route>
      <Route path="/admin/work">{() => <AdminGuard><AdminWork /></AdminGuard>}</Route>
      <Route path="/admin/influencers">{() => <AdminGuard><AdminInfluencers /></AdminGuard>}</Route>
      <Route path="/admin/blog">{() => <AdminGuard><AdminBlog /></AdminGuard>}</Route>
      <Route path="/admin/about">{() => <AdminGuard><AdminAbout /></AdminGuard>}</Route>
      <Route path="/admin/navbar">{() => <AdminGuard><AdminNavbar /></AdminGuard>}</Route>
      <Route path="/admin/footer">{() => <AdminGuard><AdminFooter /></AdminGuard>}</Route>
      <Route path="/admin/leads">{() => <AdminGuard><AdminLeads /></AdminGuard>}</Route>
      <Route path="/admin/talent-pool-leads">{() => <AdminGuard><AdminTalentPoolLeads /></AdminGuard>}</Route>
      <Route path="/admin/certificates">{() => <AdminGuard><AdminCertificates /></AdminGuard>}</Route>
      <Route path="/admin/contact">{() => <AdminGuard><AdminContact /></AdminGuard>}</Route>
      <Route path="/admin/join-network">{() => <AdminGuard><AdminJoinNetwork /></AdminGuard>}</Route>
      <Route path="/admin/career">{() => <AdminGuard><AdminCareer /></AdminGuard>}</Route>
      {/* Back-compat redirects for old admin URLs */}
      <Route path="/admin/freelancers-page">{() => <Redirect to="/admin/career" />}</Route>
      <Route path="/admin/full-time-page">{() => <Redirect to="/admin/career" />}</Route>
      <Route path="/admin/framework">{() => <AdminGuard><AdminFramework /></AdminGuard>}</Route>
      <Route path="/admin/distribution-network">{() => <AdminGuard><AdminDistributionNetwork /></AdminGuard>}</Route>
      <Route path="/admin/distribution-pages">{() => <AdminGuard><AdminDistributionPages /></AdminGuard>}</Route>
      <Route path="/admin/links">{() => <AdminGuard><AdminLinks /></AdminGuard>}</Route>
      <Route path="/admin/influencer-explore">{() => <AdminGuard><AdminInfluencerExplore /></AdminGuard>}</Route>
      <Route path="/admin/authority-audit">{() => <AdminGuard><AdminAuthorityAudit /></AdminGuard>}</Route>
      <Route path="/admin/resources">{() => <AdminGuard><AdminResources /></AdminGuard>}</Route>
      <Route path="/admin/media">{() => <AdminGuard><AdminMediaLibrary /></AdminGuard>}</Route>
      <Route path="/admin/team">{() => <AdminGuard><AdminTeamMembers /></AdminGuard>}</Route>
      <Route path="/admin/optimize">{() => <AdminGuard><AdminOptimize /></AdminGuard>}</Route>
      <Route path="/admin/portfolio">{() => <AdminGuard><AdminPortfolio /></AdminGuard>}</Route>
      <Route path="/admin/portfolio-shares">{() => <AdminGuard><AdminPortfolioShares /></AdminGuard>}</Route>
      <Route path="/admin/logos">{() => <AdminGuard><AdminLogos /></AdminGuard>}</Route>
      <Route path="/admin/editors-pool">{() => <AdminGuard><AdminCreatorSchool /></AdminGuard>}</Route>
      <Route path="/admin/pool-designers">{() => <AdminGuard><AdminTalentPool poolKey="pool-designers" label="Designers Pool" description="Manage the /designers-pool landing page." pageUrl="/designers-pool" /></AdminGuard>}</Route>
      <Route path="/admin/pool-thumbnail-designers">{() => <AdminGuard><AdminTalentPool poolKey="pool-thumbnail-designers" label="Thumbnail Designers Pool" description="Manage the /thumbnail-designers landing page." pageUrl="/thumbnail-designers" /></AdminGuard>}</Route>
      <Route path="/admin/pool-writers">{() => <AdminGuard><AdminTalentPool poolKey="pool-writers" label="Writers Pool" description="Manage the /writers-pool landing page." pageUrl="/writers-pool" /></AdminGuard>}</Route>
      <Route path="/admin/pool-social-managers">{() => <AdminGuard><AdminTalentPool poolKey="pool-social-managers" label="Social Media Managers Pool" description="Manage the /social-media-managers landing page." pageUrl="/social-media-managers" /></AdminGuard>}</Route>
      <Route path="/admin/pool-motion-designers">{() => <AdminGuard><AdminTalentPool poolKey="pool-motion-designers" label="Motion Designers Pool" description="Manage the /motion-designers landing page." pageUrl="/motion-designers" /></AdminGuard>}</Route>
      <Route path="/admin/pool-ai-creators">{() => <AdminGuard><AdminTalentPool poolKey="pool-ai-creators" label="AI Creators Pool" description="Manage the /ai-creators landing page." pageUrl="/ai-creators" /></AdminGuard>}</Route>
      <Route path="/admin/pool-ugc-creators">{() => <AdminGuard><AdminTalentPool poolKey="pool-ugc-creators" label="UGC Creators Pool" description="Manage the /ugc-creators landing page." pageUrl="/ugc-creators" /></AdminGuard>}</Route>
      <Route path="/admin/pool-meme-designers">{() => <AdminGuard><AdminTalentPool poolKey="pool-meme-designers" label="Meme Designers Pool" description="Manage the /meme-designers landing page." pageUrl="/meme-designers" /></AdminGuard>}</Route>
      <Route path="/admin/pool-editors">{() => <AdminGuard><AdminTalentPool poolKey="pool-editors" label="Video Editors Pool" description="Manage the /video-editors landing page." pageUrl="/video-editors" /></AdminGuard>}</Route>
      <Route path="/admin/page-visibility">{() => <AdminGuard><AdminPageVisibility /></AdminGuard>}</Route>
      <Route path="/admin/seo">{() => <AdminGuard><AdminSEO /></AdminGuard>}</Route>
      <Route path="/admin/page-variants">{() => <AdminGuard><AdminPageVariants /></AdminGuard>}</Route>
      <Route path="/admin/privacy">{() => <AdminGuard><AdminPrivacy /></AdminGuard>}</Route>
      <Route path="/admin/terms">{() => <AdminGuard><AdminTerms /></AdminGuard>}</Route>
      <Route path="/admin/seo-guide">{() => <AdminGuard><AdminSeoGuide /></AdminGuard>}</Route>
      <Route path="/admin/site-guide">{() => <AdminGuard><AdminSiteGuide /></AdminGuard>}</Route>
      <Route path="/admin/backup">{() => <AdminGuard><AdminBackup /></AdminGuard>}</Route>
      <Route path="/admin/creators-form">{() => <AdminGuard><AdminNetworkForm contentKey="creators-form" slug="creators" title="Creators Page Form" description="Edit the headings, benefits, callout, form copy, and SEO of the public /creators page." /></AdminGuard>}</Route>
      <Route path="/admin/page-owner-form">{() => <AdminGuard><AdminNetworkForm contentKey="page-owner-form" slug="join-page-owner" title="Page Owner Form" description="Edit the headings, benefits, callout, form copy, and SEO of the public /join/page-owner page." /></AdminGuard>}</Route>
      <Route path="/admin">{() => <AdminGuard><AdminDashboard /></AdminGuard>}</Route>
    </Switch>
  );
}

const ALL_SECTIONS = [
  "home", "about", "contact", "framework", "services", "work",
  "resources", "joinnetwork", "freelancers", "fulltime", "internship",
  "influencer-explore", "authority-audit", "distribution-network",
  "distribution-pages", "links", "blog", "creator-school", "settings",
  "pool-designers", "pool-thumbnail-designers", "pool-writers",
  "pool-social-managers", "pool-motion-designers", "pool-ai-creators",
  "pool-ugc-creators", "pool-meme-designers", "pool-editors", "page_visibility",
  "privacy", "terms", "seo-guide", "site-guide", "creators-form", "page-owner-form",
];

function FaviconInjector() {
  const settings = usePublicContent("settings", { faviconUrl: "" });
  useEffect(() => {
    const url = (settings as { faviconUrl?: string }).faviconUrl;
    if (!url) return;
    const existing = document.querySelectorAll("link[rel~='icon']");
    existing.forEach((el) => el.remove());
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = resolveMediaUrl(url);
    document.head.appendChild(link);
  }, [(settings as { faviconUrl?: string }).faviconUrl]);
  return null;
}

function App() {
  useEffect(() => {
    // Use requestIdleCallback so prefetch doesn't compete with critical
    // resources on the first paint (preserves LCP) while still kicking off
    // much sooner than the previous 1500ms timeout. Mounted hooks also do
    // their own refresh-on-mount, so even if a section isn't pre-warmed by
    // the time a page renders, the hook will pull fresh data right away.
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;
    const run = () => { prefetchSections(ALL_SECTIONS); prefetchInfluencers(); };
    let handle: number | NodeJS.Timeout;
    if (ric) handle = ric(run, { timeout: 800 });
    else handle = setTimeout(run, 300);
    return () => {
      const cic = (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
      if (ric && cic) cic(handle as number);
      else clearTimeout(handle as NodeJS.Timeout);
    };
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <AdminProvider>
        <FaviconInjector />
        <DynamicPageSEO />
        <ScrollToTop />
        <Switch>
          <Route path="/admin/:rest*" component={AdminRoutes} />
          <Route path="/admin" component={AdminRoutes} />

          {/* Internal SEO guide - standalone (no layout chrome), permanently noindex via the page itself */}
          <Route path="/seo-guide">{() => <Suspense fallback={<PageSpinner />}><PageGate slug="seo-guide"><SEOGuide /></PageGate></Suspense>}</Route>

          {/* Bio link page - standalone (no site navbar/footer chrome) */}
          <Route path="/links">{() => <Suspense fallback={<PageSpinner />}><PageGate slug="links"><Links /></PageGate></Suspense>}</Route>

          <Route>
            {() => (
              <>
                <PageIntro />
                <Layout>
                  <RouteErrorBoundary>
                  <Suspense fallback={<PageSpinner />}>
                    <Switch>
                      <Route path="/">{() => <PageGate slug="home"><Home /></PageGate>}</Route>
                      <Route path="/services">{() => <PageGate slug="services"><Services /></PageGate>}</Route>
                      <Route path="/work">{() => <PageGate slug="work"><Work /></PageGate>}</Route>
                      <Route path="/framework">{() => <PageGate slug="framework"><Framework /></PageGate>}</Route>
                      <Route path="/blog">{() => <PageGate slug="insights"><Insights /></PageGate>}</Route>
                      <Route path="/blog/:slug">{() => <PageGate slug="insights"><InsightDetail /></PageGate>}</Route>
                      {/* Back-compat - old /insights URLs permanently redirect to /blog */}
                      <Route path="/insights">{() => <Redirect to="/blog" />}</Route>
                      <Route path="/insights/:slug">{(params) => <Redirect to={`/blog/${params.slug}`} />}</Route>
                      <Route path="/influencers">{() => <PageGate slug="influencers"><InfluencerExplore /></PageGate>}</Route>
                      <Route path="/distribution">{() => <PageGate slug="distribution"><DistributionNetwork /></PageGate>}</Route>
                      <Route path="/join">{() => <PageGate slug="join"><JoinNetwork /></PageGate>}</Route>
                      <Route path="/join/page-owner">{() => <PageGate slug="join-page-owner"><PageOwnerApply /></PageGate>}</Route>
                      <Route path="/creators">{() => <PageGate slug="creators"><Creators /></PageGate>}</Route>
                      <Route path="/career">{() => <PageGate slug="career"><Career /></PageGate>}</Route>
                      {/* Back-compat - old career URLs preselect the right tab */}
                      <Route path="/freelancers">{() => <Redirect to="/career?type=freelancer" />}</Route>
                      <Route path="/full-time">{() => <Redirect to="/career?type=full-time" />}</Route>
                      <Route path="/internship">{() => <Redirect to="/career?type=internship" />}</Route>
                      <Route path="/authority-audit">{() => <PageGate slug="authority-audit"><AuthorityAudit /></PageGate>}</Route>
                      <Route path="/portfolio" component={Portfolio} />
                      <Route path="/portfolio/shared/:slug/:category/case/:id" component={CaseStudy} />
                      <Route path="/portfolio/shared/:slug/:category" component={Portfolio} />
                      <Route path="/portfolio/shared/:slug" component={Portfolio} />
                      <Route path="/portfolio/:category/case/:id" component={CaseStudy} />
                      <Route path="/portfolio/:category" component={Portfolio} />
                      {/* Back-compat for old links */}
                      <Route path="/portfolio-private">{() => <Redirect to="/portfolio" />}</Route>
                      <Route path="/portfolio-private/:category">{(p) => <Redirect to={`/portfolio/${p.category}`} />}</Route>
                      <Route path="/resources">{() => <PageGate slug="resources"><Resources /></PageGate>}</Route>
                      <Route path="/guide">{() => <PageGate slug="site-guide"><SiteGuide /></PageGate>}</Route>
                      <Route path="/about">{() => <PageGate slug="about"><About /></PageGate>}</Route>
                      <Route path="/contact">{() => <PageGate slug="contact"><Contact /></PageGate>}</Route>
                      <Route path="/verify/:id">{() => <PageGate slug="verify"><VerifyCertificate /></PageGate>}</Route>
                      <Route path="/verify">{() => <PageGate slug="verify"><Verify /></PageGate>}</Route>
                      <Route path="/privacy">{() => <PageGate slug="privacy"><Privacy /></PageGate>}</Route>
                      <Route path="/terms">{() => <PageGate slug="terms"><Terms /></PageGate>}</Route>
                      <Route path="/editors-pool">{() => <PageGate slug="creator-school"><CreatorSchool /></PageGate>}</Route>
                      <Route path="/designers-pool">{() => <PageGate slug="designers-pool"><DesignersPool /></PageGate>}</Route>
                      <Route path="/thumbnail-designers">{() => <PageGate slug="thumbnail-designers"><ThumbnailDesignersPool /></PageGate>}</Route>
                      <Route path="/writers-pool">{() => <PageGate slug="writers-pool"><WritersPool /></PageGate>}</Route>
                      <Route path="/social-media-managers">{() => <PageGate slug="social-media-managers"><SocialMediaManagersPool /></PageGate>}</Route>
                      <Route path="/motion-designers">{() => <PageGate slug="motion-designers"><MotionDesignersPool /></PageGate>}</Route>
                      <Route path="/ai-creators">{() => <PageGate slug="ai-creators"><AICreatorsPool /></PageGate>}</Route>
                      <Route path="/ugc-creators">{() => <PageGate slug="ugc-creators"><UGCCreatorsPool /></PageGate>}</Route>
                      <Route path="/meme-designers">{() => <PageGate slug="meme-designers"><MemeDesignersPool /></PageGate>}</Route>
                      <Route path="/video-editors">{() => <PageGate slug="video-editors"><EditorsPool /></PageGate>}</Route>
                      {/* Page Variants - catch-all that resolves /:slug to a variant of a source page.
                          Falls through to NotFound if the slug doesn't match a live variant. */}
                      <Route path="/:slug" component={VariantResolver} />
                      <Route component={NotFound} />
                    </Switch>
                  </Suspense>
                  </RouteErrorBoundary>
                </Layout>
              </>
            )}
          </Route>
        </Switch>
      </AdminProvider>
      </WouterRouter>
    </LazyMotion>
  );
}

export default App;
