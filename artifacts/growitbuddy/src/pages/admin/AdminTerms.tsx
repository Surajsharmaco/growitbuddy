import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { TERMS_DEFAULTS as DEFAULTS, type TermsData } from "@/lib/termsDefaults";

export default function AdminTerms() {
  const { getContentResult, saveContent } = useAdmin();
  const [data, setData] = useState<TermsData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const result = await getContentResult("terms");
      if (!result.ok) { setLoadState("error"); return; }
      if (result.data) setData({ ...DEFAULTS, ...(result.data as Partial<TermsData>) });
      setLoadState("ready");
    } catch { setLoadState("error"); }
  }, [getContentResult]);
  useEffect(() => { load(); }, [load]);

  function set<K extends keyof TermsData>(key: K, val: TermsData[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  function updateSection(i: number, field: "title" | "body", value: string) {
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
      await saveContent("terms", data as unknown as Record<string, unknown>);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save terms content.");
    } finally {
      setSaving(false);
    }
  }

  if (loadState !== "ready") return <div><PageHeader title="Terms & Conditions" description={loadState === "error" ? "Couldn't load saved content" : "Loading…"} />{loadState === "error" ? <div className="flex flex-col items-center gap-3 py-24 text-center"><p className="text-[13px] text-red-600">Couldn't load saved terms content. Editing is disabled to protect your live data.</p><button onClick={load} className="text-[12px] font-semibold bg-[#0B0B0B] text-white px-4 py-2 rounded-xl">Retry</button></div> : <div className="py-24 text-center text-[13px] text-[#0B0B0B]/40">Loading content…</div>}</div>;

  return (
    <div>
      <PageHeader title="Terms & Conditions" description="Edit the heading, intro, and every section of the public /terms page." />

      <div className="space-y-5">
        <Card>
          <SectionTitle>Header</SectionTitle>
          <div className="space-y-3">
            <Input label="Badge / Eyebrow" value={data.badge} onChange={(e) => set("badge", e.target.value)} placeholder="Legal" />
            <Input label="Title" value={data.title} onChange={(e) => set("title", e.target.value)} placeholder="Terms & Conditions" />
            <Input label="Last updated line" value={data.lastUpdated} onChange={(e) => set("lastUpdated", e.target.value)} placeholder="Last updated: 5 May 2026" />
            <Textarea label="Intro" value={data.intro} onChange={(e) => set("intro", e.target.value)} rows={3} />
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
                  <Input value={s.title} onChange={(e) => updateSection(i, "title", e.target.value)} placeholder="Section title" />
                  <Textarea value={s.body} onChange={(e) => updateSection(i, "body", e.target.value)} rows={4} placeholder="Section body (line breaks and • bullets are preserved)" />
                </div>
              </div>
            ))}
            <button onClick={() => set("sections", [...data.sections, { title: "", body: "" }])} className="flex items-center gap-2 text-[12px] text-[#0B0B0B]/60 hover:text-[#0B0B0B] border border-dashed border-[#0B0B0B]/15 rounded-xl px-3 py-2 w-full justify-center">
              <Plus size={14} /> Add section
            </button>
          </div>
        </Card>
      </div>

      <PageVisibilityCard slug="terms" />
      {saveError && <p role="alert" className="text-[13px] text-red-600 mt-3">{saveError}</p>}
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
