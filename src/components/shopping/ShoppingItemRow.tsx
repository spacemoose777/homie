"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Pencil, AlertCircle, Store } from "lucide-react";
import type { ShoppingItem } from "@/types";

interface ShoppingItemRowProps {
  item: ShoppingItem;
  storeName?: string;
  dimmed?: boolean;
  onToggle: (checked: boolean) => void;
  onToggleUrgent: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export default function ShoppingItemRow({
  item,
  storeName,
  dimmed,
  onToggle,
  onToggleUrgent,
  onDelete,
  onEdit,
}: ShoppingItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: item.checked });

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
      } ${dimmed ? "opacity-40" : ""} ${item.checked ? "opacity-60" : ""}`}
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
          {storeName && (
            <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
              <Store size={10} />
              {storeName}
            </span>
          )}
        </div>
        {item.notes && (
          <p className="text-xs text-gray-400 mt-0.5 italic line-clamp-2">{item.notes}</p>
        )}
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

      {/* Drag handle — only unchecked items are sortable.
          touch-action:none is scoped here so the rest of the item can scroll freely. */}
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
