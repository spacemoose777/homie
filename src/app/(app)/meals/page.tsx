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
import AddToShoppingButton from "@/components/meals/AddToShoppingButton";

type SlotTarget = { date: string; slot: keyof DayPlan } | null;

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
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

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

  async function handlePickMeal(mealId: string) {
    if (!householdId || !slotTarget) return;
    await updateDaySlot(householdId, weekStartStr, slotTarget.date, slotTarget.slot, mealId);
    setSlotTarget(null);
  }

  async function handleClearSlot(date: string, slot: keyof DayPlan) {
    if (!householdId) return;
    await updateDaySlot(householdId, weekStartStr, date, slot, null);
  }

  async function handleCreateMeal(data: { name: string; ingredients: typeof meals[0]["ingredients"]; tags: string[] }) {
    if (!householdId || !user) return;
    const mealId = await addMeal(householdId, {
      name: data.name,
      ingredients: data.ingredients,
      tags: data.tags,
      createdBy: user.uid,
    });
    // If we were picking a slot, assign to it
    if (slotTarget) {
      await updateDaySlot(householdId, weekStartStr, slotTarget.date, slotTarget.slot, mealId);
      setSlotTarget(null);
    }
    setShowCreateMeal(false);
  }

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
      />

      {/* Meal picker */}
      {slotTarget && (
        <MealPickerModal
          meals={meals}
          onPick={handlePickMeal}
          onCreateNew={() => setShowCreateMeal(true)}
          onClose={() => setSlotTarget(null)}
        />
      )}

      {/* Create meal */}
      {showCreateMeal && (
        <MealEditModal
          meal={null}
          onSave={handleCreateMeal}
          onClose={() => setShowCreateMeal(false)}
        />
      )}

      {/* Edit meal */}
      {editingMeal && (
        <MealEditModal
          meal={editingMeal}
          onSave={handleUpdateMeal}
          onClose={() => setEditingMeal(null)}
        />
      )}
    </div>
  );
}
