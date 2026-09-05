"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Clock,
  IndianRupee,
  ShieldCheck,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Check,
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
      description: form.description || null,
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

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save session type");
      } else {
        setModalOpen(false);
        fetchSessionTypes();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this session type?")) return;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Session Types
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Define the consultations, mentorship calls, or services clients can book with you.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Session Type</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessionTypes.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white">No session types created yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Create your first session type (e.g. 45-min Career Coaching or 30-min Technical Consultation) to start accepting paid bookings.
          </p>
          <button
            onClick={openCreateModal}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            Create Session Type
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessionTypes.map((st) => (
            <div
              key={st.id}
              className={`p-6 rounded-2xl border transition-all shadow-xl flex flex-col justify-between ${
                st.isActive
                  ? "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                  : "bg-slate-950/50 border-slate-850 opacity-60"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      st.isActive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {st.isActive ? "Active" : "Inactive"}
                  </span>
                  <div className="text-lg font-bold text-white flex items-center">
                    <span>₹{(st.priceInPaise / 100).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white tracking-tight">{st.title}</h3>
                  {st.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{st.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Duration</span>
                    <span className="font-medium text-slate-200">{st.durationMinutes} minutes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Buffer Time</span>
                    <span className="font-medium text-slate-400">
                      {st.bufferBeforeMin > 0 ? `${st.bufferBeforeMin}m pre / ` : ""}
                      {st.bufferAfterMin}m post
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/50">
                    <span className="text-slate-500">Your Net (96%)</span>
                    <span className="font-medium text-emerald-400">
                      ₹{Math.round((st.priceInPaise * 0.96) / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(st)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Edit session"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(st.id)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
                  title="Delete session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-semibold text-white">
                {editingId ? "Edit Session Type" : "Create New Session Type"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                  Session Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1-on-1 Mentorship & Architecture Review"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="What can the client expect during this session?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                    Price (INR ₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={form.priceInRupees}
                    onChange={(e) => setForm({ ...form, priceInRupees: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                    Buffer Before (Min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={form.bufferBeforeMin}
                    onChange={(e) => setForm({ ...form, bufferBeforeMin: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                    Buffer After (Min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={form.bufferAfterMin}
                    onChange={(e) => setForm({ ...form, bufferAfterMin: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-sm font-medium text-slate-300">Active (Visible for booking)</span>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
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
