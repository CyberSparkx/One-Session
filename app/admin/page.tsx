"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ShieldAlert,
  IndianRupee,
  Users,
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Building2,
  Smartphone,
  Search,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"transactions" | "creators">("transactions");
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (paymentId: string) => {
    if (!confirm("Are you sure you want to mark this creator payout as sent?")) return;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Super Admin Portal
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                4% Platform Commission
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Live ledger, gross merchandise value, commission earnings, and creator payouts.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm shadow-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Gross Volume (GMV)
          </span>
          <div className="text-2xl font-bold text-white">
            ₹{(stats?.totalGmvRupees || 0).toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-slate-500 mt-1">Total customer payments</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm shadow-xl">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-2">
            Platform 4% Revenue
          </span>
          <div className="text-2xl font-bold text-indigo-400">
            ₹{(stats?.totalPlatformFeeRupees || 0).toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-slate-500 mt-1">Net platform commission retained</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm shadow-xl">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-2">
            Creator 96% Payouts
          </span>
          <div className="text-2xl font-bold text-emerald-400">
            ₹{(stats?.totalCreatorPayoutsRupees || 0).toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-slate-500 mt-1">Disbursed or due to creators</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm shadow-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Active Creators
          </span>
          <div className="text-2xl font-bold text-white">
            {stats?.publishedCreatorsCount || 0}{" "}
            <span className="text-xs font-normal text-slate-500">
              / {stats?.creatorsCount || 0} total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{stats?.confirmedBookingsCount || 0} confirmed sessions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`py-2 px-4 rounded-xl text-xs font-medium transition-all ${
            activeTab === "transactions"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Transactions & Payouts ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab("creators")}
          className={`py-2 px-4 rounded-xl text-xs font-medium transition-all ${
            activeTab === "creators"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Creators Directory ({creators.length})
        </button>
      </div>

      {/* Tab 1: Transactions Table */}
      {activeTab === "transactions" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Creator</th>
                  <th className="py-3 px-4">Gross</th>
                  <th className="py-3 px-4">4% Fee</th>
                  <th className="py-3 px-4">96% Creator</th>
                  <th className="py-3 px-4">Payout Method</th>
                  <th className="py-3 px-4">Payout Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 text-sm">
                      No transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {format(new Date(tx.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">{tx.clientName}</div>
                        <div className="text-[10px] text-slate-500">{tx.clientEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">{tx.creatorName}</div>
                        <div className="text-[10px] text-slate-500">{tx.sessionTitle}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        ₹{(tx.amountTotalPaise / 100).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-indigo-400">
                        ₹{(tx.platformFeePaise / 100).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-emerald-400">
                        ₹{(tx.creatorPayoutPaise / 100).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.creatorPayoutMethod === "upi" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                            <Smartphone className="w-3 h-3 text-indigo-400" />
                            <span>{tx.creatorPayoutDetails?.upiId || "UPI"}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                            <Building2 className="w-3 h-3 text-indigo-400" />
                            <span>{tx.creatorPayoutDetails?.bankAccount ? `A/C: ${tx.creatorPayoutDetails.bankAccount}` : "Bank"}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            tx.payoutStatus === "MANUALLY_PAID" || tx.payoutStatus === "ROUTE_TRANSFERRED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {tx.payoutStatus === "MANUALLY_PAID"
                            ? "Paid"
                            : tx.payoutStatus === "ROUTE_TRANSFERRED"
                            ? "Route Split"
                            : "Pending"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {tx.payoutStatus === "NOT_PAID_OUT" && tx.status === "CAPTURED" && (
                          <button
                            onClick={() => handleMarkPaid(tx.id)}
                            className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Creators Directory Table */}
      {activeTab === "creators" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Creator</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Sessions</th>
                  <th className="py-3 px-4">Bookings</th>
                  <th className="py-3 px-4">Total Earned</th>
                  <th className="py-3 px-4">Payout Method</th>
                  <th className="py-3 px-4 text-right">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {creators.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-slate-500">{c.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">/u/{c.slug}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          c.isPublished
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {c.isPublished ? "Live" : "Draft"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{c.sessionTypesCount}</td>
                    <td className="py-3.5 px-4 text-slate-300">{c.confirmedBookingsCount}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      ₹{c.totalEarnedRupees.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 uppercase text-[11px] text-slate-400">
                      {c.payoutMethod || "UPI"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/u/${c.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
