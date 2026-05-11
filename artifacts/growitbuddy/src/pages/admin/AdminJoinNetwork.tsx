import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";

interface JoinNetworkData {
  heroLabel: string;
  heroHeadline: string;
  heroSubtext: string;
  card1Num: string;
  card1Title: string;
  card1Subtitle: string;
  card1Desc: string;
  card1CTA: string;
  card2Num: string;
  card2Title: string;
  card2Subtitle: string;
  card2Desc: string;
  card2CTA: string;
  footerNote: string;
}

const DEFAULTS: JoinNetworkData = {
  heroLabel: "Join Our Network",
  heroHeadline: "Choose Your Path.",
  heroSubtext: "Two ways to become part of a growing ecosystem. Pick the one that fits you.",
  card1Num: "01",
  card1Title: "I'm an Influencer",
  card1Subtitle: "",
  card1Desc: "I create content on my personal profile, build an audience, and collaborate with brands.",
  card1CTA: "Continue as Influencer",
  card2Num: "02",
  card2Title: "I run a Page",
  card2Subtitle: "Meme / Theme Page",
  card2Desc: "I manage a content page with a large audience and help distribute content at scale.",
  card2CTA: "Continue as Page Owner",
  footerNote: "Not sure where you fit? Choose the closest option - we'll guide you from there.",
};

export default function AdminJoinNetwork() {
  const { getContent, saveContent } = useAdmin();
  const [data, setData] = useState<JoinNetworkData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getContent("joinnetwork").then((d) => {
      if (d) setData({ ...DEFAULTS, ...(d as Partial<JoinNetworkData>) });
    });
  }, [getContent]);

  function set<K extends keyof JoinNetworkData>(key: K, val: JoinNetworkData[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent("joinnetwork", data as unknown as Record<string, unknown>);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

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
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
