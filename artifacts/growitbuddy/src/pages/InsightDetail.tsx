import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Calendar, List } from "lucide-react";
import type { BlogPost } from "@/data/blogPosts";
import { isPublicBlogPost, resolveBlogSeo, isPublicCmsPage, resolveCmsPageSeo } from "@workspace/seo";
import { usePublicContent } from "@/hooks/usePublicContent";
import { useWordPressPosts, fetchWpPostBySlug } from "@/hooks/useWordPressPosts";
import { resolveMediaUrl } from "@/lib/api";
import { DEFAULT_TOC_VISIBLE, limitInlineToc, tocVisibleCount } from "@/lib/blogToc";
import SEOMeta from "@/components/SEOMeta";
import { cachedGlobal, readBootstrap } from "@/lib/seoCache";

const ARTICLE_CSS = `
/* ── Base ── */
.article-body { font-family: Inter, sans-serif; }

/* ── First & last child margin reset (kills phantom whitespace at top/bottom) ── */
.article-body > *:first-child,
.article-body > *:first-child > *:first-child { margin-top: 0 !important; padding-top: 0 !important; }
.article-body > *:last-child { margin-bottom: 0 !important; }

/* ── Paragraphs ── */
.article-body p,
.article-body .wp-block-paragraph { font-size: 17px; color: rgba(11,11,11,0.78); line-height: 1.85; margin: 0 0 22px; }
.article-body p:empty,
.article-body p:has(br:only-child) { display: none; }
/* WP often wraps a lone image in a <p> - strip its bottom margin so it sits flush */
.article-body p:has(> img:only-child) { margin: 0; }

/* ── Headings ── */
.article-body h1,
.article-body .wp-block-heading h1 { font-weight: 900; font-size: clamp(28px, 4vw, 42px); letter-spacing: -0.04em; color: #0A0A0A; margin: 56px 0 20px; line-height: 1.1; }
.article-body h2,
.article-body .wp-block-heading h2 { font-weight: 800; font-size: clamp(22px, 3vw, 28px); letter-spacing: -0.03em; color: #0A0A0A; margin: 56px 0 20px; line-height: 1.25; padding-bottom: 12px; border-bottom: 2px solid rgba(11,11,11,0.08); }
.article-body h3,
.article-body .wp-block-heading h3 { font-weight: 700; font-size: clamp(17px, 2vw, 21px); letter-spacing: -0.02em; color: #0A0A0A; margin: 40px 0 12px; line-height: 1.35; }
.article-body h4,
.article-body .wp-block-heading h4 { font-weight: 700; font-size: 17px; color: #0A0A0A; margin: 28px 0 10px; }
.article-body h5, .article-body h6 { font-weight: 700; font-size: 15px; color: #0A0A0A; margin: 24px 0 8px; }
/* Heading immediately after image - tighten the gap (image already provides air below) */
.article-body figure + h2,
.article-body .wp-block-image + h2,
.article-body figure + h3,
.article-body .wp-block-image + h3 { margin-top: 32px; }

/* ── Blockquote ── */
.article-body blockquote,
.article-body .wp-block-quote { margin: 36px 0; padding: 22px 26px; border-left: 3px solid #1E293B; background: rgba(11,11,11,0.03); border-radius: 0 12px 12px 0; }
.article-body blockquote p,
.article-body .wp-block-quote p { font-size: 18px; font-weight: 600; color: #1E293B; line-height: 1.7; font-style: italic; margin: 0; }
.article-body .wp-block-quote cite,
.article-body blockquote cite { display: block; font-size: 13px; color: rgba(11,11,11,0.45); font-style: normal; margin-top: 10px; }

/* ── Lists ── */
.article-body ul,
.article-body .wp-block-list ul { margin: 22px 0; padding-left: 22px; list-style: disc; }
.article-body ol,
.article-body .wp-block-list ol { margin: 22px 0; padding-left: 22px; list-style: decimal; }
.article-body li { font-size: 17px; color: rgba(11,11,11,0.78); line-height: 1.8; margin-bottom: 8px; padding-left: 4px; }
.article-body li:last-child { margin-bottom: 0; }
.article-body li > p { margin: 0 0 8px; }
.article-body li > ul, .article-body li > ol { margin: 8px 0 0; }

/* ── Inline ── */
.article-body strong, .article-body b { font-weight: 700; color: #0A0A0A; }
.article-body em, .article-body i { font-style: italic; }
.article-body a { color: #8B3A1A; text-decoration: underline; text-underline-offset: 3px; }
.article-body a:hover { color: #A34722; }
.article-body .gb-blog-button-wrap { margin: 28px 0; line-height: normal; }
.article-body a.gb-blog-button { text-decoration: none; transition: filter 0.15s ease, transform 0.15s ease; }
.article-body a.gb-blog-button:hover { filter: brightness(1.08); transform: translateY(-1px); }
.article-body a.gb-blog-button:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
.article-body code { font-family: 'Fira Code', monospace; font-size: 14px; background: rgba(11,11,11,0.06); padding: 2px 7px; border-radius: 5px; color: #1E293B; }

/* ── Separator / HR ── */
.article-body hr,
.article-body .wp-block-separator { border: none; border-top: 1.5px solid rgba(11,11,11,0.1); margin: 44px 0; }

/* ── Images & Figures ── */
.article-body figure,
.article-body .wp-block-image,
.article-body .wp-block-embed { margin: 36px 0; padding: 0; max-width: 100%; }
.article-body figure img,
.article-body .wp-block-image img,
.article-body img { max-width: 100%; height: auto; width: 100%; border-radius: 14px; display: block; margin: 0 auto; box-shadow: 0 1px 3px rgba(11,11,11,0.04); }
/* Inline images sitting bare inside a paragraph */
.article-body p > img { margin: 28px auto; }
.article-body figcaption,
.article-body .wp-block-image figcaption { font-size: 13px; color: rgba(11,11,11,0.5); text-align: center; margin: 12px 0 0; font-style: italic; line-height: 1.5; }
/* Two figures back-to-back - collapse the gap so they don't double-margin */
.article-body figure + figure,
.article-body .wp-block-image + .wp-block-image { margin-top: 12px; }
/* WP alignment classes */
.article-body .alignleft, .article-body .wp-block-image.alignleft { float: left; margin: 8px 24px 16px 0; max-width: 50%; }
.article-body .alignright, .article-body .wp-block-image.alignright { float: right; margin: 8px 0 16px 24px; max-width: 50%; }
.article-body .aligncenter, .article-body .wp-block-image.aligncenter { margin-left: auto; margin-right: auto; }
.article-body .alignwide, .article-body .wp-block-image.alignwide { margin-left: -40px; margin-right: -40px; max-width: calc(100% + 80px); }
.article-body .alignfull, .article-body .wp-block-image.alignfull img { border-radius: 0; }
/* iframes / embeds (YouTube etc.) */
.article-body iframe,
.article-body .wp-block-embed iframe { width: 100%; aspect-ratio: 16/9; height: auto; border: none; border-radius: 14px; display: block; }
/* Gallery */
.article-body .wp-block-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin: 36px 0; }
.article-body .wp-block-gallery figure { margin: 0; }

/* ── Code block ── */
.article-body pre,
.article-body .wp-block-code { background: #1E293B; color: #e2e8f0; font-family: 'Fira Code', monospace; font-size: 14px; line-height: 1.7; padding: 20px 24px; border-radius: 12px; overflow-x: auto; margin: 30px 0; }
.article-body pre code { background: none; padding: 0; color: inherit; font-size: inherit; }

/* ── Gutenberg Group / Cover ── */
.article-body .wp-block-group { margin: 24px 0; }
.article-body .wp-block-cover { margin: 36px 0; border-radius: 14px; overflow: hidden; }

/* ── Columns ── */
.article-body .wp-block-columns { display: flex; flex-wrap: wrap; gap: 28px; margin: 32px 0; }
.article-body .wp-block-column { flex: 1; min-width: 220px; }

/* ── Table ── */
.article-body .blog-table-scroll { max-width: 100%; overflow-x: auto; margin: 30px 0; }
.article-body .blog-table-scroll table { margin: 0; min-width: 100%; }
.article-body .blog-table-scroll th,
.article-body .blog-table-scroll td { min-width: 110px; }
.article-body table,
.article-body .wp-block-table table { width: 100%; border-collapse: collapse; margin: 30px 0; font-size: 15px; }
.article-body .wp-block-table { overflow-x: auto; margin: 30px 0; }
.article-body th { background: rgba(11,11,11,0.05); font-weight: 700; color: #0A0A0A; padding: 12px 14px; border: 1px solid rgba(11,11,11,0.1); text-align: left; }
.article-body td { padding: 12px 14px; border: 1px solid rgba(11,11,11,0.1); color: rgba(11,11,11,0.78); }
.article-body tr:nth-child(even) td { background: rgba(11,11,11,0.02); }

/* ── WordPress-authored Table of Contents ──
   When a TOC is added on the WordPress side (native Gutenberg block or a TOC
   plugin), it renders raw inside the article HTML. Without these rules it
   inherits the plain bullet-list styling and looks broken. Style it as a clean
   card so it matches the site's own "On this page" box. */
.article-body .wp-block-table-of-contents,
.article-body .ez-toc-container,
.article-body #ez-toc-container,
.article-body .lwptoc,
.article-body .toc_container,
.article-body .kb-table-of-content-nav,
.article-body .ub_table-of-contents,
.article-body .rank-math-toc,
.article-body .wp-block-rank-math-toc-block {
  background: #F8F8F6;
  border: 1px solid #EFEFEA;
  border-radius: 14px;
  padding: 18px 22px;
  margin: 0 0 28px;
}
/* TOC heading / title */
.article-body .ez-toc-title,
.article-body .lwptoc_title,
.article-body .toc_title,
.article-body .kb-table-of-contents-title,
.article-body .rank-math-toc > h2,
.article-body .rank-math-toc > h3,
.article-body .wp-block-table-of-contents > h2,
.article-body .wp-block-table-of-contents > h3 {
  font-size: 11px !important;
  font-weight: 800 !important;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #7A7A85 !important;
  margin: 0 0 12px !important;
  padding: 0 !important;
  border: none !important;
}
/* TOC lists - strip default bullets / indentation, even vertical rhythm */
.article-body .wp-block-table-of-contents ol,
.article-body .wp-block-table-of-contents ul,
.article-body .ez-toc-list,
.article-body .lwptoc_items,
.article-body .toc_list,
.article-body .kb-table-of-content-list,
.article-body .ub_table-of-contents-list,
.article-body .rank-math-toc ul {
  list-style: none !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.article-body .wp-block-table-of-contents li,
.article-body .ez-toc-list li,
.article-body .lwptoc_item,
.article-body .toc_list li,
.article-body .kb-table-of-content-list li,
.article-body .ub_table-of-contents-list li,
.article-body .rank-math-toc li {
  margin: 0 !important;
  padding: 0 !important;
  font-size: 14px;
  line-height: 1.45;
}
/* Nested sub-items get a subtle indent */
.article-body .wp-block-table-of-contents ol ol,
.article-body .wp-block-table-of-contents ul ul,
.article-body .ez-toc-list ul,
.article-body .toc_list .toc_list {
  padding-left: 16px !important;
  margin-top: 9px !important;
}
/* Hide non-functional plugin toggle / expand controls (their JS + CSS aren't
   loaded on our site, so they'd otherwise show as orphaned icons). */
.article-body .ez-toc-title-toggle,
.article-body .ez-toc-js-icon-con,
.article-body .ez-toc-toggle,
.article-body .lwptoc_toggle,
.article-body .kb-toc-toggle { display: none !important; }
/* Keep every anchor in the HTML; only hide the entries beyond the configured limit. */
.article-body li[data-gb-toc-extra][hidden],
.article-toc li[hidden] { display: none !important; }
.article-body .gb-toc-toggle,
.article-toc .gb-toc-toggle {
  display: inline-flex; align-items: center; gap: 7px;
  margin-top: 14px; padding: 7px 0;
  border: 0; background: transparent; cursor: pointer;
  color: #1E293B; font: 700 12px Inter, sans-serif;
}
.article-body .gb-toc-toggle:hover,
.article-toc .gb-toc-toggle:hover { text-decoration: underline; }
.article-body .gb-toc-toggle:focus-visible,
.article-toc .gb-toc-toggle:focus-visible { outline: 2px solid #1E293B; outline-offset: 3px; border-radius: 3px; }
.article-body .gb-toc-toggle::after,
.article-toc .gb-toc-toggle::after { content: "↓"; font-size: 15px; line-height: 1; }
.article-body .gb-toc-toggle[aria-expanded="true"]::after,
.article-toc .gb-toc-toggle[aria-expanded="true"]::after { content: "↑"; }
/* TOC links - dark, no underline, brand-coloured hover (overrides body links) */
.article-body .wp-block-table-of-contents a,
.article-body .ez-toc-container a,
.article-body #ez-toc-container a,
.article-body .ez-toc-link,
.article-body .lwptoc a,
.article-body .toc_container a,
.article-body .kb-table-of-content-nav a,
.article-body .ub_table-of-contents a,
.article-body .rank-math-toc a {
  color: #1E293B !important;
  text-decoration: none !important;
  font-weight: 500;
}
.article-body .wp-block-table-of-contents a:hover,
.article-body .ez-toc-container a:hover,
.article-body #ez-toc-container a:hover,
.article-body .ez-toc-link:hover,
.article-body .lwptoc a:hover,
.article-body .toc_container a:hover,
.article-body .kb-table-of-content-nav a:hover,
.article-body .ub_table-of-contents a:hover,
.article-body .rank-math-toc a:hover {
  color: #8B3A1A !important;
  text-decoration: underline !important;
}

/* ── Pullquote ── */
.article-body .wp-block-pullquote { border-top: 3px solid #C2A878; border-bottom: 3px solid #C2A878; padding: 32px 0; margin: 40px 0; text-align: center; }
.article-body .wp-block-pullquote blockquote { border: none; background: none; padding: 0; margin: 0; }
.article-body .wp-block-pullquote p { font-size: 22px; font-weight: 700; color: #1E293B; font-style: italic; letter-spacing: -0.02em; margin: 0; }

/* ── Buttons (WP) ── */
/* ── WordPress Button block - brand-matched ──
   Editor → "/" → Button → choose Fill (default) or Outline style.
   Both variants auto-render on-brand on growitbuddy.com. */
.article-body .wp-block-buttons { display: flex; flex-wrap: wrap; gap: 12px; margin: 32px 0; }
.article-body .wp-block-button { margin: 0; }

/* Filled (default) - primary CTA */
.article-body .wp-block-button__link,
.article-body .wp-block-button.is-style-fill .wp-block-button__link {
  display: inline-flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, #1E293B 0%, #334155 100%) !important;
  color: #fff !important;
  text-decoration: none !important;
  font-weight: 700; font-size: 15px; letter-spacing: -0.01em;
  padding: 13px 26px; border-radius: 100px; border: none !important;
  box-shadow: 0 6px 18px rgba(30,41,59,0.18);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.article-body .wp-block-button__link:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(30,41,59,0.24);
  color: #fff !important;
}
.article-body .wp-block-button__link::after {
  content: "→"; display: inline-block; transition: transform 0.18s ease;
  font-weight: 600;
}
.article-body .wp-block-button__link:hover::after { transform: translateX(3px); }

/* Outline variant - secondary CTA (WP: Styles → Outline) */
.article-body .wp-block-button.is-style-outline .wp-block-button__link {
  background: transparent !important;
  color: #1E293B !important;
  border: 1.5px solid rgba(30,41,59,0.22) !important;
  box-shadow: none;
}
.article-body .wp-block-button.is-style-outline .wp-block-button__link:hover {
  background: rgba(30,41,59,0.04) !important;
  border-color: rgba(30,41,59,0.4) !important;
  color: #1E293B !important;
}

/* Accent variant - gold (add class "is-style-accent" in WP Advanced → Additional CSS class) */
.article-body .wp-block-button.is-style-accent .wp-block-button__link {
  background: linear-gradient(135deg, #C2A878 0%, #B8975F 100%) !important;
  box-shadow: 0 6px 18px rgba(194,168,120,0.32);
}

/* ── Mobile tightening ── most users read here ── */
@media (max-width: 640px) {
  .article-body p, .article-body li { font-size: 16px; line-height: 1.72; color: rgba(11,11,11,0.82); }
  .article-body p, .article-body .wp-block-paragraph { margin-bottom: 14px; }
  .article-body figure, .article-body .wp-block-image, .article-body .wp-block-embed { margin: 18px 0; }
  /* Edge-to-edge images on phones for max impact */
  .article-body figure img, .article-body .wp-block-image img, .article-body img { border-radius: 12px; }
  .article-body h1, .article-body .wp-block-heading h1 { font-size: 26px; margin-top: 32px; line-height: 1.15; }
  .article-body h2, .article-body .wp-block-heading h2 { font-size: 21px; margin-top: 28px; margin-bottom: 10px; padding-bottom: 6px; line-height: 1.25; }
  .article-body h3, .article-body .wp-block-heading h3 { font-size: 17px; margin-top: 20px; margin-bottom: 8px; }
  .article-body blockquote, .article-body .wp-block-quote { margin: 20px 0; padding: 14px 16px; }
  .article-body blockquote p, .article-body .wp-block-quote p { font-size: 16px; line-height: 1.6; }
  .article-body pre, .article-body .wp-block-code { padding: 12px 14px; font-size: 13px; margin: 18px 0; border-radius: 10px; }
  .article-body .alignleft, .article-body .alignright,
  .article-body .wp-block-image.alignleft, .article-body .wp-block-image.alignright { float: none; margin: 22px auto; max-width: 100%; }
  .article-body .alignwide, .article-body .wp-block-image.alignwide { margin-left: 0; margin-right: 0; max-width: 100%; }
  .article-body .wp-block-columns { gap: 18px; }
  .article-body table, .article-body .wp-block-table table { font-size: 14px; }
  .article-body th, .article-body td { padding: 10px 12px; }
  /* TL;DR + TOC become more compact on mobile */
  .article-tldr { padding: 14px 16px !important; gap: 12px !important; margin-bottom: 26px !important; border-radius: 14px !important; }
  .article-tldr p:last-child { font-size: 14px !important; line-height: 1.55 !important; }
  .article-toc { padding: 14px 16px !important; margin-bottom: 28px !important; }
  .article-toc li { font-size: 13px !important; }
  /* WordPress-authored TOC: same compact treatment on phones */
  .article-body .wp-block-table-of-contents,
  .article-body .ez-toc-container,
  .article-body .lwptoc,
  .article-body .toc_container,
  .article-body .kb-table-of-content-nav,
  .article-body .ub_table-of-contents,
  .article-body .rank-math-toc { padding: 14px 16px !important; margin-bottom: 24px !important; }
  .article-body .wp-block-table-of-contents li,
  .article-body .ez-toc-list li,
  .article-body .lwptoc_item,
  .article-body .toc_list li { font-size: 13px !important; }
}

/* ── Hero image on phones: edge-to-edge & taller for more impact ── */
@media (max-width: 640px) {
  .gb-hero-img { padding: 0 !important; }
  .gb-hero-img > div { border-radius: 0 !important; box-shadow: none !important; }
}

/* Give the fixed contact CTA space at the end of the article. */
.gb-article-section { padding-bottom: 96px !important; }
@media (min-width: 900px) { .gb-article-section { padding-bottom: 80px !important; } }
`;

