export interface SeoGuideSection {
  heading: string;
  body: string;
}

export interface SeoGuideData {
  hero: {
    badge: string;
    title: string;
    lede: string;
  };
  sections: SeoGuideSection[];
}

export const SEO_GUIDE_DEFAULTS: SeoGuideData = {
  hero: {
    badge: "Internal · Not Indexed",
    title: "GrowitBuddy — SEO Control Guide",
    lede: `A complete walkthrough of the admin SEO panel: what every field does, when to use it, and how Google sees your changes. Read once, refer forever.

Last updated: June 2026 · Audience: GrowitBuddy team, super-admins, content editors`,
  },
  sections: [
    {
      heading: "1. What this system does",
      body: `Every page on growitbuddy.com has SEO settings baked in by developers (sensible defaults). The SEO Control panel at /admin/seo lets super-admins override those defaults without touching code — change a title, hide a page from Google, swap the social preview image, add a schema, all live.

Changes apply instantly on next page-load. No deploy needed.

Tech in one line: Admin saves overrides → stored in database → page fetches them at runtime → replaces title / meta / schema tags in the browser → Google sees the new version on its next crawl.`,
    },
    {
      heading: "2. Who can access it",
      body: `• Super-admin only. Regular team members can't open or edit SEO.
• The panel lives at /admin/seo — visible in the admin sidebar after super-admin login.
• Backend enforces this too — even if someone hacks the UI, the API rejects non-super requests with a 403.`,
    },
    {
      heading: "3. The basic workflow",
      body: `1. Log in at /admin/login with a super-admin account.
2. Click SEO Control in the left sidebar.
3. Pick a page from the list on the left (~30 pages are managed — Home, About, Services, Pools, etc.).
4. Edit any field. Empty fields fall back to the developer default — they don't break anything.
5. Watch the live SERP preview and social previews at the bottom of the page.
6. Hit Save. Live within seconds.

Quick tip: If you fill in nothing and just toggle "noindex", the page is hidden from Google but keeps all its original meta. Perfect for landing pages you only want to share via direct link.`,
    },
    {
      heading: "4. Indexability toggles",
      body: `Three master switches at the top of every page editor:

Index
What it tells Google: "Show this page in search results" (ON) / "Hide it" (OFF — sends noindex)
Use when… Turn OFF for thank-you pages, internal landers, duplicates, work-in-progress

Follow
What it tells Google: "Crawl the links on this page" (ON) / "Don't pass authority through them" (OFF — sends nofollow)
Use when… Turn OFF on pages with lots of paid / sponsored / user-submitted links

Sitemap
What it tells Google: Include this page's URL in /api/sitemap.xml (ON) or leave it out (OFF)
Use when… Turn OFF for utility pages even if they're indexable — keeps the sitemap clean

Important: Turning Index OFF means Google will eventually drop the page from search. It can take days to weeks to take effect. To bring it back, re-enable and request re-indexing in Google Search Console.`,
    },
    {
      heading: "5. Title & description",
      body: `Title
• Shows as the blue clickable headline in Google results and the browser tab.
• Keep it under 60 characters. Google cuts off longer titles with "…"
• Put the most important keyword first. Brand name at the end is conventional but optional.
• Example: "Hire Top YouTube Editors in India — GrowitBuddy"

Description
• The grey text below the title in Google results.
• Aim for 150–160 characters. Longer is fine but only the first ~160 show.
• Write it like an ad — clear value, one action verb, no keyword stuffing.
• Google sometimes rewrites this based on the query. That's normal.

Use the live SERP preview in the editor to see exactly how your title and description will appear on Google before saving.`,
    },
    {
      heading: "6. Canonical URL",
      body: `The canonical URL tells Google "this is the official version of this page." It prevents duplicate-content penalties when the same content lives at multiple URLs (e.g. /services and /services?ref=newsletter).

• Leave blank for 99% of pages — the system auto-fills it with the page's own URL.
• Set it explicitly only when you have two pages with similar content and want to consolidate ranking to one.
• Always use the full https://growitbuddy.com/... URL, never a relative path.`,
    },
    {
      heading: "7. Open Graph (Facebook / LinkedIn / WhatsApp)",
      body: `When someone pastes your page link in WhatsApp, LinkedIn, Facebook, or Slack, the preview card shown is built from Open Graph (OG) tags.

OG Title — Card headline. Can be longer/more emotional than SEO title. Up to ~95 chars.
OG Description — Card subtext. 1–2 sentences. Up to ~200 chars.
OG Image — The visual. 1200×630 px, under 1 MB, JPG or PNG. Bold text, high contrast.
OG Type — Card category. Usually website. Use article for blog posts.

WhatsApp aggressively caches OG previews — once it sees an image for a URL, it remembers for weeks. To force-refresh, change the image URL (e.g. add ?v=2).`,
    },
    {
      heading: "8. Twitter / X cards",
      body: `Same idea as OG, but Twitter uses its own meta tags. Two card styles:

• summary — small square thumbnail next to text. Good for text-heavy posts.
• summary_large_image — full-width banner image with title underneath. Almost always the better choice for marketing pages.

If you leave Twitter fields blank, Twitter automatically falls back to your OG tags. So in practice, filling OG is enough for most pages.`,
    },
    {
      heading: "9. JSON-LD schema (structured data)",
      body: `JSON-LD is a small block of structured data that helps Google understand the page — unlocks rich results like star ratings, FAQ accordions, breadcrumbs, business info, event details, etc.

The editor accepts raw JSON. The system validates it before saving — broken JSON is silently rejected so it never ships.

Example: Organization schema
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "GrowitBuddy",
  "url": "https://growitbuddy.com",
  "logo": "https://growitbuddy.com/logo-dark.png",
  "sameAs": [
    "https://www.linkedin.com/company/growitbuddy",
    "https://www.instagram.com/growitbuddy"
  ]
}

Example: FAQ schema (unlocks expandable Q&A in search results)
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What does GrowitBuddy do?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "We help creators build distribution networks."
    }
  }]
}

Validate any schema at search.google.com/test/rich-results before saving — paste the URL after publishing, or paste the JSON directly.

Don't lie in schema. Don't claim ratings you don't have, FAQs you didn't publish, or breadcrumbs that don't match navigation. Google penalises misleading structured data.`,
    },
    {
      heading: "10. AI / AEO / GEO fields",
      body: `These newer fields target how AI search engines (ChatGPT, Perplexity, Google AI Overviews, Gemini) read and cite your pages. They're optional but increasingly important.

AI Summary
A 2–3 sentence factual summary of the page. AI models use this when deciding whether to quote you. Write it like a Wikipedia opening — neutral, specific, fact-dense.

AEO Keywords (Answer Engine Optimisation)
Comma-separated question phrases people ask voice assistants and chatbots, like:
how to hire a video editor, best youtube editors in india, creator economy agencies

GEO Region
Geographic targeting hint — e.g. IN, IN-MH, global. Helps AI engines surface you for region-specific queries.

These fields are emitted as custom meta tags. They don't hurt classical SEO — they're additive.`,
    },
    {
      heading: "11. Sitemap behaviour",
      body: `There are three sitemaps, all derived from one source so they can never drift apart:

Main (dynamic)
URL: growitbuddy-api.onrender.com/api/sitemap.xml
What it lists: All sitemap-eligible marketing pages (~27), live from the admin panel — respects every Index / Sitemap toggle.

Blog (dynamic)
URL: growitbuddy-api.onrender.com/api/sitemap-blog.xml
What it lists: Every published blog post, under canonical /blog/... URLs. Updated hourly.

Same-domain fallback
URL: growitbuddy.com/sitemap.xml
What it lists: A static backup listing the same eligible pages. Regenerated via the gen:sitemap script.

All three are referenced from robots.txt and can be submitted to Google Search Console. The main sitemap auto-updates from the admin panel:
• Includes all sitemap-eligible pages by default (~27).
• Excludes any page where the Index toggle is OFF.
• Excludes any page where the Sitemap toggle is OFF.
• Updates the moment you save — no rebuild needed.

One source of truth: the page list, paths, and priorities live in a single shared registry (@workspace/seo) used by the website, the API sitemap, and the static fallback. A page added there shows up everywhere — no more hand-syncing three lists.`,
    },
    {
      heading: "12. Do's & Don'ts",
      body: `Do
• Write titles for humans first, robots second. Click-worthy beats keyword-stuffed every time.
• Refresh OG images when you do a major redesign — outdated previews look unprofessional in WhatsApp.
• Set canonical URLs when running A/B tests or paid-campaign landing pages.
• Use the live SERP / social previews before saving. Catch typos there.
• Check Google Search Console weekly for crawl errors after any bulk SEO change.

Don't
• Don't paste the same title and description across multiple pages — Google treats it as a duplication signal.
• Don't write 5-paragraph meta descriptions. Google only shows ~160 characters.
• Don't add fake review or rating schema. It's a manual-action penalty waiting to happen.
• Don't noindex a page that's currently ranking well — you'll lose all its traffic.
• Don't change canonical URLs randomly — it's the easiest way to tank a page's rankings.`,
    },
    {
      heading: "13. FAQ",
      body: `How long until Google sees my changes?
Anywhere from a few hours to 2 weeks. Submit the page URL in Google Search Console → URL Inspection → "Request Indexing" to speed it up.

I changed a title but Google still shows the old one. Why?
Google caches search results. Wait a week, then check again. Also confirm the new title is actually live by viewing the page source (Ctrl+U → look for <title>).

Can I A/B test SEO titles?
Not natively. Change one page's title, wait 4 weeks, look at the click-through-rate change in Search Console, then keep or revert.

What if I break something?
Every field is reversible. Clear it to fall back to the developer default. Worst case, an empty editor = the same SEO the page had before this system existed.

Does this work for the blog?
No — blog posts have their own SEO managed inside the blog editor and their own sitemap (/api/sitemap-blog.xml). Blog posts live under canonical /blog/... URLs (old /insights/... links permanently redirect). This panel covers the ~30 core marketing pages only.

Can I share this guide?
Yes. Hit Download as PDF at the top, or share this URL directly — it's intentionally noindex so it won't show up in public search but anyone with the link can read it.`,
    },
    {
      heading: "Need help?",
      body: `Questions? Ping the engineering team. This page is maintained alongside the SEO Control panel — when the panel changes, this guide changes.`,
    },
  ],
};
