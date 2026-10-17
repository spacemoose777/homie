"use client";

import { Calendar, CheckCircle2 } from "lucide-react";
import type { ChoreJob } from "@/types";

interface JobCardProps {
  job: ChoreJob;
  canMarkDone: boolean;
  onMarkDone: () => void;
}

const STATUS_STYLE: Record<ChoreJob["status"], { bg: string; color: string; label: string }> = {
  open: { bg: "#f3f4f6", color: "#6b7280", label: "Open" },
  done: { bg: "#fff7ed", color: "#f97316", label: "Waiting for review" },
  approved: { bg: "#f0fdf4", color: "#22c55e", label: "Approved" },
  redo: { bg: "#fef2f2", color: "#ef4444", label: "Sent back" },
};

function formatDueDate(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export default function JobCard({ job, canMarkDone, onMarkDone }: JobCardProps) {
  const style = STATUS_STYLE[job.status];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-medium text-gray-900">{job.title}</p>
        <span
          className="flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full"
          style={{ backgroundColor: style.bg, color: style.color }}
        >
          {style.label}
        </span>
      </div>
      {job.notes && <p className="text-sm text-gray-400 mb-2">{job.notes}</p>}
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-1">
        <span className="font-medium text-gray-600">
          ${(job.amount / 100).toFixed(2)}
        </span>
        {job.dueDate && (
          <span className="inline-flex items-center gap-1">
            <Calendar size={11} />
            Due {formatDueDate(job.dueDate)}
          </span>
        )}
      </div>

      {job.parentNote && (job.status === "redo" || job.status === "approved") && (
        <p className="text-sm px-3 py-2 mt-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-700">
          {job.parentNote}
        </p>
      )}

      {job.status === "approved" && job.awardedAmount !== null && (
        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
          <CheckCircle2 size={12} />
          Paid ${(job.awardedAmount / 100).toFixed(2)}
        </p>
      )}

      {canMarkDone && (job.status === "open" || job.status === "redo") && (
        <button
          onClick={onMarkDone}
          className="w-full mt-3 py-2 rounded-xl text-white text-sm font-medium"
          style={{ backgroundColor: "#FF6B6B" }}
        >
          Mark done
        </button>
      )}
    </div>
  );
}
