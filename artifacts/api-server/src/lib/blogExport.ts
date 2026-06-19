// ── Blog export bundle builder ───────────────────────────────────────────────
// Blogs live on an EXTERNAL WordPress site (blog.growitbuddy.com), not in this
// project's database — so they are NOT part of the regular source/CMS backup.
// This builder fetches every published post from the WordPress REST API and packs
// a fully self-contained, portable ZIP: each post's full content + all its images
// downloaded as real files, with the HTML rewritten to point at those local
// images. The result keeps working forever even if the WordPress site (or this
// whole project) ever goes away, and the posts can be re-imported into any other
// site or CMS.
import { zipSync, strToU8 } from "fflate";
import { logger } from "./logger";
import { safeFetchToBuffer } from "./safeFetch";

const WP_SITE = "https://blog.growitbuddy.com";
const WP_API = `${WP_SITE}/wp-json/wp/v2`;

// Some hosts/WAFs serve a challenge/403 to unknown datacenter bots, which would
// make the fetch find nothing even though the page renders fine for a visitor.
// Present a real browser UA + Accept header for every request.
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

// Safety caps so a pathological blog can never OOM the server.
const MAX_PAGES = 50; // up to 50 * 100 = 5000 posts
const PER_PAGE = 100;
const PER_IMAGE_MAX_BYTES = 25 * 1024 * 1024; // skip any single asset over 25 MB
const TOTAL_IMAGE_MAX_BYTES = 200 * 1024 * 1024; // stop downloading images past 200 MB total

interface WpTerm {
  name?: string;
  slug?: string;
  taxonomy?: string;
}
interface WpPostRaw {
  id: number;
  slug: string;
  date: string;
  modified?: string;
  link?: string;
  status?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  content?: { rendered?: string };
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url?: string; alt_text?: string }>;
    "wp:term"?: WpTerm[][];
    author?: Array<{ name?: string }>;
  };
}

export interface BlogExportResult {
  zip: Buffer;
  postCount: number;
  imageCount: number;
  imageBytes: number;
  skippedImages: number;
  generatedAt: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#039|rsquo|lsquo|ldquo|rdquo|hellip|ndash|mdash);/gi, (m) => {
      const map: Record<string, string> = {
        "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'",
        "&#039;": "'", "&nbsp;": " ", "&rsquo;": "\u2019", "&lsquo;": "\u2018",
        "&ldquo;": "\u201C", "&rdquo;": "\u201D", "&hellip;": "\u2026",
        "&ndash;": "\u2013", "&mdash;": "\u2014",
      };
      return map[m.toLowerCase()] ?? m;
    });
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

