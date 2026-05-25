import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { ImagePickerField } from "@/components/admin/ImagePickerField";
import { Plus, Trash2 } from "lucide-react";

import { ABOUT_DEFAULTS as DEFAULTS, type AboutData } from "@/lib/aboutDefaults";

export default function AdminAbout() {
  const { getContent, saveContent } = useAdmin();
  const [data, setData] = useState<AboutData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getContent("about")
      .then((d) => {
        if (d) setData({ ...DEFAULTS, ...(d as Partial<AboutData>) });
      })
      .finally(() => setLoaded(true));
  }, [getContent]);

  function set<K extends keyof AboutData>(key: K, val: AboutData[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent("about", data as unknown as Record<string, unknown>);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div>
        <PageHeader title="About Page" description="Edit the founder section, mission, team, and values." />
        <div className="flex items-center justify-center py-24 text-[13px] text-[#0B0B0B]/40">Loading content…</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="About Page" description="Edit the founder section, mission, team, and values." />

      <div className="space-y-5">
        <Card>
          <SectionTitle>Founder</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Name" value={data.founderName} onChange={(e) => set("founderName", e.target.value)} />
            <Input label="Role / Title" value={data.founderRole} onChange={(e) => set("founderRole", e.target.value)} />
            <div className="col-span-2">
              <ImagePickerField label="Photo" value={data.founderPhoto} onChange={(url) => set("founderPhoto", url)} shape="circle" size={72} hint="Recommended: 400 × 400 px (square) • JPG or PNG • Face centered" />
            </div>
            <Textarea label="Bio" value={data.founderBio} onChange={(e) => set("founderBio", e.target.value)} rows={4} className="col-span-2" />
            <Input label="LinkedIn URL" value={data.founderLinkedin} onChange={(e) => set("founderLinkedin", e.target.value)} placeholder="https://linkedin.com/in/..." />
            <Input label="Twitter / X URL" value={data.founderTwitter} onChange={(e) => set("founderTwitter", e.target.value)} placeholder="https://x.com/..." />
            <Input label="Instagram URL" value={data.founderInstagram} onChange={(e) => set("founderInstagram", e.target.value)} placeholder="https://instagram.com/..." />
          </div>
        </Card>

        <Card>
          <SectionTitle>Stats Strip</SectionTitle>
          <div className="space-y-3">
            {data.stats.map((s, i) => (
              <div key={i} className="flex gap-3 items-start border border-[#0B0B0B]/8 rounded-xl p-3">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input label="Value" value={s.value} onChange={(e) => { const arr = [...data.stats]; arr[i] = { ...s, value: e.target.value }; set("stats", arr); }} placeholder="700M+" />
                  <Input label="Label" value={s.label} onChange={(e) => { const arr = [...data.stats]; arr[i] = { ...s, label: e.target.value }; set("stats", arr); }} placeholder="Views Generated" />
                </div>
                <button onClick={() => { const arr = data.stats.filter((_, x) => x !== i); set("stats", arr); }} className="p-2 text-[#0B0B0B]/40 hover:text-red-500" aria-label="Remove stat"><Trash2 size={14} /></button>
              </div>
            ))}
            <button onClick={() => set("stats", [...data.stats, { value: "", label: "" }])} className="flex items-center gap-2 text-[12px] text-[#0B0B0B]/60 hover:text-[#0B0B0B] border border-dashed border-[#0B0B0B]/15 rounded-xl px-3 py-2 w-full justify-center">
              <Plus size={14} /> Add stat
            </button>
          </div>
        </Card>

        <Card>
          <SectionTitle>Mission</SectionTitle>
          <div className="space-y-3">
            <Input label="Headline" value={data.missionHeadline} onChange={(e) => set("missionHeadline", e.target.value)} />
            <Textarea label="Body" value={data.missionBody} onChange={(e) => set("missionBody", e.target.value)} rows={3} />
          </div>
        </Card>

        <Card>
          <SectionTitle>Values</SectionTitle>
          <div className="space-y-3">
            {data.values.map((v, i) => (
              <div key={i} className="flex gap-3 items-start border border-[#0B0B0B]/8 rounded-xl p-3">
                <div className="flex-1 space-y-2">
                  <Input value={v.title} onChange={(e) => { const vs = [...data.values]; vs[i] = { ...v, title: e.target.value }; set("values", vs); }} placeholder="Value title" />
                  <Textarea value={v.description} onChange={(e) => { const vs = [...data.values]; vs[i] = { ...v, description: e.target.value }; set("values", vs); }} rows={2} placeholder="Description" />
                </div>
                <button onClick={() => set("values", data.values.filter((_, vi) => vi !== i))} className="p-1.5 text-[#0B0B0B]/25 hover:text-red-500 shrink-0 mt-1"><Trash2 size={13} /></button>
              </div>
            ))}
            <button onClick={() => set("values", [...data.values, { title: "", description: "" }])} className="text-[12px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] flex items-center gap-1"><Plus size={12} /> Add value</button>
          </div>
        </Card>

        <Card>
          <SectionTitle>Team Members</SectionTitle>
          <div className="space-y-3">
            {data.team.map((m, i) => (
              <div key={i} className="flex gap-3 items-start border border-[#0B0B0B]/8 rounded-xl p-3">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input value={m.name} onChange={(e) => { const tm = [...data.team]; tm[i] = { ...m, name: e.target.value }; set("team", tm); }} placeholder="Name" />
                  <Input value={m.role} onChange={(e) => { const tm = [...data.team]; tm[i] = { ...m, role: e.target.value }; set("team", tm); }} placeholder="Role" />
                  <div className="col-span-2">
                    <ImagePickerField value={m.photo} onChange={(url) => { const tm = [...data.team]; tm[i] = { ...m, photo: url }; set("team", tm); }} shape="circle" hint="Recommended: 400 × 400 px (square)" />
                  </div>
                </div>
                <button onClick={() => set("team", data.team.filter((_, ti) => ti !== i))} className="p-1.5 text-[#0B0B0B]/25 hover:text-red-500 shrink-0"><Trash2 size={13} /></button>
              </div>
            ))}
            {data.team.length === 0 && <p className="text-[12px] text-[#0B0B0B]/35 py-2">No team members added yet.</p>}
            <button onClick={() => set("team", [...data.team, { name: "", role: "", photo: "" }])} className="text-[12px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] flex items-center gap-1"><Plus size={12} /> Add team member</button>
          </div>
        </Card>
      </div>

      <PageVisibilityCard slug="about" />
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
