import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Calendar, Share2, Twitter, Linkedin, Link2, Check, List } from "lucide-react";
import { defaultSeo, type BlogPost } from "@/data/blogPosts";
import { usePublicContent } from "@/hooks/usePublicContent";
import { useWordPressPosts, fetchWpPostBySlug } from "@/hooks/useWordPressPosts";
import SEOMeta from "@/components/SEOMeta";

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
/* WP often wraps a lone image in a <p> — strip its bottom margin so it sits flush */
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
/* Heading immediately after image — tighten the gap (image already provides air below) */
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
/* Two figures back-to-back — collapse the gap so they don't double-margin */
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
.article-body table,
.article-body .wp-block-table table { width: 100%; border-collapse: collapse; margin: 30px 0; font-size: 15px; }
.article-body .wp-block-table { overflow-x: auto; margin: 30px 0; }
.article-body th { background: rgba(11,11,11,0.05); font-weight: 700; color: #0A0A0A; padding: 12px 14px; border: 1px solid rgba(11,11,11,0.1); text-align: left; }
.article-body td { padding: 12px 14px; border: 1px solid rgba(11,11,11,0.1); color: rgba(11,11,11,0.78); }
.article-body tr:nth-child(even) td { background: rgba(11,11,11,0.02); }

/* ── Pullquote ── */
.article-body .wp-block-pullquote { border-top: 3px solid #C2A878; border-bottom: 3px solid #C2A878; padding: 32px 0; margin: 40px 0; text-align: center; }
.article-body .wp-block-pullquote blockquote { border: none; background: none; padding: 0; margin: 0; }
.article-body .wp-block-pullquote p { font-size: 22px; font-weight: 700; color: #1E293B; font-style: italic; letter-spacing: -0.02em; margin: 0; }

/* ── Buttons (WP) ── */
/* ── WordPress Button block — brand-matched ──
   Editor → "/" → Button → choose Fill (default) or Outline style.
   Both variants auto-render on-brand on growitbuddy.com. */
.article-body .wp-block-buttons { display: flex; flex-wrap: wrap; gap: 12px; margin: 32px 0; }
.article-body .wp-block-button { margin: 0; }

/* Filled (default) — primary CTA */
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

/* Outline variant — secondary CTA (WP: Styles → Outline) */
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

/* Accent variant — gold (add class "is-style-accent" in WP Advanced → Additional CSS class) */
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
}

/* ── Hero image on phones: edge-to-edge & taller for more impact ── */
@media (max-width: 640px) {
  .gb-hero-img { padding: 0 !important; }
  .gb-hero-img > div { border-radius: 0 !important; box-shadow: none !important; }
  .gb-hero-img img { aspect-ratio: 4/3 !important; }
}

/* ── Reserve bottom space so sticky share bar doesn't cover content ── */
/* Reserve just enough space at the bottom for the sticky share bar */
.gb-article-section { padding-bottom: 96px !important; }
@media (min-width: 900px) { .gb-article-section { padding-bottom: 80px !important; } }
@media (min-width: 900px) {
  .gb-share-bar { box-shadow: 0 -2px 20px rgba(11,11,11,0.04) !important; }
}
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
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={key++} style={{ fontWeight: 800, fontSize: "clamp(22px, 3vw, 28px)", letterSpacing: "-0.03em", color: "#0A0A0A", marginTop: 56, marginBottom: 20, lineHeight: 1.25, paddingBottom: 12, borderBottom: "2px solid #E5E5E0" }}>
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

const SITE = "https://growitbuddy.com";

/** Convert any post.date format (ISO or "10 April 2026") into ISO 8601 for schema.org. */
function toIsoDate(post: BlogPost): string {
  if (post.isoDate) return post.isoDate;
  const d = new Date(post.date);
  if (!isNaN(d.getTime())) return d.toISOString();
  return new Date().toISOString();
}

/** Count words in HTML or markdown content (for schema wordCount + AEO signal). */
function countWords(content: string): number {
  return content.replace(/<[^>]*>/g, " ").replace(/[#*_>`-]/g, " ").split(/\s+/).filter(Boolean).length;
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

/** Pull H2 headings out of the rendered article (HTML or markdown) for the auto-TOC. */
function extractToc(content: string): Array<{ id: string; text: string }> {
  const items: Array<{ id: string; text: string }> = [];
  const slugify = (s: string) => s.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
  // HTML <h2>
  const htmlRe = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
  let m: RegExpExecArray | null;
  while ((m = htmlRe.exec(content)) !== null) {
    const text = m[1].replace(/<[^>]*>/g, "").trim();
    if (text) items.push({ id: slugify(text), text });
  }
  // Markdown ## headings (only if no HTML matched)
  if (items.length === 0) {
    for (const line of content.split("\n")) {
      const t = line.trim();
      if (t.startsWith("## ") && !t.startsWith("### ")) {
        const text = t.slice(3).trim();
        if (text) items.push({ id: slugify(text), text });
      }
    }
  }
  return items;
}

/** Inject id="..." onto h2s in HTML content so TOC anchor links work. */
function addHeadingIds(html: string): string {
  const slugify = (s: string) => s.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
  return html.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi, (_m, attrs: string, inner: string) => {
    if (/\bid\s*=/.test(attrs)) return _m;
    const text = inner.replace(/<[^>]*>/g, "").trim();
    return `<h2${attrs} id="${slugify(text)}">${inner}</h2>`;
  });
}

function buildPostSchema(post: BlogPost): Record<string, unknown>[] {
  const seo = { ...defaultSeo(), ...post.seo };
  const schemaType = seo.schemaType || "Article";
  const isoDate = toIsoDate(post);
  const modIsoDate = post.modifiedIsoDate ?? isoDate;
  const wordCount = countWords(post.content);
  const url = `${SITE}/blog/${post.slug}`;
  const imageUrl = post.featuredImage || seo.ogImage || `${SITE}/opengraph.jpg`;

  const base: Record<string, unknown> = {
    "headline": seo.seoTitle || post.title,
    "description": seo.metaDescription || post.excerpt,
    "url": url,
    "datePublished": isoDate,
    "dateModified": modIsoDate,
    "image": { "@type": "ImageObject", "url": imageUrl, "width": 1200, "height": 630 },
    "author": { "@type": "Person", "@id": `${SITE}/#suraj-sharma`, "name": "Suraj Sharma", "url": `${SITE}/about` },
    "publisher": { "@type": "Organization", "@id": `${SITE}/#organization`, "name": "GrowitBuddy", "logo": { "@type": "ImageObject", "url": `${SITE}/logo.png` } },
    "mainEntityOfPage": { "@type": "WebPage", "@id": url },
    "keywords": [seo.focusKeyword, seo.secondaryKeywords].filter(Boolean).join(", ") || post.tag,
    "articleSection": post.tag,
    "inLanguage": "en-US",
    "wordCount": wordCount,
    "isAccessibleForFree": true,
    // Speakable — voice assistants & AI overviews can read these aloud
    "speakable": { "@type": "SpeakableSpecification", "cssSelector": [".article-body h2", ".article-body p"] },
  };

  const schemas: Record<string, unknown>[] = [];
  schemas.push({
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE}/blog` },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": url },
    ],
  });

  if (schemaType === "FAQ") {
    schemas.push({ "@type": "FAQPage", ...base, "mainEntity": (seo.faqItems ?? []).map((f) => ({ "@type": "Question", "name": f.question, "acceptedAnswer": { "@type": "Answer", "text": f.answer } })) });
  } else if (schemaType === "HowTo") {
    schemas.push({ "@type": "HowTo", ...base, "name": seo.seoTitle || post.title, "step": (seo.howToSteps ?? []).map((s, i) => ({ "@type": "HowToStep", "position": i + 1, "name": s.name, "text": s.text })) });
  } else if (schemaType !== "None") {
    schemas.push({ "@type": schemaType, ...base });
  }

  return schemas;
}

/** Sticky share bar — visible at the bottom on mobile, side rail on desktop. */
function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = (s: string) => encodeURIComponent(s);
  const onCopy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* noop */ }
  };
  const Btn = ({ href, label, onClick, children }: { href?: string; label: string; onClick?: () => void; children: React.ReactNode }) => {
    const style: React.CSSProperties = { width: 44, height: 44, borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1.5px solid rgba(11,11,11,0.10)", color: "#1E293B", cursor: "pointer", transition: "all .15s" };
    return href
      ? <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} style={style}>{children}</a>
      : <button type="button" onClick={onClick} aria-label={label} style={{ ...style, fontFamily: "inherit" }}>{children}</button>;
  };
  return (
    <div className="gb-share-bar" style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50, padding: "10px 14px", background: "rgba(255,255,255,0.94)", backdropFilter: "blur(14px)", borderTop: "1px solid rgba(11,11,11,0.08)", boxShadow: "0 -4px 24px rgba(11,11,11,0.06)" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", letterSpacing: "0.12em" }}>
          <Share2 className="w-3.5 h-3.5" /> Share
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Btn href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`} label="Share on X / Twitter"><Twitter className="w-4 h-4" /></Btn>
          <Btn href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} label="Share on LinkedIn"><Linkedin className="w-4 h-4" /></Btn>
          <Btn href={`https://api.whatsapp.com/send?text=${enc(title + " " + url)}`} label="Share on WhatsApp">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2c-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1s0-.4.1-.5c.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5s0-.4 0-.5-.7-1.7-1-2.3c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1.1 2.9 1.2 3.1c.2.2 2.2 3.3 5.3 4.7.7.3 1.3.5 1.8.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.3z"/><path d="M20.5 3.5C18.2 1.2 15.2 0 12 0 5.4 0 0 5.4 0 12c0 2.1.5 4.2 1.6 6L0 24l6.2-1.6c1.7 1 3.8 1.4 5.8 1.4 6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.5-8.3zM12 21.8c-1.8 0-3.6-.5-5.2-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.5 15.6 2 13.8 2 12 2 6.5 6.5 2 12 2c2.7 0 5.2 1 7.1 2.9C21 6.8 22 9.3 22 12c0 5.5-4.5 9.8-10 9.8z"/></svg>
          </Btn>
          <Btn label="Copy link" onClick={onCopy}>
            {copied ? <Check className="w-4 h-4" style={{ color: "#16a34a" }} /> : <Link2 className="w-4 h-4" />}
          </Btn>
        </div>
      </div>
    </div>
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

export default function InsightDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const isWp = slug.startsWith("wp-");

  const { posts: cmsPosts } = usePublicContent<{ posts: BlogPost[] }>("blog", { posts: [] });
  const { posts: wpPosts } = useWordPressPosts();

  const [wpPost, setWpPost] = useState<BlogPost | null>(null);
  const [wpLoading, setWpLoading] = useState(isWp);

  useEffect(() => {
    if (!isWp) return;
    const fromList = wpPosts.find((p) => p.slug === slug);
    if (fromList) { setWpPost(fromList); setWpLoading(false); return; }
    setWpLoading(true);
    fetchWpPostBySlug(slug).then((p) => { setWpPost(p); setWpLoading(false); });
  }, [slug, isWp, wpPosts]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const existing = document.getElementById("article-styles");
    if (!existing) {
      const s = document.createElement("style");
      s.id = "article-styles";
      s.textContent = ARTICLE_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById("article-styles")?.remove(); };
  }, [slug]);

  const allPosts: BlogPost[] = [
    ...(cmsPosts ?? []),
    ...wpPosts,
  ];

  const post: BlogPost | undefined = isWp ? (wpPost ?? undefined) : allPosts.find((p) => p.slug === slug);
  const related = allPosts.filter((p) => p.slug !== slug).slice(0, 3);

  // Pre-compute heavy derived values once per post change.
  // Suppress our auto TOC when the WP content already has its own, so we never duplicate.
  const wpHasToc = useMemo(() => post ? hasInlineToc(post.content) : false, [post]);
  const toc = useMemo(() => (post && !wpHasToc) ? extractToc(post.content) : [], [post, wpHasToc]);
  const enhancedContent = useMemo(() => {
    if (!post) return "";
    return isHtml(post.content) ? addHeadingIds(enhanceWpHtml(post.content)) : post.content;
  }, [post]);
  const shareUrl = post ? `${SITE}/blog/${post.slug}` : SITE;

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
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontWeight: 800, fontSize: 40, letterSpacing: "-0.04em", color: "#0A0A0A", marginBottom: 12 }}>Post not found</h1>
          <Link href="/blog">
            <span style={{ fontSize: 15, fontWeight: 600, color: "#0A0A0A", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <ArrowLeft className="w-4 h-4" /> Back to Insights
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif" }}>
      <ReadingProgress />
      <SEOMeta
        title={`${post.seo?.seoTitle || post.title} | GrowitBuddy Insights`}
        description={post.seo?.metaDescription || post.excerpt}
        ogImage={post.seo?.ogImage || post.featuredImage}
        ogType="article"
        canonical={post.seo?.canonicalUrl || undefined}
        robots={post.seo?.noIndex ? "noindex,nofollow" : "index,follow"}
        schema={buildPostSchema(post)}
      />

      {/* Hero — tight vertical rhythm, white space minimized */}
      <section style={{ paddingTop: "clamp(56px, 9vw, 80px)", paddingBottom: 0, background: "#FFFFFF" }}>
        <div className="max-w-[760px] mx-auto" style={{ padding: "0 18px" }}>
          <Link href="/blog">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#7A7A85", cursor: "pointer", marginBottom: 18, letterSpacing: "0.01em" }}>
              <ArrowLeft className="w-3.5 h-3.5" /> All posts
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", padding: "5px 13px", borderRadius: 100, background: "rgba(30,41,59,0.12)", border: "1px solid rgba(30,41,59,0.25)", color: "var(--gb-accent)" }}>
              {post.tag}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#7A7A85", fontWeight: 500 }}>
              <Calendar className="w-3 h-3" /> {post.date}
            </span>
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
                src={post.featuredImage}
                alt={post.title}
                width={1600}
                height={900}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                style={{ width: "100%", height: "auto", display: "block", aspectRatio: "16/9", objectFit: "cover" }}
              />
            </motion.div>
          </div>
        )}

        <div style={{ height: 1, background: "rgba(10,10,10,0.03)", marginTop: post.featuredImage ? 20 : 0 }} />
      </section>

      {/* Article body — tighter top padding so "On this page" sits close to the image */}
      <section className="gb-article-section" style={{ padding: "clamp(20px, 4vw, 36px) 18px 100px", background: "#FFFFFF" }}>
        <div className="max-w-[680px] mx-auto">
          {/* Auto Table of Contents — appears only if the article has 2+ H2 sections */}
          {toc.length >= 2 && (
            <nav aria-label="On this page" className="article-toc" style={{ padding: "16px 20px", marginBottom: 24, background: "#F8F8F6", border: "1px solid #EFEFEA", borderRadius: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A7A85", margin: 0, marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 7 }}>
                <List className="w-3.5 h-3.5" /> On this page
              </p>
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8, counterReset: "toc" }}>
                {toc.map((h) => (
                  <li key={h.id} style={{ counterIncrement: "toc", fontSize: 14, lineHeight: 1.45 }}>
                    <a href={`#${h.id}`} style={{ color: "#1E293B", textDecoration: "none", display: "inline-flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontVariantNumeric: "tabular-nums", color: "#A0A0A8", fontSize: 12, fontWeight: 700, minWidth: 18 }}>{String(toc.indexOf(h) + 1).padStart(2, "0")}</span>
                      <span style={{ fontWeight: 500 }}>{h.text}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

        <div className="article-body">
          {isHtml(post.content)
            ? <div dangerouslySetInnerHTML={{ __html: enhancedContent }} />
            : renderMarkdown(post.content)
          }

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

      {/* Mobile-first sticky share bar */}
      <ShareBar url={shareUrl} title={post.title} />

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
                      style={{ background: "#FFFFFF", border: "1.5px solid #E5E5E0", borderRadius: 18, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", height: "100%", display: "flex", flexDirection: "column" }}
                      className="hover:-translate-y-1 hover:shadow-md"
                    >
                      {p.featuredImage && (
                        <div style={{ height: 160, overflow: "hidden", flexShrink: 0 }}>
                          <img src={p.featuredImage} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
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
