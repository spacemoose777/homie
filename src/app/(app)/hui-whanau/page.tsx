"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Settings, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToMeetings,
  subscribeToHousehold,
  getHouseholdMembers,
  addMeeting,
  updateMeeting,
  deleteMeeting,
  updateMeetingStandingItems,
} from "@/lib/firebase/firestore";
import type { Meeting, Household, MemberProfile } from "@/types";
import MeetingModal from "@/components/hui-whanau/MeetingModal";
import StandingItemsModal from "@/components/hui-whanau/StandingItemsModal";

export default function HuiWhanauPage() {
  const { user, householdId } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [showStanding, setShowStanding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const standingItems = household?.meetingStandingItems ?? [];

  useEffect(() => {
    if (!householdId) return;
    return subscribeToMeetings(householdId, setMeetings);
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;
    return subscribeToHousehold(householdId, setHousehold);
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;
    getHouseholdMembers(householdId).then(setMembers);
  }, [householdId]);

  async function handleAddMeeting(data: {
    date: Timestamp;
    chairperson: string;
    otherItems: string[];
  }) {
    if (!householdId || !user) return;
    await addMeeting(householdId, data, user.uid);
    setShowNewMeeting(false);
  }

  async function handleUpdateMeeting(data: {
    date: Timestamp;
    chairperson: string;
    otherItems: string[];
  }) {
    if (!householdId || !editingMeeting) return;
    await updateMeeting(householdId, editingMeeting.id, data);
    setEditingMeeting(null);
  }

  async function handleDeleteMeeting() {
    if (!householdId || !editingMeeting) return;
    await deleteMeeting(householdId, editingMeeting.id);
    setEditingMeeting(null);
    setExpandedId(null);
  }

  async function handleSaveStanding(items: string[]) {
    if (!householdId) return;
    await updateMeetingStandingItems(householdId, items);
    setShowStanding(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hui Whānau</h1>
          <p className="text-sm text-gray-400 mt-0.5">Family meetings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStanding(true)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Manage standing agenda items"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => setShowNewMeeting(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            <Plus size={16} />
            New
          </button>
        </div>
      </div>

      {/* Meetings list */}
      {meetings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-base font-medium mb-1">No meetings yet</p>
          <p className="text-sm">Tap New to schedule your first Hui Whānau</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => {
            const isExpanded = expandedId === meeting.id;
            const dateLabel = format(meeting.date.toDate(), "EEEE, d MMMM yyyy");
            const totalItems = standingItems.length + meeting.otherItems.length;

            return (
              <div
                key={meeting.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : meeting.id)}
                  className="w-full text-left px-4 py-3.5 flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{dateLabel}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Chair: {meeting.chairperson || "—"} ·{" "}
                      {totalItems} agenda item{totalItems !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMeeting(meeting);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
                    >
                      Edit
                    </button>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded agenda */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50">
                    {standingItems.length > 0 && (
                      <div className="pt-3">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                          Standing items
                        </p>
                        <ul className="space-y-1.5">
                          {standingItems.map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
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
                    {meeting.otherItems.length > 0 && (
                      <div className="pt-3">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                          This meeting
                        </p>
                        <ul className="space-y-1.5">
                          {meeting.otherItems.map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {standingItems.length === 0 && meeting.otherItems.length === 0 && (
                      <p className="pt-3 text-sm text-gray-400">No agenda items added yet.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showNewMeeting && (
        <MeetingModal
          meeting={null}
          members={members}
          standingItems={standingItems}
          onSave={handleAddMeeting}
          onClose={() => setShowNewMeeting(false)}
        />
      )}

      {editingMeeting && (
        <MeetingModal
          meeting={editingMeeting}
          members={members}
          standingItems={standingItems}
          onSave={handleUpdateMeeting}
          onDelete={handleDeleteMeeting}
          onClose={() => setEditingMeeting(null)}
        />
      )}

      {showStanding && (
        <StandingItemsModal
          items={standingItems}
          onSave={handleSaveStanding}
          onClose={() => setShowStanding(false)}
        />
      )}
    </div>
  );
}
