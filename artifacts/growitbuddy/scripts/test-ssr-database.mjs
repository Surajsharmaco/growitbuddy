// Exercise the committed server bundle with a fake Neon HTTP endpoint and a
// sleeping/unavailable API. No credentials or network calls to real services.
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

process.env.NEON_DATABASE_URL =
  "postgresql://test_user:fixture_only@ep-fixture.us-east-1.aws.neon.tech/test_db";
process.env.VITE_API_URL = "https://content-api.example.test/api";

const publicSlug = "how-to-build-a-personal-brand-online";
const makePost = (slug, extra = {}) => ({
  id: slug, slug, title: `Title ${slug}`, status: "published",
  excerpt: "A live article.", content: "<p>Authoritative article body.</p>",
  ...extra,
});
const makePage = (slug, extra = {}) => ({
  ...makePost(slug), visibility: "public", ...extra,
});

let rows, databaseAvailable, apiAvailable, incompleteApi, calls;
beforeEach(() => {
  databaseAvailable = true;
  apiAvailable = false;
  incompleteApi = false;
  calls = { database: 0, api: 0 };
  rows = {
    "seo-global": { siteIndexable: true },
    "seo:about": { index: true, sitemap: true },
    blog: { posts: [
      makePost(publicSlug),
      makePost("draft-blog-marker", { status: "draft" }),
      makePost("trashed-blog-marker", { trashed: true }),
      makePost("noindex-blog-marker", { seo: { noIndex: true } }),
    ] },
    "cms-pages": { posts: [
      makePage("public-page-marker"),
      makePage("private-page-marker", { visibility: "private" }),
      makePage("draft-page-marker", { status: "draft" }),
      makePage("trashed-page-marker", { trashed: true }),
    ] },
  };
});

globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === "string" ? input : input.url);
  if (url.hostname.endsWith(".neon.tech")) {
    calls.database++;
    if (!databaseAvailable) throw new Error("Fixture database unavailable");
    const request = JSON.parse(options.body);
    assert.match(request.query, /SELECT section, data FROM site_content WHERE section = ANY\(\$1\)/);
    const keys = request.params[0].slice(1, -1).split(",").map((key) => key.replace(/^"|"$/g, ""));
    return Response.json({
      fields: [{ name: "section", dataTypeID: 25 }, { name: "data", dataTypeID: 3802 }],
      rows: keys.filter((key) => Object.hasOwn(rows, key))
        .map((key) => [key, JSON.stringify(rows[key])]),
      rowCount: keys.length, command: "SELECT",
    });
  }
  if (url.hostname === "content-api.example.test") {
    calls.api++;
    if (!apiAvailable) throw new Error("Fixture Render service is sleeping");
    const keys = url.searchParams.get("sections").split(",");
    const data = Object.fromEntries(keys.map((key) => [key, rows[key] ?? null]));
    if (incompleteApi) delete data["seo-global"];
    return Response.json({ data });
  }
  if (url.hostname === "blog.growitbuddy.com") return Response.json([]);
  throw new Error("Unexpected network destination in offline test");
};

const { default: handler } = await import("../api/render.js");
async function request(path, render = handler) {
  const response = { statusCode: 200, headers: {}, body: "",
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(body) { this.body = body; },
  };
  await render({ url: `/api/render?path=${encodeURIComponent(path)}`,
    headers: { host: "growitbuddy.com" } }, response);
  return response;
}

test("blog HTML reads live database while Render is unavailable", async () => {
  const r = await request(`/blog/${publicSlug}`);
  assert.equal(r.statusCode, 200);
  assert.match(r.body, new RegExp(`rel="canonical" href="https://growitbuddy.com/blog/${publicSlug}"`));
  assert.match(r.body, /name="robots" content="index,follow"/);
  assert.match(r.body, /Authoritative article body/);
  assert.equal(calls.database, 1);
  assert.equal(calls.api, 0);
  assert.doesNotMatch(r.body, /fixture_only|draft-blog-marker|trashed-blog-marker/);
});

test("registry page uses the database without contacting Render", async () => {
  const r = await request("/about");
  assert.equal(r.statusCode, 200);
  assert.match(r.body, /rel="canonical" href="https:\/\/growitbuddy.com\/about"/);
  assert.equal(calls.api, 0);
  assert.equal(calls.database, 1);
});

