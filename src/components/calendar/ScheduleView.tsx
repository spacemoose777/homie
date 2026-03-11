"use client";

import { useMemo, useEffect, useRef } from "react";
import { format, addDays, isSameDay, isToday } from "date-fns";
import type { CalendarEvent, MemberProfile } from "@/types";
import type { EventOccurrence } from "@/lib/recurring";

type MealEntry = { slot: string; mealId: string; mealName: string; hour: number };

const SLOT_LABEL: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", snacks: "Snacks", dinner: "Dinner" };

interface ScheduleViewProps {
  occurrences: EventOccurrence[];
  mealsByDate: Record<string, MealEntry[]>;
  members: MemberProfile[];
  selectedDate: Date;
  onEditEvent: (event: CalendarEvent) => void;
}

export default function ScheduleView({ occurrences, mealsByDate, members, selectedDate, onEditEvent }: ScheduleViewProps) {
  const memberMap = new Map(members.map((m) => [m.uid, m]));
  const todayRef = useRef<HTMLDivElement>(null);

  // Build a map of date → items (events + meals) sorted by time
  const days = useMemo(() => {
    const map = new Map<string, { events: EventOccurrence[]; meals: MealEntry[] }>();

    for (const occ of occurrences) {
      const d = occ.occurrenceDate;
      if (!map.has(d)) map.set(d, { events: [], meals: [] });
      map.get(d)!.events.push(occ);
    }
    for (const [dateStr, entries] of Object.entries(mealsByDate)) {
      if (!map.has(dateStr)) map.set(dateStr, { events: [], meals: [] });
      map.get(dateStr)!.meals.push(...entries);
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { events, meals }]) => ({ date, events, meals }));
  }, [occurrences, mealsByDate]);

  // Scroll today into view on mount
  useEffect(() => {
    todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-3xl mb-2">📅</p>
        <p className="text-sm text-gray-400">No upcoming events</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {days.map(({ date, events, meals }) => {
        const d = new Date(date + "T00:00:00");
        const todayDay = isToday(d);
        const selected = isSameDay(d, selectedDate);

        // Merge and sort timed items
        type Item =
          | { kind: "event"; occ: EventOccurrence; sortMs: number }
          | { kind: "meal"; entry: MealEntry; sortMs: number };

        const allDay = events.filter((o) => o.event.allDay);
        const timed: Item[] = [
          ...events.filter((o) => !o.event.allDay).map((occ) => ({
            kind: "event" as const,
            occ,
            sortMs: occ.event.startDate.toDate().getTime(),
          })),
          ...meals.map((entry) => ({ kind: "meal" as const, entry, sortMs: entry.hour * 3_600_000 })),
        ].sort((a, b) => a.sortMs - b.sortMs);

        return (
          <div key={date} ref={todayDay ? todayRef : undefined}>
            {/* Date header */}
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`flex flex-col items-center w-12 h-12 rounded-xl justify-center flex-shrink-0 ${
                  todayDay ? "text-white" : selected ? "bg-rose-50" : ""
                }`}
                style={todayDay ? { backgroundColor: "#FF6B6B" } : undefined}
              >
                <span className={`text-[10px] font-semibold uppercase ${todayDay ? "text-white/80" : "text-gray-400"}`}>
                  {format(d, "EEE")}
                </span>
                <span className={`text-lg font-bold leading-none ${todayDay ? "text-white" : "text-gray-900"}`}>
                  {format(d, "d")}
                </span>
              </div>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            {/* Events */}
            <div className="space-y-2 pl-2">
              {allDay.map((occ) => (
                <button
                  key={occ.event.id}
                  onClick={() => onEditEvent(occ.event)}
                  className="w-full flex items-start gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
                >
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: occ.event.colour || "#FF6B6B" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{occ.event.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">All day</p>
                  </div>
                  {occ.event.recurring && <span className="text-xs text-gray-300">↻</span>}
                </button>
              ))}

              {timed.map((item, i) => {
                if (item.kind === "meal") {
                  const { entry } = item;
                  return (
                    <div
                      key={`meal-${entry.mealId}-${entry.slot}`}
                      className="flex items-start gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-100"
                    >
                      <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: "#F97316" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{entry.mealName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {SLOT_LABEL[entry.slot] ?? entry.slot} · {entry.hour < 12 ? `${entry.hour}:00 AM` : entry.hour === 12 ? "12:00 PM" : `${entry.hour - 12}:00 PM`}
                        </p>
                      </div>
                    </div>
                  );
                }
                const { occ } = item;
                const { event } = occ;
                const eventMembers = event.members.map((uid) => memberMap.get(uid)).filter(Boolean) as MemberProfile[];
                return (
                  <button
                    key={`${event.id}-${occ.occurrenceDate}-${i}`}
                    onClick={() => onEditEvent(event)}
                    className="w-full flex items-start gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
                  >
                    <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: event.colour || "#FF6B6B" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(event.startDate.toDate(), "h:mm a")} – {format(event.endDate.toDate(), "h:mm a")}
                      </p>
                      {event.description && <p className="text-xs text-gray-400 mt-1 truncate">{event.description}</p>}
                      {eventMembers.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          {eventMembers.map((m) => (
                            <div key={m.uid} className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold" style={{ backgroundColor: m.colour }}>
                              {m.name[0].toUpperCase()}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {event.recurring && <span className="text-xs text-gray-300 flex-shrink-0">↻</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
