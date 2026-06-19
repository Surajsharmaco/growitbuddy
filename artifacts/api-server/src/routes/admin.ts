import { Router } from "express";
import { randomBytes, createHmac, timingSafeEqual, scrypt, randomUUID } from "crypto";
import { db, pool, siteContent, leads, certificates, teamMembers, portfolioItems, portfolioShares, clientLogos, revokedTokens as revokedTokensTable, adminActionLogs, mediaFiles, pageVariants } from "@workspace/db";
import { eq, desc, count, asc, lt } from "drizzle-orm";
import { logger } from "../lib/logger";
import { cloudinaryConfigured, uploadToCloudinary } from "../lib/cloudinary";
import { convertImageBuffer, type ConvertFormat } from "../lib/imageConvert";
import { buildContentSnapshot, buildHandoffDocs, assembleBackupZip, buildMasterPrompt, type BackupMeta } from "../lib/backup";
import { buildBlogExport } from "../lib/blogExport";
import { buildContentArchive } from "../lib/contentArchive";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── All uploads stored in the database (no external service needed) ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) cb(null, true);
    else cb(new Error("Only image and video files are allowed"));
  },
});

let warnedCloudinaryUnconfigured = false;

async function saveFileToDb(file: Express.Multer.File): Promise<{ id: number; url: string }> {
  if (cloudinaryConfigured()) {
    try {
      const { url, publicId } = await uploadToCloudinary(file.buffer, file.mimetype);
      const rows = await db.insert(mediaFiles).values({
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        data: null,
        url,
        cloudinaryPublicId: publicId,
      }).returning({ id: mediaFiles.id });
      return { id: rows[0].id, url };
    } catch (err) {
      logger.error({ err }, "Cloudinary upload failed; falling back to DB storage");
    }
  } else if (!warnedCloudinaryUnconfigured) {
    // Log once: when Cloudinary is unconfigured, uploads are stored as base64 in
    // Postgres and served from a relative /api/media/file/:id URL. On a split
    // frontend+API deploy the public site MUST resolve that to the API origin
    // (see resolveMediaUrl) or images will 404. This warning surfaces the
    // misconfiguration in production logs instead of failing silently.
    warnedCloudinaryUnconfigured = true;
    logger.warn(
      "CLOUDINARY not configured — uploaded media is stored in the database and served from relative /api/media URLs. Set CLOUDINARY_URL for CDN-backed uploads.",
    );
  }
  const b64 = file.buffer.toString("base64");
  const rows = await db.insert(mediaFiles).values({
    filename: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    data: b64,
  }).returning({ id: mediaFiles.id });
  const id = rows[0].id;
  return { id, url: `/api/media/file/${id}` };
}

const router = Router();

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

async function isTokenRevoked(token: string): Promise<boolean> {
  try {
    const rows = await db.select().from(revokedTokensTable).where(eq(revokedTokensTable.token, token)).limit(1);
    return rows.length > 0;
  } catch { return false; }
}

async function revokeToken(token: string, expiresAt: Date): Promise<void> {
  try {
    await db.insert(revokedTokensTable).values({ token, expiresAt }).onConflictDoNothing();
    // Purge expired revoked tokens to keep table lean
    await db.delete(revokedTokensTable).where(lt(revokedTokensTable.expiresAt, new Date()));
  } catch { /* non-fatal */ }
}

type AdminRole = "super" | "member";

interface TokenPayload {
  role: AdminRole;
  permissions: string[];
}

function getSecret(): string {
  return process.env.ADMIN_PASSWORD ?? randomBytes(16).toString("hex");
}

function generateToken(role: AdminRole, permissions: string[]): string {
  const expiry = String(Date.now() + SESSION_TTL);
  const nonce = randomBytes(8).toString("hex");
  const permsB64 = Buffer.from(JSON.stringify(permissions)).toString("base64url");
  const payload = `${expiry}.${nonce}.${role}.${permsB64}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

// Sync revocation check is done via DB in authMiddleware; this handles format + expiry only
function verifyTokenFormat(token: string): { valid: false } | ({ valid: true } & TokenPayload) {
  const parts = token.split(".");

  if (parts.length === 5) {
    const [expiry, nonce, role, permsB64, sig] = parts;
    const expMs = Number(expiry);
    if (isNaN(expMs) || Date.now() > expMs) return { valid: false };
    const payload = `${expiry}.${nonce}.${role}.${permsB64}`;
    const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");
    const eSig = Buffer.from(sig, "hex");
    const eExp = Buffer.from(expected, "hex");
    if (eSig.length !== eExp.length) return { valid: false };
    if (!timingSafeEqual(eSig, eExp)) return { valid: false };
    let permissions: string[] = [];
    try {
      permissions = JSON.parse(Buffer.from(permsB64, "base64url").toString());
    } catch {
      return { valid: false };
    }
    return { valid: true, role: role as AdminRole, permissions };
  }

  if (parts.length === 3) {
    const [expiry, nonce, sig] = parts;
    const expMs = Number(expiry);
    if (isNaN(expMs) || Date.now() > expMs) return { valid: false };
    const payload = `${expiry}.${nonce}`;
    const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");
    const eSig = Buffer.from(sig, "hex");
    const eExp = Buffer.from(expected, "hex");
    if (eSig.length !== eExp.length) return { valid: false };
    if (!timingSafeEqual(eSig, eExp)) return { valid: false };
    return { valid: true, role: "super", permissions: ["all"] };
  }

  return { valid: false };
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key)));
  });
  return `${salt}:${hash.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key)));
  });
  if (derivedKey.length !== hashBuffer.length) return false;
  return timingSafeEqual(derivedKey, hashBuffer);
}

declare global {
  namespace Express {
    interface Request {
      adminRole?: AdminRole;
      adminPermissions?: string[];
    }
  }
}

async function authMiddleware(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction,
) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = auth.slice(7);
  const result = verifyTokenFormat(token);
  if (!result.valid) {
    res.status(401).json({ error: "Session expired or invalid" });
    return;
  }
  const revoked = await isTokenRevoked(token);
  if (revoked) {
    res.status(401).json({ error: "Session expired or invalid" });
    return;
  }
  req.adminRole = result.role;
  req.adminPermissions = result.permissions;
  next();
}

function superAdminOnly(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction,
) {
  // AUTHORITATIVE super-only gate. We check the role directly (NOT isSuperReq):
  // a team member must never reach super-only routes (team management, page
  // variants, backup/export) even if their permission list happens to contain
  // the wildcard "all". "all" is a super-login implementation detail only.
  if (req.adminRole !== "super") {
    res.status(403).json({ error: "Super admin access required" });
    return;
  }
  next();
}

// ── Permission-based authorization (server-side; AUTHORITATIVE) ──────────────
// authMiddleware only proves identity. These helpers enforce WHAT a team member
// may touch. The frontend AdminLayout.tsx navGroups is a DISPLAY mirror only and
// must never be the sole gate. Super admins (role "super" / perms ["all"]) bypass
// every check. Fail-closed: a member lacking the required permission gets 403.
function isSuperReq(req: import("express").Request): boolean {
  return req.adminRole === "super" || (req.adminPermissions?.includes("all") ?? false);
}

function hasPermission(req: import("express").Request, permission: string): boolean {
  if (isSuperReq(req)) return true;
  return req.adminPermissions?.includes(permission) ?? false;
}

// Resolve a CMS content section key to the permission required to read/edit it.
// Most section keys equal their permission name (identity); the few that differ
// are listed below. "__super__" marks sections only super admins may touch.
const SECTION_PERMISSION_OVERRIDES: Record<string, string> = {
  fulltime: "full-time",
  joinnetwork: "join-network",
};
function sectionToPermission(section: string): string {
  if (section === "page_visibility") return "__super__"; // page show/hide is super-only
  if (section.includes("__v__")) return "__super__"; // page variants are super-only
  if (section.startsWith("seo:") || section === "seo-global") return "__super__"; // SEO records
  if (section.startsWith("pool-") || section.endsWith("-pool")) return "creator-school"; // talent pools
  return SECTION_PERMISSION_OVERRIDES[section] ?? section; // identity for the rest
}

// Gate a route on a single fixed permission.
function requirePermission(permission: string) {
  return (
    req: import("express").Request,
    res: import("express").Response,
    next: import("express").NextFunction,
  ): void => {
    if (hasPermission(req, permission)) { next(); return; }
    logger.warn({ permission, role: req.adminRole }, "Admin permission denied");
    res.status(403).json({ error: "You don't have permission to access this." });
  };
}

// Gate a CMS content route by its :section param.
function requireSectionPermission(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction,
): void {
  if (isSuperReq(req)) { next(); return; }
  const section = String(req.params.section);
  const perm = sectionToPermission(section);
  if (perm === "__super__") {
    res.status(403).json({ error: "This section is restricted to super admins." });
    return;
  }
  if (req.adminPermissions?.includes(perm)) { next(); return; }
  logger.warn({ section, perm, role: req.adminRole }, "Admin permission denied for content section");
  res.status(403).json({ error: "You don't have permission to edit this section." });
}

// ── Auth ──

