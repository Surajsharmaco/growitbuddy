import { analyzeKeywordUsage, KEYWORD_DENSITY, type KeywordUsageZone } from "@/lib/keywordUsage";

const FEEDBACK: Record<KeywordUsageZone, { label: string; tone: string; advice: string }> = {
  empty: {
    label: "Waiting",
    tone: "bg-[#0B0B0B]/5 text-[#0B0B0B]/60 border-[#0B0B0B]/10",
    advice: "Add a focus keyword and write your article to see its usage.",
  },
  "very-low": {
    label: "Red · Too low",
    tone: "bg-red-50 text-red-700 border-red-200",
    advice: "The phrase is missing or very sparse. Add it naturally where it fits.",
  },
  low: {
    label: "Yellow · Low",
    tone: "bg-amber-50 text-amber-800 border-amber-200",
    advice: "A little low. Mention the phrase naturally if it helps the reader.",
  },
  "in-range": {
    label: "Green · In range",
    tone: "bg-emerald-50 text-emerald-800 border-emerald-200",
    advice: "Within the suggested range. Keep the writing natural.",
  },
  high: {
    label: "Yellow · High",
    tone: "bg-amber-50 text-amber-800 border-amber-200",
    advice: "A little frequent. Review repeated uses of the exact phrase.",
  },
  "very-high": {
    label: "Red · Too high",
    tone: "bg-red-50 text-red-700 border-red-200",
    advice: "The phrase is overused. Replace unnecessary repetitions with natural wording.",
  },
};

const BANDS: { zone: KeywordUsageZone; color: string }[] = [
  { zone: "very-low", color: "bg-red-500" },
  { zone: "low", color: "bg-amber-400" },
  { zone: "in-range", color: "bg-emerald-500" },
  { zone: "high", color: "bg-amber-400" },
  { zone: "very-high", color: "bg-red-500" },
];

export function KeywordUsageGuide({ keyword, content }: { keyword: string; content: string }) {
  const usage = analyzeKeywordUsage(content, keyword);
  const feedback = FEEDBACK[usage.zone];
  const advice = !keyword.trim()
    ? FEEDBACK.empty.advice
    : usage.wordCount === 0
      ? "Start writing to see how often the phrase appears."
      : usage.mentions === 0
        ? "Not used in the article yet. Add it naturally where it fits."
        : feedback.advice;

  return (
    <div className="rounded-xl border border-[#0B0B0B]/10 bg-[#fafafa] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0B0B0B]/45 mb-2">Keyword usage &amp; frequency</p>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[13px] font-bold text-[#0B0B0B]">{usage.mentions} use{usage.mentions === 1 ? "" : "s"}</p>
          <p className="text-[10px] text-[#0B0B0B]/50">{usage.wordCount} article words</p>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-bold text-[#0B0B0B]">{usage.zone === "empty" ? "—" : `${usage.density.toFixed(2)}%`}</p>
          <span className={`inline-block rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${feedback.tone}`}>{feedback.label}</span>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1 mt-3" aria-hidden="true">
        {BANDS.map((band) => (
          <span
            key={band.zone}
            className={`h-2 rounded-full ${band.color} ${usage.zone === band.zone ? "ring-2 ring-black/50 ring-offset-1" : "opacity-35"}`}
          />
        ))}
      </div>
      <p className="text-[11px] leading-snug text-[#0B0B0B]/70 mt-3">{advice}</p>
      {usage.zone !== "empty" && usage.wordCount < 100 && (
        <p className="text-[10px] text-amber-700 mt-1">Early estimate: short drafts can change zones quickly.</p>
      )}
      <p className="text-[10px] leading-relaxed text-[#0B0B0B]/45 mt-2">
        <span className="text-emerald-700 font-semibold">Green</span> {KEYWORD_DENSITY.suggestedMin}–{KEYWORD_DENSITY.suggestedMax}% ·{" "}
        <span className="text-amber-700 font-semibold">Yellow</span> {KEYWORD_DENSITY.veryLow}–&lt;{KEYWORD_DENSITY.suggestedMin}% or &gt;{KEYWORD_DENSITY.suggestedMax}–{KEYWORD_DENSITY.veryHigh}% ·{" "}
        <span className="text-red-700 font-semibold">Red</span> &lt;{KEYWORD_DENSITY.veryLow}% or &gt;{KEYWORD_DENSITY.veryHigh}%.
      </p>
      <p className="text-[10px] leading-snug text-[#0B0B0B]/40 mt-1">Frequency = whole-word phrase uses per 100 article words. Body only; a guide, not a ranking guarantee.</p>
    </div>
  );
}