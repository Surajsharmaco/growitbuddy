import { marked } from "marked";

export type KeywordUsage = {
  mentions: number;
  wordCount: number;
  density: number;
};

export type KeywordFrequency = KeywordUsage & { keyword: string };

const BLOCKS = new Set([
  "ARTICLE", "SECTION", "DIV", "P", "H1", "H2", "H3", "H4", "H5", "H6",
  "UL", "OL", "LI", "BLOCKQUOTE", "PRE", "TABLE", "TR", "TD", "TH",
  "FIGURE", "FIGCAPTION", "HEADER", "FOOTER", "BR", "HR",
]);
const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "SVG", "MATH"]);
let lastContent: string | undefined;
let lastSegments: string[][] = [];

function words(text: string): string[] {
  return text.normalize("NFKC").toLowerCase().match(
    /[\p{L}\p{N}][\p{L}\p{M}\p{N}]*(?:(?:['’][\p{L}\p{M}\p{N}]+)|[+#]+)*/gu,
  ) ?? [];
}

function articleSegments(content: string): string[][] {
  if (content === lastContent) return lastSegments;
  if (!content.trim()) return [];
  // Legacy posts can contain Markdown; parsing it first removes link destinations,
  // image syntax and heading markers from the visible word count.
  const isHtml = /<(?:p|div|h[1-6]|ul|ol|li|blockquote|table|tr|td|th|section|article|pre|br|hr|figure)\b/i.test(content);
  const html = isHtml ? content : marked.parse(content, { gfm: true, async: false }) as string;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const segments: string[][] = [];
  let text = "";
  const flush = () => {
    const tokens = words(text);
    if (tokens.length) segments.push(tokens);
    text = "";
  };
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.nodeValue ?? "";
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    if (SKIP.has(element.tagName) || element.hasAttribute("hidden") ||
        element.getAttribute("aria-hidden") === "true" ||
        /(?:^|;)\s*display\s*:\s*none\b/i.test(element.getAttribute("style") ?? "")) return;
    const isBlock = BLOCKS.has(element.tagName);
    if (isBlock) flush();
    for (const child of element.childNodes) visit(child);
    if (isBlock) flush();
  };
  visit(doc.body);
  flush();
  lastContent = content;
  lastSegments = segments;
  return segments;
}

function measure(segments: string[][], phrase: string[], wordCount: number): KeywordUsage {
  if (!phrase.length || !wordCount) return { mentions: 0, wordCount, density: 0 };
  let mentions = 0;
  for (const segment of segments) {
    for (let i = 0; i <= segment.length - phrase.length; i++) {
      if (phrase.every((word, offset) => segment[i + offset] === word)) {
        mentions++;
        i += phrase.length - 1;
      }
    }
  }
  const density = Math.round((mentions / wordCount) * 10_000) / 100;
  return { mentions, wordCount, density };
}

/**
 * Editorial review prompt, NOT an SEO threshold. A high share of repeated
 * exact-phrase words can sound unnatural; a human must read the draft.
 */
export function needsRepetitionReview(usage: KeywordUsage, keyword: string): boolean {
  const phraseWords = words(keyword).length;
  return usage.wordCount >= 100 && usage.mentions >= 5 &&
    (usage.mentions * phraseWords) / usage.wordCount >= 0.08;
}

export function countArticleWords(content: string): number {
  return articleSegments(content).reduce((count, segment) => count + segment.length, 0);
}

export function analyzeKeywordUsage(content: string, keyword: string): KeywordUsage {
  const segments = articleSegments(content);
  const wordCount = segments.reduce((count, segment) => count + segment.length, 0);
  return measure(segments, words(keyword), wordCount);
}

/** Each keyword is counted independently; the combined total counts overlapping uses only once. */
export function analyzeKeywordSet(content: string, focusKeyword: string, secondaryKeywords: string): {
  focus: KeywordUsage;
  secondary: KeywordFrequency[];
  totalMentions: number;
  combinedFrequency: number;
  coveredWords: number;
  coverage: number;
  wordCount: number;
} {
  const segments = articleSegments(content);
  const wordCount = segments.reduce((count, segment) => count + segment.length, 0);
  const focusPhrase = words(focusKeyword);
  const seen = new Set<string>(focusPhrase.length ? [focusPhrase.join("\0")] : []);
  const secondary = secondaryKeywords.split(",").map((keyword) => keyword.trim()).filter((keyword) => {
    const phrase = words(keyword);
    const key = phrase.join("\0");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const keywords = [focusKeyword, ...secondary];
  const phrases = keywords.map(words);
  const focus = measure(segments, focusPhrase, wordCount);
  const secondaryCounts = secondary.map((keyword, i) => ({
    keyword,
    ...measure(segments, phrases[i + 1], wordCount),
  }));

  // Longest phrase wins when, for example, "digital marketing" and
  // "marketing" describe the same appearance in the article.
  const candidates: Array<{ segment: number; start: number; length: number; order: number }> = [];
  for (const [segmentIndex, tokens] of segments.entries()) {
    phrases.forEach((phrase, order) => {
      if (!phrase.length) return;
      for (let start = 0; start <= tokens.length - phrase.length; start++) {
        if (phrase.every((word, offset) => tokens[start + offset] === word)) {
          candidates.push({ segment: segmentIndex, start, length: phrase.length, order });
        }
      }
    });
  }
  candidates.sort((a, b) => b.length - a.length || a.order - b.order || a.segment - b.segment || a.start - b.start);
  const used = segments.map((tokens) => new Set<number>());
  let totalMentions = 0;
  for (const { segment, start, length } of candidates) {
    if (Array.from({ length }, (_, offset) => start + offset).some((index) => used[segment].has(index))) continue;
    for (let i = start; i < start + length; i++) used[segment].add(i);
    totalMentions++;
  }
  const coveredWords = used.reduce((total, indexes) => total + indexes.size, 0);
  const combinedFrequency = wordCount ? Math.round((totalMentions / wordCount) * 10_000) / 100 : 0;
  const coverage = wordCount ? Math.round((coveredWords / wordCount) * 10_000) / 100 : 0;
  return { focus, secondary: secondaryCounts, totalMentions, combinedFrequency, coveredWords, coverage, wordCount };
}

export function needsCombinedReview(report: ReturnType<typeof analyzeKeywordSet>): boolean {
  return report.wordCount >= 100 && report.totalMentions >= 8 && report.coverage >= 15;
}