import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { Plus, Trash2, ExternalLink } from "lucide-react";

interface ResourceCard { id: string; title: string; desc: string; link: string; btnLabel: string; }
interface Step { number: string; title: string; desc: string; }

interface PoolData {
  eyebrow: string; headline: string; description: string;
  opportunityText: string; ctaPrimary: string; ctaSecondary: string;
  videoUrl: string; heroTrustText: string;
  stepsTitle: string; steps: Step[];
  resourcesTitle: string; resourcesSubtext: string; resources: ResourceCard[];
  formTitle: string; formSubtext: string; formDisclaimer: string; formNotifyEmail: string;
  finalHeadline: string; finalSubtext: string; finalCtaPrimary: string;
  seoTitle: string; seoDesc: string;
}

const EMPTY: PoolData = {
  eyebrow: "", headline: "", description: "",
  opportunityText: "", ctaPrimary: "Submit Your Work", ctaSecondary: "View Resources",
  videoUrl: "", heroTrustText: "",
  stepsTitle: "How it works.",
  steps: [
    { number: "01", title: "Watch Demo",       desc: "" },
    { number: "02", title: "Access Resources", desc: "" },
    { number: "03", title: "Submit Your Work", desc: "" },
    { number: "04", title: "Join the Network", desc: "" },
  ],
  resourcesTitle: "Resources & Guidelines", resourcesSubtext: "",
  resources: [
    { id: "1", title: "Resource 1", desc: "", link: "", btnLabel: "Open" },
    { id: "2", title: "Resource 2", desc: "", link: "", btnLabel: "Download" },
    { id: "3", title: "Resource 3", desc: "", link: "", btnLabel: "Download" },
    { id: "4", title: "Resource 4", desc: "", link: "", btnLabel: "Open" },
  ],
  formTitle: "Submit Your Work", formSubtext: "", formDisclaimer: "", formNotifyEmail: "",
  finalHeadline: "Ready to join the network?",
  finalSubtext: "Submit your work and become part of the GrowitBuddy ecosystem.",
  finalCtaPrimary: "Submit Now",
  seoTitle: "", seoDesc: "",
};

interface Props {
  poolKey: string;
  label: string;
  description: string;
  pageUrl: string;
}

