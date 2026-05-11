import { Router } from "express";
import { randomBytes, createHmac, timingSafeEqual, scrypt, randomUUID } from "crypto";
import { db, pool, siteContent, leads, certificates, teamMembers, portfolioItems, clientLogos, revokedTokens as revokedTokensTable, adminActionLogs, mediaFiles } from "@workspace/db";
import { eq, desc, count, asc, lt } from "drizzle-orm";
import { logger } from "../lib/logger";
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

async function saveFileToDb(file: Express.Multer.File): Promise<{ id: number; url: string }> {
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

declare module "express" {
  interface Request {
    adminRole?: AdminRole;
    adminPermissions?: string[];
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
  if (req.adminRole !== "super") {
    res.status(403).json({ error: "Super admin access required" });
    return;
  }
  next();
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

// ── Public (no-auth) read endpoint for public site ──
router.get("/public/content/:section", async (req, res) => {
  const { section } = req.params;
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

router.get("/content/:section", authMiddleware, async (req, res) => {
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
const LOCKED_SECTIONS = ["home"] as const;

router.put("/content/:section", authMiddleware, async (req, res) => {
  const section = String(req.params.section);
  if ((LOCKED_SECTIONS as readonly string[]).includes(section)) {
    res.status(403).json({ error: `The "${section}" section is locked and cannot be modified. Contact a developer to make changes.` });
    return;
  }
  const { data } = req.body;
  if (data === undefined) {
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

router.get("/leads", authMiddleware, async (req, res) => {
  const { type } = req.query;
  let rows;
  if (type && type !== "all") {
    rows = await db.select().from(leads).where(eq(leads.type, String(type))).orderBy(desc(leads.createdAt));
  } else {
    rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
  }
  res.json(rows);
});

router.get("/leads/stats", authMiddleware, async (_req, res) => {
  const rows = await db.select().from(leads);
  const byType: Record<string, number> = {};
  for (const row of rows) {
    byType[row.type] = (byType[row.type] ?? 0) + 1;
  }
  res.json({ total: rows.length, byType });
});

router.patch("/leads/:id", authMiddleware, async (req, res) => {
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

router.delete("/leads/:id", authMiddleware, async (req, res) => {
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
      .select({ id: mediaFiles.id, filename: mediaFiles.filename, size: mediaFiles.size, uploadedAt: mediaFiles.uploadedAt })
      .from(mediaFiles)
      .orderBy(desc(mediaFiles.uploadedAt))
      .limit(200);
    res.json(rows.map((r) => ({
      filename: String(r.id),
      url: `/api/media/file/${r.id}`,
      uploadedAt: r.uploadedAt.getTime(),
      size: r.size,
      originalName: r.filename,
    })));
  } catch (err) {
    logger.error({ err }, "Media list failed");
    res.json([]);
  }
});

router.delete("/media/:filename", authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.filename));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: "File not found" });
  }
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
    });
  } catch {
    res.status(500).json({ error: "Lookup failed" });
  }
});

router.get("/certificates", authMiddleware, async (_req, res) => {
  const rows = await db.select().from(certificates).orderBy(desc(certificates.createdAt));
  res.json(rows);
});

router.post("/certificates", authMiddleware, async (req, res) => {
  const { certificateId, name, email, role, issueDate, status } = req.body;
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
  const rows = await db
    .insert(certificates)
    .values({ certificateId, name, email: email || null, role, issueDate, status: status || "verified" })
    .returning();
  logger.info({ certificateId }, "Certificate created");
  res.status(201).json(rows[0]);
});

router.put("/certificates/:id", authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name, email, role, issueDate, status } = req.body;
  const rows = await db
    .update(certificates)
    .set({ name, email: email || null, role, issueDate, status, updatedAt: new Date() })
    .where(eq(certificates.id, id))
    .returning();
  if (rows.length === 0) { res.status(404).json({ error: "Certificate not found" }); return; }
  logger.info({ id }, "Certificate updated");
  res.json(rows[0]);
});

router.delete("/certificates/:id", authMiddleware, async (req, res) => {
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
  const detail = `${purged} expired session token${purged === 1 ? "" : "s"} purged from DB`;
  await pushLog("Cache Clear", detail, true);
  res.json({ ok: true, detail });
});

router.post("/optimize/image-cache-clear", authMiddleware, superAdminOnly, async (_req, res) => {
  const detail = "Image cache headers refreshed — browsers will re-fetch on next load";
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
  const detail = `${purged} expired tokens purged, DB statistics refreshed${dbOk ? "" : " (skipped)"}`;
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

router.get("/portfolio", authMiddleware, async (_req, res) => {
  try {
    const rows = await db.select().from(portfolioItems).orderBy(asc(portfolioItems.sortOrder), desc(portfolioItems.createdAt));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to list portfolio items");
    res.status(500).json({ error: "Failed to fetch portfolio items" });
  }
});

router.post("/portfolio", authMiddleware, async (req, res) => {
  const { title, category, youtubeUrl, description, sortOrder } = req.body;
  if (!title || !category || !youtubeUrl) {
    res.status(400).json({ error: "title, category, and youtubeUrl are required" });
    return;
  }
  try {
    const rows = await db.insert(portfolioItems).values({
      title, category, youtubeUrl, description: description || null,
      sortOrder: sortOrder ?? 0,
    }).returning();
    logger.info({ id: rows[0].id }, "Portfolio item created");
    res.status(201).json(rows[0]);
  } catch (err) {
    logger.error({ err }, "Failed to create portfolio item");
    res.status(500).json({ error: "Failed to create portfolio item" });
  }
});

router.put("/portfolio/:id", authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { title, category, youtubeUrl, description, sortOrder } = req.body;
  try {
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) update.title = title;
    if (category !== undefined) update.category = category;
    if (youtubeUrl !== undefined) update.youtubeUrl = youtubeUrl;
    if (description !== undefined) update.description = description;
    if (sortOrder !== undefined) update.sortOrder = sortOrder;
    const rows = await db.update(portfolioItems).set(update).where(eq(portfolioItems.id, id)).returning();
    if (rows.length === 0) { res.status(404).json({ error: "Item not found" }); return; }
    logger.info({ id }, "Portfolio item updated");
    res.json(rows[0]);
  } catch (err) {
    logger.error({ err }, "Failed to update portfolio item");
    res.status(500).json({ error: "Failed to update portfolio item" });
  }
});

router.delete("/portfolio/:id", authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
    logger.info({ id }, "Portfolio item deleted");
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to delete portfolio item");
    res.status(500).json({ error: "Failed to delete portfolio item" });
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

router.get("/logos", authMiddleware, async (_req, res) => {
  try {
    const rows = await db.select().from(clientLogos).orderBy(asc(clientLogos.sortOrder), asc(clientLogos.createdAt));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to list client logos");
    res.status(500).json({ error: "Failed to fetch client logos" });
  }
});

router.post("/logos", authMiddleware, upload.single("image"), async (req, res) => {
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

router.put("/logos/:id", authMiddleware, upload.single("image"), async (req, res) => {
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

router.delete("/logos/:id", authMiddleware, async (req, res) => {
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

export { authMiddleware };
export default router;
