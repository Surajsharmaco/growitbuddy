// BUILD-TAG: TALENT-POOL-CRM-DEPLOY-$(date +%s)
import { lazy, Suspense, useEffect } from "react";
import { LazyMotion, domAnimation } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { prefetchSections, usePublicContent } from "@/hooks/usePublicContent";
import { prefetchInfluencers } from "@/hooks/useLiveInfluencers";
import Home from "@/pages/Home";
import CustomCursor from "@/components/effects/CustomCursor";
import PageIntro from "@/components/effects/PageIntro";
import ScrollToTop from "@/components/ScrollToTop";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageGate } from "@/components/PageGate";

// ── Lazy-loaded public pages ──────────────────────────────────────────────────
// Home stays eager (it's the LCP page). Everything else loads on demand.
const Services             = lazy(() => import("@/pages/Services"));
const Work                 = lazy(() => import("@/pages/Work"));
const Framework            = lazy(() => import("@/pages/Framework"));
const Insights             = lazy(() => import("@/pages/Insights"));
const InsightDetail        = lazy(() => import("@/pages/InsightDetail"));
const Creators             = lazy(() => import("@/pages/Creators"));
const Freelancers          = lazy(() => import("@/pages/Freelancers"));
const InfluencerExplore    = lazy(() => import("@/pages/InfluencerExplore"));
const DistributionNetwork  = lazy(() => import("@/pages/DistributionNetwork"));
const JoinNetwork          = lazy(() => import("@/pages/JoinNetwork"));
const PageOwnerApply       = lazy(() => import("@/pages/PageOwnerApply"));
const FullTime             = lazy(() => import("@/pages/FullTime"));
const AuthorityAudit       = lazy(() => import("@/pages/AuthorityAudit"));
const Portfolio            = lazy(() => import("@/pages/Portfolio"));
const Resources            = lazy(() => import("@/pages/Resources"));
const About                = lazy(() => import("@/pages/About"));
const Contact              = lazy(() => import("@/pages/Contact"));
const Internship           = lazy(() => import("@/pages/Internship"));
const Verify               = lazy(() => import("@/pages/Verify"));
const VerifyCertificate    = lazy(() => import("@/pages/VerifyCertificate"));
const Privacy              = lazy(() => import("@/pages/Privacy"));
const Terms                = lazy(() => import("@/pages/Terms"));
const NotFound             = lazy(() => import("@/pages/not-found"));
const CreatorSchool        = lazy(() => import("@/pages/CreatorSchool"));
const DesignersPool        = lazy(() => import("@/pages/DesignersPool"));
const ThumbnailDesignersPool = lazy(() => import("@/pages/ThumbnailDesignersPool"));
const WritersPool          = lazy(() => import("@/pages/WritersPool"));
const SocialMediaManagersPool = lazy(() => import("@/pages/SocialMediaManagersPool"));
const MotionDesignersPool  = lazy(() => import("@/pages/MotionDesignersPool"));
const AICreatorsPool       = lazy(() => import("@/pages/AICreatorsPool"));
const UGCCreatorsPool      = lazy(() => import("@/pages/UGCCreatorsPool"));
const MemeDesignersPool    = lazy(() => import("@/pages/MemeDesignersPool"));

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
const AdminFreelancers        = lazy(() => import("@/pages/admin/AdminFreelancers"));
const AdminFullTime           = lazy(() => import("@/pages/admin/AdminFullTime"));
const AdminFramework          = lazy(() => import("@/pages/admin/AdminFramework"));
const AdminDistributionNetwork = lazy(() => import("@/pages/admin/AdminDistributionNetwork"));
const AdminDistributionPages  = lazy(() => import("@/pages/admin/AdminDistributionPages"));
const AdminInfluencerExplore  = lazy(() => import("@/pages/admin/AdminInfluencerExplore"));
const AdminAuthorityAudit     = lazy(() => import("@/pages/admin/AdminAuthorityAudit"));
const AdminResources          = lazy(() => import("@/pages/admin/AdminResources"));
const AdminMediaLibrary       = lazy(() => import("@/pages/admin/AdminMediaLibrary"));
const AdminTeamMembers        = lazy(() => import("@/pages/admin/AdminTeamMembers"));
const AdminOptimize           = lazy(() => import("@/pages/admin/AdminOptimize"));
const AdminPortfolio          = lazy(() => import("@/pages/admin/AdminPortfolio"));
const AdminLogos              = lazy(() => import("@/pages/admin/AdminLogos"));
const AdminCreatorSchool      = lazy(() => import("@/pages/admin/AdminCreatorSchool"));
const AdminTalentPool         = lazy(() => import("@/pages/admin/AdminTalentPool"));
const AdminPageVisibility     = lazy(() => import("@/pages/admin/AdminPageVisibility"));

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

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, verifying } = useAdmin();
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B0B0F" }}>
        <div className="w-5 h-5 rounded-full animate-spin" style={{ border: "2px solid rgba(30,41,59,0.2)", borderTopColor: "var(--gb-accent)" }} />
      </div>
    );
  }
  if (!isAuthenticated) return <Redirect to="/admin/login" />;
  return (
    <AdminLayout>
      <Suspense fallback={<PageSpinner />}>{children}</Suspense>
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
      <Route path="/admin/freelancers-page">{() => <AdminGuard><AdminFreelancers /></AdminGuard>}</Route>
      <Route path="/admin/full-time-page">{() => <AdminGuard><AdminFullTime /></AdminGuard>}</Route>
      <Route path="/admin/framework">{() => <AdminGuard><AdminFramework /></AdminGuard>}</Route>
      <Route path="/admin/distribution-network">{() => <AdminGuard><AdminDistributionNetwork /></AdminGuard>}</Route>
      <Route path="/admin/distribution-pages">{() => <AdminGuard><AdminDistributionPages /></AdminGuard>}</Route>
      <Route path="/admin/influencer-explore">{() => <AdminGuard><AdminInfluencerExplore /></AdminGuard>}</Route>
      <Route path="/admin/authority-audit">{() => <AdminGuard><AdminAuthorityAudit /></AdminGuard>}</Route>
      <Route path="/admin/resources">{() => <AdminGuard><AdminResources /></AdminGuard>}</Route>
      <Route path="/admin/media">{() => <AdminGuard><AdminMediaLibrary /></AdminGuard>}</Route>
      <Route path="/admin/team">{() => <AdminGuard><AdminTeamMembers /></AdminGuard>}</Route>
      <Route path="/admin/optimize">{() => <AdminGuard><AdminOptimize /></AdminGuard>}</Route>
      <Route path="/admin/portfolio">{() => <AdminGuard><AdminPortfolio /></AdminGuard>}</Route>
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
      <Route path="/admin/page-visibility">{() => <AdminGuard><AdminPageVisibility /></AdminGuard>}</Route>
      <Route path="/admin">{() => <AdminGuard><AdminDashboard /></AdminGuard>}</Route>
    </Switch>
  );
}

