import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from "lucide-react";

interface Service {
  id: string;
  title: string;
  subtitle: string;
  headline: string;
  description: string;
  features: string[];
  badge: string;
}

const DEFAULT_SERVICES: Service[] = [
  {
    id: "1",
    title: "Personal Branding Strategy",
    subtitle: "Positioning & Narrative",
    badge: "",
    headline: "Define exactly how you are positioned before you create a single piece of content.",
    description: "We design your personal branding strategy, narrative, and content direction so every piece you put out reinforces exactly what you want to be known for.",
    features: ["Positioning & Narrative Design", "Target Audience Research", "90-Day Content Roadmap", "Competitive Landscape Analysis", "Content Themes & Pillars"],
  },
  {
    id: "2",
    title: "Content Strategy Services",
    subtitle: "Done-For-You Production",
    badge: "Most Popular",
    headline: "A content strategy that produces great content consistently.",
    description: "We build a repeatable content engine around your expertise - ghostwriting, visual assets, newsletters, and platform-native formats that produce results week after week.",
    features: ["Ghostwriting", "Visual Asset Creation", "Newsletter Systems", "Platform-Native Formatting", "Content Calendar"],
  },
  {
    id: "3",
    title: "Video Marketing",
    subtitle: "Short & Long-Form",
    badge: "",
    headline: "Video marketing that captures attention and keeps it.",
    description: "High-retention editing for short and long-form video - structured to perform on the algorithm and built to make your expertise look as sharp as it actually is.",
    features: ["Short-Form Clips", "Long-Form Editing", "Thumbnail Design", "Retention Optimization", "Caption Systems"],
  },
  {
    id: "4",
    title: "Content Distribution Strategy",
    subtitle: "Reach & Amplification",
    badge: "",
    headline: "A content distribution strategy that reaches the right people every time.",
    description: "Make sure your content doesn't just get posted - it gets seen by the people who actually matter. Structured distribution across the platforms and channels where your audience lives.",
    features: ["Platform Growth Strategy", "Cross-Platform Reach", "Engagement Optimization", "Community Building", "Paid Amplification"],
  },
  {
    id: "5",
    title: "Personal Brand Growth",
    subtitle: "Full-Stack Authority",
    badge: "",
    headline: "Become the most recognized name in your category.",
    description: "Profile optimization, media placement, network expansion, and speaking opportunities - a full-stack personal branding approach to owning your space in the market.",
    features: ["Profile Optimization", "Network Expansion", "Monetization Strategy", "PR & Media Placements", "Speaking Outreach"],
  },
];

