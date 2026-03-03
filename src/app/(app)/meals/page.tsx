"use client";

import { useEffect, useState } from "react";
import { startOfWeek } from "date-fns";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToMeals,
  subscribeToWeekPlan,
  subscribeToShoppingItems,
  subscribeToHousehold,
  addMeal,
  updateMeal,
  deleteMeal,
  updateDaySlot,
} from "@/lib/firebase/firestore";
import type { Meal, WeekPlan, DayPlan, ShoppingItem, Household } from "@/types";
import WeekView from "@/components/meals/WeekView";
import MealPickerModal from "@/components/meals/MealPickerModal";
import MealEditModal from "@/components/meals/MealEditModal";
import MealActionSheet from "@/components/meals/MealActionSheet";
import RescheduleModal from "@/components/meals/RescheduleModal";
import AddToShoppingButton from "@/components/meals/AddToShoppingButton";

type SlotTarget = { date: string; slot: keyof DayPlan } | null;
type ViewingSlot = { mealId: string; date: string; slot: keyof DayPlan } | null;

export default function MealsPage() {
  const { user, householdId } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [slotTarget, setSlotTarget] = useState<SlotTarget>(null);
  const [showCreateMeal, setShowCreateMeal] = useState(false);
  const [createInitialName, setCreateInitialName] = useState("");
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [viewingSlot, setViewingSlot] = useState<ViewingSlot>(null);
  const [rescheduling, setRescheduling] = useState<ViewingSlot>(null);

  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  useEffect(() => {
    if (!householdId) return;
    const unsub = subscribeToMeals(householdId, setMeals);
    return () => unsub();
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;
    const unsub = subscribeToWeekPlan(householdId, weekStartStr, setWeekPlan);
    return () => unsub();
  }, [householdId, weekStartStr]);

  useEffect(() => {
    if (!householdId) return;
    const unsub = subscribeToShoppingItems(householdId, setShoppingItems);
    return () => unsub();
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;
    const unsub = subscribeToHousehold(householdId, setHousehold);
    return () => unsub();
  }, [householdId]);

  const mealSlots = household?.mealSlots ?? ["dinner"];
  const mealMap = new Map(meals.map((m) => [m.id, m]));

  // ── Picker / add-to-slot ─────────────────────────────────────────

  async function handlePickMeal(mealId: string) {
    if (!householdId || !slotTarget) return;
    await updateDaySlot(householdId, weekStartStr, slotTarget.date, slotTarget.slot, mealId);
    setSlotTarget(null);
  }

  async function handleClearSlot(date: string, slot: keyof DayPlan) {
    if (!householdId) return;
    await updateDaySlot(householdId, weekStartStr, date, slot, null);
  }

  async function handleQuickCreateMeal(name: string) {
    if (!householdId || !user) return;
    const slot = slotTarget;
    const mealId = await addMeal(householdId, { name, ingredients: [], tags: [], createdBy: user.uid });
    if (slot) {
      await updateDaySlot(householdId, weekStartStr, slot.date, slot.slot, mealId);
    }
  }

  async function handleCreateMeal(data: { name: string; ingredients: typeof meals[0]["ingredients"]; tags: string[] }) {
    if (!householdId || !user) return;
    const slot = slotTarget;
    setSlotTarget(null);
    setShowCreateMeal(false);
    setCreateInitialName("");
    const mealId = await addMeal(householdId, {
      name: data.name,
      ingredients: data.ingredients,
      tags: data.tags,
      createdBy: user.uid,
    });
    if (slot) {
      await updateDaySlot(householdId, weekStartStr, slot.date, slot.slot, mealId);
    }
  }

  // ── Edit existing meal ───────────────────────────────────────────

  async function handleUpdateMeal(data: { name: string; ingredients: typeof meals[0]["ingredients"]; tags: string[] }) {
    if (!householdId || !editingMeal) return;
    await updateMeal(householdId, editingMeal.id, data);
    setEditingMeal(null);
  }

  async function handleDeleteMeal() {
    if (!householdId || !editingMeal) return;
    await deleteMeal(householdId, editingMeal.id);
    setEditingMeal(null);
  }

  // ── Tap meal in planner → action sheet ──────────────────────────

  function handleMealTap(mealId: string, date: string, slot: keyof DayPlan) {
    setViewingSlot({ mealId, date, slot });
  }

  function handleActionEdit() {
    if (!viewingSlot) return;
    const meal = mealMap.get(viewingSlot.mealId);
    setEditingMeal(meal ?? null);
    setViewingSlot(null);
  }

  function handleActionReschedule() {
    setRescheduling(viewingSlot);
    setViewingSlot(null);
  }

  async function handleActionRemove() {
    if (!householdId || !viewingSlot) return;
    await updateDaySlot(householdId, weekStartStr, viewingSlot.date, viewingSlot.slot, null);
    setViewingSlot(null);
  }

  // ── Reschedule ───────────────────────────────────────────────────

  async function handleReschedule(toDate: string, toSlot: keyof DayPlan) {
    if (!householdId || !rescheduling) return;
    // Clear from original slot, assign to new slot
    await updateDaySlot(householdId, weekStartStr, rescheduling.date, rescheduling.slot, null);
    await updateDaySlot(householdId, weekStartStr, toDate, toSlot, rescheduling.mealId);
    setRescheduling(null);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meals</h1>
          <p className="text-sm text-gray-400 mt-0.5">Plan your week</p>
        </div>
        <AddToShoppingButton
          meals={meals}
          weekPlan={weekPlan}
          existingItems={shoppingItems}
        />
      </div>

      {/* Week view */}
      <WeekView
        meals={meals}
        weekPlan={weekPlan}
        weekStart={weekStart}
        mealSlots={mealSlots}
        onWeekChange={setWeekStart}
        onPickMeal={(date, slot) => setSlotTarget({ date, slot })}
        onClearSlot={handleClearSlot}
        onMealTap={handleMealTap}
      />

      {/* Meal picker */}
      {slotTarget && !showCreateMeal && (
        <MealPickerModal
          meals={meals}
          onPick={handlePickMeal}
          onCreateNew={(name) => { setCreateInitialName(name); setShowCreateMeal(true); }}
          onQuickCreate={handleQuickCreateMeal}
          onClose={() => setSlotTarget(null)}
        />
      )}

      {/* Create meal (with optional pre-filled name) */}
      {showCreateMeal && (
        <MealEditModal
          meal={null}
          initialName={createInitialName}
          onSave={handleCreateMeal}
          onClose={() => { setShowCreateMeal(false); setCreateInitialName(""); }}
        />
      )}

      {/* Edit existing meal */}
      {editingMeal && (
        <MealEditModal
          meal={editingMeal}
          onSave={handleUpdateMeal}
          onClose={() => setEditingMeal(null)}
        />
      )}

      {/* Action sheet — shown when tapping a meal in the planner */}
      {viewingSlot && (
        <MealActionSheet
          mealName={mealMap.get(viewingSlot.mealId)?.name ?? ""}
          onEdit={handleActionEdit}
          onReschedule={handleActionReschedule}
          onRemove={handleActionRemove}
          onClose={() => setViewingSlot(null)}
        />
      )}

      {/* Reschedule modal */}
      {rescheduling && (
        <RescheduleModal
          mealName={mealMap.get(rescheduling.mealId)?.name ?? ""}
          weekStart={weekStart}
          weekPlan={weekPlan}
          mealSlots={mealSlots}
          fromDate={rescheduling.date}
          fromSlot={rescheduling.slot}
          onMove={handleReschedule}
          onClose={() => setRescheduling(null)}
        />
      )}
    </div>
  );
}