router.post("/login", (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.status(500).json({ error: "ADMIN_PASSWORD env var not set" });
    return;
  }
  if (password !== adminPassword) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }
  const token = generateToken("super", ["all"]);
  logger.info("Super admin login successful");
  res.json({ token, role: "super", permissions: ["all"] });
});

router.post("/team/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  try {
    const rows = await db.select().from(teamMembers).where(eq(teamMembers.email, email.toLowerCase().trim()));
    if (rows.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const member = rows[0];
    if (!member.isActive) {
      res.status(401).json({ error: "Account is disabled" });
      return;
    }
    const valid = await verifyPassword(password, member.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = generateToken("member", member.permissions as string[]);
    logger.info({ email }, "Team member login successful");
    res.json({ token, role: "member", name: member.name, permissions: member.permissions });
  } catch (err) {
    logger.error({ err }, "Team login error");
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", authMiddleware, async (req, res) => {
  const token = req.headers.authorization?.slice(7);
  if (token) {
    const parts = token.split(".");
    const expiryMs = Number(parts[0]);
    const expiresAt = !isNaN(expiryMs) ? new Date(expiryMs) : new Date(Date.now() + SESSION_TTL);
    await revokeToken(token, expiresAt);
  }
  res.json({ success: true });
});

router.get("/verify", authMiddleware, (req, res) => {
  res.json({ ok: true, role: (req as any).adminRole, permissions: (req as any).adminPermissions });
});

// ── Team Members (super admin only) ──

router.get("/team", authMiddleware, superAdminOnly, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: teamMembers.id,
        name: teamMembers.name,
        email: teamMembers.email,
        permissions: teamMembers.permissions,
        isActive: teamMembers.isActive,
        createdAt: teamMembers.createdAt,
        updatedAt: teamMembers.updatedAt,
      })
      .from(teamMembers)
      .orderBy(desc(teamMembers.createdAt));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to list team members");
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

router.post("/team", authMiddleware, superAdminOnly, async (req, res) => {
  const { name, email, password, permissions } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email, and password are required" });
    return;
  }
  try {
    const passwordHash = await hashPassword(password);
    const rows = await db
      .insert(teamMembers)
      .values({
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        permissions: permissions ?? [],
        isActive: true,
      })
      .returning();
    logger.info({ email }, "Team member created");
    const { passwordHash: _ph, ...safe } = rows[0];
    res.status(201).json(safe);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? (err as { cause?: { code?: string } }).cause?.code;
    if (code === "23505") {
      res.status(409).json({ error: "A team member with that email already exists" });
    } else {
      logger.error({ err }, "Failed to create team member");
      res.status(500).json({ error: "Failed to create team member" });
    }
  }
});

router.put("/team/:id", authMiddleware, superAdminOnly, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name, permissions, isActive, password } = req.body;
  try {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) updateData.passwordHash = await hashPassword(password);
    const rows = await db
      .update(teamMembers)
      .set(updateData)
      .where(eq(teamMembers.id, id))
      .returning();
    if (rows.length === 0) { res.status(404).json({ error: "Team member not found" }); return; }
    logger.info({ id }, "Team member updated");
    const { passwordHash: _ph, ...safe } = rows[0];
    res.json(safe);
  } catch (err) {
    logger.error({ err }, "Failed to update team member");
    res.status(500).json({ error: "Failed to update team member" });
  }
});

router.delete("/team/:id", authMiddleware, superAdminOnly, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(teamMembers).where(eq(teamMembers.id, id));
  logger.info({ id }, "Team member deleted");
  res.json({ success: true });
});

// ── Page Variants — duplicate any source page at a new URL with its own content ──
// Variant content is stored in site_content under key `${sourceKey}__v__${slug}`.
function variantKey(sourceKey: string, slug: string) { return `${sourceKey}__v__${slug}`; }
function isSafeSlug(s: string) { return /^[a-z0-9][a-z0-9-]{0,79}$/.test(s); }

// Public: list LIVE variants only (slug -> sourceKey resolver for frontend router).
router.get("/public/variants", async (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  try {
    const rows = await db.select({
      slug: pageVariants.slug, sourceKey: pageVariants.sourceKey, label: pageVariants.label,
    }).from(pageVariants).where(eq(pageVariants.isLive, true));
    res.json(rows);
  } catch { res.json([]); }
});

// Admin: list ALL variants (including hidden — admin needs these for editing).
router.get("/variants", authMiddleware, superAdminOnly, async (_req, res) => {
  const rows = await db.select().from(pageVariants).orderBy(desc(pageVariants.createdAt));
  res.json(rows);
});

// Admin: create variant. Optionally copies base content as starting point.
router.post("/variants", authMiddleware, superAdminOnly, async (req, res) => {
  const { sourceKey, slug, label, isLive, copyFromBase } = req.body ?? {};
  if (!sourceKey || typeof sourceKey !== "string") { res.status(400).json({ error: "sourceKey required" }); return; }
  if (!slug || !isSafeSlug(String(slug))) { res.status(400).json({ error: "slug must be lowercase letters, digits, dashes (max 80 chars)" }); return; }
  try {
    const inserted = await db.insert(pageVariants).values({
      sourceKey: String(sourceKey),
      slug: String(slug),
      label: String(label ?? ""),
      isLive: Boolean(isLive),
    }).returning();
    // Seed content: copy base sourceKey's siteContent into the variant key so admin
    // can immediately edit. If no base content exists, leave variant key empty.
    if (copyFromBase) {
      const base = await db.select().from(siteContent).where(eq(siteContent.section, String(sourceKey)));
      if (base.length > 0) {
        await db.insert(siteContent)
          .values({ section: variantKey(String(sourceKey), String(slug)), data: base[0].data })
          .onConflictDoUpdate({ target: siteContent.section, set: { data: base[0].data, updatedAt: new Date() } });
      }
    }
    logger.info({ slug, sourceKey }, "Page variant created");
    res.json(inserted[0]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Create failed";
    if (/unique|duplicate/i.test(msg)) { res.status(409).json({ error: `Slug "${slug}" is already taken.` }); return; }
    logger.error({ err }, "Create variant failed");
    res.status(500).json({ error: msg });
  }
});

// Admin: update variant (rename slug, label, toggle live).
// Slug rename is atomic via a SQL transaction so site_content and
// page_variants can't diverge if either step fails.
router.put("/variants/:id", authMiddleware, superAdminOnly, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { slug, label, isLive } = req.body ?? {};
  const existing = await db.select().from(pageVariants).where(eq(pageVariants.id, id));
  if (existing.length === 0) { res.status(404).json({ error: "Variant not found" }); return; }
  const cur = existing[0];
  const newSlug = typeof slug === "string" ? slug : cur.slug;
  if (!isSafeSlug(newSlug)) { res.status(400).json({ error: "slug must be lowercase letters, digits, dashes (max 80 chars)" }); return; }
  const newLabel = typeof label === "string" ? label : cur.label;
  const newIsLive = typeof isLive === "boolean" ? isLive : cur.isLive;

  // Pre-check slug uniqueness BEFORE touching site_content — saves a rollback
  // when the rename would obviously fail.
  if (newSlug !== cur.slug) {
    const clash = await db.select({ id: pageVariants.id }).from(pageVariants).where(eq(pageVariants.slug, newSlug));
    if (clash.length > 0) { res.status(409).json({ error: `Slug "${newSlug}" is already taken.` }); return; }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (newSlug !== cur.slug) {
      const oldKey = variantKey(cur.sourceKey, cur.slug);
      const newKey = variantKey(cur.sourceKey, newSlug);
      await client.query(`UPDATE site_content SET section = $1 WHERE section = $2`, [newKey, oldKey]);
    }
    const updated = await client.query(
      `UPDATE page_variants SET slug = $1, label = $2, is_live = $3, updated_at = now() WHERE id = $4 RETURNING *`,
      [newSlug, newLabel, newIsLive, id],
    );
    await client.query("COMMIT");
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    const msg = err instanceof Error ? err.message : "Update failed";
    if (/unique|duplicate/i.test(msg)) { res.status(409).json({ error: `Slug "${newSlug}" is already taken.` }); return; }
    logger.error({ err }, "Update variant failed");
    res.status(500).json({ error: msg });
  } finally {
    client.release();
  }
});

// Admin: delete variant + its content row.
router.delete("/variants/:id", authMiddleware, superAdminOnly, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const existing = await db.select().from(pageVariants).where(eq(pageVariants.id, id));
  if (existing.length === 0) { res.json({ success: true }); return; }
  const cur = existing[0];
  await db.delete(siteContent).where(eq(siteContent.section, variantKey(cur.sourceKey, cur.slug)));
  await db.delete(pageVariants).where(eq(pageVariants.id, id));
  logger.info({ id, slug: cur.slug }, "Page variant deleted");
  res.json({ success: true });
});

// ── Public (no-auth) read endpoint for public site ──
router.get("/public/content/:section", async (req, res) => {
  const { section } = req.params;
  // Never cache — every page load must see the latest admin edits.
  // Without this, browsers and intermediaries may serve a stale copy for
  // a few seconds after the admin saves a change.
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  try {
    const rows = await db.select().from(siteContent).where(eq(siteContent.section, section));
    if (rows.length === 0) { res.json({ section, data: null }); return; }
    res.json(rows[0]);
  } catch {
    res.json({ section, data: null });
  }
});

