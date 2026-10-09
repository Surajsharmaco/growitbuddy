import { useMemo } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ListTree, RotateCcw, AlertCircle } from "lucide-react";
import type { BlogPost } from "@/data/blogPosts";
import { articleHeadingDocument, collectArticleToc, getArticleToc } from "@/lib/articleToc";

type TocSettings = NonNullable<BlogPost["toc"]>;
type Row = { id: string; text: string; label: string; hidden: boolean };

/**
 * Edits table-of-contents settings only. Article headings, title, slug and SEO
 * are never touched: labels, order and visibility live in `toc`.
 */
export function ArticleTocEditor({ content, settings, onChange, pageMode }: {
  content: string;
  settings: BlogPost["toc"];
  onChange: (next: TocSettings) => void;
  pageMode?: boolean;
}) {
  const analysis = useMemo(() => {
    const candidates = collectArticleToc(content);
    let skippedHeadings = 0;
    let inlineToc = false;
    if (content && typeof DOMParser !== "undefined") {
      try {
        const doc = articleHeadingDocument(content);
        skippedHeadings = Math.max(0, doc.body.querySelectorAll("h2").length - candidates.length);
        inlineToc = !!doc.body.querySelector("nav[class*='toc' i], [class*='table-of-contents' i], [id*='table-of-contents' i], [id='toc'], .toc, #toc")
          || Array.from(doc.body.querySelectorAll("h2,h3,h4,p,strong")).some(el => /^(table of )?contents$/i.test(el.textContent?.trim() ?? ""));
      } catch { /* analysis is advisory only */ }
    }
    return { candidates, skippedHeadings, inlineToc };
  }, [content]);

  const enabled = settings?.enabled !== false;
  const saved = Array.isArray(settings?.entries) ? settings.entries.filter(entry => entry && typeof entry.id === "string") : [];
  const byId = new Map(analysis.candidates.map(c => [c.id, c]));
  const seen = new Set<string>();
  const rows: Row[] = [];
  for (const entry of saved) {
    const c = byId.get(entry.id);
    if (!c || seen.has(entry.id)) continue;
    seen.add(entry.id);
    rows.push({ id: c.id, text: c.text, label: typeof entry.label === "string" ? entry.label : "", hidden: !!entry.hidden });
  }
  for (const c of analysis.candidates) if (!seen.has(c.id)) rows.push({ id: c.id, text: c.text, label: "", hidden: false });
  // Settings for headings that are currently missing are kept, so retyping a heading restores them.
  const stale = saved.filter(entry => !byId.has(entry.id));
  const preview = getArticleToc(content, settings);
  const customized = settings?.enabled === false || saved.length > 0;

  function commit(nextRows: Row[], nextStale = stale, nextEnabled = enabled) {
    onChange({
      enabled: nextEnabled,
      entries: [
        ...nextRows.map(r => ({ id: r.id, label: r.label, ...(r.hidden ? { hidden: true } : {}) })),
        ...nextStale,
      ],
    });
  }
  function patch(index: number, change: Partial<Row>) {
    commit(rows.map((r, i) => (i === index ? { ...r, ...change } : r)));
  }
  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = rows.slice();
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  }

  return (
    <section aria-label="Table of contents settings" data-testid="toc-editor"
      className="bg-white border border-[#0B0B0B]/10 rounded-2xl mt-4 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-[#0B0B0B]/8 bg-[#fafafa]">
        <ListTree size={14} className="text-[#0B0B0B]/45" />
        <h3 className="text-[11px] font-bold text-[#0B0B0B]/70 uppercase tracking-widest flex-1 min-w-[160px]">Table of contents</h3>
        <label className="flex items-center gap-2 text-[12px] font-medium text-[#0B0B0B]/70 cursor-pointer">
          <input type="checkbox" checked={enabled} data-testid="toc-enabled"
            aria-label={`Show table of contents on this ${pageMode ? "page" : "post"}`}
            onChange={(e) => commit(rows, stale, e.target.checked)} className="accent-[#0B0B0B]" />
          Show on {pageMode ? "page" : "post"}
        </label>
        <button type="button" disabled={!customized} data-testid="toc-reset"
          onClick={() => onChange({ enabled: true, entries: [] })}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0B0B0B]/55 hover:text-[#0B0B0B] disabled:opacity-35 transition-colors">
          <RotateCcw size={11} /> Reset to headings
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-3">
        <p className="text-[11px] leading-relaxed text-[#0B0B0B]/50">
          Built from your H2 headings as you write. Renaming, hiding or reordering here changes only the contents list; the article headings, title, URL and SEO stay exactly as written.
        </p>

        {analysis.inlineToc && (
          <p role="status" className="flex gap-2 text-[12px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <span>This article body already contains its own inline table of contents. Edit or remove it in the body editor above; nothing here rewrites it. Manual settings may replace it on the public page.</span>
          </p>
        )}
        {analysis.skippedHeadings > 0 && (
          <p role="status" className="flex gap-2 text-[12px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <span>{analysis.skippedHeadings} H2 heading{analysis.skippedHeadings === 1 ? " is" : "s are"} skipped because {analysis.skippedHeadings === 1 ? "it wraps" : "they wrap"} other blocks or {analysis.skippedHeadings === 1 ? "is" : "are"} too long. Nothing was changed; fix the heading in the body if it should be listed.</span>
          </p>
        )}

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#0B0B0B]/15 px-4 py-6 text-center">
            <p className="text-[12.5px] font-medium text-[#0B0B0B]/55">No H2 headings yet</p>
            <p className="text-[11px] text-[#0B0B0B]/40 mt-1">Apply Heading 2 to a line in the body and it will appear here.</p>
          </div>
        ) : (
          <ol className="space-y-2" aria-label="Contents entries">
            {rows.map((row, i) => (
              <li key={row.id} data-testid={`toc-row-${row.id}`}
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors ${row.hidden ? "border-[#0B0B0B]/8 bg-[#0B0B0B]/3" : "border-[#0B0B0B]/12 bg-white"}`}>
                <span className="w-5 text-center text-[11px] font-mono text-[#0B0B0B]/35">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <input type="text" value={row.label} placeholder={row.text} maxLength={180}
                    aria-label={`Contents label for heading "${row.text}"`}
                    onChange={(e) => patch(i, { label: e.target.value })}
                    className={`w-full rounded-lg border border-[#0B0B0B]/12 px-2.5 py-1.5 text-[13px] outline-none focus:border-[#0B0B0B]/35 bg-white ${row.hidden ? "text-[#0B0B0B]/40" : "text-[#0B0B0B]"}`} />
                  <p className="mt-1 truncate text-[10px] text-[#0B0B0B]/38">Heading: {row.text} <span className="font-mono">#{row.id}</span></p>
                </div>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                  aria-label={`Move "${row.label || row.text}" up`}
                  className="p-1.5 rounded hover:bg-[#0B0B0B]/8 text-[#0B0B0B]/50 disabled:opacity-25"><ArrowUp size={13} /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1}
                  aria-label={`Move "${row.label || row.text}" down`}
                  className="p-1.5 rounded hover:bg-[#0B0B0B]/8 text-[#0B0B0B]/50 disabled:opacity-25"><ArrowDown size={13} /></button>
                <button type="button" onClick={() => patch(i, { hidden: !row.hidden })}
                  aria-pressed={row.hidden}
                  aria-label={row.hidden ? `Include "${row.label || row.text}" in contents` : `Exclude "${row.label || row.text}" from contents`}
                  title={row.hidden ? "Excluded: click to include" : "Included: click to exclude"}
                  className="p-1.5 rounded hover:bg-[#0B0B0B]/8 text-[#0B0B0B]/55">{row.hidden ? <EyeOff size={13} /> : <Eye size={13} />}</button>
              </li>
            ))}
          </ol>
        )}

        {stale.length > 0 && (
          <p className="text-[11px] text-[#0B0B0B]/45">
            {stale.length} saved setting{stale.length === 1 ? "" : "s"} no longer match a heading and {stale.length === 1 ? "is" : "are"} kept in case the heading returns.{" "}
            <button type="button" onClick={() => commit(rows, [])} className="font-semibold underline hover:text-[#0B0B0B]">Discard</button>
          </p>
        )}

        <div className="rounded-xl bg-[#F7F7F5] border border-[#0B0B0B]/8 px-4 py-3" data-testid="toc-preview">
          <p className="text-[10px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest mb-2">Preview of published entries</p>
          {!enabled ? (
            <p className="text-[12px] text-[#0B0B0B]/50">The table of contents is turned off for this {pageMode ? "page" : "post"}.</p>
          ) : preview.length === 0 ? (
            <p className="text-[12px] text-[#0B0B0B]/50">No entries will be shown.</p>
          ) : (
            <ol className="list-decimal pl-5 space-y-1 text-[13px] text-[#0B0B0B]/80">
              {preview.map(entry => <li key={entry.id}>{entry.text}</li>)}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
