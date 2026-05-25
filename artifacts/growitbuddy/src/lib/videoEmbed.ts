export type VideoSource = "youtube" | "vimeo" | "drive" | "gumlet" | null;

export interface ParsedVideo {
  source: VideoSource;
  id: string;
}

// Extract Gumlet video ID from any Gumlet URL shape we know:
//   https://play.gumlet.io/embed/{ID}
//   https://play.gumlet.io/v/{ID}
//   https://www.gumlet.com/watch/{ID}
function extractGumletId(pathname: string): string {
  const m =
    pathname.match(/\/embed\/([a-zA-Z0-9]+)/) ??
    pathname.match(/\/v\/([a-zA-Z0-9]+)/) ??
    pathname.match(/\/watch\/([a-zA-Z0-9]+)/);
  return m?.[1] ?? "";
}

// If the admin pasted a full iframe / embed snippet (e.g. the HTML block
// Gumlet, YouTube, Vimeo, etc. give in their "Share" dialog) instead of a
// bare URL, pull the first src="…" out of it so the rest of the parser
// can work as usual. Falls back to the input trimmed.
export function extractEmbedUrl(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  // Look for src="..." or src='...' anywhere in the string
  const m = trimmed.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
  if (m) return m[1].trim();
  return trimmed;
}

// Detect the intended aspect ratio of a pasted embed snippet.
// Returns "9/16" for vertical (Shorts/Reel) embeds, "16/9" otherwise.
// Looks at `aspect-ratio:` declarations and explicit width/height attributes
// in the snippet — falls back to 16/9 when nothing is detected.
export function detectAspectRatio(input: string): "16/9" | "9/16" {
  if (!input) return "16/9";
  const s = input.toLowerCase();
  // aspect-ratio: 9/16 or 9 / 16 (with optional spaces)
  const ar = s.match(/aspect-ratio\s*:\s*(\d+)\s*\/\s*(\d+)/);
  if (ar) {
    const w = parseInt(ar[1], 10);
    const h = parseInt(ar[2], 10);
    if (w && h && h > w) return "9/16";
    return "16/9";
  }
  // width="X" height="Y" attributes
  const w = s.match(/\bwidth\s*=\s*["']?(\d+)/);
  const h = s.match(/\bheight\s*=\s*["']?(\d+)/);
  if (w && h) {
    const wn = parseInt(w[1], 10);
    const hn = parseInt(h[1], 10);
    if (wn && hn && hn > wn) return "9/16";
  }
  return "16/9";
}

export function parseVideo(url: string): ParsedVideo {
  if (!url) return { source: null, id: "" };
  url = extractEmbedUrl(url);
  try {
    const u = new URL(url.trim());
    const h = u.hostname.toLowerCase();

    if (h.includes("youtu.be")) {
      return { source: "youtube", id: u.pathname.slice(1).split("/")[0] };
    }
    if (h.includes("youtube.com")) {
      if (u.pathname.includes("/shorts/")) {
        return { source: "youtube", id: u.pathname.split("/shorts/")[1]?.split("/")[0] ?? "" };
      }
      if (u.pathname.includes("/embed/")) {
        return { source: "youtube", id: u.pathname.split("/embed/")[1]?.split("/")[0] ?? "" };
      }
      return { source: "youtube", id: u.searchParams.get("v") ?? "" };
    }

    if (h.includes("vimeo.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = [...parts].reverse().find((p) => /^\d+$/.test(p)) ?? "";
      return { source: "vimeo", id };
    }

    if (h.includes("drive.google.com")) {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      const id = m?.[1] ?? u.searchParams.get("id") ?? "";
      return { source: "drive", id };
    }

    if (h.includes("gumlet.io") || h.includes("gumlet.com") || h.includes("gumlet.tv")) {
      return { source: "gumlet", id: extractGumletId(u.pathname) };
    }
  } catch {
    const yt = url.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (yt) return { source: "youtube", id: yt[1] };
    const vm = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
    if (vm) return { source: "vimeo", id: vm[1] };
    const dr = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (dr) return { source: "drive", id: dr[1] };
    const gm = url.match(/(?:gumlet\.io|gumlet\.com|gumlet\.tv)\/(?:embed|v|watch)\/([a-zA-Z0-9]+)/);
    if (gm) return { source: "gumlet", id: gm[1] };
  }
  return { source: null, id: "" };
}

export function getEmbedUrl(url: string, opts: { autoplay?: boolean } = {}): string {
  const { source, id } = parseVideo(url);
  if (!id) return "";
  const ap = opts.autoplay ? 1 : 0;
  if (source === "youtube") return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&autoplay=${ap}&playsinline=1`;
  if (source === "vimeo") return `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0&autoplay=${ap}&playsinline=1`;
  // Google Drive ignores autoplay in its /preview URL, click-to-play still works inside the iframe.
  if (source === "drive") return `https://drive.google.com/file/d/${id}/preview?usp=sharing`;
  // Gumlet expects boolean strings: autoplay=true / autoplay=false (not 1/0).
  if (source === "gumlet") return `https://play.gumlet.io/embed/${id}?background=false&autoplay=${opts.autoplay ? "true" : "false"}&loop=false&disable_player_controls=false`;
  return "";
}

// Gumlet thumbnail URLs require the tenant ID (which we don't have from the
// embed URL alone). We proxy through our API which does an oEmbed lookup
// server-side and 302s to the real poster image.
import { API_BASE } from "@/lib/api";
function gumletThumbProxy(id: string): string {
  return `${API_BASE}/video-thumb?id=${encodeURIComponent(id)}`;
}

export function getThumbnail(url: string): string {
  const { source, id } = parseVideo(url);
  if (!id) return "";
  if (source === "youtube") return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  if (source === "vimeo") return `https://vumbnail.com/${id}.jpg`;
  // Modern Drive CDN — more reliable than drive.google.com/thumbnail (which often 403s)
  if (source === "drive") return `https://lh3.googleusercontent.com/d/${id}=w800`;
  if (source === "gumlet") return gumletThumbProxy(id);
  return "";
}

export function getHiResThumbnail(url: string): string {
  const { source, id } = parseVideo(url);
  if (!id) return "";
  if (source === "youtube") return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  if (source === "vimeo") return `https://vumbnail.com/${id}_large.jpg`;
  if (source === "drive") return `https://lh3.googleusercontent.com/d/${id}=w1600`;
  if (source === "gumlet") return gumletThumbProxy(id);
  return "";
}

// True for vertical short-form videos.
// Detects:
//  1. YouTube `/shorts/` URLs.
//  2. Any pasted embed snippet whose wrapper declares `aspect-ratio: 9/16`
//     (Gumlet, Vimeo, custom embeds all use this in their Share → Embed code
//     for vertical clips).
//  3. Pasted embed snippets with explicit width/height attributes where
//     height > width.
// Falls back to false (long-form / 16:9).
export function isShortVideo(url: string): boolean {
  if (!url) return false;
  // 1. Aspect-ratio detection works on the raw pasted snippet (which is what
  //    the admin actually saves for Gumlet etc.) — must run BEFORE we strip
  //    the snippet down to just the iframe `src`.
  if (detectAspectRatio(url) === "9/16") return true;
  // 2. URL-shape detection (YouTube Shorts).
  const inner = extractEmbedUrl(url);
  try {
    const u = new URL(inner.trim());
    if (u.hostname.toLowerCase().includes("youtube.com") && u.pathname.includes("/shorts/")) {
      return true;
    }
  } catch {
    if (/\/shorts\/[a-zA-Z0-9_-]{6,}/.test(inner)) return true;
  }
  return false;
}

export function sourceLabel(url: string): string {
  const { source } = parseVideo(url);
  if (source === "youtube") return "YouTube";
  if (source === "vimeo") return "Vimeo";
  if (source === "drive") return "Google Drive";
  if (source === "gumlet") return "Gumlet";
  return "";
}
