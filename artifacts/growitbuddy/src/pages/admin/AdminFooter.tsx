import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, SaveBar } from "@/components/admin/AdminField";
import { Plus, Trash2 } from "lucide-react";
import { FOOTER_DEFAULTS as DEFAULTS, type FooterData, type FooterColumn, type FooterLink } from "@/lib/footerDefaults";

export default function AdminFooter() {
  const { getContentResult, saveContent } = useAdmin();
  const [data, setData] = useState<FooterData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const result = await getContentResult("footer");
      if (!result.ok) { setLoadState("error"); return; }
      setData({ ...DEFAULTS, ...(result.data as Partial<FooterData> | null) });
      setLoadState("ready");
    } catch { setLoadState("error"); }
  }, [getContentResult]);
  useEffect(() => { load(); }, [load]);

  function set<K extends keyof FooterData>(key: K, val: FooterData[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      await saveContent("footer", data as unknown as Record<string, unknown>);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save footer content.");
    } finally {
      setSaving(false);
    }
  }

  function updateColumn(ci: number, patch: Partial<FooterColumn>) {
    const cols = [...data.columns];
    cols[ci] = { ...cols[ci], ...patch };
    set("columns", cols);
  }

  function updateLink(ci: number, li: number, patch: Partial<FooterLink>) {
    const cols = [...data.columns];
    const links = [...cols[ci].links];
    links[li] = { ...links[li], ...patch };
    cols[ci] = { ...cols[ci], links };
    set("columns", cols);
  }

  if (loadState !== "ready") return <div><PageHeader title="Footer" description={loadState === "error" ? "Couldn't load saved content" : "Loading…"} />{loadState === "error" ? <div className="flex flex-col items-center gap-3 py-24 text-center"><p className="text-[13px] text-red-600">Couldn't load saved footer content. Editing is disabled to protect your live data.</p><button onClick={load} className="text-[12px] font-semibold bg-[#0B0B0B] text-white px-4 py-2 rounded-xl">Retry</button></div> : <div className="py-24 text-center text-[13px] text-[#0B0B0B]/40">Loading content…</div>}</div>;

  return (
    <div>
      <PageHeader title="Footer" description="Edit footer tagline, social links, and navigation columns." />

      <div className="space-y-5">
        <Card>
          <SectionTitle>Brand & Contact</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tagline" value={data.tagline} onChange={(e) => set("tagline", e.target.value)} className="col-span-2" />
            <Input label="Email" value={data.email} onChange={(e) => set("email", e.target.value)} />
            <Input label="LinkedIn URL" value={data.linkedin} onChange={(e) => set("linkedin", e.target.value)} />
            <Input label="Twitter / X URL" value={data.twitter} onChange={(e) => set("twitter", e.target.value)} />
            <Input label="Instagram URL" value={data.instagram} onChange={(e) => set("instagram", e.target.value)} />
            <Input label="YouTube URL" value={data.youtube} onChange={(e) => set("youtube", e.target.value)} />
            <Input label="Legal / Copyright Text" value={data.legalText} onChange={(e) => set("legalText", e.target.value)} className="col-span-2" />
          </div>
        </Card>

        {data.columns.map((col, ci) => (
          <Card key={ci}>
            <div className="flex items-center justify-between mb-4">
              <Input
                value={col.title}
                onChange={(e) => updateColumn(ci, { title: e.target.value })}
                className="text-[14px] font-bold max-w-[180px]"
              />
              <button
                onClick={() => set("columns", data.columns.filter((_, i) => i !== ci))}
                className="text-[12px] text-red-400 hover:text-red-600 transition-colors"
              >
                Remove column
              </button>
            </div>
            <div className="space-y-2">
              {col.links.map((link, li) => (
                <div key={li} className="flex gap-2 items-center">
                  <Input
                    value={link.label}
                    onChange={(e) => updateLink(ci, li, { label: e.target.value })}
                    placeholder="Label"
                  />
                  <Input
                    value={link.path}
                    onChange={(e) => updateLink(ci, li, { path: e.target.value })}
                    placeholder="/path"
                  />
                  <button
                    onClick={() => {
                      const links = col.links.filter((_, i) => i !== li);
                      updateColumn(ci, { links });
                    }}
                    className="p-1.5 text-[#0B0B0B]/25 hover:text-red-500 shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => updateColumn(ci, { links: [...col.links, { label: "", path: "" }] })}
                className="text-[12px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] flex items-center gap-1 mt-1"
              >
                <Plus size={12} /> Add link
              </button>
            </div>
          </Card>
        ))}

        <button
          onClick={() => set("columns", [...data.columns, { title: "New Column", links: [] }])}
          className="w-full border-2 border-dashed border-[#0B0B0B]/15 rounded-2xl py-4 text-[13px] text-[#0B0B0B]/40 hover:border-[#0B0B0B]/30 hover:text-[#0B0B0B]/60 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={14} /> Add footer column
        </button>
      </div>

      {saveError && <p role="alert" className="text-[13px] text-red-600 mt-3">{saveError}</p>}
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
