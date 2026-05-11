import { useEffect, useState, useRef } from "react";
import { useAdmin } from "@/context/AdminContext";
import { API_BASE } from "@/lib/api";
import { blogPosts as DEFAULT_POSTS, defaultSeo, type BlogPost, type PostSeo } from "@/data/blogPosts";
import { ImageCropUploader } from "@/components/admin/ImageCropUploader";
import { ImagePickerField } from "@/components/admin/ImagePickerField";
import { Card } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import {
  Plus, ArrowLeft, Bold, Italic, List, ListOrdered, Quote,
  Link2, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Minus, FileText, Trash2, Edit2, Calendar, Globe, Lock,
  ChevronDown, ChevronUp, Search, Target, Tag, BarChart2,
  CheckCircle, AlertCircle, XCircle, Lightbulb, Share2,
  Code, HelpCircle, Eye, Strikethrough, Underline, Eraser,
  ImagePlus, Table2, X as XIcon, Pilcrow,
  Sparkles, Zap, TrendingUp, RefreshCw, Layers,
} from "lucide-react";

// ─────────────────────────────────────
// SEO ANALYSIS ENGINE
// ─────────────────────────────────────

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function wordCount(html: string) {
  const text = stripHtml(html);
  return text ? text.split(" ").filter(Boolean).length : 0;
}

function getKeywordDensity(content: string, keyword: string): number {
  if (!keyword || !content) return 0;
  const text = stripHtml(content).toLowerCase();
  const kw = keyword.toLowerCase();
  const words = text.split(" ").filter(Boolean);
  const matches = words.filter((w) => w.includes(kw)).length;
  return words.length ? Math.round((matches / words.length) * 1000) / 10 : 0;
}

function detectSearchIntent(keyword: string): PostSeo["searchIntent"] {
  if (!keyword) return "";
  const kw = keyword.toLowerCase();
  if (/\b(buy|price|cost|hire|get|order|service|agency|plan)\b/.test(kw)) return "transactional";
  if (/\b(best|vs|versus|review|compare|top|ranking)\b/.test(kw)) return "commercial";
  if (/\b(how|what|why|when|guide|tutorial|tips|learn|understand)\b/.test(kw)) return "informational";
  return "navigational";
}

const INTENT_LABELS: Record<string, { label: string; color: string }> = {
  informational: { label: "Informational", color: "text-blue-600 bg-blue-50" },
  transactional: { label: "Transactional", color: "text-emerald-700 bg-emerald-50" },
  commercial: { label: "Commercial", color: "text-amber-700 bg-amber-50" },
  navigational: { label: "Navigational", color: "text-purple-700 bg-purple-50" },
};

interface SeoIssue {
  key: string;
  label: string;
  status: "good" | "warn" | "error";
  tip?: string;
}

function computeSeoScore(post: BlogPost, content: string, seo: PostSeo): { score: number; issues: SeoIssue[] } {
  const text = stripHtml(content).toLowerCase();
  const title = post.title.toLowerCase();
  const kw = seo.focusKeyword.toLowerCase().trim();
  const metaDesc = seo.metaDescription.trim();
  const issues: SeoIssue[] = [];
  let score = 0;

  if (!kw) {
    return {
      score: 0,
      issues: [{ key: "kw", label: "Set a focus keyword to start SEO analysis", status: "error" }],
    };
  }

  const kwInTitle = title.includes(kw);
  score += kwInTitle ? 20 : 0;
  issues.push({ key: "title", label: "Focus keyword in post title", status: kwInTitle ? "good" : "error", tip: "Add your keyword to the title" });

  const first150 = text.split(" ").slice(0, 150).join(" ");
  const kwInFirst = first150.includes(kw);
  score += kwInFirst ? 15 : 0;
  issues.push({ key: "intro", label: "Focus keyword in introduction", status: kwInFirst ? "good" : "warn", tip: "Mention the keyword in your first paragraph" });

  const kwInMeta = metaDesc.toLowerCase().includes(kw);
  score += kwInMeta ? 10 : 0;
  issues.push({ key: "meta-kw", label: "Focus keyword in meta description", status: kwInMeta ? "good" : "warn", tip: "Include the keyword in your meta description" });

  const metaLen = metaDesc.length;
  const metaOk = metaLen >= 120 && metaLen <= 160;
  const metaWarn = metaLen > 0 && (metaLen < 120 || metaLen > 160);
  score += metaOk ? 10 : metaWarn ? 5 : 0;
  const metaStatus = metaOk ? "good" : metaLen === 0 ? "error" : "warn";
  issues.push({
    key: "meta-len",
    label: `Meta description length: ${metaLen} chars ${metaOk ? "(perfect)" : metaLen < 120 ? "(too short)" : "(too long)"}`,
    status: metaStatus,
    tip: "Aim for 120-160 characters",
  });

  const wc = wordCount(content);
  const wcScore = wc >= 1000 ? 15 : wc >= 600 ? 10 : wc >= 300 ? 5 : 0;
  score += wcScore;
  const wcStatus = wc >= 600 ? "good" : wc >= 300 ? "warn" : "error";
  issues.push({ key: "wc", label: `Word count: ${wc} words ${wc >= 600 ? "(good)" : wc >= 300 ? "(a bit short)" : "(too short)"}`, status: wcStatus, tip: "Aim for 600+ words" });

  const hasH2 = /<h2/i.test(content) || /^## /m.test(content);
  score += hasH2 ? 10 : 0;
  issues.push({ key: "headings", label: "Uses H2 / H3 headings for structure", status: hasH2 ? "good" : "warn", tip: "Break content into sections with headings" });

  const density = getKeywordDensity(content, kw);
  const densityOk = density >= 0.5 && density <= 3;
  const densityWarn = density > 3;
  score += densityOk ? 10 : 0;
  const densityStatus = densityOk ? "good" : densityWarn ? "warn" : density === 0 ? "error" : "warn";
  issues.push({
    key: "density",
    label: `Keyword density: ${density}% ${densityOk ? "(good)" : densityWarn ? "(over-optimized)" : "(too low)"}`,
    status: densityStatus,
    tip: "Aim for 0.5-3% keyword density",
  });

  const hasSeoTitle = seo.seoTitle.trim().length > 0;
  score += hasSeoTitle ? 5 : 0;
  issues.push({ key: "seo-title", label: "SEO title is set", status: hasSeoTitle ? "good" : "warn", tip: "Set a custom SEO title (can differ from post title)" });

  const hasOgImage = seo.ogImage.trim().length > 0;
  score += hasOgImage ? 5 : 0;
  issues.push({ key: "og", label: "Open Graph image set", status: hasOgImage ? "good" : "warn", tip: "Add an OG image for social sharing previews" });

  return { score, issues };
}

function readabilityAnalysis(content: string) {
  const text = stripHtml(content);
  if (!text) return { label: "No content", score: 0, avgWords: 0 };
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(" ").filter(Boolean);
  const avgWords = sentences.length ? Math.round(words.length / sentences.length) : 0;
  let score = 100;
  if (avgWords > 25) score -= 30;
  else if (avgWords > 20) score -= 15;
  else if (avgWords > 15) score -= 5;
  const label = score >= 80 ? "Easy to read" : score >= 60 ? "Fairly readable" : "Difficult to read";
  return { label, score, avgWords };
}

function getInternalLinkSuggestions(currentSlug: string, content: string, allPosts: BlogPost[]): BlogPost[] {
  const text = stripHtml(content).toLowerCase();
  return allPosts
    .filter((p) => p.slug !== currentSlug)
    .map((p) => {
      const titleWords = p.title.toLowerCase().split(" ").filter((w) => w.length > 4);
      const matches = titleWords.filter((w) => text.includes(w)).length;
      return { post: p, matches };
    })
    .filter((x) => x.matches >= 2)
    .sort((a, b) => b.matches - a.matches)
    .slice(0, 4)
    .map((x) => x.post);
}

// ─────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";
  return (
    <div className="flex items-center gap-3">
      <svg width={72} height={72} className="shrink-0">
        <circle cx={36} cy={36} r={radius} fill="none" stroke="#0B0B0B10" strokeWidth={6} />
        <circle
          cx={36} cy={36} r={radius} fill="none"
          stroke={color} strokeWidth={6}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dasharray 0.4s ease" }}
        />
        <text x={36} y={36} textAnchor="middle" dominantBaseline="middle" fontSize={14} fontWeight={800} fill="#0B0B0B">{score}</text>
      </svg>
      <div>
        <p className="text-[13px] font-bold text-[#0B0B0B]">{score >= 75 ? "Good" : score >= 50 ? "Needs Work" : "Poor"}</p>
        <p className="text-[11px] text-[#0B0B0B]/45">SEO Score</p>
      </div>
    </div>
  );
}

function IssueIcon({ status }: { status: "good" | "warn" | "error" }) {
  if (status === "good") return <CheckCircle size={13} className="text-emerald-600 shrink-0 mt-0.5" />;
  if (status === "warn") return <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />;
  return <XCircle size={13} className="text-red-500 shrink-0 mt-0.5" />;
}