function isHtml(text: string): boolean {
  return /<(h[1-6]|p|blockquote|ul|ol|li|strong|em|br)\b/i.test(text);
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={i++}>{text.slice(last, match.index)}</span>);
    if (match[2]) parts.push(<strong key={i++} style={{ fontWeight: 700, color: "#0A0A0A" }}>{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={i++}>{match[3]}</em>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(<span key={i++}>{text.slice(last)}</span>);
  return parts;
}

function renderMarkdown(text: string): React.ReactElement[] {
  const lines = text.trim().split("\n");
  const elements: React.ReactElement[] = [];
  const usedHeadingIds = new Set<string>();
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={key++} id={uniqueHeadingId(trimmed.slice(3), usedHeadingIds)} style={{ fontWeight: 800, fontSize: "clamp(22px, 3vw, 28px)", letterSpacing: "-0.03em", color: "#0A0A0A", marginTop: 56, marginBottom: 20, lineHeight: 1.25, paddingBottom: 12, borderBottom: "2px solid #E5E5E0" }}>
          {trimmed.slice(3)}
        </h2>
      );
      i++; continue;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={key++} style={{ fontWeight: 700, fontSize: "clamp(17px, 2vw, 20px)", letterSpacing: "-0.02em", color: "#0A0A0A", marginTop: 36, marginBottom: 12, lineHeight: 1.35 }}>
          {trimmed.slice(4)}
        </h3>
      );
      i++; continue;
    }

    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote key={key++} style={{ margin: "32px 0", paddingLeft: 24, borderLeft: "3px solid #EFEFEA", background: "rgba(10,10,10,0.03)", borderRadius: "0 12px 12px 0", padding: "20px 24px", display: "block" }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "#0A0A0A", lineHeight: "1.7", fontStyle: "italic", margin: 0 }}>
            {parseInline(trimmed.slice(2))}
          </p>
        </blockquote>
      );
      i++; continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={key++} style={{ margin: "24px 0", paddingLeft: 0, listStyle: "none" }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ display: "flex", gap: 16, marginBottom: 14, fontSize: 17, color: "#5F5F5F", lineHeight: "1.75" }}>
              <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: "rgba(30,41,59,0.12)", border: "1px solid rgba(30,41,59,0.20)", color: "var(--gb-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, marginTop: 1 }}>{idx + 1}</span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={key++} style={{ margin: "24px 0", paddingLeft: 0, listStyle: "none" }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ display: "flex", gap: 14, marginBottom: 12, fontSize: 17, color: "#5F5F5F", lineHeight: "1.75" }}>
              <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: "50%", background: "#EFEFEA", marginTop: 11 }} />
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    elements.push(
      <p key={key++} style={{ fontSize: 17, color: "#5F5F5F", lineHeight: "1.9", marginBottom: 20 }}>
        {parseInline(trimmed)}
      </p>
    );
    i++;
  }

  return elements;
}

