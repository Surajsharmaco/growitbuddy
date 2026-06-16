// Central API base URL - supports both Replit (same-origin proxy) and
// split-deploy (Render API + Vercel frontend).
//
// On Vercel: set VITE_API_URL=https://growitbuddy-api.onrender.com/api
// On Replit / local dev: falls back to relative /api path via BASE_URL
export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  (import.meta.env.BASE_URL.replace(/\/$/, "") + "/api");

// Resolve a potentially-relative /api/... URL to an absolute one.
// Needed when API and frontend are on different domains (e.g. Render + Vercel).
export function resolveMediaUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) return url;
  if (url.startsWith("/api/")) {
    // Strip trailing /api from API_BASE to get the API origin, then append the path
    const origin = API_BASE.replace(/\/api\/?$/, "");
    return origin + url;
  }
  return url;
}
