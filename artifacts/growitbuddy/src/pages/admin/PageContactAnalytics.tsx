export interface PageContactLead {
  id: number;
  name: string | null;
  email: string;
  data: Record<string, unknown>;
  status: string;
  createdAt: string;
}

const PAGE_CONTACT_FIELDS = [
  { key: "name", label: "Full name" },
  { key: "email", label: "Work email" },
  { key: "phone", label: "Phone / WhatsApp" },
  { key: "message", label: "Message" },
  { key: "sourceUrl", label: "Source page" },
] as const;

function displayValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value == null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function getPageContactFieldValue(lead: PageContactLead, key: string): string {
  const storedValue = lead.data?.[key];
  if (key === "name") return displayValue(storedValue) || displayValue(lead.name);
  if (key === "email") return displayValue(storedValue) || displayValue(lead.email);
  return displayValue(storedValue);
}

export function getPageContactPath(lead: PageContactLead): string {
  const rawSource = getPageContactFieldValue(lead, "sourceUrl");
  if (!rawSource) return "No page recorded";

  try {
    const url = new URL(rawSource, "https://growitbuddy.com");
    if (url.protocol !== "http:" && url.protocol !== "https:") return "Invalid page URL";
    return url.pathname;
  } catch {
    return "Invalid page URL";
  }
}

function safeSourceHref(value: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, "https://growitbuddy.com");
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function PageContactSubmissionDetails({ lead }: { lead: PageContactLead }) {
  const knownKeys = new Set<string>(PAGE_CONTACT_FIELDS.map((field) => field.key));
  const extraFields = Object.entries(lead.data ?? {}).filter(([key]) => !knownKeys.has(key));

  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#0B0B0B]/35">
        Page Contact form fields
      </p>
      <div className="overflow-hidden rounded-xl border border-[#0B0B0B]/8 divide-y divide-[#0B0B0B]/5">
        {PAGE_CONTACT_FIELDS.map(({ key, label }) => {
          const value = getPageContactFieldValue(lead, key);
          const href = key === "sourceUrl" ? safeSourceHref(value) : null;
          return (
            <div key={key} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:gap-3">
              <span className="w-36 shrink-0 text-[11px] font-semibold text-[#0B0B0B]/45">{label}</span>
              <div className="min-w-0 flex-1">
                {value
                  ? href
                    ? <a href={href} target="_blank" rel="noopener noreferrer" className="break-all text-[12px] text-[#1E293B] underline underline-offset-2">{value}</a>
                    : <span className="whitespace-pre-wrap break-words text-[12px] text-[#0B0B0B]">{value}</span>
                  : <span className="text-[12px] italic text-[#0B0B0B]/35">Not provided</span>}
              </div>
              <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wide ${value ? "text-emerald-700" : "text-[#0B0B0B]/30"}`}>
                {value ? "Provided" : "Missing"}
              </span>
            </div>
          );
        })}
        {extraFields.map(([key, value]) => (
          <div key={key} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:gap-3">
            <span className="w-36 shrink-0 break-words text-[11px] font-semibold text-[#0B0B0B]/45">{key}</span>
            <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-[12px] text-[#0B0B0B]">
              {displayValue(value) || <span className="italic text-[#0B0B0B]/35">Not provided</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageContactInsights({
  leads,
  allLeads,
  rangeLabel,
}: {
  leads: PageContactLead[];
  allLeads: PageContactLead[];
  rangeLabel: string;
}) {
  const now = Date.now();
  const last30Days = allLeads.filter((lead) => {
    const age = now - new Date(lead.createdAt).getTime();
    return age >= 0 && age <= 30 * 86400000;
  }).length;
  const uniquePages = new Set(
    leads.map(getPageContactPath).filter((path) => path !== "No page recorded" && path !== "Invalid page URL"),
  );
  const fieldCounts = PAGE_CONTACT_FIELDS.map((field) => ({
    ...field,
    provided: leads.filter((lead) => Boolean(getPageContactFieldValue(lead, field.key))).length,
  }));
  const pageCounts = new Map<string, number>();
  for (const lead of leads) {
    const page = getPageContactPath(lead);
    pageCounts.set(page, (pageCounts.get(page) ?? 0) + 1);
  }
  const topPages = Array.from(pageCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const metrics = [
    { label: "Submissions", value: leads.length, note: rangeLabel },
    { label: "New leads", value: leads.filter((lead) => lead.status === "new").length, note: "Awaiting review" },
    { label: "Last 30 days", value: last30Days, note: "Based on submission date" },
    { label: "Pages represented", value: uniquePages.size, note: "Distinct source pages" },
  ];

  return (
    <section aria-label="Page Contact statistics" className="mb-4 space-y-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-[#0B0B0B]/8 bg-white p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#0B0B0B]/40">{metric.label}</p>
            <p className="mt-1 text-[22px] font-black leading-none tracking-tight text-[#0B0B0B]">{metric.value}</p>
            <p className="mt-1.5 text-[10px] text-[#0B0B0B]/35">{metric.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-[#0B0B0B]/8 bg-white p-4">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h3 className="text-[12px] font-bold text-[#0B0B0B]">Field completion</h3>
            <span className="text-[10px] text-[#0B0B0B]/40">{rangeLabel}</span>
          </div>
          {fieldCounts.map((field) => {
            const missing = leads.length - field.provided;
            const percent = leads.length ? Math.round((field.provided / leads.length) * 100) : 0;
            return (
              <div key={field.key} className="mb-3 last:mb-0">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-medium text-[#0B0B0B]/70">{field.label}</span>
                  <span className="text-[10px] tabular-nums text-[#0B0B0B]/45">
                    {field.provided} provided · {missing} missing
                  </span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-[#0B0B0B]/6"
                  role="img"
                  aria-label={`${field.label}: ${field.provided} provided, ${missing} missing`}
                >
                  <div className="h-full rounded-full bg-[#8B3A1A]" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
          {leads.length === 0 && <p className="mt-3 text-[11px] text-[#0B0B0B]/40">No submissions in this date range.</p>}
        </div>

        <div className="rounded-xl border border-[#0B0B0B]/8 bg-white p-4">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h3 className="text-[12px] font-bold text-[#0B0B0B]">Submissions by page</h3>
            <span className="text-[10px] text-[#0B0B0B]/40">{rangeLabel}</span>
          </div>
          {topPages.length > 0 ? (
            <div className="divide-y divide-[#0B0B0B]/5">
              {topPages.map(([page, count]) => (
                <div key={page} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <span className="min-w-0 truncate text-[11px] text-[#0B0B0B]/70" title={page}>{page}</span>
                  <span className="shrink-0 rounded-full bg-[#0B0B0B]/5 px-2 py-0.5 text-[10px] font-bold tabular-nums text-[#0B0B0B]/65">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-[11px] text-[#0B0B0B]/40">Page submissions will appear here automatically.</p>
          )}
        </div>
      </div>
    </section>
  );
}
