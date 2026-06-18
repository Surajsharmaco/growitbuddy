// ── Super-admin "Backup / Migration" bundle builder ──────────────────────────
// Produces ONE flat ZIP that any AI (or developer) can ingest to fully
// understand and rebuild GrowitBuddy from scratch:
//   SOURCE_CODE/            -> the complete committed source (from GitHub)
//   START_HERE.md           -> orientation, read this first
//   _AI_HANDOFF/*.md|json   -> architecture, setup/deploy, env, database, prompt
//   _DATA/cms-content-snapshot.json -> sanitized snapshot of the live CMS content
//
// SECURITY: code is pulled from GitHub (committed files only) so the bundle can
// NEVER contain .env files, secrets, node_modules or .git. The DB snapshot is
// deliberately limited to public/CMS data — password hashes, CRM leads (PII),
// session tokens, internal logs and certificate emails are excluded by design.
import { zipSync, unzipSync, strToU8 } from "fflate";
import { logger } from "./logger";
import {
  db,
  siteContent,
  portfolioItems,
  portfolioShares,
  clientLogos,
  pageVariants,
  mediaFiles,
  certificates,
} from "@workspace/db";

export interface BackupMeta {
  repo: string;
  branch: string;
  sha: string;
  shortSha: string;
  commitMsg: string;
  commitDate: string;
  generatedAt: string;
}

// Sanitized snapshot of the public-facing CMS content. Anything sensitive is
// either excluded entirely (team_members, leads, revoked_tokens, admin logs) or
// has its sensitive columns dropped (media base64 blobs, certificate emails).
export async function buildContentSnapshot() {
  const [
    siteContentRows,
    portfolioRows,
    sharesRows,
    logoRows,
    variantRows,
    mediaRows,
    certRows,
  ] = await Promise.all([
    db.select().from(siteContent),
    db.select().from(portfolioItems),
    db.select().from(portfolioShares),
    db.select().from(clientLogos),
    db.select().from(pageVariants),
    db
      .select({
        id: mediaFiles.id,
        filename: mediaFiles.filename,
        mimetype: mediaFiles.mimetype,
        size: mediaFiles.size,
        url: mediaFiles.url,
        cloudinaryPublicId: mediaFiles.cloudinaryPublicId,
        uploadedAt: mediaFiles.uploadedAt,
      })
      .from(mediaFiles),
    db
      .select({
        id: certificates.id,
        certificateId: certificates.certificateId,
        name: certificates.name,
        role: certificates.role,
        issueDate: certificates.issueDate,
        status: certificates.status,
        remark: certificates.remark,
        isHidden: certificates.isHidden,
      })
      .from(certificates),
  ]);

  return {
    site_content: siteContentRows,
    portfolio_items: portfolioRows,
    portfolio_shares: sharesRows,
    client_logos: logoRows,
    page_variants: variantRows,
    media_files: mediaRows,
    certificates: certRows,
  };
}

export type ContentSnapshot = Awaited<ReturnType<typeof buildContentSnapshot>>;

type SnapshotCounts = {
  site_content: number;
  portfolio_items: number;
  portfolio_shares: number;
  client_logos: number;
  page_variants: number;
  media_files: number;
  certificates: number;
};

function countsOf(snapshot: ContentSnapshot): SnapshotCounts {
  return {
    site_content: snapshot.site_content.length,
    portfolio_items: snapshot.portfolio_items.length,
    portfolio_shares: snapshot.portfolio_shares.length,
    client_logos: snapshot.client_logos.length,
    page_variants: snapshot.page_variants.length,
    media_files: snapshot.media_files.length,
    certificates: snapshot.certificates.length,
  };
}

