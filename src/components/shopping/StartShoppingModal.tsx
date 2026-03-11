"use client";

import { useState } from "react";
import { X, ShoppingCart } from "lucide-react";
import type { Store } from "@/types";

interface StartShoppingModalProps {
  stores: Store[];
  onStart: (store: Store | null) => void;
  onClose: () => void;
}

export default function StartShoppingModal({ stores, onStart, onClose }: StartShoppingModalProps) {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  function handleStart() {
    const store = stores.find((s) => s.id === selectedStoreId) ?? null;
    onStart(store);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} style={{ color: "#FF6B6B" }} />
            <h2 className="font-semibold text-gray-900">Start Shopping</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-gray-500 mb-4">
            Pick a store to sort your list by its department order.
          </p>

          <div className="space-y-2">
            {/* No store option */}
            <button
              onClick={() => setSelectedStoreId(null)}
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
                onClick={() => setSelectedStoreId(store.id)}
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
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
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
