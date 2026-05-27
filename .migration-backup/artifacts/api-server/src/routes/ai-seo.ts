import { Router } from "express";
import { createHmac, timingSafeEqual } from "crypto";

const router = Router();

function verifyToken(token: string): boolean {
  const parts = token.split(".");
  const secret = process.env.ADMIN_PASSWORD ?? "";

  // 5-part token: expiry.nonce.role.permsB64.sig  (current format)
  if (parts.length === 5) {
    const [expiry, nonce, role, permsB64, sig] = parts;
    const expMs = Number(expiry);
    if (isNaN(expMs) || Date.now() > expMs) return false;
    const payload = `${expiry}.${nonce}.${role}.${permsB64}`;
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const eSig = Buffer.from(sig, "hex");
    const eExp = Buffer.from(expected, "hex");
    if (eSig.length !== eExp.length) return false;
    return timingSafeEqual(eSig, eExp);
  }

  // 3-part token: expiry.nonce.sig  (legacy super-admin format)
  if (parts.length === 3) {
    const [expiry, nonce, sig] = parts;
    const expMs = Number(expiry);
    if (isNaN(expMs) || Date.now() > expMs) return false;
    const payload = `${expiry}.${nonce}`;
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const eSig = Buffer.from(sig, "hex");
    const eExp = Buffer.from(expected, "hex");
    if (eSig.length !== eExp.length) return false;
    return timingSafeEqual(eSig, eExp);
  }

  return false;
}

function authMiddleware(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction,
) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!verifyToken(auth.slice(7))) { res.status(401).json({ error: "Invalid or expired session" }); return; }
  next();
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by","from","is","are",
  "was","were","be","been","being","have","has","had","do","does","did","will","would","could",
  "should","may","might","shall","can","this","that","these","those","it","its","i","you","he",
  "she","we","they","what","which","who","when","where","how","why","not","no","so","if","as",
  "up","out","about","into","than","then","there","their","they","them","your","our","my","his",
  "her","its","we","us","me","him","she","he","also","just","more","very","all","any","some",
  "each","every","most","other","such","same","over","after","before","between","through",
]);

const COMMERCIAL_SIGNALS = ["buy","price","cost","cheap","best","top","review","vs","versus","compare","discount","deal","hire","service","agency","package","plan","pricing"];
const TRANSACTIONAL_SIGNALS = ["download","get","start","try","sign up","register","book","order","purchase","contact","free","now","today","instant"];
const INFORMATIONAL_SIGNALS = ["how","what","why","when","guide","tutorial","tips","learn","understand","explain","meaning","definition","example","steps","ways"];

// ─── Intent Detection ──────────────────────────────────────────
function detectIntent(title: string, content: string): { intent: string; explanation: string } {
  const text = (title + " " + content).toLowerCase();
  const words = text.split(/\s+/);
  const comm = COMMERCIAL_SIGNALS.filter(w => text.includes(w)).length;
  const trans = TRANSACTIONAL_SIGNALS.filter(w => text.includes(w)).length;
  const info = INFORMATIONAL_SIGNALS.filter(w => words.some(word => word.startsWith(w))).length;
  if (trans >= 2) return { intent: "transactional", explanation: "Content signals user is ready to take action (buy, sign up, contact)." };
  if (comm >= 2) return { intent: "commercial", explanation: "Content helps users evaluate options before making a decision." };
  return { intent: "informational", explanation: "Content primarily educates or informs the reader about a topic." };
}

// ─── Semantic Keywords ─────────────────────────────────────────
function extractSemanticKeywords(content: string, keyword: string, title: string): Array<{ term: string; placement: string }> {
  const text = stripHtml(content).toLowerCase();
  const words = text.split(/\W+/).filter(w => w.length > 4 && !STOP_WORDS.has(w));
  const freq: Record<string, number> = {};
  for (const word of words) freq[word] = (freq[word] ?? 0) + 1;
  const kw = keyword.toLowerCase().split(/\s+/);
  const titleWords = title.toLowerCase().split(/\s+/).filter(w => !STOP_WORDS.has(w));
  const sorted = Object.entries(freq)
    .filter(([w]) => !kw.includes(w) && !titleWords.includes(w) && w.length > 4)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([term]) => term);
  const placements = ["intro","H2","body","body","conclusion","meta","H2","body","intro","body","conclusion","meta"];
  return sorted.slice(0, 7).map((term, i) => ({ term, placement: placements[i] ?? "body" }));
}

