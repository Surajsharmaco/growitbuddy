import { useEffect, useState, useRef, useCallback } from "react";
import { useAdmin } from "@/context/AdminContext";
import { NICHE_CATEGORIES, COUNTRIES, type Influencer } from "@/data/influencers";
import { PageHeader, Card, Input, Textarea, SaveBar, Modal } from "@/components/admin/AdminField";
import { ImagePickerField } from "@/components/admin/ImagePickerField";
import {
  Plus, Trash2, Search, X, Eye, EyeOff, ChevronDown, ChevronUp,
  Settings2, Clock, Download, User, Globe, Check, RotateCcw,
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

// Ensure a new slug is unique against every existing slug (including trashed
// items, so a restore can never collide with a slug created in the meantime).
function uniqueSlug(base: string, taken: string[]): string {
  const cleaned = base || "influencer";
  if (!taken.includes(cleaned)) return cleaned;
  let n = 2;
  while (taken.includes(`${cleaned}-${n}`)) n += 1;
  return `${cleaned}-${n}`;
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
  photoShape: "square",
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
  inf, index, genres, countries, onChange, onDelete,
  onMoveUp, onMoveDown, canMoveUp, canMoveDown, defaultOpen = false,
}: {
  inf: Influencer; index: number; genres: string[]; countries: string[];
  onChange: (i: number, val: Influencer) => void;
  onDelete: (i: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const set = (patch: Partial<Influencer>) => onChange(index, { ...inf, ...patch });
  const enabled = inf.profileEnabled !== false;

  return (
    <Card className="p-0 overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-2 pr-3">
        {/* Reorder handle — sets the order on the public page (no rank shown) */}
        <div className="flex flex-col items-center justify-center shrink-0 pl-3 text-[#0B0B0B]/30">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={!canMoveUp}
            aria-label={`Move ${inf.name || "influencer"} up`}
            title="Move up — shows higher on the public page"
            className="p-0.5 rounded hover:bg-[#0B0B0B]/8 hover:text-[#0B0B0B] disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-[#0B0B0B]/30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={!canMoveDown}
            aria-label={`Move ${inf.name || "influencer"} down`}
            title="Move down — shows lower on the public page"
            className="p-0.5 rounded hover:bg-[#0B0B0B]/8 hover:text-[#0B0B0B] disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-[#0B0B0B]/30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown size={14} />
          </button>
        </div>
        <div
          onClick={() => setOpen((p) => !p)}
          className="flex-1 flex items-center gap-3 pl-2 pr-5 py-3.5 min-w-0 cursor-pointer hover:bg-[#0B0B0B]/3 transition-colors"
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
            <div className="rounded-xl border border-[#0B0B0B]/8 bg-[#fafafa] px-4 py-4 mb-4">
              <ImagePickerField
                label="Photo"
                value={inf.photo}
                onChange={(url) => set({ photo: url })}
                shapeValue={inf.photoShape ?? "square"}
                onShapeChange={(s) => set({ photoShape: s })}
                size={72}
                requireCrop
                hint="Recommended: 400 × 400 px (square) • Face centered"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
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
              </div>
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
              <Input
                label="Initials"
                value={inf.initials}
                onChange={(e) => set({ initials: e.target.value.slice(0, 3).toUpperCase() })}
                placeholder="AR"
              />
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
              <div className="sm:col-span-2">
                <Textarea
                  label="Short Description"
                  value={inf.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="One-line bio shown on the influencer card..."
                  rows={2}
                />
              </div>
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

/* ── Add influencer popup (centered modal) ───────────────── */
function AddInfluencerModal({
  open, genres, countries, onSubmit, onClose,
}: {
  open: boolean;
  genres: string[];
  countries: string[];
  onSubmit: (inf: Influencer) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Influencer>({ ...BLANK });
  const set = (patch: Partial<Influencer>) => setDraft((p) => ({ ...p, ...patch }));
  const canSubmit = draft.name.trim().length > 0;

  // Reset the form each time the popup opens so it never carries stale input.
  useEffect(() => {
    if (open) setDraft({ ...BLANK });
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Influencer"
      description="Enter the basics to create the profile. You can edit everything later."
      maxWidth="max-w-2xl"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#0B0B0B]/12 text-[13px] font-semibold text-[#0B0B0B]/60 hover:border-[#0B0B0B]/30 hover:text-[#0B0B0B] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => canSubmit && onSubmit(draft)}
            disabled={!canSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B0B0B] text-white text-[13px] font-semibold hover:bg-[#0B0B0B]/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={15} /> Add Influencer
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-[#0B0B0B]/8 bg-[#fafafa] px-4 py-4">
          <ImagePickerField
            label="Photo"
            value={draft.photo}
            onChange={(url) => set({ photo: url })}
            shapeValue={draft.photoShape ?? "square"}
            onShapeChange={(s) => set({ photoShape: s })}
            size={72}
            requireCrop
            hint="400 × 400 px"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
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
          </div>
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
        </div>

        <Textarea
          label="Short Description"
          value={draft.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="One-line bio shown on the influencer card..."
          rows={2}
        />

        <div>
          <label className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0B0B0B]/60 mb-2 uppercase tracking-wider">
            <Globe size={12} /> Audience Countries
          </label>
          <CountryPicker
            selected={draft.audienceCountries ?? []}
            countries={countries}
            onChange={(audienceCountries) => set({ audienceCountries })}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[#0B0B0B]/10 px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold text-[#0B0B0B]">{draft.profileEnabled ? "Publish now (Live)" : "Save as Draft (Hidden)"}</p>
            <p className="text-[12px] text-[#0B0B0B]/40">
              {draft.profileEnabled ? "Visible on the public directory right away." : "Stays hidden from the public site until you switch it to Live."}
            </p>
          </div>
          <button
            onClick={() => set({ profileEnabled: !draft.profileEnabled })}
            className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${draft.profileEnabled ? "bg-[#0B0B0B]" : "bg-[#0B0B0B]/20"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${draft.profileEnabled ? "translate-x-4" : ""}`} />
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Main page ───────────────────────────────────────────── */
export default function AdminInfluencers() {
  const { getContentResult, saveContent } = useAdmin();
  const [items, setItems] = useState<Influencer[]>([]);
  const [genres, setGenres] = useState<string[]>([...NICHE_CATEGORIES]);
  const [countries, setCountries] = useState<string[]>([...COUNTRIES]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [search, setSearch] = useState("");
  const [nicheFilter, setNicheFilter] = useState("All");
  const [countryFilter, setCountryFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "3months" | "6months" | "1year">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [view, setView] = useState<"active" | "trash">("active");
  const [listsOpen, setListsOpen] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    setLoadState("loading");
    getContentResult("influencers").then((res) => {
      // Fail closed: on a load FAILURE never mount the editor, so a Save can
      // never overwrite real data with demo defaults (deleted-ghost re-intro).
      if (!res.ok) { setLoadState("error"); return; }
      const d = res.data;
      setItems(Array.isArray(d?.items) ? (d!.items as Influencer[]) : []);
      if (Array.isArray(d?.genres)) setGenres(d!.genres as string[]);
      if (Array.isArray(d?.countries)) setCountries(d!.countries as string[]);
      setLoadState("ready");
    });
  }, [getContentResult]);

  useEffect(() => { load(); }, [load]);

  function handleChange(i: number, val: Influencer) {
    setSaved(false);
    setItems((p) => p.map((x, idx) => (idx === i ? { ...val, updatedAt: new Date().toISOString() } : x)));
  }

  // Soft delete → move to Trash (reversible, so no confirm needed).
  function handleDelete(i: number) {
    setSaved(false);
    const now = new Date().toISOString();
    setItems((p) => p.map((x, idx) => (idx === i ? { ...x, trashed: true, trashedAt: now, updatedAt: now } : x)));
  }

  // Reorder active influencers. The public Influencers page renders creators in
  // this exact array order (no rank number is ever shown), so moving a row up or
  // down is what decides who appears first, second, third… on the live site.
  // We swap with the adjacent *visible* row, so it stays correct even when a
  // search / genre / country filter is narrowing the list.
  function moveItem(realIndex: number, dir: -1 | 1) {
    const item = items[realIndex];
    if (!item) return;
    const pos = filtered.indexOf(item);
    const target = filtered[pos + dir];
    if (pos === -1 || !target) return;
    setSaved(false);
    setItems((prev) => {
      // Recompute indices against the freshest state so a fast double-click
      // can never swap the wrong rows.
      const a = prev.indexOf(item);
      const b = prev.indexOf(target);
      if (a === -1 || b === -1) return prev;
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  }

  function handleRestore(i: number) {
    setSaved(false);
    const now = new Date().toISOString();
    setItems((p) => p.map((x, idx) => (idx === i ? { ...x, trashed: false, trashedAt: undefined, updatedAt: now } : x)));
  }

  function handlePermanentDelete(i: number) {
    if (!confirm("Permanently delete this influencer? This cannot be undone.")) return;
    setSaved(false);
    setItems((p) => p.filter((_, idx) => idx !== i));
  }

  function addNew() {
    setShowAddModal(true);
  }

  function handleNewSubmit(inf: Influencer) {
    setSaved(false);
    setItems((p) => {
      const slug = uniqueSlug(inf.slug || slugify(inf.name), p.map((x) => x.slug).filter(Boolean));
      return [{ ...inf, slug, trashed: false, updatedAt: new Date().toISOString() }, ...p];
    });
    setShowAddModal(false);
    setView("active");
    setSearch("");
    setNicheFilter("All");
    setCountryFilter("All");
    setDateFilter("all");
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

  const activeItems = items.filter((inf) => !inf.trashed);
  const trashedItems = items.filter((inf) => inf.trashed);

  const filtered = activeItems.filter((inf) => {
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

  // Reorder is only meaningful against the full active list, so it's paused
  // while any search/filter narrows the view (keeps 1st/2nd/3rd unambiguous).
  const filtersActive = search !== "" || nicheFilter !== "All" || countryFilter !== "All" || dateFilter !== "all";

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

  const liveCount = activeItems.filter((inf) => inf.profileEnabled !== false).length;
  const hiddenCount = activeItems.length - liveCount;
  const trashCount = trashedItems.length;

  if (loadState !== "ready") {
    return (
      <div ref={topRef}>
        <PageHeader title="Influencers" description={loadState === "error" ? "Couldn't load saved content" : "Loading…"} />
        {loadState === "error" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-[13px] text-red-600 max-w-md">Couldn't load your saved influencers. To protect your live data, editing is disabled until this loads successfully.</p>
            <button onClick={load} className="text-[12px] font-semibold bg-[#0B0B0B] text-white px-4 py-2 rounded-xl hover:bg-[#0B0B0B]/85 transition-colors">Retry</button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-24 text-[13px] text-[#0B0B0B]/40">Loading content…</div>
        )}
      </div>
    );
  }

  return (
    <div ref={topRef}>
      <PageHeader
        title="Influencers"
        description={`${activeItems.length} creator${activeItems.length !== 1 ? "s" : ""} · ${liveCount} live · ${hiddenCount} hidden`}
      />

      {/* Active / Trash tabs */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setView("active")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
            view === "active"
              ? "bg-[#0B0B0B] text-white border-[#0B0B0B]"
              : "bg-white text-[#0B0B0B]/55 border-[#0B0B0B]/12 hover:border-[#0B0B0B]/30 hover:text-[#0B0B0B]"
          }`}
        >
          Active
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${view === "active" ? "bg-white/20 text-white" : "bg-[#0B0B0B]/8 text-[#0B0B0B]/50"}`}>{activeItems.length}</span>
        </button>
        <button
          onClick={() => setView("trash")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
            view === "trash"
              ? "bg-[#0B0B0B] text-white border-[#0B0B0B]"
              : "bg-white text-[#0B0B0B]/55 border-[#0B0B0B]/12 hover:border-[#0B0B0B]/30 hover:text-[#0B0B0B]"
          }`}
        >
          <Trash2 size={13} /> Trash
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${view === "trash" ? "bg-white/20 text-white" : "bg-[#0B0B0B]/8 text-[#0B0B0B]/50"}`}>{trashCount}</span>
        </button>
      </div>

      {view === "trash" ? (
        <>
          <div className="space-y-3">
            {trashedItems.length === 0 ? (
              <Card><p className="text-[13px] text-[#0B0B0B]/40 text-center py-10">Trash is empty. Deleted influencers appear here and can be restored anytime before you permanently delete them.</p></Card>
            ) : (
              trashedItems.map((inf) => {
                const realIndex = items.indexOf(inf);
                return (
                  <Card key={realIndex} className="p-0 overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3.5">
                      {inf.photo ? (
                        <img src={inf.photo} alt={inf.name} className="w-9 h-9 rounded-full object-cover shrink-0 grayscale opacity-60" />
                      ) : (
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 opacity-50" style={{ background: inf.accentColor || "#0B0B0B" }}>
                          {inf.initials || "?"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#0B0B0B]/70 truncate">{inf.name || "Unnamed Influencer"}</p>
                        <p className="text-[11px] text-[#0B0B0B]/40 truncate">{inf.username ? `${inf.username} · ` : ""}{inf.niche}</p>
                        <p className="text-[10px] text-[#0B0B0B]/25 flex items-center gap-1 mt-0.5"><Clock size={9} /> Trashed {formatRelativeDate(inf.trashedAt)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleRestore(realIndex)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-all"
                        >
                          <RotateCcw size={11} /> Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(realIndex)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border bg-red-50 text-red-600 border-red-200 hover:bg-red-100 transition-all"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          <SaveBar onSave={handleSave} saving={saving} saved={saved} />
        </>
      ) : (
        <>
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
                const count = niche === "All" ? activeItems.length : activeItems.filter((inf) => inf.niche === niche).length;
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
                <span className="text-[12px] text-[#0B0B0B]/40">Showing {filtered.length} of {activeItems.length} influencers</span>
                <span className="text-[11px] text-[#0B0B0B]/35 italic">· Reordering paused — clear filters to change the public order</span>
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
            {filtered.map((inf, pos) => {
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
                  onMoveUp={() => moveItem(realIndex, -1)}
                  onMoveDown={() => moveItem(realIndex, 1)}
                  canMoveUp={!filtersActive && pos > 0}
                  canMoveDown={!filtersActive && pos < filtered.length - 1}
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

      <AddInfluencerModal
        open={showAddModal}
        genres={genres}
        countries={countries}
        onSubmit={handleNewSubmit}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
}
