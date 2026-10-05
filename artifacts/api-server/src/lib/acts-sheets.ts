import { db, actsCrmSettings, actsCrmRecords } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { actsCrmEvents } from "./acts-crm";
import { actsCredentialSource } from "./acts-admin-auth";

let scheduled: ReturnType<typeof setTimeout> | undefined;
let running: Promise<{ synced: number; workbookId: string }> | undefined;
let dirty = false;
let generation = 0;
export function sheetsConfigured() {
  return !!process.env.ACTS_SHEETS_SYNC_URL && !!process.env.ACTS_SHEETS_SYNC_TOKEN &&
    process.env.ACTS_SHEETS_SYNC_TOKEN.length >= 32;
}
export async function backupSettings() {
  const [row] = await db.select().from(actsCrmSettings).where(eq(actsCrmSettings.id, 1)).limit(1);
  const workbookId = row?.workbookId || process.env.ACTS_SHEETS_WORKBOOK_ID || "";
  return { workbookId, workbookUrl: workbookId ? `https://docs.google.com/spreadsheets/d/${workbookId}/edit` : "",
    configured: sheetsConfigured() && !!workbookId, lastSyncAt: row?.lastSyncAt?.toISOString() ?? null,
    lastSyncError: row?.lastSyncError ?? "", credentialSource: actsCredentialSource() };
}
export async function syncActsSheets() {
  if (running) return running;
  const version = generation;
  const startedAt = new Date();
  running = (async () => {
    const settings = await backupSettings();
    if (!settings.configured) throw new Error("Google Sheets backup is not configured. Deploy the ACTS Apps Script and set the API service's ACTS_SHEETS_SYNC_URL and ACTS_SHEETS_SYNC_TOKEN.");
    const endpoint = new URL(process.env.ACTS_SHEETS_SYNC_URL!);
    if (endpoint.protocol !== "https:" || endpoint.hostname !== "script.google.com" || !/^\/macros\/s\/[^/]+\/exec$/.test(endpoint.pathname)) {
      throw new Error("ACTS Sheets endpoint must be a Google Apps Script HTTPS deployment URL.");
    }
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: process.env.ACTS_SHEETS_SYNC_TOKEN, workbookId: settings.workbookId }),
      signal: AbortSignal.timeout(120000) });
    const data = await response.json().catch(() => null) as { ok?: boolean; synced?: number; workbookId?: string } | null;
    if (!response.ok || data?.ok !== true || typeof data.synced !== "number" || !Number.isSafeInteger(data.synced) || data.synced < 0 || data.workbookId !== settings.workbookId) {
      throw new Error("Google Sheets backup did not confirm a complete sync. Check Apps Script configuration.");
    }
    // Use the start time, so updates during a backup are never marked as backed up.
    await db.update(actsCrmSettings).set({ lastSyncAt: startedAt, lastSyncError: "" }).where(eq(actsCrmSettings.id, 1));
    dirty = generation !== version;
    return { synced: data.synced as number, workbookId: settings.workbookId as string };
  })();
  try { return await running; }
  catch (error) {
    await db.update(actsCrmSettings).set({ lastSyncError: "Backup failed or is not configured. CRM data remains safe in the database." }).where(eq(actsCrmSettings.id, 1)).catch(() => {});
    throw error;
  } finally { running = undefined; }
}
function schedule() {
  dirty = true;
  if (!sheetsConfigured() || scheduled || running) return;
  scheduled = setTimeout(() => {
    scheduled = undefined;
    void syncActsSheets().catch(() => { /* Retry timer and admin health show failures; never roll back CRM writes. */ });
  }, 2000);
  scheduled.unref();
}
actsCrmEvents.on("changed", () => { generation++; schedule(); });
const retryTimer = setInterval(() => {
  if (!sheetsConfigured()) return;
  void (async () => {
    const settings = await backupSettings();
    const [row] = await db.select({ pending: sql<boolean>`EXISTS(SELECT 1 FROM ${actsCrmRecords} WHERE ${actsCrmRecords.updatedAt} > ${settings.lastSyncAt ? new Date(settings.lastSyncAt) : new Date(0)})` }).from(actsCrmSettings).where(eq(actsCrmSettings.id, 1));
    if (dirty || row?.pending) schedule();
  })().catch(() => { /* Storage will be rechecked; source records remain intact. */ });
}, 60000);
retryTimer.unref();