"use client";

import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
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
  onReorder: (itemId: string, newSortOrder: number) => void;
}

// Items without explicit sortOrder fall back to newest-first via createdAt
function getSortOrder(item: ShoppingItem): number {
  return item.sortOrder ?? -item.createdAt.toMillis();
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
  onReorder,
}: ShoppingListProps) {
  const storeMap = useMemo(
    () => new Map(stores.map((s) => [s.id, s])),
    [stores]
  );

  // With a dedicated handle, no delay needed — activate on movement > 5 px
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } })
  );

  const sorted = useMemo(() => {
    let filtered = [...items];

    if (selectedSection) {
      filtered = filtered.filter((i) => i.section === selectedSection);
    }
    if (urgentOnly) {
      filtered = filtered.filter((i) => i.urgent && !i.checked);
    }

    if (activeStore) {
      const deptIndex = (item: ShoppingItem) => {
        if (!item.section) return 9999;
        const idx = activeStore.departments.findIndex(
          (d) => d.toLowerCase() === item.section?.toLowerCase()
        );
        return idx === -1 ? 9998 : idx;
      };
      return filtered.sort((a, b) => {
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        const aDimmed = a.onlyAtStoreId && a.onlyAtStoreId !== activeStore.id;
        const bDimmed = b.onlyAtStoreId && b.onlyAtStoreId !== activeStore.id;
        if (aDimmed !== bDimmed) return aDimmed ? 1 : -1;
        return deptIndex(a) - deptIndex(b);
      });
    }

    // Default: checked last, urgent unchecked pinned to top, then by sortOrder
    return filtered.sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      if (!a.checked && !b.checked) {
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
      }
      return getSortOrder(a) - getSortOrder(b);
    });
  }, [items, selectedSection, urgentOnly, activeStore]);

  const uncheckedIds = useMemo(
    () => sorted.filter((i) => !i.checked).map((i) => i.id),
    [sorted]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const unchecked = sorted.filter((i) => !i.checked);
    const oldIndex = unchecked.findIndex((i) => i.id === active.id);
    const newIndex = unchecked.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(unchecked, oldIndex, newIndex);

    const prevOrder = newIndex > 0 ? getSortOrder(reordered[newIndex - 1]) : null;
    const nextOrder =
      newIndex < reordered.length - 1 ? getSortOrder(reordered[newIndex + 1]) : null;

    let newSortOrder: number;
    if (prevOrder === null && nextOrder === null) {
      newSortOrder = 0;
    } else if (prevOrder === null) {
      newSortOrder = nextOrder! - 1000;
    } else if (nextOrder === null) {
      newSortOrder = prevOrder + 1000;
    } else {
      newSortOrder = (prevOrder + nextOrder) / 2;
    }

    onReorder(active.id as string, newSortOrder);
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-4xl mb-3">🛒</p>
        <p className="text-gray-400 text-sm">Nothing here yet</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={uncheckedIds} strategy={verticalListSortingStrategy}>
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
      </SortableContext>
    </DndContext>
  );
}