function SidePanel({ title, children, defaultOpen = true, icon }: { title: string; children: React.ReactNode; defaultOpen?: boolean; icon?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#0B0B0B]/10 rounded-xl overflow-hidden mb-3 bg-white">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#0B0B0B]/4 hover:bg-[#0B0B0B]/7 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-[#0B0B0B]/40">{icon}</span>}
          <span className="text-[11px] font-bold text-[#0B0B0B]/70 uppercase tracking-widest">{title}</span>
        </div>
        {open ? <ChevronUp size={12} className="text-[#0B0B0B]/35" /> : <ChevronDown size={12} className="text-[#0B0B0B]/35" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#0B0B0B]/6 last:border-0">
      <span className="text-[12px] text-[#0B0B0B]/50">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function CharCount({ val, max, warn = max * 0.75 }: { val: number; max: number; warn?: number }) {
  const color = val > max ? "text-red-500" : val >= warn ? "text-amber-600" : "text-[#0B0B0B]/35";
  return <span className={`text-[10px] font-mono ${color}`}>{val}/{max}</span>;
}

function ToolBtn({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className="p-1.5 rounded hover:bg-[#0B0B0B]/8 transition-colors text-[#0B0B0B]/55 hover:text-[#0B0B0B]"
    >
      {icon}
    </button>
  );
}

const TAGS = ["Founders", "Brand", "Creators", "Freelancers", "Strategy", "Tools"];

const COLOR_SWATCHES = [
  { color: "#0B0B0B", label: "Black" },
  { color: "#5F5F5F", label: "Dark gray" },
  { color: "#8A8A8A", label: "Gray" },
  { color: "#1E293B", label: "Ink blue" },
  { color: "#8B3A1A", label: "Burnt rust" },
  { color: "#C2A878", label: "Gold" },
  { color: "#dc2626", label: "Red" },
  { color: "#2563eb", label: "Blue" },
  { color: "#16a34a", label: "Green" },
  { color: "#d97706", label: "Amber" },
  { color: "#7c3aed", label: "Purple" },
  { color: "#0891b2", label: "Cyan" },
  { color: "#be185d", label: "Pink" },
  { color: "#ffffff", label: "White" },
];

const POWER_WORDS = ["free","best","proven","ultimate","complete","guide","secret","powerful","easy","quick","simple","new","boost","grow","master","essential","top","expert","step-by-step","how to","why","what","when","discover","unlock","transform","scale","build","win","success","guaranteed","exclusive","advanced","definitive","comprehensive","actionable","effective","smart","winning","profitable"];

type CheckFix = {
  tip: string;
  copy?: string;
  applyField?: string;
  applyValue?: string;
  insertInContent?: string;
};
type CheckItem = { key: string; label: string; pass: boolean; warn: boolean; fix?: CheckFix };

function yoastChecks(post: BlogPost, content: string, seo: PostSeo, allPosts: BlogPost[]): {
  basic: CheckItem[]; additional: CheckItem[]; title: CheckItem[]; readability: CheckItem[]; seo2026: CheckItem[];
} {
  const text = stripHtml(content).toLowerCase();
  const rawTitle = seo.seoTitle || post.title;
  const kw = seo.focusKeyword.toLowerCase().trim();
  const seoTitle = rawTitle.toLowerCase();
  const metaDesc = seo.metaDescription.toLowerCase();
  const slug = post.slug.toLowerCase();
  const wc = wordCount(content);
  const density = kw ? getKeywordDensity(content, kw) : 0;
  const first10pct = text.split(" ").slice(0, Math.max(1, Math.ceil(wc * 0.1))).join(" ");
  const year = new Date().getFullYear();

  // Basic SEO
  const kwInSeoTitle = kw ? seoTitle.includes(kw) : false;
  const kwInMetaDesc = kw ? metaDesc.includes(kw) : false;
  const kwInSlug = kw ? (slug.includes(kw) || slug.includes(kw.replace(/\s+/g, "-"))) : false;
  const kwInFirst = kw ? first10pct.includes(kw) : false;
  const kwInContent = kw ? text.includes(kw) : false;
  const wcGood = wc >= 600;

  // Additional
  const subheadings = content.match(/<h[23][^>]*>(.*?)<\/h[23]>/gi) || [];
  const kwInSub = kw ? subheadings.some(h => stripHtml(h).toLowerCase().includes(kw)) : false;
  const hasImages = /<img/i.test(content);
  const densityOk = density >= 0.5 && density <= 3.0;
  const urlShort = slug.length <= 75 && slug.length > 0;
  const hasInternal = /href=["']\//i.test(content);
  const kwUsedElsewhere = kw ? allPosts.filter(p => p.slug !== post.slug).some(p => (p.seo?.focusKeyword || "").toLowerCase() === kw) : false;

  // Title readability
  const kwAtStart = kw ? seoTitle.trimStart().startsWith(kw) : false;
  const titleHasPowerWord = POWER_WORDS.some(w => seoTitle.includes(w));
  const titleHasNumber = /\d/.test(rawTitle);

  // Content readability
  const paragraphs = content.split(/<\/p>/i).filter(p => p.trim());
  const shortParas = paragraphs.length === 0 || paragraphs.every(p => stripHtml(p).split(" ").length <= 150);
  const hasMedia = /<img|<video|<iframe/i.test(content);
  const hasSubheadings = /<h[23]/i.test(content);

  const kwSuggested = kw || "your keyword";
  const titleSuggested = kw ? `${kw.charAt(0).toUpperCase() + kw.slice(1)}: ${rawTitle}` : rawTitle;
  const metaSuggested = kw
    ? `${rawTitle} - Learn everything about ${kw} in this complete guide. Practical tips, real examples, and expert strategies for ${year}.`
    : "";
  const slugSuggested = kw ? kw.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") : slug;
  const wordsNeeded = Math.max(0, 600 - wc);

  return {
    basic: [
      {
        key: "title-kw",
        label: kwInSeoTitle
          ? `Your topic word "${kw}" is in the page title.`
          : `Your topic word is missing from the page title.`,
        pass: kwInSeoTitle, warn: false,
        fix: kwInSeoTitle || !kw ? undefined : {
          tip: `The page title is the big blue text people see when your post shows up in Google. Adding your topic word "${kw}" there tells Google exactly what your post is about. Click "Apply Fix" - it's done in one click.`,
          copy: titleSuggested,
          applyField: "seoTitle",
          applyValue: titleSuggested,
        },
      },
      {
        key: "meta-kw",
        label: kwInMetaDesc
          ? `Your topic word "${kw}" is in the Google preview description.`
          : `Your topic word is missing from the Google preview description.`,
        pass: kwInMetaDesc, warn: false,
        fix: kwInMetaDesc || !kw ? undefined : {
          tip: `The Google preview description is the small grey text that appears under your title in search results. It helps people decide if they want to click your post. Click "Apply Fix" to add a ready-made description with your topic word.`,
          copy: metaSuggested,
          applyField: "metaDescription",
          applyValue: metaSuggested,
        },
      },
      {
        key: "slug-kw",
        label: kwInSlug
          ? `Your web address (URL) includes your topic word.`
          : `Your web address (URL) doesn't include your topic word.`,
        pass: kwInSlug, warn: false,
        fix: kwInSlug || !kw ? undefined : {
          tip: `Your URL is the website address shown in the browser - like yoursite.com/your-topic. A short, clean URL with your topic word helps Google rank your post better. Click "Apply Fix" to update it automatically.`,
          copy: slugSuggested,
          applyField: "slug",
          applyValue: slugSuggested,
        },
      },
      {
        key: "first10",
        label: kwInFirst
          ? `Your topic word appears in the very first paragraph.`
          : `Your topic word doesn't appear in the first paragraph.`,
        pass: kwInFirst, warn: false,
        fix: kwInFirst || !kw ? undefined : {
          tip: `Google reads your first paragraph first to understand what the post is about. Mentioning your topic "${kwSuggested}" right at the start makes a big difference. Click "Insert into Editor" to add a ready-made opening sentence.`,
          copy: `${kwSuggested.charAt(0).toUpperCase() + kwSuggested.slice(1)} is one of the most effective strategies for growing your business online. In this guide, we'll walk through everything you need to know about ${kwSuggested}.`,
          insertInContent: `<p>${kwSuggested.charAt(0).toUpperCase() + kwSuggested.slice(1)} is one of the most effective strategies for growing your business online. In this guide, we'll walk through everything you need to know about ${kwSuggested}.</p>`,
        },
      },
      {
        key: "content-kw",
        label: kwInContent
          ? `Your topic word appears in the article.`
          : `Your topic word doesn't appear anywhere in the article.`,
        pass: kwInContent, warn: false,
        fix: kwInContent || !kw ? undefined : {
          tip: `Google matches your post to what people search by reading the words in your article. If your topic word isn't there, Google won't know what your post is about. Copy and paste this example paragraph into your article to get started:`,
          copy: `Understanding ${kwSuggested} is essential for anyone looking to improve their results. The key principles of ${kwSuggested} include consistency, a clear plan, and taking action every day.`,
        },
      },
      {
        key: "word-count",
        label: wc >= 600
          ? `Your post is ${wc} words long - good length!`
          : wc >= 300
            ? `Your post is ${wc} words - a bit short. Add ${wordsNeeded} more words.`
            : `Your post is only ${wc} words - too short. Add at least ${wordsNeeded} more words.`,
        pass: wcGood, warn: wc >= 300 && wc < 600,
        fix: wcGood ? undefined : {
          tip: `Short posts usually don't rank well because they don't fully cover a topic. You need ${wordsNeeded} more words. Click "Insert into Editor" to add 3 ready-made sections straight into your post - then just fill in your own content.`,
          copy: `<h2>Common Mistakes to Avoid with ${kwSuggested}</h2>\n<p>Many people make the mistake of...</p>\n\n<h2>Step-by-Step Guide to ${kwSuggested}</h2>\n<p>Follow these steps to get started:</p>\n<ol><li>Step one...</li><li>Step two...</li><li>Step three...</li></ol>\n\n<h2>Frequently Asked Questions</h2>\n<h3>What is ${kwSuggested}?</h3>\n<p>${kwSuggested.charAt(0).toUpperCase() + kwSuggested.slice(1)} is...</p>`,
          insertInContent: `<h2>Common Mistakes to Avoid with ${kwSuggested}</h2>\n<p>Many people make the mistake of...</p>\n\n<h2>Step-by-Step Guide to ${kwSuggested}</h2>\n<p>Follow these steps to get started:</p>\n<ol><li>Step one...</li><li>Step two...</li><li>Step three...</li></ol>`,
        },
      },
    ],
    additional: [
      {
        key: "sub-kw",
        label: kwInSub
          ? `A section heading inside your post includes your topic word.`
          : `None of your section headings include your topic word "${kw}".`,
        pass: kwInSub, warn: false,
        fix: kwInSub || !kw ? undefined : {
          tip: `Section headings are the bold titles inside your post (like "What is X?" or "How X Works"). Having your topic word "${kwSuggested}" in at least one heading helps Google understand your post. Click "Insert into Editor" to add one.`,
          copy: `<h2>What is ${kwSuggested} and Why Does It Matter?</h2>`,
          insertInContent: `<h2>What is ${kwSuggested} and Why Does It Matter?</h2>\n<p>Understanding ${kwSuggested} is the first step to achieving real results. Here's everything you need to know.</p>`,
        },
      },
      {
        key: "img-kw",
        label: hasImages ? "Your post has images." : "Your post has no images.",
        pass: hasImages, warn: false,
        fix: hasImages ? undefined : {
          tip: `Posts with images get far more readers and stay higher in search results. Use the image button (the mountain icon in the toolbar above the editor) to upload a photo. Even one image makes a big difference.`,
          copy: `<img src="/uploads/your-image.jpg" alt="${kwSuggested} guide" width="800" height="450" />`,
        },
      },
      {
        key: "density",
        label: densityOk
          ? `You use your topic word the right amount (${density}%).`
          : density > 3
            ? `You use your topic word too many times (${density}%) - it looks spammy.`
            : `You barely use your topic word (${density}%) - mention it more.`,
        pass: densityOk, warn: density > 3,
        fix: densityOk ? undefined : density > 3 ? {
          tip: `You've mentioned "${kw}" so often it may look like spam to Google. Try replacing some uses with related phrases or just remove a few. Write naturally - don't repeat the same word over and over.`,
        } : {
          tip: `Your topic word "${kw}" only appears a tiny amount in your post. Naturally mention it a few more times as you write about your topic. There's no need to force it - just write clearly about what the post is about.`,
        },
      },
      {
        key: "url-len",
        label: urlShort
          ? `Your web address (URL) is a good length (${slug.length} characters).`
          : `Your web address (URL) is too long (${slug.length} characters).`,
        pass: urlShort, warn: false,
        fix: urlShort ? undefined : {
          tip: `Short URLs are much easier to read and share. Keep your URL to just 3-5 key words. Click "Apply Fix" to shorten it automatically.`,
          copy: slugSuggested.split("-").slice(0, 5).join("-"),
          applyField: "slug",
          applyValue: slugSuggested.split("-").slice(0, 5).join("-"),
        },
      },
      {
        key: "internal",
        label: hasInternal
          ? "Your post links to other pages on your website."
          : "Your post doesn't link to any other pages on your website.",
        pass: hasInternal, warn: false,
        fix: hasInternal ? undefined : {
          tip: `Linking to your other blog posts keeps readers on your site longer and helps Google discover all your content. Select some text in your post, then use the link button in the toolbar to add a link to another one of your posts.`,
          copy: `<a href="/blog/related-post-slug">Learn more about this topic</a>`,
        },
      },
      {
        key: "kw-unique",
        label: kwUsedElsewhere
          ? `Another one of your posts already targets the same topic word - they'll compete with each other.`
          : "Your topic word is unique - no other post uses the same one.",
        pass: !kwUsedElsewhere, warn: kwUsedElsewhere,
        fix: kwUsedElsewhere ? {
          tip: `When two of your posts fight for the same keyword, both of them rank lower. Try adding "${year}" or a word like "beginners" or "guide" to make this one different. Click "Apply Fix" to add the year automatically.`,
          copy: `${kw} ${year}`,
          applyField: "focusKeyword",
          applyValue: `${kw} ${year}`,
        } : undefined,
      },
    ],
    title: [
      {
        key: "kw-start",
        label: kwAtStart
          ? `Your topic word is at the very beginning of the title.`
          : `Your topic word is not at the beginning of the title.`,
        pass: kwAtStart, warn: false,
        fix: kwAtStart || !kw ? undefined : {
          tip: `Google pays more attention to the first words in a title. Moving your topic word to the very start can boost your ranking. Click "Apply Fix" - it'll rearrange your title automatically.`,
          copy: titleSuggested,
          applyField: "seoTitle",
          applyValue: titleSuggested,
        },
      },
      {
        key: "power",
        label: titleHasPowerWord
          ? "Your title has a strong hook word - great for clicks!"
          : `Your title doesn't have a hook word to encourage people to click.`,
        pass: titleHasPowerWord, warn: false,
        fix: titleHasPowerWord ? undefined : {
          tip: `Words like "Ultimate", "Proven", "Simple", "Complete", or "Step-by-Step" make people far more likely to click your post when they see it in Google. Click "Apply Fix" to add one to your title now.`,
          copy: `The Ultimate Guide to ${rawTitle} (${year})`,
          applyField: "seoTitle",
          applyValue: `The Ultimate Guide to ${rawTitle} (${year})`,
        },
      },
      {
        key: "number",
        label: titleHasNumber
          ? "Your title has a number in it - good for clicks!"
          : "Your title doesn't have a number - adding one gets more clicks.",
        pass: titleHasNumber, warn: !titleHasNumber,
        fix: titleHasNumber ? undefined : {
          tip: `Titles with numbers like "7 Tips" or "5 Ways" get clicked much more often. People love knowing exactly how many things they'll learn. Click "Apply Fix" to add a number to your title.`,
          copy: `7 ${rawTitle} Strategies That Actually Work`,
          applyField: "seoTitle",
          applyValue: `7 ${rawTitle} Strategies That Actually Work`,
        },
      },
    ],
    readability: [
      {
        key: "short-para",
        label: shortParas
          ? "Your paragraphs are short and easy to read."
          : "Some paragraphs are too long and hard to read.",
        pass: shortParas, warn: false,
        fix: shortParas ? undefined : {
          tip: `Long walls of text are hard to read and make people leave your page. Break your writing into short chunks - aim for 2-3 sentences per paragraph. Press Enter more often to create breathing room between your ideas.`,
        },
      },
      {
        key: "media",
        label: hasMedia
          ? "Your post has images or videos."
          : "Your post has no photos or videos.",
        pass: hasMedia, warn: false,
        fix: hasMedia ? undefined : {
          tip: `Posts with images or videos keep readers engaged much longer. Use the image button (mountain icon) in the writing toolbar above to add a photo. Even one image makes your post feel much more professional.`,
          copy: `<img src="/uploads/your-image.jpg" alt="${kwSuggested}" width="800" height="450" />`,
        },
      },
      {
        key: "subheadings",
        label: hasSubheadings
          ? "Your post has section headings to guide the reader."
          : "Your post has no section headings.",
        pass: hasSubheadings, warn: false,
        fix: hasSubheadings ? undefined : {
          tip: `Section headings are bold titles inside your post that break it into chunks - like chapters in a book. They make your post much easier to read, and they help Google understand what each part covers. Click "Insert into Editor" to add 4 ready-made headings.`,
          copy: `<h2>What is ${kwSuggested}?</h2>\n<h2>How ${kwSuggested} Works</h2>\n<h2>Key Benefits of ${kwSuggested}</h2>\n<h2>Getting Started with ${kwSuggested}</h2>`,
          insertInContent: `<h2>What is ${kwSuggested}?</h2>\n<p>Content here...</p>\n<h2>How ${kwSuggested} Works</h2>\n<p>Content here...</p>`,
        },
      },
    ],
    seo2026: (() => {
      const textFull = stripHtml(content).toLowerCase();
      const hasDirectIntroAnswer = kw ? textFull.slice(0, 300).includes(kw) : false;
      const hasFirstPerson = /\b(i |we |our |my |i've|we've)\b/.test(textFull);
      const hasCitations = /<a\s[^>]*href=["']https?:\/\/(?!growitbuddy)/i.test(content);
      const imgs = content.match(/<img[^>]*>/gi) || [];
      const allImgsHaveAlt = imgs.length === 0 || imgs.every(img => /alt=["'][^"']+["']/i.test(img));
      const hasFAQSection = /\b(faq|frequently asked|q:|\bq\.)\b/i.test(textFull);
      const heads = content.match(/<h[2-4][^>]*>(.*?)<\/h[2-4]>/gi) || [];
      const hasQuestionHeadings = heads.some(h => /\?/i.test(stripHtml(h)));
      const hasNumberedList = /<ol/i.test(content);
      const hasDefinitionPattern = /\b(is\s+a|are\s+a|refers to|is defined as|means)\b/i.test(textFull.slice(0, 500));
      const missingAltImgs = imgs.filter(img => !/alt=["'][^"']+["']/i.test(img));

      return [
        {
          key: "geo-intro",
          label: hasDirectIntroAnswer
            ? `Your topic word appears in the very first paragraph - Google and AI tools can find it easily.`
            : `Your topic word is missing from the very first paragraph.`,
          pass: hasDirectIntroAnswer, warn: false,
          fix: hasDirectIntroAnswer || !kw ? undefined : {
            tip: `Google's AI assistant reads your first paragraph to give quick answers to searchers. If your topic isn't mentioned right away, your post might get skipped. Click "Insert into Editor" to add a ready-made first sentence that includes your topic.`,
            copy: `${kwSuggested.charAt(0).toUpperCase() + kwSuggested.slice(1)} is a powerful approach that helps businesses grow faster and more efficiently. In this guide, we cover everything you need to know about ${kwSuggested}.`,
            insertInContent: `<p>${kwSuggested.charAt(0).toUpperCase() + kwSuggested.slice(1)} is a powerful approach that helps businesses grow faster and more efficiently. In this guide, we cover everything you need to know about ${kwSuggested}.</p>`,
          },
        },
        {
          key: "eeat-first-person",
          label: hasFirstPerson
            ? "Your post mentions personal experience (I/We/Our) - builds reader trust."
            : `Your post doesn't mention any personal experience.`,
          pass: hasFirstPerson, warn: !hasFirstPerson,
          fix: hasFirstPerson ? undefined : {
            tip: `Google trusts posts more when the author shares their own real experience. Adding just one or two sentences with "I" or "We" makes your post feel much more credible and human. Click "Insert into Editor" for a ready-made example.`,
            copy: `In my experience working with clients on ${kwSuggested}, the biggest difference-maker is consistency. We've seen businesses grow 3x faster simply by applying these principles.`,
            insertInContent: `<p>In my experience working with clients on ${kwSuggested}, the biggest difference-maker is consistency. We've seen businesses grow 3x faster simply by applying these principles.</p>`,
          },
        },
        {
          key: "eeat-citations",
          label: hasCitations
            ? "Your post links to an outside source - builds reader and Google trust."
            : "Your post doesn't link to any outside websites as proof or references.",
          pass: hasCitations, warn: !hasCitations,
          fix: hasCitations ? undefined : {
            tip: `Linking to a well-known website, research study, or industry publication makes your post look more trustworthy to Google and to your readers. Add one sentence that references an outside source. Click "Insert into Editor" for a ready-made example.`,
            copy: `According to recent industry research, businesses that implement ${kwSuggested} see an average of 40% improvement in key metrics. <a href="https://www.source.com" rel="noopener noreferrer">Source</a>`,
            insertInContent: `<p>According to recent industry research, businesses that implement ${kwSuggested} see an average of 40% improvement in key metrics. (<a href="https://www.source.com" rel="noopener noreferrer">Source</a>)</p>`,
          },
        },
        {
          key: "visual-alt",
          label: imgs.length === 0
            ? "Your post has no images - add at least one with a description."
            : allImgsHaveAlt
              ? `All ${imgs.length} image(s) have descriptions (alt text).`
              : `${missingAltImgs.length} image(s) are missing a description (alt text).`,
          pass: allImgsHaveAlt && imgs.length > 0, warn: imgs.length === 0,
          fix: (allImgsHaveAlt && imgs.length > 0) ? undefined : imgs.length === 0 ? {
            tip: `Adding an image makes your post more engaging and helps it appear in Google Image Search. Upload one using the image button in the toolbar above, or copy this HTML and replace the file path.`,
            copy: `<img src="/uploads/image-name.jpg" alt="${kwSuggested} guide and tips" width="800" height="450" />`,
          } : {
            tip: `Alt text is a short description you add to each image - it tells Google what the image shows. Without it, Google ignores the image. Every <img> tag needs an alt="..." part. Here's how it looks:`,
            copy: `<img src="/uploads/image.jpg" alt="${kwSuggested} - step by step guide" width="800" height="450" />`,
          },
        },
        {
          key: "voice-faq",
          label: hasFAQSection
            ? "Your post has a FAQ section - great for voice search and Google answer boxes."
            : "Your post is missing a FAQ (Questions & Answers) section.",
          pass: hasFAQSection, warn: !hasFAQSection,
          fix: hasFAQSection ? undefined : {
            tip: `When someone asks Siri, Alexa, or Google Assistant a question out loud, it reads answers directly from FAQ sections of blog posts. Google also shows FAQ content in the "People Also Ask" boxes. Click "Insert into Editor" to add a complete FAQ section instantly.`,
            copy: `<h2>Frequently Asked Questions About ${kwSuggested.charAt(0).toUpperCase() + kwSuggested.slice(1)}</h2>\n<h3>What is ${kwSuggested}?</h3>\n<p>${kwSuggested.charAt(0).toUpperCase() + kwSuggested.slice(1)} is a method that helps you achieve specific goals by following a structured approach.</p>\n<h3>How long does ${kwSuggested} take?</h3>\n<p>Most people start seeing results within 4-8 weeks of consistently applying these strategies.</p>\n<h3>Is ${kwSuggested} right for my business?</h3>\n<p>Yes - ${kwSuggested} works for businesses of all sizes. Whether you're just starting out or running a growing team, the core principles apply.</p>`,
            insertInContent: `<h2>Frequently Asked Questions About ${kwSuggested.charAt(0).toUpperCase() + kwSuggested.slice(1)}</h2>\n<h3>What is ${kwSuggested}?</h3>\n<p>${kwSuggested.charAt(0).toUpperCase() + kwSuggested.slice(1)} is a method that helps you achieve specific goals through a structured approach.</p>\n<h3>How long does ${kwSuggested} take?</h3>\n<p>Most people see results within 4-8 weeks of consistently applying these strategies.</p>`,
          },
        },
        {
          key: "voice-q-headings",
          label: hasQuestionHeadings
            ? "Some of your headings are written as questions - great for search."
            : "None of your section headings are written as questions.",
          pass: hasQuestionHeadings, warn: !hasQuestionHeadings,
          fix: hasQuestionHeadings ? undefined : {
            tip: `Headings that are written as questions (like "How does X work?") match exactly what people type into Google. These headings also appear in Google's "People Also Ask" boxes, which can send you a lot of extra traffic. Click "Insert into Editor" for 3 ready-made question headings.`,
            copy: `<h2>What is ${kwSuggested} and How Does It Work?</h2>\n<h2>How Long Does It Take to See Results with ${kwSuggested.charAt(0).toUpperCase() + kwSuggested.slice(1)}?</h2>\n<h2>Is ${kwSuggested.charAt(0).toUpperCase() + kwSuggested.slice(1)} Right for Your Business?</h2>`,
            insertInContent: `<h2>What is ${kwSuggested} and How Does It Work?</h2>\n<p>Content here...</p>`,
          },
        },
        {
          key: "geo-definition",
          label: hasDefinitionPattern
            ? `Your post explains what your topic is in the intro - great for Google answer boxes.`
            : "Your post doesn't explain what your topic is at the beginning.",
          pass: hasDefinitionPattern, warn: !hasDefinitionPattern,
          fix: hasDefinitionPattern ? undefined : {
            tip: `Google loves posts that start with a clear, simple explanation of the topic - like a dictionary definition. Adding one sentence near the top like "[Topic] is..." can get your post shown in Google's featured answer boxes. Click "Insert into Editor" to add a ready-made definition.`,
            copy: `${kwSuggested.charAt(0).toUpperCase() + kwSuggested.slice(1)} is a strategic approach that helps businesses and individuals achieve consistent results by focusing on the right actions, in the right order.`,
            insertInContent: `<p>${kwSuggested.charAt(0).toUpperCase() + kwSuggested.slice(1)} is a strategic approach that helps businesses achieve consistent results by focusing on the right actions in the right order.</p>`,
          },
        },
        {
          key: "paa-list",
          label: hasNumberedList
            ? "Your post has a numbered list - great for appearing in Google search results."
            : "Your post has no numbered step-by-step list.",
          pass: hasNumberedList, warn: !hasNumberedList,
          fix: hasNumberedList ? undefined : {
            tip: `Numbered step-by-step lists are the most common type of content that Google highlights directly in search results. If your post has any tips, steps, or a process - format them as a numbered list. Click "Insert into Editor" to add a complete 5-step list instantly.`,
            copy: `<h2>How to Get Started with ${kwSuggested.charAt(0).toUpperCase() + kwSuggested.slice(1)} (Step by Step)</h2>\n<ol>\n  <li><strong>Step 1: Define your goal</strong> - Start by writing down exactly what you want to achieve.</li>\n  <li><strong>Step 2: Research your audience</strong> - Find out who you're trying to help and what they need.</li>\n  <li><strong>Step 3: Create your plan</strong> - Map out your approach based on your goals.</li>\n  <li><strong>Step 4: Take action every day</strong> - Consistency is the most important factor.</li>\n  <li><strong>Step 5: Track and improve</strong> - See what works and do more of it.</li>\n</ol>`,
            insertInContent: `<h2>How to Get Started with ${kwSuggested.charAt(0).toUpperCase() + kwSuggested.slice(1)} (Step by Step)</h2>\n<ol>\n  <li><strong>Step 1: Define your goal</strong> - Write down exactly what you want to achieve.</li>\n  <li><strong>Step 2: Research your audience</strong> - Find out what they need.</li>\n  <li><strong>Step 3: Create your plan</strong> - Map out your approach.</li>\n  <li><strong>Step 4: Take action every day</strong> - Consistency is key.</li>\n  <li><strong>Step 5: Track and improve</strong> - See what works and do more of it.</li>\n</ol>`,
          },
        },
      ];
    })(),
  };
}

// ─────────────────────────────────────
// MARKDOWN ↔ HTML HELPERS
// ─────────────────────────────────────

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function isHtmlContent(text: string): boolean {
  return /<(h[1-6]|p|blockquote|ul|ol|li|strong|em|br)\b/i.test(text);
}

function mdToHtml(md: string): string {
  if (!md || isHtmlContent(md)) return md;
  const lines = md.split("\n");
  let html = "";
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (!t) { i++; continue; }
    if (t.startsWith("## ")) { html += `<h2>${inlineFormat(t.slice(3))}</h2>`; i++; continue; }
    if (t.startsWith("### ")) { html += `<h3>${inlineFormat(t.slice(4))}</h3>`; i++; continue; }
    if (t.startsWith("> ")) { html += `<blockquote>${inlineFormat(t.slice(2))}</blockquote>`; i++; continue; }
    if (t.startsWith("- ") || t.startsWith("* ")) {
      html += "<ul>";
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
        html += `<li>${inlineFormat(lines[i].trim().slice(2))}</li>`; i++;
      }
      html += "</ul>"; continue;
    }
    if (/^\d+\.\s/.test(t)) {
      html += "<ol>";
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        html += `<li>${inlineFormat(lines[i].trim().replace(/^\d+\.\s/, ""))}</li>`; i++;
      }
      html += "</ol>"; continue;
    }
    html += `<p>${inlineFormat(t)}</p>`; i++;
  }
  return html;
}

const EDITOR_CSS = `
.blog-editor { font-family: Inter, sans-serif; }
.blog-editor p { font-size: 17px; color: rgba(11,11,11,0.68); line-height: 1.9; margin: 0 0 18px 0; }
.blog-editor h1 { font-weight: 900; font-size: 36px; letter-spacing: -0.04em; color: #0B0B0B; margin: 0 0 16px 0; line-height: 1.1; }
.blog-editor h2 { font-weight: 800; font-size: 26px; letter-spacing: -0.03em; color: #0B0B0B; margin: 0 0 18px 0; line-height: 1.25; }
.blog-editor h3 { font-weight: 700; font-size: 20px; letter-spacing: -0.02em; color: #0B0B0B; margin: 0 0 12px 0; line-height: 1.35; }
.blog-editor h4 { font-weight: 700; font-size: 17px; color: #0B0B0B; margin: 0 0 10px 0; }
.blog-editor blockquote { margin: 28px 0; padding: 18px 22px; border-left: 3px solid #0B0B0B; background: rgba(11,11,11,0.03); border-radius: 0 12px 12px 0; }
.blog-editor blockquote p, .blog-editor blockquote { font-size: 17px; font-weight: 600; color: #0B0B0B; line-height: 1.7; font-style: italic; }
.blog-editor ul { margin: 20px 0; padding-left: 22px; list-style: disc; }
.blog-editor ol { margin: 20px 0; padding-left: 22px; list-style: decimal; }
.blog-editor li { font-size: 16px; color: rgba(11,11,11,0.7); line-height: 1.8; margin-bottom: 10px; padding-left: 4px; }
.blog-editor strong { font-weight: 700; color: #0B0B0B; }
.blog-editor em { font-style: italic; }
.blog-editor a { color: #0B0B0B; text-decoration: underline; }
.blog-editor hr { border: none; border-top: 1.5px solid rgba(11,11,11,0.1); margin: 36px 0; }
`;

// ─────────────────────────────────────
// POST EDITOR
// ─────────────────────────────────────

type AiAnalysis = {
  aiScore: number;
  scoreBreakdown: { semanticCoverage: number; topicCompleteness: number; searchIntent: number; readability: number; structure: number };
  intent: "informational" | "commercial" | "transactional";
  intentExplanation: string;
  idealStructure: string[];
  contentGaps: string[];
  semanticKeywords: Array<{ term: string; placement: string }>;
  titleVariations: Array<{ title: string; ctrScore: number; hook: string }>;
  criticalIssues: string[];
  improvements: string[];
  advanced: string[];
  internalLinkSuggestions: Array<{ slug: string; title: string; anchorText: string; reason: string }>;
  // 2026 SEO
  geoScore: number;
  geoTips: string[];
  paaQuestions: string[];
  eeatSignals: Array<{ signal: string; found: boolean; tip: string; category: string }>;
  voiceScore: number;
  voiceTips: string[];
  visualSeoChecks: Array<{ check: string; pass: boolean; tip: string }>;
  topicCluster: Array<{ subtopic: string; type: "pillar" | "cluster"; priority: "high" | "medium" | "low" }>;
  faqSuggestions: string[];
};

function PostEditor({
  post, isNew, onBack, onSave, allPosts,
}: {
  post: BlogPost; isNew: boolean; onBack: () => void; onSave: (p: BlogPost) => Promise<void>; allPosts: BlogPost[];
}) {
  const { authFetch } = useAdmin();
  const AI_SEO_URL = API_BASE + "/admin/ai-seo/analyze";
  const ADMIN_API = API_BASE + "/admin";
  const [data, setData] = useState<BlogPost>(post);
  const [seo, setSeo] = useState<PostSeo>({ ...defaultSeo(), ...post.seo });
  const [mode, setMode] = useState<"visual" | "text">("visual");
  const [activeTab, setActiveTab] = useState<"write" | "seo">("write");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">(post.status ?? "published");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: "success" | "error" | "info" }[]>([]);
  const [currentBlock, setCurrentBlock] = useState("p");
  const [blockDropOpen, setBlockDropOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [expandedFix, setExpandedFix] = useState<string | null>(null);
  const [copiedFix, setCopiedFix] = useState<string | null>(null);
  const [showImgModal, setShowImgModal] = useState(false);
  const [imgAlt, setImgAlt] = useState("");
  const [imgUploadFile, setImgUploadFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [mediaLib, setMediaLib] = useState<{ url: string; filename: string }[]>([]);
  const [mediaLibLoading, setMediaLibLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const imgFileInputRef = useRef<HTMLInputElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentTextColor, setCurrentTextColor] = useState("#0B0B0B");
  const colorPickerRef = useRef<HTMLDivElement>(null);

  function copyFix(key: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFix(key);
      setTimeout(() => setCopiedFix(null), 2000);
    });
  }

  function insertFix(html: string) {
    if (editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel) sel.collapse(editorRef.current, editorRef.current.childNodes.length);
      document.execCommand("insertHTML", false, html);
      setField("content", editorRef.current.innerHTML);
      showToast("Content added to editor", "success");
    }
  }

  function applyFix(field: string, value: string) {
    if (field === "slug") {
      setField("slug", value);
    } else if (field === "focusKeyword") {
      setSeoField("focusKeyword", value);
    } else {
      setSeoField(field as keyof PostSeo, value);
    }
    showToast("Fix applied", "success");
    setExpandedFix(null);
  }

  function showToast(msg: string, type: "success" | "error" | "info" = "success") {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelectionAndExec(cmd: string, val?: string) {
    editorRef.current?.focus();
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) { sel.removeAllRanges(); sel.addRange(savedRangeRef.current); }
    }
    document.execCommand(cmd, false, val);
  }

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = mdToHtml(post.content ?? "");
    const existing = document.getElementById("blog-editor-styles");
    if (!existing) {
      const s = document.createElement("style");
      s.id = "blog-editor-styles";
      s.textContent = EDITOR_CSS;
      document.head.appendChild(s);
    }

    function onSelectionChange() {
      if (!editorRef.current) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      if (!editorRef.current.contains(sel.anchorNode)) return;
      let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = (node as Element).tagName.toLowerCase();
          if (["p", "h1", "h2", "h3", "h4", "h5", "pre", "blockquote"].includes(tag)) {
            setCurrentBlock(tag);
            return;
          }
        }
        node = (node as Node).parentNode;
      }
      setCurrentBlock("p");
    }

    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.getElementById("blog-editor-styles")?.remove();
      document.removeEventListener("selectionchange", onSelectionChange);
    };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function setField<K extends keyof BlogPost>(key: K, val: BlogPost[K]) {
    setSaved(false);
    setData((p) => {
      const updated = { ...p, [key]: val };
      if (key === "title" && !p.slug) {
        updated.slug = (val as string)
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
          .slice(0, 80);
      }
      return updated;
    });
  }

  function setSeoField<K extends keyof PostSeo>(key: K, val: PostSeo[K]) {
    setSaved(false);
    setSeo((p) => ({ ...p, [key]: val }));
    if (key === "focusKeyword") {
      const intent = detectSearchIntent(val as string);
      setSeo((p) => ({ ...p, [key]: val as string, searchIntent: intent }));
    }
  }

  function captureContent(): string {
    if (mode === "visual" && editorRef.current) return editorRef.current.innerHTML;
    return data.content;
  }

  async function runAiAnalysis() {
    setAiLoading(true);
    setAiError(null);
    try {
      const r = await authFetch(AI_SEO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: captureContent(),
          title: data.title,
          keyword: seo.focusKeyword,
          excerpt: data.excerpt,
          allPosts: allPosts.map((p) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt })),
        }),
      });
      const json = await r.json();
      if (!json.ok) throw new Error(json.error || "Analysis failed");
      setAiAnalysis(json.analysis as AiAnalysis);
      showToast("AI analysis complete!", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI analysis failed";
      setAiError(msg);
      showToast("AI analysis failed. Try again.", "error");
    } finally {
      setAiLoading(false);
    }
  }

  function exec(cmd: string, val?: string) {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  }

  function insertLink() {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  }

  function insertImagePrompt() {
    const url = prompt("Enter image URL:");
    if (url) exec("insertHTML", `<img src="${url}" alt="" style="max-width:100%;border-radius:12px;margin:16px 0;" />`);
  }

  function insertTable() {
    exec("insertHTML", `<table style="width:100%;border-collapse:collapse;margin:20px 0"><thead><tr><th style="border:1px solid rgba(11,11,11,0.15);padding:8px 12px;background:rgba(11,11,11,0.04);font-size:13px;text-align:left">Header 1</th><th style="border:1px solid rgba(11,11,11,0.15);padding:8px 12px;background:rgba(11,11,11,0.04);font-size:13px;text-align:left">Header 2</th><th style="border:1px solid rgba(11,11,11,0.15);padding:8px 12px;background:rgba(11,11,11,0.04);font-size:13px;text-align:left">Header 3</th></tr></thead><tbody><tr><td style="border:1px solid rgba(11,11,11,0.15);padding:8px 12px;font-size:13px">Cell</td><td style="border:1px solid rgba(11,11,11,0.15);padding:8px 12px;font-size:13px">Cell</td><td style="border:1px solid rgba(11,11,11,0.15);padding:8px 12px;font-size:13px">Cell</td></tr></tbody></table>`);
  }

  function switchMode(next: "visual" | "text") {
    if (next === "text" && editorRef.current) setField("content", editorRef.current.innerHTML);
    setMode(next);
    if (next === "visual") setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = mdToHtml(data.content); }, 0);
  }

  async function handleSave(mode: "draft" | "publish" = "draft") {
    const content = captureContent();
    const slug = data.slug || data.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 80);
    if (!slug) {
      showToast("Please add a title or URL slug before saving.", "error");
      return;
    }
    const resolvedStatus: "draft" | "published" = mode === "publish" ? "published" : "draft";
    const finalPost: BlogPost = { ...data, slug, content, seo, status: resolvedStatus };
    setStatus(resolvedStatus);
    setSaving(true);
    try {
      await onSave(finalPost);
      setSaved(true);
      if (mode === "publish") {
        showToast(`Published! View at /insights/${slug}`, "success");
      } else {
        showToast("Draft saved.", "info");
      }
    } catch {
      showToast(mode === "publish" ? "Failed to publish. Please try again." : "Failed to save draft.", "error");
    } finally {
      setSaving(false);
    }
  }

  function insertLinkWithFeedback() {
    const url = prompt("Enter URL:");
    if (url) { exec("createLink", url); showToast("Link inserted.", "info"); }
  }

  async function openImgModal() {
    saveSelection();
    setImgAlt("");
    setImgUploadFile(null);
    setImgPreview(null);
    setSelectedMedia(null);
    setShowImgModal(true);
    setMediaLibLoading(true);
    try {
      const r = await authFetch(ADMIN_API + "/media");
      const json = await r.json();
      setMediaLib(Array.isArray(json) ? json : []);
    } catch {
      setMediaLib([]);
    } finally {
      setMediaLibLoading(false);
    }
  }

  async function handleImgInsert() {
    let url: string | null = selectedMedia;
    if (imgUploadFile) {
      setImgUploading(true);
      try {
        const form = new FormData();
        form.append("file", imgUploadFile);
        const r = await authFetch(ADMIN_API + "/upload", { method: "POST", body: form });
        const json = await r.json();
        url = json.url as string;
      } catch {
        showToast("Upload failed. Try again.", "error");
        setImgUploading(false);
        return;
      }
      setImgUploading(false);
    }
    if (!url) { showToast("Please select or upload an image.", "error"); return; }
    setShowImgModal(false);
    const html = `<img src="${url}" alt="${imgAlt.replace(/"/g, "&quot;")}" style="max-width:100%;border-radius:12px;margin:24px 0;display:block;" />`;
    editorRef.current?.focus();
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) { sel.removeAllRanges(); sel.addRange(savedRangeRef.current); }
    }
    document.execCommand("insertHTML", false, html);
    if (editorRef.current) setField("content", editorRef.current.innerHTML);
    showToast("Image inserted.", "success");
  }

  function insertImageWithFeedback() {
    openImgModal();
  }

  function insertTableWithFeedback() {
    insertTable();
    showToast("Table inserted.", "info");
  }

  const liveContent = mode === "visual" && editorRef.current ? editorRef.current.innerHTML : data.content;
  const { score, issues } = computeSeoScore({ ...data }, liveContent, seo);
  const readability = readabilityAnalysis(liveContent);
  const wc = wordCount(liveContent);
  const internalLinks = getInternalLinkSuggestions(data.slug, liveContent, allPosts);
  const seoTitleDisplay = seo.seoTitle || data.title;
  const metaDescDisplay = seo.metaDescription || data.excerpt;
  const yoast = yoastChecks(data, liveContent, seo, allPosts);

  function renderCheck(c: CheckItem) {
    const isOpen = expandedFix === c.key;
    const hasFix = !c.pass && !!c.fix;
    return (
      <div key={c.key} className="rounded-xl border border-[#0B0B0B]/6 overflow-hidden">
        <div className="flex items-start gap-2.5 px-3 py-2.5 bg-white">
          {c.pass
            ? <CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
            : c.warn
              ? <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              : <XCircle size={15} className="text-red-400 shrink-0 mt-0.5" />}
          <p className="text-[12.5px] text-[#0B0B0B]/70 leading-snug flex-1">{c.label}</p>
          {hasFix && (
            <button
              onClick={() => setExpandedFix(isOpen ? null : c.key)}
              className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors border ${isOpen ? "bg-[#0B0B0B] text-white border-[#0B0B0B]" : "bg-[#0B0B0B]/6 text-[#0B0B0B]/60 border-[#0B0B0B]/12 hover:bg-[#0B0B0B]/10"}`}
            >
              {isOpen ? "Close" : "Fix"}
            </button>
          )}
        </div>
        {hasFix && isOpen && c.fix && (
          <div className="bg-[#fffbf0] border-t border-amber-200/60 px-3 py-3 space-y-2.5">
            <p className="text-[11.5px] text-[#0B0B0B]/65 leading-snug">{c.fix.tip}</p>
            {c.fix.copy && (
              <div className="relative">
                <pre className="text-[10.5px] text-[#0B0B0B]/60 bg-white border border-[#0B0B0B]/10 rounded-lg px-3 py-2.5 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">{c.fix.copy}</pre>
                <button
                  onClick={() => copyFix(c.key, c.fix!.copy!)}
                  className="absolute top-1.5 right-1.5 text-[9px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#0B0B0B]/15 text-[#0B0B0B]/55 hover:bg-[#0B0B0B]/6 transition-colors"
                >
                  {copiedFix === c.key ? "Copied!" : "Copy"}
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {c.fix.applyField && c.fix.applyValue && (
                <button
                  onClick={() => applyFix(c.fix!.applyField!, c.fix!.applyValue!)}
                  className="text-[11px] font-bold bg-[#0B0B0B] text-white px-3 py-1.5 rounded-lg hover:bg-[#0B0B0B]/85 transition-colors"
                >
                  Apply Fix
                </button>
              )}
              {c.fix.insertInContent && (
                <button
                  onClick={() => { insertFix(c.fix!.insertInContent!); setExpandedFix(null); }}
                  className="text-[11px] font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Insert into Editor
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const [kwTagInput, setKwTagInput] = useState("");
  const kwTags: string[] = [
    ...(seo.focusKeyword.trim() ? [seo.focusKeyword.trim()] : []),
    ...(seo.secondaryKeywords ? seo.secondaryKeywords.split(",").map(k => k.trim()).filter(Boolean) : []),
  ];

  function addKwTag(val: string) {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!seo.focusKeyword.trim()) { setSeoField("focusKeyword", trimmed); }
    else {
      const existing = seo.secondaryKeywords ? seo.secondaryKeywords.split(",").map(k => k.trim()).filter(Boolean) : [];
      if (!existing.includes(trimmed)) setSeoField("secondaryKeywords", [...existing, trimmed].join(", "));
    }
    setKwTagInput("");
  }

  function removeKwTag(idx: number) {
    if (idx === 0) {
      const rest = seo.secondaryKeywords ? seo.secondaryKeywords.split(",").map(k => k.trim()).filter(Boolean) : [];
      setSeoField("focusKeyword", rest[0] ?? "");
      setSeoField("secondaryKeywords", rest.slice(1).join(", "));
    } else {
      const sec = seo.secondaryKeywords ? seo.secondaryKeywords.split(",").map(k => k.trim()).filter(Boolean) : [];
      sec.splice(idx - 1, 1);
      setSeoField("secondaryKeywords", sec.join(", "));
    }
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-[13px] font-medium pointer-events-auto transition-all
            ${t.type === "success" ? "bg-emerald-600 text-white" : t.type === "error" ? "bg-red-500 text-white" : "bg-[#0B0B0B] text-white"}`}>
            {t.type === "success" && <CheckCircle size={15} className="shrink-0" />}
            {t.type === "error" && <XCircle size={15} className="shrink-0" />}
            {t.type === "info" && <AlertCircle size={15} className="shrink-0 text-white/70" />}
            {t.msg}
          </div>
        ))}
      </div>

      {/* ── Inline Image Upload Modal ── */}
      {showImgModal && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#0B0B0B]/8">
              <div className="flex items-center gap-2">
                <ImagePlus size={15} className="text-[#0B0B0B]/50" />
                <h3 className="text-[14px] font-bold text-[#0B0B0B]">Insert Image</h3>
              </div>
              <button onClick={() => setShowImgModal(false)} className="p-1.5 rounded-lg hover:bg-[#0B0B0B]/6 transition-colors text-[#0B0B0B]/40 hover:text-[#0B0B0B]">
                <XIcon size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Upload area */}
              <div>
                <p className="text-[11px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest mb-2">Upload New Image</p>
                <input
                  ref={imgFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setImgUploadFile(f);
                    setSelectedMedia(null);
                    if (f) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setImgPreview(ev.target?.result as string);
                      reader.readAsDataURL(f);
                    } else {
                      setImgPreview(null);
                    }
                  }}
                />
                {imgPreview ? (
                  <div className="relative group rounded-xl overflow-hidden border border-[#0B0B0B]/10 bg-[#fafafa]">
                    <img src={imgPreview} alt="preview" className="w-full max-h-[180px] object-contain" />
                    <button
                      onClick={() => { setImgUploadFile(null); setImgPreview(null); if (imgFileInputRef.current) imgFileInputRef.current.value = ""; }}
                      className="absolute top-2 right-2 bg-white border border-[#0B0B0B]/12 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <XIcon size={12} className="text-[#0B0B0B]/60" />
                    </button>
                    <p className="text-[11px] text-[#0B0B0B]/40 text-center py-1.5">{imgUploadFile?.name}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => imgFileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#0B0B0B]/12 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-[#0B0B0B]/25 hover:bg-[#0B0B0B]/2 transition-all"
                  >
                    <ImagePlus size={22} className="text-[#0B0B0B]/25" />
                    <span className="text-[12px] text-[#0B0B0B]/40 font-medium">Click to upload image</span>
                    <span className="text-[11px] text-[#0B0B0B]/25">PNG, JPG, WebP, GIF</span>
                  </button>
                )}
              </div>

              {/* Media library */}
              {!imgUploadFile && (
                <div>
                  <p className="text-[11px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest mb-2">Or Pick from Media Library</p>
                  {mediaLibLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <RefreshCw size={16} className="animate-spin text-[#0B0B0B]/30" />
                    </div>
                  ) : mediaLib.length === 0 ? (
                    <p className="text-[12px] text-[#0B0B0B]/30 text-center py-4">No uploaded images yet.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-1">
                      {mediaLib.map((m) => (
                        <button
                          key={m.filename}
                          onClick={() => setSelectedMedia(selectedMedia === m.url ? null : m.url)}
                          className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${selectedMedia === m.url ? "border-[#0B0B0B] shadow-md" : "border-transparent hover:border-[#0B0B0B]/20"}`}
                        >
                          <img src={m.url} alt={m.filename} className="w-full h-full object-cover" />
                          {selectedMedia === m.url && (
                            <div className="absolute inset-0 bg-[#0B0B0B]/20 flex items-center justify-center">
                              <CheckCircle size={18} className="text-white drop-shadow" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Alt text */}
              <div>
                <label className="text-[11px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest block mb-1.5">Alt Text (for SEO & accessibility)</label>
                <input
                  type="text"
                  value={imgAlt}
                  onChange={(e) => setImgAlt(e.target.value)}
                  placeholder="e.g. content marketing strategy diagram"
                  className="w-full border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[13px] text-[#0B0B0B] placeholder-[#0B0B0B]/25 outline-none focus:border-[#0B0B0B]/30 bg-[#fafafa]"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[#0B0B0B]/8 bg-[#fafafa]">
              <button onClick={() => setShowImgModal(false)} className="text-[13px] font-medium text-[#0B0B0B]/45 hover:text-[#0B0B0B] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleImgInsert}
                disabled={imgUploading || (!imgUploadFile && !selectedMedia)}
                className="flex items-center gap-2 bg-[#0B0B0B] text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0B0B0B]/85 disabled:opacity-40 transition-colors"
              >
                {imgUploading ? <RefreshCw size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                {imgUploading ? "Uploading..." : "Insert Image"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-[#0B0B0B]/45 hover:text-[#0B0B0B] transition-colors">
          <ArrowLeft size={14} /> All Posts
        </button>
        <h1 className="text-[19px] font-black tracking-tight text-[#0B0B0B] flex-1">{isNew ? "Add New Post" : "Edit Post"}</h1>
        {saved && <span className="text-[12px] text-emerald-600 font-medium">Saved</span>}
        <button onClick={() => handleSave("draft")} disabled={saving} className="text-[13px] font-medium text-[#0B0B0B]/55 border border-[#0B0B0B]/15 px-3.5 py-2 rounded-xl hover:border-[#0B0B0B]/30 transition-colors disabled:opacity-40">
          Save Draft
        </button>
        <button onClick={() => handleSave("publish")} disabled={saving} className="bg-[#0B0B0B] text-white text-[13px] font-semibold px-5 py-2 rounded-xl hover:bg-[#0B0B0B]/85 disabled:opacity-40 transition-colors">
          {saving ? "Saving..." : "Publish"}
        </button>
      </div>

      <div className="flex gap-5 items-start">
        {/* ── Left: tabs + content ── */}
        <div className="flex-1 min-w-0">
          {/* Tab switcher */}
          <div className="flex gap-0 mb-4 border-b border-[#0B0B0B]/8">
            {([["write", "Write"], ["seo", "SEO Analysis"]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${activeTab === key ? "text-[#0B0B0B] border-[#0B0B0B]" : "text-[#0B0B0B]/40 border-transparent hover:text-[#0B0B0B]/70"}`}>
                {label}
                {key === "seo" && (
                  <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${score >= 75 ? "bg-emerald-100 text-emerald-700" : score >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
                    {score}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "write" && (
            <>
              {/* Title */}
              <div className="bg-white border border-[#0B0B0B]/10 rounded-2xl mb-4 overflow-hidden shadow-sm">
                <input
                  value={data.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Add title"
                  className="w-full px-6 py-5 text-[28px] font-black tracking-tight text-[#0B0B0B] placeholder-[#0B0B0B]/18 outline-none bg-transparent"
                />
              </div>

              {/* Editor */}
              <div className="bg-white border border-[#0B0B0B]/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center flex-wrap gap-0.5 px-3 py-2 border-b border-[#0B0B0B]/8 bg-[#fafafa]">
                  {/* Block format custom dropdown */}
                  <div className="relative mr-1 shrink-0">
                    <button
                      onMouseDown={(e) => { e.preventDefault(); setBlockDropOpen((o) => !o); }}
                      className="flex items-center gap-1.5 text-[12px] text-[#0B0B0B]/65 border border-[#0B0B0B]/12 rounded px-2.5 py-1 bg-white hover:bg-[#f5f5f5] transition-colors min-w-[108px] justify-between"
                    >
                      <span>{{ p: "Paragraph", h1: "Heading 1", h2: "Heading 2", h3: "Heading 3", h4: "Heading 4", h5: "Heading 5", pre: "Code", blockquote: "Quote" }[currentBlock] ?? "Paragraph"}</span>
                      <ChevronDown size={11} className="opacity-50" />
                    </button>
                    {blockDropOpen && (
                      <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-[#0B0B0B]/12 rounded-xl shadow-xl py-1 min-w-[140px]">
                        {([
                          { val: "p", label: "Paragraph" },
                          { val: "h1", label: "Heading 1" },
                          { val: "h2", label: "Heading 2" },
                          { val: "h3", label: "Heading 3" },
                          { val: "h4", label: "Heading 4" },
                          { val: "pre", label: "Code block" },
                        ] as const).map(({ val, label }) => (
                          <button
                            key={val}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              exec("formatBlock", val);
                              setCurrentBlock(val);
                              setBlockDropOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-[12px] transition-colors hover:bg-[#0B0B0B]/5 ${currentBlock === val ? "font-semibold text-[#0B0B0B]" : "text-[#0B0B0B]/65"}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="w-px h-5 bg-[#0B0B0B]/10 mx-0.5" />
                  <ToolBtn icon={<Bold size={14} />} title="Bold" onClick={() => exec("bold")} />
                  <ToolBtn icon={<Italic size={14} />} title="Italic" onClick={() => exec("italic")} />
                  <ToolBtn icon={<Underline size={14} />} title="Underline" onClick={() => exec("underline")} />
                  <ToolBtn icon={<Strikethrough size={14} />} title="Strikethrough" onClick={() => exec("strikeThrough")} />
                  {/* Text Color Picker */}
                  <div className="relative" ref={colorPickerRef}>
                    <button
                      title="Text Color"
                      onMouseDown={(e) => { e.preventDefault(); saveSelection(); setShowColorPicker((o) => !o); }}
                      className="p-1.5 rounded hover:bg-[#0B0B0B]/8 transition-colors flex flex-col items-center gap-0.5"
                    >
                      <span className="text-[13px] font-black leading-none text-[#0B0B0B]/70" style={{ fontFamily: "Inter,sans-serif" }}>A</span>
                      <span className="w-3.5 h-[3px] rounded-full" style={{ background: currentTextColor === "#ffffff" ? "#ccc" : currentTextColor }} />
                    </button>
                    {showColorPicker && (
                      <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-[#0B0B0B]/12 rounded-xl shadow-2xl p-3 w-[196px]">
                        <p className="text-[9px] font-bold text-[#0B0B0B]/35 uppercase tracking-widest mb-2">Text Color</p>
                        <div className="grid grid-cols-7 gap-1.5 mb-3">
                          {COLOR_SWATCHES.map(({ color, label }) => (
                            <button
                              key={color}
                              title={label}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                restoreSelectionAndExec("foreColor", color);
                                setCurrentTextColor(color);
                                if (editorRef.current) setField("content", editorRef.current.innerHTML);
                                setShowColorPicker(false);
                              }}
                              className="w-6 h-6 rounded-md transition-transform hover:scale-110"
                              style={{
                                background: color,
                                outline: color === currentTextColor ? "2px solid #0B0B0B" : "2px solid transparent",
                                outlineOffset: "1px",
                                border: color === "#ffffff" ? "1px solid #e5e5e0" : "none",
                              }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2 border-t border-[#0B0B0B]/6 pt-2.5">
                          <label className="text-[10px] text-[#0B0B0B]/40 font-medium shrink-0">Custom</label>
                          <input
                            type="color"
                            defaultValue={currentTextColor}
                            onChange={(e) => {
                              restoreSelectionAndExec("foreColor", e.target.value);
                              setCurrentTextColor(e.target.value);
                              if (editorRef.current) setField("content", editorRef.current.innerHTML);
                            }}
                            className="w-8 h-6 rounded cursor-pointer border border-[#0B0B0B]/12 p-0"
                          />
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault();
                              restoreSelectionAndExec("foreColor", "#0B0B0B");
                              setCurrentTextColor("#0B0B0B");
                              if (editorRef.current) setField("content", editorRef.current.innerHTML);
                              setShowColorPicker(false);
                            }}
                            className="ml-auto text-[10px] text-[#0B0B0B]/45 hover:text-[#0B0B0B] font-medium transition-colors"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="w-px h-5 bg-[#0B0B0B]/10 mx-0.5" />
                  <ToolBtn icon={<ListOrdered size={14} />} title="Ordered List" onClick={() => exec("insertOrderedList")} />
                  <ToolBtn icon={<List size={14} />} title="Unordered List" onClick={() => exec("insertUnorderedList")} />
                  <ToolBtn icon={<Quote size={14} />} title="Blockquote" onClick={() => exec("formatBlock", "blockquote")} />
                  <div className="w-px h-5 bg-[#0B0B0B]/10 mx-0.5" />
                  <ToolBtn icon={<AlignLeft size={14} />} title="Align Left" onClick={() => exec("justifyLeft")} />
                  <ToolBtn icon={<AlignCenter size={14} />} title="Align Center" onClick={() => exec("justifyCenter")} />
                  <ToolBtn icon={<AlignRight size={14} />} title="Align Right" onClick={() => exec("justifyRight")} />
                  <ToolBtn icon={<AlignJustify size={14} />} title="Justify" onClick={() => exec("justifyFull")} />
                  <div className="w-px h-5 bg-[#0B0B0B]/10 mx-0.5" />
                  <ToolBtn icon={<Link2 size={14} />} title="Insert Link" onClick={insertLinkWithFeedback} />
                  <ToolBtn icon={<ImagePlus size={14} />} title="Insert Image" onClick={insertImageWithFeedback} />
                  <ToolBtn icon={<Table2 size={14} />} title="Insert Table" onClick={insertTableWithFeedback} />
                  <ToolBtn icon={<Minus size={14} />} title="Horizontal Rule" onClick={() => exec("insertHorizontalRule")} />
                  <ToolBtn icon={<Eraser size={14} />} title="Clear Formatting" onClick={() => exec("removeFormat")} />
                  <div className="flex-1" />
                  <div className="flex rounded-lg overflow-hidden border border-[#0B0B0B]/12 shrink-0">
                    {(["visual", "text"] as const).map((m) => (
                      <button key={m} onMouseDown={(e) => e.preventDefault()} onClick={() => switchMode(m)}
                        className={`text-[11px] font-semibold px-3 py-1.5 capitalize transition-colors ${mode === m ? "bg-[#0B0B0B] text-white" : "text-[#0B0B0B]/45 hover:text-[#0B0B0B]"}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                {mode === "visual" ? (
                  <div ref={editorRef} contentEditable
                    onInput={() => { if (editorRef.current) setField("content", editorRef.current.innerHTML); }}
                    onMouseUp={saveSelection}
                    onKeyUp={saveSelection}
                    className="blog-editor min-h-[460px] px-8 py-7 outline-none"
                    suppressContentEditableWarning />
                ) : (
                  <textarea value={data.content} onChange={(e) => setField("content", e.target.value)}
                    className="w-full min-h-[460px] px-7 py-6 text-[13px] text-[#0B0B0B]/65 font-mono leading-relaxed outline-none resize-none bg-[#fafafa]"
                    placeholder="Write your post content..." spellCheck={false} />
                )}
                <div className="flex items-center justify-between px-5 py-2.5 border-t border-[#0B0B0B]/6 bg-[#fafafa]">
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-[#0B0B0B]/30">Words: {wc}</span>
                    <span className={`text-[11px] font-medium ${readability.score >= 80 ? "text-emerald-600" : readability.score >= 60 ? "text-amber-600" : "text-red-500"}`}>
                      {readability.label} (avg {readability.avgWords} words/sentence)
                    </span>
                  </div>
                  <span className="text-[11px] text-[#0B0B0B]/22">Select text to format</span>
                </div>
              </div>
            </>
          )}

          {activeTab === "seo" && (
            <div className="space-y-4">

              {/* ── AI Intelligence ── */}
              <div className="bg-gradient-to-br from-[#0e0e0e] to-[#181818] border border-white/10 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    <h3 className="text-[13px] font-bold text-white">AI SEO Analyzer</h3>
                    <span className="text-[9px] font-semibold text-amber-400/70 border border-amber-400/25 px-1.5 py-0.5 rounded-full uppercase tracking-wide">2026</span>
                  </div>
                  <button
                    onClick={runAiAnalysis}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 text-[12px] font-semibold bg-amber-400 text-[#0B0B0B] px-3 py-1.5 rounded-lg hover:bg-amber-300 transition-colors disabled:opacity-50"
                  >
                    {aiLoading
                      ? <RefreshCw size={11} className="animate-spin" />
                      : <Sparkles size={11} />}
                    {aiLoading ? "Analyzing..." : aiAnalysis ? "Re-analyze" : "Deep Analyze"}
                  </button>
                </div>

                {!aiAnalysis && !aiLoading && !aiError && (
                  <p className="text-[12px] text-white/30 leading-relaxed text-center py-3">
                    GEO score, E-E-A-T signals, voice search readiness, PAA questions, topic cluster plan, intent detection, semantic keywords, and title variations.
                  </p>
                )}
                {aiLoading && (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <RefreshCw size={18} className="text-amber-400 animate-spin" />
                    <p className="text-[12px] text-white/40">Analyzing your content...</p>
                  </div>
                )}
                {aiError && !aiLoading && (
                  <div className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mt-1">{aiError}</div>
                )}

                {aiAnalysis && !aiLoading && (() => {
                  const a = aiAnalysis;
                  const scoreColor = a.aiScore >= 75 ? "#34d399" : a.aiScore >= 50 ? "#fbbf24" : "#f87171";
                  const circumference = 2 * Math.PI * 28;
                  const dash = (a.aiScore / 100) * circumference;
                  return (
                    <>
                      {/* Score + Intent */}
                      <div className="flex items-center gap-4 mb-5">
                        <div className="relative w-[72px] h-[72px] shrink-0">
                          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
                            <circle cx="32" cy="32" r="28" fill="none" stroke={scoreColor} strokeWidth="6"
                              strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[18px] font-black leading-none" style={{ color: scoreColor }}>{a.aiScore}</span>
                            <span className="text-[7px] text-white/25 font-bold uppercase tracking-wider">score</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide
                              ${a.intent === "informational" ? "bg-blue-500/20 text-blue-300" : a.intent === "commercial" ? "bg-purple-500/20 text-purple-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                              {a.intent}
                            </span>
                            <span className="text-[10px] text-white/30 leading-snug truncate">{a.intentExplanation}</span>
                          </div>
                          {Object.entries(a.scoreBreakdown).map(([k, v]) => {
                            const lbl: Record<string, string> = { semanticCoverage: "Semantic", topicCompleteness: "Topic", searchIntent: "Intent", readability: "Readability", structure: "Structure" };
                            const c = v >= 75 ? "bg-emerald-400" : v >= 50 ? "bg-amber-400" : "bg-red-400";
                            return (
                              <div key={k} className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] text-white/30 w-[68px] shrink-0">{lbl[k] ?? k}</span>
                                <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${c}`} style={{ width: `${v}%` }} />
                                </div>
                                <span className="text-[9px] text-white/25 w-5 text-right">{v}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Critical Issues */}
                      {a.criticalIssues.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-2">Critical Issues</p>
                          <div className="space-y-1.5">
                            {a.criticalIssues.map((issue, i) => (
                              <div key={i} className="flex items-start gap-2 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">
                                <XCircle size={11} className="text-red-400 shrink-0 mt-0.5" />
                                <p className="text-[11.5px] text-white/65 leading-snug">{issue}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Content Gaps */}
                      {a.contentGaps.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mb-2">Content Gaps</p>
                          <div className="flex flex-wrap gap-1.5">
                            {a.contentGaps.map((gap, i) => (
                              <span key={i} className="text-[11px] text-amber-300 bg-amber-400/8 border border-amber-400/15 px-2.5 py-0.5 rounded-lg">+ {gap}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Improvements */}
                      {a.improvements.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Improvements</p>
                          <div className="space-y-1.5">
                            {a.improvements.map((item, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="text-[10px] font-bold text-emerald-400/60 shrink-0 mt-0.5 w-3">{i + 1}.</span>
                                <p className="text-[11.5px] text-white/55 leading-snug">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Semantic Keywords */}
                      {a.semanticKeywords.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-2">Semantic Keywords</p>
                          <div className="space-y-1.5">
                            {a.semanticKeywords.map((kw, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-[12px] font-medium text-white/65">{kw.term}</span>
                                <span className="text-[9px] text-white/20 bg-white/5 px-2 py-0.5 rounded-full shrink-0">{kw.placement}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Title Variations */}
                      {a.titleVariations.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mb-2">Title Variations</p>
                          <div className="space-y-2">
                            {a.titleVariations.map((tv, i) => (
                              <div key={i} className="bg-white/4 border border-white/8 rounded-xl px-3 py-2.5">
                                <div className="flex items-start gap-2 mb-1.5">
                                  <p className="text-[11.5px] font-medium text-white/75 leading-snug flex-1">{tv.title}</p>
                                  <button
                                    onClick={() => setSeoField("seoTitle", tv.title)}
                                    className="text-[9px] font-bold text-amber-400 border border-amber-400/25 px-2 py-0.5 rounded hover:bg-amber-400/8 transition-colors shrink-0"
                                  >Use</button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex gap-0.5">
                                    {Array.from({ length: 10 }).map((_, j) => (
                                      <div key={j} className={`w-1.5 h-1 rounded-sm ${j < tv.ctrScore ? "bg-amber-400/70" : "bg-white/8"}`} />
                                    ))}
                                  </div>
                                  <span className="text-[9px] text-white/25">CTR {tv.ctrScore}/10</span>
                                  <span className="text-[9px] text-white/18 truncate">{tv.hook}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI Internal Links */}
                      {a.internalLinkSuggestions.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[9px] font-bold text-white/35 uppercase tracking-widest mb-2">AI Internal Links</p>
                          <div className="space-y-2">
                            {a.internalLinkSuggestions.map((link, i) => (
                              <div key={i} className="bg-white/4 border border-white/8 rounded-xl px-3 py-2.5">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-[11px] font-medium text-white/65 truncate flex-1">{link.title}</p>
                                  <button
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => exec("createLink", `/${link.slug}`)}
                                    className="text-[9px] font-bold text-white/35 border border-white/12 px-2 py-0.5 rounded hover:bg-white/6 transition-colors shrink-0"
                                  >Insert</button>
                                </div>
                                <p className="text-[9px] text-white/25">"{link.anchorText}" - {link.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ideal Structure */}
                      {a.idealStructure.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[9px] font-bold text-white/35 uppercase tracking-widest mb-2">Ideal Structure</p>
                          <div className="space-y-1">
                            {a.idealStructure.map((s, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-[9px] text-white/15 w-4 shrink-0">{i + 1}.</span>
                                <span className="text-[11px] text-white/40">{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Advanced */}
                      {a.advanced.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[9px] font-bold text-white/35 uppercase tracking-widest mb-2">Advanced Tips</p>
                          <div className="space-y-1.5">
                            {a.advanced.map((tip, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <Zap size={10} className="text-amber-400/50 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-white/50 leading-snug">{tip}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── GEO: Generative Engine Optimization ── */}
                      <div className="mb-4 border-t border-white/8 pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest">GEO Score</span>
                          <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${a.geoScore >= 75 ? "bg-sky-400" : a.geoScore >= 50 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${a.geoScore}%` }} />
                          </div>
                          <span className={`text-[11px] font-bold ${a.geoScore >= 75 ? "text-sky-400" : a.geoScore >= 50 ? "text-amber-400" : "text-red-400"}`}>{a.geoScore}/100</span>
                        </div>
                        <p className="text-[10px] text-white/30 leading-snug mb-2">Generative Engine Optimization - how well AI tools like Google AI Overviews, Perplexity, and ChatGPT will summarize and cite your content.</p>
                        {a.geoTips.length > 0 && (
                          <div className="space-y-1.5">
                            {a.geoTips.map((tip, i) => (
                              <div key={i} className="flex items-start gap-2 bg-sky-500/6 border border-sky-500/12 rounded-lg px-3 py-2">
                                <span className="text-sky-400 text-[10px] shrink-0 mt-0.5 font-bold">→</span>
                                <p className="text-[11px] text-white/55 leading-snug">{tip}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {a.geoTips.length === 0 && <p className="text-[11px] text-sky-400 font-medium">Excellent GEO optimization! Your content is well-structured for AI citation.</p>}
                      </div>

                      {/* ── E-E-A-T Signals ── */}
                      <div className="mb-4 border-t border-white/8 pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">E-E-A-T Signals</span>
                          <span className="text-[9px] text-white/25">Experience · Expertise · Authoritativeness · Trust</span>
                        </div>
                        <div className="space-y-1.5">
                          {a.eeatSignals.map((sig, i) => (
                            <div key={i} className="flex items-start gap-2">
                              {sig.found
                                ? <CheckCircle size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                                : <XCircle size={12} className="text-white/25 shrink-0 mt-0.5" />}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className={`text-[11px] leading-snug ${sig.found ? "text-white/65" : "text-white/35"}`}>{sig.signal}</p>
                                  <span className="text-[8px] text-white/18 shrink-0 border border-white/10 px-1.5 py-0.5 rounded-full">{sig.category}</span>
                                </div>
                                {!sig.found && <p className="text-[10px] text-white/28 leading-snug mt-0.5 italic">{sig.tip}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── Voice Search ── */}
                      <div className="mb-4 border-t border-white/8 pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] font-bold text-pink-400 uppercase tracking-widest">Voice &amp; Multimodal Search</span>
                          <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${a.voiceScore >= 75 ? "bg-pink-400" : a.voiceScore >= 50 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${a.voiceScore}%` }} />
                          </div>
                          <span className={`text-[11px] font-bold ${a.voiceScore >= 75 ? "text-pink-400" : a.voiceScore >= 50 ? "text-amber-400" : "text-red-400"}`}>{a.voiceScore}/100</span>
                        </div>
                        <p className="text-[10px] text-white/30 leading-snug mb-2">How well this content will perform when read aloud by voice assistants (Siri, Alexa, Google) or cited in multimodal AI search.</p>
                        {a.voiceTips.length > 0
                          ? <div className="space-y-1.5">{a.voiceTips.map((tip, i) => (
                              <div key={i} className="flex items-start gap-2 bg-pink-500/6 border border-pink-500/12 rounded-lg px-3 py-2">
                                <span className="text-pink-400 text-[10px] shrink-0 mt-0.5 font-bold">→</span>
                                <p className="text-[11px] text-white/55 leading-snug">{tip}</p>
                              </div>
                            ))}</div>
                          : <p className="text-[11px] text-pink-400 font-medium">Great voice search optimization! Conversational and structured.</p>}
                      </div>

                      {/* ── Visual SEO ── */}
                      <div className="mb-4 border-t border-white/8 pt-4">
                        <p className="text-[9px] font-bold text-teal-400 uppercase tracking-widest mb-2">Visual SEO</p>
                        <p className="text-[10px] text-white/30 leading-snug mb-2">Images, alt text, and visual content signals that boost engagement and image search traffic.</p>
                        <div className="space-y-1.5">
                          {a.visualSeoChecks.map((chk, i) => (
                            <div key={i} className="flex items-start gap-2">
                              {chk.pass
                                ? <CheckCircle size={12} className="text-teal-400 shrink-0 mt-0.5" />
                                : <XCircle size={12} className="text-white/25 shrink-0 mt-0.5" />}
                              <div className="flex-1 min-w-0">
                                <p className={`text-[11px] leading-snug ${chk.pass ? "text-white/65" : "text-white/35"}`}>{chk.check}</p>
                                {!chk.pass && <p className="text-[10px] text-white/28 leading-snug mt-0.5 italic">{chk.tip}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── PAA: People Also Ask ── */}
                      <div className="mb-4 border-t border-white/8 pt-4">
                        <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest mb-1">People Also Ask (PAA)</p>
                        <p className="text-[10px] text-white/30 leading-snug mb-2">Target these questions in your H2/H3 headings and FAQ section. Answering PAA questions earns featured snippets.</p>
                        <div className="space-y-1.5">
                          {a.paaQuestions.map((q, i) => (
                            <div key={i} className="flex items-start gap-2 bg-orange-500/6 border border-orange-500/12 rounded-lg px-3 py-1.5">
                              <span className="text-[9px] text-orange-400 shrink-0 font-bold mt-0.5">Q</span>
                              <p className="text-[11px] text-white/55 leading-snug">{q}</p>
                            </div>
                          ))}
                        </div>
                        {a.faqSuggestions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-[9px] text-white/20 uppercase tracking-widest mb-1.5">Suggested FAQ answers to add</p>
                            <div className="flex flex-wrap gap-1">
                              {a.faqSuggestions.map((q, i) => (
                                <span key={i} className="text-[10px] text-orange-300/70 bg-orange-400/6 border border-orange-400/12 px-2 py-0.5 rounded-md">{q}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ── Topic Cluster ── */}
                      <div className="border-t border-white/8 pt-4">
                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Topic Cluster &amp; Content Hub</p>
                        <p className="text-[10px] text-white/30 leading-snug mb-2">Build topical authority by creating these related posts and linking them to this one. Clusters signal depth to Google.</p>
                        <div className="space-y-1.5">
                          {a.topicCluster.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-xl px-3 py-2">
                              <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0 ${item.type === "pillar" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/8 text-white/30"}`}>
                                {item.type === "pillar" ? "PILLAR" : "CLUSTER"}
                              </div>
                              <p className="text-[11px] text-white/60 flex-1 leading-snug">{item.subtopic}</p>
                              <span className={`text-[8px] font-semibold shrink-0 ${item.priority === "high" ? "text-red-400" : item.priority === "medium" ? "text-amber-400" : "text-white/25"}`}>
                                {item.priority}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* SERP Snippet Preview */}
              <div className="bg-white border border-[#0B0B0B]/10 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest mb-3">Search appearance preview</p>
                <div className="rounded-xl border border-[#0B0B0B]/8 p-4 bg-[#f8f9fa]">
                  <p className="text-[11px] text-[#5f6368] mb-0.5">growitbuddy.com/<strong>{data.slug || "post-slug"}</strong></p>
                  <p className="text-[17px] font-normal text-[#1a0dab] leading-snug mb-1 hover:underline cursor-default">
                    {(() => {
                      const kw = seo.focusKeyword.trim();
                      const title = seoTitleDisplay || "Post title will appear here";
                      if (!kw) return title;
                      const idx = title.toLowerCase().indexOf(kw.toLowerCase());
                      if (idx === -1) return title;
                      return <>{title.slice(0, idx)}<strong>{title.slice(idx, idx + kw.length)}</strong>{title.slice(idx + kw.length)}</>;
                    })()}
                  </p>
                  <p className="text-[13px] text-[#4d5156] leading-relaxed">
                    {metaDescDisplay
                      ? (metaDescDisplay.length > 155 ? metaDescDisplay.slice(0, 152) + "..." : metaDescDisplay)
                      : <span className="italic text-[#0B0B0B]/30">Meta description will appear here - add one in the sidebar.</span>}
                  </p>
                </div>
                <button className="mt-3 text-[12px] font-semibold text-white bg-[#0B0B0B] px-4 py-1.5 rounded-lg hover:bg-[#0B0B0B]/85 transition-colors">Edit Snippet</button>
              </div>

              {/* Focus Keywords */}
              <div className="bg-white border border-[#0B0B0B]/10 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-[13px] font-semibold text-[#0B0B0B]">Focus Keyword</h3>
                  <HelpCircle size={13} className="text-[#0B0B0B]/30" />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 min-h-[40px] border border-[#0B0B0B]/15 rounded-xl px-3 py-2 bg-white focus-within:border-[#0B0B0B]/30 mb-3">
                  {kwTags.map((tag, i) => (
                    <span key={i} className={`flex items-center gap-1 text-[12px] font-medium px-2.5 py-0.5 rounded-full ${i === 0 ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-[#0B0B0B]/6 text-[#0B0B0B]/60 border border-[#0B0B0B]/10"}`}>
                      {tag}
                      <button onClick={() => removeKwTag(i)} className="hover:text-red-500 transition-colors ml-0.5">
                        <XIcon size={11} />
                      </button>
                    </span>
                  ))}
                  <input
                    value={kwTagInput}
                    onChange={(e) => setKwTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addKwTag(kwTagInput); } }}
                    onBlur={() => { if (kwTagInput.trim()) addKwTag(kwTagInput); }}
                    placeholder={kwTags.length === 0 ? "Add focus keyword..." : "Add more keywords..."}
                    className="flex-1 min-w-[120px] text-[12px] outline-none bg-transparent"
                  />
                </div>
                <p className="text-[11px] text-[#0B0B0B]/40 mb-4">Press Enter or comma to add. First keyword is the focus keyword (green). Others are secondary.</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!(seo as any).pillarContent} onChange={(e) => setSeoField("pillarContent" as any, e.target.checked)} className="accent-[#0B0B0B] w-3.5 h-3.5" />
                  <span className="text-[12px] text-[#0B0B0B]/70 font-medium">This post is Pillar Content</span>
                  <HelpCircle size={12} className="text-[#0B0B0B]/25" />
                </label>
              </div>

              {/* Basic SEO */}
              {(() => {
                const errors = yoast.basic.filter(c => !c.pass && !c.warn).length;
                const warns = yoast.basic.filter(c => c.warn).length;
                const allGood = errors === 0 && warns === 0;
                const fixable = yoast.basic.filter(c => !c.pass && c.fix?.applyField);
                return (
                  <div className="bg-white border border-[#0B0B0B]/10 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-[14px] font-semibold text-[#0B0B0B]">Basic SEO</h3>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${allGood ? "bg-emerald-100 text-emerald-700" : errors > 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                        {allGood ? "All Good" : errors > 0 ? `${errors} Error${errors > 1 ? "s" : ""}` : `${warns} Warning${warns > 1 ? "s" : ""}`}
                      </span>
                      {fixable.length > 0 && (
                        <button
                          onClick={() => { fixable.forEach(c => applyFix(c.fix!.applyField!, c.fix!.applyValue!)); }}
                          className="ml-auto text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Fix All ({fixable.length})
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#0B0B0B]/35 mb-4">Tap <strong>Fix</strong> on anything that failed (red or yellow) for step-by-step help and ready-made text you can add in one click.</p>
                    <div className="space-y-2">{yoast.basic.map(c => renderCheck(c))}</div>
                  </div>
                );
              })()}

              {/* Additional */}
              {(() => {
                const errors = yoast.additional.filter(c => !c.pass && !c.warn).length;
                const warns = yoast.additional.filter(c => c.warn).length;
                const allGood = errors === 0 && warns === 0;
                const fixable = yoast.additional.filter(c => !c.pass && c.fix?.applyField);
                return (
                  <div className="bg-white border border-[#0B0B0B]/10 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-[14px] font-semibold text-[#0B0B0B]">Additional</h3>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${allGood ? "bg-emerald-100 text-emerald-700" : errors > 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                        {allGood ? "All Good" : errors > 0 ? `${errors} Error${errors > 1 ? "s" : ""}` : `${warns} Warning${warns > 1 ? "s" : ""}`}
                      </span>
                      {fixable.length > 0 && (
                        <button onClick={() => fixable.forEach(c => applyFix(c.fix!.applyField!, c.fix!.applyValue!))}
                          className="ml-auto text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 transition-colors">
                          Fix All ({fixable.length})
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#0B0B0B]/35 mb-4">Tap <strong>Fix</strong> on anything that failed (red or yellow) for step-by-step help and ready-made text you can add in one click.</p>
                    <div className="space-y-2">{yoast.additional.map(c => renderCheck(c))}</div>
                  </div>
                );
              })()}

              {/* Title Readability */}
              {(() => {
                const errors = yoast.title.filter(c => !c.pass && !c.warn).length;
                const warns = yoast.title.filter(c => c.warn).length;
                const allGood = errors === 0 && warns === 0;
                const fixable = yoast.title.filter(c => !c.pass && c.fix?.applyField);
                return (
                  <div className="bg-white border border-[#0B0B0B]/10 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-[14px] font-semibold text-[#0B0B0B]">Title Readability</h3>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${allGood ? "bg-emerald-100 text-emerald-700" : errors > 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                        {allGood ? "All Good" : errors > 0 ? `${errors} Error${errors > 1 ? "s" : ""}` : `${warns} Warning${warns > 1 ? "s" : ""}`}
                      </span>
                      {fixable.length > 0 && (
                        <button onClick={() => fixable.forEach(c => applyFix(c.fix!.applyField!, c.fix!.applyValue!))}
                          className="ml-auto text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 transition-colors">
                          Fix All ({fixable.length})
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#0B0B0B]/35 mb-4">Tap <strong>Fix</strong> on anything that failed (red or yellow) for step-by-step help and ready-made text you can add in one click.</p>
                    <div className="space-y-2">{yoast.title.map(c => renderCheck(c))}</div>
                  </div>
                );
              })()}

              {/* Content Readability */}
              {(() => {
                const errors = yoast.readability.filter(c => !c.pass && !c.warn).length;
                const warns = yoast.readability.filter(c => c.warn).length;
                const allGood = errors === 0 && warns === 0;
                return (
                  <div className="bg-white border border-[#0B0B0B]/10 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-[14px] font-semibold text-[#0B0B0B]">Content Readability</h3>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${allGood ? "bg-emerald-100 text-emerald-700" : errors > 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                        {allGood ? "All Good" : errors > 0 ? `${errors} Error${errors > 1 ? "s" : ""}` : `${warns} Warning${warns > 1 ? "s" : ""}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#0B0B0B]/35 mb-4">Tap <strong>Fix</strong> on anything that failed (red or yellow) for step-by-step help and ready-made text you can add in one click.</p>
                    <div className="space-y-2">{yoast.readability.map(c => renderCheck(c))}</div>
                  </div>
                );
              })()}

              {/* 2026 SEO Checks */}
              {(() => {
                const checks = yoast.seo2026;
                const passed = checks.filter(c => c.pass).length;
                const warned = checks.filter(c => !c.pass && c.warn).length;
                const failed = checks.filter(c => !c.pass && !c.warn).length;
                const fixable = checks.filter(c => !c.pass && c.fix?.applyField);
                return (
                  <div className="bg-white border border-[#0B0B0B]/10 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-[14px] font-semibold text-[#0B0B0B]">2026 SEO Checks</h3>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${failed === 0 && warned === 0 ? "bg-emerald-100 text-emerald-700" : failed > 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                        {failed === 0 && warned === 0 ? "All Good" : failed > 0 ? `${failed} Failed` : `${warned} Warning${warned > 1 ? "s" : ""}`}
                      </span>
                      <span className="text-[10px] text-[#0B0B0B]/35">{passed}/{checks.length} passed</span>
                      {fixable.length > 0 && (
                        <button onClick={() => fixable.forEach(c => applyFix(c.fix!.applyField!, c.fix!.applyValue!))}
                          className="ml-auto text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 transition-colors">
                          Fix All ({fixable.length})
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#0B0B0B]/40 mb-4">Checks for voice search, Google answer boxes, reader trust, and content structure. Tap <strong>Fix</strong> on anything that failed for step-by-step help.</p>
                    <div className="space-y-2">{checks.map(c => renderCheck(c))}</div>
                  </div>
                );
              })()}

              {/* Internal link suggestions */}
              {internalLinks.length > 0 && (
                <div className="bg-white border border-[#0B0B0B]/10 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-[13px] font-semibold text-[#0B0B0B] mb-3 flex items-center gap-2"><Link2 size={13} /> Internal Link Opportunities</h3>
                  <p className="text-[11px] text-[#0B0B0B]/40 mb-3">Posts with topical overlap - consider linking to them:</p>
                  <div className="space-y-2">
                    {internalLinks.map((p) => (
                      <div key={p.slug} className="flex items-center justify-between gap-3 py-2 border-b border-[#0B0B0B]/5 last:border-0">
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-[#0B0B0B] truncate">{p.title}</p>
                          <p className="text-[10px] text-[#0B0B0B]/40">/{p.slug}</p>
                        </div>
                        <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("createLink", `/${p.slug}`)}
                          className="text-[11px] font-semibold text-[#0B0B0B]/50 border border-[#0B0B0B]/12 px-2 py-1 rounded hover:bg-[#0B0B0B]/6 transition-colors shrink-0">
                          Insert link
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schema preview */}
              {seo.schemaType !== "None" && (
                <div className="bg-white border border-[#0B0B0B]/10 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-[13px] font-semibold text-[#0B0B0B] mb-3 flex items-center gap-2"><Code size={13} /> Schema Markup ({seo.schemaType})</h3>
                  <pre className="text-[10px] text-[#0B0B0B]/60 bg-[#fafafa] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                    {JSON.stringify(generateSchema(data, seo), null, 2).slice(0, 600) + "..."}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-60 shrink-0">
          {/* Publish panel */}
          <div className="border border-[#0B0B0B]/10 rounded-xl overflow-hidden mb-3 bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0B0B0B]/4">
              <span className="text-[11px] font-bold text-[#0B0B0B]/70 uppercase tracking-widest">Publish</span>
              <div className="flex gap-1.5">
                <button onClick={() => handleSave("draft")} className="text-[11px] font-semibold bg-white border border-[#0B0B0B]/15 text-[#0B0B0B]/55 px-2.5 py-1 rounded hover:bg-[#f5f5f5] transition-colors">
                  Save Draft
                </button>
                <button className="text-[11px] font-semibold bg-white border border-[#0B0B0B]/15 text-[#0B0B0B]/55 px-2.5 py-1 rounded hover:bg-[#f5f5f5] transition-colors">
                  Preview
                </button>
              </div>
            </div>
            <div className="px-4 py-3 space-y-0">
              <FieldRow label="Status:">
                <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} className="text-[12px] text-[#0B0B0B] border border-[#0B0B0B]/12 rounded px-2 py-1 bg-white outline-none">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </FieldRow>
              <FieldRow label="Visibility:">
                <div className="flex items-center gap-1.5">
                  {visibility === "public" ? <Globe size={12} className="text-[#0B0B0B]/40" /> : <Lock size={12} className="text-[#0B0B0B]/40" />}
                  <select value={visibility} onChange={(e) => setVisibility(e.target.value as "public" | "private")} className="text-[12px] text-[#0B0B0B] border border-[#0B0B0B]/12 rounded px-2 py-1 bg-white outline-none">
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </FieldRow>
              <FieldRow label="Date:">
                <input type="text" value={data.date} onChange={(e) => setField("date", e.target.value)} className="text-[12px] text-[#0B0B0B] border border-[#0B0B0B]/12 rounded px-2 py-1 bg-white outline-none w-36 text-right" />
              </FieldRow>
            </div>
            <div className="px-4 pb-4 pt-1">
              <button onClick={() => handleSave("publish")} disabled={saving} className="w-full bg-[#0B0B0B] text-white text-[13px] font-semibold py-2.5 rounded-lg hover:bg-[#0B0B0B]/85 disabled:opacity-40 transition-colors">
                {saving ? "Saving..." : "Publish"}
              </button>
            </div>
          </div>

          {/* Focus Keyword */}
          <SidePanel title="Focus Keyword" icon={<Target size={12} />}>
            <input
              value={seo.focusKeyword}
              onChange={(e) => setSeoField("focusKeyword", e.target.value)}
              placeholder="e.g. founder brand strategy"
              className="w-full border border-[#0B0B0B]/12 rounded-lg px-2.5 py-1.5 text-[12px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/30 bg-white mb-2"
            />
            <input
              value={seo.secondaryKeywords}
              onChange={(e) => setSeoField("secondaryKeywords", e.target.value)}
              placeholder="Secondary keywords (comma separated)"
              className="w-full border border-[#0B0B0B]/12 rounded-lg px-2.5 py-1.5 text-[12px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/30 bg-white mb-2"
            />
            {seo.searchIntent && (
              <div className="flex items-center gap-1.5 mt-1">
                <Lightbulb size={11} className="text-[#0B0B0B]/35" />
                <span className="text-[11px] text-[#0B0B0B]/45">Detected intent: </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${INTENT_LABELS[seo.searchIntent]?.color ?? "text-[#0B0B0B]/50 bg-[#0B0B0B]/6"}`}>
                  {INTENT_LABELS[seo.searchIntent]?.label ?? "Unknown"}
                </span>
              </div>
            )}
          </SidePanel>

          {/* Meta Tags */}
          <SidePanel title="Meta Tags" icon={<FileText size={12} />}>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold text-[#0B0B0B]/45 uppercase tracking-widest">SEO Title</label>
                  <CharCount val={seo.seoTitle.length} max={60} />
                </div>
                <input
                  value={seo.seoTitle}
                  onChange={(e) => setSeoField("seoTitle", e.target.value)}
                  placeholder={data.title || "SEO title..."}
                  className="w-full border border-[#0B0B0B]/12 rounded-lg px-2.5 py-1.5 text-[12px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/30 bg-white"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold text-[#0B0B0B]/45 uppercase tracking-widest">Meta Description</label>
                  <CharCount val={seo.metaDescription.length} max={160} warn={120} />
                </div>
                <textarea
                  value={seo.metaDescription}
                  onChange={(e) => setSeoField("metaDescription", e.target.value)}
                  placeholder={data.excerpt || "Meta description..."}
                  rows={3}
                  className="w-full border border-[#0B0B0B]/12 rounded-lg px-2.5 py-1.5 text-[12px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/30 bg-white resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#0B0B0B]/45 mb-1 uppercase tracking-widest">Canonical URL</label>
                <input
                  value={seo.canonicalUrl}
                  onChange={(e) => setSeoField("canonicalUrl", e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-[#0B0B0B]/12 rounded-lg px-2.5 py-1.5 text-[12px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/30 bg-white"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={seo.noIndex} onChange={(e) => setSeoField("noIndex", e.target.checked)} className="accent-[#0B0B0B] w-3.5 h-3.5" />
                <span className="text-[12px] text-[#0B0B0B]/60">Noindex this post</span>
              </label>
            </div>
          </SidePanel>

          {/* Social / OG */}
          <SidePanel title="Social Preview" defaultOpen={false} icon={<Share2 size={12} />}>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold text-[#0B0B0B]/45 uppercase tracking-widest">OG Title</label>
                  <CharCount val={seo.ogTitle.length} max={60} />
                </div>
                <input value={seo.ogTitle} onChange={(e) => setSeoField("ogTitle", e.target.value)} placeholder={seoTitleDisplay} className="w-full border border-[#0B0B0B]/12 rounded-lg px-2.5 py-1.5 text-[12px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/30 bg-white" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold text-[#0B0B0B]/45 uppercase tracking-widest">OG Description</label>
                  <CharCount val={seo.ogDescription.length} max={160} warn={120} />
                </div>
                <textarea value={seo.ogDescription} onChange={(e) => setSeoField("ogDescription", e.target.value)} placeholder={metaDescDisplay} rows={2} className="w-full border border-[#0B0B0B]/12 rounded-lg px-2.5 py-1.5 text-[12px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/30 bg-white resize-none" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#0B0B0B]/45 mb-2 uppercase tracking-widest">OG Image</label>
                <ImagePickerField label="" value={seo.ogImage} onChange={(url) => setSeoField("ogImage", url)} shape="square" size={56} />
              </div>
              {(seo.ogImage || seo.ogTitle || seo.ogDescription) && (
                <div className="rounded-xl overflow-hidden border border-[#0B0B0B]/10 mt-2">
                  {seo.ogImage && <img src={seo.ogImage} alt="OG preview" className="w-full h-24 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                  <div className="p-3 bg-[#f7f7f5]">
                    <p className="text-[10px] text-[#0B0B0B]/35 uppercase mb-0.5">GROWITBUDDY.COM</p>
                    <p className="text-[12px] font-bold text-[#0B0B0B] leading-snug truncate">{seo.ogTitle || seoTitleDisplay}</p>
                    <p className="text-[11px] text-[#0B0B0B]/55 mt-0.5 line-clamp-2">{seo.ogDescription || metaDescDisplay}</p>
                  </div>
                </div>
              )}
            </div>
          </SidePanel>

          {/* Schema */}
          <SidePanel title="Schema Markup" defaultOpen={false} icon={<Code size={12} />}>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-[#0B0B0B]/45 mb-1 uppercase tracking-widest">Schema Type</label>
                <select value={seo.schemaType} onChange={(e) => setSeoField("schemaType", e.target.value as PostSeo["schemaType"])} className="w-full border border-[#0B0B0B]/12 rounded-lg px-2.5 py-1.5 text-[12px] text-[#0B0B0B] outline-none bg-white">
                  <option value="Article">Article (default)</option>
                  <option value="BlogPosting">Blog Post</option>
                  <option value="NewsArticle">News Article</option>
                  <option value="TechArticle">Tech Article</option>
                  <option value="Review">Review</option>
                  <option value="FAQ">FAQ Page</option>
                  <option value="HowTo">HowTo Guide</option>
                  <option value="VideoObject">Video</option>
                  <option value="WebPage">Web Page</option>
                  <option value="None">None</option>
                </select>
              </div>

              {seo.schemaType === "FAQ" && (
                <div>
                  <label className="block text-[10px] font-semibold text-[#0B0B0B]/45 mb-2 uppercase tracking-widest">FAQ Items</label>
                  {seo.faqItems.map((item, i) => (
                    <div key={i} className="bg-[#fafafa] rounded-lg p-2.5 mb-2 border border-[#0B0B0B]/8">
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <input value={item.question} onChange={(e) => { const n = [...seo.faqItems]; n[i] = { ...item, question: e.target.value }; setSeoField("faqItems", n); }} placeholder="Question" className="flex-1 text-[11px] border border-[#0B0B0B]/12 rounded px-2 py-1 outline-none bg-white" />
                        <button onClick={() => setSeoField("faqItems", seo.faqItems.filter((_, j) => j !== i))} className="text-[#0B0B0B]/25 hover:text-red-500 p-1 rounded transition-colors"><Trash2 size={11} /></button>
                      </div>
                      <textarea value={item.answer} onChange={(e) => { const n = [...seo.faqItems]; n[i] = { ...item, answer: e.target.value }; setSeoField("faqItems", n); }} placeholder="Answer" rows={2} className="w-full text-[11px] border border-[#0B0B0B]/12 rounded px-2 py-1 outline-none bg-white resize-none" />
                    </div>
                  ))}
                  <button onClick={() => setSeoField("faqItems", [...seo.faqItems, { question: "", answer: "" }])} className="w-full text-[11px] font-semibold text-[#0B0B0B]/50 border border-dashed border-[#0B0B0B]/15 rounded-lg py-2 hover:border-[#0B0B0B]/30 hover:text-[#0B0B0B] transition-colors flex items-center justify-center gap-1">
                    <Plus size={11} /> Add FAQ Item
                  </button>
                </div>
              )}

              {seo.schemaType === "HowTo" && (
                <div>
                  <label className="block text-[10px] font-semibold text-[#0B0B0B]/45 mb-2 uppercase tracking-widest">Steps</label>
                  {seo.howToSteps.map((step, i) => (
                    <div key={i} className="bg-[#fafafa] rounded-lg p-2.5 mb-2 border border-[#0B0B0B]/8">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] font-bold text-[#0B0B0B]/40 w-5 shrink-0">#{i + 1}</span>
                        <input value={step.name} onChange={(e) => { const n = [...seo.howToSteps]; n[i] = { ...step, name: e.target.value }; setSeoField("howToSteps", n); }} placeholder="Step name" className="flex-1 text-[11px] border border-[#0B0B0B]/12 rounded px-2 py-1 outline-none bg-white" />
                        <button onClick={() => setSeoField("howToSteps", seo.howToSteps.filter((_, j) => j !== i))} className="text-[#0B0B0B]/25 hover:text-red-500 p-1 rounded transition-colors"><Trash2 size={11} /></button>
                      </div>
                      <textarea value={step.text} onChange={(e) => { const n = [...seo.howToSteps]; n[i] = { ...step, text: e.target.value }; setSeoField("howToSteps", n); }} placeholder="Step description" rows={2} className="w-full text-[11px] border border-[#0B0B0B]/12 rounded px-2 py-1 outline-none bg-white resize-none" />
                    </div>
                  ))}
                  <button onClick={() => setSeoField("howToSteps", [...seo.howToSteps, { name: "", text: "" }])} className="w-full text-[11px] font-semibold text-[#0B0B0B]/50 border border-dashed border-[#0B0B0B]/15 rounded-lg py-2 hover:border-[#0B0B0B]/30 hover:text-[#0B0B0B] transition-colors flex items-center justify-center gap-1">
                    <Plus size={11} /> Add Step
                  </button>
                </div>
              )}
            </div>
          </SidePanel>

          {/* Post Attributes */}
          <SidePanel title="Post Attributes" defaultOpen={false}>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-[#0B0B0B]/45 mb-1 uppercase tracking-widest">Slug (URL)</label>
                <input value={data.slug} onChange={(e) => setField("slug", e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))} placeholder="post-url-slug" className="w-full border border-[#0B0B0B]/12 rounded-lg px-2.5 py-1.5 text-[12px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/30 bg-white" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#0B0B0B]/45 mb-1 uppercase tracking-widest">Read Time</label>
                <input value={data.readTime} onChange={(e) => setField("readTime", e.target.value)} placeholder="6 min read" className="w-full border border-[#0B0B0B]/12 rounded-lg px-2.5 py-1.5 text-[12px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/30 bg-white" />
              </div>
            </div>
          </SidePanel>

          {/* Categories */}
          <SidePanel title="Categories" defaultOpen={false} icon={<Tag size={12} />}>
            <div className="space-y-1.5">
              {TAGS.map((t) => (
                <label key={t} className="flex items-center gap-2.5 cursor-pointer py-0.5 group">
                  <input type="radio" name="post-tag" value={t} checked={data.tag === t} onChange={() => setField("tag", t)} className="accent-[#0B0B0B] w-3.5 h-3.5" />
                  <span className="text-[13px] text-[#0B0B0B]/65 group-hover:text-[#0B0B0B] transition-colors">{t}</span>
                </label>
              ))}
            </div>
          </SidePanel>

          {/* Excerpt */}
          <SidePanel title="Excerpt" defaultOpen={false}>
            <textarea value={data.excerpt} onChange={(e) => setField("excerpt", e.target.value)} placeholder="Short description for the blog listing page..." rows={3} className="w-full border border-[#0B0B0B]/12 rounded-lg px-2.5 py-2 text-[12px] text-[#0B0B0B] outline-none focus:border-[#0B0B0B]/30 bg-white resize-y leading-relaxed" />
          </SidePanel>

          {/* Featured Image */}
          <SidePanel title="Featured Image" defaultOpen={true}>
            <ImageCropUploader
              value={data.featuredImage ?? ""}
              onChange={(url) => setField("featuredImage", url)}
            />
          </SidePanel>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// SCHEMA GENERATOR
// ─────────────────────────────────────

function generateSchema(post: BlogPost, seo: PostSeo) {
  const SITE = "https://growitbuddy.com";
  const base = {
    "@context": "https://schema.org",
    "author": { "@type": "Person", "name": "Suraj Sharma", "@id": `${SITE}/#suraj-sharma` },
    "publisher": { "@type": "Organization", "name": "GrowitBuddy", "@id": `${SITE}/#organization` },
    "datePublished": post.date,
    "headline": seo.seoTitle || post.title,
    "description": seo.metaDescription || post.excerpt,
    "url": `${SITE}/insights/${post.slug}`,
    "image": post.featuredImage || `${SITE}/opengraph.jpg`,
    "mainEntityOfPage": { "@type": "WebPage", "@id": `${SITE}/insights/${post.slug}` },
  };
  if (seo.schemaType === "FAQ") {
    return {
      "@type": "FAQPage",
      ...base,
      mainEntity: seo.faqItems.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
    };
  }
  if (seo.schemaType === "HowTo") {
    return {
      "@type": "HowTo",
      ...base,
      name: seo.seoTitle || post.title,
      step: seo.howToSteps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.name, text: s.text })),
    };
  }
  if (seo.schemaType === "None") {
    return { "@type": "WebPage", ...base };
  }
  const type = seo.schemaType || "Article";
  return {
    "@type": type,
    ...base,
    "articleSection": post.tag,
    "keywords": [seo.focusKeyword, seo.secondaryKeywords].filter(Boolean).join(", "),
  };
}

// ─────────────────────────────────────
// POST LIST
// ─────────────────────────────────────

function PostList({ posts, onEdit, onDelete, onAdd }: {
  posts: BlogPost[]; onEdit: (p: BlogPost) => void; onDelete: (slug: string, idx: number) => void; onAdd: () => void;
}) {
  const [filter, setFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [search, setSearch] = useState("");
  const allTags = ["All", ...Array.from(new Set(posts.map((p) => p.tag)))];
  const shown = posts
    .filter((p) => filter === "All" || p.tag === filter)
    .filter((p) => {
      if (statusFilter === "all") return true;
      const s = p.status ?? "published";
      return s === statusFilter;
    })
    .filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase()));
  const publishedCount = posts.filter((p) => (p.status ?? "published") === "published").length;
  const draftCount = posts.filter((p) => (p.status ?? "published") === "draft").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-black tracking-tight text-[#0B0B0B]">Blog / Insights</h1>
          <p className="text-[13px] text-[#0B0B0B]/40 mt-0.5">{posts.length} post{posts.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0B0B0B]/30" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts..." className="pl-8 pr-3 py-2 text-[13px] border border-[#0B0B0B]/12 rounded-xl outline-none focus:border-[#0B0B0B]/30 bg-white w-48" />
          </div>
          <button onClick={onAdd} className="flex items-center gap-2 bg-[#0B0B0B] text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0B0B0B]/85 transition-colors">
            <Plus size={15} /> Add New
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 mb-3">
        {([
          { key: "all",       label: "All",       count: posts.length },
          { key: "published", label: "Published",  count: publishedCount },
          { key: "draft",     label: "Draft",      count: draftCount },
        ] as const).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${
              statusFilter === key
                ? key === "published"
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : key === "draft"
                    ? "bg-amber-500 border-amber-500 text-white"
                    : "bg-[#0B0B0B] border-[#0B0B0B] text-white"
                : "bg-white border-[#0B0B0B]/12 text-[#0B0B0B]/55 hover:border-[#0B0B0B]/25"
            }`}
          >
            {key === "published" && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
            {key === "draft"     && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
            {label}
            <span className={`text-[10px] font-bold ml-0.5 ${statusFilter === key ? "opacity-70" : "opacity-45"}`}>({count})</span>
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-0 border-b border-[#0B0B0B]/8 mb-4">
        {allTags.map((t) => {
          const count = t === "All" ? posts.length : posts.filter((p) => p.tag === t).length;
          return (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3.5 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${filter === t ? "text-[#0B0B0B] border-[#0B0B0B]" : "text-[#0B0B0B]/40 border-transparent hover:text-[#0B0B0B]/65"}`}>
              {t} <span className="ml-1 text-[11px] opacity-50">({count})</span>
            </button>
          );
        })}
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#0B0B0B]/6 bg-[#fafafa]">
              <th className="text-left px-5 py-3 text-[10px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest">Title</th>
              <th className="text-left px-3 py-3 text-[10px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest w-24">Status</th>
              <th className="text-left px-3 py-3 text-[10px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest w-24">SEO</th>
              <th className="text-left px-3 py-3 text-[10px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest w-28">Category</th>
              <th className="text-left px-3 py-3 text-[10px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest w-32">Date</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {shown.map((post, i) => {
              const realIdx = posts.indexOf(post);
              const seoData: PostSeo = { ...defaultSeo(), ...post.seo };
              const { score } = computeSeoScore(post, post.content ?? "", seoData);
              const hasKeyword = !!seoData.focusKeyword;
              return (
                <tr key={post.slug + i} className="border-b border-[#0B0B0B]/5 hover:bg-[#0B0B0B]/2 group transition-colors last:border-0">
                  <td className="px-5 py-3.5">
                    <button onClick={() => onEdit(post)} className="text-left w-full flex items-center gap-3">
                      <div className="shrink-0 w-14 h-10 rounded-lg overflow-hidden bg-[#0B0B0B]/6 flex items-center justify-center">
                        {post.featuredImage ? (
                          <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-bold text-[#0B0B0B]/20 uppercase tracking-widest">No img</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#0B0B0B] hover:underline">{post.title || "(no title)"}</p>
                        {post.excerpt && <p className="text-[11px] text-[#0B0B0B]/38 truncate max-w-[280px] mt-0.5">{post.excerpt}</p>}
                      </div>
                    </button>
                  </td>
                  <td className="px-3 py-3.5">
                    {(() => {
                      const s = post.status ?? "published";
                      return s === "published" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Draft
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-3.5">
                    {hasKeyword ? (
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-400"}`} />
                        <span className="text-[11px] font-semibold text-[#0B0B0B]/60">{score}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#0B0B0B]/25">No keyword</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5"><span className="text-[10px] font-bold bg-[#0B0B0B]/6 text-[#0B0B0B]/55 px-2 py-0.5 rounded-full">{post.tag}</span></td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1.5 text-[12px] text-[#0B0B0B]/45"><Calendar size={11} />{post.date}</div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={() => onEdit(post)} className="p-1.5 rounded hover:bg-[#0B0B0B]/8 text-[#0B0B0B]/35 hover:text-[#0B0B0B] transition-colors" title="Edit"><Edit2 size={13} /></button>
                      <button onClick={() => onDelete(post.slug, realIdx)} className="p-1.5 rounded hover:bg-red-50 text-[#0B0B0B]/35 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-[13px] text-[#0B0B0B]/30">No posts found.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────
// MAIN
// ─────────────────────────────────────

export default function AdminBlog() {
  const { getContent, saveContent } = useAdmin();
  const [posts, setPosts] = useState<BlogPost[]>(DEFAULT_POSTS);
  const [editing, setEditing] = useState<{ post: BlogPost; isNew: boolean } | null>(null);

  useEffect(() => {
    getContent("blog").then((d) => {
      if (d?.posts) setPosts(d.posts as BlogPost[]);
    });
  }, [getContent]);

  async function persist(updated: BlogPost[]) {
    await saveContent("blog", { posts: updated });
    setPosts(updated);
  }

  async function handleSave(post: BlogPost) {
    let updated: BlogPost[];
    if (editing?.isNew) {
      updated = [...posts, post];
    } else {
      updated = posts.map((p) => (p.slug === editing?.post.slug ? post : p));
    }
    await persist(updated);
    if (editing?.isNew) {
      setEditing({ post, isNew: false });
    }
  }

  function handleDelete(slug: string, idx: number) {
    if (!confirm("Delete this post permanently?")) return;
    persist(posts.filter((_, i) => i !== idx));
  }

  if (editing) {
    return (
      <PostEditor
        post={editing.post}
        isNew={editing.isNew}
        onBack={() => setEditing(null)}
        onSave={handleSave}
        allPosts={posts}
      />
    );
  }

  return (
    <div className="space-y-4">
      <PostList
        posts={posts}
        onEdit={(post) => setEditing({ post: { ...post }, isNew: false })}
        onDelete={handleDelete}
        onAdd={() =>
          setEditing({
            isNew: true,
            post: {
              slug: "",
              title: "",
              excerpt: "",
              date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
              tag: "Founders",
              readTime: "5 min read",
              content: "",
            },
          })
        }
      />
      <PageVisibilityCard slug="insights" />
    </div>
  );
}
