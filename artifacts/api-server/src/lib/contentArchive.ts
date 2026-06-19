// ── Site content + photos archive builder ────────────────────────────────────
// The regular source/CMS backup includes the website's TEXT content (pages,
// portfolio/case studies, logos, certificates) as JSON, but it deliberately
// leaves out the actual image BYTES (only URLs). If the site — or its image host
// — ever goes away, those URLs break and the photos are lost.
//
// This builder produces a portable archive that pairs the content snapshot with
// every uploaded image downloaded as a real file, plus a manifest mapping each
// stored media URL/id to its local file, so the content can be reused elsewhere
// with its images intact.
import { zipSync, strToU8 } from "fflate";
import { eq, sql } from "drizzle-orm";
import { logger } from "./logger";
import { db, mediaFiles } from "@workspace/db";
import { buildContentSnapshot } from "./backup";
import { safeFetchToBuffer } from "./safeFetch";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "*/*",
};

const PER_FILE_MAX_BYTES = 25 * 1024 * 1024; // skip any single asset over 25 MB
const TOTAL_MAX_BYTES = 200 * 1024 * 1024; // stop downloading past 200 MB total

export interface ContentArchiveResult {
  zip: Buffer;
  mediaCount: number;
  mediaBytes: number;
  skippedMedia: number;
  generatedAt: string;
}

function extFromMime(mime: string, filename: string): string {
  const c = (mime || "").toLowerCase();
  if (c.includes("jpeg") || c.includes("jpg")) return "jpg";
  if (c.includes("png")) return "png";
  if (c.includes("webp")) return "webp";
  if (c.includes("gif")) return "gif";
  if (c.includes("avif")) return "avif";
  if (c.includes("svg")) return "svg";
  if (c.includes("mp4")) return "mp4";
  if (c.includes("webm")) return "webm";
  const m = /\.([a-z0-9]{2,5})(?:\?|#|$)/i.exec(filename);
  if (m) return m[1].toLowerCase();
  return "bin";
}

function safeName(name: string): string {
  return (name || "file").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "").slice(0, 80) || "file";
}

// Load the base64 bytes for a SINGLE media row on demand. Selecting every row's
// `data` blob up front could OOM the server on a media-heavy DB, so we fetch one
// row's bytes only when we have decided to include it.
async function loadRowBytes(id: number): Promise<Uint8Array | null> {
  const r = await db.select({ data: mediaFiles.data }).from(mediaFiles).where(eq(mediaFiles.id, id)).limit(1);
  const data = r[0]?.data;
  if (!data) return null;
  try {
    const buf = Buffer.from(data, "base64");
    if (buf.length === 0 || buf.length > PER_FILE_MAX_BYTES) return null;
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

export async function buildContentArchive(): Promise<ContentArchiveResult> {
  const generatedAt = new Date().toISOString();
  const snapshot = await buildContentSnapshot();

  // Media METADATA only — never select the `data` blobs in bulk (memory safety).
  // `hasData` lets us decide whether to load a row's bytes without pulling them.
  const rows = await db
    .select({
      id: mediaFiles.id,
      filename: mediaFiles.filename,
      mimetype: mediaFiles.mimetype,
      size: mediaFiles.size,
      hasData: sql<boolean>`(${mediaFiles.data} IS NOT NULL)`,
      url: mediaFiles.url,
      uploadedAt: mediaFiles.uploadedAt,
    })
    .from(mediaFiles);

  const out: Record<string, Uint8Array> = {};
  const manifest: Array<Record<string, unknown>> = [];
  let mediaBytes = 0;
  let mediaCount = 0;
  let skippedMedia = 0;

  for (const m of rows) {
    let bytes: Uint8Array | null = null;
    // Skip up front when the declared size already blows the per-file budget, so
    // we never even load the blob / start the download.
    const declaredTooBig = typeof m.size === "number" && m.size > PER_FILE_MAX_BYTES;
    if (mediaBytes < TOTAL_MAX_BYTES && !declaredTooBig) {
      if (m.hasData) {
        bytes = await loadRowBytes(m.id);
      } else if (m.url) {
        // Remote URLs are untrusted DB values — SSRF-safe, streaming, capped fetch.
        const res = await safeFetchToBuffer(m.url, { maxBytes: PER_FILE_MAX_BYTES, headers: BROWSER_HEADERS });
        bytes = res?.bytes ?? null;
      }
    }

    const ext = extFromMime(m.mimetype, m.filename || "");
    const localPath = bytes ? `media/${m.id}-${safeName(m.filename || `media-${m.id}`).replace(/\.[a-z0-9]+$/i, "")}.${ext}` : null;

    if (bytes && localPath) {
      out[localPath] = bytes;
      mediaCount++;
      mediaBytes += bytes.byteLength;
    } else {
      skippedMedia++;
    }

    manifest.push({
      id: m.id,
      filename: m.filename,
      mimetype: m.mimetype,
      apiPath: `/api/media/file/${m.id}`,
      remoteUrl: m.url ?? null,
      localFile: localPath,
      uploadedAt: m.uploadedAt,
      ...(bytes ? {} : { note: "bytes unavailable (over size budget, missing, or remote fetch failed)" }),
    });
  }

  out["content-snapshot.json"] = strToU8(JSON.stringify(snapshot, null, 2));
  out["media-manifest.json"] = strToU8(JSON.stringify({ generatedAt, count: manifest.length, downloaded: mediaCount, media: manifest }, null, 2));
  out["README.md"] = strToU8(`# GrowitBuddy — Site Content + Photos Archive

Generated: ${generatedAt}

## What this is
A portable copy of the website's editable content together with the actual image
files, so the content (and its photos) can be moved to another site or kept safe
even if this project or its image host goes away.

## What's inside
- \`content-snapshot.json\` — all editable site content: pages/sections, portfolio
  & case studies, client logos, certificates, page variants (text + settings).
- \`media/\` — every uploaded image/video downloaded as a real file
  (named \`<id>-<filename>.<ext>\`).
- \`media-manifest.json\` — maps each media item (its database id, the
  \`/api/media/file/<id>\` path used across the content, and any remote URL) to its
  local file in \`media/\`, so you can relink images when re-importing.

## For safety this does NOT include
- Any secrets, API keys or passwords.
- CRM leads / customer personal data.
- Team member accounts or password hashes.

## Notes
- Downloaded ${mediaCount} media file(s)${skippedMedia ? `, skipped ${skippedMedia} (over size budget, missing, or fetch failed)` : ""}.
- This is content + photos only. For the full project SOURCE CODE use the
  "Full source backup (ZIP)" option. For blog posts use the "Blog backup" option.
`);

  logger.info({ mediaCount, mediaBytes, skippedMedia }, "content archive generated");
  const zip = Buffer.from(zipSync(out, { level: 6 }));
  return { zip, mediaCount, mediaBytes, skippedMedia, generatedAt };
}
