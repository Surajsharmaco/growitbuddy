import DOMPurify from "dompurify";
import { marked } from "marked";

type ClipboardBlog = { html?: string; text?: string };

function hasRichFormatting(html: string): boolean {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return !!doc.body.querySelector("h1,h2,h3,h4,h5,h6,table,a,strong,b,em,i,ul,ol,blockquote,img,pre") ||
    Array.from(doc.body.querySelectorAll<HTMLElement>("[style]")).some((node) =>
      /^(bold|bolder|[6-9]00)$/i.test(node.style.fontWeight.trim()) || node.style.fontStyle === "italic",
    );
}

function preserveRichEmphasis(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.body.querySelectorAll<HTMLElement>("span[style],font[style],p[style],td[style],th[style]").forEach((node) => {
    const bold = /^(bold|bolder|[6-9]00)$/i.test(node.style.fontWeight.trim());
    const italic = node.style.fontStyle === "italic";
    if (!bold && !italic) return;
    const outer = doc.createElement(bold ? "strong" : "em");
    const inner = bold && italic ? doc.createElement("em") : outer;
    while (node.firstChild) inner.appendChild(node.firstChild);
    if (inner !== outer) outer.appendChild(inner);
    node.appendChild(outer);
  });
  return doc.body.innerHTML;
}

function cleanLink(href: string): { url: string; external: boolean } | null {
  const raw = href.trim();
  if (!raw || /[\u0000-\u001f\u007f]/.test(raw)) return null;
  if (raw.startsWith("#")) return { url: raw, external: false };
  try {
    const url = new URL(raw, window.location.origin + "/");
    if (url.protocol === "mailto:" || url.protocol === "tel:") {
      return { url: url.href, external: false };
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const internal = url.hostname === window.location.hostname ||
      url.hostname === "growitbuddy.com" || url.hostname === "www.growitbuddy.com";
    return internal
      ? { url: `${url.pathname}${url.search}${url.hash}`, external: false }
      : { url: /^(?:https?:)?\/\//i.test(raw) ? raw : url.href, external: true };
  } catch {
    return null;
  }
}

/** Convert a clipboard blog to safe, article-ready HTML without altering the rest of the draft. */
export function formatPastedBlog({ html = "", text = "" }: ClipboardBlog): { html: string; omittedImages: number } {
  const useRichHtml = html.trim() && (hasRichFormatting(html) || !text.trim());
  const source = useRichHtml
    ? preserveRichEmphasis(html)
    : marked.parse(text.replace(/\r\n?/g, "\n"), { gfm: true, breaks: false, async: false }) as string;
  if (!source.trim()) return { html: "", omittedImages: 0 };

  const safe = DOMPurify.sanitize(source, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form", "input", "button", "textarea", "select"],
    FORBID_ATTR: ["style", "class", "srcset"],
    ALLOW_DATA_ATTR: false,
  });
  const container = document.createElement("div");
  container.innerHTML = safe;

  container.querySelectorAll<HTMLAnchorElement>("a").forEach((anchor) => {
    const link = cleanLink(anchor.getAttribute("href") ?? "");
    if (!link) {
      anchor.replaceWith(...Array.from(anchor.childNodes));
      return;
    }
    anchor.setAttribute("href", link.url);
    if (link.external) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    } else {
      anchor.removeAttribute("target");
      anchor.removeAttribute("rel");
    }
  });

  let omittedImages = 0;
  container.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
    const src = image.getAttribute("src") ?? "";
    if (!/^https?:\/\//i.test(src) && !/^\/(?!\/)/.test(src)) {
      image.remove();
      omittedImages++;
      return;
    }
    image.removeAttribute("width");
    image.removeAttribute("height");
    image.loading = "lazy";
  });

  container.querySelectorAll("table").forEach((table) => {
    const scroller = document.createElement("div");
    scroller.className = "blog-table-scroll";
    table.replaceWith(scroller);
    scroller.appendChild(table);
  });

  return { html: container.innerHTML, omittedImages };
}

