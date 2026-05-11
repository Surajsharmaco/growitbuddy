import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";

interface InfluencerExploreData {
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtext: string;
  heroCTA: string;
  ctaEyebrow: string;
  ctaHeadline: string;
  ctaSubtext: string;
  ctaButton: string;
  seoTitle: string;
  seoDesc: string;
}

const DEFAULTS: InfluencerExploreData = {
  heroEyebrow: "Influencer Network",
  heroHeadline: "Work With Proven Influencers.",
  heroSubtext: "Discover creators who build real engagement and drive meaningful results -- not just impressions.",
  heroCTA: "Join as Influencer",
  ctaEyebrow: "Are you a creator?",
  ctaHeadline: "Ready to Get Discovered?",
  ctaSubtext: "Apply to join the Influencer Network. Get reviewed, get listed, and unlock real brand opportunities.",
  ctaButton: "Apply Now",
  seoTitle: "Explore Influencers - GrowitBuddy",
  seoDesc: "Discover proven influencers and content creators who build real engagement and drive meaningful results for ambitious brands.",
};

export default function AdminInfluencerExplore() {
  const { getContent, saveContent } = useAdmin();
  const [data, setData] = useState<InfluencerExploreData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getContent("influencer-explore").then((d) => {
      if (d) setData({ ...DEFAULTS, ...(d as Partial<InfluencerExploreData>) });
    });
  }, [getContent]);

  function set<K extends keyof InfluencerExploreData>(key: K, val: InfluencerExploreData[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    await saveContent("influencer-explore", data as unknown as Record<string, unknown>);
    setSaving(false);
    setSaved(true);
  }

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
      <SaveBar saving={saving} saved={saved} onSave={handleSave} />
    </div>
  );
}
