import { after, test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { once } from "node:events";
import express from "express";
import { eq, inArray } from "drizzle-orm";
import { db, pool, actsMembers, actsMembershipCheckouts, actsCrmRecords } from "@workspace/db";
import membershipRouter from "../src/routes/acts-membership";
import actsAdminRouter from "../src/routes/acts-admin";
import { actsDateRange } from "../src/lib/acts-date-range";
import { indiaToday, isCalendarDate, presetDates } from "../../acts-club/src/admin/date-filter";
import { ActsApplicationInput } from "../src/lib/acts-membership";

// Synthetic credentials exist only in this isolated test process. Every provider
// request is intercepted; these tests cannot charge a card or use live Razorpay.
const keySecret = `fixture-${randomUUID()}`;
test("ACTS date presets use IST calendar days and seven inclusive days", () => {
  assert.equal(indiaToday(new Date("2026-10-04T18:29:59Z")), "2026-10-04");
  assert.equal(indiaToday(new Date("2026-10-04T18:30:00Z")), "2026-10-05");
  assert.deepEqual(presetDates("today", "2026-10-05"), { fromDate: "2026-10-05", toDate: "2026-10-05" });
  assert.deepEqual(presetDates("tomorrow", "2026-12-31"), { fromDate: "2027-01-01", toDate: "2027-01-01" });
  assert.deepEqual(presetDates("yesterday", "2026-01-01"), { fromDate: "2025-12-31", toDate: "2025-12-31" });
  assert.deepEqual(presetDates("last7", "2026-10-05"), { fromDate: "2026-09-29", toDate: "2026-10-05" });
  assert.deepEqual(presetDates("all", "2026-10-05"), { fromDate: "", toDate: "" });
});
test("ACTS custom date boundaries include the entire IST end day and reject invalid ranges", () => {
  assert.equal(isCalendarDate("61004-02-02"), false);
  assert.equal(isCalendarDate(""), false);
  assert.equal(isCalendarDate("2026-02-30"), false);
  assert.equal(isCalendarDate("2026-10-04"), true);
  const range = actsDateRange("2026-10-05", "2026-10-05")!;
  assert.equal(range.start.toISOString(), "2026-10-04T18:30:00.000Z");
  assert.equal(range.end.toISOString(), "2026-10-05T18:30:00.000Z");
  assert.ok(actsDateRange("2024-02-29", "2024-02-29"));
  assert.equal(actsDateRange(undefined, undefined), null);
  for (const [from, to] of [["2026-02-30", "2026-03-01"], ["2026-10-06", "2026-10-05"], ["0000-01-01", "0000-01-01"], ["", ""], ["2026-10-05", undefined]]) {
    assert.throws(() => actsDateRange(from, to), /valid From and To/);
  }
});
const webhookSecret = `fixture-webhook-${randomUUID()}`;
process.env.RAZORPAY_KEY_ID = "rzp_test_fixture";
process.env.RAZORPAY_KEY_SECRET = keySecret;
process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
const realFetch = globalThis.fetch;
const orders: string[] = [];
const submissionKeys: string[] = [];
const adminPassword = `synthetic-owner-${randomUUID()}`;
process.env.ADMIN_PASSWORD = adminPassword;
process.env.ACTS_ADMIN_PASSWORD = `synthetic-ignored-${randomUUID()}`;
delete process.env.GROWITBUDDY_LIVE_ADMIN_PASSWORD;
delete process.env.ACTS_SHEETS_SYNC_URL;
delete process.env.ACTS_SHEETS_SYNC_TOKEN;
const payments = new Map<string, Record<string, unknown>>();
let unavailable = false;
globalThis.fetch = async (input, init) => {
  const url = String(input);
  assert.ok(url.startsWith("https://api.razorpay.com/v1/"), "Only mocked Razorpay requests are allowed");
  if (unavailable) throw new Error("Synthetic provider failure");
  let data: unknown;
  if (url.endsWith("/orders") && init?.method === "POST") {
    const body = JSON.parse(String(init.body));
    assert.equal(body.amount, 9900);
    assert.equal(body.currency, "INR");
    assert.ok(!JSON.stringify(body.notes).includes("Contact"), "Do not send personal data in order notes");
    const id = `order_Test${randomUUID().replace(/-/g, "")}`;
    orders.push(id);
    data = { id, amount: 9900, currency: "INR" };
  } else if (url.includes("/orders/") && url.includes("/payments")) {
    const id = url.split("/orders/")[1].split("/")[0];
    data = { items: [...payments.values()].filter(payment => payment.order_id === id) };
  } else {
    const id = url.split("/payments/")[1];
    assert.ok(payments.has(id), "A payment fixture must exist");
    data = payments.get(id);
  }
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
};

const app = express();
app.use("/api/acts/membership/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use((req, _res, next) => { req.log = { warn() {} } as typeof req.log; next(); });
app.use("/api/acts/membership", membershipRouter);
app.use("/api/acts/admin", actsAdminRouter);
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/acts/membership`;

const application = {
  fullName: "ACTS Payment Test",
  contactNumber: "+91 98765 43210",
  whatsappNumber: "+91 98765 43210",
  city: "Test City",
  instagramId: "test.creator",
  youAre: "Creator", creatorType: "Other", otherType: "Test creator",
  primarySkill: "Other", otherSkill: "Test skill",
  lookingFor: "All of the above", agreesToGuidelines: true,
};
async function request(path: string, body?: unknown, token?: string, headers: Record<string, string> = {}) {
  if (path === "/orders" && body && typeof body === "object" && !(body as { checkoutToken?: string }).checkoutToken) {
    const submissionKey = (body as { submissionKey?: string }).submissionKey ?? randomUUID();
    submissionKeys.push(submissionKey);
    body = { ...body, submissionKey };
  }
  const response = await realFetch(`${base}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() as Record<string, any>, cache: response.headers.get("cache-control") };
}
async function start() {
  const result = await request("/orders", application);
  assert.equal(result.status, 200);
  return result.body as { orderId: string; checkoutToken: string; amount: number; currency: string };
}
function payment(orderId: string, captured = false) {
  const value = {
    id: `pay_Test${randomUUID().replace(/-/g, "")}`, order_id: orderId,
    amount: 9900, currency: "INR", status: captured ? "captured" : "authorized", captured,
  };
  payments.set(value.id, value);
  return value;
}
function verification(orderId: string, paymentId: string) {
  return { orderId, paymentId, signature: createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex") };
}
async function membersFor(orderId: string) {
  const [checkout] = await db.select().from(actsMembershipCheckouts).where(eq(actsMembershipCheckouts.orderId, orderId));
  return db.select().from(actsMembers).where(eq(actsMembers.checkoutId, checkout.id));
}
function signedEvent(orderId: string, paymentId: string) {
  const raw = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: paymentId, order_id: orderId } } } }, null, 2);
  return { raw, signature: createHmac("sha256", webhookSecret).update(raw).digest("hex") };
}

