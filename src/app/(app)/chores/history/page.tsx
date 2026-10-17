"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Flame, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToChoreLists,
  subscribeToChoreWeeks,
  subscribeToChoreJobs,
  ensureChoreWeek,
  approveChoreWeek,
  getHouseholdMembers,
} from "@/lib/firebase/firestore";
import {
  getCurrentWeekBounds,
  getWeekEndISO,
  addWeeksISO,
  formatWeekRange,
} from "@/lib/chores/week";
import type { ChoreList, ChoreWeek, ChoreJob, MemberProfile } from "@/types";

// How far back to offer "no record — close this out" placeholders for weeks
// nobody ever opened. Bounded so an old checklist doesn't generate an
// unbounded backlog.
const MISSED_WEEK_LOOKBACK = 8;

const WEEK_STATUS_STYLE: Record<ChoreWeek["status"], { bg: string; color: string; label: string }> = {
  in_progress: { bg: "#f3f4f6", color: "#6b7280", label: "In progress" },
  submitted: { bg: "#fff7ed", color: "#f97316", label: "Waiting for review" },
  approved: { bg: "#f0fdf4", color: "#22c55e", label: "Approved" },
  redo: { bg: "#fef2f2", color: "#ef4444", label: "Sent back" },
};

const JOB_STATUS_STYLE: Record<ChoreJob["status"], { bg: string; color: string; label: string }> = {
  open: { bg: "#f3f4f6", color: "#6b7280", label: "Open" },
  done: { bg: "#fff7ed", color: "#f97316", label: "Waiting for review" },
  approved: { bg: "#f0fdf4", color: "#22c55e", label: "Approved" },
  redo: { bg: "#fef2f2", color: "#ef4444", label: "Sent back" },
};

// Consecutive approved weeks, counting back from the most recent. Breaks on
// the first non-approved week OR the first gap in the weekly sequence.
function computeStreak(weeksDesc: ChoreWeek[]): number {
  let streak = 0;
  let expected: string | null = null;
  for (const week of weeksDesc) {
    if (week.status !== "approved") break;
    if (expected !== null && week.weekStart !== expected) break;
    streak++;
    expected = addWeeksISO(week.weekStart, -1);
  }
  return streak;
}