const ALL_SECTIONS = [
  "home", "about", "contact", "framework", "services", "work",
  "resources", "joinnetwork", "freelancers", "fulltime",
  "influencer-explore", "authority-audit", "distribution-network",
  "distribution-pages", "blog", "creator-school", "settings",
  "pool-designers", "pool-thumbnail-designers", "pool-writers",
  "pool-social-managers", "pool-motion-designers", "pool-ai-creators",
  "pool-ugc-creators", "pool-meme-designers", "page_visibility",
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
    link.href = url;
    document.head.appendChild(link);
  }, [(settings as { faviconUrl?: string }).faviconUrl]);
  return null;
}

function App() {
  useEffect(() => {
    // Delay prefetch to avoid competing with LCP rendering on initial load
    const t = setTimeout(() => {
      prefetchSections(ALL_SECTIONS);
      prefetchInfluencers();
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <AdminProvider>
        <FaviconInjector />
        <ScrollToTop />
        <CustomCursor />
        <Switch>
          <Route path="/admin/:rest*" component={AdminRoutes} />
          <Route path="/admin" component={AdminRoutes} />

          <Route>
            {() => (
              <>
                <PageIntro />
                <Layout>
                  <Suspense fallback={<PageSpinner />}>
                    <Switch>
                      <Route path="/">{() => <PageGate slug="home"><Home /></PageGate>}</Route>
                      <Route path="/services">{() => <PageGate slug="services"><Services /></PageGate>}</Route>
                      <Route path="/work">{() => <PageGate slug="work"><Work /></PageGate>}</Route>
                      <Route path="/framework">{() => <PageGate slug="framework"><Framework /></PageGate>}</Route>
                      <Route path="/insights">{() => <PageGate slug="insights"><Insights /></PageGate>}</Route>
                      <Route path="/insights/:slug">{() => <PageGate slug="insights"><InsightDetail /></PageGate>}</Route>
                      <Route path="/influencers">{() => <PageGate slug="influencers"><InfluencerExplore /></PageGate>}</Route>
                      <Route path="/distribution">{() => <PageGate slug="distribution"><DistributionNetwork /></PageGate>}</Route>
                      <Route path="/join">{() => <PageGate slug="join"><JoinNetwork /></PageGate>}</Route>
                      <Route path="/join/page-owner">{() => <PageGate slug="join-page-owner"><PageOwnerApply /></PageGate>}</Route>
                      <Route path="/creators">{() => <PageGate slug="creators"><Creators /></PageGate>}</Route>
                      <Route path="/freelancers">{() => <PageGate slug="freelancers"><Freelancers /></PageGate>}</Route>
                      <Route path="/full-time">{() => <PageGate slug="full-time"><FullTime /></PageGate>}</Route>
                      <Route path="/authority-audit">{() => <PageGate slug="authority-audit"><AuthorityAudit /></PageGate>}</Route>
                      <Route path="/portfolio-private" component={Portfolio} />
                      <Route path="/resources">{() => <PageGate slug="resources"><Resources /></PageGate>}</Route>
                      <Route path="/about">{() => <PageGate slug="about"><About /></PageGate>}</Route>
                      <Route path="/contact">{() => <PageGate slug="contact"><Contact /></PageGate>}</Route>
                      <Route path="/internship">{() => <PageGate slug="internship"><Internship /></PageGate>}</Route>
                      <Route path="/verify/:id">{() => <PageGate slug="verify"><VerifyCertificate /></PageGate>}</Route>
                      <Route path="/verify">{() => <PageGate slug="verify"><Verify /></PageGate>}</Route>
                      <Route path="/privacy" component={Privacy} />
                      <Route path="/terms" component={Terms} />
                      <Route path="/editors-pool">{() => <PageGate slug="creator-school"><CreatorSchool /></PageGate>}</Route>
                      <Route path="/designers-pool">{() => <PageGate slug="designers-pool"><DesignersPool /></PageGate>}</Route>
                      <Route path="/thumbnail-designers">{() => <PageGate slug="thumbnail-designers"><ThumbnailDesignersPool /></PageGate>}</Route>
                      <Route path="/writers-pool">{() => <PageGate slug="writers-pool"><WritersPool /></PageGate>}</Route>
                      <Route path="/social-media-managers">{() => <PageGate slug="social-media-managers"><SocialMediaManagersPool /></PageGate>}</Route>
                      <Route path="/motion-designers">{() => <PageGate slug="motion-designers"><MotionDesignersPool /></PageGate>}</Route>
                      <Route path="/ai-creators">{() => <PageGate slug="ai-creators"><AICreatorsPool /></PageGate>}</Route>
                      <Route path="/ugc-creators">{() => <PageGate slug="ugc-creators"><UGCCreatorsPool /></PageGate>}</Route>
                      <Route path="/meme-designers">{() => <PageGate slug="meme-designers"><MemeDesignersPool /></PageGate>}</Route>
                      <Route component={NotFound} />
                    </Switch>
                  </Suspense>
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