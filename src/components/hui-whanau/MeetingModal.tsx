"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import type { Meeting, MemberProfile } from "@/types";

interface MeetingModalProps {
  meeting: Meeting | null;
  members: MemberProfile[];
  standingItems: string[];
  onSave: (data: { date: Timestamp; chairperson: string; otherItems: string[] }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function MeetingModal({
  meeting,
  members,
  standingItems,
  onSave,
  onDelete,
  onClose,
}: MeetingModalProps) {
  const [date, setDate] = useState<string>(
    meeting ? format(meeting.date.toDate(), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [chairperson, setChairperson] = useState(meeting?.chairperson ?? "");
  const [customChair, setCustomChair] = useState("");
  const [otherItems, setOtherItems] = useState<string[]>(meeting?.otherItems ?? []);
  const [newItem, setNewItem] = useState("");

  function addItem() {
    const t = newItem.trim();
    if (!t) return;
    setOtherItems([...otherItems, t]);
    setNewItem("");
  }

  function removeItem(i: number) {
    setOtherItems(otherItems.filter((_, idx) => idx !== i));
  }

  function setCustomChairperson() {
    const t = customChair.trim();
    if (!t) return;
    setChairperson(t);
    setCustomChair("");
  }

  function handleSave() {
    const [y, m, d] = date.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);
    onSave({ date: Timestamp.fromDate(dateObj), chairperson: chairperson.trim(), otherItems });
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl shadow-xl w-full max-w-md overflow-y-auto"
        style={{ maxHeight: "90vh", paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            {meeting ? "Edit Meeting" : "New Meeting"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pt-5 space-y-5">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            />
          </div>

          {/* Chairperson */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Chairperson</label>
            {members.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {members.map((m) => {
                  const active = chairperson === m.name;
                  return (
                    <button
                      key={m.uid}
                      onClick={() => setChairperson(active ? "" : m.name)}
                      className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
                      style={
                        active
                          ? { backgroundColor: "#FF6B6B", borderColor: "#FF6B6B", color: "#fff" }
                          : { borderColor: "#e5e7eb", color: "#374151" }
                      }
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={customChair}
                onChange={(e) => setCustomChair(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setCustomChairperson()}
                placeholder="Someone else…"
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
              />
              <button
                onClick={setCustomChairperson}
                disabled={!customChair.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Set
              </button>
            </div>
            {chairperson && (
              <p className="mt-2 text-sm text-gray-500">
                Chair: <span className="font-medium text-gray-700">{chairperson}</span>
              </p>
            )}
          </div>

          {/* Standing items preview */}
          {standingItems.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Standing items
              </label>
              <ul className="space-y-1.5">
                {standingItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: "#FF6B6B" }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Other items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Other agenda items
            </label>
            {otherItems.length > 0 && (
              <ul className="space-y-1.5 mb-3">
                {otherItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="flex-1 text-sm text-gray-700">{item}</span>
                    <button
                      onClick={() => removeItem(i)}
                      className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                placeholder="Add an item…"
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
              />
              <button
                onClick={addItem}
                disabled={!newItem.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pt-6 flex gap-3">
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 border border-red-200 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!chairperson.trim() || !date}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            {meeting ? "Save changes" : "Create meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}