/** Inject loading="lazy", decoding="async", and proper sizing on every image/iframe in WP HTML.
 *  Also adds `fetchpriority="high"` to the FIRST image (LCP optimization). */
function enhanceWpHtml(html: string): string {
  let first = true;
  return html
    .replace(/<img\b([^>]*)>/gi, (_m, attrs: string) => {
      const hasLoading = /\bloading\s*=/.test(attrs);
      const hasDecoding = /\bdecoding\s*=/.test(attrs);
      const hasFetchPri = /\bfetchpriority\s*=/.test(attrs);
      const extra: string[] = [];
      if (!hasLoading) extra.push(first ? 'loading="eager"' : 'loading="lazy"');
      if (!hasDecoding) extra.push('decoding="async"');
      if (first && !hasFetchPri) extra.push('fetchpriority="high"');
      first = false;
      return `<img${attrs} ${extra.join(" ")}>`;
    })
    .replace(/<iframe\b([^>]*)>/gi, (_m, attrs: string) => {
      const hasLoading = /\bloading\s*=/.test(attrs);
      return hasLoading ? `<iframe${attrs}>` : `<iframe${attrs} loading="lazy">`;
    });
}

/** WP TOC plugins (Easy TOC etc.) emit absolute, self-referential anchor links
 *  like href="https://blog.growitbuddy.com/<slug>/#Section". On our SPA those
 *  would navigate away to the WordPress origin instead of smooth-scrolling the
 *  current page. Rewrite same-origin (blog domain) links down to a bare
 *  "#fragment" — but ONLY when that fragment matches an element id that actually
 *  exists in this document. That keeps it scoped to true in-page anchors: a link
 *  to a *different* post's section (whose id isn't on this page) is left as a
 *  real navigation, and external deep links (e.g. a Wikipedia #section) are
 *  untouched because they aren't on the blog domain. */
