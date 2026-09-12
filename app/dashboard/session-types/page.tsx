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

export default function SessionTypesPage() {
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
        <button
          onClick={openCreateModal}
          className="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs shadow-orange-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Session Type</span>
        </button>
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
                  <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                    <span className="text-gray-400">Your Net (96%)</span>
                    <span className="font-bold text-emerald-600">
                      ₹{Math.round((st.priceInPaise * 0.96) / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
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
    </div>
  );
}
