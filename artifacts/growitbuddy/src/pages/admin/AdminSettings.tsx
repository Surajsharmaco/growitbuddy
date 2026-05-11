import { useEffect, useState, useCallback } from "react";
import { useAdmin } from "@/context/AdminContext";
import {
  PageHeader, Card, SectionTitle, Input, Textarea, SaveBar,
} from "@/components/admin/AdminField";
import { ImageCropUploader } from "@/components/admin/ImageCropUploader";

interface Settings {
  companyName: string;
  tagline: string;
  email: string;
  phone: string;
  calLink: string;
  cursorEnabled: boolean;
  introEnabled: boolean;
  fontScale: number;
  metaDescription: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
}

const DEFAULTS: Settings = {
  companyName: "GrowitBuddy",
  tagline: "The Premium Content & Authority Studio",
  email: "cs.growitbuddy@gmail.com",
  phone: "",
  calLink: "growitbuddy/strategy",
  cursorEnabled: true,
  introEnabled: true,
  fontScale: 100,
  metaDescription: "GrowitBuddy - The premium content & authority studio for founders, creators and freelancers.",
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "#0B0B0B",
  accentColor: "#F7F7F5",
};

const PRESET_PALETTES = [
  { name: "Default", primary: "#0B0B0B", accent: "#F7F7F5" },
  { name: "Midnight", primary: "#1a1a2e", accent: "#eaeaf5" },
  { name: "Forest", primary: "#1b3a2d", accent: "#eef6f0" },
  { name: "Rust", primary: "#7c2d12", accent: "#fff7ed" },
  { name: "Navy", primary: "#1e3a5f", accent: "#eff6ff" },
  { name: "Plum", primary: "#4c1d95", accent: "#f5f3ff" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-10 h-6 rounded-full transition-colors ${checked ? "bg-[#0B0B0B]" : "bg-[#0B0B0B]/20"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
    </button>
  );
}

export default function AdminSettings() {
  const { getContent, saveContent } = useAdmin();
  const [data, setData] = useState<Settings>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getContent("settings").then((d) => {
      if (d) setData({ ...DEFAULTS, ...(d as Partial<Settings>) });
    });
  }, [getContent]);

  const set = useCallback(<K extends keyof Settings>(key: K, val: Settings[K]) => {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent("settings", data as unknown as Record<string, unknown>);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Site Settings" description="Global configuration, branding, and design for the entire website." />

      <div className="space-y-5">

        {/* Company Info */}
        <Card>
          <SectionTitle>Company Info</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Company Name" value={data.companyName} onChange={(e) => set("companyName", e.target.value)} />
            <Input label="Email Address" value={data.email} onChange={(e) => set("email", e.target.value)} />
            <Input label="Tagline" value={data.tagline} onChange={(e) => set("tagline", e.target.value)} className="sm:col-span-2" />
            <Textarea
              label="Meta Description"
              value={data.metaDescription}
              onChange={(e) => set("metaDescription", e.target.value)}
              className="sm:col-span-2"
              rows={2}
            />
          </div>
        </Card>

        {/* Booking & Contact */}
        <Card>
          <SectionTitle>Booking & Contact</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cal.com Link"
              value={data.calLink}
              onChange={(e) => set("calLink", e.target.value)}
              hint="e.g. growitbuddy/strategy - used on the Contact page"
            />
            <Input
              label="Phone / WhatsApp"
              value={data.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+1 555 000 0000"
            />
          </div>
        </Card>

        {/* Brand & Design */}
        <Card>
          <SectionTitle>Brand & Design</SectionTitle>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-3 uppercase tracking-wider">Logo Image</label>
              <ImageCropUploader value={data.logoUrl} onChange={(url) => set("logoUrl", url)} />
              {data.logoUrl && (
                <p className="text-[10px] text-[#0B0B0B]/35 mt-1.5">Logo is saved and will be used site-wide once wired into the navbar</p>
              )}
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-3 uppercase tracking-wider">Favicon</label>
              <ImageCropUploader value={data.faviconUrl} onChange={(url) => set("faviconUrl", url)} />
              <p className="text-[10px] text-[#0B0B0B]/35 mt-1.5">Upload a square PNG or ICO (32×32 or 64×64 recommended). Changes apply after saving.</p>
            </div>
          </div>

          {/* Color palettes */}
          <div className="mb-5">
            <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-3 uppercase tracking-wider">Color Palette Presets</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_PALETTES.map((p) => {
                const isActive = data.primaryColor === p.primary;
                return (
                  <button
                    key={p.name}
                    onClick={() => { set("primaryColor", p.primary); set("accentColor", p.accent); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-semibold transition-all ${isActive ? "border-[#0B0B0B] ring-1 ring-[#0B0B0B]" : "border-[#0B0B0B]/12 hover:border-[#0B0B0B]/30"}`}
                  >
                    <span className="flex gap-1">
                      <span style={{ background: p.primary }} className="w-4 h-4 rounded-full border border-black/10" />
                      <span style={{ background: p.accent }} className="w-4 h-4 rounded-full border border-black/10" />
                    </span>
                    <span className="text-[#0B0B0B]/70">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-2 uppercase tracking-wider">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={data.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  className="w-10 h-10 rounded-xl border border-[#0B0B0B]/12 cursor-pointer p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={data.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  className="flex-1 border border-[#0B0B0B]/12 rounded-xl px-3 py-2 text-[13px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/40 bg-white font-mono"
                  placeholder="#0B0B0B"
                />
              </div>
              <p className="text-[10px] text-[#0B0B0B]/35 mt-1.5">Buttons, active states, headings</p>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-2 uppercase tracking-wider">Accent / Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={data.accentColor}
                  onChange={(e) => set("accentColor", e.target.value)}
                  className="w-10 h-10 rounded-xl border border-[#0B0B0B]/12 cursor-pointer p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={data.accentColor}
                  onChange={(e) => set("accentColor", e.target.value)}
                  className="flex-1 border border-[#0B0B0B]/12 rounded-xl px-3 py-2 text-[13px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/40 bg-white font-mono"
                  placeholder="#F7F7F5"
                />
              </div>
              <p className="text-[10px] text-[#0B0B0B]/35 mt-1.5">Page backgrounds, light surfaces</p>
            </div>
          </div>

          {/* Live preview */}
          <div className="mt-5 rounded-xl overflow-hidden border border-[#0B0B0B]/10">
            <div style={{ background: data.primaryColor }} className="px-5 py-3 flex items-center justify-between">
              <span style={{ color: data.accentColor, fontWeight: 800, fontSize: 14, letterSpacing: "-0.03em" }}>GrowitBuddy</span>
              <div className="flex gap-2">
                {["Home", "Services", "Work"].map((l) => (
                  <span key={l} style={{ color: data.accentColor, opacity: 0.6, fontSize: 12 }}>{l}</span>
                ))}
              </div>
            </div>
            <div style={{ background: data.accentColor }} className="px-5 py-5">
              <p style={{ color: data.primaryColor, fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" }}>Build Authority. Not Just Presence.</p>
              <p style={{ color: data.primaryColor, opacity: 0.5, fontSize: 13, marginTop: 6 }}>Preview of your brand colors</p>
              <button style={{ background: data.primaryColor, color: data.accentColor, fontSize: 12, fontWeight: 700, padding: "8px 18px", borderRadius: 10, marginTop: 14 }}>
                Book a Strategy Call
              </button>
            </div>
          </div>
        </Card>

        {/* Visual & Interaction */}
        <Card>
          <SectionTitle>Visual & Interaction Effects</SectionTitle>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-[#0B0B0B]/6">
              <div>
                <p className="text-[13px] font-semibold text-[#0B0B0B]">Custom Cursor</p>
                <p className="text-[12px] text-[#0B0B0B]/40">Show the branded dot cursor on desktop</p>
              </div>
              <Toggle checked={data.cursorEnabled} onChange={() => set("cursorEnabled", !data.cursorEnabled)} />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#0B0B0B]/6">
              <div>
                <p className="text-[13px] font-semibold text-[#0B0B0B]">Page Intro Animation</p>
                <p className="text-[12px] text-[#0B0B0B]/40">Show the full-screen intro on first load</p>
              </div>
              <Toggle checked={data.introEnabled} onChange={() => set("introEnabled", !data.introEnabled)} />
            </div>

            <div className="py-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[13px] font-semibold text-[#0B0B0B]">Global Font Scale</p>
                  <p className="text-[12px] text-[#0B0B0B]/40">Scales all text sizes proportionally</p>
                </div>
                <span className="text-[13px] font-bold text-[#0B0B0B] bg-[#0B0B0B]/6 px-2.5 py-1 rounded-lg">
                  {data.fontScale}%
                </span>
              </div>
              <input
                type="range" min={80} max={130} step={5} value={data.fontScale}
                onChange={(e) => set("fontScale", parseInt(e.target.value))}
                className="w-full accent-[#0B0B0B]"
              />
              <div className="flex justify-between text-[11px] text-[#0B0B0B]/30 mt-1">
                <span>80%</span><span>100% (default)</span><span>130%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
