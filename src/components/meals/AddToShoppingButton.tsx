"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import type { Meal, WeekPlan, ShoppingItem } from "@/types";
import { addShoppingItem } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

interface AddToShoppingButtonProps {
  meals: Meal[];
  weekPlan: WeekPlan | null;
  existingItems: ShoppingItem[];
}

function normalise(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

export default function AddToShoppingButton({
  meals,
  weekPlan,
  existingItems,
}: AddToShoppingButtonProps) {
  const { user, householdId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleAdd() {
    if (!householdId || !user || !weekPlan) return;
    setLoading(true);

    // Collect all meal IDs from the week
    const mealIds = new Set<string>();
    Object.values(weekPlan.days).forEach((day) => {
      [day.breakfast, day.lunch, day.dinner, day.snacks].forEach((id) => {
        if (id) mealIds.add(id);
      });
    });

    // Collect all ingredients (deduplicate by normalised name)
    const allIngredients = new Map<string, { name: string; quantity: string | null }>();
    for (const mealId of mealIds) {
      const meal = meals.find((m) => m.id === mealId);
      if (!meal) continue;
      for (const ing of meal.ingredients) {
        if (!ing.name.trim()) continue;
        const key = normalise(ing.name);
        if (!allIngredients.has(key)) {
          allIngredients.set(key, { name: ing.name, quantity: ing.quantity });
        }
      }
    }

    // Deduplicate against existing shopping items
    const existingNames = new Set(existingItems.map((i) => normalise(i.name)));
    const toAdd = [...allIngredients.entries()].filter(([key]) => !existingNames.has(key));

    // Bulk add
    for (const [, { name, quantity }] of toAdd) {
      await addShoppingItem(householdId, {
        name,
        brand: null,
        brandBackup: null,
        section: null,
        quantity,
        checked: false,
        addedBy: user.uid,
        urgent: false,
        onlyAtStoreId: null,
      });
    }

    setLoading(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  }

  if (done) {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-green-100 text-green-600"
      >
        <Check size={14} />
        Added!
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading || !weekPlan}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-opacity"
      style={{ backgroundColor: "#FF6B6B" }}
    >
      <ShoppingCart size={14} />
      {loading ? "Adding…" : "Add to shopping"}
    </button>
  );
}
