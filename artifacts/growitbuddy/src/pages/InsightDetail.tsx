import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { blogPosts as DEFAULT_POSTS, defaultSeo, type BlogPost } from "@/data/blogPosts";
import { usePublicContent } from "@/hooks/usePublicContent";
import { useWordPressPosts, fetchWpPostBySlug } from "@/hooks/useWordPressPosts";
import SEOMeta from "@/components/SEOMeta";

const ARTICLE_CSS = `
/* ── Base ── */
.article-body { font-family: Inter, sans-serif; }

/* ── First child: no top margin/spacing ── */
.article-body > *:first-child { margin-top: 0 !important; }

/* ── Paragraphs ── */
.article-body p,
.article-body .wp-block-paragraph { font-size: 17px; color: rgba(11,11,11,0.72); line-height: 1.9; margin-top: 0; margin-bottom: 20px; }
.article-body p:empty { display: none; }

/* ── Headings ── */
.article-body h1,
.article-body .wp-block-heading h1 { font-weight: 900; font-size: clamp(28px, 4vw, 42px); letter-spacing: -0.04em; color: #0A0A0A; margin-top: 56px; margin-bottom: 20px; line-height: 1.1; }
.article-body h2,
.article-body .wp-block-heading h2 { font-weight: 800; font-size: clamp(22px, 3vw, 28px); letter-spacing: -0.03em; color: #0A0A0A; margin-top: 56px; margin-bottom: 20px; line-height: 1.25; padding-bottom: 12px; border-bottom: 2px solid rgba(11,11,11,0.08); }
.article-body h3,
.article-body .wp-block-heading h3 { font-weight: 700; font-size: clamp(17px, 2vw, 21px); letter-spacing: -0.02em; color: #0A0A0A; margin-top: 36px; margin-bottom: 12px; line-height: 1.35; }
.article-body h4,
.article-body .wp-block-heading h4 { font-weight: 700; font-size: 17px; color: #0A0A0A; margin-top: 28px; margin-bottom: 10px; }
.article-body h5, .article-body h6 { font-weight: 700; font-size: 15px; color: #0A0A0A; margin-top: 24px; margin-bottom: 8px; }

/* ── Blockquote ── */
.article-body blockquote,
.article-body .wp-block-quote { margin: 32px 0; padding: 20px 24px; border-left: 3px solid #1E293B; background: rgba(11,11,11,0.03); border-radius: 0 12px 12px 0; }
.article-body blockquote p,
.article-body .wp-block-quote p { font-size: 18px; font-weight: 600; color: #1E293B; line-height: 1.7; font-style: italic; margin: 0; }
.article-body .wp-block-quote cite,
.article-body blockquote cite { display: block; font-size: 13px; color: rgba(11,11,11,0.45); font-style: normal; margin-top: 10px; }

/* ── Lists ── */
.article-body ul,
.article-body .wp-block-list ul { margin: 24px 0; padding-left: 22px; list-style: disc; }
.article-body ol,
.article-body .wp-block-list ol { margin: 24px 0; padding-left: 22px; list-style: decimal; }
.article-body li { font-size: 17px; color: rgba(11,11,11,0.72); line-height: 1.8; margin-bottom: 10px; padding-left: 4px; }
.article-body li:last-child { margin-bottom: 0; }

/* ── Inline ── */
.article-body strong, .article-body b { font-weight: 700; color: #0A0A0A; }
.article-body em, .article-body i { font-style: italic; }
.article-body a { color: #8B3A1A; text-decoration: underline; text-underline-offset: 3px; }
.article-body a:hover { color: #A34722; }
.article-body code { font-family: 'Fira Code', monospace; font-size: 14px; background: rgba(11,11,11,0.06); padding: 2px 7px; border-radius: 5px; color: #1E293B; }

/* ── Separator / HR ── */
.article-body hr,
.article-body .wp-block-separator { border: none; border-top: 1.5px solid rgba(11,11,11,0.1); margin: 40px 0; }

/* ── Images & Figures ── */
.article-body figure,
.article-body .wp-block-image { margin: 32px 0; }
.article-body figure img,
.article-body .wp-block-image img { width: 100%; border-radius: 12px; display: block; }
.article-body figcaption,
.article-body .wp-block-image figcaption { font-size: 13px; color: rgba(11,11,11,0.4); text-align: center; margin-top: 8px; }

/* ── Code block ── */
.article-body pre,
.article-body .wp-block-code { background: #1E293B; color: #e2e8f0; font-family: 'Fira Code', monospace; font-size: 14px; line-height: 1.7; padding: 20px 24px; border-radius: 12px; overflow-x: auto; margin: 28px 0; }
.article-body pre code { background: none; padding: 0; color: inherit; font-size: inherit; }

/* ── Gutenberg Group / Cover ── */
.article-body .wp-block-group { margin: 24px 0; }
.article-body .wp-block-cover { margin: 32px 0; border-radius: 12px; overflow: hidden; }

/* ── Columns ── */
.article-body .wp-block-columns { display: flex; gap: 24px; margin: 28px 0; }
.article-body .wp-block-column { flex: 1; min-width: 0; }

/* ── Table ── */
.article-body table,
.article-body .wp-block-table table { width: 100%; border-collapse: collapse; margin: 28px 0; font-size: 15px; }
.article-body th { background: rgba(11,11,11,0.05); font-weight: 700; color: #0A0A0A; padding: 10px 14px; border: 1px solid rgba(11,11,11,0.1); text-align: left; }
.article-body td { padding: 10px 14px; border: 1px solid rgba(11,11,11,0.1); color: rgba(11,11,11,0.72); }
.article-body tr:nth-child(even) td { background: rgba(11,11,11,0.02); }

/* ── Pullquote ── */
.article-body .wp-block-pullquote { border-top: 3px solid #C2A878; border-bottom: 3px solid #C2A878; padding: 28px 0; margin: 36px 0; text-align: center; }
.article-body .wp-block-pullquote blockquote { border: none; background: none; padding: 0; }
.article-body .wp-block-pullquote p { font-size: 22px; font-weight: 700; color: #1E293B; font-style: italic; letter-spacing: -0.02em; margin: 0; }
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

function buildPostSchema(post: BlogPost): Record<string, unknown>[] {
  const seo = { ...defaultSeo(), ...post.seo };
  const schemaType = seo.schemaType || "Article";

  const base: Record<string, unknown> = {
    "headline": seo.seoTitle || post.title,
    "description": seo.metaDescription || post.excerpt,
    "url": `${SITE}/insights/${post.slug}`,
    "datePublished": post.date,
    "image": post.featuredImage || `${SITE}/opengraph.jpg`,
    "author": { "@type": "Person", "@id": `${SITE}/#suraj-sharma`, "name": "Suraj Sharma" },
    "publisher": { "@type": "Organization", "@id": `${SITE}/#organization`, "name": "GrowitBuddy" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": `${SITE}/insights/${post.slug}` },
    "keywords": [seo.focusKeyword, seo.secondaryKeywords].filter(Boolean).join(", ") || post.tag,
    "articleSection": post.tag,
    "inLanguage": "en-US",
  };

  const schemas: Record<string, unknown>[] = [];
  schemas.push({
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE },
      { "@type": "ListItem", "position": 2, "name": "Insights", "item": `${SITE}/insights` },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": `${SITE}/insights/${post.slug}` },
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

  const { posts: cmsPosts } = usePublicContent<{ posts: BlogPost[] }>("blog", { posts: DEFAULT_POSTS });
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
    ...(cmsPosts?.length ? cmsPosts : DEFAULT_POSTS),
    ...wpPosts,
  ];

  const post: BlogPost | undefined = isWp ? (wpPost ?? undefined) : allPosts.find((p) => p.slug === slug);
  const related = allPosts.filter((p) => p.slug !== slug).slice(0, 3);

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
          <Link href="/insights">
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

      {/* Hero */}
      <section style={{ paddingTop: 96, paddingBottom: 0, background: "#FFFFFF" }}>
        <div className="max-w-[760px] mx-auto px-6">
          <Link href="/insights">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#7A7A85", cursor: "pointer", marginBottom: 36, letterSpacing: "0.01em" }}>
              <ArrowLeft className="w-3.5 h-3.5" /> All Insights
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", padding: "5px 13px", borderRadius: 100, background: "rgba(30,41,59,0.12)", border: "1px solid rgba(30,41,59,0.25)", color: "var(--gb-accent)" }}>
              {post.tag}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#7A7A85", fontWeight: 500 }}>
              <Calendar className="w-3 h-3" /> {post.date}
            </span>
            {post.source === "wordpress" && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(11,11,11,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                via WordPress
              </span>
            )}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ fontWeight: 900, fontSize: "clamp(22px, 5vw, 52px)", letterSpacing: "-0.04em", lineHeight: "1.1", color: "#0A0A0A", marginBottom: post.source === "wordpress" ? 0 : 22 }}
          >
            {post.title}
          </motion.h1>

          {post.source !== "wordpress" && post.excerpt && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{ fontSize: 19, color: "#5F5F5F", lineHeight: "1.7", marginBottom: 40, fontWeight: 400 }}
            >
              {post.excerpt}
            </motion.p>
          )}
        </div>

        {post.featuredImage && (
          <div className="max-w-[900px] mx-auto px-6" style={{ paddingBottom: 0 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              style={{ borderRadius: 20, overflow: "hidden", background: "#e8e8e6", aspectRatio: "16/7", boxShadow: "0 4px 40px rgba(11,11,11,0.10)" }}
            >
              <img src={post.featuredImage} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </motion.div>
          </div>
        )}

        <div style={{ height: 1, background: "rgba(10,10,10,0.03)", marginTop: post.featuredImage ? (post.source === "wordpress" ? 24 : 40) : 0 }} />
      </section>

      {/* Article body */}
      <section style={{ padding: `${post.source === "wordpress" ? "40px" : "64px"} 24px 80px`, background: "#FFFFFF" }}>
        <div className="article-body max-w-[680px] mx-auto">
          {isHtml(post.content)
            ? <div dangerouslySetInnerHTML={{ __html: post.content }} />
            : renderMarkdown(post.content)
          }

          <div style={{ marginTop: 64, padding: "36px 40px", background: "#EFEFEA", borderRadius: 20, textAlign: "center" }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 12 }}>Ready to build your authority?</p>
            <h3 style={{ fontWeight: 800, fontSize: "clamp(20px, 3vw, 26px)", letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 20, lineHeight: 1.25 }}>
              Turn your expertise into consistent inbound demand.
            </h3>
            <Link href="/authority-audit">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FFFFFF", color: "#0A0A0A", fontWeight: 700, fontSize: 14, padding: "13px 28px", borderRadius: 100, cursor: "pointer", letterSpacing: "-0.01em" }}>
                Get your free audit <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Related posts */}
      {related.length > 0 && (
        <section style={{ padding: "64px 24px 80px", background: "#F8F8F6", borderTop: "1px solid #E5E5E0" }}>
          <div className="max-w-[1100px] mx-auto">
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 12 }}>Continue reading</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 3vw, 34px)", letterSpacing: "-0.04em", color: "#0A0A0A", marginBottom: 36 }}>More Insights</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 16 }}>
              {related.map((p, i) => (
                <motion.div key={p.slug} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}>
                  <Link href={`/insights/${p.slug}`}>
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
