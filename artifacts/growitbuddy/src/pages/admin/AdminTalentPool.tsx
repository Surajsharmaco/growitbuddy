import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { AlertCircle, ChevronDown, ChevronUp, Plus, Trash2, ExternalLink } from "lucide-react";
import { sourceLabel, getEmbedUrl, detectAspectRatio } from "@/lib/videoEmbed";
import { ImageUrlField } from "@/components/admin/ImageUrlField";
import { getPoolFormFields, type PoolFormField } from "@/lib/talentPoolForm";

interface ResourceCard { id: string; title: string; desc: string; link: string; btnLabel: string; }
interface Step { number: string; title: string; desc: string; }

interface PoolData {
  eyebrow: string; headline: string; description: string;
  opportunityText: string; ctaPrimary: string; ctaSecondary: string;
  videoUrl: string; bannerUrl: string; heroTrustText: string;
  stepsTitle: string; steps: Step[];
  resourcesTitle: string; resourcesSubtext: string; resources: ResourceCard[];
  formTitle: string; formSubtext: string; formDisclaimer: string; formNotifyEmail: string;
  formFields: PoolFormField[];
  formSubmitLabel?: string; formPrivacyText?: string; formSuccessTitle?: string; formSuccessText?: string;
  finalHeadline: string; finalSubtext: string; finalCtaPrimary: string;
  seoTitle: string; seoDesc: string;
}

const EMPTY: PoolData = {
  eyebrow: "", headline: "", description: "",
  opportunityText: "", ctaPrimary: "Submit Your Work", ctaSecondary: "View Resources",
  videoUrl: "", bannerUrl: "", heroTrustText: "",
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
  formFields: [],
  formSubmitLabel: "", formPrivacyText: "Your details are kept private and only used to match you with relevant creative opportunities.",
  formSuccessTitle: "", formSuccessText: "",
  finalHeadline: "Ready to join the network?",
  finalSubtext: "Submit your work and become part of the GrowitBuddy ecosystem.",
  finalCtaPrimary: "Submit Now",
  seoTitle: "", seoDesc: "",
};

const MAX_FORM_FIELDS = 50;
const MAX_FORM_FIELD_LABEL_LENGTH = 120;
const MAX_FORM_FIELD_PLACEHOLDER_LENGTH = 240;

interface Props {
  poolKey: string;
  label: string;
  description: string;
  pageUrl: string;
}

