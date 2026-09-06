"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Pencil, AlertCircle } from "lucide-react";
import type { WhanauTask, MemberProfile } from "@/types";

interface TaskRowProps {
  task: WhanauTask;
  owner?: MemberProfile;
  onToggle: (checked: boolean) => void;
  onToggleUrgent: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export default function TaskRow({
  task,
  owner,
  onToggle,
  onToggleUrgent,
  onDelete,
  onEdit,
}: TaskRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: task.checked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex items-center gap-2 px-3 py-3 bg-white rounded-2xl shadow-sm border border-gray-100 transition-opacity ${
        isDragging ? "opacity-50 shadow-lg z-10 relative" : ""
      } ${task.checked ? "opacity-60" : ""}`}
    >
      {/* Checkbox */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onToggle(!task.checked); }}
        className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: task.checked ? "#FF6B6B" : "#d1d5db",
          backgroundColor: task.checked ? "#FF6B6B" : "transparent",
        }}
        aria-label={task.checked ? "Uncheck" : "Check"}
      >
        {task.checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Task body — tap to edit */}
      <div
        className="flex-1 min-w-0 py-0.5 select-none"
        onClick={onEdit}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-medium ${
              task.checked ? "line-through text-gray-400" : "text-gray-900"
            }`}
          >
            {task.name}
          </span>
          {task.urgent && !task.checked && (
            <span className="inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 flex-shrink-0">
              <AlertCircle size={10} />
              Urgent
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.category && (
            <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md">
              {task.category}
            </span>
          )}
          {owner && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <span
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                style={{ backgroundColor: owner.colour }}
              >
                {owner.name[0].toUpperCase()}
              </span>
              {owner.name}
            </span>
          )}
        </div>
        {task.notes && (
          <p className="text-xs text-gray-400 mt-0.5 italic line-clamp-2">{task.notes}</p>
        )}
      </div>

      {/* Urgent toggle */}
      {!task.checked && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleUrgent(); }}
          className={`flex-shrink-0 p-1.5 transition-colors rounded-lg ${
            task.urgent
              ? "text-red-400 hover:text-red-600"
              : "text-gray-300 hover:text-red-400"
          }`}
          aria-label={task.urgent ? "Remove urgent" : "Mark urgent"}
        >
          <AlertCircle size={15} />
        </button>
      )}

      {/* Edit */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="flex-shrink-0 p-1.5 text-gray-300 hover:text-gray-500 transition-colors rounded-lg"
        aria-label="Edit task"
      >
        <Pencil size={14} />
      </button>

      {/* Delete */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg"
        aria-label="Delete task"
      >
        <Trash2 size={14} />
      </button>

      {/* Drag handle — only unchecked tasks are sortable.
          touch-action:none is scoped here so the rest of the row can scroll freely. */}
      {!task.checked && (
        <div
          {...listeners}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex-shrink-0 flex flex-col gap-0.5 p-1.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 transition-colors rounded-lg"
          style={{ touchAction: "none" }}
          aria-label="Drag to reorder"
        >
          <span className="block w-3.5 h-px bg-current rounded-full" />
          <span className="block w-3.5 h-px bg-current rounded-full" />
          <span className="block w-3.5 h-px bg-current rounded-full" />
        </div>
      )}
    </div>
  );
}
