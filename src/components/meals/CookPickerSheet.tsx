"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { MemberProfile } from "@/types";

interface CookPickerSheetProps {
  members: MemberProfile[];
  currentCook: string | null;
  onSelect: (cook: string | null) => void;
  onClose: () => void;
}

export default function CookPickerSheet({
  members,
  currentCook,
  onSelect,
  onClose,
}: CookPickerSheetProps) {
  const [customText, setCustomText] = useState("");

  function handleMember(name: string) {
    onSelect(name === currentCook ? null : name);
    onClose();
  }

  function handleCustom() {
    const t = customText.trim();
    if (!t) return;
    onSelect(t);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl shadow-xl w-full max-w-md px-5 pt-5 pb-8"
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Who&apos;s cooking?</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Household members */}
        {members.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {members.map((m) => {
              const active = currentCook === m.name;
              return (
                <button
                  key={m.uid}
                  onClick={() => handleMember(m.name)}
                  className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
                  style={
                    active
                      ? { backgroundColor: "#FF6B6B", borderColor: "#FF6B6B", color: "#fff" }
                      : { borderColor: "#e5e7eb", color: "#374151" }
                  }
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Free text for guests / others */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustom()}
            placeholder="Someone else…"
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
            style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
          />
          <button
            onClick={handleCustom}
            disabled={!customText.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Set
          </button>
        </div>

        {/* Clear option */}
        {currentCook && (
          <button
            onClick={() => {
              onSelect(null);
              onClose();
            }}
            className="mt-4 w-full py-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            Remove cook
          </button>
        )}
      </div>
    </div>
  );
}