export default function ChoresHistoryPage() {
  const { user, householdId, memberProfile } = useAuth();
  const [lists, setLists] = useState<ChoreList[]>([]);
  const [weeksByList, setWeeksByList] = useState<Record<string, ChoreWeek[]>>({});
  const [jobs, setJobs] = useState<ChoreJob[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [closingOut, setClosingOut] = useState<string | null>(null);

  const isAdmin = memberProfile?.role === "admin";
  const { weekStart: currentWeekStart } = useMemo(() => getCurrentWeekBounds(), []);

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

  const visibleLists = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return lists;
    return lists.filter((l) => l.assigneeUid === user.uid);
  }, [lists, isAdmin, user]);

  useEffect(() => {
    if (!householdId) return;
    const unsubs = visibleLists.map((list) =>
      subscribeToChoreWeeks(householdId, list.id, (weeks) => {
        setWeeksByList((prev) => ({ ...prev, [list.id]: weeks }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [householdId, visibleLists]);

  const visibleJobs = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return jobs;
    return jobs.filter((j) => j.assigneeUid === user.uid);
  }, [jobs, isAdmin, user]);

  async function handleCloseOutMissedWeek(list: ChoreList, weekStart: string) {
    if (!householdId || !user) return;
    const weekEnd = getWeekEndISO(weekStart);
    setClosingOut(`${list.id}_${weekStart}`);
    try {
      const week = await ensureChoreWeek(householdId, list, weekStart, weekEnd);
      await approveChoreWeek(householdId, list.id, week.id, {
        memberUid: list.assigneeUid,
        awardedAmount: 0,
        parentNote: "Not completed",
        approvedBy: user.uid,
      });
    } finally {
      setClosingOut(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link
        href="/chores"
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6"
      >
        <ChevronLeft size={16} />
        Chores
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">History</h1>

      {visibleLists.length === 0 && visibleJobs.length === 0 && (
        <p className="text-sm text-gray-400">Nothing here yet</p>
      )}

      <div className="space-y-8">
        {visibleLists.map((list) => {
          const weeks = weeksByList[list.id] ?? [];
          const assignee = members.find((m) => m.uid === list.assigneeUid);
          const streak = computeStreak(weeks);

          // Fill in "no record" placeholders for weeks nobody ever opened,
          // within the lookback window and not before the list existed.
          const listCreatedWeekStart = list.createdAt
            ? getCurrentWeekBounds(list.createdAt.toDate()).weekStart
            : currentWeekStart;
          const existingStarts = new Set(weeks.map((w) => w.weekStart));
          const placeholders: string[] = [];
          for (let i = 1; i <= MISSED_WEEK_LOOKBACK; i++) {
            const ws = addWeeksISO(currentWeekStart, -i);
            if (ws < listCreatedWeekStart) break;
            if (!existingStarts.has(ws)) placeholders.push(ws);
          }

          const rows = [
            ...weeks.map((w) => ({ kind: "week" as const, weekStart: w.weekStart, week: w })),
            ...placeholders.map((ws) => ({ kind: "missing" as const, weekStart: ws, week: null })),
          ].sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));

          return (
            <div key={list.id}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">
                  {assignee?.name ?? "Someone"} — {list.name}
                </h2>
                {streak > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-orange-50 text-orange-600">
                    <Flame size={12} />
                    {streak} week{streak === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {rows.length === 0 && (
                  <p className="px-4 py-4 text-sm text-gray-400">No weeks yet</p>
                )}
                {rows.map((row, i) => {
                  const total = row.week ? row.week.rooms.reduce((n, r) => n + r.tasks.length, 0) : 0;
                  const done = row.week
                    ? row.week.rooms.reduce((n, r) => n + r.tasks.filter((t) => t.done).length, 0)
                    : 0;
                  return (
                    <div
                      key={row.weekStart}
                      className={`px-4 py-3 ${i < rows.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {formatWeekRange(row.weekStart, getWeekEndISO(row.weekStart))}
                        </p>
                        {row.kind === "missing" ? (
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-50 text-gray-400">
                            No record
                          </span>
                        ) : (
                          <span
                            className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: WEEK_STATUS_STYLE[row.week!.status].bg,
                              color: WEEK_STATUS_STYLE[row.week!.status].color,
                            }}
                          >
                            {WEEK_STATUS_STYLE[row.week!.status].label}
                          </span>
                        )}
                      </div>
                      {row.kind === "week" && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {done}/{total} done
                          {row.week!.status === "approved" && row.week!.awardedAmount !== null && (
                            <> · ${(row.week!.awardedAmount / 100).toFixed(2)}</>
                          )}
                        </p>
                      )}
                      {row.week?.parentNote && (
                        <p className="text-xs text-gray-500 mt-1 italic">{row.week.parentNote}</p>
                      )}
                      {row.kind === "missing" && isAdmin && (
                        <button
                          onClick={() => handleCloseOutMissedWeek(list, row.weekStart)}
                          disabled={closingOut === `${list.id}_${row.weekStart}`}
                          className="mt-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 underline disabled:opacity-50"
                        >
                          {closingOut === `${list.id}_${row.weekStart}`
                            ? "Closing out…"
                            : "Mark as not done ($0)"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {visibleJobs.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Paid Jobs</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {visibleJobs.map((job, i) => {
                const assignee = members.find((m) => m.uid === job.assigneeUid);
                const style = JOB_STATUS_STYLE[job.status];
                return (
                  <div
                    key={job.id}
                    className={`px-4 py-3 ${i < visibleJobs.length - 1 ? "border-b border-gray-100" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {isAdmin ? `${assignee?.name ?? "Someone"} — ` : ""}
                        {job.title}
                      </p>
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
                        style={{ backgroundColor: style.bg, color: style.color }}
                      >
                        {style.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      ${(job.amount / 100).toFixed(2)}
                      {job.status === "approved" && job.awardedAmount !== null && (
                        <>
                          {" "}
                          · <CheckCircle2 size={10} className="inline mb-0.5" /> paid $
                          {(job.awardedAmount / 100).toFixed(2)}
                        </>
                      )}
                    </p>
                    {job.parentNote && (
                      <p className="text-xs text-gray-500 mt-1 italic">{job.parentNote}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
