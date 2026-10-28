import { useEffect, useState } from "react";
import { ChevronDown, Link2, Save } from "lucide-react";
import { classifyArticleLink } from "@/lib/blogLinks";

export type CmsInternalLinkSurface = "overview" | "body";

export type CmsInternalLink = {
  id: string;
  surface: CmsInternalLinkSurface;
  anchorIndex: number;
  label: string;
  href: string;
};

export function collectCmsInternalLinks(bodyHtml: string, overviewHtml: string): CmsInternalLink[] {
  if (typeof DOMParser === "undefined") return [];
  const links: CmsInternalLink[] = [];

  for (const [surface, html] of [["overview", overviewHtml], ["body", bodyHtml]] as const) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    Array.from(doc.querySelectorAll("a[href]")).forEach((anchor, anchorIndex) => {
      const href = anchor.getAttribute("href") ?? "";
      if (classifyArticleLink(href)?.kind !== "internal") return;
      const label = anchor.textContent?.trim() || (anchor.querySelector("img") ? "Image link" : "Untitled link");
      links.push({ id: `${surface}:${anchorIndex}`, surface, anchorIndex, label, href });
    });
  }

  return links;
}

export function replaceCmsInternalLinkHref(html: string, anchorIndex: number, href: string): string | null {
  if (typeof DOMParser === "undefined") return null;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const anchor = doc.querySelectorAll("a[href]")[anchorIndex];
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  anchor.setAttribute("href", href);
  return doc.body.innerHTML;
}

export function isCmsInternalHref(href: string): boolean {
  return classifyArticleLink(href)?.kind === "internal";
}

export function InternalLinkManager({
  links,
  pageMode,
  onSave,
}: {
  links: CmsInternalLink[];
  pageMode: boolean;
  onSave: (link: CmsInternalLink, href: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sourceSignature = links.map(({ id, href, label }) => `${id}:${href}:${label}`).join("|");

  useEffect(() => {
    setDrafts({});
    setErrors({});
  }, [sourceSignature]);

  function saveLink(link: CmsInternalLink) {
    const href = (drafts[link.id] ?? link.href).trim();
    if (!isCmsInternalHref(href)) {
      setErrors((current) => ({ ...current, [link.id]: "Enter an internal path or a GrowitBuddy URL." }));
      return;
    }
    onSave(link, href);
    setErrors((current) => {
      const next = { ...current };
      delete next[link.id];
      return next;
    });
  }

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-[#0B0B0B]/10 bg-white shadow-sm" data-testid="internal-link-manager">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5"
        data-testid="internal-link-manager-toggle"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <Link2 size={16} className="shrink-0 text-[#0B0B0B]/65" />
          <span className="text-[13px] font-bold text-[#0B0B0B]">Internal links</span>
          <span className="rounded-full bg-[#0B0B0B]/[0.06] px-2 py-0.5 text-[11px] font-semibold text-[#0B0B0B]/65">
            {links.length}
          </span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-[#0B0B0B]/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-[#0B0B0B]/[0.07] px-4 py-4 sm:px-5">
          <p className="mb-4 text-[11px] leading-relaxed text-[#0B0B0B]/55">
            {pageMode ? "Links in this page’s overview and content." : "Links in this post’s overview and content."}
            {" "}Edit a destination here, then save the draft or publish to apply it.
          </p>

          {links.length === 0 ? (
            <div className="rounded-xl bg-[#0B0B0B]/[0.03] px-4 py-6 text-center text-[12px] text-[#0B0B0B]/50" data-testid="internal-link-manager-empty">
              No internal links in this {pageMode ? "page" : "post"} yet.
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => {
                const value = drafts[link.id] ?? link.href;
                const changed = value.trim() !== link.href;
                return (
                  <div key={link.id} className="grid gap-2 rounded-xl border border-[#0B0B0B]/[0.08] p-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,1.3fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="max-w-full truncate text-[12px] font-semibold text-[#0B0B0B]" title={link.label}>{link.label}</span>
                      </div>
                      <span className="mt-1 inline-block rounded bg-[#0B0B0B]/[0.05] px-1.5 py-0.5 text-[10px] font-medium text-[#0B0B0B]/55">
                        {link.surface === "overview" ? "Overview" : "Main content"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <label htmlFor={`internal-link-${link.id}`} className="sr-only">Destination for {link.label}</label>
                      <input
                        id={`internal-link-${link.id}`}
                        type="text"
                        value={value}
                        onChange={(event) => {
                          setDrafts((current) => ({ ...current, [link.id]: event.target.value }));
                          setErrors((current) => {
                            if (!(link.id in current)) return current;
                            const next = { ...current };
                            delete next[link.id];
                            return next;
                          });
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            saveLink(link);
                          }
                        }}
                        className="min-h-10 w-full rounded-lg border border-[#0B0B0B]/15 px-3 py-2 text-[12px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/55"
                        aria-invalid={Boolean(errors[link.id])}
                        data-testid={`internal-link-url-${link.id}`}
                      />
                      {errors[link.id] && <p role="alert" className="mt-1 text-[10px] text-red-600">{errors[link.id]}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => saveLink(link)}
                      disabled={!changed}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#0B0B0B] px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:bg-[#0B0B0B]/10 disabled:text-[#0B0B0B]/40"
                      data-testid={`internal-link-save-${link.id}`}
                    >
                      <Save size={13} /> Save URL
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