// Build all generated documentation files keyed by their path inside the ZIP.
export function buildHandoffDocs(
  meta: BackupMeta,
  snapshot: ContentSnapshot,
): Record<string, string> {
  const counts = countsOf(snapshot);

  const startHere = `# GrowitBuddy — Project Backup & AI Handoff Bundle

Generated: ${meta.generatedAt}
Source: ${meta.repo} @ branch \`${meta.branch}\` (commit \`${meta.shortSha}\`)
Latest commit: ${meta.commitMsg || "(n/a)"} — ${meta.commitDate || "(n/a)"}

## What this is
This single ZIP contains EVERYTHING needed to understand, run, and rebuild the
GrowitBuddy website. Hand it to any AI assistant (or developer) and they can
continue the project with zero extra explanation.

## What's inside
- \`SOURCE_CODE/\` — the complete project source code (every file committed to the
  repository). This is a pnpm monorepo containing the website, the API server,
  and shared libraries.
- \`START_HERE.md\` — this file.
- \`_AI_HANDOFF/AI_PROMPT.md\` — a ready-to-paste prompt that tells any AI exactly
  how to use this bundle.
- \`_AI_HANDOFF/ARCHITECTURE.md\` — how the whole system fits together.
- \`_AI_HANDOFF/SETUP_AND_DEPLOY.md\` — how to run it locally and how it deploys.
- \`_AI_HANDOFF/ENV_AND_CONNECTIONS.md\` — every environment variable / external
  connection (names and purpose only — never the secret values).
- \`_AI_HANDOFF/DATABASE.md\` — the database tables and what the snapshot contains.
- \`_AI_HANDOFF/MANIFEST.json\` — machine-readable summary of this bundle.
- \`_DATA/cms-content-snapshot.json\` — a snapshot of the live website content
  (editable CMS data) so the site can be recreated with its real content.

## Important notes
- The source code here is exactly what is committed to GitHub branch
  \`${meta.branch}\`, which is also what is deployed live. Any un-pushed
  development changes are NOT included until they are pushed to GitHub.
- For safety this bundle does NOT contain any secrets, API keys, passwords,
  password hashes, customer/lead personal data (CRM), session tokens, or
  internal logs. See \`_AI_HANDOFF/ENV_AND_CONNECTIONS.md\` for the list of
  secrets you must supply yourself to run the project.

## Quick start for a human
1. Unzip this file.
2. \`cd SOURCE_CODE\`
3. Read \`_AI_HANDOFF/SETUP_AND_DEPLOY.md\`.
4. \`pnpm install\`, set the required environment variables, then run the dev
   workflows.
`;

  const aiPrompt = `# Paste-this prompt for any AI assistant

You are taking over the GrowitBuddy project. This ZIP is the complete handoff
package. Work strictly from what is in it — do not invent files or guess.

## Steps
1. Read \`START_HERE.md\` (overview of the bundle).
2. Read everything in \`_AI_HANDOFF/\` in this order:
   ARCHITECTURE.md -> SETUP_AND_DEPLOY.md -> ENV_AND_CONNECTIONS.md -> DATABASE.md
3. Treat \`SOURCE_CODE/\` as the single source of truth for how the app works.
   It is a pnpm monorepo. Start from \`SOURCE_CODE/replit.md\`, the root
   \`package.json\`, and \`pnpm-workspace.yaml\` to learn the structure.
4. Use \`_DATA/cms-content-snapshot.json\` to understand / restore the real
   website content (the text, portfolio, logos, etc. shown on the live site).

## Project summary
GrowitBuddy is a marketing + creator-network website with a full admin/CMS panel
and a CRM. It is a pnpm monorepo:
- \`artifacts/growitbuddy\` — the public website AND the admin panel
  (React + Vite single-page app). Deployed on Vercel.
- \`artifacts/api-server\` — the backend REST API (Express). Deployed on Render.
- \`lib/*\` — shared libraries (database schema, OpenAPI/Zod contracts, SEO).
- Database: PostgreSQL (Neon) accessed via Drizzle ORM.

## Ground rules
- Follow the existing code patterns and conventions; match the monorepo layout.
- The API contract is defined in OpenAPI and code-generated — see ARCHITECTURE.md.
- Never hardcode secrets. Required secrets are listed (by name) in
  ENV_AND_CONNECTIONS.md and must be provided via environment variables.
- The live site auto-deploys from GitHub branch \`${meta.branch}\` (Vercel for the
  frontend, Render for the API).

State what you understand about the project, then ask what change is needed.
`;

  const architecture = `# Architecture

GrowitBuddy is a **pnpm monorepo** (Node.js 24, TypeScript). It is split into a
frontend website, a backend API, and shared libraries.

## Top-level layout (\`SOURCE_CODE/\`)
- \`artifacts/\` — deployable applications
  - \`growitbuddy/\` — the public website **and** the admin panel. A React + Vite
    single-page app (SPA). Also contains a small Vercel serverless function for
    server-side SEO meta injection (\`artifacts/growitbuddy/api/render.js\`).
  - \`api-server/\` — the backend REST API built with Express. Bundled by esbuild
    into \`dist/index.mjs\`.
- \`lib/\` — shared libraries (composite TypeScript packages):
  - \`db/\` — the Drizzle ORM schema and database client (the source of truth for
    every table). See DATABASE.md.
  - \`api-spec\` / \`api-zod\` — the OpenAPI contract and generated Zod schemas /
    React Query hooks. The contract is defined first, then code is generated.
  - \`seo/\` — shared SEO helpers (page list, sitemap, JSON-LD).
- \`scripts/\` — utility scripts.
- \`pnpm-workspace.yaml\`, \`tsconfig*.json\`, root \`package.json\` — workspace config.

## How the website works
- The frontend SPA (\`artifacts/growitbuddy/src\`) renders all public pages and the
  admin panel under \`/admin\`.
- Public pages read their content from the API (\`/api/admin/public/content/:section\`)
  so the site is fully editable from the admin CMS without code changes.
- SEO: on Vercel, all requests are routed through a serverless function
  (\`api/render.js\`, see \`vercel.json\` rewrites) that injects per-page meta tags
  (title, description, Open Graph, JSON-LD) into the HTML before serving the SPA.

## How the admin panel works
- Auth is a signed HMAC token (no third-party auth service). A "super admin" logs
  in with a password; "team members" log in with email + password and have a list
  of fine-grained permissions.
- The token is stored in the browser (\`localStorage\` key \`gb_admin_token\`) and
  sent as a \`Bearer\` token on every admin request.
- Access control is enforced on the **server** (see
  \`artifacts/api-server/src/routes/admin.ts\`): \`authMiddleware\` proves identity,
  \`superAdminOnly\` / \`requirePermission(...)\` enforce what each role may touch.
  The sidebar in the frontend is only a display mirror of these rules.

## How the API works
- Express app in \`artifacts/api-server/src\`. Routes are mounted under \`/api\`
  (e.g. admin routes live under \`/api/admin\`).
- Database access is via Drizzle ORM from the shared \`@workspace/db\` library.
- Logging uses pino (\`req.log\` inside requests, a singleton \`logger\` elsewhere).
- The API and frontend can run on the same origin (Replit/dev) or on separate
  origins (Render API + Vercel frontend); CORS is controlled by \`ALLOWED_ORIGINS\`.

## Data / content flow
Public visitor -> SPA -> GET \`/api/admin/public/content/:section\` -> Postgres.
Admin edits -> PUT \`/api/admin/content/:section\` -> Postgres -> public pages
re-fetch (cache headers are no-store so changes appear immediately).
`;

  const setupDeploy = `# Setup & Deploy

## Prerequisites
- Node.js 24+
- pnpm (this repo enforces pnpm; npm/yarn are blocked by a preinstall hook)
- A PostgreSQL database (the project uses Neon in production)

## Local / development
1. \`pnpm install\` at the repo root.
2. Provide the required environment variables (see ENV_AND_CONNECTIONS.md). At a
   minimum you need a Postgres connection string and the admin password.
3. Push the database schema (dev): \`pnpm --filter @workspace/db run push\`
4. Run the apps:
   - API:     \`pnpm --filter @workspace/api-server run dev\`
   - Website: \`pnpm --filter @workspace/growitbuddy run dev\`
5. Useful root commands:
   - \`pnpm run typecheck\` — typecheck every package
   - \`pnpm run build\` — typecheck + build all packages
   - \`pnpm --filter @workspace/api-spec run codegen\` — regenerate API hooks/Zod
     schemas from the OpenAPI spec

## Production deployment
The live site is split across two hosts and **auto-deploys from GitHub branch
\`${meta.branch}\`**:
- **Frontend (website + admin UI)** -> **Vercel**. Build: \`pnpm run build\`,
  output \`dist/public\`. \`vercel.json\` rewrites every route to the SSR/SEO
  serverless function (\`api/render.js\`). The frontend talks to the API using the
  \`VITE_API_URL\` build-time variable.
- **Backend (API)** -> **Render**. The Express server is bundled to
  \`dist/index.mjs\` and started with Node. It reads its Postgres connection and
  other secrets from environment variables.
- **Database** -> **Neon** (PostgreSQL).

Pushing to GitHub \`${meta.branch}\` triggers both Vercel and Render to redeploy.

## Notes
- The repository in this bundle is committed source only; you must run
  \`pnpm install\` to restore \`node_modules\`.
- The schema is managed with Drizzle. In production, apply schema changes
  deliberately (do not auto-push to the production database).
`;

  const envConnections = `# Environment variables & external connections

The bundle never contains secret VALUES. To run the project you must supply the
following environment variables yourself. Names and purpose only:

## Database
- \`DATABASE_URL\` (and/or \`NEON_DATABASE_URL\`) — PostgreSQL connection string
  (Neon in production). Required.

## Admin / security
- \`ADMIN_PASSWORD\` — the super-admin login password; also used as the secret that
  signs admin session tokens. Required for the admin panel.
- \`SESSION_SECRET\` — secret for session/cookie signing (if enabled).
- \`ALLOWED_ORIGINS\` — comma-separated list of origins allowed to call the API
  (CORS), needed when the frontend and API are on different domains.

## Media
- \`CLOUDINARY_URL\` — Cloudinary credentials for image/video uploads. Optional:
  if unset, uploads are stored as base64 in Postgres and served from the API.

## Email
- \`RESEND_API_KEY\` — Resend API key for transactional / notification emails.

## AI features
- \`OPENAI_API_KEY\` — used by the admin "Optimize" / SEO assistant features.

## Frontend build
- \`VITE_API_URL\` — the absolute URL of the API (e.g. the Render API origin +
  \`/api\`). Set at build time on Vercel. In local dev it falls back to a relative
  \`/api\` path.

## Deploy / ops
- \`GITHUB_TOKEN\` — used by the admin "deploy status" view and by this very
  backup feature to fetch the source code from GitHub.
- \`RENDER_DEPLOY_HOOK_URL\`, \`VERCEL_DEPLOY_HOOK_URL\` — optional deploy hooks the
  admin "redeploy" button can trigger.

## Runtime (provided by the host)
- \`PORT\`, \`BASE_PATH\`, \`NODE_ENV\` — set by the hosting platform / workflow.
`;

  const database = `# Database

The database is PostgreSQL (Neon in production), accessed via **Drizzle ORM**.
The schema is the source of truth and lives in \`SOURCE_CODE/lib/db/src/schema/\`.

## Tables
- \`site_content\` — all editable website content, keyed by section (the CMS).
- \`leads\` — CRM submissions from public forms (contact, applications, etc.).
- \`team_members\` — admin team accounts with permissions and password hashes.
- \`certificates\` — issued certificates (publicly verifiable by id).
- \`portfolio_items\` — portfolio / case-study entries.
- \`portfolio_shares\` — shareable filtered portfolio links.
- \`client_logos\` — client logo strip.
- \`influencers\` / network tables — creator-network data.
- \`page_variants\` — alternate versions of pages (A/B / audience variants).
- \`media_files\` — uploaded media metadata (and base64 blob when Cloudinary is off).
- \`revoked_tokens\` — invalidated admin session tokens.
- \`admin_action_logs\` — internal audit log of admin actions.

## What the content snapshot in this bundle contains
\`_DATA/cms-content-snapshot.json\` includes ONLY public / CMS data, with these row
counts at generation time:
- site_content: ${counts.site_content}
- portfolio_items: ${counts.portfolio_items}
- portfolio_shares: ${counts.portfolio_shares}
- client_logos: ${counts.client_logos}
- page_variants: ${counts.page_variants}
- media_files (metadata only, no file bytes): ${counts.media_files}
- certificates (without emails): ${counts.certificates}

## What is intentionally EXCLUDED (for privacy & security)
- \`team_members\` — contains password hashes.
- \`leads\` — customer/lead personal data (CRM PII).
- \`revoked_tokens\`, \`admin_action_logs\` — internal/security data.
- Media file binary blobs — only metadata + URLs are included.
- Certificate email addresses — personal data.

To restore content, insert the snapshot rows into the matching tables after
applying the Drizzle schema.
`;

  const manifest = JSON.stringify(
    {
      project: "GrowitBuddy",
      generatedAt: meta.generatedAt,
      source: {
        repo: meta.repo,
        branch: meta.branch,
        commitSha: meta.sha,
        commitShortSha: meta.shortSha,
        commitMessage: meta.commitMsg,
        commitDate: meta.commitDate,
        note: "Source is the committed code on this branch (also what is deployed live). Un-pushed dev changes are not included.",
      },
      includes: [
        "SOURCE_CODE/ (full committed source)",
        "START_HERE.md",
        "_AI_HANDOFF/AI_PROMPT.md",
        "_AI_HANDOFF/ARCHITECTURE.md",
        "_AI_HANDOFF/SETUP_AND_DEPLOY.md",
        "_AI_HANDOFF/ENV_AND_CONNECTIONS.md",
        "_AI_HANDOFF/DATABASE.md",
        "_AI_HANDOFF/MANIFEST.json",
        "_DATA/cms-content-snapshot.json",
      ],
      snapshotRowCounts: counts,
      excludedForSecurity: [
        "secrets / API keys / .env files",
        "team_members (password hashes)",
        "leads (CRM PII)",
        "revoked_tokens",
        "admin_action_logs",
        "media file binary blobs",
        "certificate emails",
        "node_modules / .git",
      ],
    },
    null,
    2,
  );

  return {
    "START_HERE.md": startHere,
    "_AI_HANDOFF/AI_PROMPT.md": aiPrompt,
    "_AI_HANDOFF/ARCHITECTURE.md": architecture,
    "_AI_HANDOFF/SETUP_AND_DEPLOY.md": setupDeploy,
    "_AI_HANDOFF/ENV_AND_CONNECTIONS.md": envConnections,
    "_AI_HANDOFF/DATABASE.md": database,
    "_AI_HANDOFF/MANIFEST.json": manifest,
  };
}