router.get("/sections", authMiddleware, async (_req, res) => {
  const rows = await db
    .select({ section: siteContent.section, updatedAt: siteContent.updatedAt })
    .from(siteContent);
  res.json(rows);
});

router.get("/content/:section", authMiddleware, requireSectionPermission, async (req, res) => {
  const section = String(req.params.section);
  const rows = await db
    .select()
    .from(siteContent)
    .where(eq(siteContent.section, section));
  if (rows.length === 0) {
    res.json({ section, data: null });
    return;
  }
  res.json(rows[0]);
});

// Sections listed here cannot be modified or deleted via the API.
// To unlock a section, a developer must explicitly remove it from this list.
const LOCKED_SECTIONS = [] as const;

router.put("/content/:section", authMiddleware, requireSectionPermission, async (req, res) => {
  const section = String(req.params.section);
  if ((LOCKED_SECTIONS as readonly string[]).includes(section)) {
    res.status(403).json({ error: `The "${section}" section is locked and cannot be modified. Contact a developer to make changes.` });
    return;
  }
  const { data } = req.body;
  if (data === undefined || data === null) {
    res.status(400).json({ error: "data field required" });
    return;
  }
  await db
    .insert(siteContent)
    .values({ section, data })
    .onConflictDoUpdate({
      target: siteContent.section,
      set: { data, updatedAt: new Date() },
    });
  logger.info({ section }, "Admin content updated");
  res.json({ success: true, section });
});

// ── Leads / CRM ──

router.get("/leads", authMiddleware, requirePermission("leads"), async (req, res) => {
  const { type } = req.query;
  let rows;
  if (type && type !== "all") {
    rows = await db.select().from(leads).where(eq(leads.type, String(type))).orderBy(desc(leads.createdAt));
  } else {
    rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
  }
  res.json(rows);
});

router.get("/leads/stats", authMiddleware, requirePermission("leads"), async (_req, res) => {
  const rows = await db.select().from(leads);
  const byType: Record<string, number> = {};
  for (const row of rows) {
    byType[row.type] = (byType[row.type] ?? 0) + 1;
  }
  res.json({ total: rows.length, byType });
});

router.patch("/leads/:id", authMiddleware, requirePermission("leads"), async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { status, notes } = req.body as { status?: string; notes?: string };
  const patch: Record<string, unknown> = {};
  if (status !== undefined) patch.status = status;
  if (notes !== undefined) patch.notes = notes;
  if (Object.keys(patch).length === 0) { res.status(400).json({ error: "No fields to update" }); return; }
  const rows = await db.update(leads).set(patch).where(eq(leads.id, id)).returning();
  if (rows.length === 0) { res.status(404).json({ error: "Lead not found" }); return; }
  res.json(rows[0]);
});

router.delete("/leads/:id", authMiddleware, requirePermission("leads"), async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(leads).where(eq(leads.id, id));
  res.json({ success: true });
});

// ── Media uploads (database-backed, works on any deployment) ──

router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) { res.status(400).json({ error: "No file uploaded" }); return; }
  try {
    const { id, url } = await saveFileToDb(file);
    res.json({ url, filename: String(id), size: file.size });
  } catch (err) {
    logger.error({ err }, "DB upload failed");
    res.status(500).json({ error: "Upload failed" });
  }
});

router.get("/media", authMiddleware, async (_req, res) => {
  try {
    const rows = await db
      .select({ id: mediaFiles.id, filename: mediaFiles.filename, size: mediaFiles.size, uploadedAt: mediaFiles.uploadedAt, url: mediaFiles.url })
      .from(mediaFiles)
      .orderBy(desc(mediaFiles.uploadedAt))
      .limit(200);
    res.json(rows.map((r) => ({
      filename: String(r.id),
      url: r.url ?? `/api/media/file/${r.id}?v=${r.uploadedAt.getTime()}`,
      uploadedAt: r.uploadedAt.getTime(),
      size: r.size,
      originalName: r.filename,
    })));
  } catch (err) {
    logger.error({ err }, "Media list failed");
    res.json([]);
  }
});

router.delete("/media/:filename", authMiddleware, requirePermission("media"), async (req, res) => {
  const id = parseInt(String(req.params.filename));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: "File not found" });
  }
});

// ── Bulk media conversion (WebP / AVIF) ──
// Re-encodes selected images in place to a smaller format. The result is stored
// the same way uploads are (Cloudinary when configured, else base64 in Postgres)
// and the row keeps its id, so id-based URLs stay valid. References across all
// content tables (siteContent, clientLogos, portfolioItems) are rewritten to the
// new URL so existing pages serve the smaller asset. Old Cloudinary assets are
// intentionally NOT deleted: keeping them means a missed/failed reference rewrite
// can never break a live page (the old URL still resolves). No DB schema change.

const MAX_CONVERT_BATCH = 50;
const MAX_CONVERT_SOURCE_BYTES = 50 * 1024 * 1024; // 50 MB safety cap per image

type MediaRow = typeof mediaFiles.$inferSelect;

async function loadMediaBytes(row: MediaRow): Promise<Buffer | null> {
  if (row.data) {
    const buf = Buffer.from(row.data, "base64");
    return buf.length > MAX_CONVERT_SOURCE_BYTES ? null : buf;
  }
  if (row.url && /^https?:\/\//i.test(row.url)) {
    const res = await fetch(row.url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);
    return buf.length > MAX_CONVERT_SOURCE_BYTES ? null : buf;
  }
  return null;
}

type MediaReplacement = { id: number; oldUrl: string | null; newUrl: string };

// Apply all id-based and absolute-URL replacements to a raw string (a JSON blob
// or a single scalar URL). The id pattern has a `(?![0-9])` boundary so id 5 does
// not match inside `/api/media/file/55`, and tolerates an existing `?v=` suffix.
// Function replacements keep `$` in URLs literal.
function applyMediaReplacements(input: string, reps: MediaReplacement[]): string {
  let out = input;
  for (const r of reps) {
    const idPattern = new RegExp(`/api/media/file/${r.id}(?![0-9])(\\?v=\\d+)?`, "g");
    out = out.replace(idPattern, () => r.newUrl);
    if (r.oldUrl && /^https?:\/\//i.test(r.oldUrl)) {
      out = out.split(r.oldUrl).join(r.newUrl);
    }
  }
  return out;
}

// Rewrite every reference to a converted image across all content tables so live
// pages immediately serve the new (smaller) asset. Covers siteContent.data (jsonb),
// clientLogos.imageUrl (scalar), and portfolioItems.customThumbnailUrl (scalar) +
// caseStudy/blocks (jsonb). Returns the number of rows updated.
async function rewriteMediaReferences(reps: MediaReplacement[]): Promise<number> {
  if (!reps.length) return 0;
  let changed = 0;

  const scRows = await db.select().from(siteContent);
  for (const row of scRows) {
    const before = JSON.stringify(row.data);
    const after = applyMediaReplacements(before, reps);
    if (after !== before) {
      await db
        .update(siteContent)
        .set({ data: JSON.parse(after) as Record<string, unknown>, updatedAt: new Date() })
        .where(eq(siteContent.section, row.section));
      changed++;
    }
  }

  const clRows = await db.select().from(clientLogos);
  for (const row of clRows) {
    const after = applyMediaReplacements(row.imageUrl, reps);
    if (after !== row.imageUrl) {
      await db.update(clientLogos).set({ imageUrl: after }).where(eq(clientLogos.id, row.id));
      changed++;
    }
  }

  const piRows = await db.select().from(portfolioItems);
  for (const row of piRows) {
    const patch: Partial<typeof portfolioItems.$inferInsert> = {};
    if (row.customThumbnailUrl) {
      const after = applyMediaReplacements(row.customThumbnailUrl, reps);
      if (after !== row.customThumbnailUrl) patch.customThumbnailUrl = after;
    }
    if (row.caseStudy) {
      const before = JSON.stringify(row.caseStudy);
      const after = applyMediaReplacements(before, reps);
      if (after !== before) patch.caseStudy = JSON.parse(after) as (typeof portfolioItems.$inferSelect)["caseStudy"];
    }
    if (row.blocks) {
      const before = JSON.stringify(row.blocks);
      const after = applyMediaReplacements(before, reps);
      if (after !== before) patch.blocks = JSON.parse(after) as (typeof portfolioItems.$inferSelect)["blocks"];
    }
    if (Object.keys(patch).length) {
      patch.updatedAt = new Date();
      await db.update(portfolioItems).set(patch).where(eq(portfolioItems.id, row.id));
      changed++;
    }
  }

  return changed;
}

interface ConvertItemResult {
  id: number;
  ok: boolean;
  oldSize?: number;
  newSize?: number;
  savedBytes?: number;
  savedPct?: number;
  newUrl?: string;
  skipped?: string;
  error?: string;
}

