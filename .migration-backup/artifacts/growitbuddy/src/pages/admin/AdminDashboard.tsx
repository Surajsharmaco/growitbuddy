import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAdmin } from "@/context/AdminContext";
import { Card } from "@/components/admin/AdminField";
import {
  Settings, Users, FileText, Briefcase, Home, Layers,
  Info, AlignLeft, Menu as MenuIcon, Inbox, TrendingUp,
  CheckCircle2, Clock, Network, Share2, BarChart2, BookOpen, Image,
} from "lucide-react";

import { API_BASE } from "@/lib/api";

interface SectionStatus { section: string; updatedAt: string; }

interface Stats {
  blogs: number;
  influencers: number;
  leads: number;
  leadsByType: Record<string, number>;
  sectionsUpdated: number;
}

const SECTION_META: Record<string, { label: string; icon: React.ReactNode; path: string; desc: string }> = {
  settings:    { label: "Settings",     icon: <Settings size={16} />,   path: "/admin/settings",    desc: "Global config & design" },
  home:        { label: "Home Page",    icon: <Home size={16} />,       path: "/admin/home",        desc: "Hero, stats, testimonials" },
  services:    { label: "Services",     icon: <Layers size={16} />,     path: "/admin/services",    desc: "Offerings & features" },
  work:        { label: "Work",         icon: <Briefcase size={16} />,  path: "/admin/work",        desc: "Portfolio & case studies" },
  influencers: { label: "Influencers",  icon: <Users size={16} />,      path: "/admin/influencers", desc: "Creator roster CRUD" },
  blog:        { label: "Blog",         icon: <FileText size={16} />,   path: "/admin/blog",        desc: "Articles & insight posts" },
  about:       { label: "About",        icon: <Info size={16} />,       path: "/admin/about",       desc: "Founder, team, values" },
  navbar:      { label: "Navbar",       icon: <MenuIcon size={16} />,   path: "/admin/navbar",      desc: "Navigation links" },
  footer:      { label: "Footer",       icon: <AlignLeft size={16} />,  path: "/admin/footer",      desc: "Footer & contact links" },
  "distribution-network": { label: "Distribution Network", icon: <Network size={16} />,  path: "/admin/distribution-network", desc: "Hero, benefits & steps" },
  "influencer-explore":   { label: "Influencer Explore",  icon: <Users size={16} />,     path: "/admin/influencer-explore",   desc: "Explore page hero & CTA" },
  "authority-audit":      { label: "Authority Audit",     icon: <BarChart2 size={16} />, path: "/admin/authority-audit",      desc: "Quiz questions & hero" },
  resources:              { label: "Resources",           icon: <BookOpen size={16} />,  path: "/admin/resources",            desc: "Frameworks & resource items" },
  media:                  { label: "Media Library",       icon: <Image size={16} />,     path: "/admin/media",                desc: "Upload & manage images" },
  "creator-school":              { label: "Editors Pool",            icon: <TrendingUp size={16} />, path: "/admin/editors-pool",             desc: "Video editors network page" },
  "pool-designers":              { label: "Designers Pool",          icon: <TrendingUp size={16} />, path: "/admin/pool-designers",           desc: "Graphic designers network page" },
  "pool-thumbnail-designers":    { label: "Thumbnail Designers",     icon: <TrendingUp size={16} />, path: "/admin/pool-thumbnail-designers", desc: "Thumbnail designers network page" },
  "pool-writers":                { label: "Writers Pool",            icon: <TrendingUp size={16} />, path: "/admin/pool-writers",             desc: "Scriptwriters network page" },
  "pool-social-managers":        { label: "Social Media Managers",   icon: <TrendingUp size={16} />, path: "/admin/pool-social-managers",     desc: "Social media managers network page" },
  "pool-motion-designers":       { label: "Motion Designers",        icon: <TrendingUp size={16} />, path: "/admin/pool-motion-designers",    desc: "Motion designers network page" },
  "pool-ai-creators":            { label: "AI Creators Pool",        icon: <TrendingUp size={16} />, path: "/admin/pool-ai-creators",         desc: "AI creators & automation network page" },
  "pool-ugc-creators":           { label: "UGC Creators Pool",       icon: <TrendingUp size={16} />, path: "/admin/pool-ugc-creators",        desc: "UGC creators network page" },
  "pool-meme-designers":         { label: "Meme Designers Pool",     icon: <TrendingUp size={16} />, path: "/admin/pool-meme-designers",      desc: "Meme designers network page" },
};

const TYPE_META_DASH: Record<string, { label: string; color: string }> = {
  contact:     { label: "Contact",    color: "#2563eb" },
  creator:     { label: "Influencer", color: "#1E293B" },
  page:        { label: "Page Owner", color: "#0891b2" },
  freelancer:  { label: "Freelancer", color: "#059669" },
  "full-time": { label: "Full-Time",  color: "#d97706" },
  internship:  { label: "Internship", color: "#be185d" },
  newsletter:  { label: "Newsletter", color: "#db2777" },
};

