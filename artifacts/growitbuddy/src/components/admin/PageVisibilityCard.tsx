import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Eye, EyeOff, Wrench, Clock, Save } from "lucide-react";
import { Card, SectionTitle, Input, Textarea } from "./AdminField";

export interface PageVisConfig {
  hidden: boolean;
  mode: "maintenance" | "coming_soon";
  headline: string;
  message: string;
}

const DEFAULT_CONFIG: PageVisConfig = {
  hidden: false,
  mode: "coming_soon",
  headline: "",
  message: "",
};

export function PageVisibilityCard({ slug }: { slug: string }) {
  const { getContent, saveContent } = useAdmin();
  const [allData, setAllData] = useState<Record<string, PageVisConfig>>({});
  const [config, setConfig] = useState<PageVisConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getContent("page_visibility").then((d) => {
      const data = (d as Record<string, PageVisConfig> | null) ?? {};
      setAllData(data);
      const existing = data[slug];
      if (existing) setConfig({ ...DEFAULT_CONFIG, ...existing });
    });
  }, [getContent, slug]);

  function set<K extends keyof PageVisConfig>(key: K, val: PageVisConfig[K]) {
    setSaved(false);
    setConfig((p) => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = { ...allData, [slug]: config };
      await saveContent("page_visibility", updated as unknown as Record<string, unknown>);
      setAllData(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-l-4 border-l-[var(--gb-accent)]">
      <div className="flex items-start justify-between mb-4">
        <SectionTitle>Page Visibility</SectionTitle>
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
            config.hidden ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${config.hidden ? "bg-amber-500" : "bg-emerald-500"}`} />
          {config.hidden ? "Hidden" : "Live"}
        </span>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => set("hidden", !config.hidden)}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all text-left ${
            config.hidden ? "border-amber-300 bg-amber-50" : "border-[#0B0B0B]/10 bg-[#F7F7F5]"
          }`}
        >
          {config.hidden
            ? <EyeOff size={16} className="text-amber-600 shrink-0" />
            : <Eye size={16} className="text-emerald-600 shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#0B0B0B]">
              {config.hidden ? "Page is hidden from visitors" : "Page is visible to everyone"}
            </p>
            <p className="text-[11px] text-[#0B0B0B]/45">
              Click to {config.hidden ? "make live" : "hide page"}
            </p>
          </div>
          <div
            className={`ml-auto shrink-0 w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${
              config.hidden ? "bg-amber-400" : "bg-[#0B0B0B]/15"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                config.hidden ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
        </button>

        {config.hidden && (
          <>
            <div>
              <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-2 uppercase tracking-wider">
                Display mode
              </label>
              <div className="flex gap-2">
                {([
                  { key: "maintenance", label: "Maintenance", icon: <Wrench size={13} /> },
                  { key: "coming_soon", label: "Coming Soon", icon: <Clock size={13} /> },
                ] as const).map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => set("mode", key)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] border-2 font-medium transition-all ${
                      config.mode === key
                        ? "border-[#1E293B] bg-[#1E293B] text-white"
                        : "border-[#0B0B0B]/10 text-[#0B0B0B]/60 hover:border-[#0B0B0B]/25"
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Custom headline (optional)"
              placeholder={config.mode === "maintenance" ? "We'll be back soon." : "Something exciting is coming."}
              value={config.headline}
              onChange={(e) => set("headline", e.target.value)}
            />

            <Textarea
              label="Custom message (optional)"
              placeholder={
                config.mode === "maintenance"
                  ? "We're making some improvements. Check back shortly."
                  : "We're working on something great. Be the first to know when we launch."
              }
              value={config.message}
              onChange={(e) => set("message", e.target.value)}
              rows={2}
            />
          </>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className={`text-[12px] font-medium ${saved ? "text-emerald-600" : "text-[#0B0B0B]/30"}`}>
            {saved ? "Visibility saved" : "\u00a0"}
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-[#0B0B0B] text-white text-[13px] font-semibold px-4 py-2 rounded-xl hover:bg-[#0B0B0B]/85 transition-colors disabled:opacity-40"
          >
            <Save size={13} />
            {saving ? "Saving…" : "Save visibility"}
          </button>
        </div>
      </div>
    </Card>
  );
}
