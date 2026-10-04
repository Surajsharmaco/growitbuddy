import { createHash, randomBytes, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, actsMembershipCheckouts, actsMembers, type ActsCheckout } from "@workspace/db";
import { CreateActsMembershipOrderBody, GetActsMembershipStatusResponse } from "@workspace/api-zod";
import {
  ACTS_AMOUNT, ACTS_CURRENCY, ActsPaymentError, assertPaymentMatches,
  isCaptured, razorpayKeys, razorpayRequest, type RazorpayPayment,
} from "./acts-razorpay";

export const ActsApplicationInput = CreateActsMembershipOrderBody.superRefine((input, context) => {
  const issue = (field: string, message: string) => context.addIssue({ code: "custom", path: [field], message });
  for (const field of ["contactNumber", "whatsappNumber"] as const) {
    const value = input[field].trim();
    if (!/^\+?[\d\s()-]+$/.test(value) || !/^\d{8,15}$/.test(value.replace(/\D/g, ""))) {
      issue(field, "Enter a valid contact number with 8–15 digits.");
    }
  }
  if (input.fullName.trim().length < 2) issue("fullName", "Enter your full name.");
  if (input.city.trim().length < 2) issue("city", "Enter your city.");
  if (input.youAre === "Creator" && !input.creatorType) issue("creatorType", "Select your creator type.");
  if ((input.youAre === "Other" || (input.youAre === "Creator" && input.creatorType === "Other")) &&
      !input.otherType?.trim()) issue("otherType", "Enter your type.");
  if (input.primarySkill === "Other" && !input.otherSkill?.trim()) issue("otherSkill", "Enter your skill.");
  if (input.instagramId && !/^@?[A-Za-z0-9._]{1,30}$/.test(input.instagramId.trim())) {
    issue("instagramId", "Enter an Instagram ID, not a profile URL.");
  }
});

export function normalizeActsApplication(input: ReturnType<typeof ActsApplicationInput.parse>): Record<string, unknown> {
  return {
    fullName: input.fullName.trim(),
    contactNumber: input.contactNumber.trim().replace(/[\s()-]/g, ""),
    whatsappNumber: input.whatsappNumber.trim().replace(/[\s()-]/g, ""),
    city: input.city.trim(),
    ...(input.instagramId?.trim() ? { instagramId: input.instagramId.trim().replace(/^@/, "") } : {}),
    ...(input.youAre ? { youAre: input.youAre } : {}),
    ...(input.youAre === "Creator" ? { creatorType: input.creatorType } : {}),
    ...((input.youAre === "Other" || (input.youAre === "Creator" && input.creatorType === "Other")) ?
      { otherType: input.otherType!.trim() } : {}),
    primarySkill: input.primarySkill,
    ...(input.primarySkill === "Other" ? { otherSkill: input.otherSkill!.trim() } : {}),
    ...(input.lookingFor ? { lookingFor: input.lookingFor } : {}),
    agreesToGuidelines: true,
  };
}

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
const stableApplication = (value: Record<string, unknown>) =>
  JSON.stringify(Object.keys(value).sort().map(key => [key, value[key]]));

export async function checkoutForToken(token: string | undefined): Promise<ActsCheckout> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    throw new ActsPaymentError(401, "Your checkout reference is invalid. Please reopen the membership form.");
  }
  const [checkout] = await db.select().from(actsMembershipCheckouts)
    .where(eq(actsMembershipCheckouts.tokenHash, tokenHash(token))).limit(1);
  if (!checkout) throw new ActsPaymentError(401, "Your checkout reference was not found.");
  return checkout;
}

