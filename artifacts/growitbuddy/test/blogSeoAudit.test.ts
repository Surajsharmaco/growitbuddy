import test from "node:test";
import assert from "node:assert/strict";
import { resolveBlogSeo, resolveCmsPageSeo } from "@workspace/seo";
import { analyzeBlogSeo } from "../src/lib/blogSeoAudit";
import type { BlogPost } from "../src/data/blogPosts";

const post = (slug: string): BlogPost => ({
  slug, title: "Wp style page", excerpt: "Excerpt", date: "2025-01-01", tag: "x", readTime: "1 min",
  content: "<h2>Hello</h2><p>Body text here.</p>", status: "published", visibility: "public",
} as BlogPost);

const slugLevel = (p: BlogPost, pageMode: boolean) =>
  analyzeBlogSeo(p, pageMode ? resolveCmsPageSeo(p) : resolveBlogSeo(p), [], false, pageMode)
    .checks.find((c) => c.key === "slug")?.level;

test("wp- slug: valid CMS page, invalid blog post", () => {
  const p = post("wp-guide");
  assert.equal(slugLevel(p, true), "pass");
  assert.equal(slugLevel(p, false), "error");
});

test("reserved slug fails page audit", () => {
  assert.equal(slugLevel(post("blog"), true), "error");
});

test("image alt text survives Blog/Pages crawler output", () => {
  const body = '<p>Article body text.</p><img src="/api/media/file/7" alt="A team planning a product launch around a table">';
  const blogPost = { ...post("image-alt-test"), content: body };
  const page = { ...blogPost, slug: "image-alt-page" };

  for (const resolved of [resolveBlogSeo(blogPost), resolveCmsPageSeo(page)]) {
    assert.match(resolved.crawlerBodyHtml, /<img\b[^>]*alt="A team planning a product launch around a table"/);
  }
});
