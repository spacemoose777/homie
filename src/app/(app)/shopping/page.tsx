"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToShoppingItems,
  subscribeToStores,
  addShoppingItem,
  updateShoppingItem,
  toggleShoppingItem,
  deleteShoppingItem,
  clearCompletedItems,
  loadAllItemMemory,
  updateShoppingItemSortOrder,
} from "@/lib/firebase/firestore";
import type { ShoppingItem, Store, ItemMemory } from "@/types";
import ShoppingList from "@/components/shopping/ShoppingList";
import AddItemBar from "@/components/shopping/AddItemBar";
import FilterBar from "@/components/shopping/FilterBar";
import ItemEditModal from "@/components/shopping/ItemEditModal";
import StartShoppingModal from "@/components/shopping/StartShoppingModal";

export default function ShoppingPage() {
  const { user, householdId } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [memory, setMemory] = useState<ItemMemory[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [showStartShopping, setShowStartShopping] = useState(false);

  useEffect(() => {
    if (!householdId) return;
    const unsub = subscribeToShoppingItems(householdId, setItems);
    return () => unsub();
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;
    const unsub = subscribeToStores(householdId, setStores);
    return () => unsub();
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;
    loadAllItemMemory(householdId).then(setMemory);
  }, [householdId]);

  // Distinct categories already in use — passed to ItemEditModal so users
  // can pick from their own custom categories as well as the presets
  const knownSections = useMemo(() => {
    const s = new Set(items.map((i) => i.section).filter(Boolean) as string[]);
    return [...s].sort();
  }, [items]);

  // Sections used in the list — drives the FilterBar chips
  const sections = knownSections;

  const checkedCount = items.filter((i) => i.checked).length;

  // Helper: lowest sort order among unchecked items
  function minUncheckedOrder(): number {
    const unchecked = items.filter((i) => !i.checked);
    if (unchecked.length === 0) return 0;
    return Math.min(
      ...unchecked.map((i) => i.sortOrder ?? -i.createdAt.toMillis())
    );
  }

  async function handleAdd(name: string) {
    if (!householdId || !user) return;
    // New items go to the TOP — give them a sortOrder below the current minimum
    const sortOrder = minUncheckedOrder() - 1000;
    await addShoppingItem(householdId, {
      name,
      brand: null,
      brandBackup: null,
      section: null,
      quantity: null,
      checked: false,
      addedBy: user.uid,
      urgent: false,
      onlyAtStoreId: null,
      sortOrder,
    });
  }

  async function handleToggle(id: string, checked: boolean) {
    if (!householdId) return;
    await toggleShoppingItem(householdId, id, checked);
  }

  async function handleDelete(id: string) {
    if (!householdId) return;
    await deleteShoppingItem(householdId, id);
  }

  async function handleEditSave(
    updates: Partial<Omit<ShoppingItem, "id" | "createdAt" | "addedBy">>
  ) {
    if (!householdId || !editingItem) return;

    // If urgency is being turned ON, jump the item to the top of the list
    if (updates.urgent === true && !editingItem.urgent) {
      updates.sortOrder = minUncheckedOrder() - 1000;
    }

    await updateShoppingItem(householdId, editingItem.id, updates);
  }

  async function handleClearCompleted() {
    if (!householdId) return;
    await clearCompletedItems(householdId);
  }

  async function handleReorder(itemId: string, newSortOrder: number) {
    if (!householdId) return;
    await updateShoppingItemSortOrder(householdId, itemId, newSortOrder);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {items.filter((i) => !i.checked).length} items remaining
          </p>
        </div>
        <div className="flex items-center gap-2">
          {checkedCount > 0 && (
            <button
              onClick={handleClearCompleted}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Trash2 size={14} />
              Clear {checkedCount}
            </button>
          )}
          <button
            onClick={() => setShowStartShopping(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-white font-medium"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            <ShoppingCart size={14} />
            {activeStore ? activeStore.name : "Start"}
          </button>
        </div>
      </div>

      {/* Active store banner */}
      {activeStore && (
        <div className="mb-4 flex items-center justify-between px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-100">
          <p className="text-sm font-medium" style={{ color: "#FF6B6B" }}>
            Shopping at <strong>{activeStore.name}</strong>
          </p>
          <button onClick={() => setActiveStore(null)} className="text-xs text-gray-400 hover:text-gray-600">
            Stop
          </button>
        </div>
      )}

      {/* Add item */}
      <div className="mb-4">
        <AddItemBar memory={memory} existingItems={items} onAdd={handleAdd} />
      </div>

      {/* Filters */}
      {sections.length > 0 && (
        <div className="mb-4">
          <FilterBar
            sections={sections}
            selectedSection={selectedSection}
            urgentOnly={urgentOnly}
            onSectionChange={setSelectedSection}
            onUrgentToggle={() => setUrgentOnly((v) => !v)}
          />
        </div>
      )}

      {/* List */}
      <ShoppingList
        items={items}
        stores={stores}
        selectedSection={selectedSection}
        urgentOnly={urgentOnly}
        activeStore={activeStore}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onEdit={setEditingItem}
        onReorder={handleReorder}
      />

      {/* Modals */}
      {editingItem && (
        <ItemEditModal
          item={editingItem}
          stores={stores}
          knownSections={knownSections}
          onSave={handleEditSave}
          onClose={() => setEditingItem(null)}
        />
      )}

      {showStartShopping && (
        <StartShoppingModal
          stores={stores}
          onStart={(store) => setActiveStore(store)}
          onClose={() => setShowStartShopping(false)}
        />
      )}
    </div>
  );
}
