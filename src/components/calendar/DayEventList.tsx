"use client";

import { format } from "date-fns";
import { Plus } from "lucide-react";
import type { CalendarEvent, MemberProfile } from "@/types";
import type { EventOccurrence } from "@/lib/recurring";

interface DayEventListProps {
  occurrences: EventOccurrence[];
  members: MemberProfile[];
  selectedDate: Date;
  onAddEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
}

export default function DayEventList({
  occurrences,
  members,
  selectedDate,
  onAddEvent,
  onEditEvent,
}: DayEventListProps) {
  const memberMap = new Map(members.map((m) => [m.uid, m]));

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
      {occurrences.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-3xl mb-2">📅</p>
          <p className="text-sm text-gray-400">Nothing on this day</p>
        </div>
      ) : (
        <div className="space-y-2">
          {occurrences.map((occ) => {
            const { event } = occ;
            const eventMembers = event.members
              .map((uid) => memberMap.get(uid))
              .filter(Boolean) as MemberProfile[];

            return (
              <button
                key={`${event.id}-${occ.occurrenceDate}`}
                onClick={() => onEditEvent(event)}
                className="w-full flex items-start gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
              >
                {/* Colour stripe */}
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: event.colour || "#FF6B6B" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  {event.allDay ? (
                    <p className="text-xs text-gray-400 mt-0.5">All day</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(event.startDate.toDate(), "h:mm a")}
                      {" – "}
                      {format(event.endDate.toDate(), "h:mm a")}
                    </p>
                  )}
                  {event.description && (
                    <p className="text-xs text-gray-400 mt-1 truncate">{event.description}</p>
                  )}
                  {eventMembers.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      {eventMembers.map((m) => (
                        <div
                          key={m.uid}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold"
                          style={{ backgroundColor: m.colour }}
                          title={m.name}
                        >
                          {m.name[0].toUpperCase()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {event.recurring && (
                  <span className="text-xs text-gray-300 flex-shrink-0">↻</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
