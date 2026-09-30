import type { BlogPost } from "../data/blogPosts";
import { resolveBlogSeo, type BlogSeoOutput } from "@workspace/seo";

export type SeoCheckLevel = "pass" | "warning" | "error";
export type SeoCheckCategory = "on-page" | "technical";

export interface SeoCheck {
  key: string;
  category: SeoCheckCategory;
  level: SeoCheckLevel;
  label: string;
  detail: string;
}

export interface SeoAuditLink {
  text: string;
  href: string;
  internal: boolean;
  rel: string;
}

export interface SeoAuditHeading {
  level: 1 | 2 | 3;
  text: string;
}

export interface SeoAuditImage {
  src: string;
  alt: string;
  missingAlt: boolean;
}

export interface BlogSeoAudit {
  checks: SeoCheck[];
  criticalErrors: string[];
  wordCount: number;
  headings: SeoAuditHeading[];
  images: SeoAuditImage[];
  internalLinks: SeoAuditLink[];
  externalLinks: SeoAuditLink[];
}

const allowedSchemaTypes = new Set([
  "Article", "BlogPosting", "NewsArticle", "TechArticle", "Review",
  "FAQ", "HowTo", "VideoObject", "WebPage", "None",
]);

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * CMS posts can contain either HTML or Markdown. Build a detached DOM from the
 * actual saved content; the Markdown branch only translates elements needed by
 * this audit, and does not claim to be the public article renderer.
 */
