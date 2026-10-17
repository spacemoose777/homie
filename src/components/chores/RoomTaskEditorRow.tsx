"use client";

import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2 } from "lucide-react";
import type { ChoreTaskDef } from "@/types";

interface RoomTaskEditorRowProps {
  task: ChoreTaskDef;
  onRename: (label: string) => void;
  onDelete: () => void;
}

export default function RoomTaskEditorRow({ task, onRename, onDelete }: RoomTaskEditorRowProps) {
  const [label, setLabel] = useState(task.label);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  useEffect(() => setLabel(task.label), [task.label]);

  function commit() {
    const trimmed = label.trim();
    if (trimmed && trimmed !== task.label) onRename(trimmed);
    else setLabel(task.label);
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 py-1.5 ${isDragging ? "opacity-50 relative z-10" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 flex flex-col gap-0.5 p-1 cursor-grab active:cursor-grabbing text-gray-300"
        style={{ touchAction: "none" }}
        aria-label="Drag to reorder"
      >
        <span className="block w-3 h-px bg-current rounded-full" />
        <span className="block w-3 h-px bg-current rounded-full" />
        <span className="block w-3 h-px bg-current rounded-full" />
      </div>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-gray-200 text-sm focus:outline-none transition-colors"
      />
      <button
        onClick={onDelete}
        className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-400 transition-colors"
        aria-label="Remove task"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
