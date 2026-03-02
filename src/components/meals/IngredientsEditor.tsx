"use client";

import { Plus, X } from "lucide-react";
import type { Ingredient } from "@/types";

interface IngredientsEditorProps {
  ingredients: Ingredient[];
  onChange: (ingredients: Ingredient[]) => void;
}

export default function IngredientsEditor({ ingredients, onChange }: IngredientsEditorProps) {
  function updateIngredient(index: number, field: keyof Ingredient, value: string) {
    const updated = ingredients.map((ing, i) =>
      i === index ? { ...ing, [field]: value || null } : ing
    );
    onChange(updated);
  }

  function addIngredient() {
    onChange([...ingredients, { name: "", quantity: null, unit: null }]);
  }

  function removeIngredient(index: number) {
    onChange(ingredients.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {ingredients.map((ing, i) => (
        <div key={i} className="flex items-center gap-2">
          {/* Name */}
          <input
            type="text"
            value={ing.name}
            onChange={(e) => updateIngredient(i, "name", e.target.value)}
            placeholder="Ingredient"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
            style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
          />
          {/* Quantity */}
          <input
            type="text"
            value={ing.quantity ?? ""}
            onChange={(e) => updateIngredient(i, "quantity", e.target.value)}
            placeholder="Qty"
            className="w-16 px-2 py-2 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 transition-colors"
            style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
          />
          {/* Unit */}
          <input
            type="text"
            value={ing.unit ?? ""}
            onChange={(e) => updateIngredient(i, "unit", e.target.value)}
            placeholder="Unit"
            className="w-16 px-2 py-2 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 transition-colors"
            style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
          />
          {/* Remove */}
          <button
            type="button"
            onClick={() => removeIngredient(i)}
            className="p-2 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
            aria-label="Remove ingredient"
          >
            <X size={14} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addIngredient}
        className="flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: "#FF6B6B" }}
      >
        <Plus size={16} />
        Add ingredient
      </button>
    </div>
  );
}