// ── Master AI prompt (single copy/paste / downloadable document) ─────────────
// A self-contained, comprehensive prompt that explains the WHOLE project to any
// AI, plus an embedded LIVE snapshot of the current website content. It is built
// fresh on every request (no GitHub call) so it always reflects the latest
// admin edits — i.e. it auto-updates whenever the website content changes.

export interface PromptMeta {
  repo: string;
  branch: string;
  generatedAt: string;
}

// Human/AI-readable summary of what is currently configured on the site, derived
// live from the snapshot so it changes automatically as the CMS is edited.
function contentSummary(snapshot: ContentSnapshot): string {
  const lines: string[] = [];

  const sections = snapshot.site_content.map((r) => r.section).sort();
  lines.push(
    `### Website content sections (${sections.length})`,
    sections.length ? sections.map((s) => `- \`${s}\``).join("\n") : "- (none yet)",
    "",
  );

  lines.push(`### Portfolio items (${snapshot.portfolio_items.length})`);
  if (snapshot.portfolio_items.length) {
    for (const p of [...snapshot.portfolio_items].sort((a, b) => a.sortOrder - b.sortOrder)) {
      lines.push(`- ${p.title} — ${p.category}${p.isHidden ? " (hidden)" : ""}`);
    }
  } else {
    lines.push("- (none yet)");
  }
  lines.push("");

  lines.push(`### Client logos (${snapshot.client_logos.length})`);
  if (snapshot.client_logos.length) {
    for (const l of [...snapshot.client_logos].sort((a, b) => a.sortOrder - b.sortOrder)) {
      lines.push(`- ${l.altText || `logo #${l.id}`}${l.enabled ? "" : " (disabled)"}`);
    }
  } else {
    lines.push("- (none yet)");
  }
  lines.push("");

  lines.push(`### Certificates (${snapshot.certificates.length})`);
  if (snapshot.certificates.length) {
    for (const c of snapshot.certificates) {
      lines.push(`- ${c.name} — ${c.role} (${c.status})${c.isHidden ? " (hidden)" : ""}`);
    }
  } else {
    lines.push("- (none yet)");
  }
  lines.push("");

  lines.push(`### Page variants (${snapshot.page_variants.length})`);
  if (snapshot.page_variants.length) {
    for (const v of snapshot.page_variants) {
      lines.push(`- ${v.label || v.slug} [/${v.slug}] from \`${v.sourceKey}\` (${v.isLive ? "LIVE" : "draft"})`);
    }
  } else {
    lines.push("- (none yet)");
  }
  lines.push("");

  lines.push(`### Media files (${snapshot.media_files.length}) — metadata only, no file bytes`);

  return lines.join("\n");
}

// Build the single comprehensive "master prompt" markdown document.
export function buildMasterPrompt(meta: PromptMeta, snapshot: ContentSnapshot): string {
  // Reuse the exact same factual docs the ZIP bundle ships, so the two can never
  // disagree. Only the branch is needed for these four sections.
  const docs = buildHandoffDocs(
    { repo: meta.repo, branch: meta.branch, sha: "", shortSha: "", commitMsg: "", commitDate: "", generatedAt: meta.generatedAt },
    snapshot,
  );
  const counts = countsOf(snapshot);
  const contentJson = JSON.stringify(snapshot, null, 2);

  const intro = `# GrowitBuddy — Complete Project Handoff Prompt

Generated: ${meta.generatedAt}
Live source repo: ${meta.repo} (branch \`${meta.branch}\`)

You are taking over the **GrowitBuddy** project. This single document is a complete
handoff: it explains exactly what the project is, how it is built, how it is
deployed, and includes a LIVE snapshot of the website's current content. Read it
fully before doing anything, then state your understanding and ask what change is
needed. Work strictly from the facts here — do not invent files, tables, or
behaviour.

## What GrowitBuddy is
GrowitBuddy is a marketing + creator-network website with a full admin/CMS panel
and a CRM. It is a **pnpm monorepo**:
- \`artifacts/growitbuddy\` — the public website AND the admin panel (React + Vite
  single-page app). Deployed on Vercel.
- \`artifacts/api-server\` — the backend REST API (Express). Deployed on Render.
- \`lib/*\` — shared libraries (database schema, OpenAPI/Zod contracts, SEO).
- Database: PostgreSQL (Neon) accessed via Drizzle ORM.

## How to get the actual source code
This prompt describes the project; it does not contain the code itself. The full,
up-to-date source is the committed code on GitHub: \`${meta.repo}\` (branch
\`${meta.branch}\`) — which is exactly what is deployed live. The admin panel's
"Backup / Migration" page can also download a ZIP containing the entire source.`;

  const groundRules = `## Ground rules
- Follow the existing code patterns and conventions; match the monorepo layout.
- The API contract is defined in OpenAPI and code-generated — see the Architecture
  section above and \`lib/api-spec\`.
- Never hardcode secrets. Required secrets are listed (by name only) in the
  Environment section above and must be provided via environment variables.
- The live site auto-deploys from GitHub branch \`${meta.branch}\` (Vercel for the
  frontend, Render for the API). Pushing to that branch redeploys both.
- Access control is enforced on the server; the admin sidebar only mirrors it.

After reading everything, summarise what you understand about GrowitBuddy, then ask
what needs to be done.`;

  const liveContent = `## LIVE website content (current snapshot)

This is a snapshot of the real, current content of the website, taken at
${meta.generatedAt}. It auto-updates: regenerate this prompt any time and it will
reflect the latest admin edits. Sensitive data (secrets, CRM leads/PII, password
hashes, internal logs, certificate emails, media binary blobs) is intentionally
excluded.

Row counts: site_content=${counts.site_content}, portfolio_items=${counts.portfolio_items}, portfolio_shares=${counts.portfolio_shares}, client_logos=${counts.client_logos}, page_variants=${counts.page_variants}, media_files=${counts.media_files}, certificates=${counts.certificates}.

${contentSummary(snapshot)}

### Full content snapshot (JSON)
Use this to understand or restore the exact current content. Insert these rows into
the matching tables (after applying the Drizzle schema) to recreate the site's content.

\`\`\`json
${contentJson}
\`\`\``;

  return [
    intro,
    docs["_AI_HANDOFF/ARCHITECTURE.md"],
    docs["_AI_HANDOFF/SETUP_AND_DEPLOY.md"],
    docs["_AI_HANDOFF/ENV_AND_CONNECTIONS.md"],
    docs["_AI_HANDOFF/DATABASE.md"],
    liveContent,
    groundRules,
  ].join("\n\n---\n\n");
}

// Safety caps for the GitHub source archive. The source is our own repo behind a
// super-admin gate, but we still bound the work so a huge or pathological (zip
// bomb) archive can never exhaust memory or block the event loop. originalSize
// is read from the zip directory WITHOUT decompressing, so the cap is enforced
// before any inflation happens.
const MAX_ENTRIES = 50_000;
const MAX_UNCOMPRESSED_BYTES = 500 * 1024 * 1024; // 500 MB expanded

// Files that must never end up in the bundle even if (mis)committed to the repo.
// node_modules/.git are already absent from a zipball, but a stray secret file
// (e.g. a committed .env or private key) would be — so we drop them defensively.
// Example/sample env templates are allowed since they contain no real values.
const SECRET_FILE =
  /(^|\/)(\.env(\.[^/]+)?|[^/]*\.(pem|key|p12|pfx|keystore|jks|asc)|id_(rsa|dsa|ecdsa|ed25519))$/i;
const SECRET_FILE_ALLOW = /\.env\.(example|sample|template|dist|defaults?)$/i;

// Unzip the GitHub source archive (which nests everything under a single
// "<owner>-<repo>-<sha>/" folder), flatten it under SOURCE_CODE/, then add the
// generated text files, and produce one final ZIP buffer.
export function assembleBackupZip(
  githubZip: Buffer,
  files: Record<string, string>,
): Buffer {
  let entryCount = 0;
  let totalUncompressed = 0;
  const unzipped = unzipSync(new Uint8Array(githubZip), {
    filter: (file) => {
      entryCount++;
      if (entryCount > MAX_ENTRIES) {
        throw new Error(`Source archive has too many files (> ${MAX_ENTRIES}).`);
      }
      totalUncompressed += file.originalSize;
      if (totalUncompressed > MAX_UNCOMPRESSED_BYTES) {
        throw new Error("Source archive is too large when expanded.");
      }
      return true;
    },
  });

  const out: Record<string, Uint8Array> = {};
  let skippedSecrets = 0;

  for (const [entryPath, data] of Object.entries(unzipped)) {
    if (entryPath.endsWith("/")) continue; // directory entry
    const rel = entryPath.replace(/^[^/]+\//, ""); // strip the top-level folder
    if (!rel) continue;
    if (SECRET_FILE.test(rel) && !SECRET_FILE_ALLOW.test(rel)) {
      skippedSecrets++;
      continue; // never bundle secret-like files
    }
    out[`SOURCE_CODE/${rel}`] = data;
  }

  if (skippedSecrets > 0) {
    logger.warn({ skippedSecrets }, "backup: omitted secret-like files from source bundle");
  }

  for (const [name, content] of Object.entries(files)) {
    out[name] = strToU8(content);
  }

  return Buffer.from(zipSync(out, { level: 6 }));
}
