import test from "node:test";
import assert from "node:assert/strict";
import {
  API_URL,
  isCmsPageInSitemap,
  isCmsPagesVariantSection,
  isPublicCmsPage,
  isReservedCmsPageSlug,
  resolveCmsPageSeo,
  validateCmsPageSlug,
  type CmsPageSeoPost,
} from "@workspace/seo";
import {
  DEFAULT_PUBLIC_CONTENT_SECTIONS,
  isSupportedVariantSourceKey,
  projectPublicCmsPages,
  projectPublicContentSection,
  validateCmsPagesData,
} from "../src/lib/cmsPages";
import { sanitizePublicContent } from "../../growitbuddy/ssr/publicContent";

function page(overrides: Partial<CmsPageSeoPost> = {}): CmsPageSeoPost {
  return {
    slug: "creator-guide",
    title: "Creator guide",
    status: "published",
    visibility: "public",
    content: "<p>Hello <script>alert(1)</script></p>",
    ...overrides,
  };
}

test("CMS slugs are one lowercase kebab segment and static routes are reserved", () => {
  assert.equal(validateCmsPageSlug("creator-guide").valid, true);
  for (const slug of ["", "-bad", "bad-", "two--words", "Upper", "two/segments", "a".repeat(81)]) {
    assert.equal(validateCmsPageSlug(slug).valid, false, slug);
  }
  for (const slug of ["about", "acts-club", "admin", "api", "portfolio-private", "insights"]) {
    assert.equal(isReservedCmsPageSlug(slug), true, slug);
    assert.equal(validateCmsPageSlug(slug).valid, false, slug);
  }
});

test("CMS lifecycle fails closed for missing status, private, and trashed pages", () => {
  assert.equal(isPublicCmsPage(page()), true);
  assert.equal(isPublicCmsPage(page({ status: undefined })), false);
  assert.equal(isPublicCmsPage(page({ status: "draft" })), false);
  assert.equal(isPublicCmsPage(page({ visibility: "private" })), false);
  assert.equal(isPublicCmsPage(page({ trashed: true })), false);
});

test("page SEO resolves root canonical and WebPage schema; selected schema and noindex are honored", () => {
  const resolved = resolveCmsPageSeo(page({
    featuredImage: "/api/media/file/12",
    isoDate: "2025-01-02",
  }));
  assert.equal(resolved.url, "https://growitbuddy.com/creator-guide");
  assert.equal(resolved.canonical, resolved.url);
  assert.equal(resolved.og.url, resolved.canonical);
  assert.equal(resolved.og.type, "website");
  assert.equal(resolved.og.image, `${API_URL}/api/media/file/12`);
  assert.equal(resolved.jsonLd["@graph"][1]["@type"], "WebPage");
  assert.equal(resolved.jsonLd["@graph"][1].datePublished, "2025-01-02T00:00:00.000Z");
  assert.equal(resolved.sitemap.lastmod, "2025-01-02");
  assert.equal(resolved.sitemap.included, true);

  const article = resolveCmsPageSeo(page({ seo: { schemaType: "Article", noIndex: true } }));
  assert.equal(article.jsonLd["@graph"][1]["@type"], "Article");
  assert.equal(article.robots, "noindex,nofollow");
  assert.equal(article.sitemap.included, false);
  const faq = resolveCmsPageSeo(page({
    seo: { schemaType: "FAQ", faqItems: [{ question: "Q?", answer: "A." }] },
  }));
  assert.equal(faq.jsonLd["@graph"][1]["@type"], "FAQPage");
  assert.equal(isCmsPageInSitemap(page({ seo: { canonicalUrl: "https://example.com/other" } })), false);
  assert.equal(resolveCmsPageSeo(page(), { globalIndexable: false }).robots, "noindex,nofollow");
});

test("crawler markup escapes content and inline JSON-LD cannot terminate its script", () => {
  const resolved = resolveCmsPageSeo(page({
    title: `Guide </h1><script>alert("x")</script>`,
    content: `<p>Safe</p><img src="javascript:alert(1)" onerror="alert(1)" />`,
    seo: { schemaType: "Article", seoTitle: `</script><img src=x>` },
  }));
  assert.match(resolved.crawlerBodyHtml, /&lt;script&gt;/);
  assert.doesNotMatch(resolved.crawlerBodyHtml, /javascript:/i);
  assert.doesNotMatch(resolved.metaTagsHtml, /<\/script><img/i);
  assert.match(resolved.metaTagsHtml, /\\u003c\/script/);
});

