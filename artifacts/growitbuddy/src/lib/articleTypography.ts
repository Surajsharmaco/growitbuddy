/**
 * Ordinary paragraphs must match in the editor and all public content formats.
 * Override pasted inline sizing without rewriting the author's saved HTML.
 * Quotes, headings, code, buttons, and inline emphasis retain their own styles.
 */
export const ARTICLE_PARAGRAPH_CSS = `
.article-body, .article-excerpt, .blog-editor {
  --article-paragraph-gap: 16px;
  --article-font-size: 16px;
  --article-line-height: 1.7;
  overflow-wrap: anywhere;
}
.article-body p:not(blockquote p, .wp-block-quote p),
.blog-editor p:not(blockquote p),
.article-excerpt {
  font-family: Inter, sans-serif !important;
  font-size: var(--article-font-size) !important;
  font-weight: 400;
  color: rgba(11,11,11,0.78);
  line-height: var(--article-line-height) !important;
  letter-spacing: normal !important;
  margin: 0 0 var(--article-paragraph-gap) !important;
  padding: 0 !important;
}
.article-body p:not(blockquote p, .wp-block-quote p) :is(span, font, strong, b, em, i, a):not(.gb-blog-button),
.blog-editor p:not(blockquote p) :is(span, font, strong, b, em, i, a):not(.gb-blog-button) {
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  letter-spacing: inherit !important;
}
.article-excerpt {
  margin-top: var(--article-paragraph-gap) !important;
}
@media (max-width: 640px) {
  .article-body, .article-excerpt, .blog-editor {
    --article-paragraph-gap: 12px;
    --article-font-size: 15px;
    --article-line-height: 1.6;
  }
  .article-body li, .blog-editor li {
    font-size: var(--article-font-size) !important;
    line-height: var(--article-line-height) !important;
  }
}
`;
