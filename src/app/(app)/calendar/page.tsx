"use client";

import { useEffect, useState, useMemo } from "react";
import { startOfWeek, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToCalendarEvents,
  addCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getHouseholdMembers,
} from "@/lib/firebase/firestore";
import type { CalendarEvent, MemberProfile } from "@/types";
import {
  expandEventsForRange,
  getOccurrencesForDay,
  getDatesWithEvents,
} from "@/lib/recurring";
import WeekStrip from "@/components/calendar/WeekStrip";
import DayEventList from "@/components/calendar/DayEventList";
import EventModal from "@/components/calendar/EventModal";

export default function CalendarPage() {
  const { user, householdId } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    if (!householdId) return;
    const unsub = subscribeToCalendarEvents(householdId, setEvents);
    return () => unsub();
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;
    getHouseholdMembers(householdId).then(setMembers);
  }, [householdId]);

  // Expand events for a 3-month window around the current week
  const { occurrences, datesWithEvents } = useMemo(() => {
    const rangeStart = format(weekStart, "yyyy-MM-dd");
    // Expand 90 days forward
    const rangeEndDate = new Date(weekStart);
    rangeEndDate.setDate(rangeEndDate.getDate() + 90);
    const rangeEnd = format(rangeEndDate, "yyyy-MM-dd");
    const occ = expandEventsForRange(events, rangeStart, rangeEnd);
    return { occurrences: occ, datesWithEvents: getDatesWithEvents(occ) };
  }, [events, weekStart]);

  const dayOccurrences = useMemo(
    () => getOccurrencesForDay(occurrences, format(selectedDate, "yyyy-MM-dd")),
    [occurrences, selectedDate]
  );

  async function handleSaveEvent(
    data: Omit<CalendarEvent, "id" | "createdAt" | "createdBy" | "sourceType" | "googleEventId">
  ) {
    if (!householdId || !user) return;
    if (editingEvent) {
      await updateCalendarEvent(householdId, editingEvent.id, data);
    } else {
      await addCalendarEvent(householdId, {
        ...data,
        createdBy: user.uid,
        sourceType: "manual",
        googleEventId: null,
      });
    }
    setEditingEvent(null);
    setShowEventModal(false);
  }

  async function handleDeleteEvent() {
    if (!householdId || !editingEvent) return;
    await deleteCalendarEvent(householdId, editingEvent.id);
    setEditingEvent(null);
    setShowEventModal(false);
  }

  function handleEditEvent(event: CalendarEvent) {
    setEditingEvent(event);
    setShowEventModal(true);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Calendar</h1>

      {/* Week strip */}
      <div className="mb-6">
        <WeekStrip
          weekStart={weekStart}
          selectedDate={selectedDate}
          datesWithEvents={datesWithEvents}
          onSelectDate={setSelectedDate}
          onWeekChange={setWeekStart}
        />
      </div>

      {/* Day events */}
      <DayEventList
        occurrences={dayOccurrences}
        members={members}
        selectedDate={selectedDate}
        onAddEvent={() => { setEditingEvent(null); setShowEventModal(true); }}
        onEditEvent={handleEditEvent}
      />

      {/* Event modal */}
      {showEventModal && (
        <EventModal
          event={editingEvent}
          selectedDate={selectedDate}
          members={members}
          onSave={handleSaveEvent}
          onDelete={editingEvent ? handleDeleteEvent : undefined}
          onClose={() => { setShowEventModal(false); setEditingEvent(null); }}
        />
      )}
    </div>
  );
}
