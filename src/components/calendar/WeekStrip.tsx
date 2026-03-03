"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";

interface WeekStripProps {
  weekStart: Date;
  selectedDate: Date;
  datesWithEvents: Set<string>;
  onSelectDate: (date: Date) => void;
  onWeekChange: (date: Date) => void;
}

export default function WeekStrip({
  weekStart,
  selectedDate,
  datesWithEvents,
  onSelectDate,
  onWeekChange,
}: WeekStripProps) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-2 py-3">
      {/* Month + nav */}
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          onClick={() => onWeekChange(subWeeks(weekStart, 1))}
          className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-semibold text-gray-700 text-sm">
          {format(weekStart, "MMMM yyyy")}
        </p>
        <button
          onClick={() => onWeekChange(addWeeks(weekStart, 1))}
          className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day columns — use min-w-0 + equal-width flex to avoid overflow */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const isoDate = format(day, "yyyy-MM-dd");
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const hasEvents = datesWithEvents.has(isoDate);

          return (
            <button
              key={isoDate}
              onClick={() => onSelectDate(day)}
              className="flex flex-col items-center gap-0.5 py-2 rounded-xl transition-colors min-w-0"
              style={{
                backgroundColor: isSelected ? "#FF6B6B" : isToday ? "#FFF0F0" : "transparent",
              }}
            >
              <span
                className="text-[10px] font-medium uppercase"
                style={{ color: isSelected ? "white" : "#9ca3af" }}
              >
                {format(day, "EEE")}
              </span>
              <span
                className="text-sm font-semibold"
                style={{
                  color: isSelected ? "white" : isToday ? "#FF6B6B" : "#1a1a2e",
                }}
              >
                {format(day, "d")}
              </span>
              {/* Event dot */}
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: hasEvents
                    ? isSelected
                      ? "white"
                      : "#FF6B6B"
                    : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