function rewriteSelfAnchors(html: string): string {
  const ids = new Set<string>();
  const idRe = /\sid\s*=\s*"([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = idRe.exec(html)) !== null) ids.add(m[1]);
  if (ids.size === 0) return html;
  const hasId = (frag: string) => {
    if (ids.has(frag)) return true;
    try { return ids.has(decodeURIComponent(frag)); } catch { return false; }
  };
  return html.replace(
    /href\s*=\s*"https?:\/\/(?:www\.)?blog\.growitbuddy\.com\/[^"]*?#([^"]+)"/gi,
    (full, frag: string) => (hasId(frag) ? `href="#${frag}"` : full),
  );
}

/** Detect whether the WP-authored HTML already contains its own Table of Contents,
 *  so we don't render a duplicate one. Covers the major WP TOC plugins + native
 *  Gutenberg block + manual TOCs (a heading like "Table of Contents" followed by
 *  an anchor-link list). */
function hasInlineToc(html: string): boolean {
  if (!html) return false;
  // Known plugin / Gutenberg class hooks
  const pluginRe = /class\s*=\s*["'][^"']*(?:ez-toc|lwptoc|wp-block-table-of-contents|toc_container|kb-table-of-content|rank-math-toc|rmp-toc|ultimate-blocks\/table-of-contents)[^"']*["']/i;
  if (pluginRe.test(html)) return true;
  // Element ids commonly used by TOC plugins
  if (/id\s*=\s*["'](?:ez-toc-container|lwptoc|toc-container|table-of-contents)["']/i.test(html)) return true;
  // Manual TOC: a heading like "Table of Contents" / "On this page" / "Contents" / "In this article"
  // Look only in the first ~2500 chars to keep it cheap and intent-focused (TOCs live at the top).
  const head = html.slice(0, 2500);
  if (/<h[1-4][^>]*>\s*(?:📋\s*)?(?:table\s+of\s+contents?|contents|on\s+this\s+page|in\s+this\s+article|jump\s+to)\s*[:?]?\s*<\/h[1-4]>/i.test(head)) return true;
  // Density heuristic: 3+ in-page anchor links clustered near the top
  const anchorMatches = head.match(/<a\b[^>]*href\s*=\s*["']#[^"']+["']/gi);
  if (anchorMatches && anchorMatches.length >= 3) return true;
  return false;
}

function uniqueHeadingId(text: string, used: Set<string>): string {
  const base = text.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "section";
  let id = base;
  let suffix = 2;
  while (used.has(id)) id = `${base}-${suffix++}`;
  used.add(id);
  return id;
}

function existingHeadingIds(html: string): Set<string> {
  const ids = new Set<string>();
  for (const match of html.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)) ids.add(match[2]);
  return ids;
}

/** Pull H2 headings out of the rendered article (HTML or markdown) for the auto-TOC. */
function extractToc(content: string): Array<{ id: string; text: string }> {
  const items: Array<{ id: string; text: string }> = [];
  const used = existingHeadingIds(content);
  // HTML <h2>
  const htmlRe = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi;
  let m: RegExpExecArray | null;
  while ((m = htmlRe.exec(content)) !== null) {
    const text = m[2].replace(/<[^>]*>/g, "").trim();
    const id = /\bid\s*=\s*(["'])(.*?)\1/i.exec(m[1])?.[2];
    if (text) items.push({ id: id ?? uniqueHeadingId(text, used), text });
  }
  // Markdown ## headings (only if no HTML matched)
  if (items.length === 0) {
    for (const line of content.split("\n")) {
      const t = line.trim();
      if (t.startsWith("## ") && !t.startsWith("### ")) {
        const text = t.slice(3).trim();
        if (text) items.push({ id: uniqueHeadingId(text, used), text });
      }
    }
  }
  return items;
}

/** Inject id="..." onto h2s in HTML content so TOC anchor links work. */
function addHeadingIds(html: string): string {
  const used = existingHeadingIds(html);
  return html.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi, (_m, attrs: string, inner: string) => {
    if (/\bid\s*=/i.test(attrs)) return _m;
    const text = inner.replace(/<[^>]*>/g, "").trim();
    return `<h2${attrs} id="${uniqueHeadingId(text, used)}">${inner}</h2>`;
  });
}

/** Compact contact CTA in place of the article's social-share controls. */
function ConsultationCta() {
  return (
    <aside aria-label="Talk to GrowitBuddy" className="fixed bottom-3 inset-x-3 sm:bottom-5 sm:inset-x-5 z-50 pointer-events-none">
      <div className="pointer-events-auto mx-auto flex max-w-[990px] items-center gap-2.5 sm:gap-4 rounded-[20px] border border-[#E8E8E6] bg-white/95 py-2 pl-2.5 pr-2 shadow-[0_8px_34px_rgba(20,32,46,0.12)] backdrop-blur-md sm:py-2.5 sm:pl-3 sm:pr-3">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F3F5] text-[#1E293B] max-[360px]:hidden">
          <Calendar className="h-[19px] w-[19px]" strokeWidth={2} />
        </span>
        <span className="min-w-0 text-[12px] font-bold leading-tight text-[#1E293B] sm:whitespace-nowrap sm:text-sm">Need expert help?</span>
        <span aria-hidden="true" className="hidden h-6 w-px bg-[#E7E9EC] md:block" />
        <span className="hidden min-w-0 flex-1 text-[13px] text-[#848B9B] md:block">Discuss your project with our team.</span>
        <Link href="/contact" className="ml-auto inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1E293B] px-3 text-[12px] font-semibold text-white no-underline shadow-sm transition-colors hover:bg-[#334155] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E293B] sm:px-4 sm:text-[13px]">
          Get in Touch <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}

function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, background: "rgba(10,10,10,0.03)", zIndex: 1000, pointerEvents: "none" }}>
      <motion.div style={{ height: "100%", background: "#EFEFEA", width: `${progress}%`, transition: "width 0.1s linear" }} />
    </div>
  );
}

