import { createHash, randomUUID, randomBytes } from "node:crypto";
import { pool, type PoolClient } from "@workspace/db";
import { isReservedCmsPageSlug } from "@workspace/seo";
import { validateCmsPagesData } from "./cmsPages";
import { logger } from "./logger";

export type CmsPost = Record<string, unknown> & { slug: string; title: string };
type CmsData = Record<string, unknown> & { posts: CmsPost[] };
type Sections = Record<string, CmsData>;
export class CmsError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  const record = value as Record<string, unknown>;
  return "{" + Object.keys(record).sort().filter((k) => record[k] !== undefined)
    .map((k) => JSON.stringify(k) + ":" + canonical(record[k])).join(",") + "}";
}
export const fingerprint = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");
export function cmsSection(section: string): string {
  if (section !== "blog" && section !== "cms-pages" && !/^blog__v__[a-z0-9]+(?:-[a-z0-9]+)*$/.test(section)) throw new CmsError("Unsupported CMS section.");
  return section;
}
async function validateVariant(client: Pick<PoolClient, "query">, section: string) {
  if (!section.startsWith("blog__v__")) return;
  const result = await client.query("SELECT slug FROM page_variants WHERE slug=$1 AND source_key='blog'", [section.slice("blog__v__".length)]);
  if (!result.rows.length) throw new CmsError("Blog variant not found. Do not save into the main blog instead.", 404);
}
export async function listCmsSections() {
  const variants = await pool.query("SELECT slug FROM page_variants WHERE source_key='blog' ORDER BY slug");
  return ["blog", "cms-pages", ...variants.rows.map((v) => "blog__v__" + v.slug)];
}
function readData(value: unknown): CmsData {
  if (value === null || value === undefined) return { posts: [], tocInitialVisible: 5 };
  if (typeof value !== "object" || Array.isArray(value)) throw new CmsError("Invalid stored collection. Do not overwrite it.", 500);
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.posts)) throw new CmsError("Invalid stored posts. Do not overwrite them.", 500);
  return { ...data, posts: data.posts as CmsPost[], tocInitialVisible: data.tocInitialVisible ?? 5 };
}
export function collectionResult(data: CmsData) {
  return {
    data, versions: Object.fromEntries(data.posts.map((p) => [p.slug, fingerprint(p)])),
    tocVersion: fingerprint(data.tocInitialVisible ?? null),
  };
}
async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(691104)");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}
async function getSections(client: PoolClient): Promise<Sections> {
  const result = await client.query("SELECT c.section,c.data FROM site_content c LEFT JOIN page_variants v ON c.section=('blog__v__'||v.slug) AND v.source_key='blog' WHERE c.section IN ('blog','cms-pages') OR v.slug IS NOT NULL");
  const sections: Sections = { blog: readData(null), "cms-pages": readData(null) };
  for (const row of result.rows) sections[row.section] = readData(row.data);
  return sections;
}
async function writeData(client: PoolClient, section: string, data: CmsData) {
  await client.query(
    "INSERT INTO site_content(section,data,updated_at) VALUES($1,$2,now()) ON CONFLICT(section) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at",
    [section, JSON.stringify(data)],
  );
}
async function recordRevision(client: PoolClient, section: string, post: CmsPost, reason: string) {
  const postId = typeof post._cmsId === "string" ? post._cmsId : fingerprint([section, post.slug]);
  await client.query(
    "INSERT INTO cms_revisions(id,section,post_id,slug,title,post,reason) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [randomUUID(), section, postId, post.slug, post.title, JSON.stringify(post), reason],
  );
  await client.query(
    "DELETE FROM cms_revisions WHERE id IN (SELECT id FROM cms_revisions WHERE section=$1 AND post_id=$2 ORDER BY created_at DESC,id DESC OFFSET 20)",
    [section, postId],
  );
}
async function checkpoint(client: PoolClient, sections: Sections, reason: string) {
  const id = randomUUID();
  await client.query(
    "INSERT INTO cms_backups(id,snapshot,checksum,reason) VALUES($1,$2,$3,$4)",
    [id, JSON.stringify(sections), fingerprint(sections), reason],
  );
  // Daily snapshots are bounded independently of manual/pre-restore copies.
  await client.query("DELETE FROM cms_backups WHERE reason='daily' AND id IN (SELECT id FROM cms_backups WHERE reason='daily' ORDER BY created_at DESC,id DESC OFFSET 30)");
  await client.query("DELETE FROM cms_backups WHERE reason<>'daily' AND id IN (SELECT id FROM cms_backups WHERE reason<>'daily' ORDER BY created_at DESC,id DESC OFFSET 60)");
  return id;
}
async function dailyCheckpoint(client: PoolClient, sections: Sections) {
  const recent = await client.query("SELECT id FROM cms_backups WHERE reason='daily' AND created_at > now()-interval '24 hours' LIMIT 1");
  if (!recent.rows.length) await checkpoint(client, sections, "daily");
}
async function validatePages(client: PoolClient, section: string, data: CmsData) {
  if (section !== "cms-pages") return;
  const variants = await client.query("SELECT slug FROM page_variants");
  const error = validateCmsPagesData(data, variants.rows.map((r) => r.slug));
  if (error) throw new CmsError(error);
}
export async function readCollection(section: string) {
  cmsSection(section);
  await validateVariant(pool, section);
  const rows = await pool.query("SELECT data FROM site_content WHERE section=$1", [section]);
  return collectionResult(readData(rows.rows[0]?.data));
}
export async function mutateCollection(section: string, body: Record<string, unknown>) {
  cmsSection(section);
  const operations = body.operations;
  if (!Array.isArray(operations) || operations.length > 1000) throw new CmsError("Expected at most 1000 post operations.");
  return transaction(async (client) => {
    await validateVariant(client, section);
    const sections = await getSections(client);
    await dailyCheckpoint(client, sections);
    const existingData = sections[section] ?? readData(null);
    const data: CmsData = { ...existingData, posts: [...existingData.posts] };
    const touched = new Set<string>();
    for (const op of operations) {
      if (!op || typeof op !== "object" || !["upsert", "delete", "patch"].includes(op.type)) throw new CmsError("Invalid post operation.");
      const slug = String(op.previousSlug ?? op.slug ?? "").trim();
      if (touched.has(slug)) throw new CmsError("A post cannot be changed twice in one request.");
      touched.add(slug);
      const index = data.posts.findIndex((p) => p.slug === slug);
      const existing = index < 0 ? null : data.posts[index];
      if (op.expectedVersion !== (existing ? fingerprint(existing) : null)) {
        throw new CmsError(`"${slug}" changed in another tab or session. Your changes are not discarded. Reload the current version before saving.`, 409);
      }
      if (op.type === "delete") {
        if (!existing) throw new CmsError("Post no longer exists.", 409);
        if (!existing.trashed) throw new CmsError("Move the post to Trash before permanently deleting it.");
        await recordRevision(client, section, existing, "permanent-delete");
        data.posts.splice(index, 1);
        continue;
      }
      let post = op.post as CmsPost;
      if (op.type === "patch") {
        if (!existing) throw new CmsError("Post no longer exists.", 409);
        if (!op.patch || typeof op.patch !== "object" || Array.isArray(op.patch) ||
          Object.keys(op.patch).some((key) => !["status", "trashed", "trashedAt"].includes(key))) throw new CmsError("Only publication and trash metadata can be patched.");
        if (op.patch.trashed !== undefined && typeof op.patch.trashed !== "boolean") throw new CmsError("Invalid trash state.");
        if (op.patch.trashedAt !== undefined && op.patch.trashedAt !== null &&
          (typeof op.patch.trashedAt !== "string" || !Number.isFinite(Date.parse(op.patch.trashedAt)))) throw new CmsError("Invalid trash date.");
        post = { ...existing, ...op.patch };
        if (post.trashedAt === null) delete post.trashedAt;
      }
      if (!post || typeof post !== "object" || typeof post.slug !== "string" || typeof post.title !== "string" || !post.title.trim()) {
        throw new CmsError("Each post needs a title and URL slug.");
      }
      if (typeof post.content !== "string") throw new CmsError("Post content must be text.");
      if (post.status !== undefined && post.status !== "draft" && post.status !== "published") throw new CmsError("Invalid post status.");
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || post.slug.length > 160) throw new CmsError("Invalid post URL slug.");
      if (section === "cms-pages" && isReservedCmsPageSlug(post.slug)) throw new CmsError("This page URL is reserved.");
      if (data.posts.some((p, i) => i !== index && p.slug.toLowerCase() === post.slug.toLowerCase())) {
        throw new CmsError("This URL slug already exists.", 409);
      }
      if (existing) await recordRevision(client, section, existing, post.trashed ? "trash" : "edit");
      const id = existing
        ? (typeof existing._cmsId === "string" ? existing._cmsId : fingerprint([section, existing.slug]))
        : randomUUID();
      const saved = { ...post, status: post.status ?? existing?.status ?? "draft", _cmsId: id };
      if (index < 0) data.posts.push(saved);
      else data.posts[index] = saved;
    }
    if (body.tocInitialVisible !== undefined) {
      if (body.expectedTocVersion !== fingerprint(data.tocInitialVisible ?? null)) throw new CmsError("TOC setting changed in another session. Reload it.", 409);
      const count = body.tocInitialVisible;
      if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || count > 30) throw new CmsError("Invalid TOC setting.");
      data.tocInitialVisible = count;
    }
    await validatePages(client, section, data);
    await writeData(client, section, data);
    return collectionResult(data);
  });
}
export async function listRevisions(section: string, slug?: string) {
  cmsSection(section);
  if (!slug) return (await pool.query("SELECT id,slug,title,reason,created_at FROM cms_revisions WHERE section=$1 ORDER BY created_at DESC,id DESC LIMIT 100", [section])).rows;
  const { data } = await readCollection(section);
  const post = data.posts.find((p) => p.slug === slug);
  const postId = post?._cmsId ?? fingerprint([section, slug]);
  return (await pool.query(
    "SELECT id,slug,title,reason,created_at FROM cms_revisions WHERE section=$1 AND (post_id=$2 OR slug=$3) ORDER BY created_at DESC,id DESC LIMIT 20",
    [section, postId, slug],
  )).rows;
}
export async function getRevision(section: string, id: string) {
  cmsSection(section);
  const result = await pool.query("SELECT id,slug,title,post,created_at FROM cms_revisions WHERE section=$1 AND id=$2", [section, id]);
  if (!result.rows.length) throw new CmsError("Revision not found.", 404);
  return result.rows[0];
}
export async function listBackups() {
  return (await pool.query(
    "SELECT id,reason,created_at,checksum,coalesce(jsonb_array_length(snapshot->'blog'->'posts'),0) AS blogs,coalesce(jsonb_array_length(snapshot->'cms-pages'->'posts'),0) AS pages FROM cms_backups ORDER BY created_at DESC,id DESC LIMIT 90",
  )).rows;
}
export async function createBackup() {
  return transaction(async (client) => checkpoint(client, await getSections(client), "manual"));
}
export async function backupDocument(id: string) {
  const result = await pool.query("SELECT * FROM cms_backups WHERE id=$1", [id]);
  if (!result.rows.length) throw new CmsError("Backup not found.", 404);
  const row = result.rows[0];
  if (fingerprint(row.snapshot) !== row.checksum) throw new CmsError("Stored backup checksum mismatch. Do not restore it.", 422);
  return { format: "growitbuddy-cms-backup", version: 1, createdAt: row.created_at, sections: row.snapshot, checksum: row.checksum };
}
export function validateBackup(document: unknown): Sections {
  const doc = document as Record<string, unknown>;
  if (!doc || doc.format !== "growitbuddy-cms-backup" || doc.version !== 1 || !doc.sections || typeof doc.sections !== "object") {
    throw new CmsError("Choose a GrowitBuddy CMS safety JSON backup, not a source ZIP or arbitrary JSON.");
  }
  if (fingerprint(doc.sections) !== doc.checksum) throw new CmsError("Backup is damaged or was edited (checksum mismatch).", 422);
  const sections = doc.sections as Sections;
  if (!sections.blog || !sections["cms-pages"]) throw new CmsError("Backup must contain blogs and CMS pages.");
  for (const section of Object.keys(sections)) {
    cmsSection(section);
    const data = readData(sections[section]);
    if (data.posts.length > 10000) throw new CmsError("Backup contains too many posts.");
    const slugs = new Set<string>();
    for (const post of data.posts) {
      if (!post || typeof post.slug !== "string" || post.slug.length > 160 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || typeof post.title !== "string" || !post.title.trim() || typeof post.content !== "string") throw new CmsError("Backup contains an invalid post.");
      if (slugs.has(post.slug.toLowerCase())) throw new CmsError("Backup contains duplicate URLs.");
      slugs.add(post.slug.toLowerCase());
    }
  }
  return sections;
}
function restorePlan(current: Sections, source: Sections) {
  return Object.fromEntries(Object.keys(source).map((section) => {
    const currentSlugs = new Set((current[section]?.posts ?? []).map((p) => p.slug.toLowerCase()));
    const missing = source[section].posts.filter((p) => !currentSlugs.has(p.slug.toLowerCase()));
    return [section, { missing: missing.length, existingSkipped: source[section].posts.length - missing.length }];
  }));
}
export async function inspectRestore(document: unknown) {
  const source = validateBackup(document);
  return transaction(async (client) => {
    const current = await getSections(client);
    for (const section of Object.keys(source)) {
      await validateVariant(client, section);
      const existing = current[section] ?? readData(null);
      const missing = source[section].posts.filter((p) => !existing.posts.some((q) => q.slug.toLowerCase() === p.slug.toLowerCase()));
      await validatePages(client, section, { ...existing, posts: [...existing.posts, ...missing] });
    }
    return { plan: restorePlan(current, source), expectedState: fingerprint(current), mode: "merge-missing-as-drafts" };
  });
}
export async function restoreMissing(document: unknown, expectedState: unknown, confirm: unknown) {
  if (confirm !== "RESTORE MISSING POSTS") throw new CmsError("Type RESTORE MISSING POSTS to confirm.");
  const source = validateBackup(document);
  return transaction(async (client) => {
    const current = await getSections(client);
    if (expectedState !== fingerprint(current)) throw new CmsError("Content changed after the restore preview. Preview again before restoring.", 409);
    const plan = restorePlan(current, source);
    const beforeBackupId = await checkpoint(client, current, "before-restore");
    for (const section of Object.keys(source)) {
      await validateVariant(client, section);
      const existing = current[section] ?? readData(null);
      const slugs = new Set(existing.posts.map((p) => p.slug.toLowerCase()));
      const missing = source[section].posts.filter((p) => !slugs.has(p.slug.toLowerCase()));
      const restored = missing.map((p) => ({ ...p, status: "draft", trashed: false, trashedAt: undefined, _cmsId: randomUUID() }));
      const data: CmsData = { ...existing, posts: [...existing.posts, ...restored] };
      await validatePages(client, section, data);
      if (restored.length) await writeData(client, section, data);
    }
    return { plan, beforeBackupId, message: "Missing posts restored as drafts. Existing posts were not overwritten." };
  });
}
export async function takeDailyBackup() {
  return transaction(async (client) => dailyCheckpoint(client, await getSections(client)));
}
export function startCmsSafetyBackups() {
  const run = () => takeDailyBackup().catch((error) => logger.error({ message: error instanceof Error ? error.message : "unknown" }, "CMS daily backup unavailable; check the safety migration"));
  void run();
  const timer = setInterval(run, 15 * 60 * 1000);
  timer.unref();
}

