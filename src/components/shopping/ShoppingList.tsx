"use client";

import { useMemo } from "react";
import type { ShoppingItem, Store } from "@/types";
import ShoppingItemRow from "./ShoppingItemRow";

interface ShoppingListProps {
  items: ShoppingItem[];
  stores: Store[];
  selectedSection: string | null;
  urgentOnly: boolean;
  activeStore: Store | null;
  onToggle: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (item: ShoppingItem) => void;
}

export default function ShoppingList({
  items,
  stores,
  selectedSection,
  urgentOnly,
  activeStore,
  onToggle,
  onDelete,
  onEdit,
}: ShoppingListProps) {
  const storeMap = useMemo(
    () => new Map(stores.map((s) => [s.id, s])),
    [stores]
  );

  const sorted = useMemo(() => {
    let filtered = [...items];

    // Apply section filter
    if (selectedSection) {
      filtered = filtered.filter((i) => i.section === selectedSection);
    }

    // Apply urgent filter
    if (urgentOnly) {
      filtered = filtered.filter((i) => i.urgent && !i.checked);
    }

    if (activeStore) {
      // Sort by department order for the active store
      const deptIndex = (item: ShoppingItem) => {
        if (!item.section) return 9999;
        const idx = activeStore.departments.findIndex(
          (d) => d.toLowerCase() === item.section?.toLowerCase()
        );
        return idx === -1 ? 9998 : idx;
      };

      return filtered.sort((a, b) => {
        // Checked items always last
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        // Items only at a different store go to bottom
        const aDimmed = a.onlyAtStoreId && a.onlyAtStoreId !== activeStore.id;
        const bDimmed = b.onlyAtStoreId && b.onlyAtStoreId !== activeStore.id;
        if (aDimmed !== bDimmed) return aDimmed ? 1 : -1;
        // Sort by department
        return deptIndex(a) - deptIndex(b);
      });
    }

    // Default sort: urgent first → unchecked → checked → alphabetical
    return filtered.sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      if ((a.urgent ?? false) !== (b.urgent ?? false)) return a.urgent ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [items, selectedSection, urgentOnly, activeStore]);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-4xl mb-3">🛒</p>
        <p className="text-gray-400 text-sm">Nothing here yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((item) => {
        const storeName = item.onlyAtStoreId
          ? storeMap.get(item.onlyAtStoreId)?.name
          : undefined;
        const dimmed = Boolean(
          activeStore &&
            item.onlyAtStoreId &&
            item.onlyAtStoreId !== activeStore.id
        );
        return (
          <ShoppingItemRow
            key={item.id}
            item={item}
            storeName={storeName}
            dimmed={dimmed}
            onToggle={(checked) => onToggle(item.id, checked)}
            onDelete={() => onDelete(item.id)}
            onEdit={() => onEdit(item)}
          />
        );
      })}
    </div>
  );
}
