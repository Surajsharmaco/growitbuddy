import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { db, actsAdminSessions } from "@workspace/db";
import { eq, lt } from "drizzle-orm";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
// Reuse GrowitBuddy's owner password, never a separate ACTS override.
// The live-password alias is the preview's secure reference to the live owner;
// the shared production API already supplies that owner password as ADMIN_PASSWORD.
export const actsOwnerPassword = () => process.env.GROWITBUDDY_LIVE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
export const actsCredentialSource = () => "shared_owner" as const;
export function ownerPasswordMatches(value: string) {
  const configured = actsOwnerPassword();
  return !!configured && timingSafeEqual(Buffer.from(hash(value), "hex"), Buffer.from(hash(configured), "hex"));
}
export async function createActsSession() {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.delete(actsAdminSessions).where(lt(actsAdminSessions.expiresAt, new Date()));
  await db.insert(actsAdminSessions).values({ tokenHash: hash(token), expiresAt });
  return { token, expiresAt: expiresAt.toISOString() };
}
export const actsBearer = (req: Request) => req.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
export async function actsAdminAuth(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "no-store");
  const token = actsBearer(req);
  if (!token) { res.status(401).json({ error: "ACTS admin login required." }); return; }
  try {
    const [session] = await db.select().from(actsAdminSessions).where(eq(actsAdminSessions.tokenHash, hash(token))).limit(1);
    if (!session || session.expiresAt <= new Date()) { res.status(401).json({ error: "ACTS admin session expired." }); return; }
    res.locals.actsSession = session;
    next();
  } catch { res.status(503).json({ error: "Admin session storage is unavailable." }); }
}
export async function revokeActsSession(req: Request) {
  const token = actsBearer(req);
  if (token) await db.delete(actsAdminSessions).where(eq(actsAdminSessions.tokenHash, hash(token)));
}