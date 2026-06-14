export interface SiteGuideSection {
  heading: string;
  body: string;
}

export interface SiteGuideData {
  hero: {
    badge: string;
    title: string;
    lede: string;
  };
  sections: SiteGuideSection[];
}

export const SITE_GUIDE_DEFAULTS: SiteGuideData = {
  hero: {
    badge: "Complete Site Guide · v1.5",
    title: "Understand the entire GrowitBuddy website — in 10 minutes.",
    lede:
      "A complete, beginner-friendly walkthrough of every public page, every admin tool, the CRM, SEO controls, talent-pool system, and how lead emails work. No technical knowledge required.",
  },
  sections: [
    {
      heading: "What is this website?",
      body: `GrowitBuddy is a premium content authority & marketing agency website with a full self-serve admin panel. Almost every word, image, and section visible on the public site can be edited from the admin panel — no developer needed for day-to-day content updates.

Two sides of the website:
• Public site — what your visitors see (home, services, blog, talent pools, contact forms, etc.)
• Admin panel at /admin — password-protected control center to edit content, view leads, manage SEO.`,
    },
    {
      heading: "How the website is structured",
      body: `Frontend — The visible website (Vercel). React + Vite. What visitors see.
API server — The brain (Render). Saves leads, handles login, sends emails.
Database — Postgres (Neon). Stores all content, leads, influencers, blog posts.

You don't need to touch any of these directly. Everything flows through the admin panel. The 3 services talk to each other automatically.`,
    },
    {
      heading: "All the public pages, explained",
      body: `Every page below is editable from the admin panel. Click any page name to open it in a new tab.

Home (/) — Landing page — hero, stats, services preview, framework, testimonials. Main CTA to attract leads.
Services (/services) — Detailed services offered (content production, distribution, authority building).
Work / Portfolio (/work) — Case studies and client logos. Showcases past work.
Framework (/framework) — Your 4-step methodology: Positioning → Production → Distribution → Inbound Demand.
Blog / Insights (/blog) — All blog posts listing page.
Blog Post (/blog/:slug) — Individual blog post page — auto-generated for every post you publish in /admin/blog.
Portfolio (/portfolio) — Full portfolio grid — all case studies / project work.
Portfolio Category (/portfolio/:category) — Filtered portfolio view by category (auto-routed from category tags).
Shared Portfolio (/portfolio/shared/:slug) — Private, trackable portfolio link generated from /admin/portfolio-shares — share with one prospect at a time.
About (/about) — Founder story, team, mission.
Contact (/contact) — Contact form — submissions land in your inbox + Admin Leads.
Creator Network (/creators) — Sign-up form for content creators wanting to join your network.
Career (/career) — Full-time + internship + freelancer job applications in one tabbed page.
Influencer Directory (/influencers) — Browse all influencers. Each has a profile at /influencers/:slug.
Distribution Network (/distribution) — Information about page-owner / distribution partnership.
Page Owner Apply (/join/page-owner) — Application form for Instagram/social page owners.
Authority Audit (/authority-audit) — Free audit lead-magnet tool.
Resources (/resources) — Free resource library — unlimited eBooks, PDFs, Drive links, Notion templates, videos, toolkits and more. Featured strip, category filter, FAQ section, AI Quick-Answer block, rich JSON-LD.
Page Variants (catch-all) (/:slug) — Any published page variant lives at its own URL slug (e.g. /home-v2, /services-bold). Created from Admin → Page Variants. Used for A/B tests or campaign-specific landing pages.
Editors Pool (Creator School) (/editors-pool) — Onboarding hub with VSL, guidelines, FAQ.
Talent Pools (9 pages) (/designers-pool) — Each pool has its own URL: /designers-pool · /thumbnail-designers · /writers-pool · /social-media-managers · /motion-designers · /ai-creators · /ugc-creators · /meme-designers · /video-editors. Each has landing page + dedicated form.
Certificate Verify (/verify) — Public certificate verification page.
Site Guide (this page) (/guide) — The team onboarding guide you're reading right now. Bookmark and share with every new member.
SEO Strategy Guide (/seo-guide) — Standalone internal SEO playbook — how to optimise each page, write meta titles, structure keywords, etc.
Privacy & Terms (/privacy) — Legal pages.`,
    },
    {
      heading: "The Admin Panel — your control center",
      body: `Open /admin and login with your admin password. You'll land on the dashboard.

How to edit any page's content
1. Log into /admin with your admin password.
2. From the left sidebar, click the page you want to edit (e.g. 'Home' or 'About').
3. You'll see a form with all the editable fields — headings, paragraphs, images, lists.
4. Make your changes. Use the image picker (paste a URL or upload from Media Library) for any image field.
5. Click 'Save' at the bottom. Changes appear on the public site within seconds — no rebuild needed.
6. Open the public page in a new tab to verify (you may need to hard-refresh: Ctrl+Shift+R / Cmd+Shift+R).

Every admin page — complete list
Dashboard (/admin) — At-a-glance home screen: stat cards (total blog posts, influencers, total leads, sections saved), a horizontal bar chart of 'Leads by Type', a 'Recent Saves' timeline, and a status grid of every editable section on the site.
Home page editor (/admin/home) — Edit hero text, stats, services preview, testimonials on the homepage.
About editor (/admin/about) — Edit founder story, team, mission text on /about.
Services editor (/admin/services) — Edit services list and descriptions.
Work editor (/admin/work) — Edit Work page hero, sections, case study cards.
Portfolio items (/admin/portfolio) — Add/edit/hide individual case studies shown on /work.
Client Logos (/admin/logos) — Upload & re-order client logos shown on the Work page.
Framework editor (/admin/framework) — Edit the 4-step methodology page.
Blog / Insights (/admin/blog) — Add, edit, delete blog posts (rich text + cover image) PLUS a full SEO suite: live SEO Score ring (0-100), Yoast-style checks (keyword density, title/meta inclusion, paragraph length), Search-Intent detector (Informational / Commercial / Transactional), Power-Word analysis on titles, and an Internal-Link Suggester that recommends other posts to link to based on content similarity.
Influencers DB (/admin/influencers) — Add/edit influencer profiles shown in directory.
Influencer page (/admin/influencer-explore) — Edit the /influencers landing page (hero, filters).
Distribution page (/admin/distribution-network) — Edit /distribution landing page content.
Page-Owner content (/admin/distribution-pages) — Edit /join/page-owner application page.
Join Network (/admin/join-network) — Edit /join landing page (path-choosing screen).
Contact page (/admin/contact) — Edit /contact page text, form labels.
Career page (/admin/career) — Unified editor for /career — manages full-time, internship and freelancer tabs in one place. The freelancer form now includes a 'Clipping' skill option alongside the existing creative skills. (Legacy URLs /admin/freelancers and /admin/full-time redirect here.)
Authority Audit (/admin/authority-audit) — Edit the audit tool's content & questions.
Resources (/admin/resources) — Add unlimited resources of any format (eBook, PDF, Drive, Notion, video, template, toolkit, course, sheet, Figma, audio, link). Per-resource: primary + secondary CTA buttons, corner badges, cover image, file format/size, gated/featured toggles, keywords + AI summary. Page-level: FAQs (auto-FAQPage schema), AI Quick-Answer, AI keywords, primary entity, related topics, audience, geo, factual claims — all baked into JSON-LD.
Page Variants (/admin/page-variants) — Create alternate versions of any page (Home, Services, etc.) at custom URLs (e.g. /home-v2). Each variant has its own editable content, separate SEO, and can be published or kept as draft. Useful for A/B tests, campaign landers, or experimenting without breaking the live page.
Creator School (/admin/editors-pool) — Edit Creator School hub content.
Talent Pool editors (9) (/admin/pool-designers) — 9 separate editors, one per pool: /admin/pool-designers · /pool-thumbnail-designers · /pool-writers · /pool-social-managers · /pool-motion-designers · /pool-ai-creators · /pool-ugc-creators · /pool-meme-designers · /pool-editors.
Portfolio Share Links (/admin/portfolio-shares) — Generate unique, trackable shared-portfolio URLs (live at /portfolio/shared/:slug) to send to individual prospects. See open counts and revoke any link any time.
Leads (CRM) (/admin/leads) — ALL form submissions — contact, newsletter, creator, page-owner, freelancer, full-time, internship. Searchable + exportable.
Talent Pool Leads (/admin/talent-pool-leads) — Separate inbox just for talent-pool applications, grouped by pool type.
Certificates (/admin/certificates) — Issue & manage certificates verifiable at /verify/:id.
Media Library (/admin/media) — Drag-and-drop multi-file uploader, search by filename, full-screen lightbox preview, one-click 'Copy URL' for cross-linking the image into any other editor. Every image picker in the admin reads from here.
Team Members (/admin/team) — Create login accounts for team members. Role-based: 'super' admins see everything; 'member' accounts can be limited to specific sections only (e.g. just Leads, or just Blog) so a writer can publish without ever seeing leads or settings.
SEO settings (/admin/seo) — Full control centre: GLOBAL master 'Site Indexing' toggle (kill-switch that adds noindex,nofollow site-wide and empties sitemap), then per-page — indexing on/off, follow on/off, include-in-sitemap on/off, title, description, canonical URL, custom Facebook/OG (title + description + image), custom Twitter card (type + title + description + image), and a JSON-LD editor with live validation. Live SERP / Twitter / Facebook preview cards update as you type. Auto-warns if title or description is too long/short.
Navbar editor (/admin/navbar) — Edit navigation menu items, links, order.
Footer editor (/admin/footer) — Edit footer columns, links, social handles.
Site Settings (/admin/settings) — Site-wide: logo, favicon, contact info, social links, PLUS design controls — primary + accent color pickers with preset palettes (Midnight, Forest, etc.), global font-scale slider (80%–130%), custom-cursor toggle and page-intro animation toggle, with a live theme-preview card.
Page Visibility (/admin/page-visibility) — Hide any page from the public with one of two modes: 'Maintenance' (shows a maintenance screen) or 'Coming Soon' (shows a teaser screen). Each mode has its own editable headline + message. Hidden pages are automatically removed from sitemap.xml.
Optimizer (/admin/optimize) — Performance toggles + one-click warm-up. Keep DB warm, cache stable public reads (60s/5min), long-cache images, clear caches, run VACUUM ANALYZE. All safe — defaults are OFF, never deletes content.`,
    },
    {
      heading: "Page Variants — A/B test any page without breaking the live one",
      body: `Page Variants let you create alternate versions of any page — Home, Services, Resources, etc. — and publish each one at its own URL. The original page stays untouched. Perfect for A/B testing copy, running campaign-specific landing pages, or trying a bold redesign without risking the live page.

How a variant works
• Lives at its own URL slug (e.g. /home-v2, /services-bold).
• Has its own editable content, fully isolated from the original page.
• Has its own SEO (title, description, OG image, canonical, schema).
• Can be draft (only you see it via admin) or published (live to the public).
• Shows a small gold "Variant" banner at the top so you never confuse it with the original.
• All published variants appear in the admin sidebar under the "Published Variants" group for one-click access.

How to create a new variant
1. Go to /admin/page-variants → click 'Add Variant'.
2. Pick the base page you want to clone (e.g. 'Home').
3. Give it a URL slug — keep it short and descriptive (e.g. 'home-launch', 'services-q1').
4. Optionally set a label (only visible in admin) to remember what you're testing.
5. Save as draft first — the variant URL becomes editable but is not yet public.
6. Open the variant URL (e.g. /home-launch) — you'll see the original content as a starting point with a gold 'Variant' banner at the top.
7. Edit the content from its dedicated admin editor — changes apply only to the variant.
8. Toggle 'Published' when you're happy — the public can now reach it directly via the URL.

A few things to know
• The original page at its real URL (e.g. /) is never affected by any variant.
• Don't use a slug that already exists as a real page (e.g. /contact) — the real page always wins.
• To send traffic to a variant: paste its URL directly into ads / emails / posts. Nothing on the main site links to variants automatically.
• Delete a variant from /admin/page-variants when the test is over — the URL will then 404.`,
    },
    {
      heading: "Resources Library — unlimited free downloads with tagda SEO",
      body: `The /resources page is a full self-serve content library — add unlimited resources of any format and each one is automatically optimised for Google + AI search (ChatGPT, Perplexity, Google AI Overviews) through rich structured data.

13 resource formats you can add
eBook · PDF · Google Drive · Notion · Video · Template · Toolkit · Guide · Course · Spreadsheet · Figma File · Audio · External Link

How to add a new resource
1. Open /admin/resources and click 'Add resource'.
2. Pick the resource type (eBook, PDF, Drive, Notion, etc.) — this sets the icon, badge label and default CTA text.
3. Fill in Title, Short Description (the card preview), and a Long Description (used in structured data + AI citations).
4. Paste the Primary Link — your Drive / Notion / file URL. This becomes the main 'Download' or 'Open' button.
5. Optional: add a Secondary Link + Label (e.g. 'Preview', 'Watch walkthrough') — a second outlined button appears on the card.
6. Add a Corner Badge (e.g. 'New', 'Most popular', 'Updated') for emphasis.
7. Optional: cover image, file format, file size, author, published date — used both visually and in structured data.
8. Toggle 'Featured' to surface the resource in the featured strip at the top of the page.
9. Toggle 'Gated' if access requires an email (shows an 'Email required' badge).
10. Fill the per-resource Keywords + AI Summary — these go straight into the page's JSON-LD so LLMs cite this resource correctly.
11. Reorder with the up/down arrows, duplicate with the copy icon, delete with the trash icon. Save when done.

The page-level SEO controls (GEO / AEO / AIO / AISEO)
Below the resources list in the admin, there are two SEO blocks. SEO Basics covers page title, meta description, canonical URL, OG image — the standard stuff. The SEO Advanced (AI / GEO / AEO / AISEO) block is what makes the page rank in AI answers and Google's AI Overviews:
• AI Quick-Answer Summary — 2-3 sentences answering "what is this page?". Shown as a visible gold-accent block at the top of the page AND fed to JSON-LD abstract for LLM citation.
• AI Target Keywords — comma-separated. Drives the page's JSON-LD keywords.
• Primary Entity + Related Topics — entity SEO + topical authority signals. Help Google understand exactly what the page is about.
• Audience — fed to schema:Audience so Google knows who the page is for.
• Geo Location + Language — Generative Engine Optimization signals for regional / multilingual ranking.
• Factual Claims — one verifiable fact per line. Rendered as a bullet list under the Quick Answer block (great for AEO / People-Also-Ask) and used by AI assistants as a citation source.
• FAQs section (separate card above) — Q&A pairs that emit as FAQPage schema, the same kind Google uses for People-Also-Ask boxes.

All of the above is auto-injected into a structured-data graph that includes a CollectionPage, an ItemList of DigitalDocument nodes (one per resource, with format / date / author / keywords / license), a FAQPage, and a BreadcrumbList — no developer work required, just fill in the form.`,
    },
    {
      heading: "Power features — Blog SEO Suite, Roles & Portfolio Shares",
      body: `A few high-value tools tucked inside the admin that most teams miss on day one. Take 5 minutes here — these save hours later.

Blog SEO Suite (built into /admin/blog)
Open any blog post in the admin and the right rail shows a live SEO analysis as you type — no plugin required:
• SEO Score Ring — a 0-100 ring chart updating live. Aim for 80+ before publishing.
• Yoast-style checks — keyword density, keyword in title/meta/H1, paragraph length, internal-link count, image alt-text coverage. Each check turns green / yellow / red.
• Search-Intent Detector — auto-classifies the post as Informational, Commercial, or Transactional based on title + body. Helps you align CTAs to intent.
• Power-Word Analysis — flags titles missing high-conversion words ("ultimate", "proven", "free", "step-by-step", etc.).
• Internal-Link Suggester — analyses your existing posts and recommends 3-5 related ones to link to from the current draft. One-click insert.

Role-based team permissions (/admin/team)
You can hand out admin access without giving everyone the keys to the kingdom:
• Super admin — full access (you).
• Member — pick exactly which sections they can edit (e.g. only Blog, only Leads, only Talent Pool Leads).
• Hidden sections simply don't appear in their sidebar — they can't even browse to the URL.
• Perfect for: a writer who needs Blog access only, a sales person who only needs the CRM, a designer who only needs Media Library.

Portfolio Share Links (/admin/portfolio-shares)
Instead of sending your public /portfolio link to every prospect, generate a private, trackable link for each one:
• Generate a unique slug per prospect — link lives at /portfolio/shared/:slug.
• Optionally filter which case studies show up (so you can curate per client).
• See open count + last-opened date — know exactly when a prospect is engaging.
• Revoke any link any time — the URL instantly 404s.

Site Optimizer (/admin/optimize)
Safe performance toggles for the whole site. All defaults are OFF — nothing here ever deletes content:
• Database Keep-Alive — pings Neon every few minutes so the database never goes idle (no cold starts).
• Public-read cache — 60-second / 5-minute caching of public content reads (massive speed boost, safe defaults).
• Long-cache images — instructs browsers + CDN to hold image responses for 30 days.
• Clear caches — one-click flush after a content change if a viewer still sees an old version.
• VACUUM ANALYZE — one-click DB maintenance, runs in the background.`,
    },
    {
      heading: "CRM — managing every lead",
      body: `Every form on the public site (contact, newsletter, talent pool, career, etc.) saves automatically into a single database called Leads. There's no separate CRM tool — your CRM IS the admin panel.

Where leads go
• General leads → /admin/leads (contact, career, page-owner, newsletter, creator)
• Talent-pool applications → /admin/talent-pool-leads (separated by pool: designers, writers, motion, etc.)
• You also receive an email notification for every submission (see "Email Notifications" section).

How to handle a new lead (recommended workflow)
1. You get an email notification — open it to see the lead details.
2. Optional: log into /admin/leads to see full context, all fields, and previous leads from same email.
3. Reply directly from your email client (the notification email's 'Reply-To' is set to the lead's email — just hit Reply).
4. After contact: mark the lead as 'Contacted' or 'Converted' (status column in the Leads table).
5. Export to CSV anytime if you want to push leads into Notion / Sheets / external CRM.

Filtering & searching leads
The leads page has filters at the top: by type (contact / newsletter / freelancer / etc.), by date range, and a search box (matches name, email, message). Use these to find anything fast.`,
    },
    {
      heading: "Talent Pool — 9 specialized landing pages",
      body: `Talent pools are dedicated landing pages for each creative speciality. Each has its own URL, its own editable content, its own application form, and submissions go to a dedicated inbox grouped by pool type.

Designers — Public: /designers-pool — Edit: /admin/pool-designers
Thumbnail Designers — Public: /thumbnail-designers — Edit: /admin/pool-thumbnail-designers
Writers — Public: /writers-pool — Edit: /admin/pool-writers
Social Media Managers — Public: /social-media-managers — Edit: /admin/pool-social-managers
Motion Designers — Public: /motion-designers — Edit: /admin/pool-motion-designers
AI Creators — Public: /ai-creators — Edit: /admin/pool-ai-creators
UGC Creators — Public: /ugc-creators — Edit: /admin/pool-ugc-creators
Meme Designers — Public: /meme-designers — Edit: /admin/pool-meme-designers
Video Editors — Public: /video-editors — Edit: /admin/pool-editors

How to update a talent-pool page
1. Open the matching admin page (e.g. /admin/pool-writers for the Writers Pool).
2. Edit the hero text, perks, requirements, and FAQ as you wish.
3. Toggle 'Page Visibility' if you want to temporarily hide the pool from the public.
4. Save. Public page updates immediately.
5. All submissions from any pool's form land in /admin/talent-pool-leads, grouped by pool name.`,
    },
    {
      heading: "SEO — the complete, beginner-friendly playbook",
      body: `SEO simply means: making sure your pages show up when people search on Google. You don't need any technical skill — every control lives in /admin/seo as plain text fields. This section walks through every single one of them, in order, with concrete examples.

A. The 6 words you'll see everywhere — explained in 1 line each
• Title — the big blue clickable line in a Google result. ~50–60 characters.
• Meta Description — the small grey paragraph under the title. ~140–160 characters.
• Canonical URL — the "official" web address of this page. Stops Google from treating duplicates as separate pages.
• OG Image — the preview picture shown when the link is shared on WhatsApp / Facebook / LinkedIn / X. Size: 1200 × 630 px.
• Robots / Indexing — instruction to Google: "show this page in search results, or hide it?".
• JSON-LD (Schema) — a small hidden snippet that tells Google what the page is (an article, a FAQ, a product, etc.). Helps you get rich results.

B. How SEO is controlled — two layers
1. The Global Site-Indexing master switch
At the very top of /admin/seo there is one big green/red toggle: "Allow Google & other search engines to index this entire site". When this is OFF, the whole site is hidden from Google (a noindex, nofollow tag is added to every page and the sitemap is emptied). Use it when the site is in pre-launch / private mode. Keep it ON in production.

2. Per-page settings (one row per page)
Below the global switch is the page list. Click any page (Home, Services, a specific blog post, etc.) to open its full SEO form. Whatever you set here overrides the default that ships with the page. Save once and it's live on Google within a few hours.

C. Every field inside a per-page SEO form — top to bottom
1) Indexability toggles (3 switches)
• Allow Search Engine Indexing — ON = page can appear in Google results. OFF = page is hidden from Google (noindex).
• Allow Search Engine Following — ON = Google can follow the links on this page. OFF = links are ignored (nofollow). Almost always keep ON.
• Include in Sitemap — ON = page is listed in /sitemap.xml so Google can find it quickly. OFF = it still works but Google has to discover it on its own.

2) Title
Aim for 50–60 characters. Put the main keyword first, then a small benefit, then your brand.
Bad: "Home"
Good: "Content & Distribution Agency for Founders — GrowitBuddy"
If too long, Google chops the end with "…". The admin warns you in red when you exceed 60 chars.

3) Meta Description
140–160 characters. Treat it like an ad — sell the click. Mention who the page is for, the benefit, and a verb (Learn / Join / Download / Book).
Good: "Authority, content and distribution systems for founders and modern brands. Book a free strategy call and see what a 90-day plan looks like."

4) Canonical URL
Usually leave blank — the page's own URL is used automatically. Only fill it when the same content lives at two URLs and you want Google to treat one as the official one. Use the full URL with https://.

5) Facebook / OG preview (when shared on WhatsApp, LinkedIn, FB)
• OG Title — usually same as the SEO title. Override if you want a snappier social headline.
• OG Description — same as meta description by default. Override for social-only tone.
• OG Image — 1200 × 630 px JPG/PNG, < 1 MB. This is what people SEE in their feed — invest 10 minutes on it.

6) Twitter / X preview
• Twitter Card Type — pick Summary Large Image 99% of the time (the big image card). Use Summary only for short profile-style pages.
• Twitter Title / Description / Image — separate fields if you want a different feel on X vs LinkedIn. Otherwise leave blank and the OG values are used.

7) JSON-LD (Custom Schema)
This is the "tell Google what the page IS" snippet. Most pages already inject sensible schema automatically (Organization on home, Article on blog, CollectionPage on Resources, BreadcrumbList on every page). Only paste a custom JSON-LD object here if you want to add or override one. The editor:
• Live-validates the JSON syntax as you type (red border = broken).
• Accepts any valid https://schema.org type — Product, Event, LocalBusiness, Course, Recipe, etc.
• If you don't know JSON, leave this empty — the auto-generated schema is already good.

8) Live preview cards (right side of the form)
As you type, three preview cards on the right update in real time:
• Google SERP card — exactly how your title + URL + description will look on Google.
• Twitter card — your headline + image as the timeline will render it.
• Facebook / LinkedIn / WhatsApp card — same preview those platforms use.

D. Step-by-step: optimise any single page in 5 minutes
1. Open /admin/seo and click the page you want to optimise (e.g. 'Home').
2. Confirm the 3 indexability switches are ON (Indexing, Following, Sitemap).
3. Write a Title (50–60 chars). Keyword first, benefit, brand. Watch the character counter.
4. Write a Meta Description (140–160 chars). Treat it like an ad — sell the click.
5. Leave the Canonical empty unless you have a duplicate-content reason to set it.
6. Upload an OG Image at 1200×630 px. Use a clear headline + brand logo overlay.
7. Pick Twitter Card Type = 'Summary Large Image'. Leave Twitter fields blank to reuse OG.
8. Glance at the 3 live preview cards on the right — make sure the title isn't truncated and the image looks crisp.
9. Click Save. The change is live on your site within seconds.
10. Re-share the URL on WhatsApp to yourself — the new preview should appear within 1–2 minutes.
11. Optional but recommended: open Google Search Console → URL Inspection → paste the URL → click 'Request Indexing' so Google re-crawls within hours instead of days.

E. Sitemap, robots.txt & Google Search Console
• Sitemap — auto-generated live at /sitemap.xml. It always reflects your current pages. Hidden pages (Page Visibility off, or Include-in-Sitemap off) are automatically excluded.
• robots.txt — auto-generated at /robots.txt and points Google to the sitemap. If the global Site-Indexing master switch is OFF, robots.txt blocks every crawler.
• Google Search Console setup — go to search.google.com/search-console, add your domain, verify it (DNS record is easiest), then in 'Sitemaps' submit https://yourdomain.com/sitemap.xml. Within a few days Google will index everything.
• Forcing a re-index — for any single URL: Search Console → URL Inspection → paste the URL → 'Request Indexing'. Usually live in Google within a few hours.

F. Beyond the basics — AI Search, Blog SEO, Resources GEO/AEO
• Blog posts have a full live SEO Suite right inside /admin/blog — score ring (aim 80+), Yoast-style checks, search-intent detector, power-word analysis, internal-link suggester. See the 'Power Features' section above.
• Resources page has its own GEO / AEO / AISEO controls (AI Quick-Answer, AI keywords, primary entity, audience, geo location, factual claims, FAQs). See the 'Resources Library' section above.
• Page Variants each get their own independent SEO — perfect for A/B testing meta titles.
• WhatsApp / iMessage preview = same as OG. There's nothing extra to configure for those platforms.

G. Common mistakes to avoid
• Turning the global Site-Indexing switch OFF and forgetting about it after launch — your site disappears from Google.
• Using the same Title and Description on every page — Google sees this as "thin / duplicate" content.
• Uploading a tiny OG image (e.g. 400×400) — looks blurry on LinkedIn and stretched on Facebook. Always 1200×630.
• Putting the brand name first in every Title — wastes precious characters. Keyword first, brand last.
• Pasting random JSON-LD copied from another website — Search Console will throw schema errors. Leave the JSON-LD box empty unless you know exactly what you're adding.
• Hiding a page via Page Visibility but expecting it to still rank — Google treats it as 404 and drops it.`,
    },
    {
      heading: "Email Notifications — every lead lands in your inbox",
      body: `How it works
When anyone submits any form on the public site, the API server uses Resend (an email delivery service) to send a beautifully formatted notification email to your inbox. The email contains every field the user filled in, and the 'Reply-To' header is set to the user's email — so you can reply directly.

Where do the emails go?
By default, both general and career emails go to cs.growitbuddy@gmail.com. These are controlled by 2 environment variables on the server: NOTIFY_EMAIL (general) and CAREERS_EMAIL (talent / jobs).

If emails aren't arriving — checklist
1. Check Gmail Promotions and Spam folders first — emails from onboarding@resend.dev often land there.
2. Verify that RESEND_API_KEY is set on the Render dashboard (Settings → Environment).
3. If using the default onboarding@resend.dev sender, your Resend account email MUST match cs.growitbuddy@gmail.com — otherwise Resend rejects the email silently.
4. For production reliability, verify your own domain in Resend and set EMAIL_FROM to e.g. notifications@growitbuddy.com.

Forms that send emails (all 8 of them)
• Contact form
• Newsletter signup
• Creator onboarding
• Page-owner application
• Freelancer application
• Full-time application
• Internship application
• Talent Pool (all 9 types)`,
    },
    {
      heading: "Media Library — managing images",
      body: `The Media Library at /admin/media is your central image storage. Every image picker in the admin panel can either:
• Upload a new image directly (saved to Cloudinary, permanent CDN URL).
• Pick from already-uploaded images in the library.
• Paste any external URL (Unsplash, etc.) — works instantly but you don't control the source.

Built-in image cropper
When you upload an image to a field that needs a specific aspect ratio (square logo, 16:9 hero, etc.), a crop modal appears automatically so you can frame it correctly before saving.`,
    },
    {
      heading: "Tech behind the scenes (you don't need to touch this)",
      body: `Frontend — React 19 + Vite 7 + Tailwind v4. Hosted on Vercel (free, global CDN, auto-deploy from GitHub).
API Server — Express 5 on Node 22. Hosted on Render (free plan, may cold-start after 15min idle).
Database — PostgreSQL on Neon (free, serverless). Drizzle ORM for queries.
Emails — Resend (free tier, 3000 emails/month).
Images — Cloudinary (free tier, plenty for this scale).
Source code — GitHub: Surajsharmaco/growitbuddy. Every push to main auto-deploys.`,
    },
    {
      heading: "Frequently asked questions",
      body: `Q: I edited content in admin but the public site still shows the old version. Why?
A: Hard-refresh the page: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac). The CDN caches aggressively but admin saves are live within seconds — your browser is just showing a stale copy.

Q: Can I add new pages without a developer?
A: You can edit any existing page's content fully. Creating brand-new pages (with new layouts, new URLs) requires a developer because it involves writing React components.

Q: How do I add a team member who can edit content but not delete things?
A: Go to /admin/team and create a team member account. They get a separate login and limited permissions.

Q: Can I hide a page from the public temporarily?
A: Yes. Go to /admin/page-visibility and toggle off any page. Visitors will get a 404, and the page is removed from the sitemap.

Q: How do I add a new blog post?
A: Open /admin/blog → 'Add New Post' → fill in title, slug, cover image, body (rich text), tags → Save. It appears at /blog immediately, with its own URL /blog/your-slug.

Q: Where do form submissions go if Resend isn't set up?
A: They are STILL saved to the database (/admin/leads). You just won't get an email notification. So nothing is lost — you'll just need to manually check the admin panel.

Q: How do I change my admin password?
A: The admin password is stored as an environment variable (ADMIN_PASSWORD) on the Render dashboard. Update it there and the change is live on next deploy (or instantly, depending on settings).

Q: Can I export all leads to a CSV?
A: Yes — open /admin/leads → click the 'Export CSV' button at the top. Same for talent-pool leads.

Q: What happens if the Render free plan goes down?
A: The first request after 15 minutes of inactivity takes ~30 seconds to wake up (cold start). After that, it's instant. Upgrade to Render's paid plan ($7/mo) to eliminate cold starts.

Q: How do I issue a certificate to a creator?
A: Go to /admin/certificates → 'Add New' → fill in name, course, date, image (optional) → Save. They get a unique URL at /verify/:id that they can share publicly.

Q: What is a Page Variant and when should I use one?
A: A variant is a separate, fully-editable copy of any page (Home, Services, Resources, etc.) at its own URL like /home-v2. Use it to A/B test new copy, run campaign-specific landers, or try a redesign without touching the live page. Create one at /admin/page-variants. Once published, it appears in the admin sidebar under 'Published Variants'.

Q: How do I add a free eBook / Drive link / Notion template to the Resources page?
A: Open /admin/resources → 'Add resource' → pick the type (PDF, Drive, Notion, video…) → paste your link in 'Primary Link' → fill title and short description → save. The card becomes live and clickable immediately. You can also add a secondary preview button and a corner badge like 'New' or 'Most popular'.

Q: What is the AI / GEO / AEO / AISEO block in Resources admin for?
A: Those fields control how Google's AI Overviews, ChatGPT, and Perplexity describe and cite your Resources page. Fill in the AI Quick-Answer Summary, AI keywords, primary entity, audience, geo location, and factual claims. The page automatically renders a Quick-Answer block at the top AND injects everything into JSON-LD structured data — no developer needed.

Q: Where does the Resources link live in the navigation?
A: It's in the Navbar 'More' dropdown (alongside Blog, Authority Audit and Contact) and also in the footer.

Q: How do I send a personal portfolio to a specific prospect?
A: Go to /admin/portfolio-shares → 'Generate Link' → pick which case studies to include (optional) → copy the unique URL. The prospect sees a clean private page at /portfolio/shared/:slug. You can see open counts and revoke the link any time.

Q: Can I give a writer access to ONLY the blog (not leads, settings, etc.)?
A: Yes. /admin/team → create a 'member' account → tick only 'Blog' in the permissions. Everything else stays hidden in their sidebar — they cannot even open the URL.

Q: How do I get a 90+ SEO score on a blog post?
A: Open /admin/blog → edit any post → check the SEO Score ring on the right. Address each red/yellow check: include your target keyword in title + meta + first paragraph, keep paragraphs short, add 2-3 internal links (use the Internal-Link Suggester), make sure every image has alt text. Score updates live as you type.

Q: The site feels slow first thing in the morning. What can I do?
A: That's a Render free-plan cold start. Go to /admin/optimize and turn ON 'Database Keep-Alive' and the 'Public-read cache' — both are safe defaults and instantly improve perceived speed. For a permanent fix, upgrade Render to the $7/mo plan.`,
    },
  ],
};
