"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CalendarOff,
  Sparkles,
} from "lucide-react";

interface Rule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Override {
  date: string;
  isBlocked: boolean;
  startTime?: string;
  endTime?: string;
}

const DAYS = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
  { id: 0, name: "Sunday" },
];

export default function AvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  const [rules, setRules] = useState<Rule[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);

  // Form for adding an override
  const [newOverrideDate, setNewOverrideDate] = useState("");
  const [newOverrideBlocked, setNewOverrideBlocked] = useState(true);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const res = await fetch("/api/creator/availability");
      if (res.ok) {
        const data = await res.json();
        setTimezone(data.timezone);
        setRules(
          data.rules.map((r: any) => ({
            dayOfWeek: r.dayOfWeek,
            startTime: r.startTime,
            endTime: r.endTime,
          }))
        );
        setOverrides(
          data.overrides.map((o: any) => ({
            date: o.date.split("T")[0],
            isBlocked: o.isBlocked,
            startTime: o.startTime || "10:00",
            endTime: o.endTime || "18:00",
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isDayEnabled = (dayOfWeek: number) => {
    return rules.some((r) => r.dayOfWeek === dayOfWeek);
  };

  const toggleDay = (dayOfWeek: number) => {
    if (isDayEnabled(dayOfWeek)) {
      setRules(rules.filter((r) => r.dayOfWeek !== dayOfWeek));
    } else {
      setRules([...rules, { dayOfWeek, startTime: "10:00", endTime: "18:00" }]);
    }
  };

  const updateRuleTime = (
    dayOfWeek: number,
    index: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const dayRules = rules.filter((r) => r.dayOfWeek === dayOfWeek);
    const otherRules = rules.filter((r) => r.dayOfWeek !== dayOfWeek);

    if (dayRules[index]) {
      dayRules[index] = { ...dayRules[index], [field]: value };
    }

    setRules([...otherRules, ...dayRules]);
  };

  const addTimeSlot = (dayOfWeek: number) => {
    setRules([...rules, { dayOfWeek, startTime: "14:00", endTime: "18:00" }]);
  };

  const removeTimeSlot = (dayOfWeek: number, index: number) => {
    const dayRules = rules.filter((r) => r.dayOfWeek === dayOfWeek);
    const otherRules = rules.filter((r) => r.dayOfWeek !== dayOfWeek);
    dayRules.splice(index, 1);
    setRules([...otherRules, ...dayRules]);
  };

  const handleAddOverride = () => {
    if (!newOverrideDate) return;
    if (overrides.some((o) => o.date === newOverrideDate)) {
      alert("An override for this date already exists");
      return;
    }

    setOverrides([
      ...overrides,
      {
        date: newOverrideDate,
        isBlocked: newOverrideBlocked,
      },
    ]);
    setNewOverrideDate("");
  };

  const handleRemoveOverride = (date: string) => {
    setOverrides(overrides.filter((o) => o.date !== date));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/creator/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules, overrides }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to save availability" });
      } else {
        setMessage({ type: "success", text: "Availability rules updated successfully!" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Weekly Availability
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure your repeating hours in <span className="text-indigo-400 font-medium">{timezone}</span>.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm border ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Weekly Schedule Grid */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-6">
        <h2 className="text-lg font-semibold text-white">Recurring Weekly Schedule</h2>

        <div className="divide-y divide-slate-800/80">
          {DAYS.map((day) => {
            const enabled = isDayEnabled(day.id);
            const dayRules = rules.filter((r) => r.dayOfWeek === day.id);

            return (
              <div key={day.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-center gap-3 w-40 shrink-0">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleDay(day.id)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                  <span className={`text-sm font-semibold ${enabled ? "text-white" : "text-slate-500"}`}>
                    {day.name}
                  </span>
                </div>

                <div className="flex-1 space-y-3">
                  {!enabled ? (
                    <span className="text-xs text-slate-500 italic">Unavailable / Day Off</span>
                  ) : (
                    dayRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="time"
                          value={rule.startTime}
                          onChange={(e) => updateRuleTime(day.id, idx, "startTime", e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-slate-500 text-xs">to</span>
                        <input
                          type="time"
                          value={rule.endTime}
                          onChange={(e) => updateRuleTime(day.id, idx, "endTime", e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        {dayRules.length > 1 && (
                          <button
                            onClick={() => removeTimeSlot(day.id, idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {idx === dayRules.length - 1 && (
                          <button
                            onClick={() => addTimeSlot(day.id)}
                            className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Add extra window"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Overrides Section */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Date Overrides & Blocked Days</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Block specific calendar dates for holidays or vacations so no one can book them.
          </p>
        </div>

        {/* Add Override Form */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <input
            type="date"
            value={newOverrideDate}
            onChange={(e) => setNewOverrideDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddOverride}
            disabled={!newOverrideDate}
            className="py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CalendarOff className="w-3.5 h-3.5" />
            <span>Block Date</span>
          </button>
        </div>

        {/* List of active overrides */}
        {overrides.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Active Overrides ({overrides.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {overrides.map((override) => (
                <div
                  key={override.date}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CalendarOff className="w-4 h-4 text-rose-400" />
                    <span className="font-mono text-slate-200">{override.date}</span>
                    <span className="text-rose-400 font-medium">(Day Off)</span>
                  </div>
                  <button
                    onClick={() => handleRemoveOverride(override.date)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