after(async () => {
  globalThis.fetch = realFetch;
  // Remove only submissions created by this test, including provider-failure forms.
  if (submissionKeys.length) await db.delete(actsCrmRecords).where(inArray(actsCrmRecords.submissionKey, submissionKeys));
  const checkouts = orders.length ? await db.select().from(actsMembershipCheckouts).where(inArray(actsMembershipCheckouts.orderId, orders)) : [];
  if (checkouts.length) {
    const ids = checkouts.map(checkout => checkout.id);
    await db.delete(actsMembers).where(inArray(actsMembers.checkoutId, ids));
    await db.delete(actsMembershipCheckouts).where(inArray(actsMembershipCheckouts.id, ids));
  }
  await new Promise<void>(resolve => server.close(() => resolve()));
  await pool.end();
});

test("ACTS admin isolation, CRM persistence and live changes", async t => {
  const adminBase = base.replace("/membership", "/admin");
  async function admin(path: string, method = "GET", body?: unknown, token?: string) {
    const response = await realFetch(adminBase + path, {
      method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, cache: response.headers.get("cache-control"),
      body: response.status === 204 ? null : await response.json() as Record<string, any> };
  }
  let token = "";
  await t.test("ACTS-only login rejects unauthenticated requests and checkout/GB tokens", async () => {
    assert.equal((await admin("/crm")).status, 401);
    assert.equal((await admin("/crm", "GET", undefined, "1.nonce.super.WyJhbGwiXQ.fake")).status, 401);
    const order = await start();
    assert.equal((await admin("/crm", "GET", undefined, order.checkoutToken)).status, 401);
    assert.equal((await admin("/login", "POST", { password: "synthetic-wrong" })).status, 401);
    assert.equal((await admin("/login", "POST", { password: process.env.ACTS_ADMIN_PASSWORD })).status, 401);
    const login = await admin("/login", "POST", { password: adminPassword });
    assert.equal(login.status, 200);
    token = login.body!.token;
    assert.match(token, /^[a-f0-9]{64}$/);
    assert.equal((await admin("/session", "GET", undefined, token)).body!.product, "acts");
  });
  await t.test("configured live GrowitBuddy password works instead of a separate ACTS password", async () => {
    const livePassword = `synthetic-live-owner-${randomUUID()}`;
    process.env.GROWITBUDDY_LIVE_ADMIN_PASSWORD = livePassword;
    try {
      assert.equal((await admin("/login", "POST", { password: adminPassword })).status, 401);
      const login = await admin("/login", "POST", { password: livePassword });
      assert.equal(login.status, 200);
      const sharedSession = login.body!.token;
      assert.equal((await admin("/session", "GET", undefined, sharedSession)).status, 200);
      assert.equal((await admin("/backup", "GET", undefined, sharedSession)).body!.credentialSource, "shared_owner");
      assert.equal((await admin("/session", "DELETE", undefined, sharedSession)).status, 204);
    } finally { delete process.env.GROWITBUDDY_LIVE_ADMIN_PASSWORD; }
  });
  await t.test("failed checkout preserves the entire submitted form; safe edits/archive/restore persist", async () => {
    const name = `ACTS CRM Failure ${randomUUID()}`;
    const submissionKey = randomUUID();
    unavailable = true;
    try { assert.equal((await request("/orders", { ...application, fullName: name, submissionKey })).status, 502); }
    finally { unavailable = false; }
    let found = await admin("/crm?search=" + encodeURIComponent(name), "GET", undefined, token);
    assert.equal(found.status, 200); assert.equal(found.cache, "no-store");
    assert.equal(found.body!.total, 1);
    const row = found.body!.items[0];
    assert.equal(row.paymentStatus, "form_submitted"); assert.equal(row.orderId, null);
    assert.equal(row.application.whatsappNumber, "+919876543210");
    assert.equal(row.application.otherSkill, "Test skill"); assert.equal(row.application.agreesToGuidelines, true);
    const submittedDay = indiaToday(new Date(row.createdAt));
    const dateQuery = "/crm?search=" + encodeURIComponent(name) + "&fromDate=" + submittedDay + "&toDate=" + submittedDay;
    assert.equal((await admin(dateQuery, "GET", undefined, token)).body!.total, 1);
    const nextDay = presetDates("tomorrow", submittedDay).fromDate;
    assert.equal((await admin("/crm?search=" + encodeURIComponent(name) + "&fromDate=" + nextDay + "&toDate=" + nextDay, "GET", undefined, token)).body!.total, 0);
    assert.equal((await admin("/crm?fromDate=2026-02-30&toDate=2026-03-01", "GET", undefined, token)).status, 400);
    assert.equal((await admin("/crm/" + row.id, "PATCH", { paymentStatus: "successful" }, token)).status, 400);
    assert.equal((await admin("/crm/" + row.id, "PATCH", { followUpAt: true }, token)).status, 400);
    const edit = await admin("/crm/" + row.id, "PATCH", { stage: "contacted", notes: "Synthetic follow-up", followUpAt: "2026-10-06T03:30:00.000Z" }, token);
    assert.equal(edit.status, 200); assert.equal(edit.body!.notes, "Synthetic follow-up");
    assert.equal(edit.body!.followUpAt, "2026-10-06T03:30:00.000Z");
    assert.equal((await admin("/crm/bulk", "POST", { ids: [row.id], changes: { archived: true } }, token)).body!.updated, 1);
    assert.equal((await admin("/crm?search=" + encodeURIComponent(name), "GET", undefined, token)).body!.total, 0);
    assert.equal((await admin("/crm?includeArchived=true&search=" + encodeURIComponent(name), "GET", undefined, token)).body!.items[0].archived, true);
    assert.equal((await admin("/crm/bulk", "POST", { ids: [row.id], changes: { archived: false } }, token)).body!.updated, 1);
    found = await admin("/crm?search=" + encodeURIComponent(name), "GET", undefined, token);
    assert.equal(found.body!.items[0].notes, "Synthetic follow-up");
    const search = "&search=" + encodeURIComponent(name);
    assert.equal((await admin("/crm?followUps=all" + search, "GET", undefined, token)).body!.total, 1);
    assert.equal((await admin("/crm?followUps=all&fromDate=2026-10-06&toDate=2026-10-06" + search, "GET", undefined, token)).body!.total, 1);
    assert.equal((await admin("/crm?followUps=all&fromDate=2026-10-07&toDate=2026-10-07" + search, "GET", undefined, token)).body!.total, 0);
    assert.equal((await admin("/crm?followUps=invalid", "GET", undefined, token)).status, 400);
    await admin("/crm/" + row.id, "PATCH", { stage: "closed" }, token);
    assert.equal((await admin("/crm?followUps=all" + search, "GET", undefined, token)).body!.total, 0);
    await admin("/crm/" + row.id, "PATCH", { stage: "contacted", followUpAt: null }, token);
    assert.equal((await admin("/crm?followUps=all" + search, "GET", undefined, token)).body!.total, 0);
    assert.equal((await admin("/crm?" + search.slice(1), "GET", undefined, token)).body!.total, 1);
  });
  await t.test("captured payment updates the same CRM entry, stats and event stream", async () => {
    const controller = new AbortController();
    const stream = await realFetch(adminBase + "/events", { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
    const reader = stream.body!.getReader();
    assert.match(new TextDecoder().decode((await reader.read()).value), /connected/);
    const before = (await admin("/stats", "GET", undefined, token)).body!;
    const order = await start();
    const changed = await reader.read();
    assert.match(new TextDecoder().decode(changed.value), /changed/);
    controller.abort();
    await reader.cancel().catch(() => {});
    const captured = payment(order.orderId, true);
    const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: captured } } });
    const signature = createHmac("sha256", webhookSecret).update(body).digest("hex");
    assert.equal((await request("/webhook", body, undefined, { "x-razorpay-signature": signature })).status, 200);
    const found = await admin("/crm?search=" + order.orderId, "GET", undefined, token);
    assert.equal(found.body!.total, 1);
    assert.equal(found.body!.items[0].paymentStatus, "successful");
    assert.equal(found.body!.items[0].paymentId, captured.id);
    assert.equal(found.body!.items[0].reviewStatus, "pending_review");
    const after = (await admin("/stats", "GET", undefined, token)).body!;
    assert.equal(after.paid, before.paid + 1); assert.equal(after.capturedAmount, before.capturedAmount + 9900);
    // Lost order responses retry the original order rather than create a second one.
    const key = submissionKeys[submissionKeys.length - 1];
    assert.equal((await request("/orders", { ...application, submissionKey: key })).status, 409);
  });
  await t.test("follow-up queue filters IST days, sorts earliest first and excludes unscheduled, closed and archived records", async () => {
    const today = indiaToday();
    const yesterday = presetDates("yesterday", today).fromDate;
    const tomorrow = presetDates("tomorrow", today).fromDate;
    const marker = `Follow-up fixture ${randomUUID()}`;
    const fixtures = [
      { day: tomorrow }, { day: yesterday }, { day: today },
      { day: today, archived: true }, { day: today, stage: "closed" }, { day: null },
    ];
    const ids: string[] = [];
    for (const fixture of fixtures) {
      const submissionKey = randomUUID(); submissionKeys.push(submissionKey);
      const id = randomUUID(); ids.push(id);
      await db.insert(actsCrmRecords).values({
        id, submissionKey, application: { ...application, fullName: marker },
        createdAt: new Date("2020-01-01T00:00:00Z"),
        followUpAt: fixture.day ? new Date(fixture.day + "T09:00:00+05:30") : null,
        stage: fixture.stage ?? "new", archived: fixture.archived ?? false,
      });
    }
    const queue = async (filter: string, more = "") =>
      (await admin("/crm?followUps=" + filter + "&search=" + encodeURIComponent(marker) + more, "GET", undefined, token)).body!;
    assert.deepEqual((await queue("all")).items.map((r: { id: string }) => r.id), [ids[1], ids[2], ids[0]]);
    assert.equal((await queue("due")).total, 2);
    assert.equal((await queue("overdue")).items[0].id, ids[1]);
    assert.equal((await queue("upcoming")).items[0].id, ids[0]);
    assert.equal((await queue("all", "&fromDate=" + today + "&toDate=" + today)).items[0].id, ids[2]);
    assert.equal((await queue("all", "&includeArchived=true")).total, 4);
    assert.equal((await queue("all", "&limit=1&page=2")).items[0].id, ids[2]);
  });
  await t.test("backup is honestly unconfigured and logout revokes server-side", async () => {
    const settings = await admin("/backup", "GET", undefined, token);
    assert.equal(settings.body!.configured, false);
    assert.equal((await admin("/backup/report", "POST", { workbookId: settings.body!.workbookId, synced: 0, startedAt: "2099-01-01T00:00:00Z" }, token)).status, 400);
    assert.equal((await admin("/session", "DELETE", undefined, token)).status, 204);
    assert.equal((await admin("/crm", "GET", undefined, token)).status, 401);
  });
});

