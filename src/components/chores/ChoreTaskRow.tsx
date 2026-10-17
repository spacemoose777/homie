"use client";

import type { ChoreTaskProgress } from "@/types";

interface ChoreTaskRowProps {
  task: ChoreTaskProgress;
  disabled?: boolean;
  onToggle: () => void;
}

export default function ChoreTaskRow({ task, disabled, onToggle }: ChoreTaskRowProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="flex items-center gap-3 w-full px-4 py-2.5 text-left disabled:opacity-60"
    >
      <span
        className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: task.done ? "#FF6B6B" : "#d1d5db",
          backgroundColor: task.done ? "#FF6B6B" : "transparent",
        }}
      >
        {task.done && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className={`text-sm flex-1 ${task.done ? "line-through text-gray-400" : "text-gray-900"}`}>
        {task.label}
      </span>
    </button>
  );
}
