"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, X, ChefHat } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import type { Meal, WeekPlan, DayPlan, MemberProfile } from "@/types";

interface WeekViewProps {
  meals: Meal[];
  weekPlan: WeekPlan | null;
  weekStart: Date;
  mealSlots: string[];
  members: MemberProfile[];
  onWeekChange: (date: Date) => void;
  onPickMeal: (date: string, slot: keyof DayPlan) => void;
  onClearSlot: (date: string, slot: keyof DayPlan) => void;
  onMealTap: (mealId: string, date: string, slot: keyof DayPlan) => void;
  onSetCook: (date: string) => void;
}

const SLOTS: { key: keyof DayPlan; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snacks", label: "Snacks" },
];

export default function WeekView({
  meals,
  weekPlan,
  weekStart,
  mealSlots,
  members,
  onWeekChange,
  onPickMeal,
  onClearSlot,
  onMealTap,
  onSetCook,
}: WeekViewProps) {
  const today = new Date();
  const todayRef = useRef<HTMLDivElement>(null);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const mealMap = new Map(meals.map((m) => [m.id, m]));
  const activeSlots = SLOTS.filter((s) => mealSlots.includes(s.key));

  void members; // available for future use (e.g. member colour dots)

  // Scroll today's card into view when the week changes
  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [weekStart]);

  function getMealName(id: string | null | undefined): string | null {
    if (!id) return null;
    return mealMap.get(id)?.name ?? null;
  }

  function getDayPlan(isoDate: string): DayPlan {
    return weekPlan?.days[isoDate] ?? {
      breakfast: null,
      lunch: null,
      dinner: null,
      dinnerAlt: null,
      snacks: null,
      cook: null,
    };
  }

  return (
    <div>
      {/* Week nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onWeekChange(subWeeks(weekStart, 1))}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-semibold text-gray-900">
            {format(weekStart, "d MMM")} – {format(addDays(weekStart, 6), "d MMM yyyy")}
          </p>
          <button
            onClick={() => onWeekChange(startOfWeek(today, { weekStartsOn: 1 }))}
            className="text-xs mt-0.5"
            style={{ color: "#FF6B6B" }}
          >
            Today · {format(today, "EEE d MMM")}
          </button>
        </div>
        <button
          onClick={() => onWeekChange(addWeeks(weekStart, 1))}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Days */}
      <div className="space-y-3">
        {days.map((day) => {
          const isoDate = format(day, "yyyy-MM-dd");
          const dayPlan = getDayPlan(isoDate);
          const isToday = isSameDay(day, today);

          return (
            <div
              key={isoDate}
              ref={isToday ? todayRef : undefined}
              className="bg-white rounded-2xl shadow-sm border overflow-hidden"
              style={{ borderColor: isToday ? "#FF6B6B" : "#f3f4f6" }}
            >
              {/* Day header */}
              <div
                className={`px-4 py-2.5 flex items-center justify-between ${isToday ? "" : "bg-gray-50"}`}
                style={isToday ? { backgroundColor: "rgba(255, 107, 107, 0.15)" } : undefined}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{format(day, "EEEE")}</span>
                  <span className="text-sm text-gray-600">{format(day, "d MMM")}</span>
                </div>
                {isToday && (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: "#FF6B6B" }}
                  >
                    Today
                  </span>
                )}
              </div>

              {/* Slots */}
              <div className="divide-y divide-gray-50">
                {activeSlots.map(({ key, label }) => {
                  const mealId = dayPlan[key] as string | null;
                  const mealName = getMealName(mealId);

                  return (
                    <div key={key} className="flex items-start gap-3 px-4 py-2.5">
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0 pt-0.5">{label}</span>

                      {key === "dinner" ? (
                        /* ── Dinner slot: primary + optional alt ── */
                        <div className="flex-1 space-y-1">
                          {/* Primary dinner */}
                          {mealName && mealId ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onMealTap(mealId, isoDate, key)}
                                className="flex-1 text-left text-sm text-gray-700 font-medium hover:text-gray-900 transition-colors"
                              >
                                {mealName}
                              </button>
                              <button
                                onClick={() => onClearSlot(isoDate, key)}
                                className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => onPickMeal(isoDate, key)}
                              className="flex items-center gap-1 text-xs text-gray-300 hover:text-gray-500 transition-colors"
                            >
                              <Plus size={12} />
                              Add
                            </button>
                          )}

                          {/* Alt dinner — only shown once primary is set */}
                          {mealId && (
                            dayPlan.dinnerAlt ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-300 italic w-4">or</span>
                                <button
                                  onClick={() => onMealTap(dayPlan.dinnerAlt!, isoDate, "dinnerAlt")}
                                  className="flex-1 text-left text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                  {getMealName(dayPlan.dinnerAlt)}
                                </button>
                                <button
                                  onClick={() => onClearSlot(isoDate, "dinnerAlt")}
                                  className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => onPickMeal(isoDate, "dinnerAlt")}
                                className="flex items-center gap-1 text-xs text-gray-300 hover:text-gray-400 italic transition-colors"
                              >
                                <Plus size={10} />
                                or…
                              </button>
                            )
                          )}
                        </div>
                      ) : (
                        /* ── Standard slot ── */
                        mealName && mealId ? (
                          <div className="flex-1 flex items-center justify-between">
                            <button
                              onClick={() => onMealTap(mealId, isoDate, key)}
                              className="flex-1 text-left text-sm text-gray-700 font-medium hover:text-gray-900 transition-colors"
                            >
                              {mealName}
                            </button>
                            <button
                              onClick={() => onClearSlot(isoDate, key)}
                              className="p-1 text-gray-300 hover:text-red-400 transition-colors ml-2"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onPickMeal(isoDate, key)}
                            className="flex items-center gap-1 text-xs text-gray-300 hover:text-gray-500 transition-colors"
                          >
                            <Plus size={12} />
                            Add
                          </button>
                        )
                      )}
                    </div>
                  );
                })}

                {/* Cook row */}
                <div className="flex items-center gap-3 px-4 py-2">
                  <span className="text-xs text-gray-400 w-16 flex-shrink-0 flex items-center gap-1">
                    <ChefHat size={11} />
                    Cook
                  </span>
                  {dayPlan.cook ? (
                    <button
                      onClick={() => onSetCook(isoDate)}
                      className="flex-1 text-left text-sm text-gray-600 font-medium hover:text-gray-900 transition-colors"
                    >
                      {dayPlan.cook}
                    </button>
                  ) : (
                    <button
                      onClick={() => onSetCook(isoDate)}
                      className="flex items-center gap-1 text-xs text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <Plus size={12} />
                      Add
                    </button>
                  )}
                  {dayPlan.cook && (
                    <button
                      onClick={() => onSetCook(isoDate)}
                      className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <ChefHat size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
