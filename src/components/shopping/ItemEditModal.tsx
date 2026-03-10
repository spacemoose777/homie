"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, AlertCircle } from "lucide-react";
import type { ShoppingItem, Store, Attachment } from "@/types";
import AttachmentSection from "@/components/shared/AttachmentSection";

interface ItemEditModalProps {
  item: ShoppingItem | null;
  stores: Store[];
  knownSections: string[];
  householdId: string;
  onSave: (updates: Partial<Omit<ShoppingItem, "id" | "createdAt" | "addedBy">>) => void;
  onSaveAttachments: (itemId: string, attachments: Attachment[]) => Promise<void>;
  onClose: () => void;
}

const PRESET_SECTIONS = [
  "Produce", "Meat & Seafood", "Dairy & Eggs", "Bread & Bakery",
  "Pantry", "Frozen", "Beverages", "Snacks", "Cleaning", "Personal Care",
  "Baby", "Pet", "Other",
];

export default function ItemEditModal({ item, stores, knownSections, householdId, onSave, onSaveAttachments, onClose }: ItemEditModalProps) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [brandBackup, setBrandBackup] = useState("");
  const [section, setSection] = useState("");
  const [quantity, setQuantity] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [onlyAtStoreId, setOnlyAtStoreId] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item) {
      setName(item.name);
      setBrand(item.brand ?? "");
      setBrandBackup(item.brandBackup ?? "");
      setSection(item.section ?? "");
      setQuantity(item.quantity ?? "");
      setUrgent(item.urgent ?? false);
      setOnlyAtStoreId(item.onlyAtStoreId ?? "");
      setNotes(item.notes ?? "");
    }
  }, [item]);

  if (!item) return null;

  // Combine presets + any custom sections already in use
  const allSections = [...new Set([...PRESET_SECTIONS, ...knownSections])].sort();

  function handleSave() {
    onSave({
      name: name.trim() || item!.name,
      brand: brand.trim() || null,
      brandBackup: brandBackup.trim() || null,
      section: section.trim() || null,
      quantity: quantity.trim() || null,
      urgent,
      onlyAtStoreId: onlyAtStoreId || null,
      notes: notes.trim() || null,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Edit Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            />
          </div>

          {/* Brand */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Heinz"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Backup brand</label>
              <input
                type="text"
                value={brandBackup}
                onChange={(e) => setBrandBackup(e.target.value)}
                placeholder="e.g. Aldi own"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Category — free text with suggestions from datalist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              list="section-suggestions"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. Produce, Dairy — or type a new one"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            />
            <datalist id="section-suggestions">
              {allSections.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 2, 500g, 1 litre"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            />
          </div>

          {/* Urgent toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <AlertCircle size={16} className="text-red-400" />
              Urgent — needed right away
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

          {/* Only at store */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Only available at</label>
            {stores.length > 0 ? (
              <select
                value={onlyAtStoreId}
                onChange={(e) => setOnlyAtStoreId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 transition-colors"
                style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
              >
                <option value="">— Available anywhere —</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-gray-400 py-2">
                <Link href="/settings/stores" className="underline" style={{ color: "#FF6B6B" }}>
                  Add stores in Settings
                </Link>{" "}
                to tag items as store-specific.
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra info — size, colour, where to find it…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors resize-none"
              style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            />
          </div>

          {/* Attachments */}
          <AttachmentSection
            attachments={item.attachments ?? []}
            storagePath={`households/${householdId}/shoppingItems/${item.id}`}
            onSave={(atts) => onSaveAttachments(item.id, atts)}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
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
