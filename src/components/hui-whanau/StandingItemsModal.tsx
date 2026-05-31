"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface StandingItemsModalProps {
  items: string[];
  onSave: (items: string[]) => void;
  onClose: () => void;
}

export default function StandingItemsModal({
  items: initialItems,
  onSave,
  onClose,
}: StandingItemsModalProps) {
  const [items, setItems] = useState<string[]>(initialItems);
  const [newItem, setNewItem] = useState("");

  function addItem() {
    const t = newItem.trim();
    if (!t) return;
    setItems([...items, t]);
    setNewItem("");
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl shadow-xl w-full max-w-md"
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Standing Agenda Items</h3>
            <p className="text-xs text-gray-400 mt-0.5">Included in every meeting</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pt-4">
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 py-2 mb-3">No standing items yet.</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {items.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex-1 text-sm text-gray-700">{item}</span>
                  <button
                    onClick={() => removeItem(i)}
                    className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="Add a standing item…"
              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            />
            <button
              onClick={addItem}
              disabled={!newItem.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Add
            </button>
          </div>

          <button
            onClick={() => onSave(items)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
