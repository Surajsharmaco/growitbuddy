import test from "node:test";
import assert from "node:assert/strict";

test("generated SSR handler serves CMS pages safely and preserves legacy blog bootstrap", async () => {
  const priorFetch = globalThis.fetch;
  const priorDatabaseUrl = process.env.DATABASE_URL;
  const priorNeonDatabaseUrl = process.env.NEON_DATABASE_URL;
  const priorApiUrl = process.env.VITE_API_URL;
  delete process.env.DATABASE_URL;
  delete process.env.NEON_DATABASE_URL;
  process.env.VITE_API_URL = "http://ssr-regression.invalid/api";

  const cmsPages = {
    posts: [
      {
        slug: "ssr-regression-published",
        title: "SSR regression published page",
        status: "published",
        visibility: "public",
        content: "<p>SSR regression published body content.</p>",
      },
      {
        slug: "ssr-regression-private",
        title: "SSR regression private secret",
        status: "published",
        visibility: "private",
        content: "<p>Private content must not leak.</p>",
      },
      {
        slug: "ssr-regression-draft",
        title: "SSR regression draft secret",
        status: "draft",
        visibility: "public",
        content: "<p>Draft content must not leak.</p>",
      },
      {
        slug: "ssr-regression-trashed",
        title: "SSR regression trashed secret",
        status: "published",
        visibility: "public",
        trashed: true,
        content: "<p>Trashed content must not leak.</p>",
      },
      {
        slug: "ssr-regression-noindex",
        title: "SSR regression noindex page",
        status: "published",
        visibility: "public",
        seo: { noIndex: true },
        content: "<p>SSR regression noindex body content.</p>",
      },
    ],
    tocInitialVisible: 4,
  };
  const legacyBlog = {
    posts: [
      {
        slug: "about",
        title: "Legacy statusless blog title",
        content: "<p>Legacy statusless blog body content.</p>",
      },
    ],
    tocInitialVisible: 6,
  };

  globalThis.fetch = async (input) => {
    const url = new URL(typeof input === "string" ? input : input.url);
    assert.equal(url.origin, "http://ssr-regression.invalid", "SSR must use only the in-process API mock");
    const sections = (url.searchParams.get("sections") ?? "").split(",").filter(Boolean);
    const data = Object.fromEntries(sections.map((section) => [
      section,
      section === "cms-pages" ? cmsPages
        : section === "blog" ? legacyBlog
          : section === "seo-global" ? { siteIndexable: true }
            : null,
    ]));
    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    // Import after clearing DB credentials: the bundled handler captures DB_URL
    // at module initialization, and this regression must exercise only mock fetch.
    const handlerModule = process.env.GB_SSR_HANDLER_MODULE ?? "../api/render.js";
    const { default: handler } = await import(handlerModule);
    const request = async (url) => {
      const response = {
        statusCode: 200,
        headers: {},
        body: "",
        setHeader(name, value) { this.headers[name] = value; },
        end(value = "") { this.body += value; },
      };
      await handler({ url, headers: { host: "growitbuddy.com" } }, response);
      return response;
    };

    const published = await request("/ssr-regression-published");
    assert.equal(published.statusCode, 200);
    assert.match(published.body, /SSR regression published page/);
    assert.match(published.body, /SSR regression published body content/);

    for (const slug of ["private", "draft", "trashed"]) {
      const hidden = await request(`/ssr-regression-${slug}`);
      assert.equal(hidden.statusCode, 404, `${slug} page should be a noindex 404`);
      assert.doesNotMatch(hidden.body, /SSR regression (?:private|draft|trashed) secret/);
      assert.doesNotMatch(hidden.body, /content must not leak/i);
    }

    const noindex = await request("/ssr-regression-noindex");
    assert.equal(noindex.statusCode, 200);
    assert.equal(noindex.headers["x-robots-tag"], "noindex, nofollow");
    assert.match(noindex.body, /SSR regression noindex body content/);

    const blog = await request("/blog");
    assert.equal(blog.statusCode, 200);
    const bootstrapMatch = blog.body.match(
      /window\.__GB_PUBLIC_CONTENT__=(.*?);window\.__GB_CONTENT_SECTIONS__/,
    );
    assert.ok(bootstrapMatch, "SSR blog bootstrap should be present");
    const bootstrap = JSON.parse(bootstrapMatch[1]);
    assert.equal(bootstrap.blog.posts[0].slug, "about");
    assert.equal(bootstrap.blog.posts[0].status, undefined);
    assert.match(blog.body, /Legacy statusless blog body content/);
  } finally {
    globalThis.fetch = priorFetch;
    if (priorDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = priorDatabaseUrl;
    if (priorNeonDatabaseUrl === undefined) delete process.env.NEON_DATABASE_URL;
    else process.env.NEON_DATABASE_URL = priorNeonDatabaseUrl;
    if (priorApiUrl === undefined) delete process.env.VITE_API_URL;
    else process.env.VITE_API_URL = priorApiUrl;
  }
});