export interface RazorpayResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; contact: string };
  theme: { color: string };
  handler: (result: RazorpayResult) => void;
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", callback: () => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let loading: Promise<NonNullable<Window["Razorpay"]>> | null = null;

export function loadRazorpay(): Promise<NonNullable<Window["Razorpay"]>> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    const timeout = window.setTimeout(() => fail(), 15000);
    const fail = () => {
      window.clearTimeout(timeout);
      script.remove();
      loading = null;
      reject(new Error("Razorpay could not load. Check your connection or browser blocker and try again."));
    };
    script.onerror = fail;
    script.onload = () => {
      window.clearTimeout(timeout);
      if (window.Razorpay) resolve(window.Razorpay);
      else fail();
    };
    document.head.appendChild(script);
  });
  return loading;
}