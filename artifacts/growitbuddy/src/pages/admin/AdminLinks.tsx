import { useEffect, useState } from "react";
import { GripVertical, Plus, Trash2, Star, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar, Field } from "@/components/admin/AdminField";
import { ImagePickerField } from "@/components/admin/ImagePickerField";
import {
  LINKS_DEFAULTS, SOCIAL_PLATFORMS,
  type LinksData, type LinkItem, type SocialItem,
} from "@/lib/linksDefaults";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function AdminLinks() {
  const { getContent, saveContent } = useAdmin();
  const [data, setData] = useState<LinksData>({ ...LINKS_DEFAULTS });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getContent("links").then((d) => {
      if (d) setData({ ...LINKS_DEFAULTS, ...(d as Partial<LinksData>) });
    });
  }, [getContent]);

  function patch(p: Partial<LinksData>) {
    setSaved(false);
    setData((prev) => ({ ...prev, ...p }));
  }

  // ── Links ──
  function setLink(id: string, p: Partial<LinkItem>) {
    patch({ links: data.links.map((l) => (l.id === id ? { ...l, ...p } : l)) });
  }
  function addLink() {
    patch({ links: [...data.links, { id: uid(), label: "", sublabel: "", url: "", featured: false, enabled: true }] });
  }
  function removeLink(id: string) {
    patch({ links: data.links.filter((l) => l.id !== id) });
  }
  function moveLink(index: number, dir: -1 | 1) {
    const next = [...data.links];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    patch({ links: next });
  }

  // ── Socials ──
  function setSocial(id: string, p: Partial<SocialItem>) {
    patch({ socials: data.socials.map((s) => (s.id === id ? { ...s, ...p } : s)) });
  }
  function addSocial() {
    patch({ socials: [...data.socials, { id: uid(), platform: "instagram", url: "" }] });
  }
  function removeSocial(id: string) {
    patch({ socials: data.socials.filter((s) => s.id !== id) });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent("links", data as unknown as Record<string, unknown>);
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
            . Put this URL in your social media bio.
          </span>
        }
      />

      <div className="flex flex-col gap-5">
        {/* Profile */}
        <Card>
          <SectionTitle>Profile</SectionTitle>
          <div className="flex flex-col gap-4">
            <ImagePickerField
              label="Profile Photo"
              value={data.avatarUrl}
              onChange={(url) => patch({ avatarUrl: url })}
              shape="circle"
              size={72}
            />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Theme">
              <select
                value={data.theme}
                onChange={(e) => patch({ theme: e.target.value as "dark" | "light" })}
                className="w-full border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[14px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/40 bg-white"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </Field>
            <Field label="Accent Color" hint="Used for highlights, buttons and the glow.">
              <div className="flex items-center gap-2.5">
                <input type="color" value={data.accentColor} onChange={(e) => patch({ accentColor: e.target.value })} className="w-11 h-11 rounded-xl border border-[#0B0B0B]/12 bg-white cursor-pointer p-1" />
                <Input value={data.accentColor} onChange={(e) => patch({ accentColor: e.target.value })} placeholder="#C9A227" className="flex-1" />
              </div>
            </Field>
          </div>
        </Card>

        {/* Social icons */}
        <Card>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#0B0B0B]/8">
            <h2 className="text-[14px] font-bold text-[#0B0B0B]">Social Icons</h2>
            <button onClick={addSocial} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0B0B0B] bg-[#0B0B0B]/5 hover:bg-[#0B0B0B]/10 px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={13} /> Add social
            </button>
          </div>
          {data.socials.length === 0 && <p className="text-[13px] text-[#0B0B0B]/40">No social icons yet.</p>}
          <div className="flex flex-col gap-3">
            {data.socials.map((s) => (
              <div key={s.id} className="flex items-center gap-2.5">
                <select
                  value={s.platform}
                  onChange={(e) => setSocial(s.id, { platform: e.target.value })}
                  className="w-40 shrink-0 border border-[#0B0B0B]/12 rounded-xl px-3 py-2.5 text-[13px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/40 bg-white"
                >
                  {SOCIAL_PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
                <Input value={s.url} onChange={(e) => setSocial(s.id, { url: e.target.value })} placeholder="https://instagram.com/yourname" className="flex-1" />
                <button onClick={() => removeSocial(s.id)} className="shrink-0 p-2 text-[#0B0B0B]/40 hover:text-red-500 transition-colors" title="Remove">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Links */}
        <Card>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#0B0B0B]/8">
            <h2 className="text-[14px] font-bold text-[#0B0B0B]">Links</h2>
            <button onClick={addLink} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0B0B0B] bg-[#0B0B0B]/5 hover:bg-[#0B0B0B]/10 px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={13} /> Add link
            </button>
          </div>
          {data.links.length === 0 && <p className="text-[13px] text-[#0B0B0B]/40">No links yet. Add your first one.</p>}
          <div className="flex flex-col gap-4">
            {data.links.map((l, i) => (
              <div key={l.id} className={`rounded-2xl border p-4 ${l.featured ? "border-[#0B0B0B]/30 bg-[#0B0B0B]/[0.03]" : "border-[#0B0B0B]/10"}`}>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1 text-[#0B0B0B]/25">
                    <button onClick={() => moveLink(i, -1)} disabled={i === 0} className="hover:text-[#0B0B0B] disabled:opacity-25 transition-colors" title="Move up"><ArrowUp size={14} /></button>
                    <GripVertical size={14} />
                    <button onClick={() => moveLink(i, 1)} disabled={i === data.links.length - 1} className="hover:text-[#0B0B0B] disabled:opacity-25 transition-colors" title="Move down"><ArrowDown size={14} /></button>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    <Input value={l.label} onChange={(e) => setLink(l.id, { label: e.target.value })} placeholder="Link title (e.g. Book a Call)" />
                    <Input value={l.sublabel || ""} onChange={(e) => setLink(l.id, { sublabel: e.target.value })} placeholder="Optional subtitle" />
                    <Input value={l.url} onChange={(e) => setLink(l.id, { url: e.target.value })} placeholder="https://… or /contact for an internal page" />
                    <ImagePickerField
                      label="Thumbnail (optional)"
                      value={l.thumbnailUrl || ""}
                      onChange={(url) => setLink(l.id, { thumbnailUrl: url })}
                      shape="square"
                      size={48}
                    />
                    <div className="flex items-center gap-5 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={l.featured || false} onChange={(e) => setLink(l.id, { featured: e.target.checked })} className="w-4 h-4 accent-[#0B0B0B]" />
                        <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#0B0B0B]/70"><Star size={13} /> Featured</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={l.enabled !== false} onChange={(e) => setLink(l.id, { enabled: e.target.checked })} className="w-4 h-4 accent-[#0B0B0B]" />
                        <span className="text-[12.5px] font-medium text-[#0B0B0B]/70">Visible</span>
                      </label>
                    </div>
                  </div>

                  <button onClick={() => removeLink(l.id)} className="shrink-0 p-2 text-[#0B0B0B]/40 hover:text-red-500 transition-colors" title="Remove link">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
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
