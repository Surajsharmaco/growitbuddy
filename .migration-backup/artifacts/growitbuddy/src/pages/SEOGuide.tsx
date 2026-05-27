import { useEffect } from "react";

export default function SEOGuide() {
  useEffect(() => {
    document.title = "GrowitBuddy — Internal SEO Guide";
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("robots", "noindex, nofollow, noarchive, nosnippet");
    setMeta("googlebot", "noindex, nofollow");
    return () => {
      setMeta("robots", "index, follow");
    };
  }, []);

  return (
    <div className="seo-guide-root">
      <style>{`
        .seo-guide-root {
          max-width: 880px; margin: 0 auto; padding: 56px 24px 96px;
          color: #0B0B0B; font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
          line-height: 1.6;
        }
        .seo-guide-root h1 { font-size: 36px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 8px; }
        .seo-guide-root .lede { color: #0B0B0B99; font-size: 16px; margin: 0 0 8px; }
        .seo-guide-root .badge {
          display: inline-block; background: #FEF3C7; color: #92400E;
          font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px;
          letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 24px;
        }
        .seo-guide-root h2 {
          font-size: 22px; font-weight: 700; margin: 48px 0 12px;
          padding-top: 24px; border-top: 1px solid #E5E5E0;
        }
        .seo-guide-root h3 { font-size: 16px; font-weight: 700; margin: 24px 0 8px; }
        .seo-guide-root p { margin: 0 0 12px; font-size: 15px; }
        .seo-guide-root ul, .seo-guide-root ol { padding-left: 22px; margin: 0 0 16px; }
        .seo-guide-root li { margin-bottom: 6px; font-size: 15px; }
        .seo-guide-root code {
          background: #F4F4EF; padding: 2px 6px; border-radius: 4px;
          font-size: 13px; font-family: "SF Mono", Menlo, Consolas, monospace;
        }
        .seo-guide-root pre {
          background: #0B0B0B; color: #F9FAFB; padding: 16px; border-radius: 8px;
          overflow-x: auto; font-size: 13px; line-height: 1.55; margin: 0 0 16px;
        }
        .seo-guide-root .tip {
          background: #F0FDF4; border-left: 3px solid #16A34A; padding: 12px 14px;
          border-radius: 4px; margin: 12px 0; font-size: 14px;
        }
        .seo-guide-root .warn {
          background: #FEF2F2; border-left: 3px solid #DC2626; padding: 12px 14px;
          border-radius: 4px; margin: 12px 0; font-size: 14px;
        }
        .seo-guide-root .note {
          background: #EFF6FF; border-left: 3px solid #2563EB; padding: 12px 14px;
          border-radius: 4px; margin: 12px 0; font-size: 14px;
        }
        .seo-guide-root table {
          width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;
        }
        .seo-guide-root th, .seo-guide-root td {
          border: 1px solid #E5E5E0; padding: 10px 12px; text-align: left; vertical-align: top;
        }
        .seo-guide-root th { background: #FAFAF7; font-weight: 600; }
        .seo-guide-root .toc {
          background: #FAFAF7; border: 1px solid #E5E5E0; border-radius: 8px;
          padding: 20px 24px; margin: 24px 0 40px;
        }
        .seo-guide-root .toc h3 { margin-top: 0; font-size: 13px; text-transform: uppercase;
          letter-spacing: 0.06em; color: #0B0B0B80; }
        .seo-guide-root .toc ol { columns: 2; column-gap: 24px; padding-left: 18px; margin: 0; }
        .seo-guide-root .toc a { color: #0B0B0B; text-decoration: none; font-size: 14px; }
        .seo-guide-root .toc a:hover { text-decoration: underline; }
        .seo-guide-root .toolbar {
          position: sticky; top: 0; background: rgba(255,255,255,0.95);
          backdrop-filter: blur(8px); padding: 12px 0; margin: -56px -24px 0;
          padding-left: 24px; padding-right: 24px; border-bottom: 1px solid #E5E5E0;
          display: flex; gap: 8px; z-index: 10;
        }
        .seo-guide-root .toolbar button {
          background: #0B0B0B; color: #fff; border: 0; padding: 8px 14px;
          border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;
        }
        .seo-guide-root .toolbar button.ghost {
          background: transparent; color: #0B0B0B; border: 1px solid #E5E5E0;
        }
        .seo-guide-root .kicker { color: #0B0B0B80; font-size: 12px; text-transform: uppercase;
          letter-spacing: 0.08em; font-weight: 600; margin-bottom: 8px; }
        @media print {
          .seo-guide-root { max-width: none; padding: 0; }
          .seo-guide-root .toolbar { display: none; }
          .seo-guide-root h2 { page-break-before: auto; }
          .seo-guide-root pre, .seo-guide-root table, .seo-guide-root .tip,
          .seo-guide-root .warn, .seo-guide-root .note { page-break-inside: avoid; }
        }
      `}</style>

      <div className="toolbar">
        <button onClick={() => window.print()}>Download as PDF</button>
        <button className="ghost" onClick={() => navigator.clipboard.writeText(window.location.href)}>
          Copy share link
        </button>
      </div>

      <div style={{ marginTop: 32 }}>
        <span className="badge">Internal · Not Indexed</span>
        <h1>GrowitBuddy — SEO Control Guide</h1>
        <p className="lede">
          A complete walkthrough of the admin SEO panel: what every field does, when to use it,
          and how Google sees your changes. Read once, refer forever.
        </p>
        <p className="lede" style={{ fontSize: 13 }}>
          Last updated: May 2026 · Audience: GrowitBuddy team, super-admins, content editors
        </p>
      </div>

      <div className="toc">
        <h3>Contents</h3>
        <ol>
          <li><a href="#what">1. What this system does</a></li>
          <li><a href="#access">2. Who can access it</a></li>
          <li><a href="#workflow">3. The basic workflow</a></li>
          <li><a href="#indexability">4. Indexability toggles</a></li>
          <li><a href="#meta">5. Title &amp; description</a></li>
          <li><a href="#canonical">6. Canonical URL</a></li>
          <li><a href="#og">7. Open Graph (Facebook / LinkedIn)</a></li>
          <li><a href="#twitter">8. Twitter / X cards</a></li>
          <li><a href="#schema">9. JSON-LD schema</a></li>
          <li><a href="#ai">10. AI / AEO / GEO fields</a></li>
          <li><a href="#sitemap">11. Sitemap behaviour</a></li>
          <li><a href="#dos">12. Do's &amp; Don'ts</a></li>
          <li><a href="#faq">13. FAQ</a></li>
        </ol>
      </div>

      <section id="what">
        <h2>1. What this system does</h2>
        <p>
          Every page on growitbuddy.com has SEO settings baked in by developers (sensible
          defaults). The <strong>SEO Control panel</strong> at <code>/admin/seo</code> lets
          super-admins override those defaults <em>without touching code</em> — change a title,
          hide a page from Google, swap the social preview image, add a schema, all live.
        </p>
        <p>
          Changes apply instantly on next page-load. No deploy needed.
        </p>
        <div className="note">
          <strong>Tech in one line:</strong> Admin saves overrides → stored in database →
          page fetches them at runtime → replaces title / meta / schema tags in the browser →
          Google sees the new version on its next crawl.
        </div>
      </section>

      <section id="access">
        <h2>2. Who can access it</h2>
        <ul>
          <li><strong>Super-admin only.</strong> Regular team members can't open or edit SEO.</li>
          <li>The panel lives at <code>/admin/seo</code> — visible in the admin sidebar after super-admin login.</li>
          <li>Backend enforces this too — even if someone hacks the UI, the API rejects non-super requests with a 403.</li>
        </ul>
      </section>

      <section id="workflow">
        <h2>3. The basic workflow</h2>
        <ol>
          <li>Log in at <code>/admin/login</code> with a super-admin account.</li>
          <li>Click <strong>SEO Control</strong> in the left sidebar.</li>
          <li>Pick a page from the list on the left (24 pages are managed — Home, About, Services, Pools, etc.).</li>
          <li>Edit any field. Empty fields fall back to the developer default — they don't break anything.</li>
          <li>Watch the live <strong>SERP preview</strong> and <strong>social previews</strong> at the bottom of the page.</li>
          <li>Hit <strong>Save</strong>. Live within seconds.</li>
        </ol>
        <div className="tip">
          <strong>Quick tip:</strong> If you fill in nothing and just toggle "noindex", the page is hidden from Google but keeps all its original meta. Perfect for landing pages you only want to share via direct link.
        </div>
      </section>

      <section id="indexability">
        <h2>4. Indexability toggles</h2>
        <p>Three master switches at the top of every page editor:</p>
        <table>
          <thead>
            <tr><th>Toggle</th><th>What it tells Google</th><th>Use when…</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Index</strong></td>
              <td>"Show this page in search results" (ON) / "Hide it" (OFF — sends <code>noindex</code>)</td>
              <td>Turn OFF for thank-you pages, internal landers, duplicates, work-in-progress</td>
            </tr>
            <tr>
              <td><strong>Follow</strong></td>
              <td>"Crawl the links on this page" (ON) / "Don't pass authority through them" (OFF — sends <code>nofollow</code>)</td>
              <td>Turn OFF on pages with lots of paid / sponsored / user-submitted links</td>
            </tr>
            <tr>
              <td><strong>Sitemap</strong></td>
              <td>Include this page's URL in <code>/api/sitemap.xml</code> (ON) or leave it out (OFF)</td>
              <td>Turn OFF for utility pages even if they're indexable — keeps the sitemap clean</td>
            </tr>
          </tbody>
        </table>
        <div className="warn">
          <strong>Important:</strong> Turning Index OFF means Google will eventually drop the page from search. It can take days to weeks to take effect. To bring it back, re-enable and request re-indexing in Google Search Console.
        </div>
      </section>

      <section id="meta">
        <h2>5. Title &amp; description</h2>
        <h3>Title</h3>
        <ul>
          <li>Shows as the <strong>blue clickable headline</strong> in Google results and the browser tab.</li>
          <li><strong>Keep it under 60 characters.</strong> Google cuts off longer titles with "…"</li>
          <li>Put the most important keyword first. Brand name at the end is conventional but optional.</li>
          <li>Example: <em>"Hire Top YouTube Editors in India — GrowitBuddy"</em></li>
        </ul>
        <h3>Description</h3>
        <ul>
          <li>The <strong>grey text below the title</strong> in Google results.</li>
          <li><strong>Aim for 150–160 characters.</strong> Longer is fine but only the first ~160 show.</li>
          <li>Write it like an ad — clear value, one action verb, no keyword stuffing.</li>
          <li>Google sometimes rewrites this based on the query. That's normal.</li>
        </ul>
        <div className="tip">
          Use the <strong>live SERP preview</strong> in the editor to see exactly how your title and description will appear on Google before saving.
        </div>
      </section>

      <section id="canonical">
        <h2>6. Canonical URL</h2>
        <p>
          The canonical URL tells Google "this is the official version of this page." It
          prevents duplicate-content penalties when the same content lives at multiple URLs
          (e.g. <code>/services</code> and <code>/services?ref=newsletter</code>).
        </p>
        <ul>
          <li><strong>Leave blank</strong> for 99% of pages — the system auto-fills it with the page's own URL.</li>
          <li><strong>Set it explicitly</strong> only when you have two pages with similar content and want to consolidate ranking to one.</li>
          <li>Always use the full <code>https://growitbuddy.com/...</code> URL, never a relative path.</li>
        </ul>
      </section>

      <section id="og">
        <h2>7. Open Graph (Facebook / LinkedIn / WhatsApp)</h2>
        <p>
          When someone pastes your page link in WhatsApp, LinkedIn, Facebook, or Slack, the
          preview card shown is built from Open Graph (OG) tags.
        </p>
        <table>
          <thead><tr><th>Field</th><th>What it controls</th><th>Best practice</th></tr></thead>
          <tbody>
            <tr><td><strong>OG Title</strong></td><td>Card headline</td><td>Can be longer/more emotional than SEO title. Up to ~95 chars.</td></tr>
            <tr><td><strong>OG Description</strong></td><td>Card subtext</td><td>1–2 sentences. Up to ~200 chars.</td></tr>
            <tr><td><strong>OG Image</strong></td><td>The visual</td><td><strong>1200×630 px</strong>, under 1 MB, JPG or PNG. Bold text, high contrast.</td></tr>
            <tr><td><strong>OG Type</strong></td><td>Card category</td><td>Usually <code>website</code>. Use <code>article</code> for blog posts.</td></tr>
          </tbody>
        </table>
        <div className="warn">
          WhatsApp aggressively caches OG previews — once it sees an image for a URL, it
          remembers for weeks. To force-refresh, change the image URL (e.g. add <code>?v=2</code>).
        </div>
      </section>

      <section id="twitter">
        <h2>8. Twitter / X cards</h2>
        <p>Same idea as OG, but Twitter uses its own meta tags. Two card styles:</p>
        <ul>
          <li><strong>summary</strong> — small square thumbnail next to text. Good for text-heavy posts.</li>
          <li><strong>summary_large_image</strong> — full-width banner image with title underneath. Almost always the better choice for marketing pages.</li>
        </ul>
        <p>
          If you leave Twitter fields blank, Twitter automatically falls back to your OG tags.
          So in practice, <strong>filling OG is enough for most pages</strong>.
        </p>
      </section>

      <section id="schema">
        <h2>9. JSON-LD schema (structured data)</h2>
        <p>
          JSON-LD is a small block of structured data that helps Google understand the page —
          unlocks rich results like star ratings, FAQ accordions, breadcrumbs, business info,
          event details, etc.
        </p>
        <p>
          The editor accepts raw JSON. The system validates it before saving — broken JSON is silently rejected so it never ships.
        </p>
        <h3>Example: Organization schema</h3>
        <pre>{`{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "GrowitBuddy",
  "url": "https://growitbuddy.com",
  "logo": "https://growitbuddy.com/logo.png",
  "sameAs": [
    "https://www.linkedin.com/company/growitbuddy",
    "https://www.instagram.com/growitbuddy"
  ]
}`}</pre>
        <h3>Example: FAQ schema (unlocks expandable Q&amp;A in search results)</h3>
        <pre>{`{
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
}`}</pre>
        <div className="tip">
          Validate any schema at <code>search.google.com/test/rich-results</code> before saving — paste the URL after publishing, or paste the JSON directly.
        </div>
        <div className="warn">
          Don't lie in schema. Don't claim ratings you don't have, FAQs you didn't publish, or breadcrumbs that don't match navigation. Google penalises misleading structured data.
        </div>
      </section>

      <section id="ai">
        <h2>10. AI / AEO / GEO fields</h2>
        <p>
          These newer fields target how <strong>AI search engines</strong> (ChatGPT, Perplexity,
          Google AI Overviews, Gemini) read and cite your pages. They're optional but
          increasingly important.
        </p>
        <h3>AI Summary</h3>
        <p>A 2–3 sentence factual summary of the page. AI models use this when deciding whether to quote you. Write it like a Wikipedia opening — neutral, specific, fact-dense.</p>
        <h3>AEO Keywords (Answer Engine Optimisation)</h3>
        <p>Comma-separated question phrases people ask voice assistants and chatbots, like:</p>
        <p><em>how to hire a video editor, best youtube editors in india, creator economy agencies</em></p>
        <h3>GEO Region</h3>
        <p>Geographic targeting hint — e.g. <code>IN</code>, <code>IN-MH</code>, <code>global</code>. Helps AI engines surface you for region-specific queries.</p>
        <div className="note">
          These fields are emitted as custom meta tags. They don't hurt classical SEO — they're additive.
        </div>
      </section>

      <section id="sitemap">
        <h2>11. Sitemap behaviour</h2>
        <p>The dynamic sitemap lives at:</p>
        <pre>{`https://garden-planner-newzip.onrender.com/api/sitemap.xml`}</pre>
        <p>It's referenced from <code>robots.txt</code> and submitted to Google Search Console. It auto-updates from the admin panel:</p>
        <ul>
          <li>Includes all 24 managed pages by default.</li>
          <li><strong>Excludes</strong> any page where the <em>Index</em> toggle is OFF.</li>
          <li><strong>Excludes</strong> any page where the <em>Sitemap</em> toggle is OFF.</li>
          <li>Updates the moment you save — no rebuild needed.</li>
        </ul>
      </section>

      <section id="dos">
        <h2>12. Do's &amp; Don'ts</h2>
        <h3>Do</h3>
        <ul>
          <li>Write titles for <strong>humans first, robots second</strong>. Click-worthy beats keyword-stuffed every time.</li>
          <li>Refresh OG images when you do a major redesign — outdated previews look unprofessional in WhatsApp.</li>
          <li>Set canonical URLs when running A/B tests or paid-campaign landing pages.</li>
          <li>Use the live SERP / social previews <strong>before</strong> saving. Catch typos there.</li>
          <li>Check Google Search Console weekly for crawl errors after any bulk SEO change.</li>
        </ul>
        <h3>Don't</h3>
        <ul>
          <li>Don't paste the same title and description across multiple pages — Google treats it as a duplication signal.</li>
          <li>Don't write 5-paragraph meta descriptions. Google only shows ~160 characters.</li>
          <li>Don't add fake review or rating schema. It's a manual-action penalty waiting to happen.</li>
          <li>Don't <code>noindex</code> a page that's currently ranking well — you'll lose all its traffic.</li>
          <li>Don't change canonical URLs randomly — it's the easiest way to tank a page's rankings.</li>
        </ul>
      </section>

      <section id="faq">
        <h2>13. FAQ</h2>
        <h3>How long until Google sees my changes?</h3>
        <p>Anywhere from a few hours to 2 weeks. Submit the page URL in Google Search Console → URL Inspection → "Request Indexing" to speed it up.</p>

        <h3>I changed a title but Google still shows the old one. Why?</h3>
        <p>Google caches search results. Wait a week, then check again. Also confirm the new title is actually live by viewing the page source (<code>Ctrl+U</code> → look for <code>&lt;title&gt;</code>).</p>

        <h3>Can I A/B test SEO titles?</h3>
        <p>Not natively. Change one page's title, wait 4 weeks, look at the click-through-rate change in Search Console, then keep or revert.</p>

        <h3>What if I break something?</h3>
        <p>Every field is reversible. Clear it to fall back to the developer default. Worst case, an empty editor = the same SEO the page had before this system existed.</p>

        <h3>Does this work for the blog?</h3>
        <p>No — blog posts have their own SEO managed inside the WordPress / blog editor. This panel covers the 24 core marketing pages only.</p>

        <h3>Can I share this guide?</h3>
        <p>Yes. Hit <strong>Download as PDF</strong> at the top, or share this URL directly — it's intentionally <code>noindex</code> so it won't show up in public search but anyone with the link can read it.</p>
      </section>

      <div style={{ marginTop: 64, paddingTop: 24, borderTop: "1px solid #E5E5E0", fontSize: 13, color: "#0B0B0B80" }}>
        Questions? Ping the engineering team. This page is maintained alongside the SEO Control panel — when the panel changes, this guide changes.
      </div>
    </div>
  );
}
