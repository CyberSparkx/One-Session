"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Clock,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Sparkles,
  Info,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";

interface SessionType {
  id: string;
  title: string;
  description?: string | null;
  durationMinutes: number;
  priceInPaise: number;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  isActive: boolean;
}

// Exact fee calculation matching the billing engine:
// Platform Fee: 4%
// Gateway Fee: 2%
// GST on Gateway Fee: 18% of 2% = 0.36%
// Total deduction: 6.36%
// Creator Net Payout: 93.64%
function calculateNetBreakdown(priceInPaise: number) {
  const platformFee = Math.round(priceInPaise * 0.04);
  const gatewayFee = Math.round(priceInPaise * 0.02);
  const gatewayGst = Math.round(gatewayFee * 0.18);
  const totalDeductions = platformFee + gatewayFee + gatewayGst;
  const netPayout = Math.max(0, priceInPaise - totalDeductions);
  return {
    platformFee,
    gatewayFee,
    gatewayGst,
    totalDeductions,
    netPayout,
  };
}

export default function SessionTypesPage() {
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showFeeModal, setShowFeeModal] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    durationMinutes: 30,
    priceInRupees: 1500,
    bufferBeforeMin: 0,
    bufferAfterMin: 15,
    isActive: true,
  });

  useEffect(() => {
    fetchSessionTypes();
  }, []);

  const fetchSessionTypes = async () => {
    try {
      const res = await fetch("/api/creator/session-types");
      if (res.ok) {
        const data = await res.json();
        setSessionTypes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      durationMinutes: 30,
      priceInRupees: 1500,
      bufferBeforeMin: 0,
      bufferAfterMin: 15,
      isActive: true,
    });
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (st: SessionType) => {
    setEditingId(st.id);
    setForm({
      title: st.title,
      description: st.description || "",
      durationMinutes: st.durationMinutes,
      priceInRupees: st.priceInPaise / 100,
      bufferBeforeMin: st.bufferBeforeMin,
      bufferAfterMin: st.bufferAfterMin,
      isActive: st.isActive,
    });
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      title: form.title,
      description: form.description,
      durationMinutes: Number(form.durationMinutes),
      priceInPaise: Math.round(Number(form.priceInRupees) * 100),
      bufferBeforeMin: Number(form.bufferBeforeMin),
      bufferAfterMin: Number(form.bufferAfterMin),
      isActive: form.isActive,
    };

    try {
      const url = editingId
        ? `/api/creator/session-types/${editingId}`
        : "/api/creator/session-types";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMsg = "Failed to save session type";
        try {
          const data = await res.json();
          if (data.details) {
            const fieldErrors = Object.entries(data.details)
              .map(([field, msgs]: [string, any]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
              .join("; ");
            errorMsg = `${data.error || errorMsg} (${fieldErrors})`;
          } else {
            errorMsg = data.error || errorMsg;
          }
        } catch {
          const text = await res.text().catch(() => "");
          if (text) errorMsg = text;
        }
        throw new Error(errorMsg);
      }

      setModalOpen(false);
      fetchSessionTypes();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session type?")) return;

    try {
      const res = await fetch(`/api/creator/session-types/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchSessionTypes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Offerings
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            Session Types
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Define the consultations, mentorship calls, or services clients can book with you.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <button
              type="button"
              onClick={() => setShowFeeModal(true)}
              className="py-2 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-orange-600" />
              <span>Payment Structure</span>
            </button>
            {/* Quick hover preview tooltip */}
            <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-gray-950 text-white rounded-xl shadow-xl text-xs z-30 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200">
              <div className="font-bold text-[11px] uppercase tracking-wider text-orange-400 mb-1.5 flex items-center justify-between">
                <span>Fee Division (Total 6.36%)</span>
                <span>Net: 93.64%</span>
              </div>
              <ul className="space-y-1 text-gray-300 text-[11px]">
                <li className="flex justify-between">
                  <span>Platform Fee:</span>
                  <span className="font-semibold text-white">4.0%</span>
                </li>
                <li className="flex justify-between">
                  <span>Razorpay Gateway:</span>
                  <span className="font-semibold text-white">2.0%</span>
                </li>
                <li className="flex justify-between">
                  <span>GST on Gateway (18%):</span>
                  <span className="font-semibold text-white">0.36%</span>
                </li>
              </ul>
              <div className="mt-2 pt-2 border-t border-gray-800 text-[10px] text-gray-400">
                Click to view complete payout calculation breakdown.
              </div>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs shadow-orange-500/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Session Type</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessionTypes.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-gray-200 text-center shadow-xs">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No session types created yet</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-6">
            Create your first session type (e.g. 45-min Career Coaching or 30-min Technical Consultation) to start accepting paid bookings.
          </p>
          <button
            onClick={openCreateModal}
            className="py-2 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-colors"
          >
            Create Session Type
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessionTypes.map((st) => (
            <div
              key={st.id}
              className={`p-6 rounded-2xl border transition-all shadow-xs flex flex-col justify-between ${
                st.isActive
                  ? "bg-white border-gray-200/90 hover:border-gray-300 hover:shadow-sm"
                  : "bg-gray-50/70 border-gray-200 opacity-70"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      st.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${st.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                    {st.isActive ? "Active" : "Inactive"}
                  </span>
                  <div className="text-lg font-extrabold text-gray-950">
                    ₹{(st.priceInPaise / 100).toLocaleString("en-IN")}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-950 tracking-tight">{st.title}</h3>
                  {st.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{st.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="text-gray-400">Duration</span>
                    <span className="font-semibold text-gray-800">{st.durationMinutes} minutes</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="text-gray-400">Buffer</span>
                    <span className="font-medium text-gray-600">
                      {st.bufferBeforeMin > 0 ? `${st.bufferBeforeMin}m pre / ` : ""}
                      {st.bufferAfterMin}m post
                    </span>
                  </div>
                  {(() => {
                    const breakdown = calculateNetBreakdown(st.priceInPaise);
                    return (
                      <div className="pt-2 border-t border-gray-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 font-medium flex items-center gap-1">
                            Your Net (93.64%)
                            <button
                              type="button"
                              onClick={() => setShowFeeModal(true)}
                              className="text-gray-400 hover:text-orange-600 transition-colors"
                              title="View fee breakdown"
                            >
                              <HelpCircle className="w-3 h-3 inline" />
                            </button>
                          </span>
                          <span className="font-bold text-emerald-600">
                            ₹{(breakdown.netPayout / 100).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                          <span>Fees (4% + 2% + GST):</span>
                          <span>-₹{(breakdown.totalDeductions / 100).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(st)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  title="Edit session"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(st.id)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors"
                  title="Delete session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-950">
                {editingId ? "Edit Session Type" : "Create New Session Type"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Session Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1-on-1 Mentorship & Architecture Review"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="What can the client expect during this session?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Price (INR ₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={form.priceInRupees}
                    onChange={(e) => setForm({ ...form, priceInRupees: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors"
                  />
                </div>
              </div>

              {/* Dynamic Payout Preview inside the Form */}
              {(() => {
                const previewPaise = Math.max(0, Math.round(Number(form.priceInRupees || 0) * 100));
                const b = calculateNetBreakdown(previewPaise);
                return (
                  <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/80 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-gray-900">
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                        Estimated Creator Net (93.64%):
                      </span>
                      <span className="text-emerald-700 text-sm font-extrabold">
                        ₹{(b.netPayout / 100).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-orange-200/60">
                      <span>Platform Fee (4%): ₹{(b.platformFee / 100).toFixed(2)}</span>
                      <span>Gateway + GST (2.36%): ₹{((b.gatewayFee + b.gatewayGst) / 100).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Buffer Before (Min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={form.bufferBeforeMin}
                    onChange={(e) => setForm({ ...form, bufferBeforeMin: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Buffer After (Min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={form.bufferAfterMin}
                    onChange={(e) => setForm({ ...form, bufferAfterMin: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-sm font-medium text-gray-700">Active (Visible for booking)</span>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs shadow-orange-500/20 transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update Session" : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Structure Information Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-950">Payment Division Structure</h2>
                  <p className="text-xs text-gray-500">Transparent breakdown of every transaction</p>
                </div>
              </div>
              <button
                onClick={() => setShowFeeModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                    Your Payout Share
                  </span>
                  <span className="text-xl font-extrabold text-emerald-950">93.64%</span>
                  <p className="text-[11px] text-emerald-700/80 mt-0.5">
                    Directly disbursed to your registered bank account or UPI
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                    Total Deductions
                  </span>
                  <span className="text-xl font-extrabold text-gray-700">6.36%</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs">
                <div className="p-3.5 flex items-center justify-between bg-gray-50/50">
                  <div>
                    <span className="font-bold text-gray-900 block">Platform Commission</span>
                    <span className="text-gray-500 text-[11px]">Covers hosting, calendar sync & notifications</span>
                  </div>
                  <span className="font-extrabold text-gray-900 text-sm">4.00%</span>
                </div>

                <div className="p-3.5 flex items-center justify-between bg-white">
                  <div>
                    <span className="font-bold text-gray-900 block">Razorpay Payment Gateway</span>
                    <span className="text-gray-500 text-[11px]">Processing fee for UPI, Cards & NetBanking</span>
                  </div>
                  <span className="font-extrabold text-gray-900 text-sm">2.00%</span>
                </div>

                <div className="p-3.5 flex items-center justify-between bg-white">
                  <div>
                    <span className="font-bold text-gray-900 block">GST on Payment Gateway</span>
                    <span className="text-gray-500 text-[11px]">Standard 18% statutory GST on the 2% gateway fee</span>
                  </div>
                  <span className="font-extrabold text-gray-900 text-sm">0.36%</span>
                </div>
              </div>

              {/* Example Calculation Table */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="text-xs font-bold text-gray-900 flex items-center justify-between">
                  <span>Example with a ₹1,000 Session:</span>
                  <span className="text-gray-500 font-normal">₹1,000.00</span>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-500">• Platform Fee (4%)</span>
                    <span>- ₹40.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">• Razorpay Gateway Fee (2%)</span>
                    <span>- ₹20.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">• GST on Gateway (18% of ₹20)</span>
                    <span>- ₹3.60</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-gray-950">
                    <span className="text-emerald-700">Creator Net Payout</span>
                    <span className="text-emerald-600 font-extrabold">₹936.40</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowFeeModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
