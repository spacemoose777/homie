"use client";

import { useState } from "react";
import { X, Plus, GripVertical, Trash2 } from "lucide-react";

interface AddStoreModalProps {
  onSave: (name: string, departments: string[]) => void;
  onClose: () => void;
}

const DEFAULT_DEPARTMENTS = [
  "Produce", "Meat & Seafood", "Dairy & Eggs", "Bread & Bakery",
  "Pantry", "Frozen", "Beverages", "Cleaning", "Personal Care",
];

export default function AddStoreModal({ onSave, onClose }: AddStoreModalProps) {
  const [name, setName] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDept, setNewDept] = useState("");

  function addDept() {
    const trimmed = newDept.trim();
    if (!trimmed || departments.includes(trimmed)) return;
    setDepartments((d) => [...d, trimmed]);
    setNewDept("");
  }

  function removeDept(index: number) {
    setDepartments((d) => d.filter((_, i) => i !== index));
  }

  function moveDept(from: number, to: number) {
    if (to < 0 || to >= departments.length) return;
    const arr = [...departments];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setDepartments(arr);
  }

  function loadDefaults() {
    setDepartments([...DEFAULT_DEPARTMENTS]);
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave(name.trim(), departments);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Add Store</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Store name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tesco, Lidl, Aldi"
              autoFocus
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            />
          </div>

          {/* Departments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Departments (in aisle order)
              </label>
              {departments.length === 0 && (
                <button
                  type="button"
                  onClick={loadDefaults}
                  className="text-xs font-medium"
                  style={{ color: "#FF6B6B" }}
                >
                  Load defaults
                </button>
              )}
            </div>

            {/* Dept list */}
            <div className="space-y-2 mb-3">
              {departments.map((dept, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl"
                >
                  <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-700">{dept}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveDept(i, i - 1)}
                      disabled={i === 0}
                      className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-30"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveDept(i, i + 1)}
                      disabled={i === departments.length - 1}
                      className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-30"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeDept(i)}
                      className="p-1 text-gray-300 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add dept input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDept())}
                placeholder="Add department…"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={addDept}
                className="px-3 py-2 rounded-xl text-white flex items-center gap-1 text-sm"
                style={{ backgroundColor: "#FF6B6B" }}
              >
                <Plus size={14} />
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            Save store
          </button>
        </div>
      </div>
    </div>
  );
}
