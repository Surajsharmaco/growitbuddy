import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { Plus, Trash2 } from "lucide-react";

import { CREATOR_SCHOOL_DEFAULTS as DEFAULTS, type CreatorSchoolData as PageData } from "@/lib/creatorSchoolDefaults";

export default function AdminCreatorSchool() {
  const { getContent, saveContent } = useAdmin();
  const [data, setData] = useState<PageData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getContent("creator-school").then(d => {
      if (d) setData({ ...DEFAULTS, ...(d as Partial<PageData>) });
    });
  }, [getContent]);

  function set<K extends keyof PageData>(key: K, val: PageData[K]) {
    setSaved(false); setData(p => ({ ...p, [key]: val }));
  }

  async function save() {
    setSaving(true);
    try { await saveContent("creator-school", data as unknown as Record<string, unknown>); setSaved(true); }
    catch { setSaved(false); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Editors Pool" description="Manage the /editors-pool talent onboarding page. All fields are editable and CMS-driven." />

      {/* ── HERO ── */}
      <Card className="mb-4">
        <SectionTitle>Hero</SectionTitle>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Eyebrow" value={data.eyebrow} onChange={e => set("eyebrow", e.target.value)} placeholder="VIDEO EDITORS POOL" />
            <Input label="Primary CTA Button" value={data.ctaPrimary} onChange={e => set("ctaPrimary", e.target.value)} />
          </div>
          <Textarea label="Headline" value={data.headline} onChange={e => set("headline", e.target.value)} className="min-h-[60px]" />
          <Textarea label="Description" value={data.description} onChange={e => set("description", e.target.value)} />
          <Input label="Opportunity Text (callout box)" value={data.opportunityText} onChange={e => set("opportunityText", e.target.value)} hint="Shown as a highlighted note below the description. Leave blank to hide." />
          <Input label="Secondary CTA Button" value={data.ctaSecondary} onChange={e => set("ctaSecondary", e.target.value)} />
          <Textarea label="Trust Text (below hero CTAs)" value={data.heroTrustText} onChange={e => set("heroTrustText", e.target.value)} hint="Small reassurance line shown under the hero CTAs. Leave blank to hide." rows={2} />
        </div>
      </Card>

      {/* ── VIDEO ── */}
      <Card className="mb-4">
        <SectionTitle>Demo Video</SectionTitle>
        <div className="bg-[#F8F8F6] border border-[#0B0B0B]/8 rounded-xl px-4 py-3 mb-4 flex gap-3 items-start">
          <span className="text-[18px]">🎬</span>
          <div>
            <p className="text-[13px] font-semibold text-[#0B0B0B] mb-0.5">Paste any YouTube, Vimeo, or Loom link to update the video.</p>
            <p className="text-[12px] text-[#0B0B0B]/50">Example: <span className="font-mono">https://youtube.com/watch?v=abc123</span></p>
          </div>
        </div>
        <Input label="Video URL" value={data.videoUrl} onChange={e => set("videoUrl", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
        {data.videoUrl
          ? <div className="mt-3 flex items-center gap-2 text-[12px] text-emerald-700 font-medium"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Video URL set - live on page.</div>
          : <div className="mt-3 flex items-center gap-2 text-[12px] text-[#0B0B0B]/40"><span className="w-2 h-2 rounded-full bg-[#0B0B0B]/20 inline-block" /> No video - placeholder is shown.</div>
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
                <Input label="Number" value={s.number} onChange={e => { const n=[...data.steps]; n[i]={...n[i],number:e.target.value}; set("steps",n); }} placeholder="01" />
                <div className="col-span-3"><Input label="Title" value={s.title} onChange={e => { const n=[...data.steps]; n[i]={...n[i],title:e.target.value}; set("steps",n); }} /></div>
              </div>
              <Input label="Description" value={s.desc} onChange={e => { const n=[...data.steps]; n[i]={...n[i],desc:e.target.value}; set("steps",n); }} />
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set("steps", [...data.steps, { number: `0${data.steps.length+1}`, title: "New Step", desc: "" }])}
          className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-[#0B0B0B]/60 hover:text-[#0B0B0B]">
          <Plus size={14} /> Add step
        </button>
      </Card>

      {/* ── RESOURCES ── */}
      <Card className="mb-4">
        <SectionTitle>Resources & Guidelines</SectionTitle>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input label="Section Title" value={data.resourcesTitle} onChange={e => set("resourcesTitle", e.target.value)} />
          <Input label="Subtext" value={data.resourcesSubtext} onChange={e => set("resourcesSubtext", e.target.value)} />
        </div>
        <div className="space-y-3">
          {data.resources.map((r, i) => (
            <div key={r.id} className="border border-[#0B0B0B]/8 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2"><Input label="Title" value={r.title} onChange={e => { const n=[...data.resources]; n[i]={...n[i],title:e.target.value}; set("resources",n); }} /></div>
                <Input label="Button Label" value={r.btnLabel} onChange={e => { const n=[...data.resources]; n[i]={...n[i],btnLabel:e.target.value}; set("resources",n); }} placeholder="Open" />
              </div>
              <Input label="Description" value={r.desc} onChange={e => { const n=[...data.resources]; n[i]={...n[i],desc:e.target.value}; set("resources",n); }} />
              <Input label="Link URL" value={r.link} onChange={e => { const n=[...data.resources]; n[i]={...n[i],link:e.target.value}; set("resources",n); }} placeholder="https://drive.google.com/..." hint="Leave blank to show 'SOON' badge." />
              <button type="button" onClick={() => set("resources", data.resources.filter((_,idx)=>idx!==i))} className="text-[12px] text-red-500 flex items-center gap-1"><Trash2 size={12} /> Remove</button>
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
          <Input label="Notification Email" value={data.formNotifyEmail} onChange={e => set("formNotifyEmail", e.target.value)} placeholder="team@growitbuddy.com" type="email" hint="Receives a copy of each submission." />
          <Input label="Disclaimer Text" value={data.formDisclaimer} onChange={e => set("formDisclaimer", e.target.value)} hint="Shown below the form in grey. Leave blank to hide." />
        </div>
      </Card>

      {/* ── FINAL CTA ── */}
      <Card className="mb-4">
        <SectionTitle>Final CTA</SectionTitle>
        <div className="space-y-4">
          <Textarea label="Headline" value={data.finalHeadline} onChange={e => set("finalHeadline", e.target.value)} className="min-h-[60px]" />
          <Input label="Subtext" value={data.finalSubtext} onChange={e => set("finalSubtext", e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Primary Button" value={data.finalCtaPrimary} onChange={e => set("finalCtaPrimary", e.target.value)} />
            <Input label="Secondary Button" value={data.finalCtaSecondary} onChange={e => set("finalCtaSecondary", e.target.value)} />
          </div>
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

      <PageVisibilityCard slug="creator-school" />
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}
