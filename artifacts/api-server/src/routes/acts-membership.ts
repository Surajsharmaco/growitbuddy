import { Router, type Request, type Response, type NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, actsMembershipCheckouts } from "@workspace/db";
import { CreateActsMembershipOrderResponse, VerifyActsMembershipPaymentBody, VerifyActsMembershipPaymentResponse } from "@workspace/api-zod";
import {
  ActsApplicationInput, checkoutForToken, createMembershipOrder,
  membershipStatus, saveCapturedMembership,
} from "../lib/acts-membership";
import {
  ActsPaymentError, assertPaymentMatches, isCaptured, razorpayKeys,
  razorpayRequest, validSignature, type RazorpayPayment,
} from "../lib/acts-razorpay";

const router = Router();
const windows = new Map<string, { count: number; reset: number }>();
const cleanup = setInterval(() => {
  for (const [key, entry] of windows) if (entry.reset <= Date.now()) windows.delete(key);
}, 60000);
cleanup.unref();

function limit(group: string, max: number, duration: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store");
    const ip = req.get("x-forwarded-for")?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    const key = `${group}:${ip}`;
    const now = Date.now();
    const entry = windows.get(key);
    if (!entry || entry.reset <= now) windows.set(key, { count: 1, reset: now + duration });
    else if (entry.count >= max) {
      res.setHeader("Retry-After", String(Math.ceil((entry.reset - now) / 1000)));
      res.status(429).json({ error: "Too many requests. Please wait before trying again." });
      return;
    } else entry.count++;
    next();
  };
}

function bearer(req: Request): string | undefined {
  return req.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
}

function failure(req: Request, res: Response, error: unknown) {
  const known = error instanceof ActsPaymentError;
  req.log.warn({ operation: "acts_membership", status: known ? error.status : 503 }, "ACTS membership request did not complete");
  // Database/provider errors must never masquerade as a successful signup.
  res.status(known ? error.status : 503).json({
    error: known ? error.message : "Membership storage is temporarily unavailable. If money was deducted, do not pay again. Check payment status shortly.",
  });
}

router.post("/orders", limit("orders", 15, 15 * 60_000), async (req: Request, res: Response): Promise<void> => {
  const parsed = ActsApplicationInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Please check your membership details." });
    return;
  }
  try {
    const order = await createMembershipOrder(parsed.data);
    res.json(CreateActsMembershipOrderResponse.parse(order));
  } catch (error) { failure(req, res, error); }
});

router.post("/verify", limit("status", 120, 60_000), async (req: Request, res: Response): Promise<void> => {
  const parsed = VerifyActsMembershipPaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "The payment verification details are invalid." }); return; }
  try {
    const checkout = await checkoutForToken(bearer(req));
    const { orderId, paymentId, signature } = parsed.data;
    if (orderId !== checkout.orderId) throw new ActsPaymentError(400, "The payment belongs to a different checkout.");
    const { keyId, keySecret } = razorpayKeys();
    if (checkout.keyId !== keyId) throw new ActsPaymentError(503, "This checkout uses a previous payment configuration. Please check payment status.");
    if (!validSignature(`${checkout.orderId}|${paymentId}`, signature, keySecret)) {
      throw new ActsPaymentError(401, "Payment verification failed. Your membership has not been confirmed.");
    }
    const payment = await razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
    assertPaymentMatches(payment, checkout.orderId);
    if (isCaptured(payment)) await saveCapturedMembership(payment);
    res.json(VerifyActsMembershipPaymentResponse.parse(await membershipStatus(checkout, false)));
  } catch (error) { failure(req, res, error); }
});

router.get("/status", limit("status", 120, 60_000), async (req: Request, res: Response): Promise<void> => {
  try { res.json(await membershipStatus(await checkoutForToken(bearer(req)))); }
  catch (error) { failure(req, res, error); }
});

router.post("/webhook", async (req: Request, res: Response): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) { res.status(503).json({ error: "Payment webhooks are not configured." }); return; }
  const signature = req.get("x-razorpay-signature") ?? "";
  if (!Buffer.isBuffer(req.body) || !validSignature(req.body, signature, secret)) {
    res.status(401).json({ error: "Invalid webhook signature." });
    return;
  }
  try {
    const event = JSON.parse(req.body.toString("utf8"));
    if (!["payment.captured", "order.paid"].includes(event.event)) { res.json({ received: true }); return; }
    const entity = event.payload?.payment?.entity;
    const orderId = entity?.order_id ?? event.payload?.order?.entity?.id;
    if (typeof orderId !== "string" || !/^order_[A-Za-z0-9]+$/.test(orderId)) {
      throw new ActsPaymentError(400, "The webhook order is invalid.");
    }
    const [checkout] = await db.select().from(actsMembershipCheckouts)
      .where(eq(actsMembershipCheckouts.orderId, orderId)).limit(1);
    // A Razorpay account can have other products; do not process their payments as ACTS.
    if (!checkout) { res.json({ received: true }); return; }
    if (entity?.id && /^pay_[A-Za-z0-9]+$/.test(entity.id)) {
      const payment = await razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(entity.id)}`);
      assertPaymentMatches(payment, checkout.orderId);
      if (!isCaptured(payment)) throw new ActsPaymentError(409, "Payment capture is not yet confirmed.");
      await saveCapturedMembership(payment);
    } else {
      const status = await membershipStatus(checkout);
      if (status.paymentStatus !== "successful") throw new ActsPaymentError(503, "Payment capture is not yet confirmed.");
    }
    res.json({ received: true });
  } catch (error) {
    if (error instanceof SyntaxError) { res.status(400).json({ error: "Invalid webhook payload." }); return; }
    failure(req, res, error);
  }
});

export default router;