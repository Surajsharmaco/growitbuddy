import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const output = fileURLToPath(new URL("../dist/acts-membership.test.mjs", import.meta.url));
await build({
  entryPoints: [fileURLToPath(new URL("./acts-membership.test.ts", import.meta.url))],
  outfile: output, bundle: true, platform: "node", format: "esm",
  external: ["express", "pg-native"],
  banner: { js: "import { createRequire as fixtureRequire } from 'node:module'; globalThis.require = fixtureRequire(import.meta.url);" },
});
const result = spawnSync(process.execPath, ["--test", output], { stdio: "inherit" });
await rm(output, { force: true });
process.exit(result.status ?? 1);