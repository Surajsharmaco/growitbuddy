import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";

import { INFLUENCER_EXPLORE_DEFAULTS as DEFAULTS, type InfluencerExploreData } from "@/lib/influencerExploreDefaults";
export default function AdminInfluencerExplore() {
  const { getContentResult, saveContent } = useAdmin();
  const [data, setData] = useState<InfluencerExploreData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const result = await getContentResult("influencer-explore");
      if (!result.ok) { setLoadState("error"); return; }
      setData({ ...DEFAULTS, ...(result.data as Partial<InfluencerExploreData> | null) });
      setLoadState("ready");
    } catch { setLoadState("error"); }
  }, [getContentResult]);
  useEffect(() => { load(); }, [load]);

  function set<K extends keyof InfluencerExploreData>(key: K, val: InfluencerExploreData[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      await saveContent("influencer-explore", data as unknown as Record<string, unknown>);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save influencer explore content.");
    } finally {
      setSaving(false);
    }
  }

  if (loadState !== "ready") return <div><PageHeader title="Influencer Explore Page" description={loadState === "error" ? "Couldn't load saved content" : "Loading…"} />{loadState === "error" ? <div className="flex flex-col items-center gap-3 py-24 text-center"><p className="text-[13px] text-red-600">Couldn't load saved influencer explore content. Editing is disabled to protect your live data.</p><button onClick={load} className="text-[12px] font-semibold bg-[#0B0B0B] text-white px-4 py-2 rounded-xl">Retry</button></div> : <div className="py-24 text-center text-[13px] text-[#0B0B0B]/40">Loading content…</div>}</div>;

  return (
    <div>
      <PageHeader title="Influencer Explore Page" description="Edit the hero and CTA sections on the Influencer Explore page." />

      <Card>
        <SectionTitle>Hero Section</SectionTitle>
        <Input label="Eyebrow Label" value={data.heroEyebrow} onChange={(e) => set("heroEyebrow", e.target.value)} />
        <Input label="Headline" value={data.heroHeadline} onChange={(e) => set("heroHeadline", e.target.value)} />
        <Textarea label="Subtext" value={data.heroSubtext} onChange={(e) => set("heroSubtext", e.target.value)} />
        <Input label="CTA Button Text" value={data.heroCTA} onChange={(e) => set("heroCTA", e.target.value)} />
      </Card>

      <Card>
        <SectionTitle>Bottom CTA Section</SectionTitle>
        <Input label="Eyebrow Label" value={data.ctaEyebrow} onChange={(e) => set("ctaEyebrow", e.target.value)} />
        <Input label="Headline" value={data.ctaHeadline} onChange={(e) => set("ctaHeadline", e.target.value)} />
        <Textarea label="Subtext" value={data.ctaSubtext} onChange={(e) => set("ctaSubtext", e.target.value)} />
        <Input label="Button Text" value={data.ctaButton} onChange={(e) => set("ctaButton", e.target.value)} />
      </Card>

      <Card>
        <SectionTitle>SEO</SectionTitle>
        <Input label="Page Title" value={data.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
        <Textarea label="Meta Description" value={data.seoDesc} onChange={(e) => set("seoDesc", e.target.value)} />
      </Card>

      <PageVisibilityCard slug="influencers" />
      {saveError && <p role="alert" className="text-[13px] text-red-600 mt-3">{saveError}</p>}
      <SaveBar saving={saving} saved={saved} onSave={handleSave} />
    </div>
  );
}
