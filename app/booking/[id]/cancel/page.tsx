"use client";

import { useState, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Sparkles, XCircle } from "lucide-react";

export default function CancelBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const router = useRouter();

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Cancellation token is missing from the link");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelToken: token, reason }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to cancel booking");
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white">Cancel Your Booking</h1>
          <p className="text-xs text-slate-400">
            Cancelling will release your reserved slot so others may book it.
          </p>
        </div>

        {success ? (
          <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h2 className="text-sm font-semibold text-emerald-300">
              Booking Successfully Cancelled
            </h2>
            <p className="text-xs text-slate-400">
              Your appointment has been removed and any applicable refund will be processed automatically.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-block py-2 px-4 rounded-lg bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCancel} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                Reason for cancellation (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Let the creator know why you're cancelling..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Cancelling..." : "Confirm Cancellation"}
            </button>

            <div className="text-center pt-2">
              <Link
                href={`/booking/${id}/confirmation`}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Nevermind, keep my booking
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
