import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { FRAMEWORK_DEFAULTS as DEFAULTS, type FrameworkPageData as FrameworkData, type FrameworkStep } from "@/lib/frameworkDefaults";
function StepRow({
  step,
  index,
  onChange,
}: {
  step: FrameworkStep;
  index: number;
  onChange: (i: number, val: FrameworkStep) => void;
}) {
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<FrameworkStep>) => onChange(index, { ...step, ...patch });

  function setDetail(i: number, val: string) {
    const next = [...step.details];
    next[i] = val;
    set({ details: next });
  }

  return (
    <Card className="p-0 overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-[#0B0B0B]/2"
      >
        <span className="text-[11px] font-bold text-[#0B0B0B]/40 w-5">{step.num}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#0B0B0B]">{step.title || "Untitled Step"}</p>
          <p className="text-[11px] text-[#0B0B0B]/40 truncate">{step.headline}</p>
        </div>
        {open ? <ChevronUp size={14} className="text-[#0B0B0B]/40 shrink-0" /> : <ChevronDown size={14} className="text-[#0B0B0B]/40 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-[#0B0B0B]/8 px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Number" value={step.num} onChange={(e) => set({ num: e.target.value })} />
            <Input label="Title" value={step.title} onChange={(e) => set({ title: e.target.value })} />
          </div>
          <Input label="Headline" value={step.headline} onChange={(e) => set({ headline: e.target.value })} />
          <Textarea label="Description" value={step.desc} onChange={(e) => set({ desc: e.target.value })} rows={4} />
          <div>
            <p className="text-[11px] font-semibold text-[#0B0B0B]/50 mb-2">Detail Bullet Points</p>
            <div className="space-y-2">
              {step.details.map((d, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className="flex-1 text-[13px] border border-[#0B0B0B]/12 rounded-lg px-3 py-2 focus:outline-none bg-white"
                    value={d}
                    onChange={(e) => setDetail(i, e.target.value)}
                    placeholder="Detail item..."
                  />
                  <button
                    onClick={() => set({ details: step.details.filter((_, idx) => idx !== i) })}
                    className="p-1.5 text-[#0B0B0B]/25 hover:text-red-500 shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => set({ details: [...step.details, ""] })}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0B0B0B]/50 hover:text-[#0B0B0B] transition-colors"
              >
                <Plus size={13} /> Add Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function AdminFramework() {
  const { getContentResult, saveContent } = useAdmin();
  const [data, setData] = useState<FrameworkData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const result = await getContentResult("framework");
      if (!result.ok) { setLoadState("error"); return; }
      setData({ ...DEFAULTS, ...(result.data as Partial<FrameworkData> | null) });
      setLoadState("ready");
    } catch { setLoadState("error"); }
  }, [getContentResult]);
  useEffect(() => { load(); }, [load]);

  function set<K extends keyof FrameworkData>(key: K, val: FrameworkData[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  function handleStepChange(i: number, val: FrameworkStep) {
    setSaved(false);
    setData((p) => ({ ...p, steps: p.steps.map((s, idx) => (idx === i ? val : s)) }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      await saveContent("framework", data as unknown as Record<string, unknown>);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save framework content.");
    } finally {
      setSaving(false);
    }
  }

  if (loadState !== "ready") return <div><PageHeader title="Framework Page" description={loadState === "error" ? "Couldn't load saved content" : "Loading…"} />{loadState === "error" ? <div className="flex flex-col items-center gap-3 py-24 text-center"><p className="text-[13px] text-red-600">Couldn't load saved framework content. Editing is disabled to protect your live data.</p><button onClick={load} className="text-[12px] font-semibold bg-[#0B0B0B] text-white px-4 py-2 rounded-xl">Retry</button></div> : <div className="py-24 text-center text-[13px] text-[#0B0B0B]/40">Loading content…</div>}</div>;

  return (
    <div>
      <PageHeader title="Framework Page" description="Edit hero, all 4 framework steps, and the CTA section." />

      <div className="space-y-5">
        <Card>
          <SectionTitle>Hero Section</SectionTitle>
          <div className="space-y-3">
            <Input label="Section Label" value={data.heroLabel} onChange={(e) => set("heroLabel", e.target.value)} />
            <Input label="Headline" value={data.heroHeadline} onChange={(e) => set("heroHeadline", e.target.value)} />
            <Textarea label="Subtext" value={data.heroSubtext} onChange={(e) => set("heroSubtext", e.target.value)} rows={4} />
          </div>
        </Card>

        <div>
          <p className="text-[11px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest mb-3 px-1">Framework Steps</p>
          <div className="space-y-3">
            {data.steps.map((step, i) => (
              <StepRow key={i} step={step} index={i} onChange={handleStepChange} />
            ))}
          </div>
        </div>

        <Card>
          <SectionTitle>CTA Section (Bottom)</SectionTitle>
          <div className="space-y-3">
            <Input label="Headline" value={data.ctaHeadline} onChange={(e) => set("ctaHeadline", e.target.value)} />
            <Textarea label="Subtext" value={data.ctaSubtext} onChange={(e) => set("ctaSubtext", e.target.value)} rows={2} />
            <Input label="Button Text" value={data.ctaButton} onChange={(e) => set("ctaButton", e.target.value)} />
          </div>
        </Card>
      </div>

      <PageVisibilityCard slug="framework" />
      {saveError && <p role="alert" className="text-[13px] text-red-600 mt-3">{saveError}</p>}
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
