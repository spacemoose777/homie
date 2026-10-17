"use client";

import { useState } from "react";
import { X, RotateCcw } from "lucide-react";
import type { ChoreJob } from "@/types";

interface JobApprovalModalProps {
  job: ChoreJob;
  assigneeName: string;
  onApprove: (awardedAmount: number, note: string | null) => Promise<void>;
  onSendToRedo: (note: string | null) => Promise<void>;
  onClose: () => void;
}

const QUICK_FRACTIONS = [
  { label: "100%", value: 1 },
  { label: "75%", value: 0.75 },
  { label: "50%", value: 0.5 },
];

export default function JobApprovalModal({
  job,
  assigneeName,
  onApprove,
  onSendToRedo,
  onClose,
}: JobApprovalModalProps) {
  const [mode, setMode] = useState<"review" | "redo">("review");
  const [fraction, setFraction] = useState<number | null>(1);
  const [customAmount, setCustomAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const awardedAmount =
    fraction !== null
      ? Math.round(job.amount * fraction)
      : Math.round(parseFloat(customAmount || "0") * 100);

  async function handleApprove() {
    setSaving(true);
    try {
      await onApprove(awardedAmount, note.trim() || null);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleSendToRedo() {
    setSaving(true);
    try {
      await onSendToRedo(note.trim() || null);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">{job.title}</h2>
            <p className="text-xs text-gray-400">{assigneeName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
          {job.notes && <p className="text-sm text-gray-500">{job.notes}</p>}

          {mode === "review" ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Award amount</p>
              <div className="flex gap-2 flex-wrap">
                {QUICK_FRACTIONS.map((f) => (
                  <button
                    key={f.label}
                    onClick={() => {
                      setFraction(f.value);
                      setCustomAmount("");
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={
                      fraction === f.value
                        ? { backgroundColor: "#FF6B6B", color: "white" }
                        : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                    }
                  >
                    {f.label} (${((job.amount * f.value) / 100).toFixed(2)})
                  </button>
                ))}
                <button
                  onClick={() => setFraction(null)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  style={
                    fraction === null
                      ? { backgroundColor: "#FF6B6B", color: "white" }
                      : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                  }
                >
                  Custom
                </button>
              </div>
              {fraction === null && (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note ({assigneeName} will see this)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Nice work!"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                This sends it back to {assigneeName} as not-yet-done, with a note.
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="e.g. missed a spot"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none resize-none"
              />
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0 space-y-2">
          {mode === "review" ? (
            <>
              <button
                onClick={handleApprove}
                disabled={saving}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: "#FF6B6B" }}
              >
                {saving ? "Approving…" : `Approve — $${(awardedAmount / 100).toFixed(2)}`}
              </button>
              <button
                onClick={() => setMode("redo")}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} />
                Send back instead
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSendToRedo}
                disabled={saving}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: "#f97316" }}
              >
                {saving ? "Sending…" : "Send back"}
              </button>
              <button onClick={() => setMode("review")} className="w-full py-2 text-sm text-gray-400">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
