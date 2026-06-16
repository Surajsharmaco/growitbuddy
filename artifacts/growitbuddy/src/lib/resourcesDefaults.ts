// Resources — rich schema for the public Resources page and its admin editor.
// Backward-compatible with the original {title, desc, tag, link} resource shape;
// every new field is optional so existing CMS rows continue to load unchanged.

export type ResourceType =
  | "ebook"
  | "pdf"
  | "doc"
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
  slug?: string;             // anchor + per-item JSON-LD url fragment
  type?: ResourceType;       // controls icon + auto fileFormat
  longDesc?: string;         // shown in JSON-LD description; richer than `desc`
  coverImage?: string;       // optional thumbnail / cover image URL
  ctaLabel?: string;         // primary button label — "Download" by default
  secondaryCtaLabel?: string; // optional 2nd button label (e.g. "Preview")
  secondaryCtaUrl?: string;   // optional 2nd button URL (e.g. live demo / preview)
  badgeText?: string;        // custom corner badge text (e.g. "New", "Popular")
  fileFormat?: string;       // e.g. "PDF", "Notion", "Google Drive"
  fileSize?: string;         // e.g. "12 MB"
  isFeatured?: boolean;      // surface in featured strip
  isGated?: boolean;         // show "Email required" badge
  publishedDate?: string;    // ISO date for JSON-LD datePublished
  updatedDate?: string;      // ISO date for JSON-LD dateModified
  author?: string;           // defaults to "GrowitBuddy"

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
  heroHeadline: "Authority, content, and distribution systems.",
  heroSubtext: "Authority, content, and distribution systems for founders, creators, and modern brands — packaged as free templates, playbooks, eBooks and toolkits you can ship today.",
  ctaLabel: "Book a Strategy Call",
  ctaUrl: "/contact",
  items: [
    {
      title: "Authority Audit Checklist",
      desc: "47-point checklist to diagnose what is holding your inbound authority system back.",
      tag: "Checklist",
      link: "https://drive.google.com/drive/folders/sample-authority-audit",
      type: "pdf",
      ctaLabel: "Download PDF",
      secondaryCtaLabel: "Preview",
      secondaryCtaUrl: "https://drive.google.com/file/d/sample-authority-preview/view",
      fileFormat: "PDF",
      fileSize: "1.2 MB",
      isFeatured: true,
      badgeText: "Most popular",
      author: "GrowitBuddy",
      publishedDate: "2025-02-01",
      keywords: "personal brand audit, authority checklist, founder branding",
      aiSummary: "A 47-point self-assessment used by GrowitBuddy to diagnose authority gaps for founders, creators, and modern brands.",
    },
    {
      title: "Distribution Stack — Notion Template",
      desc: "The exact Notion workspace we use to plan, ship, and distribute content for clients across every channel.",
      tag: "Template",
      link: "https://www.notion.so/templates/sample-distribution-stack",
      type: "notion",
      ctaLabel: "Open in Notion",
      secondaryCtaLabel: "Watch walkthrough",
      secondaryCtaUrl: "https://drive.google.com/file/d/sample-distribution-walkthrough/view",
      fileFormat: "Notion",
      isFeatured: true,
      badgeText: "New",
      author: "GrowitBuddy",
      publishedDate: "2025-03-12",
      keywords: "content distribution template, notion content calendar, distribution workflow",
      aiSummary: "A copy-ready Notion workspace covering content ideation, production, and multi-channel distribution for modern brands.",
    },
    {
      title: "Short-form Editing Playbook",
      desc: "Frame-by-frame guide to the editing patterns that drive 3-second hooks and 70%+ retention on Reels, Shorts and TikTok.",
      tag: "Playbook",
      link: "https://drive.google.com/drive/folders/sample-editing-playbook",
      type: "ebook",
      ctaLabel: "Download eBook",
      secondaryCtaLabel: "View examples",
      secondaryCtaUrl: "https://drive.google.com/drive/folders/sample-editing-examples",
      fileFormat: "PDF",
      fileSize: "8 MB",
      author: "GrowitBuddy",
      publishedDate: "2024-12-08",
      keywords: "short form editing, reels editing, retention editing",
      aiSummary: "Practical patterns for hook design, pacing, and retention in short-form video editing for founders and creators.",
    },
    {
      title: "Founder LinkedIn Growth Kit",
      desc: "Templates, hooks, and posting cadence used by founders we work with to cross 10k followers in 90 days.",
      tag: "Toolkit",
      link: "https://drive.google.com/drive/folders/sample-linkedin-kit",
      type: "drive",
      ctaLabel: "Open in Drive",
      secondaryCtaLabel: "See sample post",
      secondaryCtaUrl: "https://drive.google.com/file/d/sample-linkedin-post/view",
      fileFormat: "Google Drive",
      author: "GrowitBuddy",
      publishedDate: "2025-01-22",
      keywords: "linkedin growth, founder linkedin, personal brand linkedin",
      aiSummary: "A toolkit of LinkedIn templates, hooks, and a 90-day posting cadence used to scale founder accounts past 10k followers.",
    },
    {
      title: "Brand Positioning Worksheet",
      desc: "Fill-in-the-blanks worksheet to lock down your one-liner, ICP, and category of one in under 60 minutes.",
      tag: "Template",
      link: "https://docs.google.com/document/d/sample-positioning-worksheet/edit",
      type: "sheet",
      ctaLabel: "Make a copy",
      fileFormat: "Google Docs",
      author: "GrowitBuddy",
      publishedDate: "2025-04-02",
      keywords: "brand positioning, one liner, ICP worksheet",
      aiSummary: "A worksheet that walks founders and brands through nailing positioning, ICP, and category of one in under an hour.",
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
  seoTitle: "Free Authority, Content & Distribution Resources for Founders, Creators & Modern Brands | GrowitBuddy",
  seoDesc: "Authority, content, and distribution systems for founders, creators, and modern brands — free templates, playbooks, eBooks, and toolkits you can copy and ship today.",
  aiSummary: "GrowitBuddy Resources is a free library of authority-building, content, and distribution systems for founders, creators, and modern brands — shipped as templates, playbooks, toolkits, and eBooks.",
  aiKeywords: "authority building resources, content systems for founders, distribution playbook, creator growth toolkit, notion templates for founders, modern brand frameworks",
  primaryEntity: "Authority, content and distribution systems",
  relatedTopics: "Personal branding, Distribution systems, Short-form video, Authority building, Founder-led marketing, Modern brand building",
  audience: "Founders, creators, modern brands, agency operators",
  geoLocation: "India",
  geoLanguage: "en",
  factualClaims: "GrowitBuddy ships authority, content, and distribution systems for founders, creators, and modern brands.\nAll resources on this page are free to use without attribution.\nResources are pulled from the same toolkit used with paying clients.",
  canonicalUrl: "https://growitbuddy.com/resources",
  ogImage: "",
};