// ─── Title Variations ──────────────────────────────────────────
function generateTitleVariations(title: string, keyword: string): Array<{ title: string; ctrScore: number; hook: string }> {
  const kw = keyword || title.split(" ").slice(0, 3).join(" ");
  const year = new Date().getFullYear();
  return [
    { title: `How to ${kw}: A Complete Guide (${year})`, ctrScore: 8, hook: "Question format + year signals freshness and completeness." },
    { title: `${kw}: 7 Proven Strategies That Actually Work`, ctrScore: 9, hook: "Number + social proof drives higher click-through in search results." },
    { title: `Why Most People Fail at ${kw} (And How to Avoid It)`, ctrScore: 8, hook: "Curiosity gap creates emotional tension that compels clicks." },
    { title: `The Ultimate ${kw} Playbook for ${year}`, ctrScore: 7, hook: "Power word 'Ultimate' + year positions this as the definitive resource." },
  ];
}

// ─── Critical Issues ───────────────────────────────────────────
function checkCriticalIssues(title: string, content: string, keyword: string, wordCount: number): string[] {
  const issues: string[] = [];
  const text = (title + " " + content).toLowerCase();
  const kw = keyword.toLowerCase();
  if (wordCount < 300) issues.push("Content is too short (under 300 words). Aim for at least 800 words for strong rankings.");
  if (keyword && !text.includes(kw)) issues.push(`Focus keyword "${keyword}" does not appear in the content. Include it naturally.`);
  if (keyword && title && !title.toLowerCase().includes(kw)) issues.push(`Focus keyword missing from the title tag. Place it near the beginning.`);
  if (!/<h[2-6]/i.test(content) && wordCount > 400) issues.push("No subheadings (H2/H3) detected. Break up long content with clear sections.");
  return issues;
}

// ─── Improvements ──────────────────────────────────────────────
function buildImprovements(wordCount: number, content: string, keyword: string): string[] {
  const improvements: string[] = [];
  const hasImages = /<img/i.test(content);
  const hasLinks = /<a\s/i.test(content);
  const hasList = /<ul|<ol/i.test(content);
  const kw = keyword.toLowerCase();
  const text = content.toLowerCase();
  if (!hasImages) improvements.push("Add at least one relevant image with a descriptive alt tag containing your focus keyword.");
  if (!hasLinks) improvements.push("Include 2-3 internal links to related content on your site to improve crawlability.");
  if (!hasList) improvements.push("Use bullet points or numbered lists to improve readability and increase dwell time.");
  if (wordCount < 800) improvements.push("Expand content to 800-1200 words. Longer posts rank better for competitive keywords.");
  if (kw && !text.slice(0, 200).includes(kw)) improvements.push(`Mention your focus keyword "${keyword}" within the first 100 words (intro paragraph).`);
  if (!/<strong|<b>/i.test(content)) improvements.push("Bold 2-3 key phrases to signal importance to search engines and improve scannability.");
  return improvements.slice(0, 5);
}

// ─── Content Gaps ──────────────────────────────────────────────
function buildContentGaps(title: string, keyword: string, intent: string): string[] {
  const gaps: string[] = [];
  const text = (title + " " + keyword).toLowerCase();
  if (intent === "informational") {
    if (!text.includes("example")) gaps.push("Real-world examples or case studies");
    if (!text.includes("step")) gaps.push("Step-by-step process breakdown");
    gaps.push("Common mistakes and how to avoid them");
    gaps.push("FAQs section addressing reader objections");
  } else if (intent === "commercial") {
    gaps.push("Comparison table or pros/cons section");
    gaps.push("Pricing or budget guidance");
    gaps.push("Expert recommendation or editorial verdict");
  } else {
    gaps.push("Clear value proposition above the fold");
    gaps.push("Social proof (testimonials or numbers)");
    gaps.push("Risk-reduction element (guarantee, free trial)");
  }
  return gaps.slice(0, 5);
}

