import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { prefetchSections, usePublicContent } from "@/hooks/usePublicContent";
import { prefetchInfluencers } from "@/hooks/useLiveInfluencers";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import Work from "@/pages/Work";
import Framework from "@/pages/Framework";
import Insights from "@/pages/Insights";
import InsightDetail from "@/pages/InsightDetail";
import Creators from "@/pages/Creators";
import Freelancers from "@/pages/Freelancers";
import InfluencerExplore from "@/pages/InfluencerExplore";
import DistributionNetwork from "@/pages/DistributionNetwork";
import JoinNetwork from "@/pages/JoinNetwork";
import PageOwnerApply from "@/pages/PageOwnerApply";
import FullTime from "@/pages/FullTime";
import AuthorityAudit from "@/pages/AuthorityAudit";
import Portfolio from "@/pages/Portfolio";
import AdminPortfolio from "@/pages/admin/AdminPortfolio";
import Resources from "@/pages/Resources";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Internship from "@/pages/Internship";
import Verify from "@/pages/Verify";
import VerifyCertificate from "@/pages/VerifyCertificate";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import NotFound from "@/pages/not-found";
import CustomCursor from "@/components/effects/CustomCursor";
import PageIntro from "@/components/effects/PageIntro";
import ScrollToTop from "@/components/ScrollToTop";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminInfluencers from "@/pages/admin/AdminInfluencers";
import AdminBlog from "@/pages/admin/AdminBlog";
import AdminServices from "@/pages/admin/AdminServices";
import AdminWork from "@/pages/admin/AdminWork";
import AdminHome from "@/pages/admin/AdminHome";
import AdminAbout from "@/pages/admin/AdminAbout";
import AdminNavbar from "@/pages/admin/AdminNavbar";
import AdminFooter from "@/pages/admin/AdminFooter";
import AdminLeads from "@/pages/admin/AdminLeads";
import AdminCertificates from "@/pages/admin/AdminCertificates";
import AdminContact from "@/pages/admin/AdminContact";
import AdminJoinNetwork from "@/pages/admin/AdminJoinNetwork";
import AdminFreelancers from "@/pages/admin/AdminFreelancers";
import AdminFullTime from "@/pages/admin/AdminFullTime";
import AdminFramework from "@/pages/admin/AdminFramework";
import AdminDistributionNetwork from "@/pages/admin/AdminDistributionNetwork";
import AdminDistributionPages from "@/pages/admin/AdminDistributionPages";
import AdminInfluencerExplore from "@/pages/admin/AdminInfluencerExplore";
import AdminAuthorityAudit from "@/pages/admin/AdminAuthorityAudit";
import AdminResources from "@/pages/admin/AdminResources";
import AdminMediaLibrary from "@/pages/admin/AdminMediaLibrary";
import AdminTeamMembers from "@/pages/admin/AdminTeamMembers";
import AdminOptimize from "@/pages/admin/AdminOptimize";
import AdminLogos from "@/pages/admin/AdminLogos";
import CreatorSchool from "@/pages/CreatorSchool";
import AdminCreatorSchool from "@/pages/admin/AdminCreatorSchool";
import DesignersPool from "@/pages/DesignersPool";
import ThumbnailDesignersPool from "@/pages/ThumbnailDesignersPool";
import WritersPool from "@/pages/WritersPool";
import SocialMediaManagersPool from "@/pages/SocialMediaManagersPool";
import MotionDesignersPool from "@/pages/MotionDesignersPool";
import AICreatorsPool from "@/pages/AICreatorsPool";
import UGCCreatorsPool from "@/pages/UGCCreatorsPool";
import MemeDesignersPool from "@/pages/MemeDesignersPool";
import AdminTalentPool from "@/pages/admin/AdminTalentPool";
import AdminPageVisibility from "@/pages/admin/AdminPageVisibility";
import { PageGate } from "@/components/PageGate";

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
  return <AdminLayout>{children}</AdminLayout>;
}

