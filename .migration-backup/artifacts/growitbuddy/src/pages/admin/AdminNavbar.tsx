import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, SaveBar } from "@/components/admin/AdminField";
import { NAVBAR_DEFAULTS as DEFAULTS, type NavbarData } from "@/lib/navbarDefaults";

export default function AdminNavbar() {
  const { getContent, saveContent } = useAdmin();
  const [data, setData] = useState<NavbarData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getContent("navbar").then((d) => {
      if (d) setData({ ...DEFAULTS, ...(d as Partial<NavbarData>) });
    });
  }, [getContent]);

  function set<K extends keyof NavbarData>(key: K, val: NavbarData[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent("navbar", data as unknown as Record<string, unknown>);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

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

      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
