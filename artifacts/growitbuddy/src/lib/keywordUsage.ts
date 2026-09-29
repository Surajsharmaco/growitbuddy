export const KEYWORD_DENSITY = {
  veryLow: 0.2,
  suggestedMin: 0.5,
  suggestedMax: 3,
  veryHigh: 4,
} as const;

export type KeywordUsageZone = "empty" | "very-low" | "low" | "in-range" | "high" | "very-high";

function words(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? [];
}

function articleWords(html: string): string[] {
  return words(html.replace(/<[^>]*>/g, " ").replace(/&(?:#(?:\d+|x[\da-f]+)|[a-z]+);/gi, " "));
}

export function countArticleWords(html: string): number {
  return articleWords(html).length;
}

export function analyzeKeywordUsage(content: string, keyword: string): {
  mentions: number;
  wordCount: number;
  density: number;
  zone: KeywordUsageZone;
} {
  const article = articleWords(content);
  const phrase = words(keyword);
  if (!article.length || !phrase.length) {
    return { mentions: 0, wordCount: article.length, density: 0, zone: "empty" };
  }

  let mentions = 0;
  // Match whole-word phrases, not substrings (e.g. "brand" does not match "branding").
  for (let i = 0; i <= article.length - phrase.length; i++) {
    if (phrase.every((word, offset) => article[i + offset] === word)) {
      mentions++;
      i += phrase.length - 1;
    }
  }

  // Phrase mentions per 100 article words, including multi-word phrases.
  const density = Math.round((mentions / article.length) * 10_000) / 100;
  const zone: KeywordUsageZone =
    mentions === 0 || density < KEYWORD_DENSITY.veryLow ? "very-low" :
    density < KEYWORD_DENSITY.suggestedMin ? "low" :
    density <= KEYWORD_DENSITY.suggestedMax ? "in-range" :
    density <= KEYWORD_DENSITY.veryHigh ? "high" : "very-high";

  return { mentions, wordCount: article.length, density, zone };
}