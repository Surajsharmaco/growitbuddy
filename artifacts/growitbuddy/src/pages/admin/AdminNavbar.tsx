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
      <PageHeader title="Navbar" description="Edit the site navigation links, header social links, and CTA button." />

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

        <Card>
          <SectionTitle>Header social links</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Instagram URL" value={data.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://instagram.com/growitbuddy" />
            <Input label="LinkedIn URL" value={data.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="https://www.linkedin.com/company/growitbuddy" />
            <Input label="X (Twitter) URL" value={data.twitter} onChange={(e) => set("twitter", e.target.value)} placeholder="https://x.com/growitbuddy" />
            <Input label="YouTube URL" value={data.youtube} onChange={(e) => set("youtube", e.target.value)} placeholder="https://youtube.com/@growitbuddy" />
            <Input label="WhatsApp number (international format)" value={data.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} placeholder="919911990608" />
          </div>
          <p className="text-[12px] text-[#0B0B0B]/45 mt-3">
            These links control the header icons and SEO landing page links. Enter WhatsApp with the country code; punctuation is removed when creating the chat link. Footer links are edited separately under Footer. Blank social fields use the default GrowitBuddy profile.
          </p>
        </Card>

        <Card>
          <SectionTitle>SEO service page form</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Form heading" value={data.serviceHeroFormHeading} onChange={(e) => set("serviceHeroFormHeading", e.target.value)} placeholder="Send us a message" />
            <Input label="Form supporting text" value={data.serviceHeroFormSubtitle} onChange={(e) => set("serviceHeroFormSubtitle", e.target.value)} placeholder="We respond to every inquiry within 24 hours." />
            <Input label="Privacy message" value={data.serviceHeroPrivacyMessage} onChange={(e) => set("serviceHeroPrivacyMessage", e.target.value)} placeholder="Your information will only be used to respond to your inquiry." />
            <Input label="Privacy policy URL" value={data.serviceHeroPrivacyUrl} onChange={(e) => set("serviceHeroPrivacyUrl", e.target.value)} placeholder="/privacy" />
          </div>
          <p className="mt-3 text-[12px] text-[#0B0B0B]/45">
            These values are shared by every enabled SEO service page. Booking and social destinations above are the global defaults; page-specific booking overrides are managed in each page.
          </p>
        </Card>
      </div>

      {saveError && <p role="alert" className="text-[13px] text-red-600 mt-3">{saveError}</p>}
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
