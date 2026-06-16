/**
 * Drift check: fails when the committed static fallback sitemap
 * (public/sitemap.xml) no longer matches what the shared @workspace/seo
 * registry would generate. This is the guardrail that keeps the single source
 * of truth honest — if someone adds, renames, or removes a page in
 * lib/seo/src/index.ts but forgets to regenerate the static sitemap, CI/this
 * check flags it instead of silently shipping a stale SEO file.
 *
 * Run:  pnpm --filter @workspace/growitbuddy check:sitemap
 * Fix:  pnpm --filter @workspace/growitbuddy gen:sitemap
 *
 * `<lastmod>` dates are ignored so only real list drift (paths / priority /
 * changefreq) trips the check, not the daily date stamp.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildSitemapXml } from "@workspace/seo";

const here = dirname(fileURLToPath(import.meta.url));
const staticPath = resolve(here, "../public/sitemap.xml");

/** Mirror generate-sitemap.ts so the comparison matches the generator output. */
function expectedXml(lastmod: string): string {
  const body = buildSitemapXml({ lastmod });
  const header = `<!-- AUTO-GENERATED from @workspace/seo. Do not edit by hand. Run: pnpm --filter @workspace/growitbuddy gen:sitemap -->\n`;
  return body.replace(/^(<\?xml[^>]*>\n)/, `$1${header}`);
}

/** Strip <lastmod> lines and trailing whitespace so dates don't cause false drift. */
function normalize(xml: string): string {
  return xml
    .split("\n")
    .filter((line) => !line.trim().startsWith("<lastmod>"))
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

let committed: string;
try {
  committed = readFileSync(staticPath, "utf8");
} catch {
  console.error(`✗ Static sitemap not found at ${staticPath}`);
  console.error("  Run: pnpm --filter @workspace/growitbuddy gen:sitemap");
  process.exit(1);
}

const expected = expectedXml("0000-00-00");

if (normalize(committed) !== normalize(expected)) {
  console.error("✗ public/sitemap.xml has drifted from the @workspace/seo page registry.");
  console.error("  The page list (paths / priority / changefreq) no longer matches.");
  console.error("  Run: pnpm --filter @workspace/growitbuddy gen:sitemap");
  process.exit(1);
}

console.log("✓ public/sitemap.xml is in sync with the @workspace/seo page registry.");
