"use client";

import { useEffect, useState } from "react";
import { Plus, Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToStores,
  addStore,
  updateStore,
  deleteStore,
} from "@/lib/firebase/firestore";
import type { Store as StoreType } from "@/types";
import StoreCard from "@/components/stores/StoreCard";
import AddStoreModal from "@/components/stores/AddStoreModal";

export default function StoresPage() {
  const { householdId } = useAuth();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!householdId) return;
    const unsub = subscribeToStores(householdId, setStores);
    return () => unsub();
  }, [householdId]);

  async function handleAdd(name: string, departments: string[]) {
    if (!householdId) return;
    await addStore(householdId, { name, departments });
  }

  async function handleDelete(storeId: string) {
    if (!householdId) return;
    await deleteStore(householdId, storeId);
  }

  async function handleUpdateDepartments(storeId: string, departments: string[]) {
    if (!householdId) return;
    await updateStore(householdId, storeId, { departments });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage stores and their department order
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-medium"
          style={{ backgroundColor: "#FF6B6B" }}
        >
          <Plus size={16} />
          Add store
        </button>
      </div>

      {/* Stores list */}
      {stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "#FFF0F0" }}
          >
            <Store size={28} style={{ color: "#FF6B6B" }} />
          </div>
          <p className="font-medium text-gray-700 mb-1">No stores yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Add a store to sort your shopping list by aisle order
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            Add your first store
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onDelete={() => handleDelete(store.id)}
              onUpdateDepartments={(departments) =>
                handleUpdateDepartments(store.id, departments)
              }
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddStoreModal
          onSave={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
