import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { SEO_GUIDE_DEFAULTS as DEFAULTS, type SeoGuideData } from "@/lib/seoGuideDefaults";

export default function AdminSeoGuide() {
  const { getContent, saveContent } = useAdmin();
  const [data, setData] = useState<SeoGuideData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getContent("seo-guide")
      .then((d) => {
        if (d) setData({ ...DEFAULTS, ...(d as Partial<SeoGuideData>) });
      })
      .finally(() => setLoaded(true));
  }, [getContent]);

  function set<K extends keyof SeoGuideData>(key: K, val: SeoGuideData[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  function setHero<K extends keyof SeoGuideData["hero"]>(key: K, val: SeoGuideData["hero"][K]) {
    setSaved(false);
    setData((p) => ({ ...p, hero: { ...p.hero, [key]: val } }));
  }

  function updateSection(i: number, field: "heading" | "body", value: string) {
    const arr = [...data.sections];
    arr[i] = { ...arr[i], [field]: value };
    set("sections", arr);
  }

  function moveSection(i: number, dir: -1 | 1) {
    const arr = [...data.sections];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    set("sections", arr);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent("seo-guide", data as unknown as Record<string, unknown>);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div>
        <PageHeader title="SEO Guide" description="Edit the internal /seo-guide page." />
        <div className="flex items-center justify-center py-24 text-[13px] text-[#0B0B0B]/40">Loading content…</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="SEO Guide" description="Edit the hero and every section of the internal /seo-guide page." />

      <div className="space-y-5">
        <Card>
          <SectionTitle>Hero</SectionTitle>
          <div className="space-y-3">
            <Input label="Badge / Eyebrow" value={data.hero.badge} onChange={(e) => setHero("badge", e.target.value)} placeholder="Internal · Not Indexed" />
            <Input label="Title" value={data.hero.title} onChange={(e) => setHero("title", e.target.value)} placeholder="GrowitBuddy — SEO Control Guide" />
            <Textarea label="Lede" value={data.hero.lede} onChange={(e) => setHero("lede", e.target.value)} rows={4} placeholder="Intro paragraph (line breaks are preserved)" />
          </div>
        </Card>

        <Card>
          <SectionTitle>Sections</SectionTitle>
          <div className="space-y-3">
            {data.sections.map((s, i) => (
              <div key={i} className="border border-[#0B0B0B]/8 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-[#0B0B0B]/40 uppercase tracking-wider">Section {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveSection(i, -1)} disabled={i === 0} className="p-1.5 text-[#0B0B0B]/30 hover:text-[#0B0B0B] disabled:opacity-25" aria-label="Move up"><ArrowUp size={13} /></button>
                    <button onClick={() => moveSection(i, 1)} disabled={i === data.sections.length - 1} className="p-1.5 text-[#0B0B0B]/30 hover:text-[#0B0B0B] disabled:opacity-25" aria-label="Move down"><ArrowDown size={13} /></button>
                    <button onClick={() => set("sections", data.sections.filter((_, x) => x !== i))} className="p-1.5 text-[#0B0B0B]/30 hover:text-red-500" aria-label="Remove section"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Input value={s.heading} onChange={(e) => updateSection(i, "heading", e.target.value)} placeholder="Section heading" />
                  <Textarea value={s.body} onChange={(e) => updateSection(i, "body", e.target.value)} rows={6} placeholder="Section body (line breaks and • bullets are preserved)" />
                </div>
              </div>
            ))}
            <button onClick={() => set("sections", [...data.sections, { heading: "", body: "" }])} className="flex items-center gap-2 text-[12px] text-[#0B0B0B]/60 hover:text-[#0B0B0B] border border-dashed border-[#0B0B0B]/15 rounded-xl px-3 py-2 w-full justify-center">
              <Plus size={14} /> Add section
            </button>
          </div>
        </Card>
      </div>

      <PageVisibilityCard slug="seo-guide" />
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
