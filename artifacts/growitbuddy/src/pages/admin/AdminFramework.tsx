import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

interface FrameworkStep {
  num: string;
  title: string;
  headline: string;
  desc: string;
  details: string[];
}

interface FrameworkData {
  heroLabel: string;
  heroHeadline: string;
  heroSubtext: string;
  steps: FrameworkStep[];
  ctaHeadline: string;
  ctaSubtext: string;
  ctaButton: string;
}

const DEFAULTS: FrameworkData = {
  heroLabel: "Framework",
  heroHeadline: "The Authority Framework.",
  heroSubtext: "A battle-tested content marketing framework for engineering category dominance that compounds over time. No hacks. No shortcuts. Just infrastructure built to generate inbound leads.",
  steps: [
    {
      num: "01",
      title: "Positioning",
      headline: "Know exactly what you stand for.",
      desc: "We audit your space, map your competitors, and identify the specific category angle only you can own. This is the foundation of your personal branding strategy - every piece of content flows from it.",
      details: [
        "Competitor landscape audit",
        "Category design & naming",
        "Unique point of view articulation",
        "Target audience avatar mapping",
        "90-day authority roadmap",
      ],
    },
    {
      num: "02",
      title: "Content Engine",
      headline: "High-signal content strategy. At scale.",
      desc: "We build a repeatable content system that extracts your expertise and packages it into formats that educate, persuade, and convert - without consuming your time.",
      details: [
        "Pillar content strategy",
        "Content calendar & themes",
        "Ghostwriting & scripting",
        "Multi-format repurposing",
        "Editorial quality control",
      ],
    },
    {
      num: "03",
      title: "Distribution Loop",
      headline: "Content Distribution Strategy That Actually Works",
      desc: "Make sure your content doesn't just get posted - it gets seen by the people who actually matter. A structured content distribution strategy is what separates noise from authority.",
      details: [
        "LinkedIn publishing system",
        "Email list growth strategy",
        "Cross-platform syndication",
        "Podcast & media placement",
        "Community building",
      ],
    },
    {
      num: "04",
      title: "Authority Compounding",
      headline: "The flywheel that never stops.",
      desc: "When your personal branding strategy, content system, and distribution work together, authority compounds automatically. Inbound leads increase, deal close rates improve, and pricing power grows.",
      details: [
        "Monthly authority score tracking",
        "Inbound opportunity capture",
        "Premium positioning signals",
        "Speaking & PR outreach",
        "Authority monetization",
      ],
    },
  ],
  ctaHeadline: "Ready to start building?",
  ctaSubtext: "Book a free strategy call and we'll map out your authority roadmap.",
  ctaButton: "Book a Strategy Call",
};

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
  const { getContent, saveContent } = useAdmin();
  const [data, setData] = useState<FrameworkData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getContent("framework").then((d) => {
      if (d) setData({ ...DEFAULTS, ...(d as Partial<FrameworkData>) });
    });
  }, [getContent]);

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
    try {
      await saveContent("framework", data as unknown as Record<string, unknown>);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

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
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
