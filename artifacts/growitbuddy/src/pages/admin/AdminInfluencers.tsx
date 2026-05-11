import { useEffect, useState, useRef } from "react";
import { useAdmin } from "@/context/AdminContext";
import { influencers as DEFAULT_INFLUENCERS, NICHE_CATEGORIES, COUNTRIES, type Influencer } from "@/data/influencers";
import { PageHeader, Card, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { ImagePickerField } from "@/components/admin/ImagePickerField";
import {
  Plus, Trash2, Search, X, Eye, EyeOff, ChevronDown, ChevronUp,
  Settings2, Clock, Download, User, Globe, ArrowLeft, Check,
} from "lucide-react";
import ExcelJS from "exceljs";

function formatRelativeDate(iso: string | undefined): string {
  if (!iso) return "Never updated";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const BLANK: Influencer = {
  slug: "",
  name: "",
  username: "",
  niche: "Business & Entrepreneurship",
  followers: "",
  engagementRate: "",
  description: "",
  photo: "",
  profileEnabled: true,
  audienceCountries: [],
  initials: "",
  accentColor: "#0B0B0B",
  about: { creates: "", audience: "" },
  metrics: { avgViews: "", engagementRate: "", audienceLocation: "" },
  pastWork: { brands: [], sampleContent: [] },
  services: [],
};

function isComplete(inf: Influencer) {
  return inf.name.trim().length > 0;
}

/* ── Country multi-select checkboxes ─────────────────────── */
function CountryPicker({
  selected, countries, onChange,
}: {
  selected: string[]; countries: string[]; onChange: (next: string[]) => void;
}) {
  function toggle(c: string) {
    onChange(selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c]);
  }
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-[#0B0B0B]/40 mb-2">Audience Countries</p>
      <div className="flex flex-wrap gap-2">
        {countries.map((c) => {
          const on = selected.includes(c);
          return (
            <button
              key={c}
              onClick={() => toggle(c)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[12px] font-semibold border transition-all ${
                on
                  ? "bg-[#0B0B0B] text-white border-[#0B0B0B]"
                  : "bg-white text-[#0B0B0B]/50 border-[#0B0B0B]/12 hover:border-[#0B0B0B]/30"
              }`}
            >
              {on && <X size={10} />}
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Section heading ─────────────────────────────────────── */
function SectionHead({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#0B0B0B]/8">
      <span className="text-[#0B0B0B]/35">{icon}</span>
      <p className="text-[11px] font-black uppercase tracking-widest text-[#0B0B0B]/40">{label}</p>
    </div>
  );
}

/* ── Full influencer editor row ──────────────────────────── */
function InfluencerRow({
  inf, index, genres, countries, onChange, onDelete, defaultOpen = false,
}: {
  inf: Influencer; index: number; genres: string[]; countries: string[];
  onChange: (i: number, val: Influencer) => void;
  onDelete: (i: number) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const set = (patch: Partial<Influencer>) => onChange(index, { ...inf, ...patch });
  const enabled = inf.profileEnabled !== false;

  return (
    <Card className="p-0 overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-2 pr-3">
        <div
          onClick={() => setOpen((p) => !p)}
          className="flex-1 flex items-center gap-3 px-5 py-3.5 min-w-0 cursor-pointer hover:bg-[#0B0B0B]/3 transition-colors"
        >
          {inf.photo ? (
            <img src={inf.photo} alt={inf.name} className={`w-9 h-9 rounded-full object-cover shrink-0 ${!enabled ? "grayscale opacity-50" : ""}`} />
          ) : (
            <div className={`w-9 h-9 rounded-full bg-[#0B0B0B]/10 flex items-center justify-center text-[11px] font-bold text-[#0B0B0B]/50 shrink-0 ${!enabled ? "opacity-40" : ""}`}>
              {inf.initials || "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-[13px] font-semibold truncate ${!enabled ? "text-[#0B0B0B]/35" : "text-[#0B0B0B]"}`}>
                {inf.name || <span className="text-[#0B0B0B]/30 italic">Unnamed Influencer</span>}
              </p>
              {!enabled && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0B0B0B]/8 text-[#0B0B0B]/35 px-2 py-0.5 rounded-full shrink-0">
                  Hidden
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#0B0B0B]/40 truncate">
              {inf.username ? `${inf.username} · ` : ""}{inf.niche}{inf.followers ? ` · ${inf.followers}` : ""}
            </p>
            <p className="text-[10px] text-[#0B0B0B]/25 flex items-center gap-1 mt-0.5">
              <Clock size={9} /> {formatRelativeDate(inf.updatedAt)}
            </p>
          </div>
          <span className="text-[#0B0B0B]/20 shrink-0">{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); set({ profileEnabled: !enabled }); }}
            title={enabled ? "Hide from public site" : "Show on public site"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
              enabled
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-[#0B0B0B]/5 text-[#0B0B0B]/35 border-[#0B0B0B]/10 hover:border-[#0B0B0B]/25 hover:text-[#0B0B0B]/50"
            }`}
          >
            {enabled ? <Eye size={11} /> : <EyeOff size={11} />}
            {enabled ? "Live" : "Hidden"}
          </button>
          <button
            onClick={() => onDelete(index)}
            className="p-1.5 rounded hover:bg-red-50 hover:text-red-500 text-[#0B0B0B]/30 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Full edit form */}
      {open && (
        <div className="border-t border-[#0B0B0B]/8 px-5 py-5 space-y-6">

          {/* ─ Profile ─ */}
          <div>
            <SectionHead icon={<User size={13} />} label="Profile" />
            <div className="flex gap-5 items-start">
              <div className="shrink-0">
                <ImagePickerField
                  label="Photo"
                  value={inf.photo}
                  onChange={(url) => set({ photo: url })}
                  shape="circle"
                  size={80}
                />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <Input
                  label="Full Name"
                  value={inf.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    set({
                      name,
                      initials: name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase(),
                      slug: slugify(name),
                    });
                  }}
                  placeholder="Aisha Rahman"
                />
                <Input
                  label="Username / Handle"
                  value={inf.username}
                  onChange={(e) => set({ username: e.target.value })}
                  placeholder="@aisharahman"
                />
                <div>
                  <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-1.5 uppercase tracking-wider">Niche / Category</label>
                  <select
                    value={inf.niche}
                    onChange={(e) => set({ niche: e.target.value })}
                    className="w-full border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[13px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/40 bg-white"
                  >
                    {genres.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <Input
                  label="Followers"
                  value={inf.followers}
                  onChange={(e) => set({ followers: e.target.value })}
                  placeholder="284K"
                />
                <Input
                  label="Engagement Rate"
                  value={inf.engagementRate}
                  onChange={(e) => set({ engagementRate: e.target.value })}
                  placeholder="4.8%"
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      label="Initials"
                      value={inf.initials}
                      onChange={(e) => set({ initials: e.target.value.slice(0, 3).toUpperCase() })}
                      placeholder="AR"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-1.5 uppercase tracking-wider">Accent</label>
                    <div className="flex items-center gap-2 border border-[#0B0B0B]/12 rounded-xl px-3 py-2.5 bg-white">
                      <input
                        type="color"
                        value={inf.accentColor}
                        onChange={(e) => set({ accentColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="text-[12px] font-mono text-[#0B0B0B]/50">{inf.accentColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <Textarea
                label="Short Description"
                value={inf.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="One-line bio shown on the influencer card..."
                rows={2}
              />
            </div>
          </div>

          {/* ─ Audience Countries ─ */}
          <div>
            <SectionHead icon={<Globe size={13} />} label="Audience Countries" />
            <CountryPicker
              selected={inf.audienceCountries ?? []}
              countries={countries}
              onChange={(audienceCountries) => set({ audienceCountries })}
            />
          </div>

        </div>
      )}
    </Card>
  );
}

/* ── Tag-list editor for genres / countries (global lists) ── */
function TagListEditor({ title, tags, onChange }: { title: string; tags: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState("");
  function addTag() {
    const v = draft.trim();
    if (!v || tags.includes(v)) { setDraft(""); return; }
    onChange([...tags, v]);
    setDraft("");
  }
  return (
    <div>
      <p className="text-[12px] font-semibold text-[#0B0B0B]/60 uppercase tracking-wider mb-2">{title}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1.5 bg-[#0B0B0B]/6 text-[#0B0B0B]/70 text-[12px] font-medium px-2.5 py-1 rounded-full">
            {tag}
            <button onClick={() => onChange(tags.filter((t) => t !== tag))} className="text-[#0B0B0B]/30 hover:text-red-500 transition-colors">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder={`Add new ${title.toLowerCase().replace(" list", "")}...`}
          className="flex-1 border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2 text-[13px] text-[#0B0B0B] placeholder-[#0B0B0B]/30 outline-none focus:border-[#0B0B0B]/30 bg-white"
        />
        <button
          onClick={addTag}
          disabled={!draft.trim()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B0B0B] text-white text-[13px] font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus size={13} /> Add
        </button>
      </div>
    </div>
  );
}

/* ── New influencer form (full-page view) ────────────────── */
function NewInfluencerForm({
  genres, countries, onSubmit, onCancel,
}: {
  genres: string[];
  countries: string[];
  onSubmit: (inf: Influencer) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Influencer>({ ...BLANK });
  const set = (patch: Partial<Influencer>) => setDraft((p) => ({ ...p, ...patch }));
  const canSubmit = draft.name.trim().length > 0;

  return (
    <div>
      {/* Back nav */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-[13px] font-semibold text-[#0B0B0B]/50 hover:text-[#0B0B0B] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Influencers
        </button>
      </div>

      <PageHeader title="Add Influencer" description="Fill in the details below. You can always edit everything later." />

      <div className="space-y-5">

        {/* Profile */}
        <Card>
          <SectionHead icon={<User size={13} />} label="Profile" />
          <div className="flex gap-5 items-start">
            <div className="shrink-0">
              <ImagePickerField
                label="Photo"
                value={draft.photo}
                onChange={(url) => set({ photo: url })}
                shape="circle"
                size={80}
              />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              <Input
                label="Full Name *"
                value={draft.name}
                onChange={(e) => {
                  const name = e.target.value;
                  set({
                    name,
                    initials: name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase(),
                    slug: slugify(name),
                  });
                }}
                placeholder="Aisha Rahman"
              />
              <Input
                label="Username / Handle"
                value={draft.username}
                onChange={(e) => set({ username: e.target.value })}
                placeholder="@aisharahman"
              />
              <div>
                <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-1.5 uppercase tracking-wider">Niche / Category</label>
                <select
                  value={draft.niche}
                  onChange={(e) => set({ niche: e.target.value })}
                  className="w-full border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[13px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/40 bg-white"
                >
                  {genres.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <Input
                label="Followers"
                value={draft.followers}
                onChange={(e) => set({ followers: e.target.value })}
                placeholder="284K"
              />
              <Input
                label="Engagement Rate"
                value={draft.engagementRate}
                onChange={(e) => set({ engagementRate: e.target.value })}
                placeholder="4.8%"
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    label="Initials"
                    value={draft.initials}
                    onChange={(e) => set({ initials: e.target.value.slice(0, 3).toUpperCase() })}
                    placeholder="AR"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-1.5 uppercase tracking-wider">Accent</label>
                  <div className="flex items-center gap-2 border border-[#0B0B0B]/12 rounded-xl px-3 py-2.5 bg-white">
                    <input
                      type="color"
                      value={draft.accentColor}
                      onChange={(e) => set({ accentColor: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                    />
                    <span className="text-[12px] font-mono text-[#0B0B0B]/50">{draft.accentColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Textarea
              label="Short Description"
              value={draft.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="One-line bio shown on the influencer card..."
              rows={2}
            />
          </div>
        </Card>

        {/* Audience Countries */}
        <Card>
          <SectionHead icon={<Globe size={13} />} label="Audience Countries" />
          <CountryPicker
            selected={draft.audienceCountries ?? []}
            countries={countries}
            onChange={(audienceCountries) => set({ audienceCountries })}
          />
        </Card>

        {/* Visibility */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-[#0B0B0B]">Publish to directory</p>
              <p className="text-[12px] text-[#0B0B0B]/40">Show this profile on the public influencer directory</p>
            </div>
            <button
              onClick={() => set({ profileEnabled: !draft.profileEnabled })}
              className={`relative w-10 h-6 rounded-full transition-colors ${draft.profileEnabled ? "bg-[#0B0B0B]" : "bg-[#0B0B0B]/20"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${draft.profileEnabled ? "translate-x-4" : ""}`} />
            </button>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-8">
          <button
            onClick={() => canSubmit && onSubmit(draft)}
            disabled={!canSubmit}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0B0B0B] text-white text-[14px] font-semibold hover:bg-[#0B0B0B]/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={15} /> Add to Directory
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-3 rounded-xl border border-[#0B0B0B]/12 text-[14px] font-semibold text-[#0B0B0B]/60 hover:border-[#0B0B0B]/30 hover:text-[#0B0B0B] transition-colors"
          >
            Cancel
          </button>
          {!canSubmit && (
            <span className="text-[12px] text-[#0B0B0B]/40">Enter a name to continue</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────── */
export default function AdminInfluencers() {
  const { getContent, saveContent } = useAdmin();
  const [items, setItems] = useState<Influencer[]>(DEFAULT_INFLUENCERS);
  const [genres, setGenres] = useState<string[]>([...NICHE_CATEGORIES]);
  const [countries, setCountries] = useState<string[]>([...COUNTRIES]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [nicheFilter, setNicheFilter] = useState("All");
  const [countryFilter, setCountryFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "3months" | "6months" | "1year">("all");
  const [showNewForm, setShowNewForm] = useState(false);
  const [listsOpen, setListsOpen] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getContent("influencers").then((d) => {
      if (!d) return;
      if (d.items) setItems(d.items as Influencer[]);
      if (d.genres) setGenres(d.genres as string[]);
      if (d.countries) setCountries(d.countries as string[]);
    });
  }, [getContent]);

  function handleChange(i: number, val: Influencer) {
    setSaved(false);
    setItems((p) => p.map((x, idx) => (idx === i ? { ...val, updatedAt: new Date().toISOString() } : x)));
  }

  function handleDelete(i: number) {
    if (!confirm("Remove this influencer?")) return;
    setSaved(false);
    setItems((p) => p.filter((_, idx) => idx !== i));
  }

  function addNew() {
    setShowNewForm(true);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleNewSubmit(inf: Influencer) {
    setSaved(false);
    setItems((p) => [...p, { ...inf, updatedAt: new Date().toISOString() }]);
    setShowNewForm(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent("influencers", { items, genres, countries });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const filtered = items.filter((inf) => {
    const q = search.toLowerCase();
    const matchSearch = !q || inf.name.toLowerCase().includes(q) || inf.niche.toLowerCase().includes(q) || inf.username.toLowerCase().includes(q);
    const matchNiche = nicheFilter === "All" || inf.niche === nicheFilter;
    const matchCountry = countryFilter === "All" || (inf.audienceCountries ?? []).includes(countryFilter);

    let matchDate = true;
    if (dateFilter !== "all") {
      if (!inf.updatedAt) {
        matchDate = false;
      } else {
        const updated = new Date(inf.updatedAt).getTime();
        const now = Date.now();
        const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
        if (dateFilter === "today") matchDate = updated >= startOfToday.getTime();
        else if (dateFilter === "week") matchDate = updated >= now - 7 * 86400000;
        else if (dateFilter === "month") matchDate = updated >= now - 30 * 86400000;
        else if (dateFilter === "3months") matchDate = updated >= now - 90 * 86400000;
        else if (dateFilter === "6months") matchDate = updated >= now - 180 * 86400000;
        else if (dateFilter === "1year") matchDate = updated >= now - 365 * 86400000;
      }
    }
    return matchSearch && matchNiche && matchCountry && matchDate;
  });

  async function exportExcel() {
    const DATE_LABELS: Record<typeof dateFilter, string> = {
      all: "All time", today: "Today", week: "This week",
      month: "This month", "3months": "3 months", "6months": "6 months", "1year": "1 year",
    };

    const wb = new ExcelJS.Workbook();
    wb.creator = "GrowitBuddy Admin";
    wb.created = new Date();

    const ws = wb.addWorksheet("Influencers", {
      views: [{ state: "frozen", ySplit: 4 }],
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
    });

    /* ── Column definitions ── */
    const COLS: { header: string; key: string; width: number }[] = [
      { header: "#",                  key: "idx",            width: 5  },
      { header: "Name",               key: "name",           width: 26 },
      { header: "Username",           key: "username",       width: 20 },
      { header: "Niche / Genre",      key: "niche",          width: 26 },
      { header: "Followers",          key: "followers",      width: 13 },
      { header: "Engagement Rate",    key: "engagement",     width: 17 },
      { header: "Avg Views",          key: "avgViews",       width: 13 },
      { header: "Description",        key: "description",    width: 44 },
      { header: "Services",           key: "services",       width: 48 },
      { header: "Audience Countries", key: "countries",      width: 36 },
      { header: "Past Brands",        key: "brands",         width: 32 },
      { header: "Status",             key: "status",         width: 10 },
      { header: "Last Updated",       key: "updatedAt",      width: 18 },
    ];
    ws.columns = COLS;

    /* ── Row 1: Title ── */
    ws.mergeCells(1, 1, 1, COLS.length);
    const titleCell = ws.getCell("A1");
    titleCell.value = "GrowitBuddy — Influencer Directory";
    titleCell.font  = { bold: true, size: 15, color: { argb: "FF0A0A0A" }, name: "Calibri" };
    titleCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F8F6" } };
    titleCell.alignment = { vertical: "middle" };
    ws.getRow(1).height = 32;

    /* ── Row 2: Subtitle / metadata ── */
    ws.mergeCells(2, 1, 2, COLS.length);
    const metaParts: string[] = [
      `${filtered.length} influencer${filtered.length !== 1 ? "s" : ""}`,
    ];
    if (nicheFilter !== "All")   metaParts.push(`Genre: ${nicheFilter}`);
    if (countryFilter !== "All") metaParts.push(`Country: ${countryFilter}`);
    metaParts.push(`Period: ${DATE_LABELS[dateFilter]}`);
    metaParts.push(`Exported: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`);
    const subCell = ws.getCell("A2");
    subCell.value = metaParts.join("   ·   ");
    subCell.font  = { size: 10, color: { argb: "FF5F5F5F" }, name: "Calibri" };
    subCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F8F6" } };
    subCell.alignment = { vertical: "middle" };
    ws.getRow(2).height = 20;

    /* ── Row 3: Blank spacer ── */
    ws.mergeCells(3, 1, 3, COLS.length);
    ws.getCell("A3").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F8F6" } };
    ws.getRow(3).height = 6;

    /* ── Row 4: Header ── */
    const headerRow = ws.getRow(4);
    COLS.forEach((col, ci) => {
      const cell = headerRow.getCell(ci + 1);
      cell.value = col.header;
      cell.font  = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Calibri" };
      cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
      cell.alignment = { vertical: "middle", horizontal: ci === 0 ? "center" : "left" };
      cell.border = { bottom: { style: "thin", color: { argb: "FF2D3F55" } } };
    });
    headerRow.height = 26;

    ws.autoFilter = {
      from: { row: 4, column: 1 },
      to:   { row: 4, column: COLS.length },
    };

    /* ── Data rows (start at row 5) ── */
    filtered.forEach((inf, i) => {
      const isEven  = i % 2 === 1;
      const bgArgb  = isEven ? "FFEFEFEA" : "FFFFFFFF";
      const isLive  = inf.profileEnabled !== false;

      const row = ws.addRow({
        idx:         i + 1,
        name:        inf.name,
        username:    inf.username || "",
        niche:       inf.niche,
        followers:   inf.followers || "",
        engagement:  inf.engagementRate || "",
        avgViews:    inf.metrics?.avgViews || "",
        description: inf.description || "",
        services:    (inf.services || []).join(", "),
        countries:   (inf.audienceCountries ?? []).join(", "),
        brands:      (inf.pastWork?.brands || []).join(", "),
        status:      isLive ? "Live" : "Hidden",
        updatedAt:   inf.updatedAt
          ? new Date(inf.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
          : "Never",
      });

      row.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
        cell.font = { size: 11, color: { argb: "FF0A0A0A" }, name: "Calibri" };
        cell.alignment = { vertical: "middle", wrapText: colNum >= 8 };
        cell.border = { bottom: { style: "hair", color: { argb: "FFE5E5E0" } } };
        if (colNum === 1) cell.alignment = { horizontal: "center", vertical: "middle" };
        if (colNum === 12) {
          cell.font = {
            bold: true, size: 11, name: "Calibri",
            color: { argb: isLive ? "FF166534" : "FF92400E" },
          };
          cell.fill = {
            type: "pattern", pattern: "solid",
            fgColor: { argb: isLive ? "FFDCFCE7" : "FFFEF3C7" },
          };
        }
      });
      row.height = 20;
    });

    /* ── Download ── */
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    const fParts: string[] = [];
    if (nicheFilter !== "All")   fParts.push(nicheFilter.replace(/\s+/g, "-").toLowerCase());
    if (countryFilter !== "All") fParts.push(countryFilter.toLowerCase());
    if (dateFilter !== "all")    fParts.push(DATE_LABELS[dateFilter].replace(/\s+/g, "-").toLowerCase());
    a.download = `influencers${fParts.length ? `-${fParts.join("-")}` : ""}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const liveCount = items.filter((inf) => inf.profileEnabled !== false).length;
  const hiddenCount = items.length - liveCount;

  return (
    <div ref={topRef}>
      {showNewForm ? (
        <NewInfluencerForm
          genres={genres}
          countries={countries}
          onSubmit={handleNewSubmit}
          onCancel={() => setShowNewForm(false)}
        />
      ) : (
        <>
          <PageHeader
            title="Influencers"
            description={`${items.length} creator${items.length !== 1 ? "s" : ""} · ${liveCount} live · ${hiddenCount} hidden`}
          />

          {/* Genre & Country list manager */}
          <Card className="mb-5 overflow-hidden p-0">
            <button
              onClick={() => setListsOpen((p) => !p)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#0B0B0B]/3 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Settings2 size={15} className="text-[#0B0B0B]/40" />
                <span className="text-[13px] font-semibold text-[#0B0B0B]">Manage Genre &amp; Country Lists</span>
                <span className="text-[11px] text-[#0B0B0B]/35">{genres.length} genres · {countries.length} countries</span>
              </div>
              {listsOpen ? <ChevronUp size={14} className="text-[#0B0B0B]/30" /> : <ChevronDown size={14} className="text-[#0B0B0B]/30" />}
            </button>
            {listsOpen && (
              <div className="border-t border-[#0B0B0B]/8 px-5 py-5 grid grid-cols-2 gap-8">
                <TagListEditor title="Genre / Niche List" tags={genres} onChange={(next) => { setGenres(next); setSaved(false); }} />
                <TagListEditor title="Country List" tags={countries} onChange={(next) => { setCountries(next); setSaved(false); }} />
              </div>
            )}
          </Card>

          {/* Toolbar */}
          <div className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0B0B0B]/35" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, username or niche..."
                className="w-full pl-9 pr-9 py-2.5 border border-[#0B0B0B]/12 rounded-xl text-[13px] text-[#0B0B0B] placeholder-[#0B0B0B]/30 outline-none focus:border-[#0B0B0B]/30 bg-white"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0B0B0B]/30 hover:text-[#0B0B0B]">
                  <X size={13} />
                </button>
              )}
            </div>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className={`border rounded-xl px-3.5 py-2.5 text-[13px] outline-none bg-white transition-colors ${
                countryFilter !== "All"
                  ? "border-[#0B0B0B] text-[#0B0B0B] font-semibold"
                  : "border-[#0B0B0B]/12 text-[#0B0B0B]/60 hover:border-[#0B0B0B]/30"
              }`}
            >
              <option value="All">All Countries</option>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              onClick={exportExcel}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-[#0B0B0B]/60 hover:bg-[#0B0B0B]/5 hover:border-[#0B0B0B]/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Download size={14} /> Export
            </button>
            <button
              onClick={addNew}
              className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-xl bg-[#0B0B0B] text-white hover:bg-[#0B0B0B]/85 transition-colors"
            >
              <Plus size={15} /> Add Influencer
            </button>
          </div>

          {/* Date filter */}
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0B0B0B]/40 uppercase tracking-wider shrink-0">
              <Clock size={11} /> Last Updated
            </span>
            <div className="flex items-center bg-[#0B0B0B]/6 rounded-xl p-1 gap-0.5">
              {([
                { key: "all", label: "All time" },
                { key: "today", label: "Today" },
                { key: "week", label: "This week" },
                { key: "month", label: "This month" },
                { key: "3months", label: "3 months" },
                { key: "6months", label: "6 months" },
                { key: "1year", label: "1 year" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setDateFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                    dateFilter === key ? "bg-white text-[#0B0B0B] shadow-sm" : "text-[#0B0B0B]/45 hover:text-[#0B0B0B]/70"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Niche chips */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {(["All", ...genres] as string[]).map((niche) => {
                const count = niche === "All" ? items.length : items.filter((inf) => inf.niche === niche).length;
                const active = nicheFilter === niche;
                if (count === 0 && niche !== "All") return null;
                return (
                  <button
                    key={niche}
                    onClick={() => setNicheFilter(niche)}
                    className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all shrink-0 ${
                      active ? "bg-[#0B0B0B] text-white border-[#0B0B0B]" : "bg-white text-[#0B0B0B]/55 border-[#0B0B0B]/12 hover:border-[#0B0B0B]/30 hover:text-[#0B0B0B]"
                    }`}
                  >
                    {niche === "All" ? "All Genres" : niche}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-[#0B0B0B]/8 text-[#0B0B0B]/50"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
            {(search || nicheFilter !== "All" || countryFilter !== "All" || dateFilter !== "all") && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[12px] text-[#0B0B0B]/40">Showing {filtered.length} of {items.length} influencers</span>
                <button
                  onClick={() => { setSearch(""); setNicheFilter("All"); setCountryFilter("All"); setDateFilter("all"); }}
                  className="text-[11px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] underline underline-offset-2 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* List */}
          <div className="space-y-3">
            {filtered.map((inf) => {
              const realIndex = items.indexOf(inf);
              return (
                <InfluencerRow
                  key={realIndex}
                  inf={inf}
                  index={realIndex}
                  genres={genres}
                  countries={countries}
                  onChange={handleChange}
                  onDelete={handleDelete}
                  defaultOpen={false}
                />
              );
            })}
            {filtered.length === 0 && (
              <Card><p className="text-[13px] text-[#0B0B0B]/40 text-center py-6">No influencers match your filter.</p></Card>
            )}
          </div>

          <SaveBar onSave={handleSave} saving={saving} saved={saved} />
        </>
      )}
    </div>
  );
}
