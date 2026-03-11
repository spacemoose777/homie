"use client";

import { useState } from "react";
import { Plus, Search, CalendarPlus, Pencil } from "lucide-react";
import type { Meal } from "@/types";

interface Props {
  meals: Meal[];
  onEdit: (meal: Meal) => void;
  onSchedule: (meal: Meal) => void;
  onAddNew: () => void;
}

export default function MealLibraryView({ meals, onEdit, onSchedule, onAddNew }: Props) {
  const [search, setSearch] = useState("");

  const filtered = meals.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      {/* Search + Add */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meals…"
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
          />
        </div>
        <button
          onClick={onAddNew}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-white flex-shrink-0"
          style={{ backgroundColor: "#FF6B6B" }}
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Meal list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-2xl mb-2">🍽️</p>
          <p className="text-sm font-medium text-gray-500">
            {search ? "No meals match" : "No meals yet"}
          </p>
          {!search && (
            <p className="text-xs mt-1">
              Save your household&rsquo;s favourite meals here
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((meal) => (
            <div
              key={meal.id}
              className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-lg flex-shrink-0">
                🍽️
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{meal.name}</p>
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  {meal.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {meal.ingredients.length > 0 && (
                    <span className="text-[10px] text-gray-400">
                      {meal.ingredients.length} ingredient
                      {meal.ingredients.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => onSchedule(meal)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  title="Schedule"
                >
                  <CalendarPlus size={18} />
                </button>
                <button
                  onClick={() => onEdit(meal)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
