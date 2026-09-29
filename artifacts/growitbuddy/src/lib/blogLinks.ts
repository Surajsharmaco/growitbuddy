const SITE_URL = "https://growitbuddy.com/";

export type ArticleLink = { href: string; url: string; kind: "internal" | "external" };

export function classifyArticleLink(href: string): ArticleLink | null {
  const value = href.trim();
  if (!value || value.startsWith("#")) return null;
  try {
    const url = new URL(value, SITE_URL);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const kind = url.hostname === "growitbuddy.com" || url.hostname === "www.growitbuddy.com"
      ? "internal" : "external";
    return { href: value, url: url.href, kind };
  } catch {
    return null;
  }
}

export function getArticleLinks(content: string): ArticleLink[] {
  const doc = new DOMParser().parseFromString(content, "text/html");
  return Array.from(doc.querySelectorAll("a[href]"))
    .map((anchor) => classifyArticleLink(anchor.getAttribute("href") ?? ""))
    .filter((link): link is ArticleLink => link !== null);
}