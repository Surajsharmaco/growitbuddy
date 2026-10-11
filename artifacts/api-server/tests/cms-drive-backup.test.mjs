import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import vm from "node:vm";

function environment({ count = 50, failAsset = null } = {}) {
  const props = new Map([
    ["GIB_BACKUP_KEY", "fake-test-key"], ["GIB_DRIVE_FOLDER_ID", "root"], ["GIB_ALERT_EMAIL", "test@example.invalid"],
    ["GIB_JSON_FOLDER_ID", "json"], ["GIB_MEDIA_FOLDER_ID", "media"], ["GIB_TASK_FOLDER_ID", "tasks"],
  ]);
  const files = new Map(), folders = new Map(); let next = 0, alerts = 0;
  const iterator = (items) => { let n = 0; return { hasNext: () => n < items.length, next: () => items[n++] }; };
  const blob = (value, name = "") => ({
    value, name, getBytes: () => Array.isArray(value) ? value : [...Buffer.from(value)],
    getDataAsString: () => Array.isArray(value) ? Buffer.from(value).toString() : value,
    setName(name) { this.name = name; return this; },
  });
  class File {
    constructor(b, folder) { this.id = String(++next); this.blob = b; this.folder = folder; files.set(this.id, this); }
    getId() { return this.id; } getName() { return this.blob.name; } getSize() { return this.blob.getBytes().length; }
    getBlob() { return this.blob; } setContent(text) { this.blob.value = text; } setName(name) { this.blob.name = name; }
  }
  class Folder {
    constructor(id) { this.id = id; folders.set(id, this); }
    createFile(b) { return new File(b, this.id); }
    getFilesByName(name) { return iterator([...files.values()].filter((f) => f.folder === this.id && f.getName() === name)); }
  }
  ["json", "media", "tasks"].forEach((id) => new Folder(id));
  const context = vm.createContext({
    console, Date, JSON, Number, Array,
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props.get(k) ?? null, setProperty: (k, v) => props.set(k, v) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    DriveApp: { getFolderById: (id) => folders.get(id), getFileById: (id) => files.get(id) },
    MailApp: { sendEmail: () => { alerts++; } },
    Utilities: {
      DigestAlgorithm: { SHA_256: "sha256" }, Charset: { UTF_8: "utf8" },
      computeDigest(algorithm, value, charset) {
        if (Array.isArray(value)) assert.equal(charset, undefined, "Byte digest overload must not receive a charset.");
        return [...createHash(algorithm).update(typeof value === "string" ? value : Buffer.from(value)).digest()].map((b) => b > 127 ? b - 256 : b);
      },
      newBlob: (value, _type, name) => blob(value, name), formatDate: () => String(next + 1),
    },
  });
  vm.runInContext(readFileSync(new URL("../../../docs/growitbuddy-drive-backup.gs", import.meta.url), "utf8"), context);
  const sections = { blog: { posts: [{ title: "रक्षित लेख", slug: "test", content: "<p>safe</p>" }] }, "cms-pages": { posts: [] } };
  const mediaManifest = Array.from({ length: count }, (_, i) => ({ id: i + 1, size: 3, backupFilename: `${i + 1}_3_test.png` }));
  const doc = {
    format: "growitbuddy-cms-backup", version: 1, sections, mediaManifest,
    checksum: context.gibSha(context.gibCanonical(sections)), mediaManifestChecksum: context.gibSha(context.gibCanonical(mediaManifest)),
  };
  context.UrlFetchApp = { fetch: (url, options) => {
    if (url.endsWith("offsite-export")) {
      assert.equal(options.followRedirects, false);
      return { getResponseCode: () => 200, getContentText: () => JSON.stringify(doc) };
    }
    assert.equal(options.headers, undefined, "Never attach backup-only credentials to media redirects.");
    const id = Number(url.split("/").pop());
    return { getResponseCode: () => id === failAsset ? 404 : 200, getBlob: () => blob([1, 2, 3]) };
  } };
  return { context, props, files, doc, alerts: () => alerts };
}
test("Drive script verifies checksum and finishes existing media task across new daily JSON", () => {
  const e = environment();
  e.context.gibDailyBackup();
  const first = e.props.get("GIB_LATEST_JSON_ID");
  e.context.gibMediaBackup();
  assert.equal(e.props.get("GIB_MEDIA_PROGRESS"), "20/50");
  e.context.gibDailyBackup();
  assert.notEqual(e.props.get("GIB_LATEST_JSON_ID"), first);
  e.context.gibMediaBackup();
  assert.equal(e.props.get("GIB_MEDIA_PROGRESS"), "40/50");
  e.context.gibMediaBackup();
  assert.equal(e.props.get("GIB_MEDIA_COMPLETED_JSON_ID"), first);
  assert.equal(e.props.get("GIB_MEDIA_FAILURES"), "0");
  assert.equal(e.alerts(), 0);
});
test("Drive script reports incomplete assets honestly and never claims full media success", () => {
  const e = environment({ count: 4, failAsset: 2 });
  e.context.gibDailyBackup(); e.context.gibMediaBackup();
  assert.equal(e.props.get("GIB_MEDIA_PROGRESS"), "3/4");
  assert.equal(e.props.get("GIB_MEDIA_FAILURES"), "1");
  assert.equal(e.props.has("GIB_LAST_MEDIA_SUCCESS"), false);
  assert.equal(e.alerts(), 1);
});
test("Drive script rejects corrupted source JSON before creating a backup file", () => {
  const e = environment();
  e.doc.sections.blog.posts[0].title = "damaged";
  assert.throws(() => e.context.gibDailyBackup(), /checksum/);
  assert.equal(e.props.has("GIB_LATEST_JSON_ID"), false);
});
