"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { MemberProfile } from "@/types";

interface NewJobModalProps {
  members: MemberProfile[];
  defaultAssigneeUid?: string;
  onCreate: (job: {
    title: string;
    notes: string | null;
    amount: number;
    dueDate: string | null;
    assigneeUid: string;
  }) => Promise<void>;
  onClose: () => void;
}

export default function NewJobModal({
  members,
  defaultAssigneeUid,
  onCreate,
  onClose,
}: NewJobModalProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeUid, setAssigneeUid] = useState(defaultAssigneeUid ?? members[0]?.uid ?? "");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!title.trim() || !assigneeUid) return;
    setSaving(true);
    try {
      await onCreate({
        title: title.trim(),
        notes: notes.trim() || null,
        amount: Math.round(parseFloat(amount || "0") * 100),
        dueDate: dueDate || null,
        assigneeUid,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">New paid job</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Wash the car"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any extra detail…"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10.00"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">For</label>
            <select
              value={assigneeUid}
              onChange={(e) => setAssigneeUid(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none"
            >
              {members.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !title.trim() || !assigneeUid}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            {saving ? "Creating…" : "Create job"}
          </button>
        </div>
      </div>
    </div>
  );
}
