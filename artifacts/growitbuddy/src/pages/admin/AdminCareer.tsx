import { useEffect, useState, useCallback, useMemo } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { BulkSelectionBar, CollectionSelectionCheckbox } from "@/components/admin/BulkSelectionBar";
import { Plus, Trash2, Download, RefreshCw, ChevronDown, ChevronUp, Search, X, Calendar, Briefcase, GraduationCap, UserPlus } from "lucide-react";
import * as XLSX from "xlsx";

import { API_BASE } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────
type Tab = "full-time" | "internship" | "freelancer";

interface Lead {
  id: number;
  type: string;
  name: string | null;
  email: string;
  data: Record<string, unknown>;
  createdAt: string;
}

import { FULLTIME_DEFAULTS as FT_DEFAULTS, type FullTimePageData as FullTimeData } from "@/lib/fulltimeDefaults";
import { FREELANCERS_DEFAULTS as FL_DEFAULTS, type FreelancersPageData as FreelancersData } from "@/lib/freelancersDefaults";
import { INTERNSHIP_DEFAULTS as IN_DEFAULTS, type InternshipPageData as InternshipData } from "@/lib/internshipDefaults";

// ── Applications Panel ───────────────────────────────────────────────────────
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
const DATE_MS: Record<string, number> = { "7d": 7*86400000, "30d": 30*86400000, "90d": 90*86400000, "1y": 365*86400000 };

const TYPE_LABELS: Record<Tab, string> = {
  "full-time":  "Full-Time",
  "internship": "Internship",
  "freelancer": "Talent Network",
};

