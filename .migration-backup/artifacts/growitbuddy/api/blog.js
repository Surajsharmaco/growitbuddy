// Vercel serverless function — injects per-post OG/Twitter meta tags into the
// SPA shell so social-media crawlers (LinkedIn, WhatsApp, Twitter, Facebook,
// iMessage, Slack, Discord) see the correct featured image + title +
// description + canonical URL. Regular users get the same enriched HTML
// and the SPA hydrates over it as normal.

const WP_API = "https://blog.growitbuddy.com/wp-json/wp/v2";
const SITE = "https://growitbuddy.com";
const SITE_NAME = "GrowitBuddy";
const TWITTER = "@growitbuddy";
const DEFAULT_IMAGE = `${SITE}/opengraph.jpg`;

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtml(s) {
  return String(s ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s, n) {
  const t = stripHtml(s);
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
}

async function fetchShell(host) {
  // Pull the built SPA shell directly from the same deployment.
  // The rewrite only matches /blog/:slug, so /index.html is safe to fetch.
  const proto = host.includes("localhost") ? "http" : "https";
  const res = await fetch(`${proto}://${host}/index.html`, {
    headers: { "x-gb-shell": "1" },
  });
  if (!res.ok) throw new Error(`shell ${res.status}`);
  return res.text();
}

async function fetchPost(slug) {
  const res = await fetch(
    `${WP_API}/posts?_embed=1&slug=${encodeURIComponent(slug)}&status=publish`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) return null;
  const arr = await res.json();
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}

function buildMeta({ title, description, image, url, publishedTime, modifiedTime, author }) {
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:secure_url" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(title)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:site" content="${esc(TWITTER)}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    `<meta name="twitter:image:alt" content="${esc(title)}" />`,
  ];
  if (publishedTime) tags.push(`<meta property="article:published_time" content="${esc(publishedTime)}" />`);
  if (modifiedTime)  tags.push(`<meta property="article:modified_time" content="${esc(modifiedTime)}" />`);
  if (author)        tags.push(`<meta property="article:author" content="${esc(author)}" />`);
  return tags.join("\n    ");
}

function injectMeta(shell, metaBlock) {
  // 1) Remove existing tags we are about to replace, so crawlers see only ours.
  let html = shell
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta[^>]+(name|property)=["'](description|og:[^"']+|twitter:[^"']+|article:[^"']+)["'][^>]*>\s*/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>\s*/gi, "");
  // 2) Insert our block right after <head>.
  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, `<head$1>\n    ${metaBlock}`);
  } else {
    html = metaBlock + html;
  }
  return html;
}

function fallbackHtml(shell, slug) {
  // Post not found → still return shell with sensible defaults so SPA renders
  // the in-app "Post not found" view client-side. Don't return 404 here, the
  // SPA needs to render its own UI.
  const meta = buildMeta({
    title: `${SITE_NAME} Blog`,
    description: "Insights on building authority for founders and creators.",
    image: DEFAULT_IMAGE,
    url: `${SITE}/blog/${slug}`,
  });
  return injectMeta(shell, meta);
}

export default async function handler(req, res) {
  try {
    const slug = String(req.query?.slug || "").trim();
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    if (!slug || !host) {
      res.status(400).send("missing slug or host");
      return;
    }

    const [shell, post] = await Promise.all([fetchShell(host), fetchPost(slug)]);

    let html;
    if (!post) {
      html = fallbackHtml(shell, slug);
    } else {
      const featured =
        post?._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
        post?.yoast_head_json?.og_image?.[0]?.url ||
        DEFAULT_IMAGE;
      const rawTitle = post?.title?.rendered || "Untitled";
      const cleanTitle = stripHtml(rawTitle);
      const description = truncate(
        post?.yoast_head_json?.description || post?.excerpt?.rendered || post?.content?.rendered || "",
        180
      );
      const authorName = post?._embedded?.author?.[0]?.name || "Suraj Sharma";
      const url = `${SITE}/blog/${slug}`;
      const meta = buildMeta({
        title: `${cleanTitle} | ${SITE_NAME} Insights`,
        description: description || `Read "${cleanTitle}" on ${SITE_NAME}.`,
        image: featured,
        url,
        publishedTime: post?.date_gmt ? `${post.date_gmt}Z` : post?.date,
        modifiedTime: post?.modified_gmt ? `${post.modified_gmt}Z` : post?.modified,
        author: authorName,
      });
      html = injectMeta(shell, meta);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    // Cache for 5 min at the edge, allow stale-while-revalidate for snappy refreshes.
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=86400");
    res.status(200).send(html);
  } catch (err) {
    // Last-resort: try to return the bare shell so users still see something.
    try {
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const shell = await fetchShell(host);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(shell);
    } catch {
      res.status(500).send(`og error: ${err?.message || "unknown"}`);
    }
  }
}