export default function AdminTalentPool({ poolKey, label, description, pageUrl }: Props) {
  const { getContentResult, saveContent } = useAdmin();
  const [data, setData] = useState<PoolData>(EMPTY);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [loadedRead, setLoadedRead] = useState<{ poolKey: string; getContentResult: typeof getContentResult } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [formBuilderError, setFormBuilderError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");
    setLoadError("");
    setSaved(false);
    setSaveError("");
    setFormBuilderError("");
    getContentResult(poolKey).then(result => {
      if (cancelled) return;
      if (!result.ok) {
        setLoadState("error");
        setLoadError("Unable to load this talent pool. Your existing content has not been changed.");
        return;
      }
      const savedData = (result.data ?? {}) as Partial<PoolData>;
      setData({
        ...EMPTY,
        ...savedData,
        // Old saved pool rows use the current per-pool defaults. A persisted
        // empty array, however, is an intentional configuration and stays empty.
        formFields: getPoolFormFields(poolKey, savedData.formFields),
      });
      setLoadedRead({ poolKey, getContentResult });
      setLoadState("ready");
    }).catch(() => {
      if (cancelled) return;
      setLoadState("error");
      setLoadError("Unable to load this talent pool. Your existing content has not been changed.");
    });
    return () => { cancelled = true; };
  }, [getContentResult, poolKey, retryCount]);

  function set<K extends keyof PoolData>(key: K, val: PoolData[K]) {
    setSaved(false);
    setSaveError("");
    if (key === "formFields") setFormBuilderError("");
    setData(p => ({ ...p, [key]: val }));
  }

  const readReady = loadState === "ready"
    && loadedRead?.poolKey === poolKey
    && loadedRead.getContentResult === getContentResult;

  async function save() {
    if (!readReady) return;
    const fields = data.formFields ?? [];
    const seenKeys = new Set<string>();
    const duplicateKey = fields.some(field => {
      const normalizedKey = field.key.trim().toLowerCase();
      if (seenKeys.has(normalizedKey)) return true;
      seenKeys.add(normalizedKey);
      return false;
    });
    const fieldErrors = [
      ...(fields.length > MAX_FORM_FIELDS ? [`A form can contain at most ${MAX_FORM_FIELDS} fields.`] : []),
      ...(fields.some(field => !field.key.trim() || !field.label.trim()) ? ["Every field needs a label and a key."] : []),
      ...(fields.some(field => field.label.length > MAX_FORM_FIELD_LABEL_LENGTH) ? [`Field labels must be ${MAX_FORM_FIELD_LABEL_LENGTH} characters or fewer.`] : []),
      ...(fields.some(field => field.placeholder.length > MAX_FORM_FIELD_PLACEHOLDER_LENGTH) ? [`Field placeholders must be ${MAX_FORM_FIELD_PLACEHOLDER_LENGTH} characters or fewer.`] : []),
      ...(duplicateKey ? ["Field keys must be unique."] : []),
    ];
    if (fieldErrors.length) {
      const message = `Cannot save the form: ${fieldErrors.join(" ")}`;
      setFormBuilderError(message);
      setSaveError(message);
      setSaved(false);
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const safeFormFields = fields.map(field => {
        if (field.key === "name") return { ...field, type: "text" as const, enabled: true, required: true };
        if (field.key === "email") return { ...field, type: "email" as const, enabled: true, required: true };
        return field;
      });
      await saveContent(poolKey, { ...data, formFields: safeFormFields } as unknown as Record<string, unknown>);
      setSaved(true);
      setFormBuilderError("");
    } catch (error) {
      setSaved(false);
      setSaveError(error instanceof Error ? error.message : "Unable to save this talent pool. Please try again.");
    }
    finally { setSaving(false); }
  }

  function updateFormField(index: number, patch: Partial<PoolFormField>) {
    const current = data.formFields ?? [];
    const next = current.map((field, fieldIndex) => {
      if (fieldIndex !== index) return field;
      const updated = { ...field, ...patch };
      if (updated.key === "name") return { ...updated, type: "text" as const, enabled: true, required: true };
      if (updated.key === "email") return { ...updated, type: "email" as const, enabled: true, required: true };
      return updated;
    });
    set("formFields", next);
  }

  function moveFormField(index: number, direction: -1 | 1) {
    const fields = [...(data.formFields ?? [])];
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    [fields[index], fields[target]] = [fields[target], fields[index]];
    set("formFields", fields);
  }

  function addFormField() {
    const fields = data.formFields ?? [];
    if (fields.length >= MAX_FORM_FIELDS) {
      const message = `A form can contain at most ${MAX_FORM_FIELDS} fields. Remove a field before adding another.`;
      setFormBuilderError(message);
      setSaveError(message);
      setSaved(false);
      return;
    }
    const baseKey = `custom_${Date.now().toString(36)}`;
    let key = baseKey;
    let suffix = 1;
    while (fields.some(field => field.key.toLowerCase() === key.toLowerCase())) {
      key = `${baseKey}_${suffix++}`;
    }
    set("formFields", [
      ...fields,
      { key, label: "New field", placeholder: "", type: "text", required: false, enabled: true },
    ]);
  }

  const formFieldLimitReached = (data.formFields?.length ?? 0) >= MAX_FORM_FIELDS;

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

      {loadState === "loading" || (loadState === "ready" && !readReady) ? (
        <Card>
          <p className="text-[14px] text-[#0B0B0B]/60">Loading talent pool content…</p>
        </Card>
      ) : loadState === "error" ? (
        <Card>
          <p role="alert" className="text-[14px] text-red-700">{loadError}</p>
          <button
            type="button"
            onClick={() => setRetryCount(count => count + 1)}
            className="mt-4 rounded-xl bg-[#0B0B0B] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0B0B0B]/85"
          >
            Retry loading
          </button>
        </Card>
      ) : readReady ? (
        <>
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
            hint="Small grey line shown below the hero media. Leave blank to hide." />
          <Input label="Secondary CTA Button" value={data.ctaSecondary} onChange={e => set("ctaSecondary", e.target.value)} />
        </div>
      </Card>

      {/* ── HERO BANNER IMAGE ── */}
      <Card className="mb-4">
        <SectionTitle>Hero Banner Image</SectionTitle>
        <div className="bg-[#F8F8F6] border border-[#0B0B0B]/8 rounded-xl px-4 py-3 mb-4 flex gap-3 items-start">
          <span className="text-[18px]">🖼️</span>
          <div>
            <p className="text-[13px] font-semibold text-[#0B0B0B] mb-0.5">Optional. If you upload a banner image here, it shows at the top of the page (right under the headline) instead of the video.</p>
            <p className="text-[12px] text-[#0B0B0B]/50">Leave it empty to use the demo video below. Wide images (16:9) look best.</p>
          </div>
        </div>
        <ImageUrlField
          label="Banner Image"
          value={data.bannerUrl}
          onChange={(url) => set("bannerUrl", url)}
          cropAspect="16:9"
          previewHeight={160}
          hint="Shown at the top as the VSL banner. Replaces the video when set."
        />
      </Card>

      {/* ── VIDEO ── */}
      <Card className="mb-4">
        <SectionTitle>Demo Video</SectionTitle>
        <div className="bg-[#F8F8F6] border border-[#0B0B0B]/8 rounded-xl px-4 py-3 mb-4 flex gap-3 items-start">
          <span className="text-[18px]">🎬</span>
          <div>
            <p className="text-[13px] font-semibold text-[#0B0B0B] mb-0.5">Paste a video link OR the full embed code from Gumlet, YouTube, Vimeo, or Google Drive.</p>
            <p className="text-[12px] text-[#0B0B0B]/50">Examples: <span className="font-mono">https://play.gumlet.io/embed/abc123</span> &nbsp;·&nbsp; <span className="font-mono">&lt;iframe src="…"&gt;&lt;/iframe&gt;</span></p>
            <p className="text-[12px] text-amber-700 font-medium mt-1">If a banner image is set above, it shows instead of this video.</p>
          </div>
        </div>
        <Textarea
          label="Video URL or Embed Code"
          value={data.videoUrl}
          onChange={e => set("videoUrl", e.target.value)}
          placeholder={'https://play.gumlet.io/embed/...  OR  <iframe src="..."></iframe>'}
          className="min-h-[90px] font-mono text-[12px]"
        />
        {(() => {
          if (!data.videoUrl) {
            return <div className="mt-3 flex items-center gap-2 text-[12px] text-[#0B0B0B]/40"><span className="w-2 h-2 rounded-full bg-[#0B0B0B]/20 inline-block" /> No video set - placeholder shown.</div>;
          }
          const label = sourceLabel(data.videoUrl);
          const embedSrc = getEmbedUrl(data.videoUrl);
          const ratio = detectAspectRatio(data.videoUrl);
          const isVertical = ratio === "9/16";
          if (!label || !embedSrc) {
            return <div className="mt-3 flex items-center gap-2 text-[12px] text-amber-700 font-medium"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> URL not recognized. Supported: YouTube, Vimeo, Google Drive, Gumlet.</div>;
          }
          return (
            <>
              <div className="mt-3 flex items-center gap-2 text-[12px] text-emerald-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                {label} video detected - live on page.
                <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#0B0B0B]/5 text-[#0B0B0B]/60">{ratio} {isVertical ? "vertical" : "horizontal"}</span>
              </div>
              <div className="mt-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#0B0B0B]/50 mb-2">Live Preview</div>
                <div
                  className="bg-black rounded-xl overflow-hidden mx-auto"
                  style={{
                    aspectRatio: ratio,
                    maxWidth: isVertical ? 280 : "100%",
                    width: "100%",
                    position: "relative",
                  }}
                >
                  <iframe
                    key={embedSrc}
                    src={embedSrc}
                    title="Video preview"
                    referrerPolicy="origin"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write"
                    allowFullScreen
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                  />
                </div>
                {isVertical && (
                  <p className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    ⚠️ This is a vertical (9:16) video. The talent pool page's video slot is horizontal (16:9), so on the live page it will show with black bars on the sides. Tell me if you want the slot switched to vertical.
                  </p>
                )}
              </div>
            </>
          );
        })()}
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
          <Textarea label="Form Subtext" value={data.formSubtext} onChange={e => set("formSubtext", e.target.value)} />
          <Input label="Notification Email" value={data.formNotifyEmail} onChange={e => set("formNotifyEmail", e.target.value)}
            placeholder="team@growitbuddy.com" type="email" hint="Receives a copy of each submission." />
          <Textarea label="Disclaimer Text" value={data.formDisclaimer} onChange={e => set("formDisclaimer", e.target.value)}
            hint="Shown below the form in grey. Leave blank to hide." />

          <div className="border-t border-[#0B0B0B]/8 pt-4 space-y-4">
            <Input
              label="Submit Button Label"
              value={data.formSubmitLabel ?? data.ctaPrimary}
              onChange={e => set("formSubmitLabel", e.target.value)}
              hint="If left blank, the pool's primary button label is used."
            />
            <Textarea
              label="Privacy Note"
              value={data.formPrivacyText ?? ""}
              onChange={e => set("formPrivacyText", e.target.value)}
              hint="Shown next to the submit button. Leave blank to hide."
            />
            <Input
              label="Success Heading"
              value={data.formSuccessTitle ?? ""}
              onChange={e => set("formSuccessTitle", e.target.value)}
              hint="Leave blank to use the existing pool-specific heading."
            />
            <Textarea
              label="Success Message"
              value={data.formSuccessText ?? ""}
              onChange={e => set("formSuccessText", e.target.value)}
              hint="Leave blank to use the standard success message."
            />
          </div>

          <div className="border-t border-[#0B0B0B]/8 pt-4">
            <div className="mb-4">
              <h3 className="text-[13px] font-bold text-[#0B0B0B]">Form Fields</h3>
              <p className="mt-1 text-[12px] leading-5 text-[#0B0B0B]/55">
                Edit labels and placeholders, choose the input type, hide built-in fields, or add custom questions.
                Required fields show a red “Must” badge on the public form and block submission until completed.
                Name and email stay required so applications can be processed.
              </p>
            </div>

            <div className="space-y-3">
              {(data.formFields ?? []).map((field, index) => {
                const fixed = field.key === "name" || field.key === "email";
                const custom = field.key.startsWith("custom_");
                return (
                  <div key={`${field.key}-${index}`} className="rounded-xl border border-[#0B0B0B]/10 p-3 sm:p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0B0B0B]/5 text-[11px] font-bold text-[#0B0B0B]/60">
                          {index + 1}
                        </span>
                        <span className="truncate text-[12px] font-semibold text-[#0B0B0B]/65">
                          {field.label.trim() || "Untitled field"}
                        </span>
                        {fixed && <span className="rounded-full bg-[#0B0B0B]/5 px-2 py-1 text-[10px] font-semibold text-[#0B0B0B]/50">Always required</span>}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveFormField(index, -1)}
                          disabled={index === 0}
                          aria-label={`Move ${field.label || "field"} up`}
                          title="Move field up"
                          className="rounded-lg p-2 text-[#0B0B0B]/55 hover:bg-[#0B0B0B]/5 disabled:cursor-not-allowed disabled:opacity-25"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFormField(index, 1)}
                          disabled={index === (data.formFields?.length ?? 0) - 1}
                          aria-label={`Move ${field.label || "field"} down`}
                          title="Move field down"
                          className="rounded-lg p-2 text-[#0B0B0B]/55 hover:bg-[#0B0B0B]/5 disabled:cursor-not-allowed disabled:opacity-25"
                        >
                          <ChevronDown size={16} />
                        </button>
                        {custom && (
                          <button
                            type="button"
                            onClick={() => set("formFields", (data.formFields ?? []).filter((_, fieldIndex) => fieldIndex !== index))}
                            aria-label={`Remove ${field.label || "custom field"}`}
                            title="Remove custom field"
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input
                        label="Field Label"
                        value={field.label}
                        onChange={e => updateFormField(index, { label: e.target.value })}
                        placeholder="e.g. Portfolio link"
                        maxLength={MAX_FORM_FIELD_LABEL_LENGTH}
                        required
                      />
                      <Input
                        label="Placeholder"
                        value={field.placeholder}
                        onChange={e => updateFormField(index, { placeholder: e.target.value })}
                        placeholder="Text shown inside the empty field"
                        maxLength={MAX_FORM_FIELD_PLACEHOLDER_LENGTH}
                      />
                      <label className="block">
                        <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-[#0B0B0B]/60">Input Type</span>
                        <select
                          value={field.type}
                          disabled={fixed}
                          onChange={e => updateFormField(index, { type: e.target.value as PoolFormField["type"] })}
                          aria-label={`Input type for ${field.label || "field"}`}
                          className="w-full rounded-xl border border-[#0B0B0B]/12 bg-white px-3.5 py-2.5 text-[14px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/40 disabled:cursor-not-allowed disabled:bg-[#0B0B0B]/5 disabled:text-[#0B0B0B]/45"
                        >
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="url">Website / URL</option>
                          <option value="textarea">Long answer</option>
                        </select>
                      </label>
                    </div>

                    <div className="mt-3 flex flex-col gap-3 border-t border-[#0B0B0B]/6 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                      <label className={`inline-flex min-h-10 items-center gap-2 text-[12px] font-semibold ${fixed ? "text-[#0B0B0B]/45" : "text-[#0B0B0B]/70"}`}>
                        <input
                          type="checkbox"
                          checked={field.enabled}
                          disabled={fixed}
                          onChange={e => updateFormField(index, { enabled: e.target.checked, ...(e.target.checked ? {} : { required: false }) })}
                          className="h-4 w-4 accent-[#1E293B] disabled:cursor-not-allowed"
                        />
                        Show this field on the public form
                      </label>
                      <label className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-[12px] font-bold ${field.required ? "bg-red-50 text-red-700" : "text-[#0B0B0B]/55"} ${fixed ? "cursor-not-allowed" : "cursor-pointer"}`}>
                        <input
                          type="checkbox"
                          checked={field.required}
                          disabled={fixed || !field.enabled}
                          onChange={e => updateFormField(index, { required: e.target.checked })}
                          className="h-4 w-4 accent-red-600 disabled:cursor-not-allowed"
                        />
                        <AlertCircle size={15} aria-hidden="true" className={field.required ? "text-red-600" : "text-[#0B0B0B]/30"} />
                        Must
                        {fixed && <span className="font-medium text-[#0B0B0B]/40">(always required)</span>}
                      </label>
                      {!fixed && !field.enabled && (
                        <span className="text-[11px] text-[#0B0B0B]/45">Hidden fields are not required.</span>
                      )}
                    </div>
                    <p className="mt-1 break-all text-[10px] text-[#0B0B0B]/35">Field key: {field.key}</p>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addFormField}
              disabled={formFieldLimitReached}
              className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#0B0B0B]/15 px-4 py-2 text-[13px] font-semibold text-[#0B0B0B]/65 hover:border-[#0B0B0B]/30 hover:bg-[#0B0B0B]/[0.02] disabled:cursor-not-allowed disabled:border-red-200 disabled:bg-red-50 disabled:text-red-700"
            >
              <Plus size={15} /> {formFieldLimitReached ? "Field limit reached" : "Add custom field"}
            </button>
            {formFieldLimitReached && (
              <p role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
                A form can contain at most {MAX_FORM_FIELDS} fields. Remove a field before adding another.
              </p>
            )}
            <p className="mt-2 text-[11px] leading-5 text-[#0B0B0B]/45">
              Built-in fields can be hidden. Custom fields can be removed. Reordering here also changes their order on the public form.
            </p>
            {formBuilderError && (
              <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
                {formBuilderError}
              </p>
            )}
          </div>
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
      {saveError && <p role="alert" className="mt-4 text-[13px] text-red-700">{saveError}</p>}
      <SaveBar onSave={save} saving={saving} saved={saved} />
        </>
      ) : null}
    </div>
  );
}
