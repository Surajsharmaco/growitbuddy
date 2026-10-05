import { useCallback, useEffect, useRef, useState } from "react";
import {
  getActsMembershipStatus,
  setBaseUrl,
  useCreateActsMembershipOrder,
  verifyActsMembershipPayment,
  type ActsMemberInput,
  type ActsMembershipStatus,
} from "@workspace/api-client-react";
import { loadRazorpay, type RazorpayResult } from "@/lib/razorpay-checkout";

// Generated requests use /api. Production can use the existing split-origin API;
// Replit uses its managed /api artifact route, not /acts-club/api.
const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "");
setBaseUrl(apiUrl ? apiUrl.replace(/\/api$/, "") : null);
const STORAGE_KEY = "acts.membership.checkout";
type Phase = "form" | "restoring" | "preparing" | "checkout" | "verifying" | "pending" | "success";

function errorMessage(error: unknown): string {
  const data = (error as { data?: { error?: unknown } })?.data;
  if (typeof data?.error === "string") return data.error;
  return error instanceof Error ? error.message : "We could not confirm your payment. Please try again.";
}

function savedToken(): string | null {
  try {
    const token = sessionStorage.getItem(STORAGE_KEY);
    return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
  } catch { return null; }
}

export function useActsMembership(open: boolean) {
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState<ActsMembershipStatus | null>(null);
  const [hasCheckout, setHasCheckout] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const openRef = useRef(open);
  openRef.current = open;
  const actionRef = useRef(false);
  const submissionRef = useRef<{ key: string; fingerprint: string } | null>(null);
  const mounted = useRef(true);
  const orderMutation = useCreateActsMembershipOrder({ mutation: { retry: false } });

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const applyStatus = useCallback((status: ActsMembershipStatus) => {
    if (!mounted.current) return;
    setSnapshot(status);
    // Both values are server-owned. Never treat Razorpay's browser callback as success.
    if (status.paymentStatus === "successful" && status.reviewStatus === "pending_review" && status.memberId) {
      setPhase("success");
      setError("");
    }
  }, []);

  const checkStatus = useCallback(async () => {
    if (!tokenRef.current) throw new Error("Your payment reference is missing. Please reopen the form.");
    const status = await getActsMembershipStatus({
      headers: { Authorization: `Bearer ${tokenRef.current}` },
      cache: "no-store",
    });
    applyStatus(status);
    return status;
  }, [applyStatus]);

  useEffect(() => {
    if (!open || actionRef.current) return;
    const token = tokenRef.current ?? savedToken();
    if (!token) return;
    tokenRef.current = token;
    setHasCheckout(true);
    setPhase("restoring");
    let active = true;
    checkStatus().then(status => {
      if (active && status.paymentStatus !== "successful") setPhase("form");
    }).catch(err => {
      if (!active) return;
      // Keep the reference on transient failures so a paid visitor is not charged again.
      if ((err as { status?: number }).status === 401) {
        tokenRef.current = null;
        try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
        setHasCheckout(false);
        setPhase("form");
      } else setPhase("pending");
      setError(errorMessage(err));
    });
    return () => { active = false; };
  }, [open, checkStatus]);

  const waitForConfirmation = useCallback(async () => {
    setPhase("verifying");
    let lastError = "";
    const deadline = Date.now() + 45000;
    for (let attempt = 0; attempt < 15 && mounted.current && Date.now() < deadline; attempt++) {
      try {
        const status = await checkStatus();
        if (status.paymentStatus === "successful") return;
      } catch (err) { lastError = errorMessage(err); }
      await new Promise(resolve => window.setTimeout(resolve, 2000));
    }
    if (mounted.current) {
      setPhase("pending");
      setError(lastError || "Payment confirmation is still pending. If money was deducted, do not pay again. Use Check payment status.");
    }
  }, [checkStatus]);

  const confirmPayment = async (result: RazorpayResult) => {
    setPhase("verifying");
    try {
      const status = await verifyActsMembershipPayment({
        orderId: result.razorpay_order_id,
        paymentId: result.razorpay_payment_id,
        signature: result.razorpay_signature,
      }, { headers: { Authorization: `Bearer ${tokenRef.current}` } });
      applyStatus(status);
      if (status.paymentStatus === "successful") return;
    } catch (err) { setError(errorMessage(err)); }
    // Signed webhooks and server-side payment queries can recover a dropped callback.
    await waitForConfirmation();
  };

  const beginCheckout = async (application: ActsMemberInput) => {
    if (actionRef.current || phase === "success") return;
    actionRef.current = true;
    setError("");
    setPhase("preparing");
    try {
      if (tokenRef.current) {
        const current = await checkStatus();
        if (current.paymentStatus === "successful") { actionRef.current = false; return; }
        application = current.application;
      }
      const fingerprint = JSON.stringify(application);
      if (!submissionRef.current || submissionRef.current.fingerprint !== fingerprint) {
        submissionRef.current = { key: crypto.randomUUID(), fingerprint };
      }
      const order = await orderMutation.mutateAsync({
        data: { ...application, submissionKey: submissionRef.current.key,
          ...(tokenRef.current ? { checkoutToken: tokenRef.current } : {}) },
      });
      tokenRef.current = order.checkoutToken;
      setHasCheckout(true);
      setSnapshot({
        orderId: order.orderId, keyId: order.keyId, amount: 9900, currency: "INR",
        application, paymentStatus: "pending", reviewStatus: "not_submitted",
      });
      // Persist only a private recovery token, not the visitor's personal information.
      try { sessionStorage.setItem(STORAGE_KEY, order.checkoutToken); }
      catch { throw new Error("Your browser cannot save a payment reference. Please enable site storage or use another browser before paying."); }
      const Razorpay = await loadRazorpay();
      if (!openRef.current) { actionRef.current = false; setPhase("form"); return; }
      let receivedPayment = false;
      const checkout = new Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "ACTS Membership",
        description: "Founding Member Access — One-time payment",
        prefill: { name: application.fullName, contact: application.contactNumber },
        theme: { color: "#fa4b18" },
        handler: result => {
          receivedPayment = true;
          void confirmPayment(result).finally(() => { actionRef.current = false; });
        },
        modal: {
          ondismiss: () => {
            if (receivedPayment) return;
            actionRef.current = false;
            setPhase("form");
            setError("Checkout was closed. No payment has been confirmed. You can retry the same checkout.");
          },
        },
      });
      checkout.on("payment.failed", () => setError("The payment attempt failed. You can retry in Razorpay or close checkout. Your membership is not confirmed."));
      setPhase("checkout");
      // Release Radix's focus/pointer lock before opening the third-party overlay.
      await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()));
      if (!openRef.current) { actionRef.current = false; setPhase("form"); return; }
      checkout.open();
    } catch (err) {
      actionRef.current = false;
      if ((err as { status?: number }).status === 409 && tokenRef.current) {
        await waitForConfirmation();
      } else {
        setPhase("form");
        setError(errorMessage(err));
      }
    }
  };

  const retryConfirmation = async () => {
    if (actionRef.current) return;
    actionRef.current = true;
    setError("");
    try { await waitForConfirmation(); }
    finally { actionRef.current = false; }
  };

  return {
    phase,
    error,
    snapshot,
    hasCheckout,
    initialApplication: snapshot?.application ?? null,
    busy: ["restoring", "preparing", "checkout", "verifying"].includes(phase),
    beginCheckout,
    retryConfirmation,
    clearError: () => setError(""),
  };
}