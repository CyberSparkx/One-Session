"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  ExternalLink,
  Building2,
  Smartphone,
  ShieldCheck,
  CalendarCheck2,
  AlertCircle,
  Clock,
  IndianRupee,
  Search,
  CheckCircle2,
  Sparkles,
  Banknote,
  Send,
  X,
  QrCode,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  User,
  Info,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"creators" | "transactions" | "cancellations">("creators");
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Payout Modal State
  const [selectedCreatorForPayout, setSelectedCreatorForPayout] = useState<any | null>(null);
  const [payoutReference, setPayoutReference] = useState("");
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Cancellation Audit Modal
  const [selectedCancelledCreator, setSelectedCancelledCreator] = useState<any | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, txRes, creatorsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/transactions"),
        fetch("/api/admin/creators"),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
      if (creatorsRes.ok) setCreators(await creatorsRes.json());
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateCreatorPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCreatorForPayout) return;

    setIsProcessingPayout(true);
    setPayoutSuccessMsg("");

    try {
      const res = await fetch(`/api/admin/creators/${selectedCreatorForPayout.id}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: payoutReference,
          executeRazorpayX: false,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPayoutSuccessMsg(data.message || "Payout recorded successfully!");
        setTimeout(() => {
          setSelectedCreatorForPayout(null);
          setPayoutReference("");
          setPayoutSuccessMsg("");
          fetchAdminData();
        }, 1800);
      } else {
        alert(data.error || "Failed to disburse payout");
      }
    } catch (err: any) {
      alert(err.message || "Error processing payout");
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const handleMarkSessionComplete = async (bookingId: string) => {
    if (!confirm("Mark this session as COMPLETED? This immediately releases the funds into the creator's eligible payout.")) return;

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/complete`, {
        method: "POST",
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSinglePaymentPaid = async (paymentId: string) => {
    if (!confirm("Are you sure you want to mark this specific session payout as disbursed?")) return;

    try {
      const res = await fetch(`/api/admin/payouts/${paymentId}/mark-paid`, {
        method: "POST",
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter creators by search query
  const filteredCreators = creators.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q)
    );
  });

  // Filter cancelled transactions for the cancellations view
  const cancelledTransactions = transactions.filter(
    (t) => t.bookingStatus === "CANCELLED" || t.bookingStatus === "REFUNDED" || t.status === "REFUNDED"
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-gray-500">Loading live platform ledger...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 p-4 sm:p-6 md:p-10 space-y-8">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
                Super Admin Portal
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                4% Platform Commission
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Creator reserves, monthly booking metrics, session completions & payout initiation.
            </p>
          </div>
        </div>
      </div>

      {/* ── Metric Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* GMV */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
            Gross Volume (GMV)
          </span>
          <div className="text-2xl font-extrabold text-gray-950">
            ₹{(stats?.totalGmvRupees || 0).toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            This month: ₹{(stats?.thisMonthGmvRupees || 0).toLocaleString("en-IN")}
          </p>
        </div>

        {/* 4% Platform Fee */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider block mb-1.5">
            Platform 4% Net
          </span>
          <div className="text-2xl font-extrabold text-orange-600">
            ₹{(stats?.totalPlatformFeeRupees || 0).toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            This month: ₹{(stats?.thisMonthPlatformFeeRupees || 0).toLocaleString("en-IN")}
          </p>
        </div>

        {/* In-Flight Reserve (Upcoming sessions) */}
        <div className="p-5 rounded-2xl bg-white border border-blue-200/80 shadow-xs bg-blue-50/20">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">
              In-Flight Reserve
            </span>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700">
            ₹{(stats?.totalInFlightReserveRupees || 0).toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-blue-600/80 mt-1">Held until session concludes</p>
        </div>

        {/* Pending Eligible Payouts */}
        <div className="p-5 rounded-2xl bg-white border border-emerald-200/80 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
              Ready for Payout
            </span>
            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            ₹{(stats?.totalPendingEligiblePayoutRupees || 0).toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-1">Sessions finished & due</p>
        </div>

        {/* Monthly Activity */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
            This Month Bookings
          </span>
          <div className="text-2xl font-extrabold text-gray-950">
            {stats?.thisMonthBookingsCount || 0}{" "}
            <span className="text-xs font-normal text-gray-400">
              / {stats?.confirmedBookingsCount || 0} total
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {stats?.cancelledBookingsCount || 0} cancellations
          </p>
        </div>
      </div>

      {/* ── Tabs & Search Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("creators")}
            className={`py-2 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "creators"
                ? "bg-orange-600 text-white shadow-xs shadow-orange-500/20"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Creators & Payout Reserves ({creators.length})
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`py-2 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "transactions"
                ? "bg-orange-600 text-white shadow-xs shadow-orange-500/20"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Live Ledger ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab("cancellations")}
            className={`py-2 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "cancellations"
                ? "bg-orange-600 text-white shadow-xs shadow-orange-500/20"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Cancellations & Reasons ({cancelledTransactions.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search creator or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
          />
        </div>
      </div>

      {/* ── TAB 1: CREATORS & PAYOUT RESERVES ── */}
      {activeTab === "creators" && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50/75 text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Creator</th>
                  <th className="py-3 px-4">This Month Bookings</th>
                  <th className="py-3 px-4">In-Flight Reserve</th>
                  <th className="py-3 px-4">Eligible Pending Payout</th>
                  <th className="py-3 px-4">Total Paid Out</th>
                  <th className="py-3 px-4">Payout Method</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCreators.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                      No creators match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredCreators.map((c) => {
                    const hasEligiblePayout = c.netPendingPayoutPaise > 0;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Creator Info */}
                        <td className="py-3.5 px-4 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-semibold text-gray-950 flex items-center gap-1.5">
                                {c.name}
                                <Link
                                  href={`/u/${c.slug}`}
                                  target="_blank"
                                  className="text-gray-400 hover:text-orange-600"
                                  title="Visit public page"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                {c.email} · /u/{c.slug}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* This Month Bookings */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                            <CalendarCheck2 className="w-3 h-3" />
                            {c.thisMonthBookingsCount} bookings
                          </span>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            ₹{(c.thisMonthCreatorPayoutPaise / 100).toLocaleString("en-IN")} earned
                          </div>
                        </td>

                        {/* In-Flight Reserve */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-blue-700">
                            ₹{(c.inFlightReservePaise / 100).toLocaleString("en-IN")}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {c.upcomingSessionsCount} upcoming session{c.upcomingSessionsCount !== 1 ? "s" : ""}
                          </div>
                        </td>

                        {/* Eligible Pending Payout */}
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-emerald-700 text-sm">
                            ₹{(c.netPendingPayoutPaise / 100).toLocaleString("en-IN")}
                          </div>
                          {c.balanceAdjustmentPaise < 0 ? (
                            <div className="text-[10px] text-amber-600 flex items-center gap-1 font-semibold">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>Includes -₹{Math.abs(c.balanceAdjustmentPaise / 100)} fee offset</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-gray-400">
                              {c.pendingEligibleBookingsCount} session{c.pendingEligibleBookingsCount !== 1 ? "s" : ""} completed
                            </div>
                          )}
                        </td>

                        {/* Total Paid Out */}
                        <td className="py-3.5 px-4 text-gray-600 font-medium">
                          ₹{(c.totalPaidOutPaise / 100).toLocaleString("en-IN")}
                        </td>

                        {/* Payout Method */}
                        <td className="py-3.5 px-4">
                          {c.payoutMethod === "upi" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-700 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg">
                              <Smartphone className="w-3 h-3 text-orange-600" />
                              <span className="font-mono">{c.payoutDetails?.upiId || "UPI ID Not Set"}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-700 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg">
                              <Building2 className="w-3 h-3 text-orange-600" />
                              <span>
                                {c.payoutDetails?.bankAccount
                                  ? `A/C: •••${c.payoutDetails.bankAccount.slice(-4)} (${c.payoutDetails.ifsc || ""})`
                                  : "Bank Not Set"}
                              </span>
                            </span>
                          )}
                        </td>

                        {/* Action: Proceed to Pay */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {c.cancelledCount > 0 && (
                              <button
                                onClick={() => setSelectedCancelledCreator(c)}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                              >
                                {c.cancelledCount} Cancelled
                              </button>
                            )}

                            {hasEligiblePayout ? (
                              <button
                                onClick={() => {
                                  setSelectedCreatorForPayout(c);
                                  setPayoutReference(`TRANSFER_${Date.now().toString().slice(-6)}`);
                                }}
                                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs shadow-emerald-600/20 cursor-pointer"
                              >
                                <Banknote className="w-3.5 h-3.5" />
                                <span>Proceed to Pay</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic px-2 py-1">
                                No Dues
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: LIVE LEDGER TRANSACTIONS ── */}
      {activeTab === "transactions" && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50/75 text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Creator</th>
                  <th className="py-3 px-4">Gross</th>
                  <th className="py-3 px-4">4% Fee</th>
                  <th className="py-3 px-4">96% Creator</th>
                  <th className="py-3 px-4">Reserve Lifecycle</th>
                  <th className="py-3 px-4">Payout Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500">
                      {format(new Date(tx.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{tx.clientName}</div>
                      <div className="text-[10px] text-gray-400">{tx.clientEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{tx.creatorName}</div>
                      <div className="text-[10px] text-gray-400">{tx.sessionTitle}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-950">
                      ₹{(tx.amountTotalPaise / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-orange-600">
                      ₹{(tx.platformFeePaise / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-600">
                      ₹{(tx.creatorPayoutPaise / 100).toLocaleString("en-IN")}
                    </td>

                    {/* Reserve Lifecycle */}
                    <td className="py-3.5 px-4">
                      {tx.bookingStatus === "CANCELLED" || tx.bookingStatus === "REFUNDED" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                          Cancelled / Refunded
                        </span>
                      ) : tx.isUpcoming ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          <Clock className="w-2.5 h-2.5" />
                          Held in Reserve
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Completed
                        </span>
                      )}
                    </td>

                    {/* Payout Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.payoutStatus === "MANUALLY_PAID" || tx.payoutStatus === "ROUTE_TRANSFERRED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {tx.payoutStatus === "MANUALLY_PAID"
                          ? "Disbursed"
                          : tx.payoutStatus === "ROUTE_TRANSFERRED"
                          ? "Route Split"
                          : "Pending"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      {tx.bookingStatus === "CONFIRMED" && tx.isUpcoming && (
                        <button
                          onClick={() => handleMarkSessionComplete(tx.bookingId)}
                          className="py-1 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-semibold transition-colors mr-1.5"
                          title="Prematurely mark session as done to release reserve"
                        >
                          Mark Completed
                        </button>
                      )}

                      {tx.payoutStatus === "NOT_PAID_OUT" && tx.status === "CAPTURED" && (
                        <button
                          onClick={() => handleMarkSinglePaymentPaid(tx.id)}
                          className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: CANCELLATIONS & REASONS ── */}
      {activeTab === "cancellations" && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Cancellation & Refund Audits</h3>
              <p className="text-xs text-gray-500">
                Full transparency on which party cancelled, the reason given, and how money was refunded.
              </p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
              {cancelledTransactions.length} Total Cancellations
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50/75 text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Creator</th>
                  <th className="py-3 px-4">Cancelled By</th>
                  <th className="py-3 px-4">Reason Stated</th>
                  <th className="py-3 px-4">Refund Amount</th>
                  <th className="py-3 px-4 text-right">Refund Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cancelledTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                      No cancellations recorded.
                    </td>
                  </tr>
                ) : (
                  cancelledTransactions.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500">
                        {format(new Date(c.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{c.clientName}</div>
                        <div className="text-[10px] text-gray-400">{c.clientEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{c.creatorName}</div>
                        <div className="text-[10px] text-gray-400">{c.sessionTitle}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.cancelledBy === "CREATOR"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {c.cancelledBy || "CLIENT"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="max-w-xs font-medium text-gray-900 truncate" title={c.cancellationReason}>
                          {c.cancellationReason || "Client requested cancellation"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-red-600">
                        ₹{((c.refundAmountPaise || c.amountTotalPaise) / 100).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium">
                        <span className="text-[11px] text-gray-600">
                          {c.refundType === "FULL" ? "100% Full Refund" : "96% Partial"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: PROCEED TO PAY CREATOR ── */}
      {selectedCreatorForPayout && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-200 space-y-6 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Creator Payout Clearance
                </span>
                <h2 className="text-xl font-extrabold text-gray-950 mt-1">
                  Disburse to {selectedCreatorForPayout.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCreatorForPayout(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payout Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Eligible Sessions
                </span>
                <span className="text-lg font-extrabold text-gray-900">
                  {selectedCreatorForPayout.pendingEligibleBookingsCount} Finished
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                  Net Amount to Pay
                </span>
                <span className="text-xl font-black text-emerald-700">
                  ₹{(selectedCreatorForPayout.netPendingPayoutPaise / 100).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Fee adjustment notice if any */}
            {selectedCreatorForPayout.balanceAdjustmentPaise < 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  Automatic deduction of ₹{Math.abs(selectedCreatorForPayout.balanceAdjustmentPaise / 100)} applied to recover 4% platform fee from previous full cancellation.
                </span>
              </div>
            )}

            {/* Destination Account Details */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Payment Destination
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 uppercase">
                  {selectedCreatorForPayout.payoutMethod || "UPI"}
                </span>
              </div>

              {selectedCreatorForPayout.payoutMethod === "bank" && selectedCreatorForPayout.payoutDetails?.bankAccount ? (
                <div className="space-y-1.5 text-xs text-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account Holder:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedCreatorForPayout.payoutDetails.accountHolderName || selectedCreatorForPayout.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bank Account Number:</span>
                    <span className="font-mono font-bold text-gray-900">
                      {selectedCreatorForPayout.payoutDetails.bankAccount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">IFSC Code:</span>
                    <span className="font-mono font-bold text-orange-600">
                      {selectedCreatorForPayout.payoutDetails.ifsc}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Creator UPI VPA:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-sm text-gray-950">
                        {selectedCreatorForPayout.payoutDetails?.upiId || "No UPI set"}
                      </span>
                      {selectedCreatorForPayout.payoutDetails?.upiId && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedCreatorForPayout.payoutDetails.upiId);
                            setCopiedUpi(true);
                            setTimeout(() => setCopiedUpi(false), 2000);
                          }}
                          className="p-1 rounded-md bg-white border border-gray-200 text-gray-500 hover:text-gray-900"
                          title="Copy UPI ID"
                        >
                          {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedCreatorForPayout.payoutDetails?.upiId && (
                    <div className="pt-2 flex items-center justify-between border-t border-gray-200">
                      <a
                        href={`upi://pay?pa=${selectedCreatorForPayout.payoutDetails.upiId}&pn=${encodeURIComponent(
                          selectedCreatorForPayout.name
                        )}&am=${(selectedCreatorForPayout.netPendingPayoutPaise / 100).toFixed(2)}&cu=INR`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open UPI App on Device</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Form to Record Payout */}
            <form onSubmit={handleInitiateCreatorPayout} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Transfer Reference / UTR Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR12345678 or RazorpayX Payout ID"
                  value={payoutReference}
                  onChange={(e) => setPayoutReference(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Funds sit in your platform account until you disburse. Enter reference to mark completed.
                </p>
              </div>

              {payoutSuccessMsg ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{payoutSuccessMsg}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCreatorForPayout(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingPayout}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingPayout ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Confirm Paid & Clear Dues</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATOR CANCELLATION DETAILS ── */}
      {selectedCancelledCreator && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-950">
                  Cancellations for {selectedCancelledCreator.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedCancelledCreator.cancelledBookings?.length || 0} session(s) cancelled
                </p>
              </div>
              <button
                onClick={() => setSelectedCancelledCreator(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 divide-y divide-gray-100">
              {selectedCancelledCreator.cancelledBookings?.map((b: any) => (
                <div key={b.id} className="pt-3 first:pt-0 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-900">{b.sessionTitle}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                      {b.cancelledBy} Cancelled
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Client: <span className="font-medium text-gray-700">{b.clientName}</span> ({b.clientEmail})
                  </div>
                  <div className="text-xs italic bg-gray-50 border border-gray-200/70 p-2 rounded-xl text-gray-700">
                    "{b.cancellationReason}"
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                    <span>Date: {format(new Date(b.scheduledStart), "MMM d, yyyy h:mm a")}</span>
                    <span className="font-semibold text-red-600">
                      Refund: ₹{(b.refundAmountPaise / 100).toLocaleString("en-IN")} ({b.refundType})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