router.post("/media/convert", authMiddleware, requirePermission("media"), async (req, res) => {
  const body = (req.body ?? {}) as { ids?: unknown; format?: unknown };
  const ids = Array.isArray(body.ids)
    ? Array.from(new Set(body.ids.filter((x): x is number => typeof x === "number" && Number.isInteger(x))))
    : [];
  const format: ConvertFormat | null =
    body.format === "webp" || body.format === "avif" ? body.format : null;

  if (!format) { res.status(400).json({ error: "format must be 'webp' or 'avif'" }); return; }
  if (ids.length === 0) { res.status(400).json({ error: "No images selected" }); return; }
  if (ids.length > MAX_CONVERT_BATCH) {
    res.status(400).json({ error: `Too many images — convert at most ${MAX_CONVERT_BATCH} at a time` });
    return;
  }
  const fmt: ConvertFormat = format;

  const results: ConvertItemResult[] = [];
  const replacements: MediaReplacement[] = [];
  const queue = [...ids];

  async function worker(): Promise<void> {
    for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
      try {
        const rows = await db.select().from(mediaFiles).where(eq(mediaFiles.id, id)).limit(1);
        if (!rows.length) { results.push({ id, ok: false, error: "Not found" }); continue; }
        const row = rows[0];

        const src = await loadMediaBytes(row);
        if (!src) { results.push({ id, ok: false, skipped: "Could not load source image" }); continue; }

        const conv = await convertImageBuffer(src, fmt, row.mimetype);
        if (!conv.ok) { results.push({ id, ok: false, skipped: conv.reason }); continue; }

        const oldSize = row.size;
        const oldUrl = row.url ?? `/api/media/file/${id}`;
        let newUrl: string;

        if (cloudinaryConfigured()) {
          const up = await uploadToCloudinary(conv.buffer, conv.mimetype);
          await db
            .update(mediaFiles)
            .set({
              url: up.url,
              cloudinaryPublicId: up.publicId,
              mimetype: conv.mimetype,
              size: conv.buffer.length,
              data: null,
              uploadedAt: new Date(),
            })
            .where(eq(mediaFiles.id, id));
          newUrl = up.url;
          // Old Cloudinary asset is intentionally retained (see header note):
          // it keeps every not-yet-rewritten reference working.
        } else {
          await db
            .update(mediaFiles)
            .set({
              data: conv.buffer.toString("base64"),
              mimetype: conv.mimetype,
              size: conv.buffer.length,
              url: null,
              cloudinaryPublicId: null,
              uploadedAt: new Date(),
            })
            .where(eq(mediaFiles.id, id));
          newUrl = `/api/media/file/${id}?v=${Date.now()}`;
        }

        replacements.push({ id, oldUrl, newUrl });
        const newSize = conv.buffer.length;
        results.push({
          id,
          ok: true,
          oldSize,
          newSize,
          savedBytes: oldSize - newSize,
          savedPct: oldSize > 0 ? Math.round((1 - newSize / oldSize) * 100) : 0,
          newUrl,
        });
      } catch (err) {
        logger.error({ err, id }, "media convert failed");
        results.push({ id, ok: false, error: "Conversion failed" });
      }
    }
  }

  await Promise.all([worker(), worker()]);

  let referencesUpdated = 0;
  let warning: string | undefined;
  try {
    referencesUpdated = await rewriteMediaReferences(replacements);
  } catch (err) {
    logger.warn({ err }, "media reference rewrite failed (conversions applied; old assets retained)");
    warning = "Images were converted, but updating their references in your pages failed. Old versions are kept so nothing is broken — you can run the conversion again.";
  }

  const converted = results.filter((r) => r.ok).length;
  const savedBytes = results.reduce((s, r) => s + (r.savedBytes ?? 0), 0);
  res.json({ results, converted, total: ids.length, savedBytes, referencesUpdated, warning });
});

// ── Certificates ──

router.get("/public/certificate/:certificateId", async (req, res) => {
  const { certificateId } = req.params;
  try {
    const rows = await db
      .select()
      .from(certificates)
      .where(eq(certificates.certificateId, certificateId));
    if (rows.length === 0) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }
    const cert = rows[0];
    res.json({
      certificateId: cert.certificateId,
      name: cert.name,
      role: cert.role,
      issueDate: cert.issueDate,
      status: cert.status,
      remark: cert.remark,
    });
  } catch {
    res.status(500).json({ error: "Lookup failed" });
  }
});

router.get("/certificates", authMiddleware, requirePermission("certificates"), async (_req, res) => {
  const rows = await db.select().from(certificates).orderBy(desc(certificates.createdAt));
  res.json(rows);
});

router.post("/certificates", authMiddleware, requirePermission("certificates"), async (req, res) => {
  const { certificateId, name, email, role, issueDate, status, remark } = req.body;
  if (!certificateId || !name || !role || !issueDate) {
    res.status(400).json({ error: "certificateId, name, role, and issueDate are required" });
    return;
  }
  const existing = await db
    .select()
    .from(certificates)
    .where(eq(certificates.certificateId, certificateId));
  if (existing.length > 0) {
    res.status(409).json({ error: "Certificate ID already exists" });
    return;
  }
  const trimmedRemark = typeof remark === "string" ? remark.trim() : "";
  const rows = await db
    .insert(certificates)
    .values({ certificateId, name, email: email || null, role, issueDate, status: status || "verified", remark: trimmedRemark || null })
    .returning();
  logger.info({ certificateId }, "Certificate created");
  res.status(201).json(rows[0]);
});

router.put("/certificates/:id", authMiddleware, requirePermission("certificates"), async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name, email, role, issueDate, status, remark } = req.body;
  // remark: undefined = leave existing value, "" / null = clear, string = set
  const remarkPatch =
    remark === undefined
      ? {}
      : { remark: typeof remark === "string" && remark.trim() ? remark.trim() : null };
  const rows = await db
    .update(certificates)
    .set({ name, email: email || null, role, issueDate, status, ...remarkPatch, updatedAt: new Date() })
    .where(eq(certificates.id, id))
    .returning();
  if (rows.length === 0) { res.status(404).json({ error: "Certificate not found" }); return; }
  logger.info({ id }, "Certificate updated");
  res.json(rows[0]);
});

router.delete("/certificates/:id", authMiddleware, requirePermission("certificates"), async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(certificates).where(eq(certificates.id, id));
  logger.info({ id }, "Certificate deleted");
  res.json({ success: true });
});

// ── Optimize ──

async function pushLog(action: string, detail: string, ok: boolean): Promise<void> {
  try {
    await db.insert(adminActionLogs).values({ action, detail, ok });
    // Keep only the 100 most recent log entries
    const oldest = await db.select({ id: adminActionLogs.id })
      .from(adminActionLogs)
      .orderBy(desc(adminActionLogs.createdAt))
      .offset(100)
      .limit(1);
    if (oldest.length > 0) {
      await db.delete(adminActionLogs)
        .where(lt(adminActionLogs.id, oldest[0].id));
    }
  } catch { /* non-fatal — logs are best-effort */ }
}

let optimizeRunning = false;

router.get("/optimize/lock", authMiddleware, superAdminOnly, (_req, res) => {
  res.json({ running: optimizeRunning });
});

router.post("/optimize/precheck", authMiddleware, superAdminOnly, async (_req, res) => {
  const checks: { server: boolean; database: boolean; storage: boolean } = {
    server: true,
    database: false,
    storage: false,
  };
  const issues: string[] = [];

  try {
    await pool.query("SELECT 1");
    checks.database = true;
  } catch {
    issues.push("Database connection failed");
  }

  try {
    await db.select({ n: count() }).from(mediaFiles);
    checks.storage = true;
  } catch {
    issues.push("Media storage (database) not accessible");
  }

  res.json({ ok: issues.length === 0, checks, issues });
});

router.post("/optimize/db-analyze", authMiddleware, superAdminOnly, async (req, res) => {
  if (optimizeRunning) { res.status(409).json({ error: "Optimization already in progress" }); return; }
  optimizeRunning = true;
  const { mode = "safe" } = req.body as { mode?: "safe" | "advanced" };
  try {
    if (mode === "advanced") {
      await pool.query("VACUUM ANALYZE");
      const detail = "All tables vacuumed and analyzed";
      await pushLog("Deep Optimization", detail, true);
      res.json({ ok: true, detail });
    } else {
      await pool.query("ANALYZE");
      const detail = "Query planner statistics refreshed";
      await pushLog("DB Analyze", detail, true);
      res.json({ ok: true, detail });
    }
  } catch {
    await pushLog("DB Analyze", "Database analysis failed", false);
    res.status(500).json({ ok: false, error: "Database analysis failed" });
  } finally {
    optimizeRunning = false;
  }
});

router.post("/optimize/cache-clear", authMiddleware, superAdminOnly, async (_req, res) => {
  let purged = 0;
  try {
    const result = await db.delete(revokedTokensTable).where(lt(revokedTokensTable.expiresAt, new Date()));
    purged = result.rowCount ?? 0;
  } catch { /* non-fatal */ }
  const detail = `${purged} expired session token${purged === 1 ? "" : "s"} cleared. Public pages always fetch content live (no server-side HTML cache), so visitors already see your latest edits.`;
  await pushLog("Cache Clear", detail, true);
  res.json({ ok: true, detail });
});

router.post("/optimize/image-cache-clear", authMiddleware, superAdminOnly, async (_req, res) => {
  const detail = "Uploaded images are served fresh and browsers re-fetch changed images automatically — there is no server-side image cache to clear.";
  await pushLog("Image Cache Clear", detail, true);
  res.json({ ok: true, detail });
});