export default function InsightDetail({ previewPost, pageMode = false }: { previewPost?: BlogPost; pageMode?: boolean } = {}) {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const isPreview = !!previewPost;
  const isWp = !isPreview && !pageMode && slug.startsWith("wp-");

  const { posts: cmsPosts, tocInitialVisible } = usePublicContent<{ posts: BlogPost[]; tocInitialVisible?: number }>(
    pageMode ? "cms-pages" : "blog", { posts: [], tocInitialVisible: DEFAULT_TOC_VISIBLE },
  );
  const pageVisibility = usePublicContent<Record<string, { hidden?: boolean }>>("page_visibility", {});
  const visibleCount = tocVisibleCount(tocInitialVisible);
  const [expandedSlug, setExpandedSlug] = useState("");
  const tocExpanded = expandedSlug === slug;
  const { posts: wpPosts } = useWordPressPosts(!pageMode && !isPreview);

  const [wpPost, setWpPost] = useState<BlogPost | null>(null);
  const [wpLoading, setWpLoading] = useState(isWp);

  useEffect(() => {
    if (!isWp) return;
    // The WordPress list intentionally omits the content field. Always fetch
    // the full post here; otherwise the article (and its inline TOC) is empty.
    let active = true;
    setWpLoading(true);
    setWpPost(null);
    fetchWpPostBySlug(slug).then((p) => {
      if (active) { setWpPost(p); setWpLoading(false); }
    });
    return () => { active = false; };
  }, [slug, isWp]);

  useEffect(() => {
    if (!isPreview) window.scrollTo(0, 0);
    const existing = document.getElementById("article-styles");
    if (!existing) {
      const s = document.createElement("style");
      s.id = "article-styles";
      s.textContent = ARTICLE_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById("article-styles")?.remove(); };
  }, [slug, isPreview]);

  // Only live posts are reachable on the public site: trashed or draft CMS posts
  // must 404 (and never surface as "related"), exactly like the listing page.
  const allPosts: BlogPost[] = pageMode
    ? (cmsPosts ?? []).filter(isPublicCmsPage)
    : [
      ...(cmsPosts ?? []).filter(isPublicBlogPost),
      ...wpPosts,
    ];

  const post: BlogPost | undefined = previewPost ?? allPosts.find((p) => p.slug === slug) ?? (isWp ? (wpPost ?? undefined) : undefined);
  const related = pageMode ? [] : allPosts.filter((p) => p.slug !== (post?.slug ?? slug)).slice(0, 3);
  const globalIndexable = (cachedGlobal() ?? readBootstrap(pageMode ? "cms-pages" : "insights").bootGlobal) && !pageVisibility[pageMode ? slug : "insights"]?.hidden;
  const resolvedSeo = post ? (pageMode ? resolveCmsPageSeo(post, { globalIndexable }) : resolveBlogSeo(post, { globalIndexable })) : undefined;

  // Pre-compute heavy derived values once per post change.
  // Suppress our auto TOC when the WP content already has its own, so we never duplicate.
  const wpHasToc = useMemo(() => post ? hasInlineToc(post.content) : false, [post]);
  const toc = useMemo(() => (post && !wpHasToc) ? extractToc(post.content) : [], [post, wpHasToc]);
  const enhancedContent = useMemo(() => {
    if (!post) return "";
    if (!isHtml(post.content)) return post.content;
    const html = addHeadingIds(enhanceWpHtml(rewriteSelfAnchors(post.content)));
    return wpHasToc ? limitInlineToc(html, visibleCount, tocExpanded) : html;
  }, [post, wpHasToc, visibleCount, tocExpanded]);

  if (wpLoading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <p style={{ fontSize: 15, color: "rgba(11,11,11,0.4)" }}>Loading…</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        {!isPreview && <SEOMeta title={pageMode ? "Page not found | GrowitBuddy" : "Post not found | GrowitBuddy Insights"} description="This post could not be found." robots="noindex,nofollow" />}
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontWeight: 800, fontSize: 40, letterSpacing: "-0.04em", color: "#0A0A0A", marginBottom: 12 }}>{pageMode ? "Page not found" : "Post not found"}</h1>
          <Link href={pageMode ? "/" : "/blog"}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#0A0A0A", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <ArrowLeft className="w-4 h-4" /> {pageMode ? "Back to home" : "Back to Insights"}
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif" }}>
      {!isPreview && <ReadingProgress />}
      {!isPreview && resolvedSeo && <SEOMeta
        title={resolvedSeo.title}
        description={resolvedSeo.description}
        ogTitle={resolvedSeo.og.title}
        ogDescription={resolvedSeo.og.description}
        ogImage={resolvedSeo.og.image}
        ogType={pageMode ? (resolvedSeo.og.type === "article" ? "article" : "website") : "article"}
        canonical={resolvedSeo.canonical}
        robots={resolvedSeo.robots}
        twitterCard={resolvedSeo.twitter.card as "summary" | "summary_large_image"}
        twitterTitle={resolvedSeo.twitter.title}
        twitterDescription={resolvedSeo.twitter.description}
        twitterImage={resolvedSeo.twitter.image}
        twitterUrl={resolvedSeo.twitter.url}
        schema={resolvedSeo.jsonLd["@graph"]}
      />}

      {/* Hero - tight vertical rhythm, white space minimized */}
      <section style={{ paddingTop: "clamp(56px, 9vw, 80px)", paddingBottom: 0, background: "#FFFFFF" }}>
        <div className="max-w-[760px] mx-auto" style={{ padding: "0 18px" }}>
          {!pageMode && <Link href="/blog">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#7A7A85", cursor: "pointer", marginBottom: 18, letterSpacing: "0.01em" }}>
              <ArrowLeft className="w-3.5 h-3.5" /> All posts
            </span>
          </Link>}

          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", padding: "5px 13px", borderRadius: 100, background: "rgba(30,41,59,0.12)", border: "1px solid rgba(30,41,59,0.25)", color: "var(--gb-accent)" }}>
              {post.tag}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#7A7A85", fontWeight: 500 }}>
              <Calendar className="w-3 h-3" /> {post.date}
            </span>
            {post.modifiedIsoDate && !Number.isNaN(new Date(post.modifiedIsoDate).getTime()) && (
              <span style={{ fontSize: 12, color: "#7A7A85", fontWeight: 500 }}>
                Updated {new Date(post.modifiedIsoDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </span>
            )}
          </div>

          {/* Author byline */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #1E293B, #334155)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, letterSpacing: "0.02em" }}>SS</div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0A0A0A" }}>Suraj Sharma</span>
              <span style={{ fontSize: 11, color: "#7A7A85", fontWeight: 500 }}>Founder, GrowitBuddy</span>
            </div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ fontWeight: 900, fontSize: "clamp(22px, 5vw, 52px)", letterSpacing: "-0.04em", lineHeight: "1.1", color: "#0A0A0A", marginBottom: 14 }}
          >
            {post.title}
          </motion.h1>

          {post.excerpt && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{ fontSize: 19, color: "#5F5F5F", lineHeight: "1.7", marginBottom: 24, fontWeight: 400 }}
            >
              {post.excerpt}
            </motion.p>
          )}
        </div>

        {post.featuredImage && (
          <div className="gb-hero-img max-w-[900px] mx-auto" style={{ padding: "0 18px" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              style={{ borderRadius: 20, overflow: "hidden", background: "#e8e8e6", boxShadow: "0 4px 40px rgba(11,11,11,0.10)" }}
            >
              <img
                src={resolveMediaUrl(post.featuredImage)}
                alt={post.title}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </motion.div>
          </div>
        )}

        <div style={{ height: 1, background: "rgba(10,10,10,0.03)", marginTop: post.featuredImage ? 20 : 0 }} />
      </section>

      {/* Article body - tighter top padding so "On this page" sits close to the image */}
      <section className="gb-article-section" style={{ padding: "clamp(20px, 4vw, 36px) 18px 100px", background: "#FFFFFF" }}>
        <div className="max-w-[680px] mx-auto">
          {/* Auto Table of Contents - appears only if the article has 2+ H2 sections */}
          {toc.length >= 2 && (
            <nav aria-label="On this page" className="article-toc" style={{ padding: "16px 20px", marginBottom: 24, background: "#F8F8F6", border: "1px solid #EFEFEA", borderRadius: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A7A85", margin: 0, marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 7 }}>
                <List className="w-3.5 h-3.5" /> On this page
              </p>
              <ol id="gb-auto-toc-list" style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8, counterReset: "toc" }}>
                {toc.map((h, index) => (
                  <li key={`${h.id}-${index}`} hidden={!tocExpanded && index >= visibleCount} style={{ counterIncrement: "toc", fontSize: 14, lineHeight: 1.45 }}>
                    <a href={`#${h.id}`} style={{ color: "#1E293B", textDecoration: "none", display: "inline-flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontVariantNumeric: "tabular-nums", color: "#A0A0A8", fontSize: 12, fontWeight: 700, minWidth: 18 }}>{String(index + 1).padStart(2, "0")}</span>
                      <span style={{ fontWeight: 500 }}>{h.text}</span>
                    </a>
                  </li>
                ))}
              </ol>
              {toc.length > visibleCount && (
                <button type="button" className="gb-toc-toggle" aria-controls="gb-auto-toc-list" aria-expanded={tocExpanded}
                  onClick={() => setExpandedSlug(tocExpanded ? "" : slug)}>
                  {tocExpanded ? "Show Less" : `Show More (${toc.length - visibleCount})`}
                </button>
              )}
            </nav>
          )}

        <div className="article-body" onClick={(event) => {
          const target = event.target;
          if (!(target instanceof Element) || !target.closest("[data-gb-toc-toggle]")) return;
          const article = event.currentTarget;
          setExpandedSlug(tocExpanded ? "" : slug);
          // Replacing WordPress HTML also replaces its button; restore keyboard focus.
          requestAnimationFrame(() => article.querySelector<HTMLButtonElement>("[data-gb-toc-toggle]")?.focus({ preventScroll: true }));
        }}>
          {isHtml(post.content)
            ? <div dangerouslySetInnerHTML={{ __html: enhancedContent }} />
            : renderMarkdown(post.content)
          }

          {post.seo?.faqItems?.some((item) => item.question?.trim() && item.answer?.trim()) && (
            <section aria-label="Frequently asked questions" style={{ marginTop: 42 }}>
              <h2>Frequently asked questions</h2>
              {post.seo.faqItems.filter((item) => item.question?.trim() && item.answer?.trim()).map((item, index) => (
                <div key={`${item.question}-${index}`} style={{ marginTop: 20 }}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </div>
              ))}
            </section>
          )}

          <div style={{ marginTop: 40, padding: "26px 22px", background: "#EFEFEA", borderRadius: 18, textAlign: "center" }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 10 }}>Ready to build your authority?</p>
            <h3 style={{ fontWeight: 800, fontSize: "clamp(20px, 3vw, 26px)", letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 16, lineHeight: 1.25 }}>
              Turn your expertise into consistent inbound demand.
            </h3>
            <Link href="/authority-audit">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FFFFFF", color: "#0A0A0A", fontWeight: 700, fontSize: 14, padding: "13px 28px", borderRadius: 100, cursor: "pointer", letterSpacing: "-0.01em" }}>
                Get your free audit <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
        </div>
      </section>

      {/* Compact contact CTA replaces article share controls */}
      {!isPreview && <ConsultationCta />}

      {/* Related posts */}
      {related.length > 0 && (
        <section style={{ padding: "clamp(36px, 6vw, 56px) 18px clamp(48px, 8vw, 72px)", background: "#F8F8F6", borderTop: "1px solid #E5E5E0" }}>
          <div className="max-w-[1100px] mx-auto">
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 10 }}>Continue reading</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 3vw, 34px)", letterSpacing: "-0.04em", color: "#0A0A0A", marginBottom: 24 }}>More Insights</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 16 }}>
              {related.map((p, i) => (
                <motion.div key={p.slug} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}>
                  <Link href={`/blog/${p.slug}`}>
                    <div
                      style={{ background: "#FFFFFF", border: "1px solid rgba(20,32,46,0.14)", borderRadius: 18, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", height: "100%", display: "flex", flexDirection: "column", boxShadow: "0 18px 44px -22px rgba(20,32,46,0.22), 0 4px 12px -6px rgba(20,32,46,0.08)" }}
                      className="hover:-translate-y-1"
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 26px 60px -24px rgba(20,32,46,0.28), 0 10px 24px -10px rgba(20,32,46,0.12)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 18px 44px -22px rgba(20,32,46,0.22), 0 4px 12px -6px rgba(20,32,46,0.08)"; }}
                    >
                      {p.featuredImage && (
                        <div style={{ height: 160, overflow: "hidden", flexShrink: 0 }}>
                          <img src={resolveMediaUrl(p.featuredImage)} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </div>
                      )}
                      <div style={{ padding: "22px 24px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 100, background: "rgba(30,41,59,0.12)", color: "var(--gb-accent)" }}>{p.tag}</span>
                        </div>
                        <h3 style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", color: "#0A0A0A", marginBottom: 8, lineHeight: 1.35, flex: 1 }}>{p.title}</h3>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 14, fontSize: 13, fontWeight: 700, color: "#5F5F5F" }}>
                          Read <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
