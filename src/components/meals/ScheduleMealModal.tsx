"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, addWeeks, subWeeks } from "date-fns";
import { subscribeToWeekPlan } from "@/lib/firebase/firestore";
import type { DayPlan, WeekPlan } from "@/types";

const SLOT_LABELS: { key: keyof DayPlan; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snacks", label: "Snacks" },
];

interface Props {
  mealName: string;
  householdId: string;
  mealSlots: string[];
  initialWeekStart: Date;
  onSchedule: (weekStartStr: string, date: string, slot: keyof DayPlan) => void;
  onClose: () => void;
}

export default function ScheduleMealModal({
  mealName,
  householdId,
  mealSlots,
  initialWeekStart,
  onSchedule,
  onClose,
}: Props) {
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);

  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  useEffect(() => {
    const unsub = subscribeToWeekPlan(householdId, weekStartStr, setWeekPlan);
    return () => unsub();
  }, [householdId, weekStartStr]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const activeSlots = SLOT_LABELS.filter((s) => mealSlots.includes(s.key));

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">Schedule meal</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{mealName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 flex-shrink-0">
          <button
            onClick={() => setWeekStart((w) => subWeeks(w, 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {format(weekStart, "d MMM")} – {format(addDays(weekStart, 6), "d MMM yyyy")}
          </span>
          <button
            onClick={() => setWeekStart((w) => addWeeks(w, 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day / slot grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {days.map((day) => {
            const isoDate = format(day, "yyyy-MM-dd");
            return (
              <div key={isoDate}>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">
                  {format(day, "EEEE d MMM")}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {activeSlots.map(({ key, label }) => {
                    const occupied = !!(weekPlan?.days?.[isoDate]?.[key]);
                    return (
                      <button
                        key={key}
                        onClick={() => onSchedule(weekStartStr, isoDate, key)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium text-left transition-colors ${
                          occupied
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-gray-50 text-gray-700 hover:bg-rose-50 hover:text-rose-700"
                        }`}
                      >
                        {label}
                        {occupied && (
                          <span className="block text-[10px] text-amber-500">
                            replaces existing
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
