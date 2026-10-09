import { marked } from "marked";
import type { BlogPost } from "@/data/blogPosts";

export type ArticleTocEntry = { id: string; text: string };

function headingId(text: string, used: Set<string>): string {
  const base = text.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "section";
  let id = base;
  let suffix = 2;
  while (used.has(id)) id = `${base}-${suffix++}`;
  used.add(id);
  return id;
}

/** Assign every H2 an anchor before filtering, keeping links stable when labels are edited. */
export function articleHeadingDocument(content: string): Document {
  const html = /<(?:h[1-6]|p|div|ul|ol|table|blockquote)\b/i.test(content)
    ? content
    : marked.parse(content, { async: false }) as string;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const used = new Set(Array.from(doc.body.querySelectorAll("[id]")).map(el => el.id));
  doc.body.querySelectorAll("h2").forEach(heading => {
    if (!heading.id) heading.id = headingId(heading.textContent?.trim() ?? "", used);
  });
  return doc;
}

export function articleHtmlWithHeadingIds(html: string): string {
  return articleHeadingDocument(html).body.innerHTML;
}

/** A malformed heading wrapping body blocks is not a navigable section label. */
export function collectArticleToc(content: string): ArticleTocEntry[] {
  if (!content || typeof DOMParser === "undefined") return [];
  return Array.from(articleHeadingDocument(content).body.querySelectorAll("h2"))
    .filter(heading => !heading.querySelector("p,div,ul,ol,table,blockquote,pre,h1,h2,h3,h4,h5,h6")
      && (heading.textContent?.trim().length ?? 0) <= 180)
    .map(heading => ({ id: heading.id, text: heading.textContent?.replace(/\s+/g, " ").trim() ?? "" }))
    .filter(entry => !!entry.text);
}

export function getArticleToc(content: string, settings?: BlogPost["toc"]): ArticleTocEntry[] {
  if (settings?.enabled === false) return [];
  const candidates = collectArticleToc(content);
  if (!Array.isArray(settings?.entries)) return candidates;
  const byId = new Map(candidates.map(entry => [entry.id, entry]));
  const seen = new Set<string>();
  const result: ArticleTocEntry[] = [];
  for (const override of settings.entries) {
    if (!override || typeof override.id !== "string") continue;
    const candidate = byId.get(override.id);
    if (!candidate || seen.has(override.id)) continue;
    seen.add(override.id);
    if (!override.hidden) result.push({ ...candidate, text: typeof override.label === "string" ? override.label.trim() || candidate.text : candidate.text });
  }
  return result.concat(candidates.filter(entry => !seen.has(entry.id)));
}
