import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { SITE_GUIDE_DEFAULTS as DEFAULTS, type SiteGuideData } from "@/lib/siteGuideDefaults";

export default function AdminSiteGuide() {
  const { getContentResult, saveContent } = useAdmin();
  const [data, setData] = useState<SiteGuideData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const result = await getContentResult("site-guide");
      if (!result.ok) { setLoadState("error"); return; }
      if (result.data) setData({ ...DEFAULTS, ...(result.data as Partial<SiteGuideData>) });
      setLoadState("ready");
    } catch { setLoadState("error"); }
  }, [getContentResult]);
  useEffect(() => { load(); }, [load]);

  function set<K extends keyof SiteGuideData>(key: K, val: SiteGuideData[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  function setHero<K extends keyof SiteGuideData["hero"]>(key: K, val: SiteGuideData["hero"][K]) {
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
    setSaveError("");
    try {
      await saveContent("site-guide", data as unknown as Record<string, unknown>);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save site guide content.");
    } finally {
      setSaving(false);
    }
  }

  if (loadState !== "ready") return <div><PageHeader title="Site Guide" description={loadState === "error" ? "Couldn't load saved content" : "Loading…"} />{loadState === "error" ? <div className="flex flex-col items-center gap-3 py-24 text-center"><p className="text-[13px] text-red-600">Couldn't load saved site guide content. Editing is disabled to protect your live data.</p><button onClick={load} className="text-[12px] font-semibold bg-[#0B0B0B] text-white px-4 py-2 rounded-xl">Retry</button></div> : <div className="py-24 text-center text-[13px] text-[#0B0B0B]/40">Loading content…</div>}</div>;

  return (
    <div>
      <PageHeader title="Site Guide" description="Edit the hero and every section of the public /guide page." />

      <div className="space-y-5">
        <Card>
          <SectionTitle>Hero</SectionTitle>
          <div className="space-y-3">
            <Input label="Badge / Eyebrow" value={data.hero.badge} onChange={(e) => setHero("badge", e.target.value)} placeholder="Complete Site Guide · v1.5" />
            <Input label="Title" value={data.hero.title} onChange={(e) => setHero("title", e.target.value)} placeholder="Understand the entire GrowitBuddy website - in 10 minutes." />
            <Textarea label="Lede / Intro" value={data.hero.lede} onChange={(e) => setHero("lede", e.target.value)} rows={3} />
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
                  <Textarea value={s.body} onChange={(e) => updateSection(i, "body", e.target.value)} rows={8} placeholder="Section body (line breaks and • bullets are preserved)" />
                </div>
              </div>
            ))}
            <button onClick={() => set("sections", [...data.sections, { heading: "", body: "" }])} className="flex items-center gap-2 text-[12px] text-[#0B0B0B]/60 hover:text-[#0B0B0B] border border-dashed border-[#0B0B0B]/15 rounded-xl px-3 py-2 w-full justify-center">
              <Plus size={14} /> Add section
            </button>
          </div>
        </Card>
      </div>

      <PageVisibilityCard slug="site-guide" />
      {saveError && <p role="alert" className="text-[13px] text-red-600 mt-3">{saveError}</p>}
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
