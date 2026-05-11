import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, SaveBar } from "@/components/admin/AdminField";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface NavLink { label: string; path: string; }

interface NavbarData {
  logo: string;
  ctaLabel: string;
  ctaPath: string;
  links: NavLink[];
}

const DEFAULTS: NavbarData = {
  logo: "GrowitBuddy",
  ctaLabel: "Book a Call",
  ctaPath: "/contact",
  links: [
    { label: "Services", path: "/services" },
    { label: "Work", path: "/work" },
    { label: "Framework", path: "/framework" },
    { label: "Insights", path: "/insights" },
    { label: "Influencers", path: "/influencers" },
    { label: "About", path: "/about" },
  ],
};

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
            <Input label="CTA Button Path" value={data.ctaPath} onChange={(e) => set("ctaPath", e.target.value)} placeholder="/contact" />
          </div>
        </Card>

        <Card>
          <SectionTitle>Navigation Links</SectionTitle>
          <div className="space-y-2">
            {data.links.map((link, i) => (
              <div key={i} className="flex gap-2 items-center">
                <GripVertical size={14} className="text-[#0B0B0B]/20 shrink-0 cursor-grab" />
                <Input
                  value={link.label}
                  onChange={(e) => {
                    const ls = [...data.links];
                    ls[i] = { ...link, label: e.target.value };
                    set("links", ls);
                  }}
                  placeholder="Label"
                />
                <Input
                  value={link.path}
                  onChange={(e) => {
                    const ls = [...data.links];
                    ls[i] = { ...link, path: e.target.value };
                    set("links", ls);
                  }}
                  placeholder="/page"
                />
                <button
                  onClick={() => set("links", data.links.filter((_, li) => li !== i))}
                  className="p-1.5 text-[#0B0B0B]/25 hover:text-red-500 shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button
              onClick={() => set("links", [...data.links, { label: "", path: "" }])}
              className="text-[12px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] flex items-center gap-1 mt-1"
            >
              <Plus size={12} /> Add link
            </button>
          </div>
        </Card>
      </div>

      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
