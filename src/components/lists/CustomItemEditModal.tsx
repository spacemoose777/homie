"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import type { CustomListItem, Attachment } from "@/types";
import AttachmentSection from "@/components/shared/AttachmentSection";

interface CustomItemEditModalProps {
  item: CustomListItem | null;
  knownSections: string[];
  householdId: string;
  listId: string;
  onSave: (updates: Partial<Omit<CustomListItem, "id" | "createdAt" | "addedBy">>) => void;
  onSaveAttachments: (itemId: string, attachments: Attachment[]) => Promise<void>;
  onClose: () => void;
}

const PRESET_SECTIONS = [
  "Produce", "Meat & Seafood", "Dairy & Eggs", "Bread & Bakery",
  "Pantry", "Frozen", "Beverages", "Snacks", "Cleaning", "Personal Care",
  "Baby", "Pet", "Hardware", "Medications", "Other",
];

export default function CustomItemEditModal({ item, knownSections, householdId, listId, onSave, onSaveAttachments, onClose }: CustomItemEditModalProps) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [brandBackup, setBrandBackup] = useState("");
  const [section, setSection] = useState("");
  const [quantity, setQuantity] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item) {
      setName(item.name);
      setBrand(item.brand ?? "");
      setBrandBackup(item.brandBackup ?? "");
      setSection(item.section ?? "");
      setQuantity(item.quantity ?? "");
      setUrgent(item.urgent ?? false);
      setNotes(item.notes ?? "");
    }
  }, [item]);

  if (!item) return null;

  const allSections = [...new Set([...PRESET_SECTIONS, ...knownSections])].sort();

  function handleSave() {
    onSave({
      name: name.trim() || item!.name,
      brand: brand.trim() || null,
      brandBackup: brandBackup.trim() || null,
      section: section.trim() || null,
      quantity: quantity.trim() || null,
      urgent,
      notes: notes.trim() || null,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">Edit Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
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
                placeholder="e.g. own brand"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              list="custom-section-suggestions"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. Hardware, Medications — or type a new one"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            />
            <datalist id="custom-section-suggestions">
              {allSections.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 2, 500ml"
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

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra info…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors resize-none"
              style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            />
          </div>

          {/* Attachments */}
          <AttachmentSection
            attachments={item.attachments ?? []}
            storagePath={`households/${householdId}/customLists/${listId}/items/${item.id}`}
            onSave={(atts) => onSaveAttachments(item.id, atts)}
          />
        </div>

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
