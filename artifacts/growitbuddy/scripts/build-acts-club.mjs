import { cp, mkdir, readFile, rm, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const workspaceRoot = path.resolve(packageRoot, "../..");
const actsClubRoot = path.join(workspaceRoot, "artifacts", "acts-club");
const actsClubBuild = path.join(actsClubRoot, "dist", "public");
const deploymentPath = path.join(packageRoot, "dist", "public", "acts-club");

const result = spawnSync(
  "pnpm",
  ["--filter", "@workspace/acts-club", "run", "build"],
  {
    cwd: workspaceRoot,
    env: {
      ...process.env,
      PORT: process.env.PORT ?? "4174",
      BASE_PATH: "/acts-club/",
    },
    stdio: "inherit",
  },
);

if (result.error) throw result.error;
if (result.status !== 0) {
  throw new Error(
    `ACTS Club build failed${result.signal ? ` (${result.signal})` : ""}.`,
  );
}

const html = await readFile(path.join(actsClubBuild, "index.html"), "utf8");
if (!html.includes("/acts-club/assets/")) {
  throw new Error(
    "ACTS Club build is missing the /acts-club/ asset base path.",
  );
}

await stat(path.join(actsClubBuild, "img", "hero.jpg"));
await rm(deploymentPath, { recursive: true, force: true });
await mkdir(path.dirname(deploymentPath), { recursive: true });
await cp(actsClubBuild, deploymentPath, { recursive: true });

console.log(`Packaged ACTS Club landing page at ${deploymentPath}`);