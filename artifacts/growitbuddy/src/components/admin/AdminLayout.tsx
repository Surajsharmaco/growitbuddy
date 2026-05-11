import { Link, useLocation } from "wouter";
import { useAdmin } from "@/context/AdminContext";
import {
  LayoutDashboard, Settings, Users, FileText, Briefcase,
  Home, Layers, Menu as MenuIcon, AlignLeft, Info, LogOut,
  ChevronRight, Inbox, Mail, GitBranch, UserPlus, Building2, Network, Image,
  Share2, Scan, BookOpen, ShieldCheck, UserCog, Zap, Play, TrendingUp, EyeOff,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

interface NavGroup { label: string; items: NavItem[]; }
interface NavItem { label: string; path: string; icon: ReactNode; permission?: string; superOnly?: boolean; }

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", path: "/admin", icon: <LayoutDashboard size={15} /> },
      { label: "Team Members", path: "/admin/team", icon: <UserCog size={15} />, superOnly: true },
      { label: "Leads & CRM", path: "/admin/leads", icon: <Inbox size={15} />, permission: "leads" },
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
      { label: "Distribution Network", path: "/admin/distribution-network", icon: <Share2 size={15} />, permission: "distribution-network" },
      { label: "Distribution Pages", path: "/admin/distribution-pages", icon: <Network size={15} />, permission: "distribution-pages" },
      { label: "Authority Audit", path: "/admin/authority-audit", icon: <Scan size={15} />, permission: "authority-audit" },
      { label: "Join Network", path: "/admin/join-network", icon: <Network size={15} />, permission: "join-network" },
      { label: "Freelancers Page", path: "/admin/freelancers-page", icon: <UserPlus size={15} />, permission: "freelancers" },
      { label: "Full-Time Page", path: "/admin/full-time-page", icon: <Building2 size={15} />, permission: "full-time" },
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
    ],
  },
  {
    label: "Assets",
    items: [
      { label: "Media Library", path: "/admin/media", icon: <Image size={15} />, permission: "media" },
      { label: "Client Logos", path: "/admin/logos", icon: <Image size={15} />, permission: "media" },
      { label: "Private Portfolio", path: "/admin/portfolio", icon: <Play size={15} />, superOnly: true },
    ],
  },
  {
    label: "Site",
    items: [
      { label: "Navbar", path: "/admin/navbar", icon: <MenuIcon size={15} />, permission: "navbar" },
      { label: "Footer", path: "/admin/footer", icon: <AlignLeft size={15} />, permission: "footer" },
      { label: "Page Visibility", path: "/admin/page-visibility", icon: <EyeOff size={15} />, superOnly: true },
      { label: "Settings", path: "/admin/settings", icon: <Settings size={15} />, permission: "settings" },
      { label: "Optimize", path: "/admin/optimize", icon: <Zap size={15} />, superOnly: true },
    ],
  },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { logout, hasPermission, isSuperAdmin, role } = useAdmin();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(path: string) {
    if (path === "/admin") return location === "/admin";
    return location.startsWith(path);
  }

  function canSee(item: NavItem): boolean {
    if (item.superOnly) return isSuperAdmin;
    if (!item.permission) return true;
    return hasPermission(item.permission);
  }

  const visibleGroups = navGroups
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
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
