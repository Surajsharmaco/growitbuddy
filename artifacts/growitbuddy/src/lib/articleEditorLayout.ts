import type { BlogPost } from "@/data/blogPosts";

/** Opt-in only: never change the layout of previously published blogs/pages. */
export function usesEditorLayout(post: BlogPost, pageMode: boolean): boolean {
  return post.contentLayout === "editor-v1" ||
    isSpacingRepairPage(post, pageMode);
}

export function isSpacingRepairPage(post: BlogPost, pageMode: boolean): boolean {
  return pageMode && post.slug === "meme-marketing-agency-india";
}

/**
 * Repair block-containing heading wrappers in the affected page's rendered/editor
 * view, not the database. Keep actual headings, text, links, media and anchor IDs.
 */
export function repairHeadingWrappers(html: string, trimLeadingEmpty = false): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.body.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach(heading => {
    if (!heading.querySelector("p,div,ul,ol,table,blockquote,pre,h1,h2,h3,h4,h5,h6")) return;
    const wrapper = doc.createElement("div");
    for (const attr of Array.from(heading.attributes)) wrapper.setAttribute(attr.name, attr.value);
    while (heading.firstChild) wrapper.appendChild(heading.firstChild);
    heading.replaceWith(wrapper);
  });
  // The page title owns H1. Preserve authored body text and anchor attributes.
  doc.body.querySelectorAll("h1").forEach(heading => {
    const h2 = doc.createElement("h2");
    for (const attr of Array.from(heading.attributes)) h2.setAttribute(attr.name, attr.value);
    while (heading.firstChild) h2.appendChild(heading.firstChild);
    heading.replaceWith(h2);
  });
  if (trimLeadingEmpty) {
    // Only the explicitly selected existing page: retain deliberate blank lines
    // in new articles, and never remove text, media, links or anchor targets.
    const media = "img,iframe,video,audio,table,svg,hr,a, [id], [name]";
    for (const container of [doc.body, ...Array.from(doc.body.querySelectorAll("div"))]) {
      let first = container.firstElementChild;
      while (first && !first.textContent?.replace(/\u00a0/g, " ").trim() &&
        !first.matches(media) && !first.querySelector(media)) {
        first.remove();
        first = container.firstElementChild;
      }
    }
  }
  return doc.body.innerHTML;
}

/**
 * The same defaults in the editable surface and published body/overview.
 * Intentional <br> and empty paragraphs stay intact; HTML is not rewritten here.
 * Heading margins are important to override legacy first/last-child resets.
 */
export const ARTICLE_EDITOR_LAYOUT_CSS = `
.article-heading.editor-spacing { font-size: clamp(28px, 5vw, 52px) !important; }
:is(.article-body,.blog-editor).editor-spacing { font-family: Inter, sans-serif; line-height: 1.7; }
:is(.article-body,.blog-editor).editor-spacing h1,
:is(.article-body,.blog-editor).editor-spacing h2 { font-weight: 800; font-size: 26px !important; letter-spacing: -0.03em; margin: 0 0 18px !important; line-height: 1.25; }
:is(.article-body,.blog-editor).editor-spacing h3 { font-weight: 700; font-size: 20px !important; letter-spacing: -0.02em; margin: 0 0 12px !important; line-height: 1.35; }
:is(.article-body,.blog-editor).editor-spacing h4 { font-weight: 700; font-size: 17px !important; margin: 0 0 10px !important; }
:is(.article-body,.blog-editor).editor-spacing :is(h5,h6) { font-weight: 700; font-size: 15px !important; margin: 0 0 10px !important; }
:is(.article-body,.blog-editor).editor-spacing :is(h1,h2,h3,h4,h5,h6) :is(span,font,strong,b,em,i,a) { font-size: inherit !important; line-height: inherit !important; }
:is(.article-body,.blog-editor).editor-spacing p:not(blockquote p,.wp-block-quote p) { margin: 0 0 var(--article-paragraph-gap) !important; }
:is(.article-body,.blog-editor).editor-spacing p:empty,
:is(.article-body,.blog-editor).editor-spacing p:has(br:only-child) { display: block; }
:is(.article-body,.blog-editor).editor-spacing blockquote { margin: 28px 0; padding: 18px 22px; }
:is(.article-body,.blog-editor).editor-spacing blockquote p { font-size: 17px; line-height: 1.7; margin: 0; }
:is(.article-body,.blog-editor).editor-spacing ul,
:is(.article-body,.blog-editor).editor-spacing ol { margin: 20px 0; padding-left: 22px; }
:is(.article-body,.blog-editor).editor-spacing li { margin-bottom: 10px; padding-left: 4px; line-height: 1.8; }
:is(.article-body,.blog-editor).editor-spacing li > p { margin: 0 !important; }
:is(.article-body,.blog-editor).editor-spacing li > ul,
:is(.article-body,.blog-editor).editor-spacing li > ol { margin: 8px 0 0; }
:is(.article-body,.blog-editor).editor-spacing .blog-table-scroll { margin: 20px 0; }
:is(.article-body,.blog-editor).editor-spacing figure { margin: 20px 0; }
:is(.article-body,.blog-editor).editor-spacing figure img { max-width: 100%; height: auto; margin: 0; }
:is(.article-body,.blog-editor).editor-spacing figcaption { font-size: 13px; line-height: 1.7; text-align: center; }
:is(.article-body,.blog-editor).editor-spacing hr { margin: 36px 0; }
@media (max-width: 640px) {
  :is(.article-body,.blog-editor).editor-spacing h1,
  :is(.article-body,.blog-editor).editor-spacing h2 { font-size: 22px !important; }
  :is(.article-body,.blog-editor).editor-spacing h3 { font-size: 18px !important; }
}
`;
