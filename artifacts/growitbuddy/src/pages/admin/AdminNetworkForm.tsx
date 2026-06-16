import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { Plus, Trash2 } from "lucide-react";
import { CREATORS_FORM_DEFAULTS, PAGE_OWNER_FORM_DEFAULTS, type NetworkFormContent } from "@/lib/networkFormDefaults";

interface Props {
  contentKey: "creators-form" | "page-owner-form";
  slug: string;
  title: string;
  description: string;
}

export default function AdminNetworkForm({ contentKey, slug, title, description }: Props) {
  const { getContent, saveContent } = useAdmin();
  const DEFAULTS = contentKey === "creators-form" ? CREATORS_FORM_DEFAULTS : PAGE_OWNER_FORM_DEFAULTS;
  const [data, setData] = useState<NetworkFormContent>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    getContent(contentKey)
      .then((d) => {
        setData(d ? { ...DEFAULTS, ...(d as Partial<NetworkFormContent>) } : DEFAULTS);
      })
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getContent, contentKey]);

  function set<K extends keyof NetworkFormContent>(key: K, val: NetworkFormContent[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  function setListItem(key: "benefits" | "calloutItems", i: number, value: string) {
    const arr = [...data[key]];
    arr[i] = value;
    set(key, arr);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent(contentKey, data as unknown as Record<string, unknown>);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div>
        <PageHeader title={title} description={description} />
        <div className="flex items-center justify-center py-24 text-[13px] text-[#0B0B0B]/40">Loading content…</div>
      </div>
    );
  }

  const ListEditor = ({ label, field }: { label: string; field: "benefits" | "calloutItems" }) => (
    <div className="space-y-2">
      {data[field].map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <Input className="flex-1" value={item} onChange={(e) => setListItem(field, i, e.target.value)} placeholder={`${label} item`} />
          <button onClick={() => set(field, data[field].filter((_, x) => x !== i))} className="p-2 mt-0.5 text-[#0B0B0B]/30 hover:text-red-500" aria-label="Remove item"><Trash2 size={14} /></button>
        </div>
      ))}
      <button onClick={() => set(field, [...data[field], ""])} className="flex items-center gap-2 text-[12px] text-[#0B0B0B]/60 hover:text-[#0B0B0B] border border-dashed border-[#0B0B0B]/15 rounded-xl px-3 py-2 w-full justify-center">
        <Plus size={14} /> Add {label.toLowerCase()} item
      </button>
    </div>
  );

  return (
    <div>
      <PageHeader title={title} description={description} />

      <div className="space-y-5">
        <Card>
          <SectionTitle>Hero</SectionTitle>
          <div className="space-y-3">
            <Input label="Eyebrow" value={data.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
            <Input label="Heading" value={data.hero} onChange={(e) => set("hero", e.target.value)} />
            <Textarea label="Subtext" value={data.heroSubtext} onChange={(e) => set("heroSubtext", e.target.value)} rows={3} />
          </div>
        </Card>

        <Card>
          <SectionTitle>Benefits</SectionTitle>
          <div className="space-y-3">
            <Input label="Section title" value={data.sectionTitle} onChange={(e) => set("sectionTitle", e.target.value)} />
            <ListEditor label="Benefit" field="benefits" />
          </div>
        </Card>

        <Card>
          <SectionTitle>Callout Box</SectionTitle>
          <div className="space-y-3">
            <Input label="Callout label" value={data.calloutLabel} onChange={(e) => set("calloutLabel", e.target.value)} />
            <ListEditor label="Callout" field="calloutItems" />
          </div>
        </Card>

        <Card>
          <SectionTitle>Form Copy</SectionTitle>
          <div className="space-y-3">
            <Input label="Form title" value={data.formTitle} onChange={(e) => set("formTitle", e.target.value)} />
            <Input label="Form subtitle" value={data.formSubtitle} onChange={(e) => set("formSubtitle", e.target.value)} />
            <Input label="Submit button label" value={data.submitLabel} onChange={(e) => set("submitLabel", e.target.value)} />
            <Textarea label="Success message" value={data.successMsg} onChange={(e) => set("successMsg", e.target.value)} rows={3} />
          </div>
        </Card>

        <Card>
          <SectionTitle>SEO</SectionTitle>
          <div className="space-y-3">
            <Input label="SEO title" value={data.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
            <Textarea label="SEO description" value={data.seoDesc} onChange={(e) => set("seoDesc", e.target.value)} rows={2} />
          </div>
        </Card>
      </div>

      <PageVisibilityCard slug={slug} />
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
