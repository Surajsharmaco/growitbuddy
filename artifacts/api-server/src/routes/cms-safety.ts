import { Router, type RequestHandler } from "express";
import {
  CmsError, readCollection, mutateCollection, listRevisions, getRevision,
  listBackups, createBackup, backupDocument, inspectRestore, restoreMissing,
  createOffsiteKey, listOffsiteKeys, revokeOffsiteKey, authorizeOffsiteKey, offsiteDocument,
  listCmsSections,
} from "../lib/cmsSafety";
import { logger } from "../lib/logger";

export function createCmsSafetyRouter(middleware: {
  auth: RequestHandler; section: RequestHandler; superAdmin: RequestHandler;
}) {
  const router = Router();
  const wrap = (handler: RequestHandler): RequestHandler => async (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, private");
    try { await handler(req, res, next); }
    catch (error) {
      if (error instanceof CmsError) res.status(error.status).json({ error: error.message });
      else {
        logger.error({ error }, "CMS safety request failed");
        res.status(503).json({ error: "CMS safety is unavailable. Verify the cms-safety migration and database connection. No successful save or restore is claimed." });
      }
    }
  };
  router.get("/offsite-export", wrap(async (req, res) => {
    const key = req.headers.authorization?.replace(/^Bearer /, "") ?? "";
    if (!(await authorizeOffsiteKey(key))) { res.status(401).json({ error: "Invalid, expired or revoked backup-only key." }); return; }
    res.setHeader("Content-Disposition", 'attachment; filename="growitbuddy-offsite-backup.json"');
    res.json(await offsiteDocument());
  }));
  router.use(middleware.auth);
  router.get("/offsite-keys", middleware.superAdmin, wrap(async (_req, res) => res.json({ keys: await listOffsiteKeys() })));
  router.post("/offsite-keys", middleware.superAdmin, wrap(async (_req, res) => res.json(await createOffsiteKey())));
  router.delete("/offsite-keys/:id", middleware.superAdmin, wrap(async (req, res) => { await revokeOffsiteKey(String(req.params.id)); res.json({ success: true }); }));
  router.get("/backups", middleware.superAdmin, wrap(async (_req, res) => res.json({ backups: await listBackups(), sections: await listCmsSections(), automaticOffsite: false, retention: { daily: 30, other: 60 }, note: "These snapshots are in the same database. Download copies to independent storage." })));
  router.post("/backups", middleware.superAdmin, wrap(async (_req, res) => res.json({ id: await createBackup() })));
  router.get("/backups/:id/download", middleware.superAdmin, wrap(async (req, res) => {
    const document = await backupDocument(String(req.params.id));
    res.setHeader("Content-Disposition", `attachment; filename="growitbuddy-cms-${req.params.id}.json"`);
    res.json(document);
  }));
  // The restore parser is route-local. Ordinary post saves keep the smaller limit.
  router.post("/restore/preview", middleware.superAdmin, wrap(async (req, res) => res.json(await inspectRestore(req.body.document))));
  router.post("/restore", middleware.superAdmin, wrap(async (req, res) => res.json(await restoreMissing(req.body.document, req.body.expectedState, req.body.confirm))));
  const sectionGuard: RequestHandler = (req, res, next) => {
    if (String(req.params.section).includes("__v__") && req.adminRole !== "super") { res.status(403).json({ error: "Blog variants require super admin access." }); return; }
    middleware.section(req, res, next);
  };
  router.get("/:section", sectionGuard, wrap(async (req, res) => res.json(await readCollection(String(req.params.section)))));
  router.patch("/:section", sectionGuard, wrap(async (req, res) => res.json(await mutateCollection(String(req.params.section), req.body))));
  router.get("/:section/revisions", sectionGuard, wrap(async (req, res) => res.json({ revisions: await listRevisions(String(req.params.section), typeof req.query.slug === "string" ? req.query.slug : undefined) })));
  router.get("/:section/revisions/:id", sectionGuard, wrap(async (req, res) => res.json(await getRevision(String(req.params.section), String(req.params.id)))));
  return router;
}
