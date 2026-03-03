"use client";

import { useState } from "react";
import { X, Search, Plus } from "lucide-react";
import type { Meal } from "@/types";

interface MealPickerModalProps {
  meals: Meal[];
  onPick: (mealId: string) => void;
  onCreateNew: () => void;
  onQuickCreate: (name: string) => void;
  onClose: () => void;
}

export default function MealPickerModal({
  meals,
  onPick,
  onCreateNew,
  onQuickCreate,
  onClose,
}: MealPickerModalProps) {
  const [search, setSearch] = useState("");

  const filtered = meals.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Pick a meal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meals…"
              autoFocus
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              {search ? "No meals match" : "No meals yet"}
            </p>
          ) : (
            filtered.map((meal) => (
              <button
                key={meal.id}
                onClick={() => { onPick(meal.id); onClose(); }}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-rose-50 text-left transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{meal.name}</p>
                  {meal.tags.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">{meal.tags.join(", ")}</p>
                  )}
                  {meal.ingredients.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {meal.ingredients.length} ingredient{meal.ingredients.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Quick create / full editor */}
        <div className="border-t border-gray-100 px-4 py-3 space-y-2">
          {search.trim() && (
            <button
              onClick={() => { onQuickCreate(search.trim()); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: "#FF6B6B" }}
            >
              <Plus size={16} />
              Add &ldquo;{search.trim()}&rdquo;
            </button>
          )}
          <button
            onClick={onCreateNew}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-dashed border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors"
          >
            <Plus size={16} />
            Create with details…
          </button>
        </div>
      </div>
    </div>
  );
}
