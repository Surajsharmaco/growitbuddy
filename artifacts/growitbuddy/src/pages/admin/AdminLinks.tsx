import { useEffect, useState, type ReactNode } from "react";
import {
  Plus, Trash2, Star, ArrowUp, ArrowDown, ExternalLink, Eye, EyeOff,
  Link2, Share2, Video, Type as TextIcon, Image as ImageIcon, Minus,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar, Field } from "@/components/admin/AdminField";
import { ImagePickerField } from "@/components/admin/ImagePickerField";
import {
  LINKS_DEFAULTS, SOCIAL_PLATFORMS, SECTION_TYPES,
  migrateLinksData, createSection, createLinkItem, createSocialItem,
  type LinksData, type LinkSection, type SectionType,
  type LinksSection, type SocialsSection, type VideoSection,
  type TextSection, type ImageSection, type SpacerSection,
} from "@/lib/linksDefaults";
import { sourceLabel } from "@/lib/videoEmbed";

const SECTION_ICONS: Record<SectionType, typeof Link2> = {
  links: Link2,
  socials: Share2,
  video: Video,
  text: TextIcon,
  image: ImageIcon,
  spacer: Minus,
};
const SECTION_LABELS: Record<SectionType, string> = Object.fromEntries(
  SECTION_TYPES.map((t) => [t.key, t.label]),
) as Record<SectionType, string>;

const selectCls =
  "w-full border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[14px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/40 bg-white";

