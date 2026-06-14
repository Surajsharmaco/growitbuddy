// Runs on Vercel (and locally) AFTER `vite build`, via the package "build" script.
// Reads the freshly-built dist/public/index.html — which carries THIS build's own
// hashed asset tags — and writes api/_template.js, the module imported by the
// prebuilt api/render.js serverless function.
//
// WHY: the function must serve an HTML shell that references the SAME hashed
// assets this build produced. Baking the template locally fails, because Vercel's
// build can produce a different content hash than a local build. Generating the
// template here, from the build's own output, makes the hash always correct.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(path.join(pkg, "dist/public/index.html"), "utf8");
writeFileSync(
  path.join(pkg, "api/_template.js"),
  `// GENERATED at build time from dist/public/index.html — do not edit by hand.\nexport const TEMPLATE = ${JSON.stringify(html)};\n`,
);
const asset = (html.match(/assets\/index-[A-Za-z0-9_-]+\.js/) || ["?"])[0];
console.log(`api/_template.js written (${html.length} bytes, asset ${asset})`);
