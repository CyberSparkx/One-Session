"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  parseISO,
} from "date-fns";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  IndianRupee,
  Search,
  CheckCircle2,
  Clock,
  ArrowDownToLine,
  Filter,
  Sparkles,
  ExternalLink,
  X,
} from "lucide-react";

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  sessionTitle: string;
  durationMinutes: number;
  status: string;
  paymentStatus: string;
  paymentId: string;
  orderId: string;
  grossAmountPaise: number;
  platformFeePaise: number;
  netPayoutPaise: number;
  grossRupees: string;
  platformFeeRupees: string;
  netPayoutRupees: string;
}

interface InvoicesClientViewProps {
  creatorName: string;
  creatorEmail: string;
  creatorTimezone: string;
}

export default function InvoicesClientView({
  creatorName,
  creatorEmail,
  creatorTimezone,
}: InvoicesClientViewProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const defaultStartStr = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const [fromDate, setFromDate] = useState<string>(defaultStartStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  // Financial totals
  const [totals, setTotals] = useState({
    sessions: 0,
    grossPaise: 0,
    feePaise: 0,
    netPaise: 0,
  });

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/creator/invoices?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.items || []);
        setTotals({
          sessions: data.totalSessions || 0,
          grossPaise: data.totalGrossPaise || 0,
          feePaise: data.totalPlatformFeePaise || 0,
          netPaise: data.totalNetPayoutPaise || 0,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [fromDate, toDate, statusFilter]);

  // Date range presets
  const applyPreset = (preset: "this-month" | "last-month" | "last-90" | "ytd" | "all") => {
    const now = new Date();
    if (preset === "this-month") {
      setFromDate(format(startOfMonth(now), "yyyy-MM-dd"));
      setToDate(format(now, "yyyy-MM-dd"));
    } else if (preset === "last-month") {
      const prevMonth = subMonths(now, 1);
      setFromDate(format(startOfMonth(prevMonth), "yyyy-MM-dd"));
      setToDate(format(endOfMonth(prevMonth), "yyyy-MM-dd"));
    } else if (preset === "last-90") {
      setFromDate(format(subMonths(now, 3), "yyyy-MM-dd"));
      setToDate(format(now, "yyyy-MM-dd"));
    } else if (preset === "ytd") {
      setFromDate(format(startOfYear(now), "yyyy-MM-dd"));
      setToDate(format(now, "yyyy-MM-dd"));
    } else if (preset === "all") {
      setFromDate("");
      setToDate("");
    }
  };

  const handleDownloadCsv = () => {
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    params.set("format", "csv");
    window.open(`/api/creator/invoices?${params.toString()}`, "_blank");
  };

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="space-y-8 print:space-y-4 print:text-black">
      {/* Header (hidden in print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-400" />
            <span>Invoices & Statements</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Filter, inspect, and export your session invoices and net earnings for any chosen date range.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCsv}
            className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700 cursor-pointer shadow-sm"
          >
            <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrintStatement}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header (only visible when printing) */}
      <div className="hidden print:block border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold">SessionBook — Creator Financial Statement</h1>
        <p className="text-sm text-gray-600 mt-1">
          Creator: <strong>{creatorName}</strong> ({creatorEmail})
        </p>
        <p className="text-xs text-gray-500">
          Statement Period: {fromDate || "Earliest"} to {toDate || "Present"} • Generated on {format(new Date(), "PPpp")}
        </p>
      </div>

      {/* Date Range & Filter Card (hidden in print) */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Inputs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed / Paid</option>
                <option value="REFUNDED">Refunded / Cancelled</option>
              </select>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => applyPreset("this-month")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              This Month
            </button>
            <button
              onClick={() => applyPreset("last-month")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Last Month
            </button>
            <button
              onClick={() => applyPreset("last-90")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Last 90 Days
            </button>
            <button
              onClick={() => applyPreset("ytd")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Year to Date
            </button>
            <button
              onClick={() => applyPreset("all")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm print:bg-gray-50 print:border-gray-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-gray-500">
            Total Sessions
          </span>
          <div className="text-2xl font-bold text-white mt-1 print:text-black">
            {totals.sessions}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 print:text-gray-500">In selected period</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm print:bg-gray-50 print:border-gray-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-gray-500">
            Gross Billed (100%)
          </span>
          <div className="text-2xl font-bold text-white mt-1 print:text-black">
            ₹{(totals.grossPaise / 100).toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 print:text-gray-500">Total client payments</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm print:bg-gray-50 print:border-gray-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-gray-500">
            Platform Fee (4%)
          </span>
          <div className="text-2xl font-bold text-amber-400 mt-1 print:text-gray-700">
            -₹{(totals.feePaise / 100).toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 print:text-gray-500">Retained commission</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm print:bg-gray-50 print:border-gray-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-gray-500">
            Net Creator Payout (96%)
          </span>
          <div className="text-2xl font-bold text-emerald-400 mt-1 print:text-black">
            ₹{(totals.netPaise / 100).toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 print:text-gray-500">Your net earnings</p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white print:text-black">
            Invoiced Sessions ({invoices.length})
          </h2>
          <span className="text-xs text-slate-400 print:hidden">
            Showing {fromDate || "Start"} to {toDate || "Present"}
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">No invoices found for this date range</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting the date range or selecting "All Time" above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl print:border-gray-300 print:bg-white">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300 print:text-black">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 print:bg-gray-100 print:text-gray-700">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4 text-right">Gross (₹)</th>
                  <th className="py-3 px-4 text-right">Platform (4%)</th>
                  <th className="py-3 px-4 text-right">Net Payout (96%)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                {invoices.map((inv) => {
                  const isRefunded = inv.status === "REFUNDED";
                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-indigo-400 print:text-black">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap text-xs">
                        {format(parseISO(inv.date), "MMM d, yyyy • h:mm a")}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-white print:text-black">{inv.clientName}</p>
                        <p className="text-xs text-slate-400">{inv.clientEmail}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200">
                        <p className="truncate max-w-[160px]">{inv.sessionTitle}</p>
                        <p className="text-[11px] text-slate-400">{inv.durationMinutes} mins</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-200">
                        ₹{parseFloat(inv.grossRupees).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-right text-amber-400/90">
                        -₹{parseFloat(inv.platformFeeRupees).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400 print:text-black">
                        {isRefunded ? (
                          <span className="text-slate-500 line-through">
                            ₹{parseFloat(inv.netPayoutRupees).toLocaleString("en-IN")}
                          </span>
                        ) : (
                          `₹${parseFloat(inv.netPayoutRupees).toLocaleString("en-IN")}`
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isRefunded
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right print:hidden">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium transition-colors cursor-pointer"
                        >
                          View Invoice
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Individual Invoice View Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                  Official Invoice
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedInvoice.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Creator & Client Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block uppercase tracking-wider text-[10px]">
                  Issued By (Creator)
                </span>
                <p className="font-semibold text-white mt-1">{creatorName}</p>
                <p className="text-slate-400">{creatorEmail}</p>
              </div>
              <div>
                <span className="text-slate-500 block uppercase tracking-wider text-[10px]">
                  Billed To (Client)
                </span>
                <p className="font-semibold text-white mt-1">{selectedInvoice.clientName}</p>
                <p className="text-slate-400">{selectedInvoice.clientEmail}</p>
                <p className="text-slate-400">{selectedInvoice.clientPhone}</p>
              </div>
            </div>

            {/* Item Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-slate-400 text-[11px] uppercase">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="flex items-center justify-between text-slate-200">
                <div>
                  <p className="font-semibold text-white">{selectedInvoice.sessionTitle}</p>
                  <p className="text-[11px] text-slate-400">
                    {format(parseISO(selectedInvoice.date), "PPP p")} ({selectedInvoice.durationMinutes} mins)
                  </p>
                </div>
                <span className="font-bold text-white">₹{selectedInvoice.grossRupees}</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-400 text-[11px]">
                <span>Platform Commission (4%)</span>
                <span className="text-amber-400">-₹{selectedInvoice.platformFeeRupees}</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between font-bold text-sm">
                <span className="text-white">Net Creator Payout</span>
                <span className="text-emerald-400">₹{selectedInvoice.netPayoutRupees}</span>
              </div>
            </div>

            {/* Payment Meta */}
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400 space-y-1">
              <p>Payment ID: <span className="font-mono text-slate-300">{selectedInvoice.paymentId}</span></p>
              <p>Razorpay Order: <span className="font-mono text-slate-300">{selectedInvoice.orderId}</span></p>
              <p>Payment Status: <span className="text-emerald-400 font-semibold">{selectedInvoice.paymentStatus}</span></p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
