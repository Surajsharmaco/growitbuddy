/**
 * Generates the static same-domain fallback sitemap at public/sitemap.xml from
 * the shared @workspace/seo registry — the single source of truth.
 *
 * The PRIMARY sitemap Google uses is the dynamic one served by the API
 * (growitbuddy-api.onrender.com/api/sitemap.xml), which respects live admin
 * index/sitemap toggles. This static file is only a fallback referenced from
 * robots.txt, so it lists every sitemap-eligible page without DB overrides.
 *
 * Run:  pnpm --filter @workspace/growitbuddy gen:sitemap
 * Never edit public/sitemap.xml by hand — re-run this script instead.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildSitemapXml } from "@workspace/seo";

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, "../public/sitemap.xml");

const lastmod = new Date().toISOString().split("T")[0];
const body = buildSitemapXml({ lastmod });

const header = `<!-- AUTO-GENERATED from @workspace/seo. Do not edit by hand. Run: pnpm --filter @workspace/growitbuddy gen:sitemap -->\n`;
const xml = body.replace(/^(<\?xml[^>]*>\n)/, `$1${header}`);

writeFileSync(outPath, xml, "utf8");
console.log(`Wrote ${outPath} (${(xml.match(/<url>/g) ?? []).length} urls, lastmod ${lastmod})`);
