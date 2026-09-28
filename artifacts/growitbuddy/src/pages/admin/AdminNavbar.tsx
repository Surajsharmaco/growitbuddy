import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, SaveBar } from "@/components/admin/AdminField";
import { NAVBAR_DEFAULTS as DEFAULTS, type NavbarData } from "@/lib/navbarDefaults";

export default function AdminNavbar() {
  const { getContentResult, saveContent } = useAdmin();
  const [data, setData] = useState<NavbarData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const result = await getContentResult("navbar");
      if (!result.ok) { setLoadState("error"); return; }
      setData({ ...DEFAULTS, ...(result.data as Partial<NavbarData> | null) });
      setLoadState("ready");
    } catch { setLoadState("error"); }
  }, [getContentResult]);
  useEffect(() => { load(); }, [load]);

  function set<K extends keyof NavbarData>(key: K, val: NavbarData[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      await saveContent("navbar", data as unknown as Record<string, unknown>);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save navbar content.");
    } finally {
      setSaving(false);
    }
  }

  if (loadState !== "ready") return <div><PageHeader title="Navbar" description={loadState === "error" ? "Couldn't load saved content" : "Loading…"} />{loadState === "error" ? <div className="flex flex-col items-center gap-3 py-24 text-center"><p className="text-[13px] text-red-600">Couldn't load saved navbar content. Editing is disabled to protect your live data.</p><button onClick={load} className="text-[12px] font-semibold bg-[#0B0B0B] text-white px-4 py-2 rounded-xl">Retry</button></div> : <div className="py-24 text-center text-[13px] text-[#0B0B0B]/40">Loading content…</div>}</div>;

  return (
    <div>
      <PageHeader title="Navbar" description="Edit the site navigation links and CTA button." />

      <div className="space-y-5">
        <Card>
          <SectionTitle>Brand & CTA</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Logo Text" value={data.logo} onChange={(e) => set("logo", e.target.value)} />
            <div /> {/* spacer */}
            <Input label="CTA Button Label" value={data.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
            <Input label="CTA Button Path" value={data.ctaPath} onChange={(e) => set("ctaPath", e.target.value)} placeholder="https://cal.com/..." />
          </div>
          <p className="text-[12px] text-[#0B0B0B]/45 mt-3">
            Navigation links (Services, Work, Framework, Network, About, Careers, More) are managed in the site code and cannot be edited here.
          </p>
        </Card>
      </div>

      {saveError && <p role="alert" className="text-[13px] text-red-600 mt-3">{saveError}</p>}
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
