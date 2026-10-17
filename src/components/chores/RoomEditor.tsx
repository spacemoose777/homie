"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Plus } from "lucide-react";
import type { ChoreRoomDef } from "@/types";
import RoomTaskEditorRow from "./RoomTaskEditorRow";

interface RoomEditorProps {
  room: ChoreRoomDef;
  onChange: (room: ChoreRoomDef) => void;
  onDelete: () => void;
}

export default function RoomEditor({ room, onChange, onDelete }: RoomEditorProps) {
  const [name, setName] = useState(room.name);
  const [newTask, setNewTask] = useState("");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: room.id,
  });

  useEffect(() => setName(room.name), [room.name]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  function commitName() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== room.name) onChange({ ...room, name: trimmed });
    else setName(room.name);
  }

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    const label = newTask.trim();
    if (!label) return;
    onChange({
      ...room,
      tasks: [
        ...room.tasks,
        { id: crypto.randomUUID(), label, sortOrder: room.tasks.length },
      ],
    });
    setNewTask("");
  }

  function handleRenameTask(taskId: string, label: string) {
    onChange({ ...room, tasks: room.tasks.map((t) => (t.id === taskId ? { ...t, label } : t)) });
  }

  function handleDeleteTask(taskId: string) {
    onChange({ ...room, tasks: room.tasks.filter((t) => t.id !== taskId) });
  }

  function handleTaskDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = room.tasks.findIndex((t) => t.id === active.id);
    const newIndex = room.tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(room.tasks, oldIndex, newIndex).map((t, i) => ({ ...t, sortOrder: i }));
    onChange({ ...room, tasks: reordered });
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${
        isDragging ? "opacity-50 relative z-10 shadow-lg" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 flex flex-col gap-0.5 p-1.5 cursor-grab active:cursor-grabbing text-gray-300"
          style={{ touchAction: "none" }}
          aria-label="Drag to reorder room"
        >
          <span className="block w-3.5 h-px bg-current rounded-full" />
          <span className="block w-3.5 h-px bg-current rounded-full" />
          <span className="block w-3.5 h-px bg-current rounded-full" />
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-gray-200 font-medium text-gray-900 focus:outline-none transition-colors"
        />
        <button
          onClick={onDelete}
          className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-400 transition-colors"
          aria-label="Remove room"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTaskDragEnd}>
        <SortableContext items={room.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="pl-1">
            {room.tasks.map((task) => (
              <RoomTaskEditorRow
                key={task.id}
                task={task}
                onRename={(label) => handleRenameTask(task.id, label)}
                onDelete={() => handleDeleteTask(task.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <form onSubmit={handleAddTask} className="flex gap-2 mt-2 pl-1">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-dashed border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-300 transition-colors"
        />
        <button
          type="submit"
          disabled={!newTask.trim()}
          className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
          aria-label="Add task"
        >
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
}
