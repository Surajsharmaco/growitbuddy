import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { and, eq, sql, desc, asc, inArray } from "drizzle-orm";
import { db, actsCrmRecords, actsMembershipCheckouts, actsMembers } from "@workspace/db";
import { ActsPaymentError } from "./acts-razorpay";
import { actsDateRange } from "./acts-date-range";

export const actsCrmEvents = new EventEmitter();
actsCrmEvents.setMaxListeners(200);
export const crmChanged = () => actsCrmEvents.emit("changed");
let history: Promise<void> | undefined;
function indexHistoricalCheckouts() {
  if (!history) {
    history = db.execute(sql`
      INSERT INTO acts_crm_records(id, submission_key, checkout_id, application, created_at, updated_at)
      SELECT c.id, c.id, c.id, c.application, c.created_at, now()
      FROM acts_membership_checkouts c
      WHERE NOT EXISTS (SELECT 1 FROM acts_crm_records r WHERE r.checkout_id = c.id)
      ON CONFLICT DO NOTHING
    `).then(result => { if (result.rowCount) crmChanged(); })
      .catch(error => { history = undefined; throw error; });
  }
  return history;
}
const stable = (a: Record<string, unknown>) => JSON.stringify(Object.keys(a).sort().map(k => [k, a[k]]));

export async function recordActsSubmission(application: Record<string, unknown>, key?: string) {
  const submissionKey = key ?? randomUUID();
  await db.insert(actsCrmRecords).values({ id: randomUUID(), submissionKey, application }).onConflictDoNothing();
  const [record] = await db.select().from(actsCrmRecords).where(eq(actsCrmRecords.submissionKey, submissionKey)).limit(1);
  if (!record || stable(record.application) !== stable(application)) {
    throw new ActsPaymentError(409, "This submission reference belongs to different details. Please reopen the form.");
  }
  crmChanged();
  return record;
}

export const crmSelection = {
  id: actsCrmRecords.id, application: actsCrmRecords.application,
  stage: actsCrmRecords.stage, notes: actsCrmRecords.notes,
  followUpAt: actsCrmRecords.followUpAt, archived: actsCrmRecords.archived,
  createdAt: actsCrmRecords.createdAt, updatedAt: actsCrmRecords.updatedAt,
  paymentStatus: sql<string>`CASE WHEN ${actsMembers.id} IS NOT NULL THEN 'successful' WHEN ${actsMembershipCheckouts.id} IS NOT NULL THEN 'pending' ELSE 'form_submitted' END`,
  amount: sql<number>`COALESCE(${actsMembers.amount}, ${actsMembershipCheckouts.amount}, 9900)`,
  currency: sql<string>`'INR'`,
  orderId: actsMembershipCheckouts.orderId, paymentId: actsMembers.paymentId,
  paidAt: actsMembers.paidAt,
  reviewStatus: sql<string>`CASE WHEN ${actsMembers.id} IS NOT NULL THEN 'pending_review' ELSE 'not_submitted' END`,
};

export function crmWhere(query: Record<string, unknown>) {
  const filters = [];
  if (query.followUps !== undefined) {
    if (!["all", "due", "overdue", "upcoming"].includes(String(query.followUps))) {
      throw new ActsPaymentError(400, "Choose a valid follow-up filter.");
    }
    filters.push(sql`${actsCrmRecords.followUpAt} IS NOT NULL`, sql`${actsCrmRecords.stage} <> 'closed'`);
    const today = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
    const day = actsDateRange(today, today)!;
    if (query.followUps === "due") filters.push(sql`${actsCrmRecords.followUpAt} < ${day.end}`);
    if (query.followUps === "overdue") filters.push(sql`${actsCrmRecords.followUpAt} < ${day.start}`);
    if (query.followUps === "upcoming") filters.push(sql`${actsCrmRecords.followUpAt} >= ${day.end}`);
  }
  if (query.includeArchived !== "true" && query.includeArchived !== true) filters.push(eq(actsCrmRecords.archived, false));
  if (["new", "contacted", "qualified", "closed"].includes(String(query.stage))) {
    filters.push(eq(actsCrmRecords.stage, String(query.stage)));
  }
  const search = String(query.search ?? "").trim().slice(0, 200);
  if (search) {
    const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
    filters.push(sql`(${actsCrmRecords.application}::text ILIKE ${pattern} OR ${actsCrmRecords.notes} ILIKE ${pattern} OR ${actsMembershipCheckouts.orderId} ILIKE ${pattern} OR ${actsMembers.paymentId} ILIKE ${pattern})`);
  }
  if (query.paymentStatus === "successful") filters.push(sql`${actsMembers.id} IS NOT NULL`);
  if (query.paymentStatus === "pending") filters.push(sql`${actsMembers.id} IS NULL AND ${actsMembershipCheckouts.id} IS NOT NULL`);
  if (query.paymentStatus === "form_submitted") filters.push(sql`${actsMembershipCheckouts.id} IS NULL`);
  const range = actsDateRange(query.fromDate, query.toDate);
  const dateColumn = query.followUps !== undefined ? actsCrmRecords.followUpAt : actsCrmRecords.createdAt;
  if (range) filters.push(sql`${dateColumn} >= ${range.start} AND ${dateColumn} < ${range.end}`);
  return and(...filters);
}

