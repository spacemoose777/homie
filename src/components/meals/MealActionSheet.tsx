"use client";

import { X, Pencil, CalendarArrowUp, Trash2 } from "lucide-react";

interface MealActionSheetProps {
  mealName: string;
  onEdit: () => void;
  onReschedule: () => void;
  onRemove: () => void;
  onClose: () => void;
}

export default function MealActionSheet({
  mealName,
  onEdit,
  onReschedule,
  onRemove,
  onClose,
}: MealActionSheetProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Meal name */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="font-semibold text-gray-900 truncate pr-4">{mealName}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Actions */}
        <div className="p-3 space-y-1">
          <button
            onClick={onEdit}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <Pencil size={18} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-900">Edit meal details</span>
          </button>
          <button
            onClick={onReschedule}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <CalendarArrowUp size={18} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-900">Move to a different slot</span>
          </button>
          <button
            onClick={onRemove}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-left"
          >
            <Trash2 size={18} className="text-red-400" />
            <span className="text-sm font-medium text-red-500">Remove from this day</span>
          </button>
        </div>
      </div>
    </div>
  );
}
