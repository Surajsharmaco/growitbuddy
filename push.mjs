#!/usr/bin/env node
import { execSync } from "child_process";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "Surajsharmaco/growitbuddy";
const BRANCH = "main";

if (!GITHUB_TOKEN) {
  console.error("ERROR: GITHUB_TOKEN secret set nahi hai. Replit Secrets mein daalo phir dobara chalao.");
  process.exit(1);
}

const commitMsg = process.argv[2] || "chore: update from replit";

try {
  execSync("git add -A", { stdio: "inherit" });
  const status = execSync("git status --porcelain").toString().trim();
  if (!status) {
    console.log("Koi naya change nahi - already up to date.");
    process.exit(0);
  }
  console.log("Changed files:\n" + status + "\n");
} catch (e) {
  console.error("git add failed:", e.message);
  process.exit(1);
}

try {
  execSync(
    `git -c user.email="replit@growitbuddy.com" -c user.name="Replit Dev" commit -m "${commitMsg}"`,
    { stdio: "inherit" }
  );
} catch (e) {
  console.error("git commit failed:", e.message);
  process.exit(1);
}

try {
  execSync(
    `git push https://${GITHUB_TOKEN}@github.com/${REPO}.git HEAD:${BRANCH}`,
    { stdio: "inherit" }
  );
  console.log("\nPush ho gaya! Vercel + Render dono deploy ho rahe hain.");
  console.log("GitHub commits: https://github.com/" + REPO + "/commits/" + BRANCH);
} catch (e) {
  console.error("Push failed:", e.message);
  process.exit(1);
}
