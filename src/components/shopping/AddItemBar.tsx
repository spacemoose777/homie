"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import type { ItemMemory } from "@/types";

interface AddItemBarProps {
  memory: ItemMemory[];
  onAdd: (name: string) => void;
}

export default function AddItemBar({ memory, onAdd }: AddItemBarProps) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<ItemMemory[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    const q = value.toLowerCase().trim();
    const matches = memory
      .filter((m) => m.name.toLowerCase().includes(q))
      .slice(0, 6);
    setSuggestions(matches);
  }, [value, memory]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
    setSuggestions([]);
    inputRef.current?.focus();
  }

  function pickSuggestion(suggestion: ItemMemory) {
    onAdd(suggestion.name);
    setValue("");
    setSuggestions([]);
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add item…"
          className="flex-1 px-4 py-3 bg-white rounded-2xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-coral transition-colors shadow-sm"
          style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 p-1"
          >
            <X size={14} />
          </button>
        )}
        <button
          type="submit"
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
          style={{ backgroundColor: "#FF6B6B" }}
          aria-label="Add item"
        >
          <Plus size={20} />
        </button>
      </form>

      {/* Autocomplete dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-14 mt-1 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-20">
          {suggestions.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => pickSuggestion(s)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 text-left transition-colors"
            >
              <span className="text-sm text-gray-900">{s.name}</span>
              {s.brand && <span className="text-xs text-gray-400">{s.brand}</span>}
              {s.section && (
                <span className="ml-auto text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md">
                  {s.section}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
