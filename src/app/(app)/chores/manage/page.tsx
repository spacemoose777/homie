"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToChoreLists,
  createChoreList,
  updateChoreList,
  getHouseholdMembers,
} from "@/lib/firebase/firestore";
import { SAM_WEEKLY_CLEAN_TEMPLATE, materializeTemplateRooms } from "@/lib/chores/templates";
import type { ChoreList, ChoreRoomDef, MemberProfile } from "@/types";
import ChecklistEditor from "@/components/chores/ChecklistEditor";

export default function ManageChoresPage() {
  const { user, householdId, memberProfile, loading } = useAuth();
  const router = useRouter();
  const [lists, setLists] = useState<ChoreList[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
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
    </div>
  );
}
