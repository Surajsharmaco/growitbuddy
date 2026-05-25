import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { ImagePickerField } from "@/components/admin/ImagePickerField";
import { Plus, Trash2, Lock } from "lucide-react";

import { HOME_DEFAULTS as DEFAULTS, type HomeData } from "@/lib/homeDefaults";

export default function AdminHome() {
  const { getContent, saveContent } = useAdmin();
  const [data, setData] = useState<HomeData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getContent("home")
      .then((d) => {
        if (d) setData({ ...DEFAULTS, ...(d as Partial<HomeData>) });
      })
      .finally(() => setLoaded(true));
  }, [getContent]);

  function set<K extends keyof HomeData>(key: K, val: HomeData[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent("home", data as unknown as Record<string, unknown>);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div>
        <PageHeader title="Home Page" description="Edit every section of the landing page." />
        <div className="flex items-center justify-center py-24 text-[13px] text-[#0B0B0B]/40">Loading content…</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Home Page" description="Edit every section of the landing page." />

      <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <span className="font-semibold">Homepage is locked.</span> Changes made here will not be saved. The homepage is protected to prevent accidental edits. Contact a developer to modify it.
        </div>
      </div>

      <div className="space-y-5">

        {/* ── Hero ── */}
        <Card>
          <SectionTitle>Hero</SectionTitle>
          <div className="space-y-3">
            <Input label="Badge text" value={data.heroBadge} onChange={(e) => set("heroBadge", e.target.value)} hint="Small pill above headline" />
            <div className="flex gap-2">
              <Input label="Headline" value={data.heroHeadline} onChange={(e) => set("heroHeadline", e.target.value)} />
              <Input label="Italic word" value={data.heroHeadlineItalic} onChange={(e) => set("heroHeadlineItalic", e.target.value)} hint="Shown in italic" />
            </div>
            <Textarea label="Subtext" value={data.heroSubtext} onChange={(e) => set("heroSubtext", e.target.value)} rows={2} />
            <div className="flex gap-2">
              <Input label="Primary button" value={data.heroCTAPrimary} onChange={(e) => set("heroCTAPrimary", e.target.value)} />
              <Input label="Secondary button" value={data.heroCTASecondary} onChange={(e) => set("heroCTASecondary", e.target.value)} />
            </div>
          </div>
        </Card>

        {/* ── Stats strip ── */}
        <Card>
          <SectionTitle>Stats Strip</SectionTitle>
          <div className="space-y-2">
            {data.stats.map((stat, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input value={stat.value} onChange={(e) => { const s = [...data.stats]; s[i] = { ...stat, value: e.target.value }; set("stats", s); }} placeholder="700M+" />
                <Input value={stat.label} onChange={(e) => { const s = [...data.stats]; s[i] = { ...stat, label: e.target.value }; set("stats", s); }} placeholder="Views Generated" />
                <button onClick={() => set("stats", data.stats.filter((_, si) => si !== i))} className="p-1.5 text-[#0B0B0B]/25 hover:text-red-500 shrink-0"><Trash2 size={13} /></button>
              </div>
            ))}
            <button onClick={() => set("stats", [...data.stats, { value: "", label: "" }])} className="text-[12px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] flex items-center gap-1 mt-1"><Plus size={12} /> Add stat</button>
          </div>
        </Card>

        {/* ── Problem ── */}
        <Card>
          <SectionTitle>Problem Section</SectionTitle>
          <div className="space-y-3">
            <Input label="Section label" value={data.problemLabel} onChange={(e) => set("problemLabel", e.target.value)} />
            <Input label="Headline" value={data.problemHeadline} onChange={(e) => set("problemHeadline", e.target.value)} />
            <div className="space-y-3 mt-2">
              {data.problems.map((p, i) => (
                <div key={i} className="border border-[#0B0B0B]/8 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-semibold text-[#0B0B0B]/40 uppercase tracking-wider">Problem {i + 1}</span>
                    <button onClick={() => set("problems", data.problems.filter((_, pi) => pi !== i))} className="text-[#0B0B0B]/25 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                  <Input value={p.title} onChange={(e) => { const ps = [...data.problems]; ps[i] = { ...p, title: e.target.value }; set("problems", ps); }} placeholder="Problem title" />
                  <Textarea value={p.desc} onChange={(e) => { const ps = [...data.problems]; ps[i] = { ...p, desc: e.target.value }; set("problems", ps); }} rows={2} placeholder="Description" />
                </div>
              ))}
              <button onClick={() => set("problems", [...data.problems, { title: "", desc: "" }])} className="text-[12px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] flex items-center gap-1"><Plus size={12} /> Add problem</button>
            </div>
          </div>
        </Card>

        {/* ── Solution ── */}
        <Card>
          <SectionTitle>Solution / Comparison</SectionTitle>
          <div className="space-y-3">
            <Input label="Section label" value={data.solutionLabel} onChange={(e) => set("solutionLabel", e.target.value)} />
            <Input label="Headline" value={data.solutionHeadline} onChange={(e) => set("solutionHeadline", e.target.value)} />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="space-y-2">
                <Input label="Before column label" value={data.solutionBeforeLabel} onChange={(e) => set("solutionBeforeLabel", e.target.value)} />
                {data.solutionBefore.map((item, i) => (
                  <div key={i} className="flex gap-1 items-center">
                    <Input value={item} onChange={(e) => { const s = [...data.solutionBefore]; s[i] = e.target.value; set("solutionBefore", s); }} placeholder="Before item" />
                    <button onClick={() => set("solutionBefore", data.solutionBefore.filter((_, si) => si !== i))} className="p-1.5 text-[#0B0B0B]/25 hover:text-red-500 shrink-0"><Trash2 size={13} /></button>
                  </div>
                ))}
                <button onClick={() => set("solutionBefore", [...data.solutionBefore, ""])} className="text-[12px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] flex items-center gap-1"><Plus size={12} /> Add item</button>
              </div>
              <div className="space-y-2">
                <Input label="After column label" value={data.solutionAfterLabel} onChange={(e) => set("solutionAfterLabel", e.target.value)} />
                {data.solutionAfter.map((item, i) => (
                  <div key={i} className="flex gap-1 items-center">
                    <Input value={item} onChange={(e) => { const s = [...data.solutionAfter]; s[i] = e.target.value; set("solutionAfter", s); }} placeholder="After item" />
                    <button onClick={() => set("solutionAfter", data.solutionAfter.filter((_, si) => si !== i))} className="p-1.5 text-[#0B0B0B]/25 hover:text-red-500 shrink-0"><Trash2 size={13} /></button>
                  </div>
                ))}
                <button onClick={() => set("solutionAfter", [...data.solutionAfter, ""])} className="text-[12px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] flex items-center gap-1"><Plus size={12} /> Add item</button>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Services ── */}
        <Card>
          <SectionTitle>Services</SectionTitle>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input label="Section label" value={data.servicesLabel} onChange={(e) => set("servicesLabel", e.target.value)} />
            </div>
            <Input label="Headline" value={data.servicesHeadline} onChange={(e) => set("servicesHeadline", e.target.value)} />
            <div className="space-y-3 mt-2">
              {data.services.map((s, i) => (
                <div key={i} className="border border-[#0B0B0B]/8 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-semibold text-[#0B0B0B]/40 uppercase tracking-wider">Service {i + 1}</span>
                    <button onClick={() => set("services", data.services.filter((_, si) => si !== i))} className="text-[#0B0B0B]/25 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                  <div className="flex gap-2">
                    <Input value={s.num} onChange={(e) => { const sv = [...data.services]; sv[i] = { ...s, num: e.target.value }; set("services", sv); }} placeholder="01" />
                    <Input value={s.title} onChange={(e) => { const sv = [...data.services]; sv[i] = { ...s, title: e.target.value }; set("services", sv); }} placeholder="Title" />
                  </div>
                  <Textarea value={s.desc} onChange={(e) => { const sv = [...data.services]; sv[i] = { ...s, desc: e.target.value }; set("services", sv); }} rows={2} placeholder="Description" />
                </div>
              ))}
              <button onClick={() => set("services", [...data.services, { num: String(data.services.length + 1).padStart(2, "0"), title: "", desc: "" }])} className="text-[12px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] flex items-center gap-1"><Plus size={12} /> Add service</button>
            </div>
          </div>
        </Card>

        {/* ── Framework ── */}
        <Card>
          <SectionTitle>Framework Section</SectionTitle>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input label="Section label" value={data.frameworkLabel} onChange={(e) => set("frameworkLabel", e.target.value)} />
              <Input label="CTA button" value={data.frameworkCTA} onChange={(e) => set("frameworkCTA", e.target.value)} />
            </div>
            <Input label="Headline" value={data.frameworkHeadline} onChange={(e) => set("frameworkHeadline", e.target.value)} />
            <div className="space-y-3 mt-2">
              {data.frameworkSteps.map((step, i) => (
                <div key={i} className="border border-[#0B0B0B]/8 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-semibold text-[#0B0B0B]/40 uppercase tracking-wider">Step {i + 1}</span>
                    <button onClick={() => set("frameworkSteps", data.frameworkSteps.filter((_, si) => si !== i))} className="text-[#0B0B0B]/25 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                  <div className="flex gap-2">
                    <Input value={step.step} onChange={(e) => { const fs = [...data.frameworkSteps]; fs[i] = { ...step, step: e.target.value }; set("frameworkSteps", fs); }} placeholder="01" />
                    <Input value={step.title} onChange={(e) => { const fs = [...data.frameworkSteps]; fs[i] = { ...step, title: e.target.value }; set("frameworkSteps", fs); }} placeholder="Title" />
                  </div>
                  <Textarea value={step.desc} onChange={(e) => { const fs = [...data.frameworkSteps]; fs[i] = { ...step, desc: e.target.value }; set("frameworkSteps", fs); }} rows={2} placeholder="Description" />
                </div>
              ))}
              <button onClick={() => set("frameworkSteps", [...data.frameworkSteps, { step: String(data.frameworkSteps.length + 1).padStart(2, "0"), title: "", desc: "" }])} className="text-[12px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] flex items-center gap-1"><Plus size={12} /> Add step</button>
            </div>
          </div>
        </Card>

        {/* ── Proof of Work ── */}
        <Card>
          <SectionTitle>Proof of Work</SectionTitle>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input label="Section label" value={data.proofLabel} onChange={(e) => set("proofLabel", e.target.value)} />
            </div>
            <Input label="Headline" value={data.proofHeadline} onChange={(e) => set("proofHeadline", e.target.value)} />
            <div className="space-y-3 mt-2">
              {data.proof.map((p, i) => (
                <div key={i} className="border border-[#0B0B0B]/8 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-semibold text-[#0B0B0B]/40 uppercase tracking-wider">Case {i + 1}</span>
                    <button onClick={() => set("proof", data.proof.filter((_, pi) => pi !== i))} className="text-[#0B0B0B]/25 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                  <div className="flex gap-2">
                    <Input value={p.metric} onChange={(e) => { const pr = [...data.proof]; pr[i] = { ...p, metric: e.target.value }; set("proof", pr); }} placeholder="14M" />
                    <Input value={p.unit} onChange={(e) => { const pr = [...data.proof]; pr[i] = { ...p, unit: e.target.value }; set("proof", pr); }} placeholder="impressions" />
                  </div>
                  <div className="flex gap-2">
                    <Input value={p.name} onChange={(e) => { const pr = [...data.proof]; pr[i] = { ...p, name: e.target.value }; set("proof", pr); }} placeholder="Case study name" />
                    <Input value={p.category} onChange={(e) => { const pr = [...data.proof]; pr[i] = { ...p, category: e.target.value }; set("proof", pr); }} placeholder="B2B SaaS · LinkedIn" />
                  </div>
                </div>
              ))}
              <button onClick={() => set("proof", [...data.proof, { metric: "", unit: "", name: "", category: "" }])} className="text-[12px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] flex items-center gap-1"><Plus size={12} /> Add case</button>
            </div>
          </div>
        </Card>

        {/* ── Process ── */}
        <Card>
          <SectionTitle>Process Section</SectionTitle>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input label="Section label" value={data.processLabel} onChange={(e) => set("processLabel", e.target.value)} />
            </div>
            <Input label="Headline" value={data.processHeadline} onChange={(e) => set("processHeadline", e.target.value)} />
            <div className="space-y-3 mt-2">
              {data.processSteps.map((step, i) => (
                <div key={i} className="border border-[#0B0B0B]/8 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-semibold text-[#0B0B0B]/40 uppercase tracking-wider">Step {i + 1}</span>
                    <button onClick={() => set("processSteps", data.processSteps.filter((_, si) => si !== i))} className="text-[#0B0B0B]/25 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                  <div className="flex gap-2">
                    <Input value={step.num} onChange={(e) => { const ps = [...data.processSteps]; ps[i] = { ...step, num: e.target.value }; set("processSteps", ps); }} placeholder="01" />
                    <Input value={step.title} onChange={(e) => { const ps = [...data.processSteps]; ps[i] = { ...step, title: e.target.value }; set("processSteps", ps); }} placeholder="Title" />
                  </div>
                  <Textarea value={step.desc} onChange={(e) => { const ps = [...data.processSteps]; ps[i] = { ...step, desc: e.target.value }; set("processSteps", ps); }} rows={2} placeholder="Description" />
                </div>
              ))}
              <button onClick={() => set("processSteps", [...data.processSteps, { num: String(data.processSteps.length + 1).padStart(2, "0"), title: "", desc: "" }])} className="text-[12px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] flex items-center gap-1"><Plus size={12} /> Add step</button>
            </div>
          </div>
        </Card>

        {/* ── Ecosystem ── */}
        <Card>
          <SectionTitle>Ecosystem Section</SectionTitle>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input label="Section label" value={data.ecosystemLabel} onChange={(e) => set("ecosystemLabel", e.target.value)} />
            </div>
            <Input label="Headline" value={data.ecosystemHeadline} onChange={(e) => set("ecosystemHeadline", e.target.value)} />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="border border-[#0B0B0B]/8 rounded-xl p-4 space-y-2">
                <span className="text-[11px] font-semibold text-[#0B0B0B]/40 uppercase tracking-wider block mb-2">Creator card</span>
                <Input label="Tag" value={data.ecosystemCreatorTag} onChange={(e) => set("ecosystemCreatorTag", e.target.value)} />
                <Input label="Title" value={data.ecosystemCreatorTitle} onChange={(e) => set("ecosystemCreatorTitle", e.target.value)} />
                <Textarea label="Description" value={data.ecosystemCreatorDesc} onChange={(e) => set("ecosystemCreatorDesc", e.target.value)} rows={2} />
                <Input label="CTA" value={data.ecosystemCreatorCTA} onChange={(e) => set("ecosystemCreatorCTA", e.target.value)} />
              </div>
              <div className="border border-[#0B0B0B]/8 rounded-xl p-4 space-y-2">
                <span className="text-[11px] font-semibold text-[#0B0B0B]/40 uppercase tracking-wider block mb-2">Freelancer card</span>
                <Input label="Tag" value={data.ecosystemFreelancerTag} onChange={(e) => set("ecosystemFreelancerTag", e.target.value)} />
                <Input label="Title" value={data.ecosystemFreelancerTitle} onChange={(e) => set("ecosystemFreelancerTitle", e.target.value)} />
                <Textarea label="Description" value={data.ecosystemFreelancerDesc} onChange={(e) => set("ecosystemFreelancerDesc", e.target.value)} rows={2} />
                <Input label="CTA" value={data.ecosystemFreelancerCTA} onChange={(e) => set("ecosystemFreelancerCTA", e.target.value)} />
              </div>
            </div>
          </div>
        </Card>

        {/* ── Authority Audit ── */}
        <Card>
          <SectionTitle>Authority Audit Promo</SectionTitle>
          <div className="space-y-3">
            <Input label="Section label" value={data.auditLabel} onChange={(e) => set("auditLabel", e.target.value)} />
            <Input label="Headline" value={data.auditHeadline} onChange={(e) => set("auditHeadline", e.target.value)} />
            <Textarea label="Subtext" value={data.auditSubtext} onChange={(e) => set("auditSubtext", e.target.value)} rows={2} />
            <Input label="CTA button" value={data.auditCTA} onChange={(e) => set("auditCTA", e.target.value)} />
          </div>
        </Card>

        {/* ── Founder ── */}
        <Card>
          <SectionTitle>Founder Section</SectionTitle>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input label="Section label" value={data.founderLabel} onChange={(e) => set("founderLabel", e.target.value)} />
              <Input label="Initials (fallback)" value={data.founderInitials} onChange={(e) => set("founderInitials", e.target.value)} hint="Shown when no photo is set" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#0B0B0B]/45 mb-2 uppercase tracking-widest">Founder Photo</label>
              <ImagePickerField label="" value={data.founderPhoto} onChange={(url) => set("founderPhoto", url)} shape="square" size={72} hint="Recommended: 400 × 400 px (square) • JPG or PNG • Face centered" />
            </div>
            <Input label="Name" value={data.founderName} onChange={(e) => set("founderName", e.target.value)} />
            <Textarea label="Quote" value={data.founderQuote} onChange={(e) => set("founderQuote", e.target.value)} rows={3} />
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-[#0B0B0B]/50 uppercase tracking-wider">Tags</p>
              {data.founderTags.map((tag, i) => (
                <div key={i} className="flex gap-1 items-center">
                  <Input value={tag} onChange={(e) => { const t = [...data.founderTags]; t[i] = e.target.value; set("founderTags", t); }} placeholder="Tag" />
                  <button onClick={() => set("founderTags", data.founderTags.filter((_, ti) => ti !== i))} className="p-1.5 text-[#0B0B0B]/25 hover:text-red-500 shrink-0"><Trash2 size={13} /></button>
                </div>
              ))}
              <button onClick={() => set("founderTags", [...data.founderTags, ""])} className="text-[12px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] flex items-center gap-1"><Plus size={12} /> Add tag</button>
            </div>
          </div>
        </Card>

        {/* ── Testimonials ── */}
        <Card>
          <SectionTitle>Testimonials</SectionTitle>
          <div className="space-y-3">
            <Input label="Section headline" value={data.testimonialsHeadline} onChange={(e) => set("testimonialsHeadline", e.target.value)} />
            <div className="space-y-3 mt-2">
              {data.testimonials.map((t, i) => (
                <div key={i} className="border border-[#0B0B0B]/8 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-semibold text-[#0B0B0B]/40 uppercase tracking-wider">Testimonial {i + 1}</span>
                    <button onClick={() => set("testimonials", data.testimonials.filter((_, ti) => ti !== i))} className="text-[#0B0B0B]/25 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                  <Textarea value={t.quote} onChange={(e) => { const ts = [...data.testimonials]; ts[i] = { ...t, quote: e.target.value }; set("testimonials", ts); }} rows={2} placeholder="Quote" />
                  <div className="flex gap-2">
                    <Input value={t.name} onChange={(e) => { const ts = [...data.testimonials]; ts[i] = { ...t, name: e.target.value }; set("testimonials", ts); }} placeholder="Name" />
                    <Input value={t.role} onChange={(e) => { const ts = [...data.testimonials]; ts[i] = { ...t, role: e.target.value }; set("testimonials", ts); }} placeholder="Role / Company" />
                    <Input value={t.initials} onChange={(e) => { const ts = [...data.testimonials]; ts[i] = { ...t, initials: e.target.value }; set("testimonials", ts); }} placeholder="JL" hint="Avatar" />
                  </div>
                </div>
              ))}
              <button onClick={() => set("testimonials", [...data.testimonials, { quote: "", name: "", role: "", initials: "" }])} className="text-[12px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] flex items-center gap-1"><Plus size={12} /> Add testimonial</button>
            </div>
          </div>
        </Card>

        {/* ── Final CTA ── */}
        <Card>
          <SectionTitle>Final CTA Banner</SectionTitle>
          <div className="space-y-3">
            <Input label="Headline" value={data.ctaHeadline} onChange={(e) => set("ctaHeadline", e.target.value)} />
            <Textarea label="Subtext" value={data.ctaSubtext} onChange={(e) => set("ctaSubtext", e.target.value)} rows={2} />
            <div className="flex gap-2">
              <Input label="Button text" value={data.ctaButton} onChange={(e) => set("ctaButton", e.target.value)} />
              <Input label="Secondary link text" value={data.ctaSecondaryLink} onChange={(e) => set("ctaSecondaryLink", e.target.value)} />
            </div>
            <Input label="Success message" value={data.ctaSuccess} onChange={(e) => set("ctaSuccess", e.target.value)} hint="Shown after email submission" />
          </div>
        </Card>

      </div>

      <PageVisibilityCard slug="home" />
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
