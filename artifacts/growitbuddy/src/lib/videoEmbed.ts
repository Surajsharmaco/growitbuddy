export type VideoSource = "youtube" | "vimeo" | "drive" | null;

export interface ParsedVideo {
  source: VideoSource;
  id: string;
}

export function parseVideo(url: string): ParsedVideo {
  if (!url) return { source: null, id: "" };
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
  } catch {
    const yt = url.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (yt) return { source: "youtube", id: yt[1] };
    const vm = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
    if (vm) return { source: "vimeo", id: vm[1] };
    const dr = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (dr) return { source: "drive", id: dr[1] };
  }
  return { source: null, id: "" };
}

export function getEmbedUrl(url: string): string {
  const { source, id } = parseVideo(url);
  if (!id) return "";
  if (source === "youtube") return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
  if (source === "vimeo") return `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`;
  if (source === "drive") return `https://drive.google.com/file/d/${id}/preview?usp=sharing`;
  return "";
}

export function getThumbnail(url: string): string {
  const { source, id } = parseVideo(url);
  if (!id) return "";
  if (source === "youtube") return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  if (source === "vimeo") return `https://vumbnail.com/${id}.jpg`;
  if (source === "drive") return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
  return "";
}

export function getHiResThumbnail(url: string): string {
  const { source, id } = parseVideo(url);
  if (!id) return "";
  if (source === "youtube") return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  if (source === "vimeo") return `https://vumbnail.com/${id}_large.jpg`;
  if (source === "drive") return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
  return "";
}

export function sourceLabel(url: string): string {
  const { source } = parseVideo(url);
  if (source === "youtube") return "YouTube";
  if (source === "vimeo") return "Vimeo";
  if (source === "drive") return "Google Drive";
  return "";
}
