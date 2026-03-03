"use client";

import { X } from "lucide-react";
import { format, addDays } from "date-fns";
import type { DayPlan, WeekPlan } from "@/types";

const SLOT_LABELS: { key: keyof DayPlan; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snacks", label: "Snacks" },
];

interface RescheduleModalProps {
  mealName: string;
  weekStart: Date;
  weekPlan: WeekPlan | null;
  mealSlots: string[];
  fromDate: string;
  fromSlot: keyof DayPlan;
  onMove: (toDate: string, toSlot: keyof DayPlan) => void;
  onClose: () => void;
}

export default function RescheduleModal({
  mealName,
  weekStart,
  weekPlan,
  mealSlots,
  fromDate,
  fromSlot,
  onMove,
  onClose,
}: RescheduleModalProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const activeSlots = SLOT_LABELS.filter((s) => mealSlots.includes(s.key));

  function isCurrentSlot(isoDate: string, slot: keyof DayPlan) {
    return isoDate === fromDate && slot === fromSlot;
  }

  function isOccupied(isoDate: string, slot: keyof DayPlan) {
    return !!(weekPlan?.days?.[isoDate]?.[slot]);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Move meal</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{mealName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Week grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {days.map((day) => {
            const isoDate = format(day, "yyyy-MM-dd");
            return (
              <div key={isoDate}>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">
                  {format(day, "EEEE d MMM")}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {activeSlots.map(({ key, label }) => {
                    const isCurrent = isCurrentSlot(isoDate, key);
                    const occupied = isOccupied(isoDate, key);
                    return (
                      <button
                        key={key}
                        disabled={isCurrent}
                        onClick={() => onMove(isoDate, key)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium text-left transition-colors ${
                          isCurrent
                            ? "bg-gray-100 text-gray-400 cursor-default"
                            : occupied
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-gray-50 text-gray-700 hover:bg-rose-50 hover:text-rose-700"
                        }`}
                      >
                        {label}
                        {isCurrent && <span className="block text-[10px] text-gray-400">current</span>}
                        {!isCurrent && occupied && <span className="block text-[10px] text-amber-500">replaces existing</span>}
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