router.post("/optimize/full-cache-clear", authMiddleware, superAdminOnly, async (_req, res) => {
  let purged = 0;
  let dbOk = false;
  try {
    const result = await db.delete(revokedTokensTable).where(lt(revokedTokensTable.expiresAt, new Date()));
    purged = result.rowCount ?? 0;
  } catch { /* non-fatal */ }
  try {
    await pool.query("ANALYZE");
    dbOk = true;
  } catch { /* non-fatal */ }
  const detail = `${purged} expired session token${purged === 1 ? "" : "s"} cleared and database statistics refreshed${dbOk ? "" : " (skipped)"}. Public content is served live with no stale server cache.`;
  await pushLog("Full Cache Clear (Safe)", detail, true);
  res.json({ ok: true, detail });
});

router.post("/optimize/speed-check", authMiddleware, superAdminOnly, async (_req, res) => {
  const dbStart = Date.now();
  try {
    await pool.query("SELECT 1");
    const dbMs = Date.now() - dbStart;
    const [contentCount, leadsCount] = await Promise.all([
      db.select({ n: count() }).from(siteContent).then((r) => Number(r[0]?.n ?? 0)),
      db.select({ n: count() }).from(leads).then((r) => Number(r[0]?.n ?? 0)),
    ]);
    const detail = `DB responded in ${dbMs}ms, ${contentCount + leadsCount} total records`;
    await pushLog("Speed Check", detail, true);
    res.json({ ok: true, dbResponseMs: dbMs, contentRows: contentCount, leadsRows: leadsCount, uptimeSeconds: Math.round(process.uptime()) });
  } catch {
    await pushLog("Speed Check", "Failed to query database", false);
    res.status(500).json({ ok: false, error: "Speed check failed" });
  }
});

router.post("/optimize/issue-scan", authMiddleware, superAdminOnly, async (_req, res) => {
  const LARGE_THRESHOLD = 300 * 1024;
  const warnings: string[] = [];
  let imageCount = 0;
  let largeCount = 0;
  let totalBytes = 0;

  try {
    const rows = await db.select({ size: mediaFiles.size }).from(mediaFiles);
    imageCount = rows.length;
    for (const r of rows) {
      totalBytes += r.size;
      if (r.size > LARGE_THRESHOLD) largeCount++;
    }
    if (largeCount > 0) warnings.push(`${largeCount} file${largeCount > 1 ? "s" : ""} over 300 KB — consider compressing`);
    if (imageCount > 50) warnings.push(`${imageCount} media files stored — review unused uploads`);
  } catch { /* non-fatal */ }

  const detail = warnings.length === 0 ? "No issues found" : warnings.join("; ");
  await pushLog("Issue Scan", detail, true);
  res.json({ ok: true, warnings, imageCount, largeCount, totalKb: Math.round(totalBytes / 1024) });
});

router.get("/optimize/logs", authMiddleware, superAdminOnly, async (_req, res) => {
  try {
    const rows = await db.select().from(adminActionLogs).orderBy(desc(adminActionLogs.createdAt)).limit(100);
    const logs = rows.map((r) => ({ ts: r.createdAt.getTime(), action: r.action, detail: r.detail, ok: r.ok }));
    res.json({ logs });
  } catch {
    res.json({ logs: [] });
  }
});

router.post("/optimize/db-stats", authMiddleware, superAdminOnly, async (_req, res) => {
  try {
    const [contentRows, leadsRows, certRows, teamRows] = await Promise.all([
      db.select({ n: count() }).from(siteContent).then((r) => Number(r[0]?.n ?? 0)),
      db.select({ n: count() }).from(leads).then((r) => Number(r[0]?.n ?? 0)),
      db.select({ n: count() }).from(certificates).then((r) => Number(r[0]?.n ?? 0)),
      db.select({ n: count() }).from(teamMembers).then((r) => Number(r[0]?.n ?? 0)),
    ]);

    const sizeRows = await pool.query<{ table_name: string; total_size: string }>(
      `SELECT relname AS table_name,
              pg_size_pretty(pg_total_relation_size(relid)) AS total_size
         FROM pg_catalog.pg_statio_user_tables
        ORDER BY pg_total_relation_size(relid) DESC`
    );

    res.json({
      ok: true,
      tables: {
        site_content: contentRows,
        leads: leadsRows,
        certificates: certRows,
        team_members: teamRows,
      },
      sizes: sizeRows.rows,
    });
  } catch {
    res.status(500).json({ ok: false, error: "Could not fetch database stats" });
  }
});

router.post("/optimize/media-audit", authMiddleware, superAdminOnly, async (_req, res) => {
  try {
    let files: string[] = [];
    let totalBytes = 0;

    const rows = await db.select({ size: mediaFiles.size }).from(mediaFiles);
    for (const r of rows) totalBytes += r.size;
    res.json({
      ok: true,
      count: rows.length,
      totalKb: Math.round(totalBytes / 1024),
      detail: `${rows.length} media file${rows.length === 1 ? "" : "s"} (${Math.round(totalBytes / 1024)} KB total)`,
    });
  } catch {
    res.status(500).json({ ok: false, error: "Media audit failed" });
  }
});

// ──────────────────────────────────────────────────────────────────
// Powerful (but safe) runtime optimization settings.
//
// These toggles are persisted in site_content under the section
// "optimize_settings". A tiny in-memory cache (refreshed on PUT and
// every 60s) avoids hammering the DB on every request. Defaults are
// all OFF so the live site behaves identically until the owner opts
// in from /admin/optimize.
// ──────────────────────────────────────────────────────────────────

export interface OptimizeSettings {
  keepDbWarm: boolean;          // background SELECT 1 every 4 min — keeps Neon hot
  publicReadCache: "off" | "short" | "medium";  // Cache-Control on safe public GETs (60s / 300s)
  strictImageHeaders: boolean;  // long-lived cache headers on /api/media/file/*
}

const DEFAULT_OPTIMIZE_SETTINGS: OptimizeSettings = {
  keepDbWarm: false,
  publicReadCache: "off",
  strictImageHeaders: false,
};

const OPTIMIZE_SECTION = "optimize_settings";
let cachedSettings: OptimizeSettings = { ...DEFAULT_OPTIMIZE_SETTINGS };
let cachedAt = 0;
const SETTINGS_TTL_MS = 60_000;

function sanitizeSettings(input: unknown): OptimizeSettings {
  const s = (input ?? {}) as Partial<OptimizeSettings>;
  const cacheLevel = s.publicReadCache;
  return {
    keepDbWarm: typeof s.keepDbWarm === "boolean" ? s.keepDbWarm : false,
    publicReadCache:
      cacheLevel === "short" || cacheLevel === "medium" ? cacheLevel : "off",
    strictImageHeaders: typeof s.strictImageHeaders === "boolean" ? s.strictImageHeaders : false,
  };
}

async function loadOptimizeSettingsFromDb(): Promise<OptimizeSettings> {
  try {
    const rows = await db
      .select()
      .from(siteContent)
      .where(eq(siteContent.section, OPTIMIZE_SECTION));
    if (rows.length === 0) return { ...DEFAULT_OPTIMIZE_SETTINGS };
    return sanitizeSettings(rows[0].data);
  } catch {
    return { ...DEFAULT_OPTIMIZE_SETTINGS };
  }
}

/** Cached settings accessor — used by the public cache middleware on every request. */
export function getOptimizeSettings(): OptimizeSettings {
  if (Date.now() - cachedAt > SETTINGS_TTL_MS) {
    // Fire and forget refresh; serve the cached copy this request.
    loadOptimizeSettingsFromDb().then((s) => {
      cachedSettings = s;
      cachedAt = Date.now();
      applyKeepDbWarm(s.keepDbWarm);
    }).catch(() => { /* keep current */ });
  }
  return cachedSettings;
}

// Background DB warmup interval (controlled by keepDbWarm setting).
let warmInterval: NodeJS.Timeout | null = null;
function applyKeepDbWarm(enabled: boolean) {
  if (enabled && !warmInterval) {
    warmInterval = setInterval(() => {
      pool.query("SELECT 1").catch(() => { /* non-fatal */ });
    }, 4 * 60 * 1000);
    // Don't keep the Node event loop alive solely for this.
    if (typeof warmInterval.unref === "function") warmInterval.unref();
  } else if (!enabled && warmInterval) {
    clearInterval(warmInterval);
    warmInterval = null;
  }
}

// Prime the cache & background interval on first import.
loadOptimizeSettingsFromDb().then((s) => {
  cachedSettings = s;
  cachedAt = Date.now();
  applyKeepDbWarm(s.keepDbWarm);
}).catch(() => { /* default off */ });

router.get("/optimize/settings", authMiddleware, superAdminOnly, async (_req, res) => {
  const settings = await loadOptimizeSettingsFromDb();
  cachedSettings = settings;
  cachedAt = Date.now();
  res.json({ ok: true, settings });
});

