"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToCustomList,
  subscribeToCustomListItems,
  addCustomListItem,
  updateCustomListItem,
  updateCustomList,
  toggleCustomListItem,
  deleteCustomListItem,
  clearCompletedCustomListItems,
  updateCustomListItemSortOrder,
  updateCustomListItemAttachments,
} from "@/lib/firebase/firestore";
import type { CustomList, CustomListItem, ItemMemory, Attachment } from "@/types";
import CustomListView from "@/components/lists/CustomListView";
import CustomItemEditModal from "@/components/lists/CustomItemEditModal";
import CreateListModal from "@/components/lists/CreateListModal";
import AddItemBar from "@/components/shopping/AddItemBar";
import FilterBar from "@/components/shopping/FilterBar";

export default function ListDetailPage() {
  const { user, householdId } = useAuth();
  const params = useParams();
  const listId = params.listId as string;

  const [list, setList] = useState<CustomList | null>(null);
  const [items, setItems] = useState<CustomListItem[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomListItem | null>(null);
  const [editingListMeta, setEditingListMeta] = useState(false);

  useEffect(() => {
    if (!householdId) return;
    const unsub = subscribeToCustomList(householdId, listId, setList);
    return () => unsub();
  }, [householdId, listId]);

  useEffect(() => {
    if (!householdId) return;
    const unsub = subscribeToCustomListItems(householdId, listId, setItems);
    return () => unsub();
  }, [householdId, listId]);

  const knownSections = useMemo(() => {
    const s = new Set(items.map((i) => i.section).filter(Boolean) as string[]);
    return [...s].sort();
  }, [items]);

  const checkedCount = items.filter((i) => i.checked).length;

  function minUncheckedOrder(): number {
    const unchecked = items.filter((i) => !i.checked);
    if (unchecked.length === 0) return 0;
    return Math.min(...unchecked.map((i) => i.sortOrder ?? -i.createdAt.toMillis()));
  }

  async function handleAdd(name: string) {
    if (!householdId || !user) return;
    await addCustomListItem(householdId, listId, {
      name,
      brand: null,
      brandBackup: null,
      section: null,
      quantity: null,
      checked: false,
      addedBy: user.uid,
      urgent: false,
      sortOrder: minUncheckedOrder() - 1000,
    });
  }

  async function handleToggle(id: string, checked: boolean) {
    if (!householdId) return;
    await toggleCustomListItem(householdId, listId, id, checked);
  }

  async function handleDelete(id: string) {
    if (!householdId) return;
    await deleteCustomListItem(householdId, listId, id);
  }

  async function handleEditSave(
    updates: Partial<Omit<CustomListItem, "id" | "createdAt" | "addedBy">>
  ) {
    if (!householdId || !editingItem) return;
    if (updates.urgent === true && !editingItem.urgent) {
      updates.sortOrder = minUncheckedOrder() - 1000;
    }
    await updateCustomListItem(householdId, listId, editingItem.id, updates);
  }

  async function handleUpdateListMeta(name: string, emoji?: string) {
    if (!householdId) return;
    await updateCustomList(householdId, listId, { name, emoji: emoji ?? null });
  }

  async function handleClearCompleted() {
    if (!householdId) return;
    await clearCompletedCustomListItems(householdId, listId);
  }

  async function handleReorder(itemId: string, newSortOrder: number) {
    if (!householdId) return;
    await updateCustomListItemSortOrder(householdId, listId, itemId, newSortOrder);
  }

  async function handleSaveAttachments(itemId: string, attachments: Attachment[]) {
    if (!householdId) return;
    await updateCustomListItemAttachments(householdId, listId, itemId, attachments);
  }

  // No cross-list autocomplete memory — pass empty array
  const emptyMemory: ItemMemory[] = [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/lists" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {list?.emoji && <span className="text-xl leading-none">{list.emoji}</span>}
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {list?.name ?? "List"}
            </h1>
            <button
              onClick={() => setEditingListMeta(true)}
              className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
              aria-label="Edit list name"
            >
              <Pencil size={16} />
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            {items.filter((i) => !i.checked).length} items remaining
          </p>
        </div>
        {checkedCount > 0 && (
          <button
            onClick={handleClearCompleted}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <Trash2 size={14} />
            Clear {checkedCount}
          </button>
        )}
      </div>

      {/* Add item */}
      <div className="mb-4">
        <AddItemBar memory={emptyMemory} onAdd={handleAdd} />
      </div>

      {/* Filters */}
      {knownSections.length > 0 && (
        <div className="mb-4">
          <FilterBar
            sections={knownSections}
            selectedSection={selectedSection}
            urgentOnly={urgentOnly}
            onSectionChange={setSelectedSection}
            onUrgentToggle={() => setUrgentOnly((v) => !v)}
          />
        </div>
      )}

      {/* List */}
      <CustomListView
        items={items}
        selectedSection={selectedSection}
        urgentOnly={urgentOnly}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onEdit={setEditingItem}
        onReorder={handleReorder}
      />

      {/* Edit list name/emoji modal */}
      {editingListMeta && list && (
        <CreateListModal
          initialName={list.name}
          initialEmoji={list.emoji}
          onSubmit={handleUpdateListMeta}
          onClose={() => setEditingListMeta(false)}
        />
      )}

      {/* Edit item modal */}
      {editingItem && (
        <CustomItemEditModal
          item={editingItem}
          knownSections={knownSections}
          householdId={householdId ?? ""}
          listId={listId}
          onSave={handleEditSave}
          onSaveAttachments={handleSaveAttachments}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}
