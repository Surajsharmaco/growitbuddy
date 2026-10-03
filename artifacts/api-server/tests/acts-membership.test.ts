import { after, test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { once } from "node:events";
import express from "express";
import { eq, inArray } from "drizzle-orm";
import { db, pool, actsMembers, actsMembershipCheckouts } from "@workspace/db";
import membershipRouter from "../src/routes/acts-membership";
import { ActsApplicationInput } from "../src/lib/acts-membership";

// Synthetic credentials exist only in this isolated test process. Every provider
// request is intercepted; these tests cannot charge a card or use live Razorpay.
const keySecret = `fixture-${randomUUID()}`;
const webhookSecret = `fixture-webhook-${randomUUID()}`;
process.env.RAZORPAY_KEY_ID = "rzp_test_fixture";
process.env.RAZORPAY_KEY_SECRET = keySecret;
process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
const realFetch = globalThis.fetch;
const orders: string[] = [];
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
  const checkouts = orders.length ? await db.select().from(actsMembershipCheckouts).where(inArray(actsMembershipCheckouts.orderId, orders)) : [];
  if (checkouts.length) {
    const ids = checkouts.map(checkout => checkout.id);
    await db.delete(actsMembers).where(inArray(actsMembers.checkoutId, ids));
    await db.delete(actsMembershipCheckouts).where(inArray(actsMembershipCheckouts.id, ids));
  }
  await new Promise<void>(resolve => server.close(() => resolve()));
  await pool.end();
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
    assert.equal(orders.length, 1);
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