router.put("/optimize/settings", authMiddleware, superAdminOnly, async (req, res) => {
  const next = sanitizeSettings(req.body?.settings);
  try {
    await db
      .insert(siteContent)
      .values({ section: OPTIMIZE_SECTION, data: next as unknown as Record<string, unknown> })
      .onConflictDoUpdate({
        target: siteContent.section,
        set: { data: next as unknown as Record<string, unknown>, updatedAt: new Date() },
      });
    cachedSettings = next;
    cachedAt = Date.now();
    applyKeepDbWarm(next.keepDbWarm);
    await pushLog(
      "Optimize Settings",
      `keepDbWarm=${next.keepDbWarm}, publicReadCache=${next.publicReadCache}, strictImageHeaders=${next.strictImageHeaders}`,
      true,
    );
    res.json({ ok: true, settings: next, detail: "Optimization settings saved" });
  } catch {
    res.status(500).json({ ok: false, error: "Could not save settings" });
  }
});

router.post("/optimize/warmup", authMiddleware, superAdminOnly, async (_req, res) => {
  const start = Date.now();
  const results: { task: string; ok: boolean; ms: number }[] = [];

  // 1. DB ping (keeps Neon hot + measures cold-start cost)
  {
    const t = Date.now();
    try { await pool.query("SELECT 1"); results.push({ task: "DB ping", ok: true, ms: Date.now() - t }); }
    catch { results.push({ task: "DB ping", ok: false, ms: Date.now() - t }); }
  }

  // 2. Prime the most-requested site_content sections so first visitor gets instant response.
  const popularSections = ["home", "about", "contact", "services", "header", "footer"];
  for (const section of popularSections) {
    const t = Date.now();
    try {
      await db.select().from(siteContent).where(eq(siteContent.section, section));
      results.push({ task: `Prime ${section}`, ok: true, ms: Date.now() - t });
    } catch {
      results.push({ task: `Prime ${section}`, ok: false, ms: Date.now() - t });
    }
  }

  // 3. Refresh query planner stats (lightweight, non-blocking).
  {
    const t = Date.now();
    try { await pool.query("ANALYZE"); results.push({ task: "Refresh query stats", ok: true, ms: Date.now() - t }); }
    catch { results.push({ task: "Refresh query stats", ok: false, ms: Date.now() - t }); }
  }

  const totalMs = Date.now() - start;
  const okCount = results.filter((r) => r.ok).length;
  const detail = `Warm-up complete in ${totalMs}ms — ${okCount}/${results.length} tasks ok`;
  await pushLog("Warm Up", detail, okCount === results.length);
  res.json({ ok: true, detail, totalMs, results });
});

// ── Portfolio (public – password protected) ──

router.get("/portfolio/items", async (_req, res) => {
  try {
    const rows = await db.select().from(portfolioItems).orderBy(asc(portfolioItems.sortOrder), desc(portfolioItems.createdAt));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to list portfolio items");
    res.status(500).json({ error: "Failed to fetch portfolio items" });
  }
});

// ── Portfolio CRUD (admin only) ──

router.get("/portfolio", authMiddleware, superAdminOnly, async (_req, res) => {
  try {
    const rows = await db.select().from(portfolioItems).orderBy(asc(portfolioItems.sortOrder), desc(portfolioItems.createdAt));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to list portfolio items");
    res.status(500).json({ error: "Failed to fetch portfolio items" });
  }
});

router.post("/portfolio", authMiddleware, superAdminOnly, async (req, res) => {
  const { title, category, youtubeUrl, description, sortOrder, caseStudy, customThumbnailUrl, blocks } = req.body;
  if (!title || !category || !youtubeUrl) {
    res.status(400).json({ error: "title, category, and youtubeUrl are required" });
    return;
  }
  // Guard: block-based editor is NOT available for video editing categories
  // (per product requirement — these stay on the simple grid layout).
  const VIDEO_EDITING_CATS = new Set(["Video Editing", "Video Editing Global"]);
  if (blocks != null && VIDEO_EDITING_CATS.has(String(category))) {
    res.status(400).json({ error: "Block-based content is not supported for video editing categories." });
    return;
  }
  try {
    const rows = await db.insert(portfolioItems).values({
      title, category, youtubeUrl, description: description || null,
      sortOrder: sortOrder ?? 0,
      caseStudy: caseStudy ?? null,
      customThumbnailUrl: customThumbnailUrl?.trim() ? customThumbnailUrl.trim() : null,
      blocks: Array.isArray(blocks) ? blocks : null,
    }).returning();
    logger.info({ id: rows[0].id }, "Portfolio item created");
    res.status(201).json(rows[0]);
  } catch (err) {
    logger.error({ err }, "Failed to create portfolio item");
    res.status(500).json({ error: "Failed to create portfolio item" });
  }
});

router.put("/portfolio/:id", authMiddleware, superAdminOnly, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { title, category, youtubeUrl, description, sortOrder, caseStudy, customThumbnailUrl, blocks } = req.body;
  try {
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) update.title = title;
    if (category !== undefined) update.category = category;
    if (youtubeUrl !== undefined) update.youtubeUrl = youtubeUrl;
    if (description !== undefined) update.description = description;
    if (sortOrder !== undefined) update.sortOrder = sortOrder;
    if (caseStudy !== undefined) update.caseStudy = caseStudy;
    if (customThumbnailUrl !== undefined) {
      update.customThumbnailUrl = typeof customThumbnailUrl === "string" && customThumbnailUrl.trim()
        ? customThumbnailUrl.trim()
        : null;
    }
    if (blocks !== undefined) {
      // Guard: video editing categories may not have blocks.
      const VIDEO_EDITING_CATS = new Set(["Video Editing", "Video Editing Global"]);
      const targetCat = typeof category === "string" ? category : undefined;
      if (blocks != null && targetCat && VIDEO_EDITING_CATS.has(targetCat)) {
        res.status(400).json({ error: "Block-based content is not supported for video editing categories." });
        return;
      }
      update.blocks = Array.isArray(blocks) ? blocks : null;
    }
    const rows = await db.update(portfolioItems).set(update).where(eq(portfolioItems.id, id)).returning();
    if (rows.length === 0) { res.status(404).json({ error: "Item not found" }); return; }
    logger.info({ id }, "Portfolio item updated");
    res.json(rows[0]);
  } catch (err) {
    logger.error({ err }, "Failed to update portfolio item");
    res.status(500).json({ error: "Failed to update portfolio item" });
  }
});

router.delete("/portfolio/:id", authMiddleware, superAdminOnly, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
    // Cascade cleanup: remove this id from every share's hiddenItemIds so
    // shares don't accumulate dangling references over time.
    try {
      const shares = await db.select().from(portfolioShares);
      for (const s of shares) {
        const ids = (s.hiddenItemIds ?? []).map(Number);
        if (ids.includes(id)) {
          await db
            .update(portfolioShares)
            .set({ hiddenItemIds: ids.filter((x) => x !== id), updatedAt: new Date() })
            .where(eq(portfolioShares.id, s.id));
        }
      }
    } catch (cleanupErr) {
      logger.warn({ err: cleanupErr, id }, "Share cleanup after item delete failed (non-fatal)");
    }
    logger.info({ id }, "Portfolio item deleted");
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to delete portfolio item");
    res.status(500).json({ error: "Failed to delete portfolio item" });
  }
});

// ── Portfolio Shares (public read by slug) ──

router.get("/portfolio/shares/public/:slug", async (req, res) => {
  const slug = String(req.params.slug || "").trim().toLowerCase();
  if (!slug) { res.status(400).json({ error: "Slug required" }); return; }
  try {
    const shareRows = await db.select().from(portfolioShares).where(eq(portfolioShares.slug, slug)).limit(1);
    if (shareRows.length === 0) { res.status(404).json({ error: "Share not found" }); return; }
    const share = shareRows[0];

    const allItems = await db.select().from(portfolioItems).orderBy(asc(portfolioItems.sortOrder), desc(portfolioItems.createdAt));
    const hiddenCats = new Set(share.hiddenCategories ?? []);
    const hiddenIds = new Set((share.hiddenItemIds ?? []).map(Number));
    const items = allItems.filter((it) => !hiddenCats.has(it.category) && !hiddenIds.has(it.id));

    res.json({
      share: {
        slug: share.slug,
        title: share.title,
        hiddenCategories: share.hiddenCategories ?? [],
        hiddenItemIds: share.hiddenItemIds ?? [],
      },
      items,
    });
  } catch (err) {
    logger.error({ err, slug }, "Failed to fetch public share");
    res.status(500).json({ error: "Failed to fetch share" });
  }
});

// ── Portfolio Shares CRUD (admin only) ──

router.get("/portfolio/shares", authMiddleware, superAdminOnly, async (_req, res) => {
  try {
    const rows = await db.select().from(portfolioShares).orderBy(desc(portfolioShares.createdAt));
    // Annotate each share with how many of its hidden IDs no longer exist,
    // so the admin UI can warn ("3 hidden items have been deleted").
    const allItems = await db.select({ id: portfolioItems.id }).from(portfolioItems);
    const liveIds = new Set(allItems.map((i) => i.id));
    const annotated = rows.map((r) => {
      const hidden = (r.hiddenItemIds ?? []).map(Number);
      const stale = hidden.filter((id) => !liveIds.has(id));
      return { ...r, staleItemCount: stale.length };
    });
    res.json(annotated);
  } catch (err) {
    logger.error({ err }, "Failed to list portfolio shares");
    res.status(500).json({ error: "Failed to fetch shares" });
  }
});

function genSlug(): string {
  return randomBytes(4).toString("hex"); // 8-char hex
}

