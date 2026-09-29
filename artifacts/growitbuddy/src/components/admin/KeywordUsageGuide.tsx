import { analyzeKeywordSet, needsCombinedReview, needsRepetitionReview } from "@/lib/keywordUsage";

export function KeywordUsageGuide({ keyword, secondaryKeywords = "", content }: { keyword: string; secondaryKeywords?: string; content: string }) {
  const report = analyzeKeywordSet(content, keyword, secondaryKeywords);
  const rows = [
    ...(keyword.trim() ? [{ keyword: keyword.trim(), type: "Focus", ...report.focus }] : []),
    ...report.secondary.map((secondary) => ({ ...secondary, type: "Additional" })),
  ];
  const flagged = rows.filter((row) => needsRepetitionReview(row, row.keyword));
  const reviewCombined = needsCombinedReview(report);
  const needsReview = flagged.length > 0 || reviewCombined;

  return (
    <div className="rounded-xl border border-[#0B0B0B]/10 bg-[#fafafa] p-3">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0B0B0B]/55">All keywords · live frequency</p>
        <span className="text-[10px] text-[#0B0B0B]/55">{rows.length} tracked · {report.wordCount} article words</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="rounded-lg bg-white border border-[#0B0B0B]/10 px-2.5 py-2">
          <p className="text-[17px] font-bold leading-none text-[#0B0B0B]">{report.wordCount ? report.totalMentions : "—"}</p>
          <p className="text-[10px] leading-snug text-[#0B0B0B]/60 mt-1">Total unique uses</p>
        </div>
        <div className="rounded-lg bg-white border border-[#0B0B0B]/10 px-2.5 py-2">
          <p className="text-[17px] font-bold leading-none text-[#0B0B0B]">{report.wordCount ? `${report.combinedFrequency.toFixed(2)}%` : "—"}</p>
          <p className="text-[10px] leading-snug text-[#0B0B0B]/60 mt-1">Combined frequency</p>
        </div>
      </div>
      <p className="text-[10px] text-[#0B0B0B]/60 mt-1.5">Matched words: {report.coveredWords} of {report.wordCount} ({report.coverage.toFixed(2)}% body coverage)</p>

      <div className="mt-3 border-t border-[#0B0B0B]/10 pt-2 space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#0B0B0B]/55 mb-1">Every keyword · exact phrase</p>
        {rows.map((row) => {
          const review = needsRepetitionReview(row, row.keyword);
          return (
            <div key={`${row.type}-${row.keyword}`} className="flex items-start justify-between gap-2 rounded-lg border border-[#0B0B0B]/10 bg-white px-2.5 py-2">
              <div className="min-w-0">
                <span className="block text-[10px] text-[#0B0B0B]/50">{row.type}</span>
                <span className="block break-words text-[11px] font-semibold text-[#0B0B0B]" title={row.keyword}>{row.keyword}</span>
                {report.wordCount > 0 && row.mentions === 0 && <span className="text-[10px] text-amber-700">Not found in article</span>}
                {review && <span className="text-[10px] text-amber-700">Review repetition</span>}
              </div>
              <div className="shrink-0 text-right">
                <span className="block text-[12px] font-bold text-[#0B0B0B]">{row.mentions} use{row.mentions === 1 ? "" : "s"}</span>
                <span className="block text-[10px] text-[#0B0B0B]/60">{row.density.toFixed(2)}% frequency</span>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p className="text-[11px] text-[#0B0B0B]/60">Add keywords above to track them here.</p>}
      </div>

      {rows.length > 0 && (
        <p className={`mt-3 rounded-lg border px-2.5 py-2 text-[11px] leading-snug ${needsReview ? "border-amber-200 bg-amber-50 text-amber-900" : "border-[#0B0B0B]/10 bg-white text-[#0B0B0B]/70"}`}>
          {!report.wordCount
            ? "Start writing to see frequency for every keyword."
            : needsReview
              ? "Possible over-repetition. Read the highlighted phrases in context and remove any that sound forced; these numbers cannot prove keyword stuffing."
              : "Counts help you spot repetition, but no percentage can confirm that a draft is free of keyword stuffing. Read it for naturalness and usefulness."}
        </p>
      )}
      {report.wordCount > 0 && report.wordCount < 100 && (
        <p className="text-[10px] text-amber-700 mt-1">Early estimate: short drafts can change quickly.</p>
      )}
      <p className="text-[10px] leading-relaxed text-[#0B0B0B]/55 mt-2">
        Each phrase's frequency and the combined frequency = uses per 100 body words. Combined uses and coverage count overlaps once. Titles, metadata and spelling variants are not counted.
      </p>
      <p className="text-[10px] leading-relaxed text-[#0B0B0B]/55 mt-1">
        Google sets no ideal keyword-density percentage. This is an editorial review signal, not a ranking score.{" "}
        <a href="https://developers.google.com/search/docs/essentials/spam-policies#keyword-stuffing" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#0B0B0B]">Google&apos;s guidance</a>
      </p>
    </div>
  );
}