"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Sparkles, ClipboardCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToChoreLists,
  subscribeToChoreWeeks,
  subscribeToChoreJobs,
  createChoreList,
  updateChoreList,
  getHouseholdMembers,
  approveChoreWeek,
  sendChoreWeekToRedo,
  approveChoreJob,
  sendChoreJobToRedo,
} from "@/lib/firebase/firestore";
import { SAM_WEEKLY_CLEAN_TEMPLATE, materializeTemplateRooms } from "@/lib/chores/templates";
import { formatWeekRange } from "@/lib/chores/week";
import type {
  ChoreList,
  ChoreRoomDef,
  ChoreRoomProgress,
  ChoreWeek,
  ChoreJob,
  ChoreRedoNote,
  MemberProfile,
} from "@/types";
import ChecklistEditor from "@/components/chores/ChecklistEditor";
import ApprovalModal from "@/components/chores/ApprovalModal";
import JobApprovalModal from "@/components/chores/JobApprovalModal";

export default function ManageChoresPage() {
  const { user, householdId, memberProfile, loading } = useAuth();
  const router = useRouter();
  const [lists, setLists] = useState<ChoreList[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [weeksByList, setWeeksByList] = useState<Record<string, ChoreWeek[]>>({});
  const [jobs, setJobs] = useState<ChoreJob[]>([]);
  const [reviewing, setReviewing] = useState<{ list: ChoreList; week: ChoreWeek } | null>(null);
  const [reviewingJob, setReviewingJob] = useState<ChoreJob | null>(null);
  const [creating, setCreating] = useState(false);
  const [templateAssignee, setTemplateAssignee] = useState("");
  const [templateAmount, setTemplateAmount] = useState(
    (SAM_WEEKLY_CLEAN_TEMPLATE.amount / 100).toString()
  );

  const isAdmin = memberProfile?.role === "admin";

  // Only parents manage checklists — this is UX guidance, not the real
  // enforcement (that's in firestore.rules, verified against the emulator).
  useEffect(() => {
    if (!loading && memberProfile && !isAdmin) router.replace("/chores");
  }, [loading, memberProfile, isAdmin, router]);

  useEffect(() => {
    if (!householdId) return;
    return subscribeToChoreLists(householdId, setLists);
  }, [householdId]);

  // Pending-approval queue — subscribe to every active list's weeks and
  // filter down to "submitted" client-side (fine at this scale: at most a
  // handful of lists, a handful of weeks of history each).
  useEffect(() => {
    if (!householdId) return;
    const unsubs = lists.map((list) =>
      subscribeToChoreWeeks(householdId, list.id, (weeks) => {
        setWeeksByList((prev) => ({ ...prev, [list.id]: weeks }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [householdId, lists]);

  useEffect(() => {
    if (!householdId) return;
    return subscribeToChoreJobs(householdId, setJobs);
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;
    getHouseholdMembers(householdId).then((m) => {
      setMembers(m);
      const firstChild = m.find((member) => member.role === "child");
      setTemplateAssignee((prev) => prev || firstChild?.uid || m[0]?.uid || "");
    });
  }, [householdId]);

  async function handleLoadTemplate() {
    if (!householdId || !user || !templateAssignee) return;
    setCreating(true);
    try {
      await createChoreList(householdId, {
        name: SAM_WEEKLY_CLEAN_TEMPLATE.name,
        frequency: "weekly",
        assigneeUid: templateAssignee,
        amount: Math.round(parseFloat(templateAmount || "0") * 100),
        rooms: materializeTemplateRooms(SAM_WEEKLY_CLEAN_TEMPLATE),
        createdBy: user.uid,
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleRoomsChange(list: ChoreList, rooms: ChoreRoomDef[]) {
    if (!householdId) return;
    await updateChoreList(householdId, list.id, { rooms });
  }

  async function handleNameChange(list: ChoreList, name: string) {
    if (!householdId || !name.trim() || name === list.name) return;
    await updateChoreList(householdId, list.id, { name: name.trim() });
  }

  async function handleAmountChange(list: ChoreList, dollars: string) {
    if (!householdId) return;
    const cents = Math.round(parseFloat(dollars || "0") * 100);
    if (Number.isNaN(cents) || cents === list.amount) return;
    await updateChoreList(householdId, list.id, { amount: cents });
  }

  async function handleApproveWeek(awardedAmount: number, note: string | null) {
    if (!householdId || !user || !reviewing) return;
    await approveChoreWeek(householdId, reviewing.list.id, reviewing.week.id, {
      memberUid: reviewing.list.assigneeUid,
      awardedAmount,
      parentNote: note,
      approvedBy: user.uid,
    });
  }

  async function handleSendToRedo(rooms: ChoreRoomProgress[], redoNotes: ChoreRedoNote[]) {
    if (!householdId || !reviewing) return;
    await sendChoreWeekToRedo(householdId, reviewing.list.id, reviewing.week.id, rooms, redoNotes);
  }

  async function handleApproveJob(awardedAmount: number, note: string | null) {
    if (!householdId || !user || !reviewingJob) return;
    await approveChoreJob(householdId, reviewingJob.id, {
      memberUid: reviewingJob.assigneeUid,
      awardedAmount,
      parentNote: note,
      approvedBy: user.uid,
    });
  }

  async function handleJobSendToRedo(note: string | null) {
    if (!householdId || !reviewingJob) return;
    await sendChoreJobToRedo(householdId, reviewingJob.id, note);
  }

  // Pending approval, newest first, across every list
  const pendingWeeks = Object.entries(weeksByList)
    .flatMap(([listId, weeks]) =>
      weeks
        .filter((w) => w.status === "submitted")
        .map((week) => ({ list: lists.find((l) => l.id === listId)!, week }))
    )
    .filter((x) => x.list)
    .sort((a, b) => (a.week.submittedAt?.toMillis() ?? 0) - (b.week.submittedAt?.toMillis() ?? 0));

  const pendingJobs = jobs
    .filter((j) => j.status === "done")
    .sort((a, b) => (a.doneAt?.toMillis() ?? 0) - (b.doneAt?.toMillis() ?? 0));

  if (!isAdmin) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link
        href="/chores"
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6"
      >
        <ChevronLeft size={16} />
        Chores
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage checklists</h1>

      {(pendingWeeks.length > 0 || pendingJobs.length > 0) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <p className="px-4 pt-4 pb-2 font-medium text-gray-700 flex items-center gap-2">
            <ClipboardCheck size={15} />
            Waiting for review
          </p>
          {pendingWeeks.map(({ list, week }) => {
            const assignee = members.find((m) => m.uid === list.assigneeUid);
            const total = week.rooms.reduce((n, r) => n + r.tasks.length, 0);
            const done = week.rooms.reduce((n, r) => n + r.tasks.filter((t) => t.done).length, 0);
            return (
              <button
                key={week.id}
                onClick={() => setReviewing({ list, week })}
                className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {assignee?.name ?? "Someone"} — {list.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatWeekRange(week.weekStart, week.weekEnd)} · {done}/{total} done
                  </p>
                </div>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-2"
                  style={{ backgroundColor: "#FF6B6B", color: "white" }}
                >
                  Review
                </span>
              </button>
            );
          })}
          {pendingJobs.map((job) => {
            const assignee = members.find((m) => m.uid === job.assigneeUid);
            return (
              <button
                key={job.id}
                onClick={() => setReviewingJob(job)}
                className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {assignee?.name ?? "Someone"} — {job.title}
                  </p>
                  <p className="text-xs text-gray-400">Paid job · ${(job.amount / 100).toFixed(2)}</p>
                </div>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-2"
                  style={{ backgroundColor: "#FF6B6B", color: "white" }}
                >
                  Review
                </span>
              </button>
            );
          })}
        </div>
      )}

      {lists.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="font-medium text-gray-900 mb-1">Start with Sam's weekly clean</p>
          <p className="text-sm text-gray-400 mb-4">
            Loads the full room-by-room checklist — edit anything afterwards.
          </p>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">For</label>
              <select
                value={templateAssignee}
                onChange={(e) => setTemplateAssignee(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none"
              >
                {members.map((m) => (
                  <option key={m.uid} value={m.uid}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount for completing the whole checklist
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={templateAmount}
                  onChange={(e) => setTemplateAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleLoadTemplate}
            disabled={creating || !templateAssignee}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-white font-medium disabled:opacity-50"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            <Sparkles size={14} />
            {creating ? "Loading…" : "Load template"}
          </button>
        </div>
      )}

      <div className="space-y-8">
        {lists.map((list) => {
          const assignee = members.find((m) => m.uid === list.assigneeUid);
          return (
            <div key={list.id}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Checklist name</label>
                    <input
                      type="text"
                      defaultValue={list.name}
                      onBlur={(e) => handleNameChange(list, e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.50"
                        defaultValue={(list.amount / 100).toString()}
                        onBlur={(e) => handleAmountChange(list, e.target.value)}
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                {assignee && (
                  <p className="text-xs text-gray-400 mt-3">
                    For <span className="font-medium text-gray-600">{assignee.name}</span> — amount
                    and task changes only apply to future weeks, not ones already in progress.
                  </p>
                )}
              </div>

              <ChecklistEditor
                rooms={list.rooms}
                onChange={(rooms) => handleRoomsChange(list, rooms)}
              />
            </div>
          );
        })}
      </div>

      {reviewing && (
        <ApprovalModal
          week={reviewing.week}
          assigneeName={members.find((m) => m.uid === reviewing.list.assigneeUid)?.name ?? "Them"}
          onApprove={handleApproveWeek}
          onSendToRedo={handleSendToRedo}
          onClose={() => setReviewing(null)}
        />
      )}

      {reviewingJob && (
        <JobApprovalModal
          job={reviewingJob}
          assigneeName={members.find((m) => m.uid === reviewingJob.assigneeUid)?.name ?? "Them"}
          onApprove={handleApproveJob}
          onSendToRedo={handleJobSendToRedo}
          onClose={() => setReviewingJob(null)}
        />
      )}
    </div>
  );
}
