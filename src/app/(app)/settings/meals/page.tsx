"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToHousehold, updateHouseholdMealSlots } from "@/lib/firebase/firestore";
import type { Household } from "@/types";

const ALL_SLOTS = [
  { key: "breakfast", label: "Breakfast", emoji: "🌅" },
  { key: "lunch",     label: "Lunch",     emoji: "☀️"  },
  { key: "dinner",    label: "Dinner",    emoji: "🌙" },
  { key: "snacks",    label: "Snacks",    emoji: "🍎" },
];

export default function MealSettingsPage() {
  const { householdId } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [selected, setSelected] = useState<string[]>(["dinner"]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!householdId) return;
    const unsub = subscribeToHousehold(householdId, (h) => {
      setHousehold(h);
      setSelected(h.mealSlots ?? ["dinner"]);
    });
    return () => unsub();
  }, [householdId]);

  function toggle(key: string) {
    setSelected((prev) =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter((k) => k !== key) : prev  // always keep at least 1
        : [...prev, key]
    );
  }

  async function handleSave() {
    if (!householdId) return;
    setSaving(true);
    try {
      await updateHouseholdMealSlots(householdId, selected);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/settings" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6">
        <ChevronLeft size={16} />
        Settings
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Meal planning</h1>
      <p className="text-sm text-gray-400 mb-6">
        Choose which meals to plan each week. Everyone in the household sees the same slots.
      </p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {ALL_SLOTS.map(({ key, label, emoji }, i) => {
          const active = selected.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`w-full flex items-center gap-4 px-4 py-4 hover:bg-rose-50 transition-colors ${
                i < ALL_SLOTS.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <span className="text-xl w-7 text-center flex-shrink-0">{emoji}</span>
              <span className="flex-1 text-left text-sm font-medium text-gray-900">{label}</span>
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  borderColor: active ? "#FF6B6B" : "#d1d5db",
                  backgroundColor: active ? "#FF6B6B" : "transparent",
                }}
              >
                {active && <Check size={12} className="text-white" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-2xl text-white font-medium transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ backgroundColor: saved ? "#22c55e" : "#FF6B6B" }}
      >
        {saved ? (
          <><Check size={16} /> Saved!</>
        ) : saving ? (
          "Saving…"
        ) : (
          "Save"
        )}
      </button>
    </div>
  );
}
