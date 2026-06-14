import { useEffect } from "react";
import { usePublicContent } from "@/hooks/usePublicContent";
import { SEO_GUIDE_DEFAULTS, type SeoGuideData } from "@/lib/seoGuideDefaults";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function SEOGuide() {
  const data = usePublicContent<SeoGuideData>("seo-guide", SEO_GUIDE_DEFAULTS);

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
        .seo-guide-root .lede { color: #0B0B0B99; font-size: 16px; margin: 0 0 8px; white-space: pre-line; }
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
        .seo-guide-root .section-body { font-size: 15px; white-space: pre-line; }
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
        <span className="badge">{data.hero.badge}</span>
        <h1>{data.hero.title}</h1>
        <p className="lede">{data.hero.lede}</p>
      </div>

      {data.sections.length > 0 && (
        <div className="toc">
          <h3>Contents</h3>
          <ol>
            {data.sections.map((s, i) => (
              <li key={i}>
                <a href={`#${slugify(s.heading) || `section-${i}`}`}>{s.heading}</a>
              </li>
            ))}
          </ol>
        </div>
      )}

      {data.sections.map((s, i) => (
        <section key={i} id={slugify(s.heading) || `section-${i}`}>
          <h2>{s.heading}</h2>
          <div className="section-body">{s.body}</div>
        </section>
      ))}
    </div>
  );
}
