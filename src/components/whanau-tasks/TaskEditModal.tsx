"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import type { WhanauTask, MemberProfile } from "@/types";

interface TaskEditModalProps {
  task: WhanauTask | null;
  members: MemberProfile[];
  knownCategories: string[];
  onSave: (updates: Partial<Omit<WhanauTask, "id" | "createdAt" | "addedBy">>) => void;
  onClose: () => void;
}

export const PRESET_CATEGORIES = ["Inside", "Outside", "Life admin"];

export default function TaskEditModal({ task, members, knownCategories, onSave, onClose }: TaskEditModalProps) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [owner, setOwner] = useState<string>("");
  const [urgent, setUrgent] = useState(false);
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (task) {
      setName(task.name);
      setNotes(task.notes ?? "");
      setOwner(task.owner ?? "");
      setUrgent(task.urgent ?? false);
      setCategory(task.category ?? "");
    }
  }, [task]);

  if (!task) return null;

  // Combine presets + any custom categories already in use
  const allCategories = [...new Set([...PRESET_CATEGORIES, ...knownCategories])];

  function handleSave() {
    onSave({
      name: name.trim() || task!.name,
      notes: notes.trim() || null,
      owner: owner || null,
      urgent,
      category: category.trim() || null,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">Edit Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description / notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra detail…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors resize-none"
              style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            />
          </div>

          {/* Owner */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setOwner("")}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={
                  owner === ""
                    ? { backgroundColor: "#FF6B6B", color: "white" }
                    : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                }
              >
                Unassigned
              </button>
              {members.map((m) => (
                <button
                  key={m.uid}
                  type="button"
                  onClick={() => setOwner(m.uid)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  style={
                    owner === m.uid
                      ? { backgroundColor: "#FF6B6B", color: "white" }
                      : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                  }
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                    style={{ backgroundColor: m.colour }}
                  >
                    {m.name[0].toUpperCase()}
                  </span>
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Category — free text with suggestions from datalist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              list="category-suggestions"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Inside, Outside, Life admin — or type a new one"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            />
            <datalist id="category-suggestions">
              {allCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* Urgent toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <AlertCircle size={16} className="text-red-400" />
              Urgent
            </span>
            <div
              onClick={() => setUrgent(!urgent)}
              className="relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0"
              style={{ backgroundColor: urgent ? "#FF6B6B" : "#d1d5db" }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                style={{ transform: urgent ? "translateX(1.25rem)" : "translateX(0.125rem)" }}
              />
            </div>
          </label>

          {/* Added by */}
          <p className="text-xs text-gray-400">
            Added by {members.find((m) => m.uid === task.addedBy)?.name ?? "someone"}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
