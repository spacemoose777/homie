"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import { Settings2, CheckCircle2, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToChoreLists,
  ensureChoreWeek,
  subscribeToChoreWeek,
  updateChoreWeekRooms,
  submitChoreWeek,
  subscribeToChoreJobs,
  createChoreJob,
  markChoreJobDone,
  getHouseholdMembers,
} from "@/lib/firebase/firestore";
import { getCurrentWeekBounds, formatWeekRange } from "@/lib/chores/week";
import { notify } from "@/lib/notifications/notify";
import { registerFCMToken } from "@/lib/notifications/fcm-token";
import type { ChoreList, ChoreWeek, ChoreJob, MemberProfile } from "@/types";
import ChoreRoomSection from "@/components/chores/ChoreRoomSection";
import BalanceCard from "@/components/chores/BalanceCard";
import JobCard from "@/components/chores/JobCard";
import NewJobModal from "@/components/chores/NewJobModal";

const STATUS_LABEL: Record<ChoreWeek["status"], string> = {
  in_progress: "In progress",
  submitted: "Submitted — waiting for review",
  approved: "Approved",
  redo: "Sent back — check the note",
};

// All redoNotes created in the same send-back action share the exact same
// `at` timestamp (the modal that creates them only calls Timestamp.now()
// once per action) — so the most recent batch is just "every note with the
// latest `at`".
function latestRedoNotes(week: ChoreWeek) {
  if (week.redoNotes.length === 0) return [];
  const latestMillis = Math.max(...week.redoNotes.map((n) => n.at.toMillis()));
  return week.redoNotes.filter((n) => n.at.toMillis() === latestMillis);
}

function findTaskLabel(week: ChoreWeek, taskId: string): string | undefined {
  for (const room of week.rooms) {
    const task = room.tasks.find((t) => t.id === taskId);
    if (task) return task.label;
  }
  return undefined;
}

// Offer push notifications right after a real success moment (submitting a
// week for the first time), not on page load — and only once, ever, so it
// never nags. Declining here just means nothing happens; it's still always
// reachable from Settings > Notifications.
function maybeOfferNotifications(uid: string | undefined) {
  if (!uid || typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "default") return;
  const key = "homie-notif-offered";
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, "1");

  if (confirm("Want a notification when this gets reviewed, or when there's a new paid job?")) {
    registerFCMToken(uid).catch(() => {});
  }
}

export default function ChoresPage() {
  const { user, householdId, memberProfile } = useAuth();
  const [lists, setLists] = useState<ChoreList[]>([]);
  const [weeks, setWeeks] = useState<Record<string, ChoreWeek | null>>({});
  const [jobs, setJobs] = useState<ChoreJob[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [showNewJob, setShowNewJob] = useState(false);

  const isAdmin = memberProfile?.role === "admin";
  const { weekStart, weekEnd } = useMemo(() => getCurrentWeekBounds(), []);

  useEffect(() => {
    if (!householdId) return;
    return subscribeToChoreLists(householdId, setLists);
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;
    return subscribeToChoreJobs(householdId, setJobs);
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;
    getHouseholdMembers(householdId).then(setMembers);
  }, [householdId]);

  // Lists visible here: your own (if you're the assignee), or — for a
  // parent — every active checklist in the household, so a parent can peek
  // at progress without needing the manage screen.
  const visibleLists = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return lists;
    return lists.filter((l) => l.assigneeUid === user.uid);
  }, [lists, isAdmin, user]);

  const visibleJobs = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return jobs;
    return jobs.filter((j) => j.assigneeUid === user.uid);
  }, [jobs, isAdmin, user]);

  // Balance cards: everyone sees their own; a parent also sees every child's.
  const balanceUids = useMemo(() => {
    if (!user) return [];
    if (!isAdmin) return [user.uid];
    return members.filter((m) => m.role === "child").map((m) => m.uid);
  }, [members, isAdmin, user]);

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
      notify({ type: "week_submitted", listId: list.id, weekId: week.id });
      maybeOfferNotifications(user?.uid);
    } finally {
      setSubmitting(null);
    }
  }

  async function handleMarkJobDone(jobId: string) {
    if (!householdId) return;
    await markChoreJobDone(householdId, jobId);
    notify({ type: "job_done", jobId });
  }

  async function handleCreateJob(job: {
    title: string;
    notes: string | null;
    amount: number;
    dueDate: string | null;
    assigneeUid: string;
  }) {
    if (!householdId || !user) return;
    const jobId = await createChoreJob(householdId, { ...job, createdBy: user.uid });
    notify({ type: "job_added", jobId });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chores</h1>
          <p className="text-sm text-gray-400 mt-0.5">{formatWeekRange(weekStart, weekEnd)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/chores/history"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            History
          </Link>
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

              {week?.status === "redo" && week.redoNotes.length > 0 && (
                <div className="mb-3 px-4 py-2.5 rounded-xl bg-orange-50 border border-orange-100 text-sm text-orange-700 space-y-1">
                  {latestRedoNotes(week).map(({ taskId, note }) => {
                    const label = findTaskLabel(week, taskId);
                    return (
                      <p key={taskId}>
                        <span className="font-medium">{label ?? "A task"}:</span>{" "}
                        {note || "Please redo this one"}
                      </p>
                    );
                  })}
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

      {/* Paid jobs */}
      {(visibleJobs.length > 0 || isAdmin) && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Paid Jobs</h2>
            {isAdmin && (
              <button
                onClick={() => setShowNewJob(true)}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <Plus size={12} />
                New job
              </button>
            )}
          </div>
          {visibleJobs.length === 0 ? (
            <p className="text-sm text-gray-400">No paid jobs yet</p>
          ) : (
            <div className="space-y-3">
              {visibleJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  canMarkDone={job.assigneeUid === user?.uid}
                  onMarkDone={() => handleMarkJobDone(job.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Balances */}
      {householdId && balanceUids.length > 0 && (
        <div className="mt-8 space-y-3">
          {balanceUids.map((uid) => (
            <BalanceCard
              key={uid}
              householdId={householdId}
              memberUid={uid}
              memberName={members.find((m) => m.uid === uid)?.name ?? "Their"}
              canRecordPayouts={isAdmin}
              currentUid={user!.uid}
            />
          ))}
        </div>
      )}

      {showNewJob && (
        <NewJobModal
          members={isAdmin ? members : members.filter((m) => m.uid === user?.uid)}
          defaultAssigneeUid={!isAdmin ? user?.uid : undefined}
          onCreate={handleCreateJob}
          onClose={() => setShowNewJob(false)}
        />
      )}
    </div>
  );
}
