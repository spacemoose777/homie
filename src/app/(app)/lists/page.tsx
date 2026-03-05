"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Plus, ChevronRight, Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToCustomLists,
  createCustomList,
  updateCustomList,
  deleteCustomList,
} from "@/lib/firebase/firestore";
import type { CustomList } from "@/types";
import CreateListModal from "@/components/lists/CreateListModal";

export default function ListsPage() {
  const { user, householdId } = useAuth();
  const [lists, setLists] = useState<CustomList[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingList, setEditingList] = useState<CustomList | null>(null);

  useEffect(() => {
    if (!householdId) return;
    const unsub = subscribeToCustomLists(householdId, setLists);
    return () => unsub();
  }, [householdId]);

  async function handleCreate(name: string, emoji?: string) {
    if (!householdId || !user) return;
    await createCustomList(householdId, { name, emoji, createdBy: user.uid });
  }

  async function handleUpdate(name: string, emoji?: string) {
    if (!householdId || !editingList) return;
    await updateCustomList(householdId, editingList.id, { name, emoji: emoji ?? null });
  }

  async function handleDelete(listId: string) {
    if (!householdId) return;
    await deleteCustomList(householdId, listId);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Other Lists</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {lists.length === 0
              ? "No lists yet"
              : `${lists.length} list${lists.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-white font-medium"
          style={{ backgroundColor: "#FF6B6B" }}
        >
          <Plus size={14} />
          New List
        </button>
      </div>

      {/* List cards */}
      {lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-gray-500 font-medium mb-1">No lists yet</p>
          <p className="text-sm text-gray-400">
            Create shared lists for hardware, pharmacy, and more
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-white font-medium"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            <Plus size={14} />
            Create your first list
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map((list) => (
            <div key={list.id} className="flex items-center gap-2">
              <Link
                href={`/lists/${list.id}`}
                className="flex-1 flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-rose-200 transition-colors"
              >
                {list.emoji ? (
                  <span className="text-2xl leading-none">{list.emoji}</span>
                ) : (
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                    style={{ backgroundColor: "#FF6B6B" }}
                  >
                    {list.name[0].toUpperCase()}
                  </div>
                )}
                <p className="flex-1 font-medium text-gray-900">{list.name}</p>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </Link>
              <button
                onClick={() => setEditingList(list)}
                className="p-2.5 text-gray-300 hover:text-gray-500 transition-colors"
                aria-label="Edit list"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(list.id)}
                className="p-2.5 text-gray-300 hover:text-red-400 transition-colors"
                aria-label="Delete list"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateListModal
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editingList && (
        <CreateListModal
          initialName={editingList.name}
          initialEmoji={editingList.emoji}
          onSubmit={handleUpdate}
          onClose={() => setEditingList(null)}
        />
      )}
    </div>
  );
}
