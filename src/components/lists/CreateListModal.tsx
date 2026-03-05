"use client";

import { useState } from "react";
import { X } from "lucide-react";

const PRESET_EMOJIS = ["🔧", "💊", "🌿", "🏠", "🎨", "📦", "🐾", "🧹", "💻", "🎁", "🧴", "🛠️"];

// Extract the first emoji/grapheme from a string
function firstGrapheme(str: string): string {
  if (!str) return "";
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new (Intl as any).Segmenter();
    const [first] = seg.segment(str);
    return first?.segment ?? str[0];
  }
  // Fallback: take first two code points (covers most emoji)
  return [...str].slice(0, 2).join("");
}

interface CreateListModalProps {
  onCreate: (name: string, emoji?: string) => void;
  onClose: () => void;
}

export default function CreateListModal({ onCreate, onClose }: CreateListModalProps) {
  const [name, setName] = useState("");
  const [preset, setPreset] = useState("");   // selected from grid
  const [custom, setCustom] = useState("");   // typed by user

  // Active emoji is whichever was set last
  const activeEmoji = custom || preset;

  function pickPreset(e: string) {
    setPreset(preset === e ? "" : e);
    setCustom("");
  }

  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const first = firstGrapheme(raw);
    setCustom(first);
    setPreset("");
  }

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, activeEmoji || undefined);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">New List</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">List name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Hardware Store, Pharmacy…"
              autoFocus
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            />
          </div>

          {/* Emoji picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon (optional)</label>

            {/* Preset grid */}
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => pickPreset(e)}
                  className="w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-colors"
                  style={{
                    borderColor: activeEmoji === e ? "#FF6B6B" : "#e5e7eb",
                    backgroundColor: activeEmoji === e ? "#FFF0F0" : "transparent",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>

            {/* Custom emoji input */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={custom}
                onChange={handleCustomChange}
                placeholder="😊"
                className="w-14 h-10 text-center text-2xl rounded-xl border-2 focus:outline-none transition-colors"
                style={{
                  borderColor: custom ? "#FF6B6B" : "#e5e7eb",
                  backgroundColor: custom ? "#FFF0F0" : "transparent",
                }}
              />
              <span className="text-sm text-gray-400">
                Or tap here and use your keyboard emoji picker
              </span>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
