import { createHmac, timingSafeEqual } from "node:crypto";

export const ACTS_AMOUNT = 9900;
export const ACTS_CURRENCY = "INR";

export class ActsPaymentError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function razorpayKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new ActsPaymentError(503, "ACTS payments are not available yet. Please try again once payment setup is complete.");
  }
  return { keyId, keySecret };
}

export function validSignature(payload: string | Buffer, signature: string, secret: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(payload).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

export async function razorpayRequest<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const { keyId, keySecret } = razorpayKeys();
  let response: globalThis.Response;
  try {
    response = await fetch(`https://api.razorpay.com/v1${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ActsPaymentError(502, "Razorpay could not be reached. Please try again. If money was deducted, check payment status instead of paying again.");
  }
  if (!response.ok) {
    // Do not expose provider responses or credentials to the browser/logs.
    throw new ActsPaymentError(502, "Razorpay could not complete this request. If money was deducted, do not pay again; check payment status.");
  }
  try { return await response.json() as T; }
  catch { throw new ActsPaymentError(502, "Razorpay returned an invalid response. Please check payment status."); }
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
}

export function assertPaymentMatches(payment: RazorpayPayment, orderId: string): void {
  if (!payment || !/^pay_[A-Za-z0-9]+$/.test(payment.id) ||
      payment.order_id !== orderId || payment.amount !== ACTS_AMOUNT || payment.currency !== ACTS_CURRENCY) {
    throw new ActsPaymentError(409, "The payment does not match this ACTS membership order.");
  }
}

export function isCaptured(payment: RazorpayPayment): boolean {
  return payment.status === "captured" && payment.captured === true;
}