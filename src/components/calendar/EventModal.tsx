"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import type { CalendarEvent, MemberProfile, RecurringRule } from "@/types";

interface EventModalProps {
  event: CalendarEvent | null;
  selectedDate: Date;
  members: MemberProfile[];
  onSave: (
    data: Omit<CalendarEvent, "id" | "createdAt" | "createdBy" | "sourceType" | "googleEventId">
  ) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const EVENT_COLOURS = [
  "#FF6B6B", "#FF9F43", "#FFD93D", "#6BCB77", "#4D96FF",
  "#6366f1", "#EC4899", "#8B5CF6", "#14B8A6", "#F97316",
];

export default function EventModal({
  event,
  selectedDate,
  members,
  onSave,
  onDelete,
  onClose,
}: EventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [startDateStr, setStartDateStr] = useState(format(selectedDate, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endDateStr, setEndDateStr] = useState(format(selectedDate, "yyyy-MM-dd"));
  const [endTime, setEndTime] = useState("10:00");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [colour, setColour] = useState("#FF6B6B");
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringRule["frequency"]>("weekly");
  const [intervalVal, setIntervalVal] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description ?? "");
      setAllDay(event.allDay);
      const start = event.startDate.toDate();
      const end = event.endDate.toDate();
      setStartDateStr(format(start, "yyyy-MM-dd"));
      setStartTime(format(start, "HH:mm"));
      setEndDateStr(format(end, "yyyy-MM-dd"));
      setEndTime(format(end, "HH:mm"));
      setSelectedMembers(event.members);
      setColour(event.colour || "#FF6B6B");
      if (event.recurring) {
        setRecurring(true);
        setFrequency(event.recurring.frequency);
        setIntervalVal(event.recurring.interval);
      }
    } else {
      setStartDateStr(format(selectedDate, "yyyy-MM-dd"));
      setEndDateStr(format(selectedDate, "yyyy-MM-dd"));
    }
  }, [event, selectedDate]);

  function toggleMember(uid: string) {
    setSelectedMembers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  }

  function buildTimestamp(dateStr: string, timeStr: string): Timestamp {
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = timeStr.split(":").map(Number);
    return Timestamp.fromDate(new Date(year, month - 1, day, hour, minute));
  }

  function buildAllDayTimestamp(dateStr: string, isEnd: boolean): Timestamp {
    const [year, month, day] = dateStr.split("-").map(Number);
    return Timestamp.fromDate(
      new Date(year, month - 1, day, isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0)
    );
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);

    const startDate = allDay
      ? buildAllDayTimestamp(startDateStr, false)
      : buildTimestamp(startDateStr, startTime);
    const endDate = allDay
      ? buildAllDayTimestamp(endDateStr, true)
      : buildTimestamp(endDateStr, endTime);

    onSave({
      title: title.trim(),
      description: description.trim() || null,
      startDate,
      endDate,
      allDay,
      members: selectedMembers,
      colour,
      recurring: recurring ? { frequency, interval: intervalVal, endDate: null } : null,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {event ? "Edit Event" : "New Event"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              autoFocus
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors resize-none"
              style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            />
          </div>

          {/* All day toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-gray-700">All day</span>
            <div
              onClick={() => setAllDay(!allDay)}
              className="relative w-11 h-6 rounded-full transition-colors cursor-pointer"
              style={{ backgroundColor: allDay ? "#FF6B6B" : "#d1d5db" }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                style={{ transform: allDay ? "translateX(1.25rem)" : "translateX(0.125rem)" }}
              />
            </div>
          </label>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
              <input
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
              />
              {!allDay && (
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full mt-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
                  style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
              <input
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
              />
              {!allDay && (
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full mt-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
                  style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
                />
              )}
            </div>
          </div>

          {/* Members */}
          {members.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Members</label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const selected = selectedMembers.includes(m.uid);
                  return (
                    <button
                      key={m.uid}
                      onClick={() => toggleMember(m.uid)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                      style={{
                        borderColor: selected ? m.colour : "#e5e7eb",
                        backgroundColor: selected ? m.colour + "20" : "transparent",
                        color: selected ? m.colour : "#6b7280",
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                        style={{ backgroundColor: m.colour }}
                      >
                        {m.name[0]}
                      </div>
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Colour */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Colour</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_COLOURS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColour(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: colour === c ? "#1a1a2e" : "transparent",
                    transform: colour === c ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Recurring */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-gray-700">Repeat</span>
            <div
              onClick={() => setRecurring(!recurring)}
              className="relative w-11 h-6 rounded-full transition-colors cursor-pointer"
              style={{ backgroundColor: recurring ? "#FF6B6B" : "#d1d5db" }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                style={{ transform: recurring ? "translateX(1.25rem)" : "translateX(0.125rem)" }}
              />
            </div>
          </label>

          {recurring && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RecurringRule["frequency"])}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Every</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={intervalVal}
                  onChange={(e) => setIntervalVal(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          {event && onDelete && (
            <button
              onClick={() => { onDelete(); onClose(); }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 border border-red-100 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            {saving ? "Saving…" : event ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