export default function AdminTalentPool({ poolKey, label, description, pageUrl }: Props) {
  const { getContent, saveContent } = useAdmin();
  const [data, setData] = useState<PoolData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getContent(poolKey).then(d => {
      if (d) setData({ ...EMPTY, ...(d as Partial<PoolData>) });
    });
  }, [getContent, poolKey]);

  function set<K extends keyof PoolData>(key: K, val: PoolData[K]) {
    setSaved(false);
    setData(p => ({ ...p, [key]: val }));
  }

  async function save() {
    setSaving(true);
    try { await saveContent(poolKey, data as unknown as Record<string, unknown>); setSaved(true); }
    catch { setSaved(false); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={label}
        description={
          <span>
            {description}{" "}
            <a href={pageUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#1E293B] hover:underline font-semibold">
              <ExternalLink size={12} /> View page
            </a>
          </span>
        }
      />

      {/* ── HERO ── */}
      <Card className="mb-4">
        <SectionTitle>Hero</SectionTitle>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Eyebrow" value={data.eyebrow} onChange={e => set("eyebrow", e.target.value)} placeholder="e.g. DESIGNERS NETWORK" />
            <Input label="Primary CTA Button" value={data.ctaPrimary} onChange={e => set("ctaPrimary", e.target.value)} />
          </div>
          <Textarea label="Headline" value={data.headline} onChange={e => set("headline", e.target.value)} className="min-h-[60px]" />
          <Textarea label="Description" value={data.description} onChange={e => set("description", e.target.value)} />
          <Input label="Opportunity Text" value={data.opportunityText} onChange={e => set("opportunityText", e.target.value)}
            hint="Shown as a small callout below the video. Leave blank to hide." />
          <Input label="Trust Text" value={data.heroTrustText} onChange={e => set("heroTrustText", e.target.value)}
            hint="Small grey line shown below the CTAs. Leave blank to hide." />
          <Input label="Secondary CTA Button" value={data.ctaSecondary} onChange={e => set("ctaSecondary", e.target.value)} />
        </div>
      </Card>

      {/* ── VIDEO ── */}
      <Card className="mb-4">
        <SectionTitle>Demo Video</SectionTitle>
        <div className="bg-[#F8F8F6] border border-[#0B0B0B]/8 rounded-xl px-4 py-3 mb-4 flex gap-3 items-start">
          <span className="text-[18px]">🎬</span>
          <div>
            <p className="text-[13px] font-semibold text-[#0B0B0B] mb-0.5">Paste any YouTube, Vimeo, or Loom link.</p>
            <p className="text-[12px] text-[#0B0B0B]/50">Example: <span className="font-mono">https://youtube.com/watch?v=abc123</span></p>
          </div>
        </div>
        <Input label="Video URL" value={data.videoUrl} onChange={e => set("videoUrl", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
        {data.videoUrl
          ? <div className="mt-3 flex items-center gap-2 text-[12px] text-emerald-700 font-medium"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Video URL set - live on page.</div>
          : <div className="mt-3 flex items-center gap-2 text-[12px] text-[#0B0B0B]/40"><span className="w-2 h-2 rounded-full bg-[#0B0B0B]/20 inline-block" /> No video set - placeholder shown.</div>
        }
      </Card>

      {/* ── STEPS ── */}
      <Card className="mb-4">
        <SectionTitle>How It Works Steps</SectionTitle>
        <Input label="Section Title" value={data.stepsTitle} onChange={e => set("stepsTitle", e.target.value)} className="mb-4" />
        <div className="space-y-3">
          {data.steps.map((s, i) => (
            <div key={i} className="border border-[#0B0B0B]/8 rounded-xl p-4">
              <div className="grid grid-cols-4 gap-3 mb-3">
                <Input label="Number" value={s.number} onChange={e => { const n = [...data.steps]; n[i] = { ...n[i], number: e.target.value }; set("steps", n); }} placeholder="01" />
                <div className="col-span-3"><Input label="Title" value={s.title} onChange={e => { const n = [...data.steps]; n[i] = { ...n[i], title: e.target.value }; set("steps", n); }} /></div>
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1"><Input label="Description" value={s.desc} onChange={e => { const n = [...data.steps]; n[i] = { ...n[i], desc: e.target.value }; set("steps", n); }} /></div>
                <button type="button" onClick={() => set("steps", data.steps.filter((_, idx) => idx !== i))}
                  className="mb-[1px] p-2 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set("steps", [...data.steps, { number: `0${data.steps.length + 1}`, title: "New Step", desc: "" }])}
          className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-[#0B0B0B]/60 hover:text-[#0B0B0B]">
          <Plus size={14} /> Add step
        </button>
      </Card>

      {/* ── RESOURCES ── */}
      <Card className="mb-4">
        <SectionTitle>Resources & Downloads</SectionTitle>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input label="Section Title" value={data.resourcesTitle} onChange={e => set("resourcesTitle", e.target.value)} />
          <Input label="Subtext" value={data.resourcesSubtext} onChange={e => set("resourcesSubtext", e.target.value)} />
        </div>
        <div className="space-y-3">
          {data.resources.map((r, i) => (
            <div key={r.id} className="border border-[#0B0B0B]/8 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2"><Input label="Title" value={r.title} onChange={e => { const n = [...data.resources]; n[i] = { ...n[i], title: e.target.value }; set("resources", n); }} /></div>
                <Input label="Button Label" value={r.btnLabel} onChange={e => { const n = [...data.resources]; n[i] = { ...n[i], btnLabel: e.target.value }; set("resources", n); }} placeholder="Open" />
              </div>
              <Input label="Description" value={r.desc} onChange={e => { const n = [...data.resources]; n[i] = { ...n[i], desc: e.target.value }; set("resources", n); }} />
              <Input label="Link URL" value={r.link} onChange={e => { const n = [...data.resources]; n[i] = { ...n[i], link: e.target.value }; set("resources", n); }} placeholder="https://drive.google.com/..." hint="Leave blank to show 'SOON' badge." />
              <button type="button" onClick={() => set("resources", data.resources.filter((_, idx) => idx !== i))}
                className="text-[12px] text-red-500 flex items-center gap-1"><Trash2 size={12} /> Remove</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set("resources", [...data.resources, { id: String(Date.now()), title: "New Resource", desc: "", link: "", btnLabel: "Open" }])}
          className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-[#0B0B0B]/60 hover:text-[#0B0B0B] py-2 border-2 border-dashed border-[#0B0B0B]/12 rounded-xl px-4 w-full justify-center">
          <Plus size={14} /> Add resource
        </button>
      </Card>

      {/* ── FORM ── */}
      <Card className="mb-4">
        <SectionTitle>Submission Form</SectionTitle>
        <div className="space-y-4">
          <Input label="Form Title" value={data.formTitle} onChange={e => set("formTitle", e.target.value)} />
          <Input label="Form Subtext" value={data.formSubtext} onChange={e => set("formSubtext", e.target.value)} />
          <Input label="Notification Email" value={data.formNotifyEmail} onChange={e => set("formNotifyEmail", e.target.value)}
            placeholder="team@growitbuddy.com" type="email" hint="Receives a copy of each submission." />
          <Input label="Disclaimer Text" value={data.formDisclaimer} onChange={e => set("formDisclaimer", e.target.value)}
            hint="Shown below the form in grey. Leave blank to hide." />
        </div>
      </Card>

      {/* ── FINAL CTA ── */}
      <Card className="mb-4">
        <SectionTitle>Final CTA</SectionTitle>
        <div className="space-y-4">
          <Textarea label="Headline" value={data.finalHeadline} onChange={e => set("finalHeadline", e.target.value)} className="min-h-[60px]" />
          <Input label="Subtext" value={data.finalSubtext} onChange={e => set("finalSubtext", e.target.value)} />
          <Input label="Button Label" value={data.finalCtaPrimary} onChange={e => set("finalCtaPrimary", e.target.value)} />
        </div>
      </Card>

      {/* ── SEO ── */}
      <Card className="mb-6">
        <SectionTitle>SEO</SectionTitle>
        <div className="space-y-4">
          <Input label="Page Title" value={data.seoTitle} onChange={e => set("seoTitle", e.target.value)} />
          <Textarea label="Meta Description" value={data.seoDesc} onChange={e => set("seoDesc", e.target.value)} className="min-h-[70px]" />
        </div>
      </Card>

      <PageVisibilityCard slug={poolKey} />
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}
