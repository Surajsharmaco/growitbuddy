import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { Plus, Trash2 } from "lucide-react";

interface AdvItem { label: string; desc: string; }
interface Step { num: string; title: string; desc: string; }

interface DistributionNetworkData {
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtext: string;
  heroCTA: string;
  advantageLabel: string;
  advantageHeadline: string;
  advantageSubtext: string;
  advantageItems: AdvItem[];
  hiwLabel: string;
  hiwHeadline: string;
  hiwSteps: Step[];
  ctaLabel: string;
  ctaHeadline: string;
  ctaSubtext: string;
  ctaButton: string;
}

const DEFAULTS: DistributionNetworkData = {
  heroEyebrow: "Distribution Network",
  heroHeadline: "Plug Into High-Performing Distribution.",
  heroSubtext: "Access a curated network of meme and theme pages with millions of followers. Distribute your content at scale and reach the right audience faster.",
  heroCTA: "Run a Campaign",
  advantageLabel: "The Advantage",
  advantageHeadline: "What You Get",
  advantageSubtext: "Every page in our network is vetted for real engagement. You get access to distribution that actually converts.",
  advantageItems: [
    { label: "High-reach distribution", desc: "Tap into pages with millions of engaged followers across every major niche." },
    { label: "Access to engaged audiences", desc: "Not just followers - communities that interact, share, and act." },
    { label: "Faster visibility for your content", desc: "Skip the slow ramp. Get in front of the right people from day one." },
    { label: "Scalable content amplification", desc: "Run campaigns across multiple pages simultaneously for compound reach." },
  ],
  hiwLabel: "Process",
  hiwHeadline: "How It Works",
  hiwSteps: [
    { num: "01", title: "Choose your niche", desc: "Filter by genre to find pages that match your target audience perfectly." },
    { num: "02", title: "Select relevant pages", desc: "Browse vetted meme and theme pages by reach, country, and engagement." },
    { num: "03", title: "Run your campaign", desc: "We coordinate content distribution across your selected pages simultaneously." },
    { num: "04", title: "Track reach and performance", desc: "Get full reporting on reach, impressions, and campaign performance." },
  ],
  ctaLabel: "Ready to scale?",
  ctaHeadline: "Ready to Distribute at Scale?",
  ctaSubtext: "Leverage our network to get your content in front of the right audience. Fast, targeted, and measurable.",
  ctaButton: "Start a Campaign",
};

export default function AdminDistributionNetwork() {
  const { getContent, saveContent } = useAdmin();
  const [data, setData] = useState<DistributionNetworkData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getContent("distribution-network").then((d) => {
      if (d) setData({ ...DEFAULTS, ...(d as Partial<DistributionNetworkData>) });
    });
  }, [getContent]);

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
    await saveContent("distribution-network", data as unknown as Record<string, unknown>);
    setSaving(false);
    setSaved(true);
  }

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
      <SaveBar saving={saving} saved={saved} onSave={handleSave} />
    </div>
  );
}