const HEADING_LINE = /^\s{0,3}#{1,6}\s+\S/m;
const TABLE_DIVIDER = /^\s*\|?\s*:?-{3,}:?\s*\|(?:\s*:?-{3,}:?\s*\|?)+\s*$/m;

function plainBlock(node: Element): string | null {
  if (!["P", "DIV"].includes(node.tagName) || node.attributes.length) return null;
  if (Array.from(node.children).some((child) => child.tagName !== "BR")) return null;
  const text = Array.from(node.childNodes).map((child) =>
    child.nodeType === Node.TEXT_NODE ? child.textContent : child.nodeName === "BR" ? "\n" : "",
  ).join("");
  return text.trim() ? text : null;
}

function convertMarkdownBlocks(parent: Element): boolean {
  if (["PRE", "CODE", "TABLE", "BLOCKQUOTE"].includes(parent.tagName)) return false;
  const children = Array.from(parent.children);
  let changed = false;
  for (let i = 0; i < children.length;) {
    const first = plainBlock(children[i]);
    if (first !== null) {
      const run: Element[] = [];
      const lines: string[] = [];
      while (i < children.length) {
        const line = plainBlock(children[i]);
        if (line === null) break;
        run.push(children[i]);
        lines.push(line);
        i++;
      }
      const markdown = lines.map((line, index) =>
        index && lines[index - 1].includes("|") && line.includes("|") ? `\n${line}` : `${index ? "\n\n" : ""}${line}`,
      ).join("");
      if (HEADING_LINE.test(markdown) || TABLE_DIVIDER.test(markdown)) {
        const formatted = formatPastedBlog({ text: markdown }).html;
        if (formatted) {
          const replacement = document.createElement("div");
          replacement.innerHTML = formatted;
          run[0].before(...Array.from(replacement.childNodes));
          run.forEach((node) => node.remove());
          changed = true;
        }
      }
      continue;
    }
    const node = children[i++];
    // Keep existing inline formatting inside a heading while removing the Markdown marker.
    if (["P", "DIV"].includes(node.tagName) &&
        !node.querySelector("p,div,h1,h2,h3,h4,h5,h6,table,ul,ol,pre,blockquote")) {
      const match = node.textContent?.match(/^\s{0,3}(#{1,6})\s+/);
      if (match) {
        const heading = document.createElement(`h${match[1].length}`);
        for (const attr of Array.from(node.attributes)) heading.setAttribute(attr.name, attr.value);
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        let markerLength = match[0].length;
        while (markerLength && walker.nextNode()) {
          const text = walker.currentNode.nodeValue ?? "";
          const length = Math.min(markerLength, text.length);
          walker.currentNode.nodeValue = text.slice(length);
          markerLength -= length;
        }
        while (node.firstChild) heading.appendChild(node.firstChild);
        node.replaceWith(heading);
        changed = true;
        continue;
      }
    }
    changed = convertMarkdownBlocks(node) || changed;
  }
  return changed;
}

/** Format an existing draft without replacing its rich HTML, images or embeds. */
export function optimizeBlogContent(content: string, sourceType: "html" | "markdown"): {
  html: string;
  changed: boolean;
  omittedImages: number;
} {
  if (!content.trim()) return { html: "", changed: false, omittedImages: 0 };
  if (sourceType === "markdown") {
    const formatted = formatPastedBlog({ text: content });
    return { ...formatted, changed: formatted.html !== content };
  }
  const container = document.createElement("div");
  container.innerHTML = content;
  if (!container.children.length) {
    const formatted = formatPastedBlog({ text: container.textContent ?? "" });
    return { ...formatted, changed: formatted.html !== content };
  }
  let changed = convertMarkdownBlocks(container);

  container.querySelectorAll("table").forEach((table) => {
    if (table.parentElement?.classList.contains("blog-table-scroll")) return;
    const scroller = document.createElement("div");
    scroller.className = "blog-table-scroll";
    table.replaceWith(scroller);
    scroller.appendChild(table);
    changed = true;
  });
  return { html: changed ? container.innerHTML : content, changed, omittedImages: 0 };
}