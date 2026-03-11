"use client";

import { format, addDays, isSameDay, isToday } from "date-fns";
import type { CalendarEvent, MemberProfile } from "@/types";
import type { EventOccurrence } from "@/lib/recurring";

type MealEntry = { slot: string; mealId: string; mealName: string; hour: number };

interface CalendarWeekViewProps {
  weekStart: Date;
  occurrences: EventOccurrence[];
  mealsByDate: Record<string, MealEntry[]>;
  members: MemberProfile[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

export default function CalendarWeekView({
  weekStart,
  occurrences,
  mealsByDate,
  members,
  selectedDate,
  onSelectDate,
  onEditEvent,
}: CalendarWeekViewProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {days.map((day, idx) => {
        const isoDate = format(day, "yyyy-MM-dd");
        const todayDay = isToday(day);
        const selected = isSameDay(day, selectedDate);
        const dayEvents = occurrences.filter((o) => o.occurrenceDate === isoDate);
        const dayMeals = mealsByDate[isoDate] ?? [];
        const isLast = idx === 6;

        return (
          <div
            key={isoDate}
            className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${
              isLast ? "" : "border-b border-gray-50"
            } ${selected ? "bg-rose-50" : "hover:bg-gray-50"}`}
            onClick={() => onSelectDate(day)}
          >
            {/* Day label */}
            <div className="w-14 flex-shrink-0">
              <p className="text-xs font-medium text-gray-400 uppercase">{format(day, "EEE")}</p>
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mt-0.5 ${
                  todayDay ? "text-white" : selected ? "text-rose-600" : "text-gray-900"
                }`}
                style={todayDay ? { backgroundColor: "#FF6B6B" } : undefined}
              >
                {format(day, "d")}
              </span>
            </div>

            {/* Event chips */}
            <div className="flex-1 flex flex-wrap gap-1 min-w-0">
              {dayEvents.length === 0 && dayMeals.length === 0 && (
                <span className="text-xs text-gray-200">—</span>
              )}
              {dayEvents.slice(0, 3).map((occ) => (
                <button
                  key={occ.event.id}
                  onClick={(e) => { e.stopPropagation(); onEditEvent(occ.event); }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium truncate max-w-[140px]"
                  style={{
                    backgroundColor: (occ.event.colour || "#FF6B6B") + "22",
                    color: occ.event.colour || "#FF6B6B",
                  }}
                >
                  {occ.event.title}
                </button>
              ))}
              {dayMeals.map((entry) => (
                <span
                  key={`${entry.mealId}-${entry.slot}`}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-orange-600 bg-orange-50"
                >
                  {entry.mealName}
                </span>
              ))}
              {dayEvents.length > 3 && (
                <span className="text-[11px] text-gray-400 self-center">
                  +{dayEvents.length - 3}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