export async function createOffsiteKey() {
  const key = "gib_backup_" + randomBytes(32).toString("hex");
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + 90 * 86400_000);
  await pool.query("INSERT INTO cms_backup_keys(id,secret_hash,expires_at) VALUES($1,$2,$3)", [id, fingerprint(key), expiresAt]);
  return { id, key, expiresAt };
}
export async function listOffsiteKeys() {
  return (await pool.query("SELECT id,revoked,created_at,expires_at FROM cms_backup_keys ORDER BY created_at DESC LIMIT 30")).rows;
}
export async function revokeOffsiteKey(id: string) {
  await pool.query("UPDATE cms_backup_keys SET revoked=true WHERE id=$1", [id]);
}
export async function authorizeOffsiteKey(key: string) {
  if (!/^gib_backup_[a-f0-9]{64}$/.test(key)) return false;
  return (await pool.query("SELECT id FROM cms_backup_keys WHERE secret_hash=$1 AND revoked=false AND expires_at>now()", [fingerprint(key)])).rows.length > 0;
}
export async function offsiteDocument() {
  return transaction(async (client) => {
    const sections = await getSections(client);
    const media = await client.query("SELECT id,filename,mimetype,size FROM media_files ORDER BY id");
    const mediaManifest = media.rows.map((m) => ({
      id: m.id, filename: m.filename, mimetype: m.mimetype, size: m.size,
      backupFilename: `${m.id}_${m.size}_${String(m.filename).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160)}`,
    }));
    return {
      format: "growitbuddy-cms-backup", version: 1, createdAt: new Date().toISOString(),
      sections, checksum: fingerprint(sections), mediaManifest, mediaManifestChecksum: fingerprint(mediaManifest),
      mediaIncluded: false, note: "Media files must be copied separately. This JSON does not contain image bytes.",
    };
  });
}