router.post("/portfolio/shares", authMiddleware, superAdminOnly, async (req, res) => {
  const title = String(req.body.title ?? "").trim();
  let slug = String(req.body.slug ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
  const hiddenCategories: string[] = Array.isArray(req.body.hiddenCategories) ? req.body.hiddenCategories.map(String) : [];
  const hiddenItemIds: number[] = Array.isArray(req.body.hiddenItemIds)
    ? req.body.hiddenItemIds.map((n: unknown) => parseInt(String(n))).filter((n: number) => !isNaN(n))
    : [];

  // Generate unique slug if missing or taken.
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = slug && attempt === 0 ? slug : `${slug || "share"}-${genSlug()}`.replace(/^-+/, "");
    const existing = await db.select().from(portfolioShares).where(eq(portfolioShares.slug, candidate)).limit(1);
    if (existing.length === 0) { slug = candidate; break; }
    slug = "";
  }

  try {
    const rows = await db.insert(portfolioShares).values({ slug, title, hiddenCategories, hiddenItemIds }).returning();
    res.status(201).json(rows[0]);
  } catch (err) {
    logger.error({ err }, "Failed to create portfolio share");
    res.status(500).json({ error: "Failed to create share" });
  }
});

router.put("/portfolio/shares/:id", authMiddleware, superAdminOnly, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (req.body.title !== undefined) update.title = String(req.body.title);
    if (Array.isArray(req.body.hiddenCategories)) update.hiddenCategories = req.body.hiddenCategories.map(String);
    if (Array.isArray(req.body.hiddenItemIds)) {
      update.hiddenItemIds = req.body.hiddenItemIds.map((n: unknown) => parseInt(String(n))).filter((n: number) => !isNaN(n));
    }
    const rows = await db.update(portfolioShares).set(update).where(eq(portfolioShares.id, id)).returning();
    if (rows.length === 0) { res.status(404).json({ error: "Share not found" }); return; }
    res.json(rows[0]);
  } catch (err) {
    logger.error({ err, id }, "Failed to update portfolio share");
    res.status(500).json({ error: "Failed to update share" });
  }
});

router.delete("/portfolio/shares/:id", authMiddleware, superAdminOnly, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(portfolioShares).where(eq(portfolioShares.id, id));
    res.json({ success: true });
  } catch (err) {
    logger.error({ err, id }, "Failed to delete portfolio share");
    res.status(500).json({ error: "Failed to delete share" });
  }
});

// ── Client Logos (public) ──

router.get("/logos/public", async (_req, res) => {
  try {
    const rows = await db.select().from(clientLogos).orderBy(asc(clientLogos.sortOrder), asc(clientLogos.createdAt));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to list client logos");
    res.status(500).json({ error: "Failed to fetch client logos" });
  }
});

// ── Client Logos CRUD (admin only) ──

router.get("/logos", authMiddleware, requirePermission("media"), async (_req, res) => {
  try {
    const rows = await db.select().from(clientLogos).orderBy(asc(clientLogos.sortOrder), asc(clientLogos.createdAt));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to list client logos");
    res.status(500).json({ error: "Failed to fetch client logos" });
  }
});

router.post("/logos", authMiddleware, requirePermission("media"), upload.single("image"), async (req, res) => {
  let imageUrl = req.body.imageUrl as string | undefined;
  if (req.file) {
    try {
      const { url } = await saveFileToDb(req.file);
      imageUrl = url;
    } catch (err) {
      logger.error({ err }, "Logo upload failed");
      res.status(500).json({ error: "Image upload failed" });
      return;
    }
  }
  if (!imageUrl) {
    res.status(400).json({ error: "imageUrl or image file is required" });
    return;
  }
  const altText = (req.body.altText as string) || "";
  const sortOrder = parseInt(req.body.sortOrder as string) || 0;
  const link = (req.body.link as string) || "";
  const enabled = req.body.enabled === "false" ? false : true;
  try {
    const rows = await db.insert(clientLogos).values({ imageUrl, altText, sortOrder, link, enabled }).returning();
    logger.info({ id: rows[0].id }, "Client logo created");
    res.status(201).json(rows[0]);
  } catch (err) {
    logger.error({ err }, "Failed to create client logo");
    res.status(500).json({ error: "Failed to create client logo" });
  }
});

router.put("/logos/:id", authMiddleware, requirePermission("media"), upload.single("image"), async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const update: Record<string, unknown> = {};
    if (req.file) {
      const { url } = await saveFileToDb(req.file);
      update.imageUrl = url;
    } else if (req.body.imageUrl !== undefined) update.imageUrl = req.body.imageUrl;
    if (req.body.altText !== undefined) update.altText = req.body.altText;
    if (req.body.sortOrder !== undefined) update.sortOrder = parseInt(req.body.sortOrder) || 0;
    if (req.body.link !== undefined) update.link = req.body.link;
    if (req.body.enabled !== undefined) update.enabled = req.body.enabled === "false" ? false : true;
    const rows = await db.update(clientLogos).set(update).where(eq(clientLogos.id, id)).returning();
    if (rows.length === 0) { res.status(404).json({ error: "Logo not found" }); return; }
    logger.info({ id }, "Client logo updated");
    res.json(rows[0]);
  } catch (err) {
    logger.error({ err }, "Failed to update client logo");
    res.status(500).json({ error: "Failed to update client logo" });
  }
});

router.delete("/logos/:id", authMiddleware, requirePermission("media"), async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(clientLogos).where(eq(clientLogos.id, id));
    logger.info({ id }, "Client logo deleted");
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to delete client logo");
    res.status(500).json({ error: "Failed to delete client logo" });
  }
});

// ── Deploy status (GitHub API proxy) ─────────────────────────────────────────
router.get("/deploy-status", authMiddleware, async (_req, res) => {
  const token = process.env.GITHUB_TOKEN;
  const repo = "Surajsharmaco/growitbuddy";
  if (!token) {
    return res.json({ error: "GITHUB_TOKEN not set", needsToken: true, deployments: [] });
  }
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "growitbuddy-admin",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    // Get latest commit SHA on main
    const commitRes = await fetch(
      `https://api.github.com/repos/${repo}/commits/main`,
      { headers }
    );
    if (!commitRes.ok) {
      return res.json({ error: "GitHub API error", deployments: [] });
    }
    const commitData = await commitRes.json() as { sha: string; commit: { message: string; author: { date: string } } };
    const sha = commitData.sha;
    const commitMsg = commitData.commit?.message?.split("\n")[0] ?? "";
    const commitDate = commitData.commit?.author?.date ?? "";

    // Get deployment statuses for this commit
    const statusRes = await fetch(
      `https://api.github.com/repos/${repo}/commits/${sha}/statuses`,
      { headers }
    );
    const statuses = statusRes.ok ? await statusRes.json() as Array<{ context: string; state: string; target_url: string; updated_at: string }> : [];

    // Get check runs (Vercel/Render report here)
    const checkRes = await fetch(
      `https://api.github.com/repos/${repo}/commits/${sha}/check-runs`,
      { headers }
    );
    const checkData = checkRes.ok ? await checkRes.json() as { check_runs: Array<{ name: string; status: string; conclusion: string | null; details_url: string; completed_at: string | null }> } : { check_runs: [] };

    // Get recent deployments
    const deployRes = await fetch(
      `https://api.github.com/repos/${repo}/deployments?per_page=10`,
      { headers }
    );
    const deployments = deployRes.ok ? await deployRes.json() as Array<{ id: number; environment: string; created_at: string }> : [];

    // Fetch status for each deployment
    const deployWithStatus = await Promise.all(
      deployments.slice(0, 6).map(async (d) => {
        const sRes = await fetch(
          `https://api.github.com/repos/${repo}/deployments/${d.id}/statuses?per_page=1`,
          { headers }
        );
        const sData = sRes.ok ? await sRes.json() as Array<{ state: string; environment_url: string }> : [];
        return { ...d, state: sData[0]?.state ?? "pending", url: sData[0]?.environment_url ?? "" };
      })
    );

    return res.json({
      commit: { sha: sha.slice(0, 7), message: commitMsg, date: commitDate },
      statuses: Array.isArray(statuses) ? statuses.slice(0, 10) : [],
      checkRuns: checkData.check_runs ?? [],
      deployments: deployWithStatus,
    });
  } catch (err) {
    logger.error({ err }, "deploy-status fetch failed");
    return res.status(500).json({ error: "Failed to fetch deploy status", deployments: [] });
  }
});

// ── Trigger redeploy via deploy hooks ────────────────────────────────────────
router.post("/redeploy", authMiddleware, superAdminOnly, async (req, res) => {
  const { target } = req.body as { target?: string };
  const renderHook = process.env.RENDER_DEPLOY_HOOK_URL;
  const vercelHook = process.env.VERCEL_DEPLOY_HOOK_URL;

  const results: Record<string, string> = {};

  async function triggerHook(name: string, url: string) {
    try {
      const r = await fetch(url, { method: "POST" });
      results[name] = r.ok ? "triggered" : `error:${r.status}`;
    } catch (err) {
      results[name] = `failed:${(err as Error).message}`;
    }
  }

  const tasks: Promise<void>[] = [];

  if (target === "render" || target === "all") {
    if (renderHook) tasks.push(triggerHook("render", renderHook));
    else results["render"] = "RENDER_DEPLOY_HOOK_URL not set";
  }
  if (target === "vercel" || target === "all") {
    if (vercelHook) tasks.push(triggerHook("vercel", vercelHook));
    else results["vercel"] = "VERCEL_DEPLOY_HOOK_URL not set";
  }
  if (!target || (target !== "render" && target !== "vercel" && target !== "all")) {
    return res.status(400).json({ error: "target must be 'render', 'vercel', or 'all'" });
  }

  await Promise.all(tasks);
  logger.info({ target, results }, "redeploy triggered");
  return res.json({ success: true, results });
});

