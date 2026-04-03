"use client";

import { useState, useMemo } from "react";
import { X, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import type { Store, ShoppingItem } from "@/types";

interface StartShoppingModalProps {
  stores: Store[];
  items: ShoppingItem[];
  onStart: (store: Store | null) => void;
  onClose: () => void;
}

export default function StartShoppingModal({ stores, items, onStart, onClose }: StartShoppingModalProps) {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  function handleStart() {
    const store = stores.find((s) => s.id === selectedStoreId) ?? null;
    onStart(store);
    onClose();
  }

  const selectedStore = stores.find((s) => s.id === selectedStoreId) ?? null;

  // Sort unchecked items by the selected store's department order
  const previewItems = useMemo(() => {
    if (!selectedStore) return [];
    const unchecked = items.filter((i) => !i.checked);
    const getDeptIndex = (item: ShoppingItem) => {
      if (!item.section) return 9999;
      const idx = selectedStore.departments.findIndex(
        (d) => d.toLowerCase() === item.section?.toLowerCase()
      );
      return idx === -1 ? 9998 : idx;
    };
    return [...unchecked].sort((a, b) => getDeptIndex(a) - getDeptIndex(b));
  }, [selectedStore, items]);

  // Group sorted items by department for display
  const previewGroups = useMemo(() => {
    const groups: { dept: string; items: ShoppingItem[] }[] = [];
    for (const item of previewItems) {
      const dept = item.section ?? "Other";
      const existing = groups.find((g) => g.dept === dept);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({ dept, items: [item] });
      }
    }
    return groups;
  }, [previewItems]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col max-h-[85dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} style={{ color: "#FF6B6B" }} />
            <h2 className="font-semibold text-gray-900">Start Shopping</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1">
          <p className="text-sm text-gray-500 mb-4">
            Pick a store to sort your list by its department order.
          </p>

          <div className="space-y-2">
            {/* No store option */}
            <button
              onClick={() => { setSelectedStoreId(null); setShowPreview(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                selectedStoreId === null
                  ? "border-coral bg-rose-50"
                  : "border-gray-200 bg-white"
              }`}
              style={selectedStoreId === null ? { borderColor: "#FF6B6B" } : {}}
            >
              <span className="text-sm font-medium text-gray-700">No store (default order)</span>
            </button>

            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => { setSelectedStoreId(store.id); setShowPreview(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                  selectedStoreId === store.id
                    ? "border-coral bg-rose-50"
                    : "border-gray-200 bg-white"
                }`}
                style={selectedStoreId === store.id ? { borderColor: "#FF6B6B" } : {}}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{store.name}</p>
                  {store.departments.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {store.departments.slice(0, 3).join(" → ")}
                      {store.departments.length > 3 && " …"}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Preview order section */}
          {selectedStore && previewItems.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowPreview((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-medium w-full text-left"
                style={{ color: "#FF6B6B" }}
              >
                {showPreview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showPreview ? "Hide" : "Preview"} order ({previewItems.length} items)
              </button>

              {showPreview && (
                <div className="mt-3 space-y-3">
                  {previewGroups.map((group) => (
                    <div key={group.dept}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                        {group.dept}
                      </p>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl"
                          >
                            <span className="text-sm text-gray-800 flex-1">{item.name}</span>
                            {item.quantity && (
                              <span className="text-xs text-gray-400">× {item.quantity}</span>
                            )}
                            {item.urgent && (
                              <span className="text-xs font-medium text-red-500">Urgent</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleStart}
            className="w-full py-2.5 rounded-xl text-white font-medium"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            Start shopping
          </button>
        </div>
      </div>
    </div>
  );
}
