"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToWhanauTasks,
  getHouseholdMembers,
  addWhanauTask,
  updateWhanauTask,
  toggleWhanauTask,
  deleteWhanauTask,
  clearCompletedWhanauTasks,
  updateWhanauTaskSortOrder,
} from "@/lib/firebase/firestore";
import type { WhanauTask, MemberProfile } from "@/types";
import TaskList from "@/components/whanau-tasks/TaskList";
import AddTaskBar from "@/components/whanau-tasks/AddTaskBar";
import TaskFilterBar from "@/components/whanau-tasks/TaskFilterBar";
import TaskEditModal, { PRESET_CATEGORIES } from "@/components/whanau-tasks/TaskEditModal";

export default function WhanauTasksPage() {
  const { user, householdId } = useAuth();
  const [tasks, setTasks] = useState<WhanauTask[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [editingTask, setEditingTask] = useState<WhanauTask | null>(null);

  useEffect(() => {
    if (!householdId) return;
    const unsub = subscribeToWhanauTasks(householdId, setTasks);
    return () => unsub();
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;
    getHouseholdMembers(householdId).then(setMembers);
  }, [householdId]);

  // Distinct categories already in use — merged with presets for the filter bar
  // and passed to TaskEditModal so people can pick their own custom categories too.
  const knownCategories = useMemo(() => {
    const c = new Set(tasks.map((t) => t.category).filter(Boolean) as string[]);
    return [...c].sort();
  }, [tasks]);

  const categories = useMemo(
    () => [...new Set([...PRESET_CATEGORIES, ...knownCategories])],
    [knownCategories]
  );

  const checkedCount = tasks.filter((t) => t.checked).length;

  // Helper: lowest sort order among unchecked tasks
  function minUncheckedOrder(): number {
    const unchecked = tasks.filter((t) => !t.checked);
    if (unchecked.length === 0) return 0;
    return Math.min(
      ...unchecked.map((t) => t.sortOrder ?? -t.createdAt.toMillis())
    );
  }

  async function handleAdd(name: string) {
    if (!householdId || !user) return;
    // New tasks go to the TOP — give them a sortOrder below the current minimum
    const sortOrder = minUncheckedOrder() - 1000;
    await addWhanauTask(householdId, {
      name,
      notes: null,
      owner: null,
      category: null,
      urgent: false,
      checked: false,
      addedBy: user.uid,
      sortOrder,
    });
  }

  async function handleToggle(id: string, checked: boolean) {
    if (!householdId) return;
    await toggleWhanauTask(householdId, id, checked);
  }

  async function handleDelete(id: string) {
    if (!householdId) return;
    await deleteWhanauTask(householdId, id);
  }

  async function handleEditSave(
    updates: Partial<Omit<WhanauTask, "id" | "createdAt" | "addedBy">>
  ) {
    if (!householdId || !editingTask) return;

    // If urgency is being turned ON, jump the task to the top of the list
    if (updates.urgent === true && !editingTask.urgent) {
      updates.sortOrder = minUncheckedOrder() - 1000;
    }

    await updateWhanauTask(householdId, editingTask.id, updates);
  }

  async function handleClearCompleted() {
    if (!householdId) return;
    await clearCompletedWhanauTasks(householdId);
  }

  async function handleToggleUrgent(id: string, urgent: boolean) {
    if (!householdId) return;
    const updates: Partial<Omit<WhanauTask, "id" | "createdAt" | "addedBy">> = { urgent };
    if (urgent) updates.sortOrder = minUncheckedOrder() - 1000;
    await updateWhanauTask(householdId, id, updates);
  }

  async function handleReorder(taskId: string, newSortOrder: number) {
    if (!householdId) return;
    await updateWhanauTaskSortOrder(householdId, taskId, newSortOrder);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Whānau Tasks</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {tasks.filter((t) => !t.checked).length} tasks remaining
          </p>
        </div>
        {checkedCount > 0 && (
          <button
            onClick={handleClearCompleted}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Trash2 size={14} />
            Clear {checkedCount}
          </button>
        )}
      </div>

      {/* Add task */}
      <div className="mb-4">
        <AddTaskBar onAdd={handleAdd} />
      </div>

      {/* Filters */}
      {categories.length > 0 && (
        <div className="mb-4">
          <TaskFilterBar
            categories={categories}
            selectedCategory={selectedCategory}
            urgentOnly={urgentOnly}
            onCategoryChange={setSelectedCategory}
            onUrgentToggle={() => setUrgentOnly((v) => !v)}
          />
        </div>
      )}

      {/* List */}
      <TaskList
        tasks={tasks}
        members={members}
        selectedCategory={selectedCategory}
        urgentOnly={urgentOnly}
        onToggle={handleToggle}
        onToggleUrgent={handleToggleUrgent}
        onDelete={handleDelete}
        onEdit={setEditingTask}
        onReorder={handleReorder}
      />

      {/* Modals */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          members={members}
          knownCategories={knownCategories}
          onSave={handleEditSave}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
