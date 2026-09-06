"use client";

import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import type { WhanauTask, MemberProfile } from "@/types";
import TaskRow from "./TaskRow";

interface TaskListProps {
  tasks: WhanauTask[];
  members: MemberProfile[];
  selectedCategory: string | null;
  urgentOnly: boolean;
  onToggle: (id: string, checked: boolean) => void;
  onToggleUrgent: (id: string, urgent: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (task: WhanauTask) => void;
  onReorder: (taskId: string, newSortOrder: number) => void;
}

// Tasks without explicit sortOrder fall back to newest-first via createdAt
function getSortOrder(task: WhanauTask): number {
  return task.sortOrder ?? -task.createdAt.toMillis();
}

export default function TaskList({
  tasks,
  members,
  selectedCategory,
  urgentOnly,
  onToggle,
  onToggleUrgent,
  onDelete,
  onEdit,
  onReorder,
}: TaskListProps) {
  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.uid, m])),
    [members]
  );

  // 200 ms hold activates drag — matches the shopping list's touch/mouse handling
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const sorted = useMemo(() => {
    let filtered = [...tasks];

    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }
    if (urgentOnly) {
      filtered = filtered.filter((t) => t.urgent && !t.checked);
    }

    // Checked last, urgent unchecked pinned to top, then by sortOrder
    return filtered.sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      if (!a.checked && !b.checked) {
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
      }
      return getSortOrder(a) - getSortOrder(b);
    });
  }, [tasks, selectedCategory, urgentOnly]);

  const uncheckedIds = useMemo(
    () => sorted.filter((t) => !t.checked).map((t) => t.id),
    [sorted]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const unchecked = sorted.filter((t) => !t.checked);
    const oldIndex = unchecked.findIndex((t) => t.id === active.id);
    const newIndex = unchecked.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(unchecked, oldIndex, newIndex);

    const prevOrder = newIndex > 0 ? getSortOrder(reordered[newIndex - 1]) : null;
    const nextOrder =
      newIndex < reordered.length - 1 ? getSortOrder(reordered[newIndex + 1]) : null;

    let newSortOrder: number;
    if (prevOrder === null && nextOrder === null) {
      newSortOrder = 0;
    } else if (prevOrder === null) {
      newSortOrder = nextOrder! - 1000;
    } else if (nextOrder === null) {
      newSortOrder = prevOrder + 1000;
    } else {
      newSortOrder = (prevOrder + nextOrder) / 2;
    }

    onReorder(active.id as string, newSortOrder);
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-4xl mb-3">📝</p>
        <p className="text-gray-400 text-sm">Nothing here yet</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {}} // ensures pointer capture is always released on interruption
    >
      <SortableContext items={uncheckedIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {sorted.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              owner={task.owner ? memberMap.get(task.owner) : undefined}
              onToggle={(checked) => onToggle(task.id, checked)}
              onToggleUrgent={() => onToggleUrgent(task.id, !task.urgent)}
              onDelete={() => onDelete(task.id)}
              onEdit={() => onEdit(task)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
