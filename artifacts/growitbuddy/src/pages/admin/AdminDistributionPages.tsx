import { useEffect, useState, useCallback } from "react";
import { useAdmin } from "@/context/AdminContext";
import { DISTRIBUTION_NICHES, DISTRIBUTION_COUNTRIES, type DistributionPage } from "@/data/distributionPages";
import { PageHeader, Card, Input, SaveBar, Modal } from "@/components/admin/AdminField";
import { ImagePickerField } from "@/components/admin/ImagePickerField";
import { Plus, Trash2, Search, X, Eye, EyeOff, ChevronDown, ChevronUp, Settings2, Clock, Download, Zap, Copy, ExternalLink, Check, RotateCcw } from "lucide-react";
import * as XLSX from "xlsx";

type DistPage = DistributionPage & { updatedAt?: string };

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

const BLANK: DistPage = {
  slug: "",
  name: "",
  handle: "",
  niche: "Entrepreneurship",
  followers: "",
  followersRaw: 0,
  country: "USA",
  photo: "",
  accentColor: "#0B0B0B",
  initials: "",
  highEngagement: false,
  profileEnabled: true,
  instagramUrl: "",
};

function isComplete(p: DistPage) {
  return p.name.trim().length > 0;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Ensure a new slug is unique against every existing slug (including trashed
// pages, so a restore can never collide with a slug created in the meantime).
function uniqueSlug(base: string, taken: string[]): string {
  const cleaned = base || "page";
  if (!taken.includes(cleaned)) return cleaned;
  let n = 2;
  while (taken.includes(`${cleaned}-${n}`)) n += 1;
  return `${cleaned}-${n}`;
}

function PageRow({
  page,
  index,
  niches,
  countries,
  allSlugs,
  onChange,
  onDelete,
  onDuplicate,
  defaultOpen = false,
}: {
  page: DistPage;
  index: number;
  niches: string[];
  countries: string[];
  allSlugs: string[];
  onChange: (i: number, val: DistPage) => void;
  onDelete: (i: number) => void;
  onDuplicate: (i: number) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [slugCopied, setSlugCopied] = useState(false);
  const set = (patch: Partial<DistPage>) => onChange(index, { ...page, ...patch });
  const enabled = page.profileEnabled !== false;
  const slugTaken =
    page.slug.trim().length > 0 &&
    allSlugs.filter((s) => s === page.slug).length > 1;
  const publicUrl = page.slug ? `${import.meta.env.BASE_URL}distribution/${page.slug}` : "";

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center gap-2 pr-3">
        <div
          onClick={() => setOpen((p) => !p)}
          className="flex-1 flex items-center gap-3 px-5 py-3.5 min-w-0 cursor-pointer hover:bg-[#0B0B0B]/3 transition-colors"
        >
          {page.photo ? (
            <img src={page.photo} alt={page.name} className={`w-9 h-9 rounded-full object-cover shrink-0 ${!enabled ? "grayscale opacity-50" : ""}`} />
          ) : (
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${!enabled ? "opacity-40" : ""}`}
              style={{ background: page.accentColor || "#0B0B0B" }}
            >
              {page.initials || "?"}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-[13px] font-semibold truncate ${!enabled ? "text-[#0B0B0B]/35" : "text-[#0B0B0B]"}`}>
                {page.name || <span className="text-[#0B0B0B]/30 italic">Unnamed Page</span>}
              </p>
              {page.highEngagement && enabled && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0">
                  <Zap size={8} /> High ER
                </span>
              )}
              {!enabled && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0B0B0B]/8 text-[#0B0B0B]/35 px-2 py-0.5 rounded-full shrink-0">
                  Hidden
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#0B0B0B]/40 truncate">
              {page.handle || "—"}
              {page.niche ? ` · ${page.niche}` : ""}
              {page.followers ? ` · ${page.followers}` : ""}
              {page.country ? ` · ${page.country}` : ""}
            </p>
            <p className="text-[10px] text-[#0B0B0B]/25 flex items-center gap-1 mt-0.5">
              <Clock size={9} />
              {formatRelativeDate(page.updatedAt)}
            </p>
          </div>
          <span className="text-[#0B0B0B]/20 shrink-0">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); set({ profileEnabled: !enabled }); }}
            title={enabled ? "Click to hide this page on the public site" : "Click to make this page visible"}
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
            onClick={(e) => { e.stopPropagation(); onDuplicate(index); }}
            title="Duplicate this page (copies all fields, opens it for editing with a new URL)"
            className="p-1.5 rounded hover:bg-[#0B0B0B]/8 text-[#0B0B0B]/35 hover:text-[#0B0B0B] transition-colors"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(index); }}
            className="p-1.5 rounded hover:bg-red-50 hover:text-red-500 text-[#0B0B0B]/30 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#0B0B0B]/8 px-5 py-5">
          <div className="rounded-xl border border-[#0B0B0B]/8 bg-[#fafafa] px-4 py-4 mb-4">
            <ImagePickerField
              label="Photo"
              value={page.photo}
              onChange={(url) => set({ photo: url })}
              shape="circle"
              size={72}
              hint="Recommended: 400 × 400 px (square)"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-1.5 uppercase tracking-wider">
                  URL Slug <span className="text-[#0B0B0B]/35 font-normal normal-case tracking-normal">— this becomes /distribution/<strong className="font-semibold text-[#0B0B0B]/60">{page.slug || "your-slug"}</strong></span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-stretch border border-[#0B0B0B]/12 rounded-xl overflow-hidden bg-white focus-within:border-[#0B0B0B]/40">
                    <span className="px-3 py-2.5 text-[12px] text-[#0B0B0B]/35 bg-[#0B0B0B]/4 border-r border-[#0B0B0B]/8 font-mono whitespace-nowrap flex items-center">/distribution/</span>
                    <input
                      value={page.slug}
                      onChange={(e) => set({ slug: slugify(e.target.value) })}
                      placeholder="hustle-empire"
                      className="flex-1 px-3 py-2.5 text-[13px] text-[#0B0B0B] placeholder-[#0B0B0B]/30 outline-none font-mono"
                    />
                  </div>
                  {!page.slug && page.name && (
                    <button
                      type="button"
                      onClick={() => set({ slug: slugify(page.name) })}
                      className="px-3 py-2 text-[12px] font-semibold text-[#0B0B0B]/60 hover:text-[#0B0B0B] bg-[#0B0B0B]/6 rounded-xl hover:bg-[#0B0B0B]/10 transition-colors shrink-0 whitespace-nowrap"
                    >
                      Use name
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {slugTaken && (
                    <p className="text-[11px] text-red-500 font-semibold">⚠ Another page already uses this slug — change it.</p>
                  )}
                  {page.slug && !slugTaken && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const full = `${window.location.origin}${publicUrl}`;
                          navigator.clipboard.writeText(full).then(() => { setSlugCopied(true); setTimeout(() => setSlugCopied(false), 1500); });
                        }}
                        className="flex items-center gap-1 text-[11px] text-[#0B0B0B]/50 hover:text-[#0B0B0B] transition-colors"
                      >
                        <Copy size={10} /> {slugCopied ? "Copied!" : "Copy public link"}
                      </button>
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-[#0B0B0B]/50 hover:text-[#0B0B0B] transition-colors"
                      >
                        <ExternalLink size={10} /> Open
                      </a>
                    </>
                  )}
                </div>
              </div>
              <Input label="Page Name" value={page.name} onChange={(e) => set({ name: e.target.value })} placeholder="Hustle Empire" />
              <Input label="Handle" value={page.handle} onChange={(e) => set({ handle: e.target.value })} placeholder="@hustleempire" />
              <Input label="Instagram Page Link (opens on View Page)" value={page.instagramUrl || ""} onChange={(e) => set({ instagramUrl: e.target.value })} placeholder="https://instagram.com/hustleempire" />
              <Input label="Followers (display)" value={page.followers} onChange={(e) => set({ followers: e.target.value })} placeholder="3.4M" />
              <Input
                label="Followers (raw number)"
                value={page.followersRaw === 0 ? "" : String(page.followersRaw)}
                onChange={(e) => set({ followersRaw: Number(e.target.value.replace(/\D/g, "")) || 0 })}
                placeholder="3400000"
              />
              <div>
                <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-1.5 uppercase tracking-wider">Niche</label>
                <select
                  value={page.niche}
                  onChange={(e) => set({ niche: e.target.value })}
                  className="w-full border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[13px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/40 bg-white"
                >
                  {niches.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-1.5 uppercase tracking-wider">Country</label>
                <select
                  value={page.country}
                  onChange={(e) => set({ country: e.target.value })}
                  className="w-full border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[13px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/40 bg-white"
                >
                  {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Input label="Initials (fallback avatar)" value={page.initials} onChange={(e) => set({ initials: e.target.value.toUpperCase().slice(0, 3) })} placeholder="HE" />
              <div>
                <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-1.5 uppercase tracking-wider">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={page.accentColor}
                    onChange={(e) => set({ accentColor: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-[#0B0B0B]/12 cursor-pointer p-1"
                  />
                  <Input
                    label=""
                    value={page.accentColor}
                    onChange={(e) => set({ accentColor: e.target.value })}
                    placeholder="#0B0B0B"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-2 uppercase tracking-wider">High Engagement Badge</label>
                <button
                  type="button"
                  onClick={() => set({ highEngagement: !page.highEngagement })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
                    page.highEngagement
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-[#0B0B0B]/5 text-[#0B0B0B]/40 border-[#0B0B0B]/10 hover:border-[#0B0B0B]/20"
                  }`}
                >
                  <Zap size={13} />
                  {page.highEngagement ? "High Engagement - ON" : "High Engagement - OFF"}
                </button>
              </div>
            </div>
        </div>
      )}
    </Card>
  );
}

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
          placeholder={`Add ${title.toLowerCase()}...`}
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

/* ── Add distribution page popup (centered modal) ────────── */
function AddDistributionModal({
  open, niches, countries, takenSlugs, onSubmit, onClose,
}: {
  open: boolean;
  niches: string[];
  countries: string[];
  takenSlugs: string[];
  onSubmit: (page: DistPage) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<DistPage>({ ...BLANK });
  const set = (patch: Partial<DistPage>) => setDraft((p) => ({ ...p, ...patch }));
  const canSubmit = draft.name.trim().length > 0;

  // Reset the form each time the popup opens so it never carries stale input.
  useEffect(() => { if (open) setDraft({ ...BLANK }); }, [open]);

  const slugPreview = draft.slug || slugify(draft.name) || "your-slug";
  const slugClash = draft.slug.trim().length > 0 && takenSlugs.includes(draft.slug);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Distribution Page"
      description="Enter the basics to create the page. You can edit everything later."
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
            <Check size={15} /> Add Page
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
            shape="circle"
            size={72}
            hint="400 × 400 px"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Page Name *"
              value={draft.name}
              onChange={(e) => {
                const name = e.target.value;
                setDraft((p) => ({
                  ...p,
                  name,
                  initials: p.initials || name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase(),
                  slug: p.slug ? p.slug : slugify(name),
                }));
              }}
              placeholder="Hustle Empire"
            />
          </div>
          <Input label="Handle" value={draft.handle} onChange={(e) => set({ handle: e.target.value })} placeholder="@hustleempire" />
          <Input label="Followers (display)" value={draft.followers} onChange={(e) => set({ followers: e.target.value })} placeholder="3.4M" />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-1.5 uppercase tracking-wider">
            URL Slug <span className="text-[#0B0B0B]/35 font-normal normal-case tracking-normal">— /distribution/<strong className="font-semibold text-[#0B0B0B]/60">{slugPreview}</strong></span>
          </label>
          <div className="flex items-stretch border border-[#0B0B0B]/12 rounded-xl overflow-hidden bg-white focus-within:border-[#0B0B0B]/40">
            <span className="px-3 py-2.5 text-[12px] text-[#0B0B0B]/35 bg-[#0B0B0B]/4 border-r border-[#0B0B0B]/8 font-mono whitespace-nowrap flex items-center">/distribution/</span>
            <input
              value={draft.slug}
              onChange={(e) => set({ slug: slugify(e.target.value) })}
              placeholder="hustle-empire"
              className="flex-1 px-3 py-2.5 text-[13px] text-[#0B0B0B] placeholder-[#0B0B0B]/30 outline-none font-mono"
            />
          </div>
          {slugClash && <p className="text-[11px] text-amber-600 font-semibold mt-1.5">This slug is taken — it'll be auto-numbered when you add the page.</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-1.5 uppercase tracking-wider">Niche</label>
            <select
              value={draft.niche}
              onChange={(e) => set({ niche: e.target.value })}
              className="w-full border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[13px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/40 bg-white"
            >
              {niches.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-1.5 uppercase tracking-wider">Country</label>
            <select
              value={draft.country}
              onChange={(e) => set({ country: e.target.value })}
              className="w-full border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[13px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/40 bg-white"
            >
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Initials (fallback avatar)" value={draft.initials} onChange={(e) => set({ initials: e.target.value.toUpperCase().slice(0, 3) })} placeholder="HE" />
          <div>
            <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-1.5 uppercase tracking-wider">Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={draft.accentColor}
                onChange={(e) => set({ accentColor: e.target.value })}
                className="w-10 h-10 rounded-xl border border-[#0B0B0B]/12 cursor-pointer p-1"
              />
              <Input label="" value={draft.accentColor} onChange={(e) => set({ accentColor: e.target.value })} placeholder="#0B0B0B" className="flex-1" />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => set({ highEngagement: !draft.highEngagement })}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
            draft.highEngagement
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-[#0B0B0B]/5 text-[#0B0B0B]/40 border-[#0B0B0B]/10 hover:border-[#0B0B0B]/20"
          }`}
        >
          <Zap size={13} /> {draft.highEngagement ? "High Engagement - ON" : "High Engagement - OFF"}
        </button>

        <div className="flex items-center justify-between rounded-xl border border-[#0B0B0B]/10 px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold text-[#0B0B0B]">{draft.profileEnabled ? "Publish now (Live)" : "Save as Draft (Hidden)"}</p>
            <p className="text-[12px] text-[#0B0B0B]/40">
              {draft.profileEnabled ? "Visible on the public site right away." : "Stays hidden from the public site until you switch it to Live."}
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

export default function AdminDistributionPages() {
  const { getContentResult, saveContent } = useAdmin();
  const [items, setItems] = useState<DistPage[]>([]);
  const [niches, setNiches] = useState<string[]>([...DISTRIBUTION_NICHES]);
  const [countries, setCountries] = useState<string[]>([...DISTRIBUTION_COUNTRIES]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [search, setSearch] = useState("");
  const [nicheFilter, setNicheFilter] = useState("All");
  const [countryFilter, setCountryFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "3months" | "6months" | "1year">("all");
  const [newIndex, setNewIndex] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [view, setView] = useState<"active" | "trash">("active");
  const [listsOpen, setListsOpen] = useState(false);

  const load = useCallback(() => {
    setLoadState("loading");
    getContentResult("distribution-pages").then((res) => {
      // Fail closed: on a load FAILURE never mount the editor, so a Save can
      // never overwrite real data with demo defaults (deleted-ghost re-intro).
      if (!res.ok) { setLoadState("error"); return; }
      const d = res.data;
      setItems(Array.isArray(d?.items) ? (d!.items as DistPage[]) : []);
      if (Array.isArray(d?.niches)) setNiches(d!.niches as string[]);
      if (Array.isArray(d?.countries)) setCountries(d!.countries as string[]);
      setLoadState("ready");
    });
  }, [getContentResult]);

  useEffect(() => { load(); }, [load]);

  function handleChange(i: number, val: DistPage) {
    setSaved(false);
    setItems((p) => p.map((x, idx) => (idx === i ? { ...val, updatedAt: new Date().toISOString() } : x)));
  }

  // Soft delete → move to Trash (reversible, so no confirm needed).
  function handleDelete(i: number) {
    setSaved(false);
    const now = new Date().toISOString();
    setItems((p) => p.map((x, idx) => (idx === i ? { ...x, trashed: true, trashedAt: now, updatedAt: now } : x)));
    if (newIndex === i) setNewIndex(null);
  }

  function handleRestore(i: number) {
    setSaved(false);
    const now = new Date().toISOString();
    setItems((p) => p.map((x, idx) => (idx === i ? { ...x, trashed: false, trashedAt: undefined, updatedAt: now } : x)));
  }

  function handlePermanentDelete(i: number) {
    if (!confirm("Permanently delete this page? This cannot be undone.")) return;
    setSaved(false);
    setItems((p) => {
      const next = p.filter((_, idx) => idx !== i);
      if (newIndex !== null) {
        if (i === newIndex) setNewIndex(null);
        else if (i < newIndex) setNewIndex(newIndex - 1);
      }
      return next;
    });
  }

  function handleDuplicate(i: number) {
    setSaved(false);
    setItems((prev) => {
      const source = prev[i];
      if (!source) return prev;
      const usedSlugs = new Set(prev.map((p) => p.slug).filter(Boolean));
      // Pick the next available "<slug>-copy", "-copy-2", etc.
      const baseSlug = source.slug ? `${source.slug}-copy` : "new-page-copy";
      let candidate = baseSlug;
      let n = 2;
      while (usedSlugs.has(candidate)) {
        candidate = `${baseSlug}-${n}`;
        n += 1;
      }
      const clone: DistPage = {
        ...source,
        slug: candidate,
        name: source.name ? `${source.name} (Copy)` : "",
        profileEnabled: false, // hidden by default so the duplicate doesn't go live until you're ready
        trashed: false,
        trashedAt: undefined,
        updatedAt: new Date().toISOString(),
      };
      const insertAt = i + 1;
      const next = [...prev.slice(0, insertAt), clone, ...prev.slice(insertAt)];
      setNewIndex(insertAt);
      // adjust scroll/focus by clearing filters so the duplicate is visible
      setSearch("");
      setNicheFilter("All");
      setCountryFilter("All");
      setDateFilter("all");
      return next;
    });
    setView("active");
  }

  function addNew() {
    setShowAddModal(true);
  }

  function handleNewSubmit(page: DistPage) {
    setSaved(false);
    setItems((p) => {
      const slug = uniqueSlug(page.slug || slugify(page.name), p.map((x) => x.slug).filter(Boolean));
      return [{ ...page, slug, trashed: false, updatedAt: new Date().toISOString() }, ...p];
    });
    setShowAddModal(false);
    setNewIndex(0);
    setView("active");
    setSearch("");
    setNicheFilter("All");
    setCountryFilter("All");
    setDateFilter("all");
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent("distribution-pages", { items, niches, countries });
      setSaved(true);
      setNewIndex(null);
    } finally {
      setSaving(false);
    }
  }

  const activeItems = items.filter((p) => !p.trashed);
  const trashedItems = items.filter((p) => p.trashed);

  const filtered = activeItems.filter((page) => {
    const q = search.toLowerCase();
    const matchSearch = !q || page.name.toLowerCase().includes(q) || page.handle.toLowerCase().includes(q) || page.niche.toLowerCase().includes(q);
    const matchNiche = nicheFilter === "All" || page.niche === nicheFilter;
    const matchCountry = countryFilter === "All" || page.country === countryFilter;
    let matchDate = true;
    if (dateFilter !== "all") {
      if (!page.updatedAt) { matchDate = false; }
      else {
        const updated = new Date(page.updatedAt).getTime();
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

  function exportExcel() {
    const dateLabel: Record<typeof dateFilter, string> = {
      all: "All time", today: "Today", week: "This week",
      month: "This month", "3months": "3 months", "6months": "6 months", "1year": "1 year",
    };
    const rows = filtered.map((p) => ({
      Name: p.name,
      Handle: p.handle,
      Niche: p.niche,
      Followers: p.followers,
      "Followers (raw)": p.followersRaw,
      Country: p.country,
      "High Engagement": p.highEngagement ? "Yes" : "No",
      Status: p.profileEnabled !== false ? "Live" : "Hidden",
      "Last Updated": p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Never",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 18 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Distribution Pages");

    const parts: string[] = [];
    if (nicheFilter !== "All") parts.push(nicheFilter.replace(/\s+/g, "-").toLowerCase());
    if (countryFilter !== "All") parts.push(countryFilter.toLowerCase());
    if (dateFilter !== "all") parts.push(dateLabel[dateFilter].replace(/\s+/g, "-").toLowerCase());
    const suffix = parts.length ? `-${parts.join("-")}` : "";
    XLSX.writeFile(wb, `distribution-pages${suffix}.xlsx`);
  }

  const liveCount = activeItems.filter((p) => p.profileEnabled !== false).length;
  const hiddenCount = activeItems.length - liveCount;
  const highEngagementCount = activeItems.filter((p) => p.highEngagement).length;
  const trashCount = trashedItems.length;

  if (loadState !== "ready") {
    return (
      <div>
        <PageHeader title="Distribution Pages" description={loadState === "error" ? "Couldn't load saved content" : "Loading…"} />
        {loadState === "error" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-[13px] text-red-600 max-w-md">Couldn't load your saved distribution pages. To protect your live data, editing is disabled until this loads successfully.</p>
            <button onClick={load} className="text-[12px] font-semibold bg-[#0B0B0B] text-white px-4 py-2 rounded-xl hover:bg-[#0B0B0B]/85 transition-colors">Retry</button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-24 text-[13px] text-[#0B0B0B]/40">Loading content…</div>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Distribution Pages"
        description={`${activeItems.length} page${activeItems.length !== 1 ? "s" : ""} · ${liveCount} live · ${hiddenCount} hidden · ${highEngagementCount} high engagement`}
      />

      {/* Active / Trash tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-[#0B0B0B]/8">
        <button
          onClick={() => setView("active")}
          className={`px-4 py-2.5 text-[13px] font-semibold -mb-px border-b-2 transition-colors ${
            view === "active" ? "border-[#0B0B0B] text-[#0B0B0B]" : "border-transparent text-[#0B0B0B]/40 hover:text-[#0B0B0B]/70"
          }`}
        >
          Active ({activeItems.length})
        </button>
        <button
          onClick={() => setView("trash")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold -mb-px border-b-2 transition-colors ${
            view === "trash" ? "border-[#0B0B0B] text-[#0B0B0B]" : "border-transparent text-[#0B0B0B]/40 hover:text-[#0B0B0B]/70"
          }`}
        >
          <Trash2 size={13} /> Trash ({trashCount})
        </button>
      </div>

      {view === "active" && (
      <>
      {/* Niche & Country list manager */}
      <Card className="mb-5 overflow-hidden p-0">
        <button
          onClick={() => setListsOpen((p) => !p)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#0B0B0B]/3 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Settings2 size={15} className="text-[#0B0B0B]/40" />
            <span className="text-[13px] font-semibold text-[#0B0B0B]">Manage Niche &amp; Country Lists</span>
            <span className="text-[11px] text-[#0B0B0B]/35">{niches.length} niches · {countries.length} countries</span>
          </div>
          {listsOpen ? <ChevronUp size={14} className="text-[#0B0B0B]/30" /> : <ChevronDown size={14} className="text-[#0B0B0B]/30" />}
        </button>
        {listsOpen && (
          <div className="border-t border-[#0B0B0B]/8 px-5 py-5 grid grid-cols-2 gap-8">
            <TagListEditor title="Niche List" tags={niches} onChange={(next) => { setNiches(next); setSaved(false); }} />
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
            placeholder="Search by name, handle or niche..."
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
          <Download size={14} /> Export Excel
        </button>

        <button
          onClick={addNew}
          className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-xl bg-[#0B0B0B] text-white hover:bg-[#0B0B0B]/85 transition-all cursor-pointer"
        >
          <Plus size={15} /> Add Page
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

      {/* Niche filter chips */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {(["All", ...niches] as string[]).map((niche) => {
            const count = niche === "All" ? activeItems.length : activeItems.filter((p) => p.niche === niche).length;
            const active = nicheFilter === niche;
            if (count === 0 && niche !== "All") return null;
            return (
              <button
                key={niche}
                onClick={() => setNicheFilter(niche)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all shrink-0 ${
                  active
                    ? "bg-[#0B0B0B] text-white border-[#0B0B0B]"
                    : "bg-white text-[#0B0B0B]/55 border-[#0B0B0B]/12 hover:border-[#0B0B0B]/30 hover:text-[#0B0B0B]"
                }`}
              >
                {niche === "All" ? "All Niches" : niche}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-[#0B0B0B]/8 text-[#0B0B0B]/50"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        {(search || nicheFilter !== "All" || countryFilter !== "All" || dateFilter !== "all") && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[12px] text-[#0B0B0B]/40">
              Showing {filtered.length} of {activeItems.length} pages
            </span>
            <button
              onClick={() => { setSearch(""); setNicheFilter("All"); setCountryFilter("All"); setDateFilter("all"); }}
              className="text-[11px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] underline underline-offset-2 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {filtered.map((page) => {
          const realIndex = items.indexOf(page);
          return (
            <PageRow
              key={page.slug + realIndex}
              page={page}
              index={realIndex}
              niches={niches}
              countries={countries}
              allSlugs={items.map((p) => p.slug)}
              onChange={handleChange}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              defaultOpen={realIndex === newIndex}
            />
          );
        })}
        {filtered.length === 0 && (
          <Card>
            <p className="text-[13px] text-[#0B0B0B]/40 text-center py-6">No pages match your filter.</p>
          </Card>
        )}
      </div>
      </>
      )}

      {view === "trash" && (
        <div className="space-y-3">
          {trashedItems.length === 0 && (
            <Card>
              <p className="text-[13px] text-[#0B0B0B]/40 text-center py-10">Trash is empty.</p>
            </Card>
          )}
          {trashedItems.map((page) => {
            const realIndex = items.indexOf(page);
            return (
              <Card key={page.slug + realIndex} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {page.photo ? (
                    <img src={page.photo} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold text-white"
                      style={{ background: page.accentColor || "#0B0B0B" }}
                    >
                      {page.initials || page.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#0B0B0B] truncate">{page.name || "Untitled page"}</p>
                    <p className="text-[11px] text-[#0B0B0B]/40 truncate">
                      {page.handle || `/distribution/${page.slug}`}
                      {page.trashedAt ? ` · trashed ${new Date(page.trashedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRestore(realIndex)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <RotateCcw size={12} /> Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(realIndex)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <SaveBar onSave={handleSave} saving={saving} saved={saved} />

      <AddDistributionModal
        open={showAddModal}
        niches={niches}
        countries={countries}
        takenSlugs={items.map((p) => p.slug).filter(Boolean)}
        onSubmit={handleNewSubmit}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
}