test("published CMS page renders, private/draft/trashed pages remain 404", async () => {
  assert.equal((await request("/public-page-marker")).statusCode, 200);
  for (const slug of ["private-page-marker", "draft-page-marker", "trashed-page-marker"]) {
    const r = await request(`/${slug}`);
    assert.equal(r.statusCode, 404);
    assert.match(r.headers["x-robots-tag"], /noindex/);
    assert.doesNotMatch(r.body, new RegExp(`Title ${slug}`));
  }
  assert.equal(calls.api, 0);
});

test("draft and trashed blog URLs stay 404", async () => {
  for (const slug of ["draft-blog-marker", "trashed-blog-marker"]) {
    assert.equal((await request(`/blog/${slug}`)).statusCode, 404);
  }
  assert.equal(calls.api, 0);
});

test("main sitemap reads per-page flags and excludes private CMS pages", async () => {
  rows["seo:about"] = { index: false, sitemap: false };
  const r = await request("/sitemap.xml");
  assert.equal(r.statusCode, 200);
  assert.match(r.body, /<loc>https:\/\/growitbuddy.com\/public-page-marker<\/loc>/);
  assert.doesNotMatch(r.body, /private-page-marker|draft-page-marker|trashed-page-marker/);
  assert.doesNotMatch(r.body, /<loc>https:\/\/growitbuddy.com\/about<\/loc>/);
  assert.equal(r.headers["cache-control"], "no-store");
  assert.equal(calls.database, 1);
  assert.equal(calls.api, 0);
});

test("blog sitemap uses one database read and honors every visibility flag", async () => {
  const r = await request("/sitemap-blog.xml");
  assert.equal(r.statusCode, 200);
  assert.match(r.body, new RegExp(`/blog/${publicSlug}</loc>`));
  assert.doesNotMatch(r.body, /draft-blog-marker|trashed-blog-marker|noindex-blog-marker/);
  assert.equal(r.headers["cache-control"], "no-store");
  assert.equal(calls.database, 1);
  assert.equal(calls.api, 0);
});

test("site-wide noindex disables both sitemaps and blog indexing", async () => {
  rows["seo-global"] = { siteIndexable: false };
  for (const path of ["/sitemap.xml", "/sitemap-blog.xml"]) {
    const r = await request(path);
    assert.equal(r.statusCode, 200);
    assert.doesNotMatch(r.body, /<loc>/);
  }
  assert.match((await request(`/blog/${publicSlug}`)).headers["x-robots-tag"], /noindex/);
  assert.equal(calls.api, 0);
});

test("missing/deleted blog row stays empty, without API fallback or demo data", async () => {
  delete rows.blog;
  assert.equal((await request(`/blog/${publicSlug}`)).statusCode, 404);
  assert.doesNotMatch((await request("/sitemap-blog.xml")).body, /<loc>/);
  assert.equal(calls.api, 0);
});

test("live API is a secondary source when the database fails", async () => {
  databaseAvailable = false;
  apiAvailable = true;
  assert.equal((await request(`/blog/${publicSlug}`)).statusCode, 200);
  assert.equal(calls.api, 1);
});

test("total source failure returns uncacheable 503 for pages and both sitemaps", async () => {
  databaseAvailable = false;
  for (const path of [`/blog/${publicSlug}`, "/about", "/sitemap.xml", "/sitemap-blog.xml"]) {
    const r = await request(path);
    assert.equal(r.statusCode, 503);
    assert.equal(r.headers["cache-control"], "no-store");
    assert.match(r.headers["x-robots-tag"], /noindex/);
    assert.doesNotMatch(r.body, /<loc>|Authoritative article body/);
  }
});

test("incomplete fallback API data fails closed rather than assuming indexable", async () => {
  databaseAvailable = false;
  apiAvailable = true;
  incompleteApi = true;
  assert.equal((await request("/sitemap.xml")).statusCode, 503);
  assert.equal((await request(`/blog/${publicSlug}`)).statusCode, 503);
});

test("API-only deployment still honors per-page sitemap exclusions", async () => {
  process.env.NEON_DATABASE_URL = "";
  process.env.DATABASE_URL = "";
  const { default: apiHandler } = await import("../api/render.js?api-only-fixture");
  apiAvailable = true;
  rows["seo:about"] = { index: false, sitemap: false };
  const r = await request("/sitemap.xml", apiHandler);
  assert.equal(r.statusCode, 200);
  assert.doesNotMatch(r.body, /<loc>https:\/\/growitbuddy.com\/about<\/loc>/);
  assert.equal(calls.database, 0);
  assert.equal(calls.api, 1);
});