function ApplicationsPanel({ type }: { type: Tab }) {
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
      if (r.ok) {
        const j = await r.json();
        setLeads(Array.isArray(j) ? j : (j?.leads ?? []));
      }
    } finally { setLoading(false); }
  }, [authFetch, type]);

  useEffect(() => { load(); }, [load]);

  const cutoff = dateFilter === "all" ? 0 : Date.now() - (DATE_MS[dateFilter] ?? 0);
  const filtered = leads.filter((l) => {
    if (cutoff && new Date(l.createdAt).getTime() < cutoff) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (l.name?.toLowerCase().includes(s)) || l.email.toLowerCase().includes(s) ||
      JSON.stringify(l.data).toLowerCase().includes(s);
  });

  function exportXlsx() {
    const rows = filtered.map((l) => ({ id: l.id, name: l.name, email: l.email, createdAt: l.createdAt, ...l.data }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, TYPE_LABELS[type]);
    XLSX.writeFile(wb, `${type}-leads-${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <SectionTitle>{TYPE_LABELS[type]} Applications ({filtered.length})</SectionTitle>
        <div className="flex gap-2">
          <button onClick={load} className="text-[12px] flex items-center gap-1 px-2.5 py-1.5 border border-[#0B0B0B]/10 rounded-lg hover:bg-[#0B0B0B]/5">
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={exportXlsx} disabled={!filtered.length} className="text-[12px] flex items-center gap-1 px-2.5 py-1.5 border border-[#0B0B0B]/10 rounded-lg hover:bg-[#0B0B0B]/5 disabled:opacity-50">
            <Download size={12} /> Excel
          </button>
        </div>
      </div>
      <div className="flex gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#0B0B0B]/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, or details..."
            className="w-full text-[12px] border border-[#0B0B0B]/10 rounded-lg pl-7 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0B0B0B]/20 bg-white" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#0B0B0B]/30 hover:text-[#0B0B0B]"><X size={12} /></button>}
        </div>
        <div className="relative">
          <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#0B0B0B]/30 pointer-events-none" />
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="text-[12px] border border-[#0B0B0B]/10 rounded-lg pl-7 pr-3 py-1.5 bg-white focus:outline-none">
            {DATE_PRESETS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </div>
      </div>
      {loading ? (
        <p className="text-[12px] text-[#0B0B0B]/50">Loading…</p>
      ) : !filtered.length ? (
        <p className="text-[12px] text-[#0B0B0B]/50">No applications yet.</p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((l) => (
            <div key={l.id} className="border border-[#0B0B0B]/8 rounded-lg overflow-hidden bg-white">
              <button onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-[#0B0B0B]/3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#0B0B0B] truncate">{l.name || "(no name)"} <span className="text-[#0B0B0B]/45 font-normal">— {l.email}</span></p>
                  <p className="text-[11px] text-[#0B0B0B]/40 mt-0.5">{fmt(l.createdAt)}</p>
                </div>
                {expanded === l.id ? <ChevronUp size={14} className="text-[#0B0B0B]/40 shrink-0 ml-2" /> : <ChevronDown size={14} className="text-[#0B0B0B]/40 shrink-0 ml-2" />}
              </button>
              {expanded === l.id && (
                <div className="px-3 py-3 border-t border-[#0B0B0B]/8 bg-[#F7F7F5]">
                  <dl className="text-[12px] space-y-1.5">
                    {Object.entries(l.data).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="text-[#0B0B0B]/50 font-medium capitalize min-w-[100px]">{k.replace(/([A-Z])/g, " $1")}:</dt>
                        <dd className="text-[#0B0B0B] flex-1 break-words">{String(v ?? "—")}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Tab Editors ──────────────────────────────────────────────────────────────
function LoadStateNotice({ label, state, onRetry }: { label: string; state: "loading" | "error" | "ready"; onRetry: () => void }) {
  if (state === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-[13px] text-red-600">Couldn't load saved {label}. Editing is disabled to protect your live data.</p>
        <button onClick={onRetry} className="text-[12px] font-semibold bg-[#0B0B0B] text-white px-4 py-2 rounded-xl">Retry</button>
      </div>
    );
  }
  return <div className="py-24 text-center text-[13px] text-[#0B0B0B]/40">Loading content…</div>;
}

function FullTimeEditor() {
  const { getContentResult, saveContent } = useAdmin();
  const [data, setData] = useState<FullTimeData>(FT_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const result = await getContentResult("fulltime");
      if (!result.ok) { setLoadState("error"); return; }
      if (result.data) setData({ ...FT_DEFAULTS, ...(result.data as Partial<FullTimeData>) });
      setLoadState("ready");
    } catch { setLoadState("error"); }
  }, [getContentResult]);
  useEffect(() => { load(); }, [load]);

  function set<K extends keyof FullTimeData>(key: K, val: FullTimeData[K]) { setSaved(false); setData((p) => ({ ...p, [key]: val })); }
  function setListItem(key: "perks" | "roles", i: number, val: string) { setSaved(false); const next = [...data[key]]; next[i] = val; setData((p) => ({ ...p, [key]: next })); }
  function addListItem(key: "perks" | "roles") { setSaved(false); setData((p) => ({ ...p, [key]: [...p[key], ""] })); }
  function removeListItem(key: "perks" | "roles", i: number) { setSaved(false); setData((p) => ({ ...p, [key]: p[key].filter((_, idx) => idx !== i) })); }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try { await saveContent("fulltime", data as unknown as Record<string, unknown>); setSaved(true); }
    catch (error) { setSaveError(error instanceof Error ? error.message : "Failed to save full-time career content."); }
    finally { setSaving(false); }
  }

  if (loadState !== "ready") return <LoadStateNotice label="full-time career content" state={loadState} onRetry={load} />;

  return (
    <>
      <ApplicationsPanel type="full-time" />
      <div className="space-y-5 mt-5">
        <Card>
          <SectionTitle>Hero Section</SectionTitle>
          <div className="space-y-3">
            <Input label="Section Label" value={data.heroLabel} onChange={(e) => set("heroLabel", e.target.value)} />
            <Textarea label="Headline" value={data.heroHeadline} onChange={(e) => set("heroHeadline", e.target.value)} rows={2} />
            <Textarea label="Subtext" value={data.heroSubtext} onChange={(e) => set("heroSubtext", e.target.value)} rows={3} />
          </div>
        </Card>
        <ListCard title="Why Join Full-Time" headingLabel="Section Heading" headingValue={data.perksHeadline}
          onHeadingChange={(v) => set("perksHeadline", v)} items={data.perks}
          onItemChange={(i, v) => setListItem("perks", i, v)} onAdd={() => addListItem("perks")}
          onRemove={(i) => removeListItem("perks", i)} placeholder="Perk..." addLabel="Add Perk" />
        <ListCard title="Open Roles" headingLabel="Roles Box Label" headingValue={data.rolesLabel}
          onHeadingChange={(v) => set("rolesLabel", v)} items={data.roles}
          onItemChange={(i, v) => setListItem("roles", i, v)} onAdd={() => addListItem("roles")}
          onRemove={(i) => removeListItem("roles", i)} placeholder="Role title..." addLabel="Add Role" />
        <FormTextCard data={data} set={set as any} />
      </div>
      {saveError && <p role="alert" className="text-[13px] text-red-600 mt-3">{saveError}</p>}
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </>
  );
}

function InternshipEditor() {
  const { getContentResult, saveContent } = useAdmin();
  const [data, setData] = useState<InternshipData>(IN_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const result = await getContentResult("internship");
      if (!result.ok) { setLoadState("error"); return; }
      if (result.data) setData({ ...IN_DEFAULTS, ...(result.data as Partial<InternshipData>) });
      setLoadState("ready");
    } catch { setLoadState("error"); }
  }, [getContentResult]);
  useEffect(() => { load(); }, [load]);

  function set<K extends keyof InternshipData>(key: K, val: InternshipData[K]) { setSaved(false); setData((p) => ({ ...p, [key]: val })); }
  function setListItem(key: "perks" | "idealFor", i: number, val: string) { setSaved(false); const next = [...data[key]]; next[i] = val; setData((p) => ({ ...p, [key]: next })); }
  function addListItem(key: "perks" | "idealFor") { setSaved(false); setData((p) => ({ ...p, [key]: [...p[key], ""] })); }
  function removeListItem(key: "perks" | "idealFor", i: number) { setSaved(false); setData((p) => ({ ...p, [key]: p[key].filter((_, idx) => idx !== i) })); }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try { await saveContent("internship", data as unknown as Record<string, unknown>); setSaved(true); }
    catch (error) { setSaveError(error instanceof Error ? error.message : "Failed to save internship content."); }
    finally { setSaving(false); }
  }

  if (loadState !== "ready") return <LoadStateNotice label="internship content" state={loadState} onRetry={load} />;

  return (
    <>
      <ApplicationsPanel type="internship" />
      <div className="space-y-5 mt-5">
        <Card>
          <SectionTitle>Hero Section</SectionTitle>
          <div className="space-y-3">
            <Input label="Section Label" value={data.heroLabel} onChange={(e) => set("heroLabel", e.target.value)} />
            <Textarea label="Headline" value={data.heroHeadline} onChange={(e) => set("heroHeadline", e.target.value)} rows={2} />
            <Textarea label="Subtext" value={data.heroSubtext} onChange={(e) => set("heroSubtext", e.target.value)} rows={3} />
          </div>
        </Card>
        <ListCard title="What You'll Experience" headingLabel="Section Heading" headingValue={data.perksHeadline}
          onHeadingChange={(v) => set("perksHeadline", v)} items={data.perks}
          onItemChange={(i, v) => setListItem("perks", i, v)} onAdd={() => addListItem("perks")}
          onRemove={(i) => removeListItem("perks", i)} placeholder="Experience..." addLabel="Add Item" />
        <ListCard title="Ideal For Box" headingLabel="Box Title" headingValue={data.idealForTitle}
          onHeadingChange={(v) => set("idealForTitle", v)} items={data.idealFor}
          onItemChange={(i, v) => setListItem("idealFor", i, v)} onAdd={() => addListItem("idealFor")}
          onRemove={(i) => removeListItem("idealFor", i)} placeholder="Item..." addLabel="Add Item" />
        <FormTextCard data={data} set={set as any} />
      </div>
      {saveError && <p role="alert" className="text-[13px] text-red-600 mt-3">{saveError}</p>}
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </>
  );
}

function FreelancerEditor() {
  const { getContentResult, saveContent } = useAdmin();
  const [data, setData] = useState<FreelancersData>(FL_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const result = await getContentResult("freelancers");
      if (!result.ok) { setLoadState("error"); return; }
      if (result.data) setData({ ...FL_DEFAULTS, ...(result.data as Partial<FreelancersData>) });
      setLoadState("ready");
    } catch { setLoadState("error"); }
  }, [getContentResult]);
  useEffect(() => { load(); }, [load]);

  function set<K extends keyof FreelancersData>(key: K, val: FreelancersData[K]) { setSaved(false); setData((p) => ({ ...p, [key]: val })); }
  function setListItem(key: "perks" | "notForEveryone", i: number, val: string) { setSaved(false); const next = [...data[key]]; next[i] = val; setData((p) => ({ ...p, [key]: next })); }
  function addListItem(key: "perks" | "notForEveryone") { setSaved(false); setData((p) => ({ ...p, [key]: [...p[key], ""] })); }
  function removeListItem(key: "perks" | "notForEveryone", i: number) { setSaved(false); setData((p) => ({ ...p, [key]: p[key].filter((_, idx) => idx !== i) })); }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try { await saveContent("freelancers", data as unknown as Record<string, unknown>); setSaved(true); }
    catch (error) { setSaveError(error instanceof Error ? error.message : "Failed to save freelancer career content."); }
    finally { setSaving(false); }
  }

  if (loadState !== "ready") return <LoadStateNotice label="talent network career content" state={loadState} onRetry={load} />;

  return (
    <>
      <ApplicationsPanel type="freelancer" />
      <div className="space-y-5 mt-5">
        <Card>
          <SectionTitle>Hero Section</SectionTitle>
          <div className="space-y-3">
            <Input label="Section Label" value={data.heroLabel} onChange={(e) => set("heroLabel", e.target.value)} />
            <Textarea label="Headline" value={data.heroHeadline} onChange={(e) => set("heroHeadline", e.target.value)} rows={2} />
            <Textarea label="Subtext" value={data.heroSubtext} onChange={(e) => set("heroSubtext", e.target.value)} rows={3} />
          </div>
        </Card>
        <ListCard title="Perks" headingLabel="Section Heading" headingValue={data.perksHeadline}
          onHeadingChange={(v) => set("perksHeadline", v)} items={data.perks}
          onItemChange={(i, v) => setListItem("perks", i, v)} onAdd={() => addListItem("perks")}
          onRemove={(i) => removeListItem("perks", i)} placeholder="Perk description..." addLabel="Add Perk" />
        <ListCard title="Built For Box" headingLabel="Box Title" headingValue={data.notForEveryoneTitle}
          onHeadingChange={(v) => set("notForEveryoneTitle", v)} items={data.notForEveryone}
          onItemChange={(i, v) => setListItem("notForEveryone", i, v)} onAdd={() => addListItem("notForEveryone")}
          onRemove={(i) => removeListItem("notForEveryone", i)} placeholder="Item..." addLabel="Add Item" />
        <FormTextCard data={data} set={set as any} />
      </div>
      {saveError && <p role="alert" className="text-[13px] text-red-600 mt-3">{saveError}</p>}
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────
function ListCard({ title, headingLabel, headingValue, onHeadingChange, items, onItemChange, onAdd, onRemove, placeholder, addLabel }: {
  title: string; headingLabel: string; headingValue: string; onHeadingChange: (v: string) => void;
  items: string[]; onItemChange: (i: number, v: string) => void; onAdd: () => void; onRemove: (i: number) => void;
  placeholder: string; addLabel: string;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  function removeOne(index: number) {
    onRemove(index);
    setSelected((previous) => new Set([...previous].filter((selectedIndex) => selectedIndex !== index).map((selectedIndex) => selectedIndex > index ? selectedIndex - 1 : selectedIndex)));
  }
  function removeSelected() {
    if (!selected.size || !confirm(`Remove ${selected.size} selected ${title.toLowerCase()}?`)) return;
    [...selected].sort((a, b) => b - a).forEach((i) => onRemove(i));
    setSelected(new Set());
  }
  return (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      <Input label={headingLabel} value={headingValue} onChange={(e) => onHeadingChange(e.target.value)} className="mb-3" />
      <div className="space-y-2">
        <BulkSelectionBar selectedCount={selected.size} visibleCount={items.length} onSelectAllVisible={() => setSelected(new Set(items.map((_, i) => i)))} onUnselectAll={() => setSelected(new Set())} onRemoveSelected={removeSelected} itemLabel="items" />
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <CollectionSelectionCheckbox checked={selected.has(i)} label={`Select ${title} item ${i + 1}`} onChange={(checked) => setSelected((s) => { const n = new Set(s); checked ? n.add(i) : n.delete(i); return n; })} />
            <input className="flex-1 text-[13px] border border-[#0B0B0B]/12 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0B0B0B]/20 bg-white"
              value={item} onChange={(e) => onItemChange(i, e.target.value)} placeholder={placeholder} />
            <button onClick={() => removeOne(i)} className="p-1.5 text-[#0B0B0B]/25 hover:text-red-500 shrink-0"><Trash2 size={13} /></button>
          </div>
        ))}
        <button onClick={onAdd} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0B0B0B]/50 hover:text-[#0B0B0B] transition-colors">
          <Plus size={13} /> {addLabel}
        </button>
      </div>
    </Card>
  );
}

function FormTextCard({ data, set }: { data: any; set: (k: any, v: any) => void }) {
  return (
    <>
      <Card>
        <SectionTitle>Application Form Text</SectionTitle>
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
    </>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
const ALL_TABS: { value: Tab; label: string; icon: React.ReactNode; permission: string }[] = [
  { value: "full-time",  label: "Full-Time",      icon: <Briefcase size={14} />,      permission: "full-time" },
  { value: "internship", label: "Internship",     icon: <GraduationCap size={14} />,  permission: "internship" },
  { value: "freelancer", label: "Talent Network", icon: <UserPlus size={14} />,       permission: "freelancers" },
];

export default function AdminCareer() {
  const { hasPermission, isSuperAdmin } = useAdmin();
  const visibleTabs = useMemo(
    () => ALL_TABS.filter((t) => isSuperAdmin || hasPermission(t.permission)),
    [hasPermission, isSuperAdmin],
  );
  const [tab, setTab] = useState<Tab>(visibleTabs[0]?.value ?? "full-time");

  // If permissions change and current tab is not visible, switch to first visible
  useEffect(() => {
    if (visibleTabs.length && !visibleTabs.some((t) => t.value === tab)) {
      setTab(visibleTabs[0].value);
    }
  }, [visibleTabs, tab]);

  if (!visibleTabs.length) {
    return (
      <div>
        <PageHeader title="Careers Page" description="Unified careers admin." />
        <p className="text-[13px] text-[#0B0B0B]/55">You don't have permission to manage any career sections.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Careers Page"
        description="Single unified careers experience. Edit hero, perks, lists, and form text for each application type. The /career page on the website lets visitors switch between these three types in one form."
      />

      <div className="flex gap-1 mb-5 p-1 bg-[#0B0B0B]/5 rounded-xl inline-flex">
        {visibleTabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            data-testid={`admin-career-tab-${t.value}`}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
              tab === t.value ? "bg-white text-[#0B0B0B] shadow-sm" : "text-[#0B0B0B]/55 hover:text-[#0B0B0B]"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "full-time"  && <FullTimeEditor />}
      {tab === "internship" && <InternshipEditor />}
      {tab === "freelancer" && <FreelancerEditor />}

      <PageVisibilityCard slug="career" />
    </div>
  );
}
