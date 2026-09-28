import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { Plus, Trash2 } from "lucide-react";

import { DISTRIBUTION_NETWORK_DEFAULTS as DEFAULTS, type DistributionNetworkData, type DistNetAdvItem as AdvItem, type DistNetStep as Step } from "@/lib/distributionNetworkDefaults";
export default function AdminDistributionNetwork() {
  const { getContentResult, saveContent } = useAdmin();
  const [data, setData] = useState<DistributionNetworkData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const result = await getContentResult("distribution-network");
      if (!result.ok) { setLoadState("error"); return; }
      if (result.data) setData({ ...DEFAULTS, ...(result.data as Partial<DistributionNetworkData>) });
      setLoadState("ready");
    } catch { setLoadState("error"); }
  }, [getContentResult]);
  useEffect(() => { load(); }, [load]);

  function set<K extends keyof DistributionNetworkData>(key: K, val: DistributionNetworkData[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  function setAdvItem(i: number, patch: Partial<AdvItem>) {
    setSaved(false);
    const next = [...data.advantageItems];
    next[i] = { ...next[i], ...patch };
    set("advantageItems", next);
  }
  function addAdvItem() {
    setSaved(false);
    set("advantageItems", [...data.advantageItems, { label: "New benefit", desc: "Description of the benefit." }]);
  }
  function removeAdvItem(i: number) {
    setSaved(false);
    set("advantageItems", data.advantageItems.filter((_, idx) => idx !== i));
  }

  function setStep(i: number, patch: Partial<Step>) {
    setSaved(false);
    const next = [...data.hiwSteps];
    next[i] = { ...next[i], ...patch };
    set("hiwSteps", next);
  }
  function addStep() {
    setSaved(false);
    const num = String(data.hiwSteps.length + 1).padStart(2, "0");
    set("hiwSteps", [...data.hiwSteps, { num, title: "New Step", desc: "Describe this step." }]);
  }
  function removeStep(i: number) {
    setSaved(false);
    set("hiwSteps", data.hiwSteps.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      await saveContent("distribution-network", data as unknown as Record<string, unknown>);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save distribution network content.");
    } finally {
      setSaving(false);
    }
  }

  if (loadState !== "ready") return <div><PageHeader title="Distribution Network Page" description={loadState === "error" ? "Couldn't load saved content" : "Loading…"} />{loadState === "error" ? <div className="flex flex-col items-center gap-3 py-24 text-center"><p className="text-[13px] text-red-600">Couldn't load saved distribution network content. Editing is disabled to protect your live data.</p><button onClick={load} className="text-[12px] font-semibold bg-[#0B0B0B] text-white px-4 py-2 rounded-xl">Retry</button></div> : <div className="py-24 text-center text-[13px] text-[#0B0B0B]/40">Loading content…</div>}</div>;

  return (
    <div>
      <PageHeader title="Distribution Network Page" description="Edit all text on the Distribution Network public page." />

      <Card>
        <SectionTitle>Hero Section</SectionTitle>
        <Input label="Eyebrow Label" value={data.heroEyebrow} onChange={(e) => set("heroEyebrow", e.target.value)} />
        <Input label="Headline" value={data.heroHeadline} onChange={(e) => set("heroHeadline", e.target.value)} />
        <Textarea label="Subtext" value={data.heroSubtext} onChange={(e) => set("heroSubtext", e.target.value)} />
        <Input label="CTA Button Text" value={data.heroCTA} onChange={(e) => set("heroCTA", e.target.value)} />
      </Card>

      <Card>
        <SectionTitle>What You Get Section</SectionTitle>
        <Input label="Section Label" value={data.advantageLabel} onChange={(e) => set("advantageLabel", e.target.value)} />
        <Input label="Headline" value={data.advantageHeadline} onChange={(e) => set("advantageHeadline", e.target.value)} />
        <Textarea label="Subtext" value={data.advantageSubtext} onChange={(e) => set("advantageSubtext", e.target.value)} />
        <div className="mt-4 space-y-3">
          {data.advantageItems.map((item, i) => (
            <div key={i} className="border border-[#0B0B0B]/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-bold text-[#0B0B0B]/50">Benefit {i + 1}</span>
                <button onClick={() => removeAdvItem(i)} className="text-[#0B0B0B]/30 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <Input label="Label" value={item.label} onChange={(e) => setAdvItem(i, { label: e.target.value })} />
              <Textarea label="Description" value={item.desc} onChange={(e) => setAdvItem(i, { desc: e.target.value })} />
            </div>
          ))}
          <button
            onClick={addAdvItem}
            className="flex items-center gap-2 text-[13px] font-semibold text-[#0B0B0B]/50 hover:text-[#0B0B0B] transition-colors mt-2"
          >
            <Plus size={15} /> Add Benefit
          </button>
        </div>
      </Card>

      <Card>
        <SectionTitle>How It Works Section</SectionTitle>
        <Input label="Section Label" value={data.hiwLabel} onChange={(e) => set("hiwLabel", e.target.value)} />
        <Input label="Headline" value={data.hiwHeadline} onChange={(e) => set("hiwHeadline", e.target.value)} />
        <div className="mt-4 space-y-3">
          {data.hiwSteps.map((step, i) => (
            <div key={i} className="border border-[#0B0B0B]/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-bold text-[#0B0B0B]/50">Step {step.num}</span>
                <button onClick={() => removeStep(i)} className="text-[#0B0B0B]/30 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <Input label="Step Number (e.g. 01)" value={step.num} onChange={(e) => setStep(i, { num: e.target.value })} />
              <Input label="Title" value={step.title} onChange={(e) => setStep(i, { title: e.target.value })} />
              <Textarea label="Description" value={step.desc} onChange={(e) => setStep(i, { desc: e.target.value })} />
            </div>
          ))}
          <button
            onClick={addStep}
            className="flex items-center gap-2 text-[13px] font-semibold text-[#0B0B0B]/50 hover:text-[#0B0B0B] transition-colors mt-2"
          >
            <Plus size={15} /> Add Step
          </button>
        </div>
      </Card>

      <Card>
        <SectionTitle>CTA Section</SectionTitle>
        <Input label="Eyebrow Label" value={data.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
        <Input label="Headline" value={data.ctaHeadline} onChange={(e) => set("ctaHeadline", e.target.value)} />
        <Textarea label="Subtext" value={data.ctaSubtext} onChange={(e) => set("ctaSubtext", e.target.value)} />
        <Input label="Button Text" value={data.ctaButton} onChange={(e) => set("ctaButton", e.target.value)} />
      </Card>

      <PageVisibilityCard slug="distribution" />
      {saveError && <p role="alert" className="text-[13px] text-red-600 mt-3">{saveError}</p>}
      <SaveBar saving={saving} saved={saved} onSave={handleSave} />
    </div>
  );
}
