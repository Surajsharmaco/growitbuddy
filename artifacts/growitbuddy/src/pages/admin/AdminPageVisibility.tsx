import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card } from "@/components/admin/AdminField";
import { Eye, EyeOff, Wrench, Clock, ExternalLink, Save } from "lucide-react";

interface PageVisConfig {
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

const PAGES: { slug: string; label: string; url: string }[] = [
  { slug: "home",                  label: "Home",                    url: "/"                       },
  { slug: "services",              label: "Services",                url: "/services"               },
  { slug: "work",                  label: "Work / Portfolio",        url: "/work"                   },
  { slug: "framework",             label: "Framework",               url: "/framework"              },
  { slug: "insights",              label: "Blog / Insights",         url: "/insights"               },
  { slug: "about",                 label: "About",                   url: "/about"                  },
  { slug: "contact",               label: "Contact",                 url: "/contact"                },
  { slug: "resources",             label: "Resources",               url: "/resources"              },
  { slug: "creators",              label: "Creator Onboarding",      url: "/creators"               },
  { slug: "freelancers",           label: "Freelancers",             url: "/freelancers"            },
  { slug: "full-time",             label: "Full-Time Careers",       url: "/full-time"              },
  { slug: "internship",            label: "Internship",              url: "/internship"             },
  { slug: "join",                  label: "Join Network",            url: "/join"                   },
  { slug: "join-page-owner",       label: "Page Owner Apply",        url: "/join/page-owner"        },
  { slug: "influencers",           label: "Influencer Directory",    url: "/influencers"            },
  { slug: "distribution",          label: "Distribution Network",    url: "/distribution"           },
  { slug: "authority-audit",       label: "Authority Audit",         url: "/authority-audit"        },
  { slug: "verify",                label: "Certificate Verify",      url: "/verify"                 },
  { slug: "creator-school",        label: "Editors Pool",            url: "/editors-pool"           },
  { slug: "designers-pool",        label: "Designers Pool",          url: "/designers-pool"         },
  { slug: "thumbnail-designers",   label: "Thumbnail Designers",     url: "/thumbnail-designers"    },
  { slug: "writers-pool",          label: "Writers Pool",            url: "/writers-pool"           },
  { slug: "social-media-managers", label: "Social Media Managers",   url: "/social-media-managers"  },
  { slug: "motion-designers",      label: "Motion Designers",        url: "/motion-designers"       },
  { slug: "ai-creators",           label: "AI Creators",             url: "/ai-creators"            },
  { slug: "ugc-creators",          label: "UGC Creators",            url: "/ugc-creators"           },
  { slug: "meme-designers",        label: "Meme Designers",          url: "/meme-designers"         },
];

export default function AdminPageVisibility() {
  const { getContent, saveContent } = useAdmin();
  const [data, setData] = useState<Record<string, PageVisConfig>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  useEffect(() => {
    getContent("page_visibility").then((d) => {
      if (d) setData(d as Record<string, PageVisConfig>);
    });
  }, [getContent]);

  function getConfig(slug: string): PageVisConfig {
    return { ...DEFAULT_CONFIG, ...(data[slug] ?? {}) };
  }

  function updateSlug(slug: string, patch: Partial<PageVisConfig>) {
    setData((prev) => ({ ...prev, [slug]: { ...getConfig(slug), ...patch } }));
  }

  async function saveSlug(slug: string) {
    setSaving(slug);
    setSavedSlug(null);
    try {
      const updated = { ...data, [slug]: getConfig(slug) };
      await saveContent("page_visibility", updated as unknown as Record<string, unknown>);
      setData(updated);
      setSavedSlug(slug);
      setTimeout(() => setSavedSlug((s) => (s === slug ? null : s)), 2500);
    } finally {
      setSaving(null);
    }
  }

  const hiddenCount = PAGES.filter((p) => getConfig(p.slug).hidden).length;

  return (
    <div>
      <PageHeader
        title="Page Visibility"
        description="Control which pages are publicly visible. Hidden pages show a maintenance or coming-soon screen to visitors."
      />

      {hiddenCount > 0 && (
        <div className="mb-5 flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <EyeOff size={15} className="text-amber-600 shrink-0" />
          <p className="text-[13px] text-amber-800 font-medium">
            {hiddenCount} page{hiddenCount !== 1 ? "s are" : " is"} currently hidden from visitors.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {PAGES.map(({ slug, label, url }) => {
          const config = getConfig(slug);
          const isSaving = saving === slug;
          const isSaved = savedSlug === slug;

          return (
            <Card key={slug} className={config.hidden ? "border-l-4 border-l-amber-400" : ""}>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[14px] font-semibold text-[#0A0A0A]">{label}</span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0B0B0B]/30 hover:text-[#1E293B] transition-colors"
                    >
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  <span className="text-[12px] text-[#0B0B0B]/40">{url}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {config.hidden && (
                    <div className="flex gap-1.5">
                      {([
                        { key: "maintenance" as const, icon: <Wrench size={11} />, label: "Maintenance" },
                        { key: "coming_soon"  as const, icon: <Clock   size={11} />, label: "Coming Soon" },
                      ]).map(({ key, icon, label: ml }) => (
                        <button
                          key={key}
                          onClick={() => updateSlug(slug, { mode: key })}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                            config.mode === key
                              ? "border-[#1E293B] bg-[#1E293B] text-white"
                              : "border-[#0B0B0B]/10 text-[#0B0B0B]/50 hover:border-[#0B0B0B]/25"
                          }`}
                        >
                          {icon}
                          {ml}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => updateSlug(slug, { hidden: !config.hidden })}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold border-2 transition-all ${
                      config.hidden
                        ? "border-amber-300 bg-amber-50 text-amber-700"
                        : "border-[#0B0B0B]/10 text-[#0B0B0B]/60 hover:border-[#0B0B0B]/25"
                    }`}
                  >
                    {config.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                    {config.hidden ? "Hidden" : "Live"}
                  </button>

                  <button
                    onClick={() => saveSlug(slug)}
                    disabled={isSaving}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-40 ${
                      isSaved
                        ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200"
                        : "bg-[#0B0B0B] text-white hover:bg-[#0B0B0B]/85"
                    }`}
                  >
                    <Save size={13} />
                    {isSaved ? "Saved" : isSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>

              {config.hidden && (
                <div className="mt-4 pt-4 border-t border-[#0B0B0B]/6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0B0B0B]/50 mb-1.5 uppercase tracking-wider">
                      Custom headline (optional)
                    </label>
                    <input
                      type="text"
                      value={config.headline}
                      onChange={(e) => updateSlug(slug, { headline: e.target.value })}
                      placeholder={
                        config.mode === "maintenance"
                          ? "We'll be back soon."
                          : "Something exciting is coming."
                      }
                      className="w-full border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[14px] text-[#0B0B0B] placeholder-[#0B0B0B]/30 outline-none focus:border-[#0B0B0B]/40 bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0B0B0B]/50 mb-1.5 uppercase tracking-wider">
                      Custom message (optional)
                    </label>
                    <input
                      type="text"
                      value={config.message}
                      onChange={(e) => updateSlug(slug, { message: e.target.value })}
                      placeholder={
                        config.mode === "maintenance"
                          ? "We're making improvements. Check back shortly."
                          : "We're working on something great."
                      }
                      className="w-full border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[14px] text-[#0B0B0B] placeholder-[#0B0B0B]/30 outline-none focus:border-[#0B0B0B]/40 bg-white transition-colors"
                    />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
