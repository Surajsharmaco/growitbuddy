import { API_URL, BLOG_PATH, BRAND, SITE_URL } from "./constants";

/** Minimal structural article model; CMS and WordPress posts can both satisfy it. */
export interface BlogSeoPost {
  slug: string;
  title: string;
  excerpt?: string;
  date?: string;
  isoDate?: string;
  modifiedIsoDate?: string;
  tag?: string;
  content?: string;
  featuredImage?: string;
  status?: string;
  trashed?: boolean;
  seo?: {
    seoTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    schemaType?: string;
    focusKeyword?: string;
    secondaryKeywords?: string;
    faqItems?: Array<{ question?: string; answer?: string }>;
    howToSteps?: Array<{ name?: string; text?: string }>;
  };
}

export interface ResolvedBlogSeo {
  url: string;
  title: string;
  description: string;
  canonical: string;
  robots: string;
  og: {
    title: string;
    description: string;
    url: string;
    type: string;
    image: string;
    siteName: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
    url: string;
  };
  jsonLd: { "@context": string; "@graph": Record<string, unknown>[] };
  metaTagsHtml: string;
  crawlerBodyHtml: string;
  sitemap: { included: boolean; url: string; lastmod: string | null };
}

export function isPublicBlogPost(post: BlogSeoPost): boolean {
  return post.trashed !== true && (post.status ?? "published") === "published";
}

export function isBlogInSitemap(
  post: BlogSeoPost,
  globalIndexable = true,
): boolean {
  if (!globalIndexable || !isPublicBlogPost(post) || post.seo?.noIndex === true) return false;
  const articleUrl = `${SITE_URL}${BLOG_PATH}/${encodeURIComponent(post.slug)}`;
  const canonical = post.seo?.canonicalUrl?.trim();
  return !canonical || absoluteUrl(canonical, articleUrl) === articleUrl;
}

function absoluteUrl(value: string | undefined, fallback: string): string {
  const url = (value ?? "").trim();
  if (!url) return fallback;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/api/")) return `${API_URL}${url}`;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function validDate(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|#39|nbsp|colon);/gi, (entity, token: string) => {
    const key = token.toLowerCase();
    if (key.startsWith("#x") || key.startsWith("#")) {
      const codePoint = parseInt(key.startsWith("#x") ? key.slice(2) : key.slice(1), key.startsWith("#x") ? 16 : 10);
      return codePoint >= 0 && codePoint <= 0x10ffff && !(codePoint >= 0xd800 && codePoint <= 0xdfff)
        ? String.fromCodePoint(codePoint)
        : entity;
    }
    const named: Record<string, string> = {
      amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'", nbsp: " ", colon: ":",
    };
    return named[key] ?? entity;
  });
}

function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function textContent(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#160|#x0*a0);/gi, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|#39|nbsp|colon);/gi, decodeEntities)
    .replace(/\s+/g, " ")
    .trim();
}

function htmlAttribute(tag: string, name: string): string {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  return decodeEntities(match?.[1] ?? match?.[2] ?? match?.[3] ?? "").trim();
}

