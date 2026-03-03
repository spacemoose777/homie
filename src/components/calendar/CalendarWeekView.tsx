"use client";

import { format, addDays, isSameDay, isToday } from "date-fns";
import type { CalendarEvent, MemberProfile } from "@/types";
import type { EventOccurrence } from "@/lib/recurring";

type MealEntry = { slot: string; mealId: string; mealName: string; hour: number };

interface CalendarWeekViewProps {
  weekStart: Date;
  occurrences: EventOccurrence[];
  mealEntries: MealEntry[];
  members: MemberProfile[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

export default function CalendarWeekView({
  weekStart,
  occurrences,
  mealEntries,
  members,
  selectedDate,
  onSelectDate,
  onEditEvent,
}: CalendarWeekViewProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function getItemsForDay(date: Date) {
    const isoDate = format(date, "yyyy-MM-dd");
    const events = occurrences.filter((o) => o.occurrenceDate === isoDate);
    const meals = isSameDay(date, selectedDate) ? mealEntries : [];
    return { events, meals };
  }

  return (
    <div className="space-y-2">
      {days.map((day) => {
        const { events, meals } = getItemsForDay(day);
        const todayDay = isToday(day);
        const selected = isSameDay(day, selectedDate);
        const hasItems = events.length > 0 || meals.length > 0;

        return (
          <div
            key={format(day, "yyyy-MM-dd")}
            className={`bg-white rounded-2xl border overflow-hidden ${selected ? "shadow-md" : "shadow-sm"}`}
            style={{ borderColor: todayDay ? "#FF6B6B" : selected ? "#FFB3B3" : "#f3f4f6" }}
          >
            {/* Day header */}
            <button
              onClick={() => onSelectDate(day)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                selected ? "bg-rose-50" : todayDay ? "bg-orange-50" : "bg-gray-50/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900">{format(day, "EEE")}</span>
                <span
                  className="text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full"
                  style={todayDay ? { backgroundColor: "#FF6B6B", color: "white" } : { color: "#6b7280" }}
                >
                  {format(day, "d")}
                </span>
              </div>
              {hasItems && (
                <span className="text-xs text-gray-400">
                  {events.length + meals.length} item{events.length + meals.length !== 1 ? "s" : ""}
                </span>
              )}
            </button>

            {/* Events for this day */}
            {hasItems && (
              <div className="px-3 py-2 space-y-1">
                {events.map((occ) => (
                  <button
                    key={`${occ.event.id}-${occ.occurrenceDate}`}
                    onClick={() => onEditEvent(occ.event)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: occ.event.colour || "#FF6B6B" }} />
                    <span className="text-xs font-medium text-gray-800 truncate flex-1">{occ.event.title}</span>
                    {!occ.event.allDay && (
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {format(occ.event.startDate.toDate(), "h:mm a")}
                      </span>
                    )}
                    {occ.event.allDay && <span className="text-[10px] text-gray-400 flex-shrink-0">All day</span>}
                  </button>
                ))}
                {meals.map((entry) => (
                  <div
                    key={`meal-${entry.mealId}-${entry.slot}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#F97316" }} />
                    <span className="text-xs font-medium text-gray-800 truncate flex-1">{entry.mealName}</span>
                    <span className="text-[10px] text-orange-400 flex-shrink-0">{entry.slot}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
