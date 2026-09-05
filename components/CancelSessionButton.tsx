"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle, AlertTriangle, Loader2, CheckCircle2, DollarSign, Mail } from "lucide-react";

interface CancelSessionButtonProps {
  bookingId: string;
  clientName: string;
  sessionTitle: string;
  priceInPaise?: number;
  onSuccess?: () => void;
  className?: string;
  variant?: "button" | "icon";
}

export default function CancelSessionButton({
  bookingId,
  clientName,
  sessionTitle,
  priceInPaise = 0,
  onSuccess,
  className = "",
  variant = "button",
}: CancelSessionButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [refundType, setRefundType] = useState<"PARTIAL" | "FULL">("PARTIAL");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const priceRupees = Math.round(priceInPaise / 100);
  const feeRupees = Math.round(priceRupees * 0.04);
  const creatorPayoutRupees = priceRupees - feeRupees;
  const isPaidSession = priceInPaise > 0;

  const handleCancel = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/creator/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim() || "Cancelled by creator",
          refundType: isPaidSession ? refundType : "NONE",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to cancel session");
        setLoading(false);
        return;
      }

      setIsOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${className}`}
          title="Cancel session"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-red-200 ${className}`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancel Session</span>
        </button>
      )}

      {/* Cancellation & Refund Options Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-gray-200 p-6 shadow-2xl space-y-5 my-8">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-950">Cancel 1:1 Session?</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select refund terms and notify {clientName} via email.
                </p>
              </div>
            </div>

            {/* Session info */}
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800 truncate">{sessionTitle}</span>
                {isPaidSession && (
                  <span className="font-bold text-gray-950 text-sm">
                    ₹{priceRupees.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              <p className="text-gray-500">
                Client: <span className="font-medium text-gray-700">{clientName}</span>
              </p>
            </div>

            {/* Refund Options for Paid Sessions */}
            {isPaidSession && (
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Refund Option
                </label>

                {/* Option 1: Partial Refund */}
                <div
                  onClick={() => setRefundType("PARTIAL")}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    refundType === "PARTIAL"
                      ? "border-orange-500 bg-orange-50/40"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          refundType === "PARTIAL"
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {refundType === "PARTIAL" && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-900">
                          Partial Refund (96% to Client)
                        </span>
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Cost to you: ₹0
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-orange-600">
                      Refund ₹{creatorPayoutRupees.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 pl-6 leading-relaxed">
                    Client receives your 96% creator cut. The 4% platform fee (₹{feeRupees}) is retained by the platform. You owe ₹0.
                  </p>
                </div>

                {/* Option 2: Full Refund */}
                <div
                  onClick={() => setRefundType("FULL")}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    refundType === "FULL"
                      ? "border-orange-500 bg-orange-50/40"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          refundType === "FULL"
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {refundType === "FULL" && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-900">
                          Full Refund (100% to Client)
                        </span>
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          You pay 4% fee
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-600">
                      Refund ₹{priceRupees.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 pl-6 leading-relaxed">
                    Client receives a 100% full refund. The 4% platform fee (₹{feeRupees}) will be debited from your creator account balance.
                  </p>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Cancellation Reason (Included in email)
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Schedule conflict / Emergency rescheduling"
                className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            {/* Automated email notice */}
            <div className="flex items-center gap-2 text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>
                An automated email will be sent to <strong>{clientName}</strong> with the cancellation notice and Razorpay refund timeline (5–7 days).
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Keep Session
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Refund...</span>
                  </>
                ) : (
                  <span>
                    {isPaidSession
                      ? refundType === "FULL"
                        ? `Cancel & Full Refund ₹${priceRupees}`
                        : `Cancel & Refund ₹${creatorPayoutRupees}`
                      : "Confirm Cancellation"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