function ServiceRow({
  service,
  index,
  onChange,
  onDelete,
}: {
  service: Service;
  index: number;
  onChange: (i: number, val: Service) => void;
  onDelete: (i: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<Service>) => onChange(index, { ...service, ...patch });

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3.5">
        <GripVertical size={14} className="text-[#0B0B0B]/20 shrink-0 cursor-grab" />
        <button
          onClick={() => setOpen((p) => !p)}
          className="flex-1 flex items-center gap-3 text-left"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-[#0B0B0B] truncate">{service.title || "Unnamed Service"}</p>
              {service.badge && (
                <span className="text-[10px] font-bold text-white bg-[#0B0B0B] px-2 py-0.5 rounded-full shrink-0">{service.badge}</span>
              )}
            </div>
            <p className="text-[11px] text-[#0B0B0B]/40 truncate">{service.subtitle}</p>
          </div>
          {open ? <ChevronUp size={14} className="text-[#0B0B0B]/40 shrink-0" /> : <ChevronDown size={14} className="text-[#0B0B0B]/40 shrink-0" />}
        </button>
        <button
          onClick={() => onDelete(index)}
          className="p-1.5 rounded hover:bg-red-50 hover:text-red-500 text-[#0B0B0B]/30 transition-colors shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {open && (
        <div className="border-t border-[#0B0B0B]/8 px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Title" value={service.title} onChange={(e) => set({ title: e.target.value })} placeholder="Personal Branding Strategy" />
            <Input label="Admin Label" value={service.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder="Short label for admin nav" />
            <Input label="Badge (optional)" value={service.badge} onChange={(e) => set({ badge: e.target.value })} placeholder="Most Popular, Free, New" />
          </div>
          <Textarea
            label="Headline (shown on public page as the section hook)"
            value={service.headline || ""}
            onChange={(e) => set({ headline: e.target.value })}
            rows={2}
            hint="Long sentence shown as the main hook on the public Services page"
          />
          <Textarea
            label="Description"
            value={service.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={3}
          />
          <Textarea
            label="Features (one per line)"
            value={service.features.join("\n")}
            onChange={(e) => set({ features: e.target.value.split("\n").filter(Boolean) })}
            rows={5}
            hint="Each line becomes a bullet point feature"
          />
        </div>
      )}
    </Card>
  );
}

interface Stat { num: string; label: string; }

const DEFAULT_STATS: Stat[] = [
  { num: "700M+", label: "Views Generated Across Content Networks" },
  { num: "200+",  label: "Founders & Brands Served" },
  { num: "90K+",  label: "Content Assets Created Across High-Volume Pages" },
];

export default function AdminServices() {
  const { getContent, saveContent } = useAdmin();
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [headline, setHeadline] = useState("What we build for you");
  const [subtext, setSubtext] = useState("Four ways we help founders, creators, and brands build the authority that converts.");
  const [heroHeadline, setHeroHeadline] = useState("The content systems behind authority and inbound demand.");
  const [heroSubtext, setHeroSubtext] = useState("We don't just create content. We build the content marketing infrastructure that turns your expertise into recognition, trust, and consistent inbound opportunities.");
  const [heroCTA, setHeroCTA] = useState("Book a strategy call");
  const [stats, setStats] = useState<Stat[]>(DEFAULT_STATS);

  useEffect(() => {
    getContent("services").then((d) => {
      if (!d) return;
      if (d.services) setServices(d.services as Service[]);
      if (d.headline) setHeadline(d.headline as string);
      if (d.subtext) setSubtext(d.subtext as string);
      if (d.heroHeadline) setHeroHeadline(d.heroHeadline as string);
      if (d.heroSubtext) setHeroSubtext(d.heroSubtext as string);
      if (d.heroCTA) setHeroCTA(d.heroCTA as string);
      if (d.stats) setStats(d.stats as Stat[]);
    });
  }, [getContent]);

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent("services", { headline, subtext, services, heroHeadline, heroSubtext, heroCTA, stats });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function mark() { setSaved(false); }

  function handleChange(i: number, val: Service) {
    setSaved(false);
    setServices((p) => p.map((x, idx) => (idx === i ? val : x)));
  }

  function handleDelete(i: number) {
    if (!confirm("Remove this service?")) return;
    setSaved(false);
    setServices((p) => p.filter((_, idx) => idx !== i));
  }

  function addNew() {
    setSaved(false);
    setServices((p) => [...p, { id: Date.now().toString(), title: "", subtitle: "", headline: "", badge: "", description: "", features: [] }]);
  }

  return (
    <div>
      <PageHeader title="Services" description="Edit every section of the Services page." />

      <Card className="mb-5">
        <SectionTitle>Hero Section</SectionTitle>
        <div className="space-y-3">
          <Textarea label="Headline" value={heroHeadline} onChange={(e) => { setHeroHeadline(e.target.value); mark(); }} rows={2} />
          <Textarea label="Subtext" value={heroSubtext} onChange={(e) => { setHeroSubtext(e.target.value); mark(); }} rows={3} />
          <Input label="CTA Button Text" value={heroCTA} onChange={(e) => { setHeroCTA(e.target.value); mark(); }} />
        </div>
      </Card>

      <Card className="mb-5">
        <SectionTitle>Stats Strip (dark bar below hero)</SectionTitle>
        <div className="space-y-2">
          {stats.map((stat, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input value={stat.num} onChange={(e) => { const s = [...stats]; s[i] = { ...stat, num: e.target.value }; setStats(s); mark(); }} placeholder="700M+" />
              <Input value={stat.label} onChange={(e) => { const s = [...stats]; s[i] = { ...stat, label: e.target.value }; setStats(s); mark(); }} placeholder="Views Generated" />
              <button onClick={() => { setStats(stats.filter((_, si) => si !== i)); mark(); }} className="p-1.5 text-[#0B0B0B]/25 hover:text-red-500 shrink-0"><Trash2 size={13} /></button>
            </div>
          ))}
          <button onClick={() => { setStats([...stats, { num: "", label: "" }]); mark(); }} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0B0B0B]/50 hover:text-[#0B0B0B] transition-colors">
            <Plus size={13} /> Add Stat
          </button>
        </div>
      </Card>

      <Card className="mb-5">
        <SectionTitle>Services Section Header</SectionTitle>
        <div className="space-y-3">
          <Input label="Headline" value={headline} onChange={(e) => { setHeadline(e.target.value); mark(); }} />
          <Textarea label="Subtext" value={subtext} onChange={(e) => { setSubtext(e.target.value); mark(); }} rows={2} />
        </div>
      </Card>

      <div className="flex justify-end mb-4">
        <button
          onClick={addNew}
          className="flex items-center gap-2 bg-[#0B0B0B] text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0B0B0B]/85 transition-colors"
        >
          <Plus size={15} /> Add Service
        </button>
      </div>

      <div className="space-y-3">
        {services.map((s, i) => (
          <ServiceRow key={s.id + i} service={s} index={i} onChange={handleChange} onDelete={handleDelete} />
        ))}
      </div>

      <PageVisibilityCard slug="services" />
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
