import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";

import { JOIN_NETWORK_DEFAULTS as DEFAULTS, type JoinNetworkData } from "@/lib/joinNetworkDefaults";
export default function AdminJoinNetwork() {
  const { getContentResult, saveContent } = useAdmin();
  const [data, setData] = useState<JoinNetworkData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const result = await getContentResult("joinnetwork");
      if (!result.ok) { setLoadState("error"); return; }
      setData({ ...DEFAULTS, ...(result.data as Partial<JoinNetworkData> | null) });
      setLoadState("ready");
    } catch { setLoadState("error"); }
  }, [getContentResult]);
  useEffect(() => { load(); }, [load]);

  function set<K extends keyof JoinNetworkData>(key: K, val: JoinNetworkData[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      await saveContent("joinnetwork", data as unknown as Record<string, unknown>);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save join network content.");
    } finally {
      setSaving(false);
    }
  }

  if (loadState !== "ready") return <div><PageHeader title="Join Network Page" description={loadState === "error" ? "Couldn't load saved content" : "Loading…"} />{loadState === "error" ? <div className="flex flex-col items-center gap-3 py-24 text-center"><p className="text-[13px] text-red-600">Couldn't load saved join network content. Editing is disabled to protect your live data.</p><button onClick={load} className="text-[12px] font-semibold bg-[#0B0B0B] text-white px-4 py-2 rounded-xl">Retry</button></div> : <div className="py-24 text-center text-[13px] text-[#0B0B0B]/40">Loading content…</div>}</div>;

  return (
    <div>
      <PageHeader title="Join Network Page" description="Edit the hero and both option cards." />

      <div className="space-y-5">
        <Card>
          <SectionTitle>Hero Section</SectionTitle>
          <div className="space-y-3">
            <Input label="Section Label" value={data.heroLabel} onChange={(e) => set("heroLabel", e.target.value)} />
            <Input label="Headline" value={data.heroHeadline} onChange={(e) => set("heroHeadline", e.target.value)} />
            <Textarea label="Subtext" value={data.heroSubtext} onChange={(e) => set("heroSubtext", e.target.value)} rows={2} />
          </div>
        </Card>

        <Card>
          <SectionTitle>Card 1 - Influencer (Dark)</SectionTitle>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Number Label" value={data.card1Num} onChange={(e) => set("card1Num", e.target.value)} placeholder="01" />
              <Input label="Title" value={data.card1Title} onChange={(e) => set("card1Title", e.target.value)} />
            </div>
            <Input label="Subtitle (optional)" value={data.card1Subtitle} onChange={(e) => set("card1Subtitle", e.target.value)} />
            <Textarea label="Description" value={data.card1Desc} onChange={(e) => set("card1Desc", e.target.value)} rows={3} />
            <Input label="Button Text" value={data.card1CTA} onChange={(e) => set("card1CTA", e.target.value)} />
          </div>
        </Card>

        <Card>
          <SectionTitle>Card 2 - Page Owner (Light)</SectionTitle>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Number Label" value={data.card2Num} onChange={(e) => set("card2Num", e.target.value)} placeholder="02" />
              <Input label="Title" value={data.card2Title} onChange={(e) => set("card2Title", e.target.value)} />
            </div>
            <Input label="Subtitle (optional)" value={data.card2Subtitle} onChange={(e) => set("card2Subtitle", e.target.value)} />
            <Textarea label="Description" value={data.card2Desc} onChange={(e) => set("card2Desc", e.target.value)} rows={3} />
            <Input label="Button Text" value={data.card2CTA} onChange={(e) => set("card2CTA", e.target.value)} />
          </div>
        </Card>

        <Card>
          <SectionTitle>Footer Note</SectionTitle>
          <Textarea label="Note text (small italic line at the bottom)" value={data.footerNote} onChange={(e) => set("footerNote", e.target.value)} rows={2} />
        </Card>
      </div>

      <PageVisibilityCard slug="join" />
      {saveError && <p role="alert" className="text-[13px] text-red-600 mt-3">{saveError}</p>}
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
