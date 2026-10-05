import { Router, type Request, type Response } from "express";
import { LoginActsAdminBody, UpdateActsCrmBody, UpdateActsCrmParams, BulkUpdateActsCrmBody, UpdateActsBackupSettingsBody, ReportActsBackupBody } from "@workspace/api-zod";
import { db, actsCrmSettings } from "@workspace/db";
import { eq } from "drizzle-orm";
import { actsAdminAuth, actsOwnerPassword, ownerPasswordMatches, createActsSession, revokeActsSession } from "../lib/acts-admin-auth";
import { actsCrmEvents, listCrm, crmStats, getCrmRecord, updateCrm } from "../lib/acts-crm";
import { backupSettings, syncActsSheets } from "../lib/acts-sheets";
import { ActsPaymentError } from "../lib/acts-razorpay";

const router = Router();
const loginAttempts = new Map<string, { count: number; expires: number }>();
const updateSchema = UpdateActsCrmBody.strict().refine(value => Object.keys(value).length > 0, "Choose a change.");
const cleanup = setInterval(() => {
  for (const [key, item] of loginAttempts) if (item.expires <= Date.now()) loginAttempts.delete(key);
}, 60000);
cleanup.unref();
function validDateInput(body: unknown) {
  if (!body || typeof body !== "object") return false;
  const value = (body as { followUpAt?: unknown }).followUpAt;
  return value === undefined || value === null ||
    (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value));
}

function guarded(fn: (req: Request, res: Response) => Promise<unknown>) {
  return async (req: Request, res: Response) => {
    try { await fn(req, res); }
    catch (error) {
      if (error instanceof ActsPaymentError && error.status === 400) {
        res.status(400).json({ error: error.message }); return;
      }
      res.status(503).json({ error: "ACTS CRM storage is temporarily unavailable. Your saved records have not been deleted." });
    }
  };
}

router.post("/login", guarded(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const attempts = loginAttempts.get(key);
  if (attempts && attempts.expires > now && attempts.count >= 5) { res.status(429).json({ error: "Too many login attempts. Wait one minute." }); return; }
  if (!attempts || attempts.expires <= now) loginAttempts.set(key, { count: 1, expires: now + 60000 });
  else attempts.count++;
  if (!actsOwnerPassword()) { res.status(503).json({ error: "ACTS admin password is not configured." }); return; }
  const parsed = LoginActsAdminBody.strict().safeParse(req.body);
  if (!parsed.success || !ownerPasswordMatches(parsed.data.password)) {
    res.status(401).json({ error: "Incorrect admin password." }); return;
  }
  loginAttempts.delete(key);
  res.json(await createActsSession());
}));

router.use(actsAdminAuth);
router.get("/session", (req, res) => res.json({ product: "acts", expiresAt: res.locals.actsSession.expiresAt.toISOString() }));
router.delete("/session", guarded(async (req, res) => { await revokeActsSession(req); res.sendStatus(204); }));
router.get("/crm", guarded(async (req, res) => { res.json(await listCrm(req.query)); }));
router.get("/stats", guarded(async (_req, res) => { res.json(await crmStats()); }));
router.post("/crm/bulk", guarded(async (req, res) => {
  const parsed = BulkUpdateActsCrmBody.extend({ changes: updateSchema }).strict().safeParse(req.body);
  if (!parsed.success || !validDateInput(req.body?.changes)) { res.status(400).json({ error: "Select up to 100 valid records and a valid change." }); return; }
  const changes = parsed.data.changes;
  res.json({ updated: await updateCrm(parsed.data.ids, changes) });
}));
router.patch("/crm/:id", guarded(async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!UpdateActsCrmParams.safeParse(req.params).success || !parsed.success || !validDateInput(req.body)) { res.status(400).json({ error: "Invalid record or update. Payment fields cannot be edited manually." }); return; }
  const changes = parsed.data;
  if (!await updateCrm([String(req.params.id)], changes)) {
    res.status(404).json({ error: "ACTS record not found." }); return;
  }
  res.json(await getCrmRecord(String(req.params.id)));
}));
router.get("/backup", guarded(async (_req, res) => { res.json(await backupSettings()); }));
router.patch("/backup", guarded(async (req, res) => {
  const parsed = UpdateActsBackupSettingsBody.strict().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Enter a valid Google spreadsheet ID." }); return; }
  await db.insert(actsCrmSettings).values({ id: 1, workbookId: parsed.data.workbookId })
    .onConflictDoUpdate({ target: actsCrmSettings.id, set: {
      workbookId: parsed.data.workbookId, lastSyncAt: null, lastSyncError: "",
    } });
  actsCrmEvents.emit("changed");
  res.json(await backupSettings());
}));
router.post("/backup/sync", async (_req, res) => {
  try { res.json(await syncActsSheets()); }
  catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : "Sheets backup failed." }); }
});
router.post("/backup/report", guarded(async (req, res) => {
  const parsed = ReportActsBackupBody.strict().safeParse(req.body);
  const settings = await backupSettings();
  if (!parsed.success || typeof req.body?.startedAt !== "string" ||
      parsed.data.workbookId !== settings.workbookId ||
      parsed.data.startedAt.getTime() > Date.now() ||
      parsed.data.startedAt.getTime() < Date.now() - 10 * 60 * 1000) {
    res.status(400).json({ error: "Backup report must match the configured workbook and a recent sync." }); return;
  }
  await db.update(actsCrmSettings).set({ lastSyncAt: parsed.data.startedAt, lastSyncError: "" }).where(eq(actsCrmSettings.id, 1));
  res.sendStatus(204);
}));
router.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write('data: {"type":"connected"}\n\n');
  const changed = () => res.write('data: {"type":"changed"}\n\n');
  actsCrmEvents.on("changed", changed);
  const keepAlive = setInterval(() => {
    if (res.locals.actsSession.expiresAt <= new Date()) res.end();
    else res.write(": heartbeat\n\n");
  }, 15000);
  req.on("close", () => { clearInterval(keepAlive); actsCrmEvents.off("changed", changed); });
});
export default router;