function contentDocument(content: string): Document | null {
  if (typeof DOMParser === "undefined") return null;
  const isHtml = /<(?:p|h[1-6]|div|figure|ul|ol|blockquote|section|article|table)\b/i.test(content);
  if (isHtml) return new DOMParser().parseFromString(content, "text/html");
  const html = content.split(/\r?\n/).map((line) => {
    const heading = line.match(/^\s*(#{1,6})\s+(.+)/);
    const body = heading ? heading[2] : line;
    const safe = escapeHtml(body)
      .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, '<img src="$2" alt="$1">')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
      .replace(/[*_`~]/g, "");
    return heading ? `<h${heading[1].length}>${safe}</h${heading[1].length}>` : `<p>${safe}</p>`;
  }).join("\n");
  return new DOMParser().parseFromString(html, "text/html");
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function validHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** Static, production-output-based pre-publish checks. No HTTP requests are made. */
export function analyzeBlogSeo(
  post: BlogPost,
  output: BlogSeoOutput,
  allPosts: BlogPost[],
  currentlyPublished: boolean,
): BlogSeoAudit {
  const checks: SeoCheck[] = [];
  const add = (key: string, category: SeoCheckCategory, level: SeoCheckLevel, label: string, detail: string) =>
    checks.push({ key, category, level, label, detail });

  const doc = contentDocument(post.content || "");
  const text = doc?.body.textContent?.replace(/\s+/g, " ").trim() || (post.content || "").replace(/<[^>]*>/g, " ").trim();
  const wordCount = text ? (text.match(/\b[\p{L}\p{N}][\p{L}\p{N}'’-]*\b/gu) || []).length : 0;
  const headings: SeoAuditHeading[] = doc
    ? Array.from(doc.querySelectorAll("h1,h2,h3")).map((element) => ({
        level: Number(element.tagName.slice(1)) as 1 | 2 | 3,
        text: element.textContent?.trim() || "",
      }))
    : [];
  const images: SeoAuditImage[] = doc ? Array.from(doc.querySelectorAll("img")).map((image) => ({
    src: image.getAttribute("src") || "",
    alt: image.getAttribute("alt") || "",
    missingAlt: !image.getAttribute("alt")?.trim(),
  })) : [];
  const imagesWithoutAlt = images.filter((image) => image.missingAlt).length;
  const siteOrigin = (() => { try { return new URL(output.url).origin; } catch { return ""; } })();
  const links: SeoAuditLink[] = doc ? Array.from(doc.querySelectorAll("a[href]")).map((anchor) => {
    const href = anchor.getAttribute("href")?.trim() || "";
    let internal = href.startsWith("/") || href.startsWith("#");
    try { if (siteOrigin && new URL(href, output.url).origin === siteOrigin) internal = true; } catch { /* Keep relative classification. */ }
    return { text: anchor.textContent?.trim() || "(unlabelled link)", href, internal, rel: anchor.getAttribute("rel") || "" };
  }).filter((link) => !!link.href) : [];
  const slugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug || "") && !post.slug.startsWith("wp-");
  add("slug", "technical", slugValid ? "pass" : "error",
    "URL slug", slugValid ? `Valid path segment: ${post.slug}` : "Use a non-empty lowercase, hyphen-separated slug. The wp- prefix is reserved for WordPress URLs.");
  add("title", "on-page", post.title?.trim() && output.title?.trim() ? "pass" : "error",
    "Article and search title", post.title?.trim() && output.title?.trim() ? `${output.title.length} characters in the generated title.` : "A post title and a generated search title are required.");
  add("canonical", "technical", validHttpUrl(output.canonical || "") ? "pass" : "error",
    "Canonical URL", validHttpUrl(output.canonical || "") ? output.canonical : "Canonical must be an absolute HTTP or HTTPS URL.");
  const canonicalInput = post.seo?.canonicalUrl?.trim() || "";
  let canonicalInputSafe = true;
  if (canonicalInput) {
    try { canonicalInputSafe = ["http:", "https:"].includes(new URL(canonicalInput, output.url).protocol); }
    catch { canonicalInputSafe = false; }
  }
  add("canonical-input", "technical", canonicalInputSafe ? "pass" : "error", "Canonical override",
    canonicalInputSafe ? "The supplied canonical uses an HTTP(S) URL or a relative path." : "The canonical override has an invalid or unsafe URL scheme. Use an HTTPS URL or a site-relative path.");
  if (validHttpUrl(output.canonical || "") && validHttpUrl(output.url || "")) {
    const canonical = new URL(output.canonical).href.replace(/\/$/, "");
    const articleUrl = new URL(output.url).href.replace(/\/$/, "");
    add("canonical-target", "technical", canonical === articleUrl ? "pass" : "warning", "Canonical target",
      canonical === articleUrl ? "Canonical points to the generated article URL." : `Canonical points to ${output.canonical} rather than ${output.url}. This may be intentional for syndication.`);
  }
  add("https", "technical", output.url?.startsWith("https://") ? "pass" : "warning", "HTTPS in generated URL",
    output.url?.startsWith("https://") ? "The generated URL uses HTTPS. TLS and the live HTTP response were not verified." : "The generated URL does not use HTTPS. This is a URL inspection only; live transport was not tested.");
  add("article", "on-page", wordCount > 0 ? "pass" : "error",
    "Article body", wordCount > 0 ? `${wordCount.toLocaleString()} words detected in the saved content.` : "The article body is empty.");

  const requestedType = post.seo?.schemaType || "Article";
  add("schema-type", "technical", allowedSchemaTypes.has(requestedType) ? "pass" : "error",
    "Schema selection", allowedSchemaTypes.has(requestedType) ? `${requestedType} selected; ${output.jsonLd?.["@graph"]?.length || 0} node(s) in the generated graph.` : `Unsupported schema type: ${requestedType}.`);
  add("schema-graph", "technical",
    output.jsonLd?.["@context"] === "https://schema.org" && Array.isArray(output.jsonLd["@graph"]) && output.jsonLd["@graph"].every((node) => !!node["@type"]) ? "pass" : "error",
    "JSON-LD structure",
    output.jsonLd?.["@context"] === "https://schema.org" && Array.isArray(output.jsonLd["@graph"]) && output.jsonLd["@graph"].every((node) => !!node["@type"])
      ? `${output.jsonLd["@graph"].length} node(s) with @type in a schema.org graph. Syntax/shape only; rich-result eligibility is not verified.`
      : "Expected a schema.org @context and an @graph with @type on each node.");
  const articleSchema = output.jsonLd["@graph"].some((node) =>
    ["Article", "BlogPosting", "NewsArticle", "TechArticle", "Review", "HowTo", "VideoObject", "WebPage"].includes(String(node["@type"])));
  add("article-schema", "technical", articleSchema ? "pass" : "warning", "Article structured data",
    articleSchema ? "An article-level structured-data node is generated." : "No article-level structured data is generated. Check the schema type setting.");

  const noindex = /(?:^|,|\s)noindex(?:,|\s|$)/i.test(output.robots || "");
  add("robots", "technical", noindex ? "warning" : "pass", "Robots directive",
    noindex ? `Generated directive is "${output.robots}". Search engines are asked not to index.` : `Generated directive is "${output.robots}". This is not a guarantee of indexing.`);
  add("sitemap", "technical", output.sitemap.included ? "pass" : "warning", "Sitemap eligibility",
    output.sitemap.included ? `Included by the generated sitemap output as ${output.sitemap.url}. Deployment not checked.` : "Excluded from generated sitemap output. Review publication and indexing settings; deployed sitemap not checked.");
  add("visibility", "technical", post.status === "draft" || !currentlyPublished ? "warning" : "pass",
    "Publication state", currentlyPublished ? "A published version exists. These generated values may differ from the live response until saved." : "Not live yet. This is an after-publish projection, not a verified HTTP response.");
  add("description", "on-page", output.description?.trim() ? "pass" : "warning",
    "Search description", output.description?.trim() ? `${output.description.length} characters in the generated description; Google may select a different snippet.` : "No resolved description. Add a specific summary.");
  add("featured-image", "on-page", post.featuredImage?.trim() ? "pass" : "warning",
    "Featured image", post.featuredImage?.trim() ? "A featured image is configured. Availability and dimensions have not been fetched." : "No featured image on the post.");
  add("image-alt", "on-page", imagesWithoutAlt ? "warning" : "pass",
    "Image alt text", imagesWithoutAlt ? `${imagesWithoutAlt} of ${images.length} body image(s) have empty or missing alt text. Decorative images may intentionally use empty alt.` : `${images.length} body image(s); none have missing alt text. Image URLs were not fetched.`);
  add("resources-unverified", "technical", "warning", "Resource status not tested",
    `${links.length} link destination(s) and ${images.length} body image URL(s) were parsed, not requested. Broken links and images cannot be determined by this audit.`);
  add("mobile-unverified", "technical", "warning", "Mobile rendering not verified",
    "The supplied article preview can be inspected at narrow width, but this static content audit does not verify public-device rendering or mobile usability.");

  const others = allPosts.filter((other) => other !== post && other.slug !== post.slug && !other.trashed);
  const sameTitle = others.filter((other) => normalizeText(resolveBlogSeo(other).title) === normalizeText(output.title) && !!normalizeText(output.title));
  const sameDescription = others.filter((other) => normalizeText(other.seo?.metaDescription || other.excerpt) === normalizeText(output.description) && !!normalizeText(output.description));
  add("duplicate-title", "on-page", sameTitle.length ? "warning" : "pass", "Duplicate titles",
    sameTitle.length ? `Same title found on: ${sameTitle.map((item) => item.slug).join(", ")}.` : "No matching title among the posts supplied to this audit.");
  add("duplicate-description", "on-page", sameDescription.length ? "warning" : "pass", "Duplicate descriptions",
    sameDescription.length ? `Same description found on: ${sameDescription.map((item) => item.slug).join(", ")}.` : "No matching description among the posts supplied to this audit.");
  const bodyH1 = headings.filter((item) => item.level === 1).length;
  const pageH1 = post.title?.trim() ? 1 : 0;
  const h1 = pageH1 + bodyH1;
  const h2 = headings.filter((item) => item.level === 2).length;
  const meaningfulHeading = headings.some((item) => (item.level === 2 || item.level === 3) && item.text.trim().length >= 4);
  add("headings", "on-page", h1 !== 1 || !meaningfulHeading || (h2 === 0 && headings.some((item) => item.level === 3)) ? "warning" : "pass", "Article structure",
    `${h1} expected H1 (${pageH1} public page title + ${bodyH1} body H1), ${h2} body H2, ${headings.filter((item) => item.level === 3).length} body H3. ${h1 > 1 ? "Duplicate H1 headings likely." : h1 === 0 ? "No H1 found." : "One H1 expected."} ${meaningfulHeading ? "A meaningful section heading exists." : "Add a meaningful H2 or H3 to the article."}`);
  const faqCount = post.seo?.faqItems?.filter((item) => item.question?.trim() && item.answer?.trim()).length || 0;
  const faqGraph = output.jsonLd?.["@graph"]?.some((node) => {
    const type = node["@type"];
    return type === "FAQPage" || (Array.isArray(type) && type.includes("FAQPage"));
  });
  if (requestedType === "FAQ" || faqGraph) add("faq-content", "technical", faqCount ? "pass" : "warning",
    "FAQ schema content", faqCount ? `${faqCount} question/answer pair(s) entered. Confirm they appear on the public page.` : "FAQ schema is selected without a complete question and answer. Add visible FAQ content or choose another schema type.");
  const keyword = post.seo?.focusKeyword?.trim();
  if (keyword) {
    const inTitle = normalizeText(output.title).includes(normalizeText(keyword));
    const inBody = normalizeText(text).includes(normalizeText(keyword));
    add("keyword", "on-page", inTitle && inBody ? "pass" : "warning", "Focus phrase placement",
      `"${keyword}" ${inTitle ? "appears" : "does not appear"} in the resolved title and ${inBody ? "appears" : "does not appear"} in the saved body. Exact phrase only; not a ranking prediction.`);
  }
  add("links", "on-page", links.length ? "pass" : "warning", "Article links",
    `${links.filter((link) => link.internal).length} internal and ${links.filter((link) => !link.internal).length} external link(s) parsed. Destinations and HTTP status were not checked.`);
  return {
    checks,
    criticalErrors: checks.filter((check) => check.level === "error").map((check) => `${check.label}: ${check.detail}`),
    wordCount,
    headings,
    images,
    internalLinks: links.filter((link) => link.internal),
    externalLinks: links.filter((link) => !link.internal),
  };
}