"use client";

import { useState } from "react";
import { Trash2, GripVertical, ChevronUp, ChevronDown, Store } from "lucide-react";
import type { Store as StoreType } from "@/types";

interface StoreCardProps {
  store: StoreType;
  onDelete: () => void;
  onUpdateDepartments: (departments: string[]) => void;
}

export default function StoreCard({ store, onDelete, onUpdateDepartments }: StoreCardProps) {
  const [expanded, setExpanded] = useState(false);

  function moveDept(from: number, to: number) {
    if (to < 0 || to >= store.departments.length) return;
    const arr = [...store.departments];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onUpdateDepartments(arr);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#FFF0F0" }}
        >
          <Store size={16} style={{ color: "#FF6B6B" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{store.name}</p>
          <p className="text-xs text-gray-400">
            {store.departments.length} department{store.departments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg text-xs"
          >
            {expanded ? "Hide" : "Departments"}
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg"
            aria-label="Delete store"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Departments */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3">
          {store.departments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">No departments added</p>
          ) : (
            <div className="space-y-1.5">
              {store.departments.map((dept, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl"
                >
                  <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium flex-shrink-0">
                    {i + 1}
                  </span>
                  <GripVertical size={12} className="text-gray-300 flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-700">{dept}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => moveDept(i, i - 1)}
                      disabled={i === 0}
                      className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-30 rounded"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveDept(i, i + 1)}
                      disabled={i === store.departments.length - 1}
                      className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-30 rounded"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
