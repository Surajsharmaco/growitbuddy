import { neon } from "@neondatabase/serverless";
import type { LiveSitemapPolicy } from "@workspace/seo";

function posts<T>(value: unknown): T[] {
  const data = value as { posts?: unknown } | null;
  return Array.isArray(data?.posts) ? data.posts as T[] : [];
}

/** Load fresh authoritative policy. No defaults/cached success after a read failure. */
export async function loadLiveSitemapPolicy(dbUrl: string | undefined, apiBase: string | undefined): Promise<LiveSitemapPolicy> {
  if (dbUrl) {
    try {
      const sql = neon(dbUrl, { fetchOptions: { signal: AbortSignal.timeout(20_000) } });
      const rows = await sql`
        SELECT section, data FROM site_content
        WHERE section IN ('seo-global', 'page_visibility', 'blog', 'cms-pages') OR section LIKE 'seo:%'
      ` as Array<{ section: string; data: unknown }>;
      const variants = await sql`SELECT slug, source_key AS "sourceKey" FROM page_variants WHERE is_live = true` as LiveSitemapPolicy["variants"];
      const data = Object.fromEntries(rows.map(row => [row.section, row.data]));
      return {
        globalIndexable: (data["seo-global"] as { siteIndexable?: boolean } | null)?.siteIndexable !== false,
        seo: Object.fromEntries(rows.filter(row => row.section.startsWith("seo:")).map(row => [row.section.slice(4), row.data])) as LiveSitemapPolicy["seo"],
        visibility: (data.page_visibility ?? {}) as LiveSitemapPolicy["visibility"],
        posts: posts(data.blog), cmsPages: posts(data["cms-pages"]), variants,
      };
    } catch {
      // Existing direct-DB deployments may use the public API as secondary source.
    }
  }
  if (!apiBase) throw new Error("No authoritative sitemap data source is configured");
  const base = apiBase.replace(/\/+$/, "");
  async function get(path: string): Promise<unknown> {
    const response = await fetch(base + path, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`Sitemap source HTTP ${response.status}`);
    return response.json();
  }
  const [rawSeo, rawContent, rawVariants] = await Promise.all([
    get("/seo"),
    get("/admin/public/content-bulk?sections=page_visibility,blog,cms-pages"),
    get("/admin/public/variants"),
  ]);
  const seo = rawSeo as { global?: { siteIndexable?: boolean }; pages?: LiveSitemapPolicy["seo"] };
  const content = rawContent as { data?: Record<string, unknown> };
  if (typeof seo.global?.siteIndexable !== "boolean" || !seo.pages || !content.data ||
    ["page_visibility", "blog", "cms-pages"].some(key => !Object.prototype.hasOwnProperty.call(content.data, key)) ||
    !Array.isArray(rawVariants)) throw new Error("Incomplete authoritative sitemap policy");
  return {
    globalIndexable: seo.global.siteIndexable,
    seo: seo.pages,
    visibility: (content.data.page_visibility ?? {}) as LiveSitemapPolicy["visibility"],
    posts: posts(content.data.blog), cmsPages: posts(content.data["cms-pages"]),
    variants: rawVariants as LiveSitemapPolicy["variants"],
  };
}