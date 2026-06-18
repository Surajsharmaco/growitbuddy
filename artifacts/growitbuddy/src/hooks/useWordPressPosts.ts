import { useState, useEffect } from "react";
import type { BlogPost } from "@/data/blogPosts";
import { API_BASE } from "@/lib/api";

const WP_API = "https://blog.growitbuddy.com/wp-json/wp/v2";

// The WP REST media endpoint is locked for anonymous requests, so posts never
// carry a featured-image URL via the API. The api-server resolves each post's
// featured image from its public HTML page; cache resolved URLs for the session
// so navigating list <-> detail doesn't re-request them.
const featuredImageCache = new Map<string, string>();

export async function resolveWpFeaturedImages(wpSlugs: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(wpSlugs.filter(Boolean)));
  const need = unique.filter((s) => !featuredImageCache.has(s));
  if (need.length) {
    try {
      const res = await fetch(
        `${API_BASE}/wp/featured-images?slugs=${encodeURIComponent(need.join(","))}`,
        { signal: AbortSignal.timeout(12000) },
      );
      if (res.ok) {
        const json = (await res.json()) as { images?: Record<string, string | null> };
        for (const s of need) {
          const url = json.images?.[s];
          if (url) featuredImageCache.set(s, url);
        }
      }
    } catch {
      /* leave unresolved - a later call retries */
    }
  }
  const out: Record<string, string> = {};
  for (const s of unique) {
    const url = featuredImageCache.get(s);
    if (url) out[s] = url;
  }
  return out;
}

interface WPPost {
  id: number;
  slug: string;
  date: string;
  modified?: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  featured_media: number;
  categories: number[];
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url: string; media_details?: { width?: number; height?: number } }>;
    "wp:term"?: Array<Array<{ name: string }>>;
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, (m) => {
    const map: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#039;": "'", "&nbsp;": " " };
    return map[m] ?? m;
  }).trim();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function estimateReadTime(html: string): string {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

export function wpPostToBlogPost(wp: WPPost): BlogPost {
  const featuredImage = wp._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  const categories = wp._embedded?.["wp:term"]?.[0];
  const tag = categories?.find((c) => c.name !== "Uncategorized")?.name ?? categories?.[0]?.name ?? "Insights";

  // Skip any leading media/layout blocks (figure, gallery, cover, etc.) and start from
  // the first heading or paragraph that has real text content.
  let cleanContent = wp.content.rendered.trim();

  // Find position of first real text block: heading or paragraph with non-whitespace text
  const firstTextBlock = /<(h[1-6]\b|p\b)[^>]*>\s*\S/i.exec(cleanContent);
  if (firstTextBlock && firstTextBlock.index > 0) {
    cleanContent = cleanContent.slice(firstTextBlock.index).trim();
  }

  // Remove trailing empty <p> tags
  cleanContent = cleanContent.replace(/(\s*<p>\s*<\/p>\s*)+$/i, "").trim();

  return {
    slug: `wp-${wp.slug}`,
    title: stripHtml(wp.title.rendered),
    excerpt: stripHtml(wp.excerpt.rendered).slice(0, 200).trim(),
    content: cleanContent,
    date: formatDate(wp.date),
    isoDate: wp.date,
    modifiedIsoDate: wp.modified ?? wp.date,
    tag,
    featuredImage,
    readTime: estimateReadTime(wp.content.rendered),
    source: "wordpress" as const,
  };
}

export function useWordPressPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${WP_API}/posts?_embed=1&per_page=100&status=publish`)
      .then((r) => r.json())
      .then((data: WPPost[]) => {
        if (!cancelled && Array.isArray(data)) {
          const mapped = data.map(wpPostToBlogPost);
          setPosts(mapped);
          // Backfill featured images the REST API hides behind its locked media endpoint.
          const missing = mapped.filter((p) => !p.featuredImage).map((p) => p.slug.replace(/^wp-/, ""));
          if (missing.length) {
            resolveWpFeaturedImages(missing).then((imgs) => {
              if (cancelled) return;
              setPosts((prev) =>
                prev.map((p) => {
                  if (p.featuredImage) return p;
                  const url = imgs[p.slug.replace(/^wp-/, "")];
                  return url ? { ...p, featuredImage: url } : p;
                }),
              );
            });
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load WordPress posts");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { posts, loading, error };
}

export async function fetchWpPostBySlug(slug: string): Promise<BlogPost | null> {
  const wpSlug = slug.startsWith("wp-") ? slug.slice(3) : slug;
  try {
    const res = await fetch(`${WP_API}/posts?_embed=1&slug=${encodeURIComponent(wpSlug)}&status=publish`);
    const data: WPPost[] = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const post = wpPostToBlogPost(data[0]);
      if (!post.featuredImage) {
        const imgs = await resolveWpFeaturedImages([wpSlug]);
        if (imgs[wpSlug]) post.featuredImage = imgs[wpSlug];
      }
      return post;
    }
  } catch { /* network error */ }
  return null;
}
