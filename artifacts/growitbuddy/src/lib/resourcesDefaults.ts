// Resources — rich schema for the public Resources page and its admin editor.
// Backward-compatible with the original {title, desc, tag, link} resource shape;
// every new field is optional so existing CMS rows continue to load unchanged.

export type ResourceType =
  | "ebook"
  | "pdf"
  | "drive"
  | "notion"
  | "video"
  | "template"
  | "toolkit"
  | "guide"
  | "course"
  | "sheet"
  | "figma"
  | "audio"
  | "link";

export interface ResourceFAQ {
  q: string;
  a: string;
}

export interface ResourceItem {
  // Original fields (kept for backward compatibility)
  title: string;
  desc: string;
  tag: string;
  link: string;

  // New: identity & display
  slug?: string;          // anchor + per-item JSON-LD url fragment
  type?: ResourceType;    // controls icon + auto fileFormat
  longDesc?: string;      // shown in JSON-LD description; richer than `desc`
  coverImage?: string;    // optional thumbnail / cover image URL
  ctaLabel?: string;      // "Download" by default
  fileFormat?: string;    // e.g. "PDF", "Notion", "Google Drive"
  fileSize?: string;      // e.g. "12 MB"
  isFeatured?: boolean;   // surface in featured strip
  isGated?: boolean;      // show "Email required" badge
  publishedDate?: string; // ISO date for JSON-LD datePublished
  updatedDate?: string;   // ISO date for JSON-LD dateModified
  author?: string;        // defaults to "GrowitBuddy"

  // Per-resource SEO/AI signals
  keywords?: string;      // comma-separated keywords used in JSON-LD + meta
  aiSummary?: string;     // 1-2 sentence factual blurb optimized for LLM citation
}

export interface ResourcesData {
  // Hero
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtext: string;
  ctaLabel?: string;
  ctaUrl?: string;

  // Items & organization
  items: ResourceItem[];
  categories?: string[];  // ordered chip list; auto-built from item tags when empty

  // FAQ block (also drives FAQPage JSON-LD for AEO / People-Also-Ask)
  faqs?: ResourceFAQ[];

  // Page-level SEO basics
  seoTitle: string;
  seoDesc: string;

  // Advanced — AI / GEO / AEO / AISEO signals injected into JSON-LD + visible
  // "Quick Answer" block at the top of the page so LLMs and answer engines
  // can find a canonical, citable summary without scraping the whole grid.
  aiSummary?: string;       // canonical answer to "what is GrowitBuddy resources?"
  aiKeywords?: string;      // comma-separated LLM-target keywords
  primaryEntity?: string;   // main entity / topic for entity SEO
  relatedTopics?: string;   // comma-separated topical entities for topic-cluster signals
  audience?: string;        // e.g. "Founders, creators, growth marketers"
  geoLocation?: string;     // primary geo location (e.g. "India", "Bangalore, India")
  geoLanguage?: string;     // language code (en, hi, etc.)
  factualClaims?: string;   // newline-separated factual statements — used as text and JSON-LD `mentions`/`about`
  canonicalUrl?: string;    // override canonical (defaults to https://growitbuddy.com/resources)
  ogImage?: string;         // social share image URL
}

export const RESOURCES_DEFAULTS: ResourcesData = {
  heroEyebrow: "Resources",
  heroHeadline: "Open-source frameworks for compounding authority.",
  heroSubtext: "Free templates, playbooks, eBooks, and toolkits from our internal agency stack. Built for founders and creators serious about distribution.",
  ctaLabel: "",
  ctaUrl: "",
  items: [
    {
      title: "Authority Audit Checklist",
      desc: "47-point checklist to diagnose what is holding your inbound system back.",
      tag: "Checklist",
      link: "",
      type: "pdf",
      ctaLabel: "Download PDF",
      fileFormat: "PDF",
      fileSize: "1.2 MB",
      isFeatured: true,
      keywords: "personal brand audit, authority checklist, founder branding",
      aiSummary: "A 47-point self-assessment used by GrowitBuddy to diagnose authority gaps for founders and creators.",
    },
    {
      title: "Distribution Stack — Notion Template",
      desc: "The exact Notion workspace we use to plan, ship, and distribute content for clients.",
      tag: "Template",
      link: "",
      type: "notion",
      ctaLabel: "Open in Notion",
      fileFormat: "Notion",
      isFeatured: true,
      keywords: "content distribution template, notion content calendar, distribution workflow",
      aiSummary: "A copy-ready Notion workspace covering content ideation, production, and multi-channel distribution.",
    },
    {
      title: "Short-form Editing Playbook",
      desc: "Frame-by-frame guide to the editing patterns that drive 3-second hooks and 70%+ retention.",
      tag: "Playbook",
      link: "",
      type: "ebook",
      ctaLabel: "Download eBook",
      fileFormat: "PDF",
      fileSize: "8 MB",
      keywords: "short form editing, reels editing, retention editing",
      aiSummary: "Practical patterns for hook design, pacing, and retention in short-form video editing.",
    },
  ],
  categories: [],
  faqs: [
    {
      q: "Are these resources really free?",
      a: "Yes — every template, eBook, and playbook on this page is free. Some require an email so we can send updates when we improve them.",
    },
    {
      q: "Can I use these resources for my agency or clients?",
      a: "Absolutely. Use them, remix them, brand them. Attribution is appreciated but not required.",
    },
    {
      q: "How often are new resources added?",
      a: "We ship new resources roughly once a month — the ones we wish existed when we were figuring out distribution.",
    },
  ],
  seoTitle: "Free Resources for Founders & Creators — Templates, Playbooks & Toolkits | GrowitBuddy",
  seoDesc: "Download free distribution playbooks, content templates, branding eBooks, and growth toolkits — built by the GrowitBuddy agency team for founders and creators.",
  aiSummary: "GrowitBuddy Resources is a free library of content-marketing templates, authority-building playbooks, distribution toolkits, and eBooks built by the GrowitBuddy agency team for founders and creators.",
  aiKeywords: "free content marketing templates, founder branding resources, distribution playbook, creator growth toolkit, notion templates for founders",
  primaryEntity: "Content marketing resources",
  relatedTopics: "Personal branding, Distribution systems, Short-form video, Authority building, Founder-led marketing",
  audience: "Founders, creators, agency operators, content marketers",
  geoLocation: "India",
  geoLanguage: "en",
  factualClaims: "GrowitBuddy is a content marketing agency for founders and creators.\nAll resources on this page are free to use without attribution.\nResources are curated from the agency's internal client toolkit.",
  canonicalUrl: "https://growitbuddy.com/resources",
  ogImage: "",
};