function AdminRoutes() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/settings">
        {() => <AdminGuard><AdminSettings /></AdminGuard>}
      </Route>
      <Route path="/admin/home">
        {() => <AdminGuard><AdminHome /></AdminGuard>}
      </Route>
      <Route path="/admin/services">
        {() => <AdminGuard><AdminServices /></AdminGuard>}
      </Route>
      <Route path="/admin/work">
        {() => <AdminGuard><AdminWork /></AdminGuard>}
      </Route>
      <Route path="/admin/influencers">
        {() => <AdminGuard><AdminInfluencers /></AdminGuard>}
      </Route>
      <Route path="/admin/blog">
        {() => <AdminGuard><AdminBlog /></AdminGuard>}
      </Route>
      <Route path="/admin/about">
        {() => <AdminGuard><AdminAbout /></AdminGuard>}
      </Route>
      <Route path="/admin/navbar">
        {() => <AdminGuard><AdminNavbar /></AdminGuard>}
      </Route>
      <Route path="/admin/footer">
        {() => <AdminGuard><AdminFooter /></AdminGuard>}
      </Route>
      <Route path="/admin/leads">
        {() => <AdminGuard><AdminLeads /></AdminGuard>}
      </Route>
      <Route path="/admin/certificates">
        {() => <AdminGuard><AdminCertificates /></AdminGuard>}
      </Route>
      <Route path="/admin/contact">
        {() => <AdminGuard><AdminContact /></AdminGuard>}
      </Route>
      <Route path="/admin/join-network">
        {() => <AdminGuard><AdminJoinNetwork /></AdminGuard>}
      </Route>
      <Route path="/admin/freelancers-page">
        {() => <AdminGuard><AdminFreelancers /></AdminGuard>}
      </Route>
      <Route path="/admin/full-time-page">
        {() => <AdminGuard><AdminFullTime /></AdminGuard>}
      </Route>
      <Route path="/admin/framework">
        {() => <AdminGuard><AdminFramework /></AdminGuard>}
      </Route>
      <Route path="/admin/distribution-network">
        {() => <AdminGuard><AdminDistributionNetwork /></AdminGuard>}
      </Route>
      <Route path="/admin/distribution-pages">
        {() => <AdminGuard><AdminDistributionPages /></AdminGuard>}
      </Route>
      <Route path="/admin/influencer-explore">
        {() => <AdminGuard><AdminInfluencerExplore /></AdminGuard>}
      </Route>
      <Route path="/admin/authority-audit">
        {() => <AdminGuard><AdminAuthorityAudit /></AdminGuard>}
      </Route>
      <Route path="/admin/resources">
        {() => <AdminGuard><AdminResources /></AdminGuard>}
      </Route>
      <Route path="/admin/media">
        {() => <AdminGuard><AdminMediaLibrary /></AdminGuard>}
      </Route>
      <Route path="/admin/team">
        {() => <AdminGuard><AdminTeamMembers /></AdminGuard>}
      </Route>
      <Route path="/admin/optimize">
        {() => <AdminGuard><AdminOptimize /></AdminGuard>}
      </Route>
      <Route path="/admin/portfolio">
        {() => <AdminGuard><AdminPortfolio /></AdminGuard>}
      </Route>
      <Route path="/admin/logos">
        {() => <AdminGuard><AdminLogos /></AdminGuard>}
      </Route>
      <Route path="/admin/editors-pool">
        {() => <AdminGuard><AdminCreatorSchool /></AdminGuard>}
      </Route>
      <Route path="/admin/pool-designers">
        {() => <AdminGuard><AdminTalentPool poolKey="pool-designers" label="Designers Pool" description="Manage the /designers-pool landing page." pageUrl="/designers-pool" /></AdminGuard>}
      </Route>
      <Route path="/admin/pool-thumbnail-designers">
        {() => <AdminGuard><AdminTalentPool poolKey="pool-thumbnail-designers" label="Thumbnail Designers Pool" description="Manage the /thumbnail-designers landing page." pageUrl="/thumbnail-designers" /></AdminGuard>}
      </Route>
      <Route path="/admin/pool-writers">
        {() => <AdminGuard><AdminTalentPool poolKey="pool-writers" label="Writers Pool" description="Manage the /writers-pool landing page." pageUrl="/writers-pool" /></AdminGuard>}
      </Route>
      <Route path="/admin/pool-social-managers">
        {() => <AdminGuard><AdminTalentPool poolKey="pool-social-managers" label="Social Media Managers Pool" description="Manage the /social-media-managers landing page." pageUrl="/social-media-managers" /></AdminGuard>}
      </Route>
      <Route path="/admin/pool-motion-designers">
        {() => <AdminGuard><AdminTalentPool poolKey="pool-motion-designers" label="Motion Designers Pool" description="Manage the /motion-designers landing page." pageUrl="/motion-designers" /></AdminGuard>}
      </Route>
      <Route path="/admin/pool-ai-creators">
        {() => <AdminGuard><AdminTalentPool poolKey="pool-ai-creators" label="AI Creators Pool" description="Manage the /ai-creators landing page." pageUrl="/ai-creators" /></AdminGuard>}
      </Route>
      <Route path="/admin/pool-ugc-creators">
        {() => <AdminGuard><AdminTalentPool poolKey="pool-ugc-creators" label="UGC Creators Pool" description="Manage the /ugc-creators landing page." pageUrl="/ugc-creators" /></AdminGuard>}
      </Route>
      <Route path="/admin/pool-meme-designers">
        {() => <AdminGuard><AdminTalentPool poolKey="pool-meme-designers" label="Meme Designers Pool" description="Manage the /meme-designers landing page." pageUrl="/meme-designers" /></AdminGuard>}
      </Route>
      <Route path="/admin/page-visibility">
        {() => <AdminGuard><AdminPageVisibility /></AdminGuard>}
      </Route>
      <Route path="/admin">
        {() => <AdminGuard><AdminDashboard /></AdminGuard>}
      </Route>
    </Switch>
  );
}

const ALL_SECTIONS = [
  "home", "about", "contact", "framework", "services", "work",
  "resources", "joinnetwork", "freelancers", "fulltime",
  "influencer-explore", "authority-audit", "distribution-network",
  "distribution-pages", "blog", "creator-school", "settings",
  "pool-designers", "pool-thumbnail-designers", "pool-writers",
  "pool-social-managers", "pool-motion-designers", "pool-ai-creators", "pool-ugc-creators",
  "pool-meme-designers", "page_visibility",
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
  // Fire all content fetches immediately on app load.
  // By the time the user navigates to any page, the cache is warm
  // and pages render with real data from the very first paint.
  useEffect(() => {
    prefetchSections(ALL_SECTIONS);
    prefetchInfluencers();
  }, []);

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <AdminProvider>
        <FaviconInjector />
        <ScrollToTop />
        <CustomCursor />
        <Switch>
          {/* All admin routes */}
          <Route path="/admin/:rest*" component={AdminRoutes} />
          <Route path="/admin" component={AdminRoutes} />

          {/* Public site */}
          <Route>
            {() => (
              <>
                <PageIntro />
                <Layout>
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
                </Layout>
              </>
            )}
          </Route>
        </Switch>
      </AdminProvider>
    </WouterRouter>
  );
}

export default App;
