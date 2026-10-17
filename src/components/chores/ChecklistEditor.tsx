"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { ChoreRoomDef } from "@/types";
import RoomEditor from "./RoomEditor";

interface ChecklistEditorProps {
  rooms: ChoreRoomDef[];
  onChange: (rooms: ChoreRoomDef[]) => void;
}

export default function ChecklistEditor({ rooms, onChange }: ChecklistEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  function handleRoomChange(updated: ChoreRoomDef) {
    onChange(rooms.map((r) => (r.id === updated.id ? updated : r)));
  }

  function handleDeleteRoom(roomId: string) {
    if (!confirm("Remove this room and all its tasks from the checklist?")) return;
    onChange(rooms.filter((r) => r.id !== roomId));
  }

  function handleAddRoom() {
    onChange([
      ...rooms,
      { id: crypto.randomUUID(), name: "New room", sortOrder: rooms.length, tasks: [] },
    ]);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rooms.findIndex((r) => r.id === active.id);
    const newIndex = rooms.findIndex((r) => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(rooms, oldIndex, newIndex).map((r, i) => ({ ...r, sortOrder: i }));
    onChange(reordered);
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={rooms.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          {rooms.map((room) => (
            <RoomEditor
              key={room.id}
              room={room}
              onChange={handleRoomChange}
              onDelete={() => handleDeleteRoom(room.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        onClick={handleAddRoom}
        className="flex items-center justify-center gap-1.5 w-full py-3 rounded-2xl border border-dashed border-gray-200 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
      >
        <Plus size={14} />
        Add room
      </button>
    </div>
  );
}
