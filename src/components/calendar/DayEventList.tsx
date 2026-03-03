"use client";

import { format } from "date-fns";
import { Plus, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import type { CalendarEvent, MemberProfile } from "@/types";
import type { EventOccurrence } from "@/lib/recurring";

type MealEntry = { slot: string; mealId: string; mealName: string; hour: number };

const SLOT_LABEL: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", snacks: "Snacks", dinner: "Dinner" };

interface DayEventListProps {
  occurrences: EventOccurrence[];
  mealEntries?: MealEntry[];
  members: MemberProfile[];
  selectedDate: Date;
  onAddEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
}

export default function DayEventList({
  occurrences,
  mealEntries = [],
  members,
  selectedDate,
  onAddEvent,
  onEditEvent,
}: DayEventListProps) {
  const memberMap = new Map(members.map((m) => [m.uid, m]));

  // Merge timed calendar events + meal entries, sorted by time
  const allDayOccs = occurrences.filter((occ) => occ.event.allDay);
  type TimedItem =
    | { kind: "event"; occ: EventOccurrence; sortMs: number }
    | { kind: "meal"; entry: MealEntry; sortMs: number };

  const timedItems: TimedItem[] = [
    ...occurrences
      .filter((occ) => !occ.event.allDay)
      .map((occ) => ({ kind: "event" as const, occ, sortMs: occ.event.startDate.toDate().getTime() })),
    ...mealEntries.map((entry) => ({ kind: "meal" as const, entry, sortMs: entry.hour * 3600000 })),
  ].sort((a, b) => a.sortMs - b.sortMs);

  const isEmpty = allDayOccs.length === 0 && timedItems.length === 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900">
          {format(selectedDate, "EEEE, d MMMM")}
        </h2>
        <button
          onClick={onAddEvent}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-sm font-medium"
          style={{ backgroundColor: "#FF6B6B" }}
        >
          <Plus size={14} />
          Event
        </button>
      </div>

      {/* Events */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-3xl mb-2">📅</p>
          <p className="text-sm text-gray-400">Nothing on this day</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* All-day events */}
          {allDayOccs.map((occ) => {
            const { event } = occ;
            return (
              <button
                key={`${event.id}-${occ.occurrenceDate}`}
                onClick={() => onEditEvent(event)}
                className="w-full flex items-start gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
              >
                <div className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: event.colour || "#FF6B6B" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">All day</p>
                </div>
                {event.recurring && <span className="text-xs text-gray-300 flex-shrink-0">↻</span>}
              </button>
            );
          })}

          {/* Timed events + meals interleaved */}
          {timedItems.map((item, i) => {
            if (item.kind === "meal") {
              const { entry } = item;
              return (
                <Link
                  key={`meal-${entry.mealId}-${entry.slot}`}
                  href="/meals"
                  className="w-full flex items-start gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
                >
                  <div className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: "#F97316" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{entry.mealName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {SLOT_LABEL[entry.slot] ?? entry.slot} · {entry.hour < 12 ? `${entry.hour}:00 AM` : entry.hour === 12 ? "12:00 PM" : `${entry.hour - 12}:00 PM`}
                    </p>
                  </div>
                  <UtensilsCrossed size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
                </Link>
              );
            }

            const { occ } = item;
            const { event } = occ;
            const eventMembers = event.members.map((uid) => memberMap.get(uid)).filter(Boolean) as MemberProfile[];
            return (
              <button
                key={`${event.id}-${occ.occurrenceDate}`}
                onClick={() => onEditEvent(event)}
                className="w-full flex items-start gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
              >
                <div className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: event.colour || "#FF6B6B" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(event.startDate.toDate(), "h:mm a")} – {format(event.endDate.toDate(), "h:mm a")}
                  </p>
                  {event.description && <p className="text-xs text-gray-400 mt-1 truncate">{event.description}</p>}
                  {eventMembers.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      {eventMembers.map((m) => (
                        <div key={m.uid} className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold" style={{ backgroundColor: m.colour }} title={m.name}>
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
      )}
    </div>
  );
}