export default function AdminDashboard() {
  const { getContent, authFetch } = useAdmin();
  const [sections, setSections] = useState<SectionStatus[]>([]);
  const [stats, setStats] = useState<Stats>({ blogs: 0, influencers: 0, leads: 0, leadsByType: {}, sectionsUpdated: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [secRes, leadsRes, blogData, infData] = await Promise.all([
          authFetch(`${API_BASE}/admin/sections`).then((r) => r.json()),
          authFetch(`${API_BASE}/admin/leads/stats`).then((r) => r.json()),
          getContent("blog"),
          getContent("influencers"),
        ]);

        const secs: SectionStatus[] = Array.isArray(secRes) ? secRes : [];
        setSections(secs);

        const blogCount = Array.isArray((blogData as { posts?: unknown[] })?.posts)
          ? (blogData as { posts: unknown[] }).posts.length
          : 0;
        const infCount = Array.isArray((infData as { items?: unknown[] })?.items)
          ? (infData as { items: unknown[] }).items.length
          : 0;

        setStats({
          blogs: blogCount,
          influencers: infCount,
          leads: leadsRes?.total ?? 0,
          leadsByType: leadsRes?.byType ?? {},
          sectionsUpdated: secs.length,
        });
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getContent]);

  const recentActivity = [...sections]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-[22px] font-black tracking-tight text-[#0B0B0B]">Dashboard</h1>
        <p className="text-[14px] text-[#0B0B0B]/50 mt-1">Your GrowitBuddy CMS overview</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {[
          { label: "Blog Posts", value: stats.blogs, icon: <FileText size={18} />, path: "/admin/blog", color: "#0B0B0B" },
          { label: "Influencers", value: stats.influencers, icon: <Users size={18} />, path: "/admin/influencers", color: "#0B0B0B" },
          { label: "Total Leads", value: stats.leads, icon: <Inbox size={18} />, path: "/admin/leads", color: "#0B0B0B" },
          { label: "Sections Saved", value: stats.sectionsUpdated, icon: <CheckCircle2 size={18} />, path: "/admin", color: "#0B0B0B" },
        ].map((s) => (
          <Link key={s.label} href={s.path}>
            <div className="bg-white border border-[#0B0B0B]/8 rounded-2xl p-5 cursor-pointer hover:border-[#0B0B0B]/20 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#0B0B0B]/6 flex items-center justify-center text-[#0B0B0B]/50 group-hover:bg-[#0B0B0B] group-hover:text-white transition-all">
                  {s.icon}
                </div>
                <TrendingUp size={13} className="text-[#0B0B0B]/15" />
              </div>
              <p className="text-[30px] font-black tracking-tight text-[#0B0B0B] leading-none">
                {loading ? <span className="text-[#0B0B0B]/20">--</span> : s.value}
              </p>
              <p className="text-[12px] text-[#0B0B0B]/40 mt-1.5 font-medium">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7">
        {/* Lead breakdown */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-bold text-[#0B0B0B]">Leads by Type</h2>
            <Link href="/admin/leads">
              <span className="text-[11px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] cursor-pointer transition-colors">View all</span>
            </Link>
          </div>
          {stats.leads === 0 ? (
            <p className="text-[12px] text-[#0B0B0B]/30 py-4 text-center">No leads yet</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(stats.leadsByType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                const pct = stats.leads > 0 ? Math.round((count / stats.leads) * 100) : 0;
                const meta = TYPE_META_DASH[type] ?? { label: type, color: "#6b7280" };
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-semibold text-[#0B0B0B]">{meta.label}</span>
                      <span className="text-[11px] text-[#0B0B0B]/40">{count}</span>
                    </div>
                    <div className="h-1.5 bg-[#0B0B0B]/6 rounded-full overflow-hidden">
                      <div style={{ width: `${pct}%`, background: meta.color }} className="h-full rounded-full" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <h2 className="text-[13px] font-bold text-[#0B0B0B] mb-4">Recent Saves</h2>
          {recentActivity.length === 0 ? (
            <p className="text-[12px] text-[#0B0B0B]/30 py-4 text-center">No sections saved yet</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((s) => {
                const meta = SECTION_META[s.section];
                return (
                  <Link key={s.section} href={meta?.path ?? "/admin"}>
                    <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0B0B0B]/4 cursor-pointer transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-[#0B0B0B]/6 flex items-center justify-center text-[#0B0B0B]/50 shrink-0">
                        {meta?.icon ?? <Settings size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#0B0B0B] truncate">{meta?.label ?? s.section}</p>
                        <p className="text-[11px] text-[#0B0B0B]/35 truncate">{meta?.desc}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[#0B0B0B]/30 shrink-0">
                        <Clock size={11} />
                        <span className="text-[10px]">{new Date(s.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Section grid */}
      <h2 className="text-[13px] font-bold text-[#0B0B0B] mb-3">All Sections</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(SECTION_META).map(([key, meta]) => {
          const saved = sections.some((s) => s.section === key);
          const row = sections.find((s) => s.section === key);
          return (
            <Link key={key} href={meta.path}>
              <div className="bg-white rounded-2xl border border-[#0B0B0B]/8 p-5 cursor-pointer hover:border-[#0B0B0B]/20 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0B0B0B]/6 flex items-center justify-center text-[#0B0B0B]/60 group-hover:bg-[#0B0B0B] group-hover:text-white transition-all">
                    {meta.icon}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${saved ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                    {saved ? "Saved" : "Default"}
                  </span>
                </div>
                <h3 className="text-[14px] font-bold text-[#0B0B0B] mb-1">{meta.label}</h3>
                <p className="text-[12px] text-[#0B0B0B]/45">{meta.desc}</p>
                {saved && row && (
                  <p className="text-[10px] text-[#0B0B0B]/25 mt-2">
                    Updated {new Date(row.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