export async function listCrm(query: Record<string, unknown>) {
  await indexHistoricalCheckouts();
  const page = Math.max(1, Math.min(100000, Number(query.page) || 1)) | 0;
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 25)) | 0;
  const where = crmWhere(query);
  const from = () => db.select(crmSelection).from(actsCrmRecords)
    .leftJoin(actsMembershipCheckouts, eq(actsCrmRecords.checkoutId, actsMembershipCheckouts.id))
    .leftJoin(actsMembers, eq(actsMembershipCheckouts.id, actsMembers.checkoutId));
  const items = await from().where(where).orderBy(
    query.followUps !== undefined ? asc(actsCrmRecords.followUpAt) : desc(actsCrmRecords.createdAt),
    desc(actsCrmRecords.id),
  ).limit(limit).offset((page - 1) * limit);
  const [result] = await db.select({ total: sql<number>`count(*)::int` }).from(actsCrmRecords)
    .leftJoin(actsMembershipCheckouts, eq(actsCrmRecords.checkoutId, actsMembershipCheckouts.id))
    .leftJoin(actsMembers, eq(actsMembershipCheckouts.id, actsMembers.checkoutId)).where(where);
  return { items, total: result.total, page, limit };
}

export async function getCrmRecord(id: string) {
  const [row] = await db.select(crmSelection).from(actsCrmRecords)
    .leftJoin(actsMembershipCheckouts, eq(actsCrmRecords.checkoutId, actsMembershipCheckouts.id))
    .leftJoin(actsMembers, eq(actsMembershipCheckouts.id, actsMembers.checkoutId))
    .where(eq(actsCrmRecords.id, id)).limit(1);
  return row;
}

export async function updateCrm(ids: string[], changes: { stage?: string; notes?: string; followUpAt?: Date | null; archived?: boolean }) {
  const rows = await db.update(actsCrmRecords).set({ ...changes, updatedAt: new Date() })
    .where(inArray(actsCrmRecords.id, ids)).returning({ id: actsCrmRecords.id });
  crmChanged();
  return rows.length;
}

export async function crmStats() {
  await indexHistoricalCheckouts();
  const [stats] = await db.select({
    total: sql<number>`count(*) FILTER (WHERE NOT ${actsCrmRecords.archived})::int`,
    paid: sql<number>`count(*) FILTER (WHERE NOT ${actsCrmRecords.archived} AND ${actsMembers.id} IS NOT NULL)::int`,
    pending: sql<number>`count(*) FILTER (WHERE NOT ${actsCrmRecords.archived} AND ${actsMembers.id} IS NULL AND ${actsMembershipCheckouts.id} IS NOT NULL)::int`,
    submitted: sql<number>`count(*) FILTER (WHERE NOT ${actsCrmRecords.archived} AND ${actsMembershipCheckouts.id} IS NULL)::int`,
    archived: sql<number>`count(*) FILTER (WHERE ${actsCrmRecords.archived})::int`,
    followUpsDue: sql<number>`count(*) FILTER (WHERE NOT ${actsCrmRecords.archived} AND ${actsCrmRecords.followUpAt} <= now() AND ${actsCrmRecords.stage} <> 'closed')::int`,
    capturedAmount: sql<number>`COALESCE(sum(${actsMembers.amount}),0)::int`,
  }).from(actsCrmRecords).leftJoin(actsMembershipCheckouts, eq(actsCrmRecords.checkoutId, actsMembershipCheckouts.id))
    .leftJoin(actsMembers, eq(actsMembershipCheckouts.id, actsMembers.checkoutId));
  return stats;
}