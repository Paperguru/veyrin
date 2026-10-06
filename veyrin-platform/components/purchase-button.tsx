"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { LockKeyhole, Loader2 } from "lucide-react";

type Props = { slug: string; price: number; title: string };

type PaymentStatus = { status?: "pending" | "paid"; courseId?: string; slug?: string; error?: string };

export default function PurchaseButton({ slug, price, title }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const orderIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const checkPaymentStatus = async () => {
    const orderId = orderIdRef.current;
    if (!orderId) return false;

    try {
      const response = await fetch(`/api/payments/status?order_id=${encodeURIComponent(orderId)}`, { cache: "no-store" });
      const data: PaymentStatus = await response.json();
      if (!response.ok) return false;
      if (data.status === "paid") {
        stopPolling();
        window.location.href = slug === "genai-engineer-interview-bank-india" ? "/interview/genai-india?payment=success" : `/courses/${slug}?payment=success`;
        return true;
      }
    } catch {
      // Keep polling. Temporary network failures should not make a successful payment look failed.
    }
    return false;
  };

  const startPolling = () => {
    stopPolling();
    pollCountRef.current = 0;
    pollTimerRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      const paid = await checkPaymentStatus();
      if (paid || pollCountRef.current >= 60) {
        stopPolling();
        if (!paid) {
          setMessage("Payment is still being confirmed. Please wait a little and refresh your dashboard if you have already paid.");
          setBusy(false);
        }
      }
    }, 3000);
  };

  const verifyBrowserResponse = async (response: any) => {
    const verify = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response),
    });
    const result = await verify.json();
    if (!verify.ok) throw new Error(result.error || "Payment verification failed.");
    stopPolling();
    window.location.href = slug === "genai-engineer-interview-bank-india" ? "/interview/genai-india?payment=success" : `/courses/${slug}?payment=success`;
  };

  const pay = async () => {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(`/courses/${slug}`)}`;
        return;
      }
      if (!res.ok) throw new Error(data.error || "Unable to start payment.");
      if (data.alreadyEnrolled) {
        window.location.href = "/dashboard";
        return;
      }

      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) throw new Error("Razorpay Checkout did not load. Please refresh and try again.");

      orderIdRef.current = data.orderId;
      startPolling();

      const checkout = new Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Veyrin",
        description: title,
        order_id: data.orderId,
        prefill: data.user,
        theme: { color: "#d9ff66" },
        handler: async (response: any) => {
          try {
            await verifyBrowserResponse(response);
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "Payment verification failed. We are still checking the payment status.");
            // Do not stop polling here: QR/UPI confirmation can arrive asynchronously.
          }
        },
        modal: {
          ondismiss: () => {
            // Keep polling because the customer may have paid through the QR before closing Checkout.
            setMessage("Waiting for payment confirmation…");
          },
        },
      });

      checkout.on("payment.failed", (response: any) => {
        setMessage(response?.error?.description || "Payment failed. If money was debited, please wait while we confirm the final status.");
        // Keep polling so a delayed successful capture is still detected.
      });
      checkout.open();
    } catch (error) {
      stopPolling();
      setMessage(error instanceof Error ? error.message : "Payment could not be started.");
      setBusy(false);
    }
  };

  return <>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    <button className="btn primary" style={{ width: "100%", marginBottom: 10 }} onClick={pay} disabled={busy}>
      {busy ? <Loader2 size={16} className="spin" /> : <LockKeyhole size={16} />}
      {busy ? "Waiting for payment confirmation…" : `Buy for ₹${price.toLocaleString("en-IN")}`}
    </button>
    {busy && <div className="sub" style={{ fontSize: 13, marginTop: 8 }}>If you paid by scanning the QR, you do not need to click anything else. Veyrin is checking Razorpay automatically.</div>}
    {message && <div className="error" style={{ marginTop: 10, fontSize: 13 }}>{message}</div>}
  </>;
}