// ── Small reusable item controls (reorder / remove) ───────────────────
function ItemControls({ onUp, onDown, onRemove, isFirst, isLast }: {
  onUp: () => void; onDown: () => void; onRemove: () => void; isFirst: boolean; isLast: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 pt-1 text-[#0B0B0B]/25">
      <button onClick={onUp} disabled={isFirst} className="hover:text-[#0B0B0B] disabled:opacity-25 transition-colors" title="Move up"><ArrowUp size={14} /></button>
      <button onClick={onDown} disabled={isLast} className="hover:text-[#0B0B0B] disabled:opacity-25 transition-colors" title="Move down"><ArrowDown size={14} /></button>
    </div>
  );
}

function move<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const next = [...arr];
  const target = index + dir;
  if (target < 0 || target >= next.length) return arr;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

// ── Per-type editors ──────────────────────────────────────────────────
function LinksSectionEditor({ section, onChange }: { section: LinksSection; onChange: (s: LinksSection) => void }) {
  const items = section.items || [];
  const setItems = (next: typeof items) => onChange({ ...section, items: next });
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Section heading (optional)" value={section.title || ""} onChange={(e) => onChange({ ...section, title: e.target.value })} placeholder="e.g. My Services" />
        <Field label="Layout">
          <select value={section.layout || "list"} onChange={(e) => onChange({ ...section, layout: e.target.value as "list" | "grid" })} className={selectCls}>
            <option value="list">List (full-width buttons)</option>
            <option value="grid">Grid (2 columns)</option>
          </select>
        </Field>
      </div>

      {items.length === 0 && <p className="text-[13px] text-[#0B0B0B]/40">No links yet. Add your first one.</p>}
      <div className="flex flex-col gap-3">
        {items.map((l, i) => (
          <div key={l.id} className={`rounded-2xl border p-4 ${l.featured ? "border-[#0B0B0B]/30 bg-[#0B0B0B]/[0.03]" : "border-[#0B0B0B]/10"}`}>
            <div className="flex items-start gap-3">
              <ItemControls
                isFirst={i === 0}
                isLast={i === items.length - 1}
                onUp={() => setItems(move(items, i, -1))}
                onDown={() => setItems(move(items, i, 1))}
                onRemove={() => setItems(items.filter((x) => x.id !== l.id))}
              />
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <Input value={l.label} onChange={(e) => setItems(items.map((x) => x.id === l.id ? { ...x, label: e.target.value } : x))} placeholder="Link title (e.g. Book a Call)" />
                <Input value={l.sublabel || ""} onChange={(e) => setItems(items.map((x) => x.id === l.id ? { ...x, sublabel: e.target.value } : x))} placeholder="Optional subtitle" />
                <Input value={l.url} onChange={(e) => setItems(items.map((x) => x.id === l.id ? { ...x, url: e.target.value } : x))} placeholder="https://… or /contact for an internal page" />
                <Field label="Style">
                  <select
                    value={l.display || "normal"}
                    onChange={(e) => setItems(items.map((x) => x.id === l.id ? { ...x, display: e.target.value as "normal" | "large" | "image" } : x))}
                    className={selectCls}
                  >
                    <option value="normal">Normal row (small icon + text)</option>
                    <option value="large">Large card (big thumbnail + text)</option>
                    <option value="image">Thumbnail only (big image, no text)</option>
                  </select>
                </Field>
                <ImagePickerField
                  label={l.display === "large" || l.display === "image" ? "Thumbnail (shown big — recommended)" : "Thumbnail (optional)"}
                  value={l.thumbnailUrl || ""}
                  onChange={(url) => setItems(items.map((x) => x.id === l.id ? { ...x, thumbnailUrl: url } : x))}
                  shape="square"
                  size={l.display === "large" || l.display === "image" ? 96 : 48}
                />
                <div className="flex items-center gap-5 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={l.featured || false} onChange={(e) => setItems(items.map((x) => x.id === l.id ? { ...x, featured: e.target.checked } : x))} className="w-4 h-4 accent-[#0B0B0B]" />
                    <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#0B0B0B]/70"><Star size={13} /> Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={l.enabled !== false} onChange={(e) => setItems(items.map((x) => x.id === l.id ? { ...x, enabled: e.target.checked } : x))} className="w-4 h-4 accent-[#0B0B0B]" />
                    <span className="text-[12.5px] font-medium text-[#0B0B0B]/70">Visible</span>
                  </label>
                </div>
              </div>
              <button onClick={() => setItems(items.filter((x) => x.id !== l.id))} className="shrink-0 p-2 text-[#0B0B0B]/40 hover:text-red-500 transition-colors" title="Remove link">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setItems([...items, createLinkItem()])} className="self-start inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0B0B0B] bg-[#0B0B0B]/5 hover:bg-[#0B0B0B]/10 px-3 py-1.5 rounded-lg transition-colors">
        <Plus size={13} /> Add link
      </button>
    </div>
  );
}

function SocialsSectionEditor({ section, onChange }: { section: SocialsSection; onChange: (s: SocialsSection) => void }) {
  const socials = section.socials || [];
  const setSocials = (next: typeof socials) => onChange({ ...section, socials: next });
  return (
    <div className="flex flex-col gap-3">
      <Input label="Section heading (optional)" value={section.title || ""} onChange={(e) => onChange({ ...section, title: e.target.value })} placeholder="e.g. Follow us" />
      {socials.length === 0 && <p className="text-[13px] text-[#0B0B0B]/40">No social icons yet.</p>}
      {socials.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2.5">
          <select value={s.platform} onChange={(e) => setSocials(socials.map((x) => x.id === s.id ? { ...x, platform: e.target.value } : x))} className="w-40 shrink-0 border border-[#0B0B0B]/12 rounded-xl px-3 py-2.5 text-[13px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/40 bg-white">
            {SOCIAL_PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <Input value={s.url} onChange={(e) => setSocials(socials.map((x) => x.id === s.id ? { ...x, url: e.target.value } : x))} placeholder="https://instagram.com/yourname" className="flex-1" />
          <button onClick={() => setSocials(move(socials, i, -1))} disabled={i === 0} className="shrink-0 p-1.5 text-[#0B0B0B]/30 hover:text-[#0B0B0B] disabled:opacity-25 transition-colors" title="Move up"><ArrowUp size={14} /></button>
          <button onClick={() => setSocials(move(socials, i, 1))} disabled={i === socials.length - 1} className="shrink-0 p-1.5 text-[#0B0B0B]/30 hover:text-[#0B0B0B] disabled:opacity-25 transition-colors" title="Move down"><ArrowDown size={14} /></button>
          <button onClick={() => setSocials(socials.filter((x) => x.id !== s.id))} className="shrink-0 p-2 text-[#0B0B0B]/40 hover:text-red-500 transition-colors" title="Remove"><Trash2 size={15} /></button>
        </div>
      ))}
      <button onClick={() => setSocials([...socials, createSocialItem()])} className="self-start inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0B0B0B] bg-[#0B0B0B]/5 hover:bg-[#0B0B0B]/10 px-3 py-1.5 rounded-lg transition-colors">
        <Plus size={13} /> Add social
      </button>
    </div>
  );
}

function VideoSectionEditor({ section, onChange }: { section: VideoSection; onChange: (s: VideoSection) => void }) {
  const label = section.videoUrl ? sourceLabel(section.videoUrl) : "";
  return (
    <div className="flex flex-col gap-4">
      <Input label="Section heading (optional)" value={section.title || ""} onChange={(e) => onChange({ ...section, title: e.target.value })} placeholder="e.g. Watch our story" />
      <Input
        label="Video link"
        hint={label ? `Detected: ${label}` : "Paste a YouTube, Vimeo, Google Drive or Gumlet link, an embed snippet, or a direct .mp4/.webm/.ogg URL."}
        value={section.videoUrl}
        onChange={(e) => onChange({ ...section, videoUrl: e.target.value })}
        placeholder="https://youtube.com/watch?v=…"
      />
      <Input label="Caption (optional)" value={section.caption || ""} onChange={(e) => onChange({ ...section, caption: e.target.value })} placeholder="A short line under the video" />
    </div>
  );
}

function TextSectionEditor({ section, onChange }: { section: TextSection; onChange: (s: TextSection) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Eyebrow label (optional)" value={section.title || ""} onChange={(e) => onChange({ ...section, title: e.target.value })} placeholder="e.g. About" />
        <Field label="Alignment">
          <select value={section.align || "left"} onChange={(e) => onChange({ ...section, align: e.target.value as "left" | "center" })} className={selectCls}>
            <option value="left">Left</option>
            <option value="center">Center</option>
          </select>
        </Field>
      </div>
      <Input label="Heading (optional)" value={section.heading || ""} onChange={(e) => onChange({ ...section, heading: e.target.value })} placeholder="A bold heading" />
      <Textarea label="Body (optional)" value={section.body || ""} onChange={(e) => onChange({ ...section, body: e.target.value })} placeholder="Write a paragraph…" />
    </div>
  );
}

function ImageSectionEditor({ section, onChange }: { section: ImageSection; onChange: (s: ImageSection) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Input label="Section heading (optional)" value={section.title || ""} onChange={(e) => onChange({ ...section, title: e.target.value })} placeholder="e.g. Latest drop" />
      <Field label="Image">
        <ImagePickerField value={section.imageUrl} onChange={(url) => onChange({ ...section, imageUrl: url })} shape="square" size={72} />
      </Field>
      <Input label="Click-through link (optional)" value={section.linkUrl || ""} onChange={(e) => onChange({ ...section, linkUrl: e.target.value })} placeholder="https://… or /contact" />
      <Input label="Caption (optional)" value={section.caption || ""} onChange={(e) => onChange({ ...section, caption: e.target.value })} placeholder="A short line under the image" />
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input type="checkbox" checked={section.rounded !== false} onChange={(e) => onChange({ ...section, rounded: e.target.checked })} className="w-4 h-4 accent-[#0B0B0B]" />
        <span className="text-[13px] font-medium text-[#0B0B0B]/70">Rounded corners</span>
      </label>
    </div>
  );
}

function SpacerSectionEditor({ section, onChange }: { section: SpacerSection; onChange: (s: SpacerSection) => void }) {
  return (
    <Field label="Spacing size">
      <select value={section.size || "md"} onChange={(e) => onChange({ ...section, size: e.target.value as "sm" | "md" | "lg" })} className={selectCls}>
        <option value="sm">Small</option>
        <option value="md">Medium</option>
        <option value="lg">Large</option>
      </select>
    </Field>
  );
}

function SectionEditor({ section, onChange }: { section: LinkSection; onChange: (s: LinkSection) => void }) {
  switch (section.type) {
    case "links": return <LinksSectionEditor section={section} onChange={onChange} />;
    case "socials": return <SocialsSectionEditor section={section} onChange={onChange} />;
    case "video": return <VideoSectionEditor section={section} onChange={onChange} />;
    case "text": return <TextSectionEditor section={section} onChange={onChange} />;
    case "image": return <ImageSectionEditor section={section} onChange={onChange} />;
    case "spacer": return <SpacerSectionEditor section={section} onChange={onChange} />;
    default: return null;
  }
}

// ── Section card wrapper (header controls) ────────────────────────────
function SectionCard({ section, index, total, onMove, onToggle, onRemove, children }: {
  section: LinkSection; index: number; total: number;
  onMove: (dir: -1 | 1) => void; onToggle: () => void; onRemove: () => void; children: ReactNode;
}) {
  const Icon = SECTION_ICONS[section.type];
  const hidden = section.enabled === false;
  return (
    <Card className={hidden ? "opacity-60" : ""}>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#0B0B0B]/8">
        <Icon size={16} className="text-[#0B0B0B]/45" />
        <h2 className="text-[14px] font-bold text-[#0B0B0B]">{SECTION_LABELS[section.type]}</h2>
        {hidden && <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B0B0B]/35 bg-[#0B0B0B]/5 px-2 py-0.5 rounded-full">Hidden</span>}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => onMove(-1)} disabled={index === 0} className="p-1.5 text-[#0B0B0B]/30 hover:text-[#0B0B0B] disabled:opacity-25 transition-colors" title="Move section up"><ArrowUp size={15} /></button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} className="p-1.5 text-[#0B0B0B]/30 hover:text-[#0B0B0B] disabled:opacity-25 transition-colors" title="Move section down"><ArrowDown size={15} /></button>
          <button onClick={onToggle} className="p-1.5 text-[#0B0B0B]/40 hover:text-[#0B0B0B] transition-colors" title={hidden ? "Show section" : "Hide section"}>
            {hidden ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <button onClick={onRemove} className="p-1.5 text-[#0B0B0B]/40 hover:text-red-500 transition-colors" title="Remove section"><Trash2 size={15} /></button>
        </div>
      </div>
      {children}
    </Card>
  );
}

export default function AdminLinks() {
  const { getContent, saveContent } = useAdmin();
  const [data, setData] = useState<LinksData>(() => migrateLinksData(LINKS_DEFAULTS));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getContent("links").then((d) => setData(migrateLinksData(d ?? {})));
  }, [getContent]);

  function patch(p: Partial<LinksData>) {
    setSaved(false);
    setData((prev) => ({ ...prev, ...p }));
  }
  function setSections(next: LinkSection[]) {
    patch({ sections: next });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: LinksData = {
        schemaVersion: 2,
        profileName: data.profileName,
        username: data.username,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        verified: data.verified,
        accentColor: data.accentColor,
        sections: data.sections,
        footerNote: data.footerNote,
      };
      await saveContent("links", payload as unknown as Record<string, unknown>);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Links Page"
        description={
          <span>
            Your premium bio link page, live at{" "}
            <a href="/links" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0B0B0B]/70 underline inline-flex items-center gap-1">
              /links <ExternalLink size={12} />
            </a>
            . Build it from sections — add, hide, reorder or remove anything.
          </span>
        }
      />

      <div className="flex flex-col gap-5">
        {/* Profile */}
        <Card>
          <SectionTitle>Profile</SectionTitle>
          <div className="flex flex-col gap-4">
            <ImagePickerField label="Profile Photo" value={data.avatarUrl} onChange={(url) => patch({ avatarUrl: url })} shape="circle" size={72} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Display Name" value={data.profileName} onChange={(e) => patch({ profileName: e.target.value })} placeholder="GrowitBuddy" />
              <Input label="Handle / Username" value={data.username} onChange={(e) => patch({ username: e.target.value })} placeholder="@growitbuddy" />
            </div>
            <Textarea label="Bio" value={data.bio} onChange={(e) => patch({ bio: e.target.value })} placeholder="A short line about you or your brand." />
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" checked={data.verified} onChange={(e) => patch({ verified: e.target.checked })} className="w-4 h-4 accent-[#0B0B0B]" />
              <span className="text-[13px] font-medium text-[#0B0B0B]/70">Show verified badge next to name</span>
            </label>
          </div>
        </Card>

        {/* Appearance */}
        <Card>
          <SectionTitle>Appearance</SectionTitle>
          <Field label="Accent color" hint="Soft gold by default — used for highlights, the avatar ring and featured buttons.">
            <div className="flex items-center gap-2.5 max-w-xs">
              <input type="color" value={data.accentColor} onChange={(e) => patch({ accentColor: e.target.value })} className="w-11 h-11 rounded-xl border border-[#0B0B0B]/12 bg-white cursor-pointer p-1" />
              <Input value={data.accentColor} onChange={(e) => patch({ accentColor: e.target.value })} placeholder="#C2A878" className="flex-1" />
            </div>
          </Field>
        </Card>

        {/* Sections */}
        {data.sections.map((section, i) => (
          <SectionCard
            key={section.id}
            section={section}
            index={i}
            total={data.sections.length}
            onMove={(dir) => setSections(move(data.sections, i, dir))}
            onToggle={() => setSections(data.sections.map((s) => s.id === section.id ? { ...s, enabled: s.enabled === false } : s))}
            onRemove={() => setSections(data.sections.filter((s) => s.id !== section.id))}
          >
            <SectionEditor section={section} onChange={(next) => setSections(data.sections.map((s) => s.id === section.id ? next : s))} />
          </SectionCard>
        ))}

        {/* Add section */}
        <Card className="border-dashed">
          <SectionTitle>Add a section</SectionTitle>
          <div className="flex flex-wrap gap-2.5">
            {SECTION_TYPES.map((t) => {
              const Icon = SECTION_ICONS[t.key];
              return (
                <button
                  key={t.key}
                  onClick={() => setSections([...data.sections, createSection(t.key)])}
                  title={t.hint}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0B0B0B] bg-[#0B0B0B]/5 hover:bg-[#0B0B0B]/10 px-3.5 py-2 rounded-xl transition-colors"
                >
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Footer */}
        <Card>
          <SectionTitle>Footer</SectionTitle>
          <Textarea label="Footer note (optional)" value={data.footerNote} onChange={(e) => patch({ footerNote: e.target.value })} placeholder="e.g. © 2026 GrowitBuddy. All rights reserved." />
        </Card>
      </div>

      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
