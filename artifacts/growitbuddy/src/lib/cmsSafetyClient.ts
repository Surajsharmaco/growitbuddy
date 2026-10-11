import type { BlogPost } from "@/data/blogPosts";
import { API_BASE } from "@/lib/api";

export type CmsCollection = {
  data: { posts: BlogPost[]; tocInitialVisible?: number };
  versions: Record<string, string>;
  tocVersion: string;
};
export type CmsOperation = {
  type: "upsert" | "delete" | "patch";
  previousSlug: string;
  expectedVersion: string | null;
  post?: BlogPost;
  patch?: Record<string, unknown>;
};
export async function cmsRequest<T>(
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
  path: string, method = "GET", body?: unknown,
): Promise<T> {
  const response = await authFetch(`${API_BASE}/admin/cms${path}`, {
    method, headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? `CMS request failed (${response.status}).`);
  return result as T;
}
export function notifyCmsChanged(section: string) {
  try { localStorage.setItem("gb-content-updated", `${section}|${Date.now()}`); } catch { /* Optional cross-tab signal. */ }
  window.dispatchEvent(new CustomEvent("gb:content-changed", { detail: { section } }));
}
