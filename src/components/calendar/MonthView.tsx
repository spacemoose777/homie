"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import type { CalendarEvent } from "@/types";
import type { EventOccurrence } from "@/lib/recurring";

interface MonthViewProps {
  referenceDate: Date;
  occurrences: EventOccurrence[];
  datesWithEvents: Set<string>;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

export default function MonthView({
  referenceDate,
  occurrences,
  datesWithEvents,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: MonthViewProps) {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  // Build 6×7 grid
  const cells: Date[] = [];
  let cursor = gridStart;
  while (cells.length < 42) {
    cells.push(cursor);
    cursor = addDays(cursor, 1);
    if (cursor > monthEnd && cells.length % 7 === 0 && cells.length >= 28) break;
  }
  // Pad to complete row
  while (cells.length % 7 !== 0) { cells.push(cursor); cursor = addDays(cursor, 1); }

  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function getEventsForDay(date: Date): EventOccurrence[] {
    const iso = format(date, "yyyy-MM-dd");
    return occurrences.filter((o) => o.occurrenceDate === iso);
  }

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onMonthChange(subMonths(referenceDate, 1))}
          className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-semibold text-gray-900">{format(referenceDate, "MMMM yyyy")}</p>
        <button
          onClick={() => onMonthChange(addMonths(referenceDate, 1))}
          className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAY_LABELS.map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold text-gray-400 uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7">
          {cells.map((date, idx) => {
            const iso = format(date, "yyyy-MM-dd");
            const inMonth = isSameMonth(date, referenceDate);
            const todayDay = isToday(date);
            const selected = isSameDay(date, selectedDate);
            const dayEvents = getEventsForDay(date);
            const hasMore = dayEvents.length > 2;

            return (
              <button
                key={iso}
                onClick={() => onSelectDate(date)}
                className={`relative min-h-[64px] p-1 text-left border-b border-r border-gray-50 transition-colors ${
                  selected ? "bg-rose-50" : "hover:bg-gray-50"
                } ${idx % 7 === 6 ? "border-r-0" : ""}`}
              >
                {/* Day number */}
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mb-1 ${
                    todayDay
                      ? "text-white"
                      : inMonth
                      ? "text-gray-900"
                      : "text-gray-300"
                  }`}
                  style={todayDay ? { backgroundColor: "#FF6B6B" } : undefined}
                >
                  {format(date, "d")}
                </span>

                {/* Event chips */}
                {dayEvents.slice(0, 2).map((occ) => (
                  <div
                    key={occ.event.id}
                    className="truncate text-[10px] px-1 py-0.5 rounded font-medium mb-0.5 leading-tight"
                    style={{
                      backgroundColor: (occ.event.colour || "#FF6B6B") + "22",
                      color: occ.event.colour || "#FF6B6B",
                    }}
                  >
                    {occ.event.title}
                  </div>
                ))}
                {hasMore && (
                  <div className="text-[10px] text-gray-400 px-1">+{dayEvents.length - 2} more</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
