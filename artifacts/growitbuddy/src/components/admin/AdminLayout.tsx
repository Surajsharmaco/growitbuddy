import { Link, useLocation } from "wouter";
import { useAdmin } from "@/context/AdminContext";
import {
  LayoutDashboard, Settings, Users, FileText, Briefcase,
  Home, Layers, Menu as MenuIcon, AlignLeft, Info, LogOut,
  ChevronRight, Inbox, Mail, GitBranch, UserPlus, Building2, Network, Image,
  Share2, Scan, BookOpen, ShieldCheck, UserCog, Zap, Play, TrendingUp, EyeOff, Search, Copy as CopyIcon, Link2,
  DownloadCloud,
} from "lucide-react";
import { VariantBanner } from "@/components/admin/VariantBanner";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { API_BASE } from "@/lib/api";
import { findVariantSource } from "@/lib/variantSources";

interface NavGroup { label: string; items: NavItem[]; }
interface NavItem { label: string; path: string; icon: ReactNode; permission?: string; anyPermission?: string[]; superOnly?: boolean; }

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", path: "/admin", icon: <LayoutDashboard size={15} /> },
      { label: "Team Members", path: "/admin/team", icon: <UserCog size={15} />, superOnly: true },
      { label: "Leads & CRM", path: "/admin/leads", icon: <Inbox size={15} />, permission: "leads" },
      { label: "Pool Submissions", path: "/admin/talent-pool-leads", icon: <Users size={15} />, permission: "leads" },
      { label: "Certificates", path: "/admin/certificates", icon: <ShieldCheck size={15} />, permission: "certificates" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Home Page", path: "/admin/home", icon: <Home size={15} />, permission: "home" },
      { label: "Services", path: "/admin/services", icon: <Layers size={15} />, permission: "services" },
      { label: "Framework", path: "/admin/framework", icon: <GitBranch size={15} />, permission: "framework" },
      { label: "Work", path: "/admin/work", icon: <Briefcase size={15} />, permission: "work" },
      { label: "Blog / Insights", path: "/admin/blog", icon: <FileText size={15} />, permission: "blog" },
      { label: "Resources", path: "/admin/resources", icon: <BookOpen size={15} />, permission: "resources" },
      { label: "About", path: "/admin/about", icon: <Info size={15} />, permission: "about" },
      { label: "Contact", path: "/admin/contact", icon: <Mail size={15} />, permission: "contact" },
    ],
  },
  {
    label: "Network & Hiring",
    items: [
      { label: "Influencers", path: "/admin/influencers", icon: <Users size={15} />, permission: "influencers" },
      { label: "Influencer Explore", path: "/admin/influencer-explore", icon: <UserPlus size={15} />, permission: "influencer-explore" },
      { label: "Distribution Network", path: "/admin/distribution-network", icon: <Share2 size={15} />, permission: "distribution-network" },
      { label: "Distribution Pages", path: "/admin/distribution-pages", icon: <Network size={15} />, permission: "distribution-pages" },
      { label: "Authority Audit", path: "/admin/authority-audit", icon: <Scan size={15} />, permission: "authority-audit" },
      { label: "Join Network", path: "/admin/join-network", icon: <Network size={15} />, permission: "join-network" },
      { label: "Creators Page Form", path: "/admin/creators-form", icon: <UserPlus size={15} />, permission: "creators-form" },
      { label: "Page Owner Form", path: "/admin/page-owner-form", icon: <Building2 size={15} />, permission: "page-owner-form" },
      { label: "Careers Page", path: "/admin/career", icon: <Briefcase size={15} />, anyPermission: ["freelancers", "full-time", "internship"] },
    ],
  },
  {
    label: "Talent Pools",
    items: [
      { label: "Editors Pool",           path: "/admin/editors-pool",             icon: <TrendingUp size={15} />, permission: "creator-school" },
      { label: "Designers Pool",         path: "/admin/pool-designers",           icon: <TrendingUp size={15} />, permission: "creator-school" },
      { label: "Thumbnail Designers",    path: "/admin/pool-thumbnail-designers", icon: <TrendingUp size={15} />, permission: "creator-school" },
      { label: "Writers Pool",           path: "/admin/pool-writers",             icon: <TrendingUp size={15} />, permission: "creator-school" },
      { label: "Social Media Managers",  path: "/admin/pool-social-managers",     icon: <TrendingUp size={15} />, permission: "creator-school" },
      { label: "Motion Designers",       path: "/admin/pool-motion-designers",    icon: <TrendingUp size={15} />, permission: "creator-school" },
      { label: "AI Creators",            path: "/admin/pool-ai-creators",         icon: <TrendingUp size={15} />, permission: "creator-school" },
      { label: "UGC Creators",           path: "/admin/pool-ugc-creators",        icon: <TrendingUp size={15} />, permission: "creator-school" },
      { label: "Meme Designers",         path: "/admin/pool-meme-designers",      icon: <TrendingUp size={15} />, permission: "creator-school" },
      { label: "Video Editors",          path: "/admin/pool-editors",             icon: <TrendingUp size={15} />, permission: "creator-school" },
    ],
  },
  {
    label: "Assets",
    items: [
      { label: "Media Library", path: "/admin/media", icon: <Image size={15} />, permission: "media" },
      { label: "Client Logos", path: "/admin/logos", icon: <Image size={15} />, permission: "media" },
      { label: "Private Portfolio", path: "/admin/portfolio", icon: <Play size={15} />, superOnly: true },
      { label: "Portfolio Share Links", path: "/admin/portfolio-shares", icon: <Play size={15} />, superOnly: true },
    ],
  },
  {
    label: "Site",
    items: [
      { label: "Navbar", path: "/admin/navbar", icon: <MenuIcon size={15} />, permission: "navbar" },
      { label: "Footer", path: "/admin/footer", icon: <AlignLeft size={15} />, permission: "footer" },
      { label: "Links Page", path: "/admin/links", icon: <Link2 size={15} />, permission: "links" },
      { label: "Privacy Policy", path: "/admin/privacy", icon: <ShieldCheck size={15} />, permission: "privacy" },
      { label: "Terms & Conditions", path: "/admin/terms", icon: <FileText size={15} />, permission: "terms" },
      { label: "SEO Guide", path: "/admin/seo-guide", icon: <BookOpen size={15} />, permission: "seo-guide" },
      { label: "Site Guide", path: "/admin/site-guide", icon: <BookOpen size={15} />, permission: "site-guide" },
      { label: "Page Visibility", path: "/admin/page-visibility", icon: <EyeOff size={15} />, superOnly: true },
      { label: "Page Variants", path: "/admin/page-variants", icon: <CopyIcon size={15} />, superOnly: true },
      { label: "SEO Control", path: "/admin/seo", icon: <Search size={15} />, superOnly: true },
      { label: "Settings", path: "/admin/settings", icon: <Settings size={15} />, permission: "settings" },
      { label: "Optimize", path: "/admin/optimize", icon: <Zap size={15} />, superOnly: true },
      { label: "Backup / Migration", path: "/admin/backup", icon: <DownloadCloud size={15} />, superOnly: true },
    ],
  },
];

