"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Copy, Check, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getHousehold, updateHouseholdCalendarEmail } from "@/lib/firebase/firestore";

export default function CalendarSyncPage() {
  const { householdId, memberProfile } = useAuth();
  const [calendarEmail, setCalendarEmail] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAdmin = memberProfile?.role === "admin";

  useEffect(() => {
    if (!householdId) return;
    getHousehold(householdId).then((h) => {
      if (h?.calendarEmail) {
        setCalendarEmail(h.calendarEmail);
        setInputEmail(h.calendarEmail);
      }
    });
  }, [householdId]);

  async function handleSave() {
    if (!householdId) return;
    setSaving(true);
    try {
      await updateHouseholdCalendarEmail(householdId, inputEmail.trim());
      setCalendarEmail(inputEmail.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!calendarEmail) return;
    await navigator.clipboard.writeText(calendarEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link
        href="/settings"
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6"
      >
        <ChevronLeft size={16} />
        Settings
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Calendar sync</h1>
      <p className="text-sm text-gray-400 mb-6">
        Set a shared Gmail address to sync Google Calendar events with your household.
      </p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shared Gmail address
          </label>
          {isAdmin ? (
            <div className="flex gap-2">
              <input
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="household@gmail.com"
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
              />
              <button
                onClick={handleSave}
                disabled={saving || !inputEmail.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60"
                style={{ backgroundColor: saved ? "#22c55e" : "#FF6B6B" }}
              >
                {saved ? <Check size={14} /> : <Save size={14} />}
                {saved ? "Saved" : "Save"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="flex-1 text-sm text-gray-700 px-3 py-2.5 bg-gray-50 rounded-xl">
                {calendarEmail || "Not set"}
              </p>
              {calendarEmail && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>
          )}
        </div>

        {calendarEmail && (
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-blue-700 font-medium mb-1">Setup instructions</p>
            <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
              <li>Open Google Calendar on the shared Gmail account</li>
              <li>Share each calendar you want synced with household members</li>
              <li>Members can view events from their own Google Calendar</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