test("ACTS payment safety and persisted membership flow", async t => {
  await t.test("conditional requirements and guidelines reject invalid input", () => {
    for (const invalid of [
      { ...application, agreesToGuidelines: false },
      { ...application, creatorType: undefined },
      { ...application, otherType: "" },
      { ...application, otherSkill: "" },
      { ...application, contactNumber: "not-a-number" },
      { ...application, fullName: "  " },
      { ...application, youAre: "Other", otherType: "" },
    ]) assert.equal(ActsApplicationInput.safeParse(invalid).success, false);
    assert.equal(ActsApplicationInput.safeParse({ ...application, youAre: "Freelancer", creatorType: undefined }).success, true);
  });

  const initialOrderCount = orders.length;
  const order = await start();
  const pay = payment(order.orderId);
  await t.test("order creation uses ₹99 INR and stores no paid member", async () => {
    assert.equal(order.amount, 9900);
    assert.equal(order.currency, "INR");
    assert.equal((await membersFor(order.orderId)).length, 0);
    const resumed = await request("/orders", { ...application, checkoutToken: order.checkoutToken, amount: 9 });
    assert.equal(resumed.status, 200, "JSONB key ordering must not break checkout resumption");
    assert.equal(resumed.body.orderId, order.orderId);
    assert.equal(resumed.body.amount, 9900);
    assert.equal(orders.length, initialOrderCount + 1);
  });

  await t.test("private tokens, signatures and order binding are enforced", async () => {
    assert.equal((await request("/status")).status, 401);
    assert.equal((await request("/status", undefined, "a".repeat(64))).status, 401);
    assert.equal((await request("/verify", { ...verification(order.orderId, pay.id), signature: "0".repeat(64) }, order.checkoutToken)).status, 401);
    assert.equal((await request("/verify", verification("order_Different", pay.id), order.checkoutToken)).status, 400);
    assert.equal((await membersFor(order.orderId)).length, 0);
  });

  await t.test("authorization alone is not success; wrong amount/currency/order fails", async () => {
    let result = await request("/verify", verification(order.orderId, pay.id), order.checkoutToken);
    assert.equal(result.body.paymentStatus, "pending");
    assert.equal(result.body.reviewStatus, "not_submitted");
    assert.equal((await membersFor(order.orderId)).length, 0);
    for (const [key, value] of [["amount", 9], ["currency", "USD"], ["order_id", "order_Other"]] as const) {
      const old = pay[key];
      (pay as Record<string, unknown>)[key] = value;
      result = await request("/verify", verification(order.orderId, pay.id), order.checkoutToken);
      assert.equal(result.status, 409);
      (pay as Record<string, unknown>)[key] = old;
    }
  });

  await t.test("captured payment saves one member under review; duplicate callbacks are safe", async () => {
    pay.status = "captured"; pay.captured = true;
    const responses = await Promise.all([0, 1, 2].map(() => request("/verify", verification(order.orderId, pay.id), order.checkoutToken)));
    for (const result of responses) {
      assert.equal(result.status, 200);
      assert.equal(result.body.paymentStatus, "successful");
      assert.equal(result.body.reviewStatus, "pending_review");
      assert.ok(result.body.memberId);
      assert.equal(result.cache, "no-store");
    }
    const [member, ...others] = await membersFor(order.orderId);
    assert.equal(others.length, 0);
    assert.equal(member.application.fullName, application.fullName);
    assert.equal(member.application.contactNumber, "+919876543210");
    assert.equal(member.application.otherSkill, "Test skill");
    assert.equal(member.amount, 9900);
    assert.equal(member.reviewStatus, "pending_review");
    assert.equal((await request("/orders", { ...application, checkoutToken: order.checkoutToken })).status, 409);
  });

  await t.test("signed raw-body webhook recovers a closed browser and is idempotent", async () => {
    const checkout = await start();
    const captured = payment(checkout.orderId, true);
    const event = signedEvent(checkout.orderId, captured.id);
    assert.equal((await request("/webhook", event.raw, undefined, { "x-razorpay-signature": "0".repeat(64) })).status, 401);
    assert.equal((await membersFor(checkout.orderId)).length, 0);
    const responses = await Promise.all([0, 1].map(() => request("/webhook", event.raw, undefined, { "x-razorpay-signature": event.signature })));
    for (const result of responses) assert.equal(result.status, 200);
    assert.equal((await membersFor(checkout.orderId)).length, 1);
    assert.equal((await request("/status", undefined, checkout.checkoutToken)).body.reviewStatus, "pending_review");
  });

  await t.test("status recovery can reconcile captured payment without the browser callback", async () => {
    const checkout = await start();
    payment(checkout.orderId, true);
    const status = await request("/status", undefined, checkout.checkoutToken);
    assert.equal(status.body.paymentStatus, "successful");
    assert.equal((await membersFor(checkout.orderId)).length, 1);
  });

  await t.test("provider failure and missing configuration never show success", async () => {
    const checkout = await start();
    unavailable = true;
    assert.equal((await request("/status", undefined, checkout.checkoutToken)).status, 502);
    assert.equal((await membersFor(checkout.orderId)).length, 0);
    unavailable = false;
    delete process.env.RAZORPAY_KEY_SECRET;
    assert.equal((await request("/orders", application)).status, 503);
  });
});