// Single source of truth for route-level access control. Derived from the sidebar
// navGroups so the AdminGuard (direct-URL navigation) and the sidebar visibility
// can never drift apart.
export type NavGating = { permission?: string; anyPermission?: string[]; superOnly?: boolean };
export const NAV_GATING: Record<string, NavGating> = navGroups.reduce((acc, g) => {
  for (const it of g.items) {
    acc[it.path] = { permission: it.permission, anyPermission: it.anyPermission, superOnly: it.superOnly };
  }
  return acc;
}, {} as Record<string, NavGating>);

interface VariantNavRow { id: number; slug: string; sourceKey: string; label: string; isLive: boolean; }

export function AdminLayout({ children }: { children: ReactNode }) {
  const { logout, hasPermission, isSuperAdmin, role, authFetch } = useAdmin();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // ── Published Variants in the sidebar ────────────────────────────────────
  // Fetch live variants and render them as a dedicated nav group so admin can
  // jump straight to a variant editor without going through Page Variants
  // list. Refreshes when the variants list changes (cross-tab "storage"
  // broadcast from AdminPageVariants save) or when the admin returns to the
  // tab, so newly-published variants appear immediately.
  const [variants, setVariants] = useState<VariantNavRow[]>([]);
  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    function load() {
      authFetch(`${API_BASE}/admin/variants`)
        .then((r) => (r.ok ? r.json() : []))
        .then((rows: VariantNavRow[]) => { if (!cancelled) setVariants(Array.isArray(rows) ? rows : []); })
        .catch(() => { /* leave previous list */ });
    }
    load();
    // Cross-tab refresh: AdminPageVariants doesn't broadcast yet, but the
    // generic "gb-variants-updated" key gives us a hook for future use. We
    // also refresh on tab focus so any change made elsewhere shows up.
    function onStorage(e: StorageEvent) { if (e.key === "gb-variants-updated") load(); }
    function onVisible() { if (document.visibilityState === "visible") load(); }
    function onSameTab() { load(); }
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    // Same-tab event — storage doesn't fire in the originating tab, so the
    // Page Variants admin form dispatches a CustomEvent after saves.
    window.addEventListener("gb-variants-updated", onSameTab);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("gb-variants-updated", onSameTab);
    };
  }, [isSuperAdmin, authFetch]);

  // Build a synthetic nav group from LIVE variants only. Each item links to
  // the source page's existing admin editor with ?variant=<slug> appended —
  // the VariantBanner + AdminContext make the editing experience seamless.
  const variantGroup: NavGroup | null = (() => {
    if (!isSuperAdmin) return null;
    const live = variants.filter((v) => v.isLive);
    if (live.length === 0) return null;
    const items: NavItem[] = live
      .map((v) => {
        const src = findVariantSource(v.sourceKey);
        if (!src) return null;
        return {
          label: v.label || `/${v.slug}`,
          path: `${src.adminPath}?variant=${encodeURIComponent(v.slug)}`,
          icon: <CopyIcon size={15} />,
          superOnly: true,
        } as NavItem;
      })
      .filter((x): x is NavItem => x !== null)
      .sort((a, b) => a.label.localeCompare(b.label));
    return items.length > 0 ? { label: "Published Variants", items } : null;
  })();

  // isActive must distinguish variant routes from their base page — e.g.
  // /admin/home?variant=home-students must NOT highlight the base "Home Page"
  // nav item. We parse the query string for ?variant= and treat any href
  // containing it as a distinct route.
  function isActive(path: string) {
    if (path === "/admin") return location === "/admin" && !currentVariantSlug();
    const [hrefPath, hrefQuery = ""] = path.split("?");
    const hrefVariant = new URLSearchParams(hrefQuery).get("variant") ?? "";
    const curVariant = currentVariantSlug() ?? "";
    if (hrefVariant) {
      // Variant nav item — match only when path AND variant slug match exactly.
      return location.startsWith(hrefPath) && curVariant === hrefVariant;
    }
    // Base nav item — match path but only when NO variant is active, so the
    // base "Home Page" item doesn't light up while editing a variant of it.
    return location.startsWith(hrefPath) && !curVariant;
  }

  function currentVariantSlug(): string | null {
    try { return new URLSearchParams(window.location.search).get("variant"); }
    catch { return null; }
  }

  function canSee(item: NavItem): boolean {
    if (item.superOnly) return isSuperAdmin;
    if (item.anyPermission?.length) return item.anyPermission.some((p) => hasPermission(p));
    if (!item.permission) return true;
    return hasPermission(item.permission);
  }

  const visibleGroups = [...navGroups, ...(variantGroup ? [variantGroup] : [])]
    .map((g) => ({ ...g, items: g.items.filter(canSee) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="h-screen flex overflow-hidden bg-[#F7F7F5]" style={{ fontFamily: "Inter, sans-serif" }}>
      <aside
        className={`flex flex-col bg-[#0B0B0B] text-white transition-all duration-200 shrink-0 ${collapsed ? "w-14" : "w-56"}`}
        style={{ height: "100vh" }}
      >
        <div className="flex items-center justify-between px-3 py-4 border-b border-white/10">
          {!collapsed && (
            <div>
              <span className="text-[13px] font-black tracking-tighter text-white">GrowitBuddy</span>
              {role === "member" && (
                <span className="block text-[9px] text-white/30 mt-0.5 tracking-widest uppercase">Team</span>
              )}
            </div>
          )}
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors ml-auto"
          >
            <ChevronRight size={14} className={`transition-transform ${collapsed ? "" : "rotate-180"}`} />
          </button>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {visibleGroups.map((group) => (
            <div key={group.label} className="mb-1">
              {!collapsed && (
                <p className="px-4 mb-1 text-[9px] font-bold tracking-[0.15em] text-white/25 uppercase">{group.label}</p>
              )}
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-lg text-[13px] transition-colors ${
                      active ? "bg-white/15 text-white font-semibold" : "text-white/45 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-2">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-[13px] text-white/35 hover:text-white hover:bg-white/8 transition-colors"
          >
            <LogOut size={15} className="shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <VariantBanner />
          {children}
        </div>
      </main>
    </div>
  );
}