// ─── Ideal Structure ───────────────────────────────────────────
function buildIdealStructure(intent: string, keyword: string): string[] {
  if (intent === "transactional") {
    return ["Headline with clear value proposition","Key benefits (3-5 bullet points)","Social proof / results","Clear CTA / next step","FAQs"];
  }
  if (intent === "commercial") {
    return ["Introduction + problem statement","Criteria for evaluation","Options compared","Recommendation","Who it's best for","Final verdict + CTA"];
  }
  return [
    `Introduction: What is ${keyword || "this topic"} and why it matters`,
    "Key concepts explained simply",
    "Step-by-step breakdown or main strategies",
    "Real examples or data",
    "Common mistakes to avoid",
    "FAQ section (PAA questions)",
    "Conclusion + next steps",
  ];
}

// ─── Advanced Tips ─────────────────────────────────────────────
function buildAdvancedTips(keyword: string, wordCount: number): string[] {
  return [
    `Add an FAQ section targeting long-tail variations of "${keyword || "your keyword"}" to capture voice search and PAA traffic.`,
    "Mark up your content with FAQ or HowTo schema JSON-LD to earn rich snippets in Google.",
    `Update the publish date and refresh 20% of the content every 6 months to maintain freshness signals.`,
    wordCount > 1500
      ? "Consider splitting this into a topic cluster with a pillar page and 3-4 supporting posts linked together."
      : "Build a topic cluster: link this post to a longer pillar page on the broader subject.",
  ];
}

// ─── Internal Links ────────────────────────────────────────────
function findInternalLinks(title: string, keyword: string, content: string, allPosts: Array<{ slug: string; title: string; excerpt?: string }>): Array<{ slug: string; title: string; anchorText: string; reason: string }> {
  if (!allPosts.length) return [];
  const queryWords = new Set([
    ...keyword.toLowerCase().split(/\s+/),
    ...title.toLowerCase().split(/\s+/).filter(w => !STOP_WORDS.has(w)),
  ]);
  const scored = allPosts
    .filter(p => p.title !== title)
    .map(p => {
      const ptWords = (p.title + " " + (p.excerpt ?? "")).toLowerCase().split(/\s+/);
      const overlap = ptWords.filter(w => queryWords.has(w)).length;
      return { ...p, score: overlap };
    })
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return scored.map(p => ({
    slug: p.slug,
    title: p.title,
    anchorText: p.title.split(" ").slice(0, 4).join(" "),
    reason: `Topic overlap with "${keyword || title}" makes this a natural contextual link.`,
  }));
}

// ─── GEO (Generative Engine Optimization) 2026 ─────────────────
function analyzeGEO(content: string, title: string, keyword: string, wordCount: number): { geoScore: number; geoTips: string[] } {
  const text = stripHtml(content);
  const tips: string[] = [];
  let score = 0;

  // Direct answer in first paragraph (AI Overview often quotes first concise answer)
  const firstPara = text.slice(0, 300);
  const hasDirectAnswer = keyword && firstPara.toLowerCase().includes(keyword.toLowerCase());
  if (hasDirectAnswer) score += 20;
  else tips.push(`Add a concise 1-2 sentence direct answer to "${keyword}" in the very first paragraph — AI Overviews quote these.`);

  // Structured content (H2/H3 headings)
  const hasH2 = /<h2/i.test(content);
  const hasH3 = /<h3/i.test(content);
  if (hasH2 && hasH3) score += 20;
  else if (hasH2) { score += 10; tips.push("Add H3 subheadings under each H2 to create a clear hierarchy that AI can parse and summarize."); }
  else tips.push("Use H2 and H3 headings to structure content — AI models use these to identify key topics.");

  // Definition / "is" pattern for featured snippets
  const hasDefinition = /\b(is|are|means|refers to|defined as)\b/i.test(firstPara);
  if (hasDefinition) score += 15;
  else tips.push(`Consider starting with "${keyword} is..." — definition-style openings are frequently cited in AI Overviews.`);

  // Concise paragraphs (AI prefers <100 word chunks)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  const conciseParas = paragraphs.filter(p => p.split(" ").length <= 80).length;
  const conciseRatio = paragraphs.length > 0 ? conciseParas / paragraphs.length : 0;
  if (conciseRatio >= 0.7) score += 15;
  else tips.push("Break long paragraphs into chunks of 60-80 words. AI models prefer short, quotable paragraphs.");

  // Lists / structured data
  const hasList = /<ul|<ol/i.test(content);
  if (hasList) score += 15;
  else tips.push("Add numbered lists or bullet points — structured lists are quoted verbatim in AI Overviews.");

  // Statistics / numbers / data
  const hasNumbers = /\d+(%|x|M|K|\s(percent|times|studies|research))/i.test(text);
  if (hasNumbers) score += 15;
  else tips.push("Include specific statistics or data points. AI systems prefer factual, verifiable claims over generic statements.");

  return { geoScore: Math.min(100, score), geoTips: tips.slice(0, 4) };
}

