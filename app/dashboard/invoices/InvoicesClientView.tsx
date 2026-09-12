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
  Printer,
  ArrowDownToLine,
  Filter,
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
  gatewayFeePaise?: number;
  gatewayGstPaise?: number;
  totalTaxAndGatewayPaise?: number;
  netPayoutPaise: number;
  grossRupees: string;
  platformFeeRupees: string;
  gatewayFeeRupees?: string;
  gatewayGstRupees?: string;
  totalTaxAndGatewayRupees?: string;
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
    <div className="space-y-8 pb-12 print:space-y-4 print:text-black">
      {/* Header (hidden in print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Finance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-orange-600" />
            <span>Invoices & Statements</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Filter, inspect, and export your session invoices and net earnings for any chosen date range.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCsv}
            className="py-2 px-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-2 transition-colors border border-gray-200 cursor-pointer shadow-xs"
          >
            <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrintStatement}
            className="py-2 px-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs shadow-orange-500/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header (only visible when printing) */}
      <div className="hidden print:block border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">SessionBook — Creator Financial Statement</h1>
        <p className="text-sm text-gray-600 mt-1">
          Creator: <strong>{creatorName}</strong> ({creatorEmail})
        </p>
        <p className="text-xs text-gray-500">
          Statement Period: {fromDate || "Earliest"} to {toDate || "Present"} • Generated on {format(new Date(), "PPpp")}
        </p>
      </div>

      {/* Date Range & Filter Card (hidden in print) */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Inputs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
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
              className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors"
            >
              This Month
            </button>
            <button
              onClick={() => applyPreset("last-month")}
              className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors"
            >
              Last Month
            </button>
            <button
              onClick={() => applyPreset("last-90")}
              className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors"
            >
              Last 90 Days
            </button>
            <button
              onClick={() => applyPreset("ytd")}
              className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors"
            >
              Year to Date
            </button>
            <button
              onClick={() => applyPreset("all")}
              className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors"
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total Sessions
          </span>
          <div className="text-2xl font-extrabold text-gray-950 mt-1">
            {totals.sessions}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">In selected period</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Gross Billed (100%)
          </span>
          <div className="text-2xl font-extrabold text-gray-950 mt-1">
            ₹{(totals.grossPaise / 100).toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Total client payments</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Platform Fee (4%)
          </span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            -₹{(totals.feePaise / 100).toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Retained commission</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Net Creator Payout
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            ₹{(totals.netPaise / 100).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Your net earnings</p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-950 print:text-black">
            Invoiced Sessions ({invoices.length})
          </h2>
          <span className="text-xs text-gray-400 print:hidden">
            Showing {fromDate || "Start"} to {toDate || "Present"}
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white border border-gray-200 text-center shadow-xs">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-900 font-semibold">No invoices found for this date range</p>
            <p className="text-xs text-gray-500 mt-1">
              Try adjusting the date range or selecting "All Time" above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm text-gray-700 print:text-black">
              <thead className="bg-gray-50/75 text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4 text-right">Gross (₹)</th>
                  <th className="py-3 px-4 text-right">Platform (4%)</th>
                  <th className="py-3 px-4 text-right">Net Payout</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => {
                  const isRefunded = inv.status === "REFUNDED";
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-orange-600 print:text-black">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap text-xs">
                        {format(parseISO(inv.date), "MMM d, yyyy • h:mm a")}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-gray-950">{inv.clientName}</p>
                        <p className="text-xs text-gray-400">{inv.clientEmail}</p>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        <p className="truncate max-w-[160px] font-medium">{inv.sessionTitle}</p>
                        <p className="text-[11px] text-gray-400">{inv.durationMinutes} mins</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-gray-900">
                        ₹{parseFloat(inv.grossRupees).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-right text-amber-600 font-medium">
                        -₹{parseFloat(inv.platformFeeRupees).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                        {isRefunded ? (
                          <span className="text-gray-400 line-through">
                            ₹{parseFloat(inv.netPayoutRupees).toLocaleString("en-IN")}
                          </span>
                        ) : (
                          `₹${parseFloat(inv.netPayoutRupees).toLocaleString("en-IN")}`
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isRefunded
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right print:hidden">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          View
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-gray-200 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-mono text-orange-600 uppercase tracking-wider font-semibold">
                  Official Invoice
                </span>
                <h3 className="text-lg font-bold text-gray-950 mt-0.5">
                  {selectedInvoice.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Creator & Client Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-semibold">
                  Issued By (Creator)
                </span>
                <p className="font-semibold text-gray-900 mt-1">{creatorName}</p>
                <p className="text-gray-500">{creatorEmail}</p>
              </div>
              <div>
                <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-semibold">
                  Billed To (Client)
                </span>
                <p className="font-semibold text-gray-900 mt-1">{selectedInvoice.clientName}</p>
                <p className="text-gray-500">{selectedInvoice.clientEmail}</p>
                <p className="text-gray-500">{selectedInvoice.clientPhone}</p>
              </div>
            </div>

              {/* Item Table */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 text-gray-400 text-[11px] uppercase font-semibold">
                  <span>Fee / Deductions Breakdown</span>
                  <span>Amount</span>
                </div>
                <div className="flex items-center justify-between text-gray-800">
                  <div>
                    <p className="font-semibold text-gray-950">{selectedInvoice.sessionTitle}</p>
                    <p className="text-[11px] text-gray-500">
                      {format(parseISO(selectedInvoice.date), "PPP p")} ({selectedInvoice.durationMinutes} mins)
                    </p>
                  </div>
                  <span className="font-bold text-gray-950">₹{selectedInvoice.grossRupees}</span>
                </div>

                {/* Platform Fee 4% */}
                <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-gray-500 text-[11px]">
                  <div>
                    <span className="font-medium text-gray-700">1. Platform Commission (4%)</span>
                    <p className="text-[10px] text-gray-400">4% calculated on gross amount</p>
                  </div>
                  <span className="text-orange-600 font-semibold">-₹{selectedInvoice.platformFeeRupees}</span>
                </div>

                {/* Razorpay 2% */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-gray-500 text-[11px]">
                  <div>
                    <span className="font-medium text-gray-700">2. Razorpay Gateway Fee (2%)</span>
                    <p className="text-[10px] text-gray-400">2% applied on full booking amount</p>
                  </div>
                  <span className="text-slate-600 font-medium">
                    -₹{selectedInvoice.gatewayFeeRupees || (parseFloat(selectedInvoice.grossRupees) * 0.02).toFixed(2)}
                  </span>
                </div>

                {/* GST on processing */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-gray-500 text-[11px]">
                  <div>
                    <span className="font-medium text-gray-700">3. GST on Gateway Fee (18%)</span>
                    <p className="text-[10px] text-gray-400">Government tax on 2% gateway expense</p>
                  </div>
                  <span className="text-slate-600 font-medium">
                    -₹{selectedInvoice.gatewayGstRupees || (parseFloat(selectedInvoice.grossRupees) * 0.02 * 0.18).toFixed(2)}
                  </span>
                </div>

                {/* Total Deductions Callout */}
                <div className="p-2 rounded-lg bg-slate-100/80 border border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">Total Deductions (Platform 4% + Gateway/Tax ~2%):</span>
                  <span className="font-bold text-red-600">
                    -₹{(
                      parseFloat(selectedInvoice.platformFeeRupees) +
                      parseFloat(selectedInvoice.gatewayFeeRupees || (parseFloat(selectedInvoice.grossRupees) * 0.02).toFixed(2)) +
                      parseFloat(selectedInvoice.gatewayGstRupees || (parseFloat(selectedInvoice.grossRupees) * 0.02 * 0.18).toFixed(2))
                    ).toFixed(2)}
                  </span>
                </div>

                {/* Net Creator Payout */}
                <div className="pt-2.5 border-t border-gray-200 flex items-center justify-between font-bold text-sm">
                  <div>
                    <span className="text-gray-950">Net Creator Payout</span>
                    <p className="text-[10px] font-normal text-emerald-600">Disbursed to your registered bank / UPI</p>
                  </div>
                  <span className="text-emerald-600 text-base">₹{selectedInvoice.netPayoutRupees}</span>
                </div>
              </div>

            {/* Payment Meta */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-500 space-y-1">
              <p>Payment ID: <span className="font-mono text-gray-800">{selectedInvoice.paymentId}</span></p>
              <p>Razorpay Order: <span className="font-mono text-gray-800">{selectedInvoice.orderId}</span></p>
              <p>Payment Status: <span className="text-emerald-600 font-semibold">{selectedInvoice.paymentStatus}</span></p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs shadow-orange-500/20 transition-colors"
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
