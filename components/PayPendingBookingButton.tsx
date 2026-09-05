"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, AlertCircle, RefreshCw } from "lucide-react";

interface PayPendingBookingButtonProps {
  bookingId: string;
  orderId: string;
  keyId: string;
  amountPaise: number;
  sessionTitle: string;
  creatorName: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      setTimeout(() => resolve(Boolean((window as any).Razorpay)), 1500);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PayPendingBookingButton({
  bookingId,
  orderId,
  keyId,
  amountPaise,
  sessionTitle,
  creatorName,
  clientName,
  clientEmail,
  clientPhone,
}: PayPendingBookingButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handlePayNow = async () => {
    setLoading(true);
    setErrorMessage("");

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded || !(window as any).Razorpay) {
      setErrorMessage(
        "Could not load Razorpay payment gateway. Please check your internet connection or disable ad-blockers."
      );
      setLoading(false);
      return;
    }

    try {
      const options = {
        key: keyId,
        amount: amountPaise,
        currency: "INR",
        name: "SessionBook",
        description: `${sessionTitle} with ${creatorName}`,
        order_id: orderId,
        prefill: {
          name: clientName,
          email: clientEmail,
          contact: clientPhone || "",
        },
        theme: { color: "#EA580C" },
        handler: async function (response: any) {
          setLoading(true);
          try {
            const verifyRes = await fetch("/api/bookings/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookingId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              const data = await verifyRes.json();
              setErrorMessage(data.error || "Payment verification failed. Please contact support.");
              setLoading(false);
              return;
            }

            // Refresh the server page so the confirmed state displays immediately
            window.location.reload();
          } catch (err: any) {
            setErrorMessage("Payment was captured, but page update failed. Please refresh the page.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (failResponse: any) {
        setErrorMessage(
          failResponse.error?.description || "Payment failed or was declined. Please try again."
        );
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to launch payment gateway.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {errorMessage && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-left">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={handlePayNow}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-orange-500/20 cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Opening Payment Gateway…</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>Complete Payment — ₹{(amountPaise / 100).toLocaleString("en-IN")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
