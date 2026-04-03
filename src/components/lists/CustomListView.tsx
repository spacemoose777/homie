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
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Pencil, AlertCircle } from "lucide-react";
import type { CustomListItem } from "@/types";

function getSortOrder(item: CustomListItem): number {
  return item.sortOrder ?? -item.createdAt.toMillis();
}

function CustomListItemRow({
  item,
  onToggle,
  onToggleUrgent,
  onDelete,
  onEdit,
}: {
  item: CustomListItem;
  onToggle: (checked: boolean) => void;
  onToggleUrgent: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: item.checked });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex items-center gap-2 px-3 py-3 bg-white rounded-2xl shadow-sm border border-gray-100 transition-opacity ${
        isDragging ? "opacity-50 shadow-lg z-10 relative" : ""
      } ${item.checked ? "opacity-60" : ""}`}
    >
      {/* Checkbox */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onToggle(!item.checked); }}
        className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: item.checked ? "#FF6B6B" : "#d1d5db",
          backgroundColor: item.checked ? "#FF6B6B" : "transparent",
        }}
        aria-label={item.checked ? "Uncheck" : "Check"}
      >
        {item.checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Item body — tap to edit */}
      <div
        className="flex-1 min-w-0 py-0.5 select-none"
        onClick={onEdit}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-medium ${
              item.checked ? "line-through text-gray-400" : "text-gray-900"
            }`}
          >
            {item.name}
          </span>
          {item.urgent && !item.checked && (
            <span className="inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 flex-shrink-0">
              <AlertCircle size={10} />
              Urgent
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {item.brand && <span className="text-xs text-gray-400">{item.brand}</span>}
          {item.quantity && <span className="text-xs text-gray-400">× {item.quantity}</span>}
          {item.section && (
            <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md">
              {item.section}
            </span>
          )}
        </div>
      </div>

      {/* Urgent toggle */}
      {!item.checked && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleUrgent(); }}
          className={`flex-shrink-0 p-1.5 transition-colors rounded-lg ${
            item.urgent
              ? "text-red-400 hover:text-red-600"
              : "text-gray-300 hover:text-red-400"
          }`}
          aria-label={item.urgent ? "Remove urgent" : "Mark urgent"}
        >
          <AlertCircle size={15} />
        </button>
      )}

      {/* Edit */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="flex-shrink-0 p-1.5 text-gray-300 hover:text-gray-500 transition-colors rounded-lg"
        aria-label="Edit item"
      >
        <Pencil size={14} />
      </button>

      {/* Delete */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg"
        aria-label="Delete item"
      >
        <Trash2 size={14} />
      </button>

      {/* Drag handle — touch-action:none scoped here so the rest of the item scrolls freely */}
      {!item.checked && (
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

interface CustomListViewProps {
  items: CustomListItem[];
  selectedSection: string | null;
  urgentOnly: boolean;
  onToggle: (id: string, checked: boolean) => void;
  onToggleUrgent: (id: string, urgent: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (item: CustomListItem) => void;
  onReorder: (itemId: string, newSortOrder: number) => void;
}

export default function CustomListView({
  items,
  selectedSection,
  urgentOnly,
  onToggle,
  onToggleUrgent,
  onDelete,
  onEdit,
  onReorder,
}: CustomListViewProps) {
  // PointerSensor handles both mouse and touch via pointer events.
  // TouchSensor is omitted — it required touch-action:none on the whole item body (breaking scroll).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const sorted = useMemo(() => {
    let filtered = [...items];
    if (selectedSection) filtered = filtered.filter((i) => i.section === selectedSection);
    if (urgentOnly) filtered = filtered.filter((i) => i.urgent && !i.checked);
    return filtered.sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      return getSortOrder(a) - getSortOrder(b);
    });
  }, [items, selectedSection, urgentOnly]);

  const uncheckedIds = useMemo(
    () => sorted.filter((i) => !i.checked).map((i) => i.id),
    [sorted]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const unchecked = sorted.filter((i) => !i.checked);
    const oldIndex = unchecked.findIndex((i) => i.id === active.id);
    const newIndex = unchecked.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(unchecked, oldIndex, newIndex);
    const prevOrder = newIndex > 0 ? getSortOrder(reordered[newIndex - 1]) : null;
    const nextOrder = newIndex < reordered.length - 1 ? getSortOrder(reordered[newIndex + 1]) : null;

    let newSortOrder: number;
    if (prevOrder === null && nextOrder === null) newSortOrder = 0;
    else if (prevOrder === null) newSortOrder = nextOrder! - 1000;
    else if (nextOrder === null) newSortOrder = prevOrder + 1000;
    else newSortOrder = (prevOrder + nextOrder) / 2;

    onReorder(active.id as string, newSortOrder);
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-gray-400 text-sm">Nothing here yet</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragCancel={() => {}}>
      <SortableContext items={uncheckedIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {sorted.map((item) => (
            <CustomListItemRow
              key={item.id}
              item={item}
              onToggle={(checked) => onToggle(item.id, checked)}
              onToggleUrgent={() => onToggleUrgent(item.id, !item.urgent)}
              onDelete={() => onDelete(item.id)}
              onEdit={() => onEdit(item)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