// ─── People Also Ask (PAA) Questions ───────────────────────────
function generatePAAQuestions(keyword: string, intent: string, title: string): string[] {
  const kw = keyword || title;
  const questions: string[] = [];

  if (intent === "informational") {
    questions.push(
      `What is ${kw} and how does it work?`,
      `How long does it take to see results with ${kw}?`,
      `What are the benefits of ${kw}?`,
      `Is ${kw} right for my business?`,
      `What are the most common mistakes when doing ${kw}?`,
      `How much does ${kw} cost?`,
      `What tools do I need for ${kw}?`,
      `What is the difference between ${kw} and alternatives?`,
    );
  } else if (intent === "commercial") {
    questions.push(
      `Which ${kw} service is best in ${new Date().getFullYear()}?`,
      `How do I choose the right ${kw}?`,
      `Is ${kw} worth the investment?`,
      `What should I look for in a ${kw} provider?`,
      `How does ${kw} compare to alternatives?`,
      `What results can I expect from ${kw}?`,
    );
  } else {
    questions.push(
      `How do I get started with ${kw}?`,
      `What is the fastest way to ${kw}?`,
      `Do I need experience to use ${kw}?`,
      `What is the first step to ${kw}?`,
      `Is there a free way to ${kw}?`,
    );
  }

  return questions.slice(0, 6);
}

