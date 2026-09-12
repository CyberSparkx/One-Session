"use client";

import { useState, useEffect } from "react";
import {
  User,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  Building2,
  Smartphone,
} from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    avatarUrl: "",
    slug: "",
    timezone: "Asia/Kolkata",
    isPublished: false,
    payoutMethod: "upi",
    payoutDetails: {
      upiId: "",
      bankAccount: "",
      ifsc: "",
      accountHolderName: "",
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/creator/profile");
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || "",
          email: data.email || "",
          bio: data.bio || "",
          avatarUrl: data.avatarUrl || "",
          slug: data.slug || "",
          timezone: data.timezone || "Asia/Kolkata",
          isPublished: !!data.isPublished,
          payoutMethod: data.payoutMethod || "upi",
          payoutDetails: data.payoutDetails || {
            upiId: "",
            bankAccount: "",
            ifsc: "",
            accountHolderName: "",
          },
        });
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/creator/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to update profile" });
      } else {
        setMessage({ type: "success", text: "Profile and payout settings saved successfully!" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An unexpected error occurred" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div className="pb-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
            Account
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
          Profile & Payout Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Customize your public presence, personal booking slug, and automated payout preferences.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Visibility & Publishing */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-950">Public Page Visibility</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                When enabled, clients can view your public booking profile and schedule sessions.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>
        </div>

        {/* Section 2: Personal Profile */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-gray-950 border-b border-gray-100 pb-3">
            Public Profile Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Account Email
              </label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-400 text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Public Booking URL Slug
            </label>
            <div className="flex items-center">
              <span className="px-3.5 py-2.5 rounded-l-xl bg-gray-100 border border-r-0 border-gray-200 text-gray-500 text-xs font-mono font-medium">
                /u/
              </span>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  })
                }
                className="flex-1 px-3.5 py-2.5 rounded-r-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm font-mono focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Your personal URL: <span className="text-orange-600 font-medium">/u/{formData.slug}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Bio & Introduction
            </label>
            <textarea
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell clients about your background, expertise, and what they will get from your 1:1 sessions..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Avatar Image URL
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Your Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+08:00)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Payout Details */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-5">
          {/* Platform Fee & Tax Transparency Notice */}
          <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80 text-xs text-orange-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-orange-900">
              <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
              <span>Transparent Fee Breakdown (4% Platform + 2% Gateway = ~6% Total Deductions)</span>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Every booking fee is calculated directly on the total gross booking amount:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2 rounded-xl bg-white border border-orange-200/80">
                <span className="text-orange-700 font-bold block">1. Platform Commission</span>
                <span className="text-gray-600">4% of gross price</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-orange-200/80">
                <span className="text-slate-700 font-bold block">2. Razorpay Gateway & Tax</span>
                <span className="text-gray-600">2% + 18% GST (~2.36%)</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <span className="font-bold block">3. Creator Net Payout</span>
                <span>Remaining (~94%)</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 pt-1">
              <em>Example: On a ₹3,000 booking, the platform fee is ₹120 (4%), gateway processing & tax is ~₹60 (2%), and you receive ₹2,820 (94%) net.</em>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-950">Payout Method (Direct Bank / UPI Transfer)</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Session earnings are held safely until session completion, then disbursed to your registered destination.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, payoutMethod: "upi" })}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  formData.payoutMethod === "upi"
                    ? "bg-orange-50 text-orange-700 border border-orange-200"
                    : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>UPI ID</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, payoutMethod: "bank" })}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  formData.payoutMethod === "bank"
                    ? "bg-orange-50 text-orange-700 border border-orange-200"
                    : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Bank Transfer</span>
              </button>
            </div>
          </div>

          {formData.payoutMethod === "upi" ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                UPI ID (VPA)
              </label>
              <input
                type="text"
                placeholder="username@okhdfcbank or phone@paytm"
                value={formData.payoutDetails?.upiId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    payoutDetails: {
                      ...formData.payoutDetails,
                      upiId: e.target.value,
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Payouts will be automatically disbursed directly to this UPI address.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  placeholder="Full name as on bank passbook"
                  value={formData.payoutDetails?.accountHolderName || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payoutDetails: {
                        ...formData.payoutDetails,
                        accountHolderName: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5010023456789"
                    value={formData.payoutDetails?.bankAccount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payoutDetails: {
                          ...formData.payoutDetails,
                          bankAccount: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC0001234"
                    value={formData.payoutDetails?.ifsc || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payoutDetails: {
                          ...formData.payoutDetails,
                          ifsc: e.target.value.toUpperCase(),
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm uppercase focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="py-2.5 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs shadow-xs shadow-orange-500/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