function safeSlug(slug: string, fallbackId: number): string {
  const cleaned = (slug || "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return cleaned || `post-${fallbackId}`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c] as string));
}

// Pick the best real image URL out of a single <img> tag (lazy-load themes keep
// the real URL in data-* attributes and a placeholder in src).
function pickImgSrc(tag: string): string | null {
  for (const attr of ["data-lazy-src", "data-src", "src"]) {
    const m = new RegExp(`\\b${attr}=["']([^"']+)["']`, "i").exec(tag);
    if (m && /^https?:\/\//i.test(m[1])) return m[1];
  }
  const ss = /\bsrcset=["']([^"']+)["']/i.exec(tag);
  if (ss) {
    const first = ss[1].split(",")[0]?.trim().split(/\s+/)[0];
    if (first && /^https?:\/\//i.test(first)) return first;
  }
  return null;
}

function extractFeaturedFromHtml(html: string): string | null {
  const wpImg = /<img\b[^>]*\bwp-post-image\b[^>]*>/i.exec(html);
  if (wpImg) {
    const url = pickImgSrc(wpImg[0]);
    if (url) return url;
  }
  const og = /<meta\b[^>]*(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*>/i.exec(html);
  if (og) {
    const m = /content=["']([^"']+)["']/i.exec(og[0]);
    if (m && /^https?:\/\//i.test(m[1])) return m[1];
  }
  const up = /https?:\/\/[^"' ]*\/wp-content\/uploads\/[^"' ]+\.(?:jpe?g|png|webp|gif|avif)/i.exec(html);
  if (up) return up[0];
  return null;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length || 1) }, worker));
  return out;
}

// Fetch every published post, paginating through all REST pages.
async function fetchAllPosts(): Promise<WpPostRaw[]> {
  const all: WpPostRaw[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    let res: Response;
    try {
      res = await fetch(
        `${WP_API}/posts?_embed=1&per_page=${PER_PAGE}&page=${page}&status=publish&orderby=date&order=desc`,
        { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(20000) },
      );
    } catch (err) {
      logger.warn({ err, page }, "blog-export: post page fetch failed");
      break;
    }
    // WP returns 400 (rest_post_invalid_page_number) once you ask past the last page.
    if (res.status === 400) break;
    if (!res.ok) {
      logger.warn({ status: res.status, page }, "blog-export: post page non-ok");
      break;
    }
    let batch: WpPostRaw[];
    try {
      batch = (await res.json()) as WpPostRaw[];
    } catch {
      break;
    }
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    const totalPages = Number(res.headers.get("X-WP-TotalPages") || "0");
    if (totalPages && page >= totalPages) break;
    if (batch.length < PER_PAGE) break;
  }
  return all;
}

async function resolveFeaturedImage(post: WpPostRaw): Promise<string | null> {
  const embedded = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  if (embedded && /^https?:\/\//i.test(embedded)) return embedded;
  // The REST media endpoint is locked for anon requests, so scrape the public page.
  try {
    const r = await fetch(`${WP_SITE}/${encodeURIComponent(post.slug)}/`, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    if (r.ok && new URL(r.url).hostname === "blog.growitbuddy.com") {
      return extractFeaturedFromHtml(await r.text());
    }
  } catch {
    /* treat as no featured image */
  }
  return null;
}

function collectContentImageUrls(html: string): string[] {
  const urls = new Set<string>();
  const tags = html.match(/<img\b[^>]*>/gi) || [];
  for (const t of tags) {
    const u = pickImgSrc(t);
    if (u) urls.add(u);
  }
  return Array.from(urls);
}

function extFromContentType(ct: string, url: string): string {
  const c = (ct || "").toLowerCase();
  if (c.includes("jpeg") || c.includes("jpg")) return "jpg";
  if (c.includes("png")) return "png";
  if (c.includes("webp")) return "webp";
  if (c.includes("gif")) return "gif";
  if (c.includes("avif")) return "avif";
  if (c.includes("svg")) return "svg";
  const m = /\.([a-z0-9]{2,5})(?:\?|#|$)/i.exec(url);
  if (m) return m[1].toLowerCase();
  return "img";
}

async function downloadAsset(url: string): Promise<{ bytes: Uint8Array; ext: string } | null> {
  // Image URLs come from untrusted external WordPress HTML/content, so this goes
  // through the SSRF-safe, streaming, size-capped fetch (blocks private hosts and
  // never buffers more than PER_IMAGE_MAX_BYTES).
  const res = await safeFetchToBuffer(url, { maxBytes: PER_IMAGE_MAX_BYTES, headers: BROWSER_HEADERS });
  if (!res) return null;
  return { bytes: res.bytes, ext: extFromContentType(res.contentType, res.finalUrl) };
}

// Rewrite every <img> in the content to point at a local images/<file> path and
// drop lazy-load / srcset attributes so the offline copy renders correctly.
function rewriteImages(html: string, urlToLocal: Map<string, string>): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const chosen = pickImgSrc(tag);
    let out = tag.replace(/\s(?:data-lazy-src|data-src|data-lazy-srcset|srcset|sizes)=["'][^"']*["']/gi, "");
    if (chosen && urlToLocal.has(chosen)) {
      const local = urlToLocal.get(chosen)!;
      if (/\ssrc=["'][^"']*["']/i.test(out)) {
        out = out.replace(/(\ssrc=)["'][^"']*["']/i, `$1"${local}"`);
      } else {
        out = out.replace(/<img/i, `<img src="${local}"`);
      }
    }
    return out;
  });
}

function termNames(post: WpPostRaw, taxonomy: string): string[] {
  const groups = post._embedded?.["wp:term"] || [];
  const names: string[] = [];
  for (const group of groups) {
    for (const t of group || []) {
      if (t?.taxonomy === taxonomy && t.name) names.push(decodeEntities(t.name));
    }
  }
  return Array.from(new Set(names));
}

function postIndexHtml(opts: {
  title: string;
  dateText: string;
  author: string;
  categories: string[];
  tags: string[];
  featuredLocal: string | null;
  contentHtml: string;
  originalLink: string;
}): string {
  const { title, dateText, author, categories, tags, featuredLocal, contentHtml, originalLink } = opts;
  const meta = [author && `By ${escapeHtml(author)}`, dateText && escapeHtml(dateText)].filter(Boolean).join(" · ");
  const taxon = [...categories, ...tags].map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join(" ");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; color: #1a1a1a; max-width: 760px; margin: 0 auto; padding: 40px 20px 80px; }
  h1 { font-size: 2rem; line-height: 1.2; margin: 0 0 12px; }
  .meta { color: #6b7280; font-size: 0.9rem; margin-bottom: 16px; }
  .chips { margin: 0 0 24px; display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { background: #f1f1ee; border-radius: 999px; padding: 3px 11px; font-size: 0.78rem; color: #444; }
  img { max-width: 100%; height: auto; border-radius: 8px; }
  figure { margin: 1.5em 0; }
  pre { background: #f6f6f4; padding: 14px; border-radius: 8px; overflow: auto; }
  a { color: #1d4ed8; }
  .src { margin-top: 48px; padding-top: 16px; border-top: 1px solid #eee; font-size: 0.82rem; color: #9ca3af; }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
${meta ? `<div class="meta">${meta}</div>` : ""}
${taxon ? `<div class="chips">${taxon}</div>` : ""}
${featuredLocal ? `<img src="${featuredLocal}" alt="${escapeHtml(title)}" />` : ""}
<article>
${contentHtml}
</article>
<div class="src">Originally published at <a href="${escapeHtml(originalLink)}">${escapeHtml(originalLink)}</a></div>
</body>
</html>`;
}

function readmeMd(count: number, generatedAt: string): string {
  return `# GrowitBuddy — Blog Backup

Generated: ${generatedAt}
Total posts: ${count}
Source: ${WP_SITE}

## What this is
A complete, self-contained backup of every published blog post. Each post folder
holds the full article, all of its images downloaded as real files, and the
metadata — so these posts keep working forever and can be moved to any other
website or CMS, even if the original blog or this project ever goes offline.

## How it is organised
- \`index.html\` — open this in any browser to read/browse all posts offline.
- \`blogs-index.json\` — machine-readable list of every post (for re-importing).
- \`blogs/<post-slug>/\`
  - \`index.html\` — the article as a clean, standalone web page (images embedded
    from the local \`images/\` folder).
  - \`content.html\` — just the raw article HTML body (image paths rewritten to the
    local \`images/\` folder), ready to paste into another CMS.
  - \`post.json\` — all the post's data: title, date, author, categories, tags,
    excerpt, the original URL, and the original + local image paths.
  - \`images/\` — the featured image and every in-article image, as real files.

## Notes
- Only PUBLISHED posts are included (drafts live only inside WordPress and need a
  WordPress login to export).
- Images are downloaded fresh at backup time; if an image was already missing on
  the live blog, it cannot be recovered here.
`;
}

export async function buildBlogExport(): Promise<BlogExportResult> {
  const generatedAt = new Date().toISOString();
  const posts = await fetchAllPosts();

  const out: Record<string, Uint8Array> = {};
  const indexEntries: Array<Record<string, unknown>> = [];
  const indexCards: string[] = [];

  let imageCount = 0;
  let imageBytes = 0;
  let skippedImages = 0;
  const usedFolders = new Set<string>();

  for (const post of posts) {
    let folder = safeSlug(post.slug, post.id);
    while (usedFolders.has(folder)) folder = `${folder}-${post.id}`;
    usedFolders.add(folder);

    const base = `blogs/${folder}`;
    const title = stripHtml(post.title?.rendered || "(untitled)");
    const rawContent = post.content?.rendered || "";
    const excerpt = stripHtml(post.excerpt?.rendered || "");
    const author = decodeEntities(post._embedded?.author?.[0]?.name || "");
    const categories = termNames(post, "category");
    const tags = termNames(post, "post_tag");
    const dateText = post.date ? new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
    const originalLink = post.link || `${WP_SITE}/${post.slug}/`;

    // Collect every image URL (featured + in-content), download under the budget.
    const featuredUrl = await resolveFeaturedImage(post);
    const contentUrls = collectContentImageUrls(rawContent);
    const allUrls = Array.from(new Set([...(featuredUrl ? [featuredUrl] : []), ...contentUrls]));

    const urlToLocal = new Map<string, string>();
    let featuredLocal: string | null = null;
    let imgSeq = 0;

    await mapLimit(allUrls, 4, async (url) => {
      if (imageBytes >= TOTAL_IMAGE_MAX_BYTES) {
        skippedImages++;
        return;
      }
      const asset = await downloadAsset(url);
      if (!asset) {
        skippedImages++;
        return;
      }
      const isFeatured = url === featuredUrl;
      const name = isFeatured ? `featured.${asset.ext}` : `img-${++imgSeq}.${asset.ext}`;
      out[`${base}/images/${name}`] = asset.bytes;
      urlToLocal.set(url, `images/${name}`);
      if (isFeatured) featuredLocal = `images/${name}`;
      imageCount++;
      imageBytes += asset.bytes.byteLength;
    });

    const rewritten = rewriteImages(rawContent, urlToLocal);

    out[`${base}/index.html`] = strToU8(
      postIndexHtml({ title, dateText, author, categories, tags, featuredLocal, contentHtml: rewritten, originalLink }),
    );
    out[`${base}/content.html`] = strToU8(rewritten);
    out[`${base}/post.json`] = strToU8(
      JSON.stringify(
        {
          id: post.id,
          slug: post.slug,
          title,
          excerpt,
          date: post.date,
          modified: post.modified ?? post.date,
          author,
          categories,
          tags,
          originalUrl: originalLink,
          featuredImage: { original: featuredUrl, local: featuredLocal },
          images: Array.from(urlToLocal, ([original, local]) => ({ original, local })),
        },
        null,
        2,
      ),
    );

    indexEntries.push({
      slug: post.slug,
      title,
      date: post.date,
      folder: base,
      originalUrl: originalLink,
      featuredImage: featuredLocal ? `${base}/${featuredLocal}` : null,
      categories,
      tags,
    });
    indexCards.push(
      `<a class="card" href="${base}/index.html">
        ${featuredLocal ? `<img src="${base}/${featuredLocal}" alt="" loading="lazy" />` : `<div class="ph"></div>`}
        <div class="cbody"><div class="ct">${escapeHtml(title)}</div><div class="cd">${escapeHtml(dateText)}</div></div>
      </a>`,
    );
  }

  out["blogs-index.json"] = strToU8(JSON.stringify({ generatedAt, source: WP_SITE, count: posts.length, posts: indexEntries }, null, 2));
  out["README.md"] = strToU8(readmeMd(posts.length, generatedAt));
  out["index.html"] = strToU8(
    `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>GrowitBuddy — Blog Backup (${posts.length} posts)</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #faf9f6; color: #1a1a1a; margin: 0; padding: 40px 20px 80px; }
  h1 { max-width: 1080px; margin: 0 auto 6px; font-size: 1.8rem; }
  p.sub { max-width: 1080px; margin: 0 auto 28px; color: #6b7280; }
  .grid { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; }
  .card { display: block; background: #fff; border: 1px solid #ececE7; border-radius: 12px; overflow: hidden; text-decoration: none; color: inherit; transition: box-shadow .15s, transform .15s; }
  .card:hover { box-shadow: 0 8px 24px rgba(0,0,0,.08); transform: translateY(-2px); }
  .card img, .card .ph { width: 100%; height: 150px; object-fit: cover; background: #f1f1ee; display: block; }
  .cbody { padding: 14px 16px 18px; }
  .ct { font-weight: 700; font-size: 1rem; line-height: 1.35; margin-bottom: 6px; }
  .cd { color: #9ca3af; font-size: 0.82rem; }
</style></head>
<body>
<h1>Blog Backup</h1>
<p class="sub">${posts.length} posts · backed up ${escapeHtml(new Date(generatedAt).toLocaleString("en-GB"))}. Click any post to read it offline.</p>
<div class="grid">${indexCards.join("\n")}</div>
</body></html>`,
  );

  const zip = Buffer.from(zipSync(out, { level: 6 }));
  return { zip, postCount: posts.length, imageCount, imageBytes, skippedImages, generatedAt };
}
