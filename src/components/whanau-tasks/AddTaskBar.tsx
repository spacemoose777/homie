"use client";

import { useState, useRef } from "react";
import { Plus, X } from "lucide-react";

interface AddTaskBarProps {
  onAdd: (name: string) => void;
}

export default function AddTaskBar({ onAdd }: AddTaskBarProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1 min-w-0">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a task…"
          className="w-full px-4 py-3 pr-8 bg-white rounded-2xl border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors shadow-sm"
          style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <button
        type="submit"
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
        style={{ backgroundColor: "#FF6B6B" }}
        aria-label="Add task"
      >
        <Plus size={20} />
      </button>
    </form>
  );
}