test("admin collection validation checks full shape, normalized duplicates, lifecycle slugs, and variants", () => {
  const collection = { posts: [page()], tocInitialVisible: 4 };
  assert.equal(validateCmsPagesData(collection), null);
  assert.equal(validateCmsPagesData({ posts: [page({ status: undefined })], tocInitialVisible: 1 }), null);
  assert.match(validateCmsPagesData({ posts: [page(), page({ slug: "creator-guide" })], tocInitialVisible: 1 }) ?? "", /duplicate/);
  assert.match(validateCmsPagesData({
    posts: [page({ slug: "same-slug", status: "draft" }), page({ slug: "same-slug", trashed: true })],
    tocInitialVisible: 1,
  }) ?? "", /duplicate/);
  assert.match(validateCmsPagesData({ posts: [page({ slug: "about" })], tocInitialVisible: 1 }) ?? "", /reserved/);
  assert.match(validateCmsPagesData({ posts: [page({ slug: "another-page", trashed: true })], tocInitialVisible: 1 }, ["another-page"]) ?? "", /variant/);
  assert.match(validateCmsPagesData({ posts: [page({ visibility: "hidden" as "private" })], tocInitialVisible: 1 }) ?? "", /visibility/);
  assert.match(validateCmsPagesData({ posts: [], tocInitialVisible: -1 }) ?? "", /tocInitialVisible/);
});

test("public CMS projection includes published public pages only", () => {
  const visible = page();
  const projected = projectPublicCmsPages({
    posts: [
      visible,
      page({ slug: "draft-page", status: "draft" }),
      page({ slug: "legacy-page", status: undefined }),
      page({ slug: "private-page", visibility: "private" }),
      page({ slug: "trashed-page", trashed: true }),
    ],
    tocInitialVisible: 3,
  });
  assert.deepEqual(projected?.posts.map((post) => post.slug), ["creator-guide"]);
  assert.equal(projectPublicCmsPages({ posts: [], tocInitialVisible: 1.5 })?.tocInitialVisible, 0);
});

test("CMS collection aliases are sanitized and unsupported variant sources stay private", () => {
  const copiedCollection = {
    posts: [
      page(),
      page({ slug: "copied-draft", status: "draft" }),
      page({ slug: "copied-private", visibility: "private" }),
    ],
    tocInitialVisible: 2,
  };
  assert.equal(isCmsPagesVariantSection("cms-pages__v__old-alias"), true);
  assert.deepEqual(
    (projectPublicContentSection("cms-pages__v__old-alias", copiedCollection) as { posts: CmsPageSeoPost[] }).posts.map((entry) => entry.slug),
    ["creator-guide"],
  );
  assert.deepEqual(
    projectPublicContentSection("legacy-copied-section", copiedCollection),
    copiedCollection,
  );
  assert.equal(isSupportedVariantSourceKey("about"), true);
  assert.equal(isSupportedVariantSourceKey("cms-pages"), false);
  assert.equal(isSupportedVariantSourceKey("cms-pages__v__old-alias"), false);
  // The omitted-sections bulk contract defaults to the canonical, sanitized collection,
  // never to a copied variant alias.
  assert.deepEqual(DEFAULT_PUBLIC_CONTENT_SECTIONS, ["cms-pages"]);
});

test("CMS alias matching preserves legacy blog and blog variant collections in API and SSR projections", () => {
  const legacyBlog = {
    posts: [page({ slug: "about", status: undefined, visibility: undefined })],
    tocInitialVisible: 6,
  };
  assert.equal(isCmsPagesVariantSection("cms-pages__v__old-alias"), true);
  assert.equal(isCmsPagesVariantSection("blog"), false);
  assert.equal(isCmsPagesVariantSection("blog__v__legacy"), false);
  for (const section of ["blog", "blog__v__legacy"]) {
    const projected = projectPublicContentSection(section, legacyBlog) as typeof legacyBlog;
    assert.equal(projected.posts.length, 1);
    assert.equal(projected.posts[0].slug, "about");
    assert.equal(projected.posts[0].status, undefined);
  }
  const sanitized = sanitizePublicContent({
    blog: legacyBlog,
    "blog__v__legacy": legacyBlog,
    "cms-pages__v__old-alias": legacyBlog,
  });
  assert.deepEqual((sanitized.blog as typeof legacyBlog).posts.map((post) => post.slug), ["about"]);
  assert.deepEqual((sanitized["blog__v__legacy"] as typeof legacyBlog).posts.map((post) => post.slug), ["about"]);
  assert.equal(Object.hasOwn(sanitized, "cms-pages__v__old-alias"), false);
});