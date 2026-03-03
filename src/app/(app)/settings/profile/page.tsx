"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  updateMemberName,
  updateMemberColour,
  updateMemberTheme,
  updateMemberTextSize,
} from "@/lib/firebase/firestore";
import type { ThemeKey } from "@/types";

const COLOURS = [
  "#FF6B6B", "#FF9F43", "#FFD93D", "#6BCB77", "#4D96FF",
  "#6366f1", "#EC4899", "#8B5CF6", "#14B8A6", "#F97316",
];

const THEMES: { key: ThemeKey; label: string }[] = [
  { key: "petal", label: "Petal (default)" },
  { key: "sky", label: "Sky" },
  { key: "midnight", label: "Midnight" },
  { key: "slate", label: "Slate" },
  { key: "system", label: "System" },
];

export default function ProfileSettingsPage() {
  const { user, householdId, memberProfile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [colour, setColour] = useState("#FF6B6B");
  const [theme, setTheme] = useState<ThemeKey>("petal");
  const [textSize, setTextSize] = useState<"sm" | "md" | "lg">("md");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (memberProfile) {
      setName(memberProfile.name);
      setColour(memberProfile.colour);
      setTheme(memberProfile.theme);
      setTextSize(memberProfile.textSize ?? "md");
    }
  }, [memberProfile]);

  async function handleSave() {
    if (!householdId || !user) return;
    setSaving(true);
    try {
      if (name.trim() !== memberProfile?.name) {
        await updateMemberName(householdId, user.uid, name.trim());
      }
      if (colour !== memberProfile?.colour) {
        await updateMemberColour(householdId, user.uid, colour);
      }
      if (theme !== memberProfile?.theme) {
        await updateMemberTheme(householdId, user.uid, theme);
      }
      if (textSize !== (memberProfile?.textSize ?? "md")) {
        await updateMemberTextSize(householdId, user.uid, textSize);
      }
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back */}
      <Link
        href="/settings"
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6"
      >
        <ChevronLeft size={16} />
        Settings
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      {/* Avatar preview */}
      <div className="flex justify-center mb-8">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-md"
          style={{ backgroundColor: colour }}
        >
          {(name || user?.email || "?")[0].toUpperCase()}
        </div>
      </div>

      <div className="space-y-5">
        {/* Name */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Display name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
            style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            placeholder="Your name"
          />
        </div>

        {/* Colour */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">Colour</label>
          <div className="flex flex-wrap gap-3">
            {COLOURS.map((c) => (
              <button
                key={c}
                onClick={() => setColour(c)}
                className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all"
                style={{
                  backgroundColor: c,
                  borderColor: colour === c ? "#1a1a2e" : "transparent",
                  transform: colour === c ? "scale(1.15)" : "scale(1)",
                }}
              >
                {colour === c && <Check size={16} className="text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-sm font-medium text-gray-700">Theme</p>
          {THEMES.map(({ key, label }, i) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={`w-full flex items-center justify-between px-4 py-3 hover:bg-rose-50 transition-colors ${
                i < THEMES.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <span className="text-sm text-gray-700">{label}</span>
              {theme === key && <Check size={16} style={{ color: "#FF6B6B" }} />}
            </button>
          ))}
        </div>

        {/* Text size */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-sm font-medium text-gray-700">Text size</p>
          {(["sm", "md", "lg"] as const).map((size, i) => {
            const labels = { sm: "Small", md: "Medium", lg: "Large" };
            return (
              <button
                key={size}
                onClick={() => setTextSize(size)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-rose-50 transition-colors ${
                  i < 2 ? "border-b border-gray-100" : ""
                }`}
              >
                <span className="text-sm text-gray-700">{labels[size]}</span>
                {textSize === size && <Check size={16} style={{ color: "#FF6B6B" }} />}
              </button>
            );
          })}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-2xl text-white font-medium transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ backgroundColor: saved ? "#22c55e" : "#FF6B6B" }}
        >
          {saved ? (
            <>
              <Check size={16} />
              Saved!
            </>
          ) : saving ? (
            "Saving…"
          ) : (
            "Save changes"
          )}
        </button>
      </div>
    </div>
  );
}
