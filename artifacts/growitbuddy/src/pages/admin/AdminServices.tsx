import { useEffect, useState, useCallback } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, ArrowDown, ArrowUp } from "lucide-react";
import { BulkSelectionBar, CollectionSelectionCheckbox } from "@/components/admin/BulkSelectionBar";

import {
  SERVICES_DEFAULTS,
  isValidServiceHref,
  normalizeOfflineService,
  type OfflineServiceItem,
  type ServiceItem as Service,
  type ServicesStat as Stat,
} from "@/lib/servicesDefaults";


function ServiceRow({
  service,
  index,
  onChange,
  onDelete,
  selected,
  onSelect,
}: {
  service: Service;
  index: number;
  onChange: (i: number, val: Service) => void;
  onDelete: (i: number) => void;
  selected: boolean;
  onSelect: (checked: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<Service>) => onChange(index, { ...service, ...patch });

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3.5">
        <CollectionSelectionCheckbox checked={selected} label={`Select service ${service.title || index + 1}`} onChange={onSelect} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="CTA Button Label" value={service.cta || ""} onChange={(e) => set({ cta: e.target.value })} placeholder="Build Authority" hint="Button shown on the service card" />
            <Input label="CTA Link" value={service.ctaHref || "/contact"} onChange={(e) => set({ ctaHref: e.target.value })} placeholder="/contact#form or https://example.com" hint="Use a site path (such as /contact) or a full URL." />
            <Input label="Note (optional)" value={service.note || ""} onChange={(e) => set({ note: e.target.value })} placeholder="Starting at $5k/mo" hint="Small note shown under the CTA" />
          </div>
        </div>
      )}
    </Card>
  );
}

