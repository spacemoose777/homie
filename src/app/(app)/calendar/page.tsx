"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { startOfWeek, format, startOfMonth, addWeeks } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToCalendarEvents,
  subscribeToMeals,
  subscribeToWeekPlan,
  addCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getHouseholdMembers,
} from "@/lib/firebase/firestore";
import type { CalendarEvent, MemberProfile, Meal, WeekPlan } from "@/types";
import {
  expandEventsForRange,
  getDatesWithEvents,
} from "@/lib/recurring";
import WeekStrip from "@/components/calendar/WeekStrip";
import ScheduleView from "@/components/calendar/ScheduleView";
import CalendarWeekView from "@/components/calendar/CalendarWeekView";
import MonthView from "@/components/calendar/MonthView";
import EventModal from "@/components/calendar/EventModal";
import { Plus } from "lucide-react";

type ViewMode = "schedule" | "week" | "month";

const SLOT_HOURS: Record<string, number> = { breakfast: 8, lunch: 12, snacks: 15, dinner: 18 };

export default function CalendarPage() {
  const { user, householdId } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weekPlans, setWeekPlans] = useState<Map<string, WeekPlan>>(new Map());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [monthRef, setMonthRef] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("schedule");
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

  useEffect(() => {
    if (!householdId) return;
    return subscribeToMeals(householdId, setMeals);
  }, [householdId]);

  // Subscribe to 8 weeks of meal plans starting from this week's Monday
  useEffect(() => {
    if (!householdId) return;
    const thisMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
    const unsubs = Array.from({ length: 8 }, (_, i) => {
      const weekDate = addWeeks(thisMonday, i);
      const weekStr = format(weekDate, "yyyy-MM-dd");
      return subscribeToWeekPlan(householdId, weekStr, (plan) => {
        setWeekPlans((prev) => {
          const next = new Map(prev);
          if (plan) next.set(weekStr, plan);
          else next.delete(weekStr);
          return next;
        });
      });
    });
    return () => unsubs.forEach((u) => u());
  }, [householdId]);

  // Expand events for a 3-month window
  const { occurrences, datesWithEvents } = useMemo(() => {
    const rangeStart = format(weekStart, "yyyy-MM-dd");
    const rangeEndDate = new Date(weekStart);
    rangeEndDate.setDate(rangeEndDate.getDate() + 90);
    const rangeEnd = format(rangeEndDate, "yyyy-MM-dd");
    const occ = expandEventsForRange(events, rangeStart, rangeEnd);
    const dates = getDatesWithEvents(occ);
    for (const wp of weekPlans.values()) {
      for (const [dateStr, dayPlan] of Object.entries(wp.days)) {
        if (Object.values(dayPlan).some((v) => v !== null)) dates.add(dateStr);
      }
    }
    return { occurrences: occ, datesWithEvents: dates };
  }, [events, weekStart, weekPlans]);

  // Meal entries grouped by date, across all subscribed weeks
  type MealEntry = { slot: string; mealId: string; mealName: string; hour: number };
  const mealsByDate = useMemo(() => {
    const result: Record<string, MealEntry[]> = {};
    const mealMap = new Map(meals.map((m) => [m.id, m]));
    for (const wp of weekPlans.values()) {
      for (const [dateStr, dayPlan] of Object.entries(wp.days)) {
        const entries = (Object.entries(dayPlan) as [string, string | null][])
          .filter(([, id]) => id !== null)
          .map(([slot, id]) => {
            const meal = mealMap.get(id!);
            return meal ? { slot, mealId: id!, mealName: meal.name, hour: SLOT_HOURS[slot] ?? 18 } : null;
          })
          .filter((e): e is MealEntry => e !== null)
          .sort((a, b) => a.hour - b.hour);
        if (entries.length > 0) result[dateStr] = entries;
      }
    }
    return result;
  }, [weekPlans, meals]);

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

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
    setMonthRef(date);
    // Switch to day/schedule detail when tapping a date in week or month view
    if (viewMode !== "schedule") setViewMode("schedule");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <button
          onClick={() => { setEditingEvent(null); setShowEventModal(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-sm font-medium"
          style={{ backgroundColor: "#FF6B6B" }}
        >
          <Plus size={14} />
          Event
        </button>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        {(["schedule", "week", "month"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              viewMode === mode
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Schedule view — vertical scroll through all days with events */}
      {viewMode === "schedule" && (
        <ScheduleView
          occurrences={occurrences}
          mealsByDate={mealsByDate}
          members={members}
          selectedDate={selectedDate}
          onEditEvent={handleEditEvent}
        />
      )}

      {/* Week view — 7-day row list */}
      {viewMode === "week" && (
        <>
          <div className="mb-4">
            <WeekStrip
              weekStart={weekStart}
              selectedDate={selectedDate}
              datesWithEvents={datesWithEvents}
              onSelectDate={handleSelectDate}
              onWeekChange={setWeekStart}
            />
          </div>
          <CalendarWeekView
            weekStart={weekStart}
            occurrences={occurrences}
            mealsByDate={mealsByDate}
            members={members}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onEditEvent={handleEditEvent}
          />
        </>
      )}

      {/* Month view */}
      {viewMode === "month" && (
        <MonthView
          referenceDate={monthRef}
          occurrences={occurrences}
          datesWithEvents={datesWithEvents}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          onMonthChange={setMonthRef}
        />
      )}

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
