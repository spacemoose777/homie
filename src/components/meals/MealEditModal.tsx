"use client";

import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import type { Meal, Ingredient } from "@/types";
import IngredientsEditor from "./IngredientsEditor";

interface MealEditModalProps {
  meal: Meal | null;
  initialName?: string;
  onSave: (data: { name: string; ingredients: Ingredient[]; tags: string[] }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function MealEditModal({ meal, initialName, onSave, onDelete, onClose }: MealEditModalProps) {
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (meal) {
      setName(meal.name);
      setIngredients(meal.ingredients);
      setTags(meal.tags);
    } else {
      setName(initialName ?? "");
      setIngredients([]);
      setTags([]);
    }
  }, [meal, initialName]);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleSave() {
    if (!name.trim()) return;
    const validIngredients = ingredients.filter((i) => i.name.trim());
    onSave({ name: name.trim(), ingredients: validIngredients, tags });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">
            {meal ? "Edit Meal" : "New Meal"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meal name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spaghetti Bolognese"
              autoFocus
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            />
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
            {ingredients.length > 0 && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="flex-1 text-xs text-gray-400 font-medium">Ingredient</span>
                <span className="w-16 text-xs text-gray-400 font-medium text-center">Qty</span>
                <span className="w-16 text-xs text-gray-400 font-medium text-center">Unit</span>
                <span className="w-6" />
              </div>
            )}
            <IngredientsEditor ingredients={ingredients} onChange={setIngredients} />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="e.g. vegetarian, quick"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          {meal && onDelete && (
            <button
              onClick={onDelete}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition-colors flex-shrink-0"
              title="Delete meal"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            {meal ? "Save changes" : "Create meal"}
          </button>
        </div>
      </div>
    </div>
  );
}