// ── Super-admin backup / migration export ────────────────────────────────────
// One-click download of a SINGLE ZIP that lets any AI (or developer) fully
// understand and rebuild the project. The source code is fetched from GitHub
// (committed files only — never node_modules, .git or .env/secrets), then merged
// with generated AI-handoff docs and a sanitized snapshot of public CMS content.
router.get("/backup", authMiddleware, superAdminOnly, async (_req, res) => {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || "Surajsharmaco/growitbuddy";
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token) {
    res.status(500).json({
      error: "GITHUB_TOKEN not set — backup needs it to fetch the source code from GitHub.",
    });
    return;
  }
  const ghHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "growitbuddy-admin",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  try {
    // 1. Latest commit on the branch (used only to label the bundle).
    const commitRes = await fetch(`https://api.github.com/repos/${repo}/commits/${branch}`, {
      headers: ghHeaders,
      signal: AbortSignal.timeout(20_000),
    });
    if (!commitRes.ok) {
      logger.error({ status: commitRes.status }, "backup: GitHub commit lookup failed");
      res.status(502).json({ error: `Could not reach GitHub to read the latest commit (status ${commitRes.status}).` });
      return;
    }
    const commitData = (await commitRes.json()) as { sha: string; commit: { message: string; author: { date: string } } };
    const sha = commitData.sha;
    const shortSha = sha.slice(0, 7);
    const commitMsg = commitData.commit?.message?.split("\n")[0] ?? "";
    const commitDate = commitData.commit?.author?.date ?? "";

    // 2. Download the full repository as a ZIP. fetch follows GitHub's redirect
    //    to codeload automatically (and drops the auth header cross-origin).
    const zipRes = await fetch(`https://api.github.com/repos/${repo}/zipball/${branch}`, {
      headers: ghHeaders,
      signal: AbortSignal.timeout(60_000),
    });
    if (!zipRes.ok) {
      logger.error({ status: zipRes.status }, "backup: GitHub zipball download failed");
      res.status(502).json({ error: `Could not download the source code from GitHub (status ${zipRes.status}).` });
      return;
    }
    const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
    // Bound the compressed download before we inflate it (defense-in-depth; the
    // source is our own repo but we never want a pathological archive to OOM).
    const MAX_SOURCE_ZIP_BYTES = 200 * 1024 * 1024; // 200 MB compressed
    if (zipBuffer.length > MAX_SOURCE_ZIP_BYTES) {
      logger.error({ bytes: zipBuffer.length }, "backup: source archive exceeds size limit");
      res.status(502).json({ error: "The source archive from GitHub is unexpectedly large; backup aborted." });
      return;
    }

    // 3. Sanitized snapshot of public CMS content + generated handoff docs.
    const snapshot = await buildContentSnapshot();
    const meta: BackupMeta = {
      repo,
      branch,
      sha,
      shortSha,
      commitMsg,
      commitDate,
      generatedAt: new Date().toISOString(),
    };
    const files: Record<string, string> = {
      ...buildHandoffDocs(meta, snapshot),
      "_DATA/cms-content-snapshot.json": JSON.stringify(snapshot, null, 2),
    };

    // 4. Build the final flat ZIP. Any throw here is caught below as a clean
    //    JSON error because no response bytes have been sent yet.
    const bundle = assembleBackupZip(zipBuffer, files);

    const filename = `growitbuddy-backup-${meta.generatedAt.slice(0, 10)}-${shortSha}.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.send(bundle);

    // 5. Audit the action (never the contents).
    try {
      await db.insert(adminActionLogs).values({
        action: "backup-export",
        detail: `Generated AI-handoff backup from ${repo}@${shortSha}`,
        ok: true,
      });
    } catch {
      /* audit log is non-fatal */
    }
    logger.info({ repo, sha: shortSha, bytes: bundle.length }, "backup generated");
  } catch (err) {
    const isTimeout = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    logger.error({ err }, "backup generation failed");
    if (!res.headersSent) {
      if (isTimeout) {
        res.status(504).json({ error: "Backup timed out while contacting GitHub. Please try again." });
      } else {
        res.status(500).json({ error: "Backup generation failed. Please check the server logs and try again." });
      }
    } else {
      try {
        res.end();
      } catch {
        /* noop */
      }
    }
  }
});

// ── Super-admin "Master AI Prompt" (copy / download) ─────────────────────────
// Returns ONE comprehensive markdown prompt that fully explains the project to any
// AI, with a LIVE snapshot of the current website content embedded. Unlike the ZIP
// backup it makes NO GitHub call, so it is fast and reliable, and it is rebuilt on
// every request — so it always reflects the latest admin edits ("auto-updates").
router.get("/handoff-prompt", authMiddleware, superAdminOnly, async (_req, res) => {
  const repo = process.env.GITHUB_REPO || "Surajsharmaco/growitbuddy";
  const branch = process.env.GITHUB_BRANCH || "main";
  try {
    const snapshot = await buildContentSnapshot();
    const generatedAt = new Date().toISOString();
    const prompt = buildMasterPrompt({ repo, branch, generatedAt }, snapshot);
    const filename = `growitbuddy-ai-prompt-${generatedAt.slice(0, 10)}.md`;

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.json({ prompt, generatedAt, filename });

    try {
      await db.insert(adminActionLogs).values({
        action: "handoff-prompt",
        detail: `Generated master AI prompt (${prompt.length} chars)`,
        ok: true,
      });
    } catch {
      /* audit log is non-fatal */
    }
    logger.info({ chars: prompt.length }, "handoff prompt generated");
  } catch (err) {
    logger.error({ err }, "handoff prompt generation failed");
    if (!res.headersSent) {
      res.status(500).json({ error: "Could not generate the AI prompt right now. Please try again." });
    }
  }
});

// ── Super-admin "Blog backup" ────────────────────────────────────────────────
// Blogs live on an external WordPress site, so they are NOT in any source/CMS
// backup. This fetches every published post with all its images and packs a
// fully self-contained, portable ZIP (see lib/blogExport.ts). Reliable: no
// GitHub call. Can take a while when there are many image-heavy posts.
router.get("/blog-backup", authMiddleware, superAdminOnly, async (_req, res) => {
  try {
    const result = await buildBlogExport();
    if (result.postCount === 0) {
      res.status(502).json({ error: "Koi blog post nahi mila — WordPress se connect nahi ho paaya. Thodi der baad try karo." });
      return;
    }
    const filename = `growitbuddy-blogs-${result.generatedAt.slice(0, 10)}.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.send(result.zip);

    try {
      await db.insert(adminActionLogs).values({
        action: "blog-backup",
        detail: `Exported ${result.postCount} blog posts, ${result.imageCount} images${result.skippedImages ? ` (skipped ${result.skippedImages})` : ""}`,
        ok: true,
      });
    } catch {
      /* audit log is non-fatal */
    }
    logger.info(
      { posts: result.postCount, images: result.imageCount, bytes: result.zip.length, skipped: result.skippedImages },
      "blog backup generated",
    );
  } catch (err) {
    logger.error({ err }, "blog backup generation failed");
    if (!res.headersSent) {
      res.status(500).json({ error: "Blog backup ban nahi paaya. Thodi der baad dobara try karo." });
    } else {
      try { res.end(); } catch { /* noop */ }
    }
  }
});

// ── Super-admin "Site content + photos" archive ──────────────────────────────
// The full source backup keeps content text but not the image bytes; this bundles
// the content snapshot together with every uploaded photo as a real file plus a
// relinking manifest (see lib/contentArchive.ts). No GitHub call.
router.get("/content-backup", authMiddleware, superAdminOnly, async (_req, res) => {
  try {
    const result = await buildContentArchive();
    const filename = `growitbuddy-content-photos-${result.generatedAt.slice(0, 10)}.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.send(result.zip);

    try {
      await db.insert(adminActionLogs).values({
        action: "content-backup",
        detail: `Exported content snapshot + ${result.mediaCount} media files${result.skippedMedia ? ` (skipped ${result.skippedMedia})` : ""}`,
        ok: true,
      });
    } catch {
      /* audit log is non-fatal */
    }
    logger.info(
      { media: result.mediaCount, bytes: result.zip.length, skipped: result.skippedMedia },
      "content archive generated",
    );
  } catch (err) {
    logger.error({ err }, "content archive generation failed");
    if (!res.headersSent) {
      res.status(500).json({ error: "Content backup ban nahi paaya. Thodi der baad dobara try karo." });
    } else {
      try { res.end(); } catch { /* noop */ }
    }
  }
});

export { authMiddleware };
export default router;