// ─── E-E-A-T Signals ───────────────────────────────────────────
function analyzeEEAT(content: string, title: string): Array<{ signal: string; found: boolean; tip: string; category: string }> {
  const text = stripHtml(content).toLowerCase();

  return [
    {
      signal: "First-person experience language",
      found: /\b(i |we |our |my |i've|we've|in my experience|i found|we found|i tested|we tested)\b/.test(text),
      tip: "Use 'I' or 'We' to share personal experience. Google values lived expertise over generic info.",
      category: "Experience",
    },
    {
      signal: "Specific numbers or data points",
      found: /\d+(\.\d+)?(%|x|\s?(percent|million|thousand|days|weeks|months|users|clients|years))/i.test(text),
      tip: "Include specific statistics, percentages, or results. '40% increase' is more trustworthy than 'significant increase'.",
      category: "Expertise",
    },
    {
      signal: "Expert or authority language",
      found: /\b(according to|research shows|studies indicate|experts|professionals|industry|proven|data shows)\b/.test(text),
      tip: "Reference studies, research, or expert opinions to establish authoritativeness.",
      category: "Authoritativeness",
    },
    {
      signal: "External citations or sources",
      found: /<a\s[^>]*href=["']https?:\/\/(?!growitbuddy)/i.test(content),
      tip: "Link to reputable external sources (studies, government sites, industry leaders) to boost trustworthiness.",
      category: "Trustworthiness",
    },
    {
      signal: "Case studies or client examples",
      found: /\b(case study|client|customer|example|for instance|real.world|worked with|helped)\b/.test(text),
      tip: "Include real client results or examples. Specific case studies dramatically increase perceived credibility.",
      category: "Experience",
    },
    {
      signal: "Date or freshness signals",
      found: /\b(202[3-9]|updated|latest|recent|new|current|this year|in \d{4})\b/.test(text),
      tip: "Include the current year and 'Updated' in your title/content to signal freshness to Google.",
      category: "Trustworthiness",
    },
    {
      signal: "Clear methodology or process",
      found: /\b(step|process|method|approach|framework|strategy|system|here's how|follow these)\b/.test(text),
      tip: "Explain your methodology. Google favors content that demonstrates how conclusions were reached.",
      category: "Expertise",
    },
  ];
}

// ─── Voice Search Optimization ─────────────────────────────────
function analyzeVoiceSearch(content: string, keyword: string): { voiceScore: number; voiceTips: string[] } {
  const text = stripHtml(content);
  const tips: string[] = [];
  let score = 0;

  // Conversational language
  const conversationalPhrases = ["you can","you'll","you're","you should","let's","here's","it's","that's","there's","don't","doesn't","isn't","won't","can't"];
  const conversationalCount = conversationalPhrases.filter(p => text.toLowerCase().includes(p)).length;
  if (conversationalCount >= 4) score += 25;
  else if (conversationalCount >= 2) { score += 12; tips.push("Use more contractions and conversational language (you'll, here's, let's) — voice search favors natural speech patterns."); }
  else tips.push("Write in a conversational tone using contractions and everyday language. Voice assistants prefer content that sounds natural when read aloud.");

  // FAQ section
  const hasFAQ = /\b(faq|frequently asked|questions?(\s+and\s+answers?)?|q:|\bq\.|common questions)\b/i.test(text);
  if (hasFAQ) score += 25;
  else tips.push("Add an FAQ section with question-and-answer format. Voice search often pulls answers from FAQ sections.");

  // Question-style headings
  const headings = content.match(/<h[2-4][^>]*>(.*?)<\/h[2-4]>/gi) || [];
  const questionHeadings = headings.filter(h => /\?|^(how|what|why|when|where|who|can|does|is|are|will|should)/i.test(stripHtml(h)));
  if (questionHeadings.length >= 2) score += 25;
  else if (questionHeadings.length === 1) { score += 12; tips.push("Add more H2/H3 headings phrased as questions. Voice search engines scan for question-format headings."); }
  else tips.push("Rephrase at least 2-3 of your H2 subheadings as questions (e.g. 'How does X work?'). This helps capture voice and PAA traffic.");

  // Short sentences (voice reads at ~7-8 words per phrase)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const shortSentences = sentences.filter(s => s.trim().split(" ").length <= 20);
  const shortRatio = sentences.length > 0 ? shortSentences.length / sentences.length : 0;
  if (shortRatio >= 0.6) score += 25;
  else tips.push("Shorten sentences to under 20 words where possible. Voice assistants read content aloud, so shorter sentences flow better.");

  return { voiceScore: Math.min(100, score), voiceTips: tips.slice(0, 3) };
}

// ─── Visual SEO ────────────────────────────────────────────────
function analyzeVisualSEO(content: string, keyword: string): Array<{ check: string; pass: boolean; tip: string }> {
  const images = content.match(/<img[^>]*>/gi) || [];
  const imagesWithAlt = images.filter(img => /alt=["'][^"']+["']/i.test(img));
  const imagesWithKeywordAlt = images.filter(img => {
    const altMatch = img.match(/alt=["']([^"']*)["']/i);
    return altMatch && keyword && altMatch[1].toLowerCase().includes(keyword.toLowerCase());
  });
  const hasOriginalImageIndicator = images.length > 0;

  return [
    {
      check: `${images.length} image${images.length !== 1 ? "s" : ""} found in content`,
      pass: images.length >= 1,
      tip: "Add at least one image per 300 words. Original images and infographics boost engagement and image search traffic.",
    },
    {
      check: `${imagesWithAlt.length}/${images.length} images have alt text`,
      pass: images.length === 0 || imagesWithAlt.length === images.length,
      tip: "Every image must have descriptive alt text. Alt text helps screen readers, improves accessibility, and tells Google what the image shows.",
    },
    {
      check: keyword ? `Focus keyword in image alt text` : "Keyword alt text (set a focus keyword first)",
      pass: imagesWithKeywordAlt.length > 0,
      tip: `Include your focus keyword "${keyword}" in at least one image's alt text — but keep it natural, not stuffed.`,
    },
    {
      check: "Content uses visual media (images/video/infographic)",
      pass: hasOriginalImageIndicator || /<iframe|<video/i.test(content),
      tip: "Content with original visuals gets 94% more views. Create custom charts, infographics, or screenshots to stand out from AI-generated content.",
    },
  ];
}

// ─── Topic Cluster Suggestions ─────────────────────────────────
function suggestTopicCluster(keyword: string, intent: string, title: string): Array<{ subtopic: string; type: "pillar" | "cluster"; priority: "high" | "medium" | "low" }> {
  const kw = keyword || title;
  const clusters: Array<{ subtopic: string; type: "pillar" | "cluster"; priority: "high" | "medium" | "low" }> = [];

  if (intent === "informational") {
    clusters.push(
      { subtopic: `The Complete Guide to ${kw}`, type: "pillar", priority: "high" },
      { subtopic: `${kw} for Beginners: Everything You Need to Know`, type: "cluster", priority: "high" },
      { subtopic: `${kw} vs [Alternative]: Which Is Better?`, type: "cluster", priority: "high" },
      { subtopic: `Common ${kw} Mistakes (And How to Fix Them)`, type: "cluster", priority: "medium" },
      { subtopic: `${kw} Case Studies and Real Results`, type: "cluster", priority: "medium" },
      { subtopic: `Best Tools for ${kw} in ${new Date().getFullYear()}`, type: "cluster", priority: "low" },
    );
  } else if (intent === "commercial") {
    clusters.push(
      { subtopic: `Best ${kw} Services Reviewed`, type: "pillar", priority: "high" },
      { subtopic: `How to Choose the Right ${kw}`, type: "cluster", priority: "high" },
      { subtopic: `${kw} Pricing: What to Expect`, type: "cluster", priority: "high" },
      { subtopic: `${kw} ROI: Is It Worth It?`, type: "cluster", priority: "medium" },
      { subtopic: `Questions to Ask Before Hiring a ${kw} Agency`, type: "cluster", priority: "medium" },
    );
  } else {
    clusters.push(
      { subtopic: `How to Get Started with ${kw} (Step-by-Step)`, type: "pillar", priority: "high" },
      { subtopic: `${kw} Checklist for Beginners`, type: "cluster", priority: "high" },
      { subtopic: `${kw} Without Experience: Is It Possible?`, type: "cluster", priority: "medium" },
      { subtopic: `${kw} Results: Real Examples`, type: "cluster", priority: "medium" },
    );
  }

  return clusters.slice(0, 6);
}

// ─── FAQ Suggestions ───────────────────────────────────────────
function generateFAQSuggestions(keyword: string, intent: string): string[] {
  const kw = keyword || "this topic";
  if (intent === "informational") {
    return [
      `What is ${kw}?`,
      `How does ${kw} work?`,
      `How long does ${kw} take?`,
      `Is ${kw} free?`,
      `What are the benefits of ${kw}?`,
    ];
  }
  if (intent === "commercial") {
    return [
      `How much does ${kw} cost?`,
      `Is ${kw} right for small businesses?`,
      `What results can I expect from ${kw}?`,
      `How long does it take to see results with ${kw}?`,
      `What is included in a ${kw} package?`,
    ];
  }
  return [
    `How do I start with ${kw}?`,
    `What do I need to ${kw}?`,
    `How quickly can I ${kw}?`,
    `Can anyone ${kw}?`,
  ];
}

// ─── Score Calculator ──────────────────────────────────────────
function scoreContent(wordCount: number, content: string, keyword: string, title: string): { aiScore: number; scoreBreakdown: Record<string, number> } {
  const text = content.toLowerCase();
  const kw = keyword.toLowerCase();
  const hasH2 = /<h2/i.test(content);
  const hasH3 = /<h3/i.test(content);
  const hasImages = /<img/i.test(content);
  const hasLinks = /<a\s/i.test(content);
  const hasList = /<ul|<ol/i.test(content);
  const kwInTitle = title.toLowerCase().includes(kw);
  const kwInContent = text.includes(kw);
  const kwCount = (text.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length;
  const kwDensity = wordCount > 0 ? (kwCount / wordCount) * 100 : 0;

  const semanticCoverage = Math.min(100, Math.round(
    (wordCount >= 800 ? 40 : (wordCount / 800) * 40) +
    (kwInContent ? 25 : 0) +
    (kwDensity >= 0.5 && kwDensity <= 3 ? 20 : 10) +
    (hasImages ? 15 : 0)
  ));

  const topicCompleteness = Math.min(100, Math.round(
    (wordCount >= 1200 ? 50 : (wordCount / 1200) * 50) +
    (hasH2 ? 20 : 0) +
    (hasH3 ? 15 : 0) +
    (hasList ? 15 : 0)
  ));

  const searchIntent = Math.min(100, Math.round(
    (kwInTitle ? 40 : 15) +
    (kwInContent ? 30 : 0) +
    (wordCount >= 400 ? 30 : (wordCount / 400) * 30)
  ));

  const readability = Math.min(100, Math.round(
    (hasList ? 25 : 0) +
    (hasH2 ? 25 : 0) +
    (wordCount >= 300 ? 25 : (wordCount / 300) * 25) +
    (hasImages ? 25 : 10)
  ));

  const structure = Math.min(100, Math.round(
    (hasH2 ? 30 : 0) +
    (hasH3 ? 20 : 0) +
    (hasLinks ? 20 : 0) +
    (hasList ? 15 : 0) +
    (hasImages ? 15 : 0)
  ));

  const aiScore = Math.round((semanticCoverage + topicCompleteness + searchIntent + readability + structure) / 5);
  return { aiScore, scoreBreakdown: { semanticCoverage, topicCompleteness, searchIntent, readability, structure } };
}

// ─── Main Route ────────────────────────────────────────────────
router.post("/analyze", authMiddleware, (req, res) => {
  try {
    const { content = "", title = "", keyword = "", excerpt = "", allPosts = [] } = req.body as {
      content: string; title: string; keyword: string; excerpt: string;
      allPosts: Array<{ slug: string; title: string; excerpt?: string }>;
    };

    const plainContent = stripHtml(content);
    const wordCount = plainContent.split(/\s+/).filter(Boolean).length;

    const { aiScore, scoreBreakdown } = scoreContent(wordCount, content, keyword, title);
    const { intent, explanation: intentExplanation } = detectIntent(title, plainContent);
    const semanticKeywords = extractSemanticKeywords(content, keyword, title);
    const titleVariations = generateTitleVariations(title, keyword);
    const criticalIssues = checkCriticalIssues(title, content, keyword, wordCount);
    const improvements = buildImprovements(wordCount, content, keyword);
    const contentGaps = buildContentGaps(title, keyword, intent);
    const idealStructure = buildIdealStructure(intent, keyword);
    const advanced = buildAdvancedTips(keyword, wordCount);
    const internalLinkSuggestions = findInternalLinks(title, keyword, plainContent, allPosts);

    // 2026 Features
    const { geoScore, geoTips } = analyzeGEO(content, title, keyword, wordCount);
    const paaQuestions = generatePAAQuestions(keyword, intent, title);
    const eeatSignals = analyzeEEAT(content, title);
    const { voiceScore, voiceTips } = analyzeVoiceSearch(content, keyword);
    const visualSeoChecks = analyzeVisualSEO(content, keyword);
    const topicCluster = suggestTopicCluster(keyword, intent, title);
    const faqSuggestions = generateFAQSuggestions(keyword, intent);

    res.json({
      ok: true,
      analysis: {
        aiScore, scoreBreakdown, intent, intentExplanation,
        idealStructure, contentGaps, semanticKeywords,
        titleVariations, criticalIssues, improvements, advanced,
        internalLinkSuggestions,
        // 2026
        geoScore, geoTips,
        paaQuestions,
        eeatSignals,
        voiceScore, voiceTips,
        visualSeoChecks,
        topicCluster,
        faqSuggestions,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Analysis failed" });
  }
});

export default router;
