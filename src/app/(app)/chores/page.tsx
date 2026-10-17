"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import { Settings2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToChoreLists,
  ensureChoreWeek,
  subscribeToChoreWeek,
  updateChoreWeekRooms,
  submitChoreWeek,
} from "@/lib/firebase/firestore";
import { getCurrentWeekBounds, formatWeekRange } from "@/lib/chores/week";
import type { ChoreList, ChoreWeek } from "@/types";
import ChoreRoomSection from "@/components/chores/ChoreRoomSection";

const STATUS_LABEL: Record<ChoreWeek["status"], string> = {
  in_progress: "In progress",
  submitted: "Submitted — waiting for review",
  approved: "Approved",
  redo: "Sent back — check the note",
};

export default function ChoresPage() {
  const { user, householdId, memberProfile } = useAuth();
  const [lists, setLists] = useState<ChoreList[]>([]);
  const [weeks, setWeeks] = useState<Record<string, ChoreWeek | null>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const isAdmin = memberProfile?.role === "admin";
  const { weekStart, weekEnd } = useMemo(() => getCurrentWeekBounds(), []);

  useEffect(() => {
    if (!householdId) return;
    return subscribeToChoreLists(householdId, setLists);
  }, [householdId]);

  // Lists visible here: your own (if you're the assignee), or — for a
  // parent — every active checklist in the household, so a parent can peek
  // at progress without needing the manage screen.
  const visibleLists = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return lists;
    return lists.filter((l) => l.assigneeUid === user.uid);
  }, [lists, isAdmin, user]);

  // Make sure each visible list's current week exists (no scheduled job
  // rolls weeks over — whoever opens Chores first that week starts it), then
  // subscribe to it.
  useEffect(() => {
    if (!householdId) return;
    const unsubs = visibleLists.map((list) => {
      ensureChoreWeek(householdId, list, weekStart, weekEnd).catch((err) =>
        console.error("Failed to start this week's checklist", err)
      );
      return subscribeToChoreWeek(householdId, list.id, weekStart, (week) => {
        setWeeks((prev) => ({ ...prev, [list.id]: week }));
      });
    });
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId, visibleLists, weekStart, weekEnd]);

  async function handleToggleTask(list: ChoreList, taskId: string) {
    if (!householdId) return;
    const week = weeks[list.id];
    if (!week) return;
    const rooms = week.rooms.map((room) => ({
      ...room,
      tasks: room.tasks.map((task) =>
        task.id === taskId
          ? { ...task, done: !task.done, doneAt: !task.done ? Timestamp.now() : null }
          : task
      ),
    }));
    await updateChoreWeekRooms(householdId, list.id, week.id, rooms);
  }

  async function handleSubmit(list: ChoreList) {
    if (!householdId) return;
    const week = weeks[list.id];
    if (!week) return;

    const totalTasks = week.rooms.reduce((n, r) => n + r.tasks.length, 0);
    const doneTasks = week.rooms.reduce((n, r) => n + r.tasks.filter((t) => t.done).length, 0);
    if (doneTasks < totalTasks) {
      const ok = confirm(
        `${totalTasks - doneTasks} task${totalTasks - doneTasks === 1 ? "" : "s"} still aren't ticked off — submit anyway?`
      );
      if (!ok) return;
    }

    setSubmitting(list.id);
    try {
      await submitChoreWeek(householdId, list.id, week.id);
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chores</h1>
          <p className="text-sm text-gray-400 mt-0.5">{formatWeekRange(weekStart, weekEnd)}</p>
        </div>
        {isAdmin && (
          <Link
            href="/chores/manage"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Settings2 size={14} />
            Manage
          </Link>
        )}
      </div>

      {visibleLists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-5xl mb-4">🧹</p>
          <p className="text-gray-500 font-medium mb-1">No checklist yet</p>
          {isAdmin ? (
            <>
              <p className="text-sm text-gray-400 mb-4">Set one up so chores can start tracking here</p>
              <Link
                href="/chores/manage"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-white font-medium"
                style={{ backgroundColor: "#FF6B6B" }}
              >
                <Settings2 size={14} />
                Set up a checklist
              </Link>
            </>
          ) : (
            <p className="text-sm text-gray-400">Ask a parent to set one up in Settings</p>
          )}
        </div>
      )}

      <div className="space-y-6">
        {visibleLists.map((list) => {
          const week = weeks[list.id];
          const totalTasks = week ? week.rooms.reduce((n, r) => n + r.tasks.length, 0) : 0;
          const doneTasks = week
            ? week.rooms.reduce((n, r) => n + r.tasks.filter((t) => t.done).length, 0)
            : 0;
          const canEdit = !week || week.status === "in_progress" || week.status === "redo";

          return (
            <div key={list.id}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">{list.name}</h2>
                {week && week.status !== "in_progress" && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: week.status === "approved" ? "#f0fdf4" : "#fff7ed",
                      color: week.status === "approved" ? "#22c55e" : "#f97316",
                    }}
                  >
                    {week.status === "approved" && <CheckCircle2 size={12} />}
                    {STATUS_LABEL[week.status]}
                  </span>
                )}
              </div>

              {week?.parentNote && (
                <div className="mb-3 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-700">
                  {week.parentNote}
                </div>
              )}

              {!week ? (
                <p className="text-sm text-gray-400 px-1">Starting this week's checklist…</p>
              ) : (
                <div className="space-y-3">
                  {week.rooms.map((room) => (
                    <ChoreRoomSection
                      key={room.id}
                      room={room}
                      disabled={!canEdit}
                      onToggleTask={(taskId) => handleToggleTask(list, taskId)}
                    />
                  ))}

                  {canEdit && (
                    <button
                      onClick={() => handleSubmit(list)}
                      disabled={submitting === list.id || week.status === "submitted"}
                      className="w-full py-3 rounded-2xl text-white font-medium disabled:opacity-50"
                      style={{ backgroundColor: "#FF6B6B" }}
                    >
                      {week.status === "submitted"
                        ? "Submitted — waiting for review"
                        : submitting === list.id
                          ? "Submitting…"
                          : `Submit (${doneTasks}/${totalTasks} done)`}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