export default function AdminServices() {
  const { getContentResult, saveContent } = useAdmin();
  const [services, setServices] = useState<Service[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [headline, setHeadline] = useState("What we build for you");
  const [subtext, setSubtext] = useState("Four ways we help founders, creators, and brands build the authority that converts.");
  const [heroHeadline, setHeroHeadline] = useState("The content systems behind authority and inbound demand.");
  const [heroSubtext, setHeroSubtext] = useState("We don't just create content. We build the content marketing infrastructure that turns your expertise into recognition, trust, and consistent inbound opportunities.");
  const [heroCTA, setHeroCTA] = useState("Book a strategy call");
  const [stats, setStats] = useState<Stat[]>(SERVICES_DEFAULTS.stats);
  const [offlineService, setOfflineService] = useState<OfflineServiceItem>(
    normalizeOfflineService(SERVICES_DEFAULTS.offlineService),
  );
  const [saveError, setSaveError] = useState("");
  const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set());
  const [selectedStats, setSelectedStats] = useState<Set<number>>(new Set());

  const load = useCallback(() => {
    setLoadState("loading");
    getContentResult("services").then((res) => {
      // Fail closed: on a load FAILURE never mount the editor, so a Save can
      // never overwrite real data with demo defaults (deleted-ghost re-intro).
      if (!res.ok) { setLoadState("error"); return; }
      const d = res.data;
      setServices(Array.isArray(d?.services) ? (d!.services as Service[]) : []);
      if (d?.headline) setHeadline(d.headline as string);
      if (d?.subtext) setSubtext(d.subtext as string);
      if (d?.heroHeadline) setHeroHeadline(d.heroHeadline as string);
      if (d?.heroSubtext) setHeroSubtext(d.heroSubtext as string);
      if (d?.heroCTA) setHeroCTA(d.heroCTA as string);
      if (Array.isArray(d?.stats)) setStats(d!.stats as Stat[]);
      setOfflineService(normalizeOfflineService(d?.offlineService));
      setLoadState("ready");
    });
  }, [getContentResult]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!isValidServiceHref(offlineService.ctaHref || "/contact")) {
      setSaveError("Enter a valid path or URL for the offline advertising CTA link.");
      return;
    }

    const normalizedOfflineService = {
      ...offlineService,
      ctaHref: offlineService.ctaHref.trim() || "/contact",
      tags: offlineService.tags.map((tag) => tag.trim()).filter(Boolean),
    };
    setOfflineService(normalizedOfflineService);
    setSaveError("");
    setSaving(true);
    try {
      await saveContent("services", {
        headline,
        subtext,
        services,
        heroHeadline,
        heroSubtext,
        heroCTA,
        stats,
        offlineService: normalizedOfflineService,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function mark() {
    setSaved(false);
    setSaveError("");
  }

  function handleChange(i: number, val: Service) {
    mark();
    setServices((p) => p.map((x, idx) => (idx === i ? val : x)));
  }

  function updateOfflineService(patch: Partial<OfflineServiceItem>) {
    mark();
    setOfflineService((current) => ({ ...current, ...patch }));
  }

  function updateOfflineTag(index: number, value: string) {
    const tags = [...offlineService.tags];
    tags[index] = value;
    updateOfflineService({ tags });
  }

  function moveOfflineTag(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= offlineService.tags.length) return;
    const tags = [...offlineService.tags];
    [tags[index], tags[target]] = [tags[target], tags[index]];
    updateOfflineService({ tags });
  }

  function handleDelete(i: number) {
    if (!confirm("Remove this service?")) return;
    setSaved(false);
    setServices((p) => p.filter((_, idx) => idx !== i));
    setSelectedServices(new Set());
  }
  function removeSelectedServices() {
    if (!selectedServices.size || !confirm(`Remove ${selectedServices.size} selected services?`)) return;
    setServices((p) => p.filter((_, i) => !selectedServices.has(i)));
    setSelectedServices(new Set());
    mark();
  }
  function removeSelectedStats() {
    if (!selectedStats.size || !confirm(`Remove ${selectedStats.size} selected stats?`)) return;
    setStats((p) => p.filter((_, i) => !selectedStats.has(i)));
    setSelectedStats(new Set());
    mark();
  }

  function addNew() {
    setSaved(false);
    setServices((p) => [...p, { id: Date.now().toString(), title: "", subtitle: "", headline: "", badge: "", description: "", features: [], cta: "", ctaHref: "/contact", note: "" }]);
  }

  if (loadState !== "ready") {
    return (
      <div>
        <PageHeader title="Services" description={loadState === "error" ? "Couldn't load saved content" : "Loading…"} />
        {loadState === "error" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-[13px] text-red-600 max-w-md">Couldn't load your saved services. To protect your live data, editing is disabled until this loads successfully.</p>
            <button onClick={load} className="text-[12px] font-semibold bg-[#0B0B0B] text-white px-4 py-2 rounded-xl hover:bg-[#0B0B0B]/85 transition-colors">Retry</button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-24 text-[13px] text-[#0B0B0B]/40">Loading content…</div>
        )}
      </div>
    );
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
          <BulkSelectionBar selectedCount={selectedStats.size} visibleCount={stats.length} onSelectAllVisible={() => setSelectedStats(new Set(stats.map((_, i) => i)))} onUnselectAll={() => setSelectedStats(new Set())} onRemoveSelected={removeSelectedStats} itemLabel="stats" />
          {stats.map((stat, i) => (
            <div key={i} className="flex gap-2 items-center">
              <CollectionSelectionCheckbox checked={selectedStats.has(i)} label={`Select stat ${i + 1}`} onChange={(checked) => setSelectedStats((s) => { const n = new Set(s); checked ? n.add(i) : n.delete(i); return n; })} />
              <Input value={stat.num} onChange={(e) => { const s = [...stats]; s[i] = { ...stat, num: e.target.value }; setStats(s); mark(); }} placeholder="700M+" />
              <Input value={stat.label} onChange={(e) => { const s = [...stats]; s[i] = { ...stat, label: e.target.value }; setStats(s); mark(); }} placeholder="Views Generated" />
              <button onClick={() => { setStats(stats.filter((_, si) => si !== i)); setSelectedStats(new Set()); mark(); }} className="p-1.5 text-[#0B0B0B]/25 hover:text-red-500 shrink-0"><Trash2 size={13} /></button>
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
        <BulkSelectionBar selectedCount={selectedServices.size} visibleCount={services.length} onSelectAllVisible={() => setSelectedServices(new Set(services.map((_, i) => i)))} onUnselectAll={() => setSelectedServices(new Set())} onRemoveSelected={removeSelectedServices} itemLabel="services" />
        {services.map((s, i) => (
          <ServiceRow key={s.id + i} service={s} index={i} onChange={handleChange} onDelete={handleDelete} selected={selectedServices.has(i)} onSelect={(checked) => setSelectedServices((set) => { const n = new Set(set); checked ? n.add(i) : n.delete(i); return n; })} />
        ))}
      </div>

      <Card className="mt-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <SectionTitle>Seventh Service Card</SectionTitle>
          <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#0B0B0B]/65">
            <input
              type="checkbox"
              checked={offlineService.enabled}
              onChange={(e) => updateOfflineService({ enabled: e.target.checked })}
              className="w-4 h-4 accent-[#0B0B0B]"
            />
            Show on the public Services page
          </label>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Category Number" value={offlineService.categoryNumber} onChange={(e) => updateOfflineService({ categoryNumber: e.target.value })} placeholder="07" />
            <Input label="Category Label" value={offlineService.categoryLabel} onChange={(e) => updateOfflineService({ categoryLabel: e.target.value })} placeholder="LOCAL REACH & BRAND ACTIVATION" />
          </div>
          <Input label="Heading" value={offlineService.title} onChange={(e) => updateOfflineService({ title: e.target.value })} placeholder="Offline Advertising & Brand Activation" />
          <Textarea label="Description" value={offlineService.description} onChange={(e) => updateOfflineService({ description: e.target.value })} rows={3} />
          <p className="text-[11px] text-[#0B0B0B]/45">Card icon: Megaphone. This editor does not currently include an icon picker.</p>

          <div>
            <p className="text-[12px] font-semibold text-[#0B0B0B]/60 uppercase tracking-wider mb-2">Service Tags</p>
            <div className="space-y-2">
              {offlineService.tags.map((tag, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={tag} onChange={(e) => updateOfflineTag(i, e.target.value)} aria-label={`Service tag ${i + 1}`} placeholder="Service tag" />
                  <button
                    type="button"
                    aria-label={`Move service tag ${i + 1} up`}
                    title="Move up"
                    disabled={i === 0}
                    onClick={() => moveOfflineTag(i, -1)}
                    className="p-2 rounded-lg text-[#0B0B0B]/45 hover:bg-[#0B0B0B]/5 disabled:opacity-25"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move service tag ${i + 1} down`}
                    title="Move down"
                    disabled={i === offlineService.tags.length - 1}
                    onClick={() => moveOfflineTag(i, 1)}
                    className="p-2 rounded-lg text-[#0B0B0B]/45 hover:bg-[#0B0B0B]/5 disabled:opacity-25"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove service tag ${i + 1}`}
                    title="Remove tag"
                    onClick={() => updateOfflineService({ tags: offlineService.tags.filter((_, index) => index !== i) })}
                    className="p-2 rounded-lg text-[#0B0B0B]/35 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => updateOfflineService({ tags: [...offlineService.tags, ""] })}
              className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-[#0B0B0B]/50 hover:text-[#0B0B0B]"
            >
              <Plus size={13} /> Add Tag
            </button>
            <p className="mt-1 text-[11px] text-[#0B0B0B]/40">Tags are informational, non-clickable labels. Use the arrows to change their order.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="CTA Button Text" value={offlineService.cta} onChange={(e) => updateOfflineService({ cta: e.target.value })} placeholder="Explore Services" />
            <Input
              label="CTA Link"
              value={offlineService.ctaHref || "/contact"}
              onChange={(e) => updateOfflineService({ ctaHref: e.target.value })}
              placeholder="/contact or https://example.com"
              hint={isValidServiceHref(offlineService.ctaHref || "/contact")
                ? "Use an absolute site path or a valid http(s), mailto, or tel URL."
                : "Invalid link. Use /path, #anchor, or a valid http(s), mailto, or tel URL."}
              aria-invalid={!isValidServiceHref(offlineService.ctaHref || "/contact")}
            />
          </div>
        </div>
      </Card>
      {saveError && <p role="alert" className="mt-4 text-[12px] font-medium text-red-600">{saveError}</p>}
      <PageVisibilityCard slug="services" />
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  );
}