function safeCrawlerUrl(value: string): string {
  const url = decodeEntities(value).trim();
  if (!url || /[\u0000-\u0020\\]/.test(url)) return "";
  if (/^(?:https?:)?\/\//i.test(url) || /^(?:\/|#|\?|\.\.?\/)/.test(url)) return url;
  if (/^(?:mailto|tel):/i.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return "";
  return url;
}

function makeCrawlerBody(post: BlogSeoPost): string {
  const content = post.content ?? "";
  const paragraphs = (post.content ?? "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "\n")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "\n")
    .split(/\n{2,}/)
    .map((part) => textContent(part))
    .filter(Boolean)
    .slice(0, 100);
  const excerpt = textContent(post.excerpt ?? "");
  const seen = new Set<string>();
  const parts = [`<h1>${escapeHtml(post.title)}</h1>`];
  if (excerpt && excerpt.toLowerCase() !== post.title.toLowerCase()) {
    parts.push(`<p>${escapeHtml(excerpt)}</p>`);
    seen.add(excerpt.toLowerCase());
  }
  for (const paragraph of paragraphs) {
    if (seen.has(paragraph.toLowerCase())) continue;
    seen.add(paragraph.toLowerCase());
    parts.push(`<p>${escapeHtml(paragraph)}</p>`);
  }

  const htmlContent = /<(?:h[1-6]|p|div|figure|img|a|ul|ol|blockquote|section)\b/i.test(content);
  if (htmlContent) {
    for (const match of content.matchAll(/<h([23])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi)) {
      const heading = textContent(match[2]);
      if (heading) parts.push(`<h${match[1]}>${escapeHtml(heading)}</h${match[1]}>`);
    }
    for (const match of content.matchAll(/<img\b[^>]*\/?>/gi)) {
      const src = safeCrawlerUrl(htmlAttribute(match[0], "src"));
      if (!src) continue;
      const alt = htmlAttribute(match[0], "alt");
      parts.push(`<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`);
    }
    for (const match of content.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
      const href = safeCrawlerUrl(htmlAttribute(match[1], "href"));
      const text = textContent(match[2]);
      if (href && text) parts.push(`<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`);
    }
  } else {
    for (const match of content.matchAll(/^\s*(#{2,3})\s+(.+?)\s*#*\s*$/gm)) {
      const level = match[1].length;
      parts.push(`<h${level}>${escapeHtml(textContent(match[2]))}</h${level}>`);
    }
    for (const match of content.matchAll(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^)]*["'])?\)/g)) {
      const src = safeCrawlerUrl(match[2]);
      if (src) parts.push(`<img src="${escapeHtml(src)}" alt="${escapeHtml(textContent(match[1]))}" />`);
    }
    for (const match of content.matchAll(/\[([^\]]+)\]\(([^)\s]+)(?:\s+["'][^)]*["'])?\)/g)) {
      const href = safeCrawlerUrl(match[2]);
      const text = textContent(match[1]);
      if (href && text) parts.push(`<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`);
    }
  }
  const faqItems = (post.seo?.faqItems ?? []).filter(
    (item) => item.question?.trim() && item.answer?.trim(),
  );
  if (faqItems.length) {
    parts.push("<h2>Frequently asked questions</h2>");
    for (const item of faqItems) {
      parts.push(`<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`);
    }
  }
  return parts.join("");
}

export function resolveBlogSeo(
  post: BlogSeoPost,
  options: { globalIndexable?: boolean } = {},
): ResolvedBlogSeo {
  const seo = post.seo ?? {};
  const url = `${SITE_URL}${BLOG_PATH}/${encodeURIComponent(post.slug)}`;
  const articleHeadline = seo.seoTitle?.trim() || post.title.trim();
  const title = articleHeadline;
  const description = seo.metaDescription?.trim() || post.excerpt || "";
  const canonical = absoluteUrl(seo.canonicalUrl, url);
  const globalIndexable = options.globalIndexable !== false;
  const robots =
    globalIndexable && seo.noIndex !== true ? "index,follow" : "noindex,nofollow";
  const image = absoluteUrl(
    seo.ogImage || post.featuredImage,
    `${SITE_URL}/opengraph.jpg`,
  );
  const ogTitle = seo.ogTitle?.trim() || title;
  const ogDescription = seo.ogDescription?.trim() || description;
  const twitterTitle = ogTitle;
  const twitterDescription = ogDescription;
  const datePublished = validDate(post.isoDate || post.date);
  const dateModified = validDate(post.modifiedIsoDate) || datePublished;
  const faqItems = (seo.faqItems ?? []).filter(
    (faq) => faq.question?.trim() && faq.answer?.trim(),
  );
  const contentText = textContent(post.content ?? "");
  const graph: Record<string, unknown>[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}${BLOG_PATH}` },
        { "@type": "ListItem", position: 3, name: post.title, item: canonical },
      ],
    },
  ];
  const schemaType = seo.schemaType || "Article";
  if (schemaType !== "None") {
    const isHowTo = schemaType === "HowTo";
    graph.push({
      "@type": schemaType === "FAQ" ? "Article" : schemaType,
      headline: articleHeadline,
      description,
      url: canonical,
      ...(isHowTo
        ? {
            name: articleHeadline,
            step: (seo.howToSteps ?? []).filter((step) => step.name?.trim() && step.text?.trim()).map((step, index) => ({
              "@type": "HowToStep",
              position: index + 1,
              name: step.name,
              text: step.text,
            })),
          }
        : {}),
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      ...(datePublished ? { datePublished } : {}),
      ...(dateModified ? { dateModified } : {}),
      ...(image ? { image } : {}),
      author: {
        "@type": "Person",
        "@id": `${SITE_URL}/#suraj-sharma`,
        name: BRAND.founder.name,
        url: `${SITE_URL}/about`,
      },
      publisher: {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: BRAND.name,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
      },
      ...(seo.focusKeyword || seo.secondaryKeywords
        ? { keywords: [seo.focusKeyword, seo.secondaryKeywords].filter(Boolean).join(", ") }
        : {}),
      ...(post.tag ? { articleSection: post.tag } : {}),
      inLanguage: "en-US",
      wordCount: contentText ? contentText.split(/\s+/).length : 0,
      isAccessibleForFree: true,
    });
  }
  if (faqItems.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqItems.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    });
  }
  const jsonLd = { "@context": "https://schema.org", "@graph": graph };
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="${escapeHtml(robots)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:title" content="${escapeHtml(ogTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(ogDescription)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(BRAND.name)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(twitterTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(twitterDescription)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:url" content="${escapeHtml(canonical)}" />`,
    `<script type="application/ld+json" id="gb-jsonld">${safeJson(jsonLd)}</script>`,
  ];
  const lastmod = validDate(post.modifiedIsoDate || post.isoDate || post.date);
  return {
    url,
    title,
    description,
    canonical,
    robots,
    og: {
      title: ogTitle,
      description: ogDescription,
      url,
      type: "article",
      image,
      siteName: BRAND.name,
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle,
      description: twitterDescription,
      image,
      url: canonical,
    },
    jsonLd,
    metaTagsHtml: tags.join("\n"),
    crawlerBodyHtml: makeCrawlerBody(post),
    sitemap: {
      included: isBlogInSitemap(post, globalIndexable),
      url,
      lastmod: lastmod ? lastmod.slice(0, 10) : null,
    },
  };
}