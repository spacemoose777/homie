"use client";

import { AlertCircle, SlidersHorizontal } from "lucide-react";

interface TaskFilterBarProps {
  categories: string[];
  selectedCategory: string | null;
  urgentOnly: boolean;
  onCategoryChange: (category: string | null) => void;
  onUrgentToggle: () => void;
}

export default function TaskFilterBar({
  categories,
  selectedCategory,
  urgentOnly,
  onCategoryChange,
  onUrgentToggle,
}: TaskFilterBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <SlidersHorizontal size={14} className="text-gray-400 flex-shrink-0" />

      {/* Urgent toggle */}
      <button
        onClick={onUrgentToggle}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-colors ${
          urgentOnly
            ? "bg-red-100 text-red-600"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        <AlertCircle size={12} />
        Urgent
      </button>

      {/* All categories */}
      <button
        onClick={() => onCategoryChange(null)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-colors ${
          !selectedCategory
            ? "text-white"
            : "bg-gray-100 text-gray-500"
        }`}
        style={!selectedCategory ? { backgroundColor: "#FF6B6B" } : {}}
      >
        All
      </button>

      {/* Category filters */}
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category === selectedCategory ? null : category)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 whitespace-nowrap transition-colors ${
            selectedCategory === category
              ? "text-white"
              : "bg-gray-100 text-gray-500"
          }`}
          style={selectedCategory === category ? { backgroundColor: "#FF6B6B" } : {}}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