export async function saveCapturedMembership(payment: RazorpayPayment): Promise<void> {
  if (!payment?.order_id || !/^order_[A-Za-z0-9]+$/.test(payment.order_id)) {
    throw new ActsPaymentError(409, "The payment has no valid membership order.");
  }
  await db.transaction(async transaction => {
    const [checkout] = await transaction.select().from(actsMembershipCheckouts)
      .where(eq(actsMembershipCheckouts.orderId, payment.order_id)).limit(1).for("update");
    if (!checkout) throw new ActsPaymentError(409, "The ACTS checkout could not be found.");
    assertPaymentMatches(payment, checkout.orderId);
    if (!isCaptured(payment)) throw new ActsPaymentError(409, "This payment has not been captured yet.");
    const [existing] = await transaction.select().from(actsMembers)
      .where(eq(actsMembers.checkoutId, checkout.id)).limit(1);
    if (existing && existing.paymentId !== payment.id) {
      throw new ActsPaymentError(409, "A different payment has already been recorded for this checkout.");
    }
    if (!existing) {
      await transaction.insert(actsMembers).values({
        id: randomUUID(), checkoutId: checkout.id, paymentId: payment.id,
        application: checkout.application, amount: ACTS_AMOUNT, currency: ACTS_CURRENCY,
        paymentStatus: "successful", reviewStatus: "pending_review", paidAt: new Date(),
      });
    }
    await transaction.update(actsMembershipCheckouts).set({ paymentStatus: "successful" })
      .where(eq(actsMembershipCheckouts.id, checkout.id));
  });
}

export async function reconcileCheckout(checkout: ActsCheckout): Promise<void> {
  if (checkout.paymentStatus === "successful") return;
  if (checkout.keyId !== razorpayKeys().keyId) {
    throw new ActsPaymentError(503, "This checkout belongs to a previous payment configuration. Contact ACTS support before paying again.");
  }
  const result = await razorpayRequest<{ items: RazorpayPayment[] }>(`/orders/${encodeURIComponent(checkout.orderId)}/payments?count=100`);
  if (!Array.isArray(result.items)) throw new ActsPaymentError(502, "The payment status could not be read.");
  const captured = result.items.find(isCaptured);
  if (captured) await saveCapturedMembership(captured);
}

export async function membershipStatus(checkout: ActsCheckout, reconcile = true) {
  if (reconcile) await reconcileCheckout(checkout);
  const [member] = await db.select().from(actsMembers).where(eq(actsMembers.checkoutId, checkout.id)).limit(1);
  return GetActsMembershipStatusResponse.parse({
    orderId: checkout.orderId, keyId: checkout.keyId, amount: ACTS_AMOUNT, currency: ACTS_CURRENCY,
    application: checkout.application,
    paymentStatus: member ? "successful" : "pending",
    reviewStatus: member ? "pending_review" : "not_submitted",
    ...(member ? { memberId: member.id, paymentId: member.paymentId, paidAt: member.paidAt } : {}),
  });
}

export async function createMembershipOrder(input: ReturnType<typeof ActsApplicationInput.parse>) {
  const application = normalizeActsApplication(input);
  const { keyId } = razorpayKeys();
  if (input.checkoutToken) {
    const checkout = await checkoutForToken(input.checkoutToken);
    const status = await membershipStatus(checkout);
    if (status.paymentStatus === "successful") throw new ActsPaymentError(409, "Your payment is already confirmed. Check payment status to see your application.");
    if (stableApplication(application) !== stableApplication(checkout.application)) {
      throw new ActsPaymentError(409, "Your details are linked to an existing checkout. Resume it with the original submitted details.");
    }
    return { orderId: checkout.orderId, keyId: checkout.keyId, amount: ACTS_AMOUNT, currency: ACTS_CURRENCY, checkoutToken: input.checkoutToken };
  }
  const id = randomUUID();
  const order = await razorpayRequest<{ id: string; amount: number; currency: string }>("/orders", {
    amount: ACTS_AMOUNT, currency: ACTS_CURRENCY,
    receipt: `acts_${id.replace(/-/g, "")}`,
    notes: { product: "acts_membership", checkout_id: id },
  });
  if (!/^order_[A-Za-z0-9]+$/.test(order.id) || order.amount !== ACTS_AMOUNT || order.currency !== ACTS_CURRENCY) {
    throw new ActsPaymentError(502, "Razorpay returned an unexpected order. No payment was started.");
  }
  const checkoutToken = randomBytes(32).toString("hex");
  // This is a checkout draft, NOT a paid/approved member record.
  await db.insert(actsMembershipCheckouts).values({
    id, orderId: order.id, tokenHash: tokenHash(checkoutToken), keyId,
    application, amount: ACTS_AMOUNT, currency: ACTS_CURRENCY,
  });
  return { orderId: order.id, keyId, amount: ACTS_AMOUNT, currency: ACTS_CURRENCY, checkoutToken };
}