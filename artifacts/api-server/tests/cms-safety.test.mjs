import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

// Development proxy only. Never target or mutate the production API.
const base = "http://localhost:80/api/admin";
function token(role = "super", permissions = ["all"]) {
  if (!process.env.ADMIN_PASSWORD) throw new Error("Dev auth is not available. Do not substitute live credentials.");
  const payload = `${Date.now() + 3600000}.${randomUUID()}.${role}.${Buffer.from(JSON.stringify(permissions)).toString("base64url")}`;
  return `${payload}.${createHmac("sha256", process.env.ADMIN_PASSWORD).update(payload).digest("hex")}`;
}
const admin = token();
async function call(path, method = "GET", body, credential = admin) {
  const response = await fetch(base + path, {
    method, redirect: "error", headers: { "Content-Type": "application/json", Authorization: `Bearer ${credential}` },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}
async function ok(path, method, body) {
  const result = await call(path, method, body);
  assert.equal(result.status, 200, result.data.error ?? path);
  return result.data;
}
test("CMS: stale saves, isolated edits, revisions, safe restore and backup-only permissions", async () => {
  const id = randomUUID().slice(0, 8), a = `safety-test-a-${id}`, b = `safety-test-b-${id}`, c = `safety-test-c-${id}`;
  const fixtureSlugs = new Set([a, b, c]);
  let keyId;
  let variantId;
  const page = `safety-test-page-${id}`, variantSlug = `safety-test-variant-${id}`, variantSection = `blog__v__${variantSlug}`;
  const post = (slug, title) => ({ slug, title, content: "<p>Recovery test text, not a published article.</p>", status: "draft" });
  try {
    const start = await ok("/cms/blog");
    assert.equal((await call("/content/blog", "PUT", { data: { posts: [] } })).status, 409);
    assert.equal((await call("/cms/backups", "GET", undefined, token("editor", ["all"]))).status, 403);
    assert.equal((await call("/cms/cms-pages", "GET", undefined, token("editor", ["blog"]))).status, 403);
    assert.equal((await call("/cms/blog", "GET", undefined, "invalid")).status, 401);
    const pageState = await ok("/cms/cms-pages", "PATCH", { operations: [{ type: "upsert", previousSlug: page, expectedVersion: null, post: { ...post(page, "Safety private page"), visibility: "private" } }] });
    assert.equal(pageState.data.tocInitialVisible, 5);
    const variant = await ok("/variants", "POST", { sourceKey: "blog", slug: variantSlug, label: "Safety test variant", isLive: false, copyFromBase: false });
    variantId = variant.id;
    await ok(`/cms/${variantSection}`, "PATCH", { operations: [{ type: "upsert", previousSlug: a, expectedVersion: null, post: post(a, "Variant-only test") }] });
    assert.equal((await call(`/cms/${variantSection}`, "GET", undefined, token("editor", ["all"]))).status, 403);
    assert.equal((await call(`/content/${variantSection}`, "PUT", { data: { posts: [] } })).status, 409);
    let first = await ok("/cms/blog", "PATCH", { operations: [
      { type: "upsert", previousSlug: a, expectedVersion: null, post: post(a, "Safety test A") },
      { type: "upsert", previousSlug: b, expectedVersion: null, post: post(b, "Safety test B") },
    ] });
    const get = (data, slug) => data.data.posts.find((p) => p.slug === slug);
    const editedA = { ...get(first, a), title: "Safety test A updated" };
    let second = await ok("/cms/blog", "PATCH", { operations: [{ type: "upsert", previousSlug: a, expectedVersion: first.versions[a], post: editedA }] });
    assert.equal((await call("/cms/blog", "PATCH", { operations: [{ type: "upsert", previousSlug: a, expectedVersion: first.versions[a], post: { ...editedA, title: "Must not overwrite" } }] })).status, 409);
    let third = await ok("/cms/blog", "PATCH", { operations: [{ type: "upsert", previousSlug: b, expectedVersion: first.versions[b], post: { ...get(first, b), title: "Safety test B updated" } }] });
    assert.equal(get(third, a).title, editedA.title);
    assert.equal(third.data.posts.length, start.data.posts.length + 2);
    let renamed = await ok("/cms/blog", "PATCH", { operations: [{ type: "upsert", previousSlug: a, expectedVersion: second.versions[a], post: { ...get(second, a), slug: c } }] });
    assert.equal(get(renamed, c)._cmsId, get(second, a)._cmsId);
    assert.ok((await ok(`/cms/blog/revisions?slug=${c}`)).revisions.length >= 2);
    assert.equal((await call("/cms/blog", "PATCH", { operations: [{ type: "delete", previousSlug: b, expectedVersion: renamed.versions[b] }] })).status, 400);
    const backup = await ok("/cms/backups", "POST", {});
    const document = await ok(`/cms/backups/${backup.id}/download`);
    let trashed = await ok("/cms/blog", "PATCH", { operations: [{ type: "patch", previousSlug: b, expectedVersion: renamed.versions[b], patch: { trashed: true } }] });
    assert.equal(get(trashed, b).content, get(renamed, b).content);
    await ok("/cms/blog", "PATCH", { operations: [{ type: "delete", previousSlug: b, expectedVersion: trashed.versions[b] }] });
    const preview = await ok("/cms/restore/preview", "POST", { document });
    assert.equal(preview.plan.blog.missing, 1);
    const current = await ok("/cms/blog");
    await ok("/cms/blog", "PATCH", { operations: [{ type: "upsert", previousSlug: c, expectedVersion: current.versions[c], post: { ...get(current, c), title: "Current version must survive restore" } }] });
    assert.equal((await call("/cms/restore", "POST", { document, expectedState: preview.expectedState, confirm: "RESTORE MISSING POSTS" })).status, 409);
    const fresh = await ok("/cms/restore/preview", "POST", { document });
    assert.equal((await call("/cms/restore", "POST", { document, expectedState: fresh.expectedState, confirm: "wrong" })).status, 400);
    const restored = await ok("/cms/restore", "POST", { document, expectedState: fresh.expectedState, confirm: "RESTORE MISSING POSTS" });
    assert.ok(restored.beforeBackupId);
    const after = await ok("/cms/blog");
    assert.equal(get(after, b).status, "draft");
    assert.equal(get(after, c).title, "Current version must survive restore");
    const damaged = structuredClone(document);
    damaged.sections.blog.posts.find((p) => p.slug === b).title = "Corrupted";
    assert.equal((await call("/cms/restore/preview", "POST", { document: damaged })).status, 422);
    const key = await ok("/cms/offsite-keys", "POST", {});
    keyId = key.id;
    assert.equal((await call("/cms/offsite-export", "GET", undefined, key.key)).status, 200);
    assert.equal((await call("/cms/blog", "PATCH", { operations: [] }, key.key)).status, 401);
    assert.equal((await call("/cms/backups", "GET", undefined, key.key)).status, 401);
    await ok(`/cms/offsite-keys/${key.id}`, "DELETE");
    assert.equal((await call("/cms/offsite-export", "GET", undefined, key.key)).status, 401);
    // The browser tester uses this ignored, development-only session state.
    // Never print the file, token or credential values.
    if (process.env.REPLIT_DEV_DOMAIN) {
      await mkdir(".local/cms-safety-tests", { recursive: true });
      await writeFile(".local/cms-safety-tests/browser-auth.json", JSON.stringify({
        origin: `https://${process.env.REPLIT_DEV_DOMAIN}`, token: admin,
      }), { mode: 0o600 });
    }
  } finally {
    if (keyId) await call(`/cms/offsite-keys/${keyId}`, "DELETE");
    if (variantId) await call(`/variants/${variantId}`, "DELETE");
    let pageState = await ok("/cms/cms-pages");
    if (pageState.versions[page]) {
      pageState = await ok("/cms/cms-pages", "PATCH", { operations: [{ type: "patch", previousSlug: page, expectedVersion: pageState.versions[page], patch: { trashed: true } }] });
      await ok("/cms/cms-pages", "PATCH", { operations: [{ type: "delete", previousSlug: page, expectedVersion: pageState.versions[page] }] });
    }
    let state = await ok("/cms/blog");
    const created = state.data.posts.filter((p) => fixtureSlugs.has(p.slug));
    if (created.length) {
      state = await ok("/cms/blog", "PATCH", { operations: created.map((p) => ({
        type: "upsert", previousSlug: p.slug, expectedVersion: state.versions[p.slug], post: { ...p, trashed: true },
      })) });
      await ok("/cms/blog", "PATCH", { operations: created.map((p) => ({ type: "delete", previousSlug: p.slug, expectedVersion: state.versions[p.slug] })) });
    }
  }
});
