import { useEffect, useState, useCallback } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { Plus, Trash2, Download, RefreshCw, ChevronDown, ChevronUp, Briefcase, Search, X, Calendar } from "lucide-react";
import * as XLSX from "xlsx";

import { API_BASE } from "@/lib/api";

interface Lead {
  id: number;
  type: string;
  name: string | null;
  email: string;
  data: Record<string, unknown>;
  createdAt: string;
}

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

const DATE_PRESETS = [
  { key: "all", label: "All time" },
  { key: "7d",  label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "1y",  label: "Last year" },
];
const DATE_MS: Record<string, number> = {
  "7d":  7   * 86400000,
  "30d": 30  * 86400000,
  "90d": 90  * 86400000,
  "1y":  365 * 86400000,
};

function ApplicationsPanel({ type, title }: { type: string; title: string }) {
  const { authFetch } = useAdmin();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await authFetch(`${API_BASE}/admin/leads?type=${type}`);
      const data = await r.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [type, authFetch]);

  useEffect(() => { load(); }, [load]);

  const visible = leads.filter((l) => {
    if (dateFilter !== "all") {
      const cutoff = Date.now() - DATE_MS[dateFilter];
      if (new Date(l.createdAt).getTime() < cutoff) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const name = (l.name ?? "").toLowerCase();
      const email = l.email.toLowerCase();
      const role = String(l.data.role ?? "").toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !role.includes(q)) return false;
    }
    return true;
  });

  function exportExcel() {
    const rows = visible.map((l) => ({
      ID: l.id,
      Name: l.name ?? "",
      Email: l.email,
      Phone: String(l.data.phone ?? ""),
      "Role Applied For": String(l.data.role ?? ""),
      Experience: String(l.data.experience ?? ""),
      "LinkedIn / Portfolio": String(l.data.linkedinUrl ?? ""),
      "Cover Note": String(l.data.coverNote ?? ""),
      Date: fmt(l.createdAt),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, `${title.replace(/\s+/g, "-").toLowerCase()}-applications.xlsx`);
  }

  const hasFilter = search || dateFilter !== "all";

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Briefcase size={15} className="text-[#0B0B0B]/40" />
          <span className="text-[13px] font-bold text-[#0B0B0B]">{title} Applications</span>
          <span className="ml-1 text-[11px] font-bold bg-[#0B0B0B] text-white rounded-full px-2 py-0.5">
            {hasFilter ? `${visible.length} / ${leads.length}` : leads.length}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 border border-[#0B0B0B]/12 rounded-lg hover:bg-[#0B0B0B]/5 text-[#0B0B0B]/50 transition-colors" title="Refresh">
            <RefreshCw size={13} />
          </button>
          <button
            onClick={exportExcel}
            disabled={visible.length === 0}
            className="flex items-center gap-1.5 border border-[#0B0B0B]/12 rounded-lg px-3 py-2 text-[12px] font-semibold text-[#0B0B0B]/60 hover:bg-[#0B0B0B]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={13} /> Export Excel
          </button>
        </div>
      </div>

      {/* Search + date filter toolbar */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0B0B0B]/35" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or role..."
            className="w-full pl-8 pr-8 py-2 border border-[#0B0B0B]/12 rounded-xl text-[12px] text-[#0B0B0B] placeholder-[#0B0B0B]/30 outline-none focus:border-[#0B0B0B]/30 bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0B0B0B]/30 hover:text-[#0B0B0B]">
              <X size={12} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={11} className="text-[#0B0B0B]/30 shrink-0" />
          {DATE_PRESETS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDateFilter(key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${dateFilter === key ? "bg-[#8B3A1A] border-[#8B3A1A] text-white" : "bg-white border-[#0B0B0B]/12 text-[#0B0B0B]/50 hover:border-[#0B0B0B]/25"}`}
            >
              {label}
            </button>
          ))}
          {hasFilter && (
            <button
              onClick={() => { setSearch(""); setDateFilter("all"); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#0B0B0B]/40 hover:text-[#0B0B0B] transition-colors"
            >
              <X size={10} /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-[13px] text-[#0B0B0B]/35 py-6 text-center">Loading applications...</p>
      ) : visible.length === 0 ? (
        <p className="text-[13px] text-[#0B0B0B]/30 py-6 text-center italic">
          {leads.length === 0 ? "No applications yet." : "No applications match your filters."}
        </p>
      ) : (
        <div className="rounded-xl border border-[#0B0B0B]/8 overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_140px_100px_32px] gap-0 px-4 py-2.5 bg-[#F7F7F5] border-b border-[#0B0B0B]/6">
            {["Name", "Email", "Role", "Date", ""].map((h) => (
              <span key={h} className="text-[10px] font-bold text-[#0B0B0B]/35 uppercase tracking-widest">{h}</span>
            ))}
          </div>
          {visible.map((lead) => (
            <div key={lead.id} className="border-b border-[#0B0B0B]/5 last:border-b-0">
              <button
                onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                className="w-full grid grid-cols-[1fr_1fr_140px_100px_32px] gap-0 px-4 py-3 hover:bg-[#0B0B0B]/3 transition-colors text-left items-center"
              >
                <span className="text-[13px] font-semibold text-[#0B0B0B] truncate pr-3">{lead.name || <span className="italic text-[#0B0B0B]/30">No name</span>}</span>
                <span className="text-[12px] text-[#0B0B0B]/55 truncate pr-3">{lead.email}</span>
                <span className="text-[12px] text-[#0B0B0B]/70 truncate pr-3">{String(lead.data.role ?? "")}</span>
                <span className="text-[11px] text-[#0B0B0B]/35">{fmt(lead.createdAt)}</span>
                <span className="text-[#0B0B0B]/30">{expanded === lead.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>
              </button>
              {expanded === lead.id && (
                <div className="px-4 pb-4 bg-[#FAFAFA]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 pt-3">
                    {Object.entries(lead.data).filter(([, v]) => v).map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[10px] font-bold text-[#0B0B0B]/35 uppercase tracking-wider mb-0.5">{k}</p>
                        <p className="text-[12px] text-[#0B0B0B] break-words">{String(v)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

interface FullTimeData {
  heroLabel: string;
  heroHeadline: string;
  heroSubtext: string;
  perksHeadline: string;
  perks: string[];
  rolesLabel: string;
  roles: string[];
  formHeadline: string;
  formSubtext: string;
  formSuccessHeadline: string;
  formSuccessSubtext: string;
}

const DEFAULTS: FullTimeData = {
  heroLabel: "Full-Time Careers",
  heroHeadline: "Build your career at GrowitBuddy.",
  heroSubtext: "We are a small, high-output team doing some of the most interesting content and authority work in the world. If that sounds like where you want to be, apply below.",
  perksHeadline: "Why join full-time?",
  perks: [
    "Full-time remote role with flexible hours",
    "Work directly with world-class founders and creators",
    "Competitive salary + performance bonuses",
    "Access to GrowitBuddy's proprietary frameworks and training",
    "Real ownership and impact from day one",
  ],
  rolesLabel: "Open roles",
  roles: [
    "Content Strategist",
    "Ghostwriter / Senior Writer",
    "Video Editor",
    "Social Media Manager",
    "Distribution & Growth Specialist",
    "Brand Designer",
    "Operations & Project Manager",
  ],
  formHeadline: "Apply for a full-time role",
  formSubtext: "We review every application. Expect a response within 7 business days.",
  formSuccessHeadline: "Application received!",
  formSuccessSubtext: "We review every application carefully. If you are a fit, we will reach out within 7 business days.",
};

export default function AdminFullTime() {
  const { getContent, saveContent } = useAdmin();
  const [data, setData] = useState<FullTimeData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getContent("fulltime").then((d) => {
      if (d) setData({ ...DEFAULTS, ...(d as Partial<FullTimeData>) });
    });
  }, [getContent]);

  function set<K extends keyof FullTimeData>(key: K, val: FullTimeData[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  function setListItem(key: "perks" | "roles", i: number, val: string) {
    setSaved(false);
    const next = [...data[key]];
    next[i] = val;
    setData((p) => ({ ...p, [key]: next }));
  }

  function addListItem(key: "perks" | "roles") {
    setSaved(false);
    setData((p) => ({ ...p, [key]: [...p[key], ""] }));
  }

  function removeListItem(key: "perks" | "roles", i: number) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: p[key].filter((_, idx) => idx !== i) }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent("fulltime", data as unknown as Record<string, unknown>);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Full-Time Careers Page" description="Edit hero, perks, open roles, and form text." />

      <ApplicationsPanel type="full-time" title="Full-Time Hiring" />

      <div className="space-y-5">
        <Card>
          <SectionTitle>Hero Section</SectionTitle>
          <div className="space-y-3">
            <Input label="Section Label" value={data.heroLabel} onChange={(e) => set("heroLabel", e.target.value)} />
            <Textarea label="Headline" value={data.heroHeadline} onChange={(e) => set("heroHeadline", e.target.value)} rows={2} />
            <Textarea label="Subtext" value={data.heroSubtext} onChange={(e) => set("heroSubtext", e.target.value)} rows={3} />
          </div>
        </Card>

        <Card>
          <SectionTitle>Why Join Full-Time Perks</SectionTitle>
          <Input label="Section Heading" value={data.perksHeadline} onChange={(e) => set("perksHeadline", e.target.value)} className="mb-3" />
          <div className="space-y-2">
            {data.perks.map((perk, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  className="flex-1 text-[13px] border border-[#0B0B0B]/12 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0B0B0B]/20 bg-white"
                  value={perk}
                  onChange={(e) => setListItem("perks", i, e.target.value)}
                  placeholder="Perk..."
                />
                <button onClick={() => removeListItem("perks", i)} className="p-1.5 text-[#0B0B0B]/25 hover:text-red-500 shrink-0"><Trash2 size={13} /></button>
              </div>
            ))}
            <button onClick={() => addListItem("perks")} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0B0B0B]/50 hover:text-[#0B0B0B] transition-colors">
              <Plus size={13} /> Add Perk
            </button>
          </div>
        </Card>

        <Card>
          <SectionTitle>Open Roles</SectionTitle>
          <Input label="Roles Box Label" value={data.rolesLabel} onChange={(e) => set("rolesLabel", e.target.value)} className="mb-3" />
          <div className="space-y-2">
            {data.roles.map((role, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  className="flex-1 text-[13px] border border-[#0B0B0B]/12 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0B0B0B]/20 bg-white"
                  value={role}
                  onChange={(e) => setListItem("roles", i, e.target.value)}
                  placeholder="Role title..."
                />
                <button onClick={() => removeListItem("roles", i)} className="p-1.5 text-[#0B0B0B]/25 hover:text-red-500 shrink-0"><Trash2 size={13} /></button>
              </div>
            ))}
            <button onClick={() => addListItem("roles")} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0B0B0B]/50 hover:text-[#0B0B0B] transition-colors">
              <Plus size={13} /> Add Role
            </button>
          </div>
        </Card>

        <Card>
          <SectionTitle>Application Form</SectionTitle>
          <div className="space-y-3">
            <Input label="Form Heading" value={data.formHeadline} onChange={(e) => set("formHeadline", e.target.value)} />
            <Input label="Form Subtext" value={data.formSubtext} onChange={(e) => set("formSubtext", e.target.value)} />
          </div>
        </Card>

        <Card>
          <SectionTitle>Success State</SectionTitle>
          <div className="space-y-3">
            <Input label="Success Headline" value={data.formSuccessHeadline} onChange={(e) => set("formSuccessHeadline", e.target.value)} />
            <Textarea label="Success Message" value={data.formSuccessSubtext} onChange={(e) => set("formSuccessSubtext", e.target.value)} rows={2} />
          </div>
        </Card>
      </div>

      <PageVisibilityCard slug="full-time" />
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
