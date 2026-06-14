/**
 * Postbuild step for the Vercel SSR renderer (api/render.ts).
 *
 * Vite builds the SPA into dist/public (index.html + hashed assets). The
 * serverless renderer needs the BUILT index.html (with the correct hashed
 * <script>/<link> tags) as its template, so we copy it to dist/server/index.html
 * — the path bundled into the function via vercel.json "includeFiles".
 *
 * Two modes:
 *   (default / copy-only)  Copy the template, KEEP dist/public/index.html.
 *                          Vercel keeps serving the static shell via the SPA
 *                          rewrite — routing is unchanged. Used in Phase 1 so
 *                          the function can be deployed + verified at
 *                          /api/render?path=... with ZERO risk to the live site.
 *   (--activate)           Copy the template AND remove dist/public/index.html.
 *                          With index.html gone from the output root, "/" and
 *                          every SPA route fall through to the rewrite ->
 *                          /api/render, so all HTML is server-rendered with the
 *                          correct per-page meta + content. Static assets are
 *                          unaffected (Vercel serves real files first).
 *
 * Never edits index.html by hand — re-run the build instead.
 */
import { mkdirSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const publicHtml = resolve(root, "dist/public/index.html");
const serverDir = resolve(root, "dist/server");
const serverHtml = resolve(serverDir, "index.html");

const activate = process.argv.includes("--activate");

if (!existsSync(publicHtml)) {
  console.error(`[postbuild-ssr] ERROR: ${publicHtml} not found. Did 'vite build' run first?`);
  process.exit(1);
}

mkdirSync(serverDir, { recursive: true });
copyFileSync(publicHtml, serverHtml);
console.log(`[postbuild-ssr] copied template -> ${serverHtml}`);

if (activate) {
  rmSync(publicHtml, { force: true });
  console.log(
    `[postbuild-ssr] ACTIVATE: removed ${publicHtml} — all HTML routes now render via api/render`,
  );
} else {
  console.log(
    `[postbuild-ssr] copy-only: kept ${publicHtml} — routing unchanged (Phase 1)`,
  );
}
