"use client";

import type { ChoreRoomProgress } from "@/types";
import ChoreTaskRow from "./ChoreTaskRow";

interface ChoreRoomSectionProps {
  room: ChoreRoomProgress;
  disabled?: boolean;
  onToggleTask: (taskId: string) => void;
}

export default function ChoreRoomSection({ room, disabled, onToggleTask }: ChoreRoomSectionProps) {
  const total = room.tasks.length;
  const done = room.tasks.filter((t) => t.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="font-medium text-gray-900">{room.name}</p>
          <span className="text-xs text-gray-400">
            {done}/{total}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#6BCB77" : "#FF6B6B" }}
          />
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {room.tasks.map((task) => (
          <ChoreTaskRow
            key={task.id}
            task={task}
            disabled={disabled}
            onToggle={() => onToggleTask(task.id)}
          />
        ))}
      </div>
    </div>
  );
}
