"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X, Mic, MicOff } from "lucide-react";
import type { ItemMemory, ShoppingItem } from "@/types";

interface AddItemBarProps {
  memory: ItemMemory[];
  existingItems?: ShoppingItem[];
  onAdd: (name: string, mem?: ItemMemory) => void;
}

function normalise(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

const isSpeechSupported =
  typeof window !== "undefined" &&
  !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );

export default function AddItemBar({ memory, existingItems, onAdd }: AddItemBarProps) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<ItemMemory[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Duplicate detection — match against any unchecked item
  const duplicate = value.trim() && existingItems
    ? (existingItems.find(
        (item) => !item.checked && normalise(item.name) === normalise(value)
      ) ?? null)
    : null;

  // Autocomplete
  useEffect(() => {
    if (value.trim().length < 1) { setSuggestions([]); return; }
    const q = value.toLowerCase().trim();
    setSuggestions(memory.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 6));
  }, [value, memory]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    // Apply stored memory fields (section, brand, etc.) if this name is recognised
    const mem = memory.find((m) => normalise(m.name) === normalise(trimmed));
    onAdd(trimmed, mem);
    setValue("");
    setSuggestions([]);
    inputRef.current?.focus();
  }

  function pickSuggestion(s: ItemMemory) {
    onAdd(s.name, s);
    setValue("");
    setSuggestions([]);
    inputRef.current?.focus();
  }

  // ── Voice recognition ──────────────────────────────────────────────────────

  function startListening() {
    if (!isSpeechSupported) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final) {
        setValue(final.trim());
        setInterimTranscript("");
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;
      inputRef.current?.focus();
    };

    recognition.onerror = () => {
      setIsListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
  }

  // Display value: show interim transcript while listening, real value otherwise
  const displayValue = isListening && interimTranscript ? interimTranscript : value;

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        {/* Input + autocomplete wrapper */}
        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={(e) => { if (!isListening) setValue(e.target.value); }}
            readOnly={isListening}
            placeholder={isListening ? "Listening…" : "Add item…"}
            className="w-full px-4 py-3 pr-8 bg-white rounded-2xl border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-coral transition-colors shadow-sm"
            style={{
              "--tw-ring-color": "#FF6B6B33",
              color: isListening ? "#9ca3af" : "#111827",
              fontStyle: isListening ? "italic" : "normal",
            } as React.CSSProperties}
          />
          {value && !isListening && (
            <button
              type="button"
              onClick={() => setValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
            >
              <X size={14} />
            </button>
          )}

          {/* Autocomplete dropdown */}
          {suggestions.length > 0 && !isListening && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-20">
              {suggestions.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => pickSuggestion(s)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 text-left transition-colors"
                >
                  <span className="text-sm text-gray-900">{s.name}</span>
                  {s.brand && <span className="text-xs text-gray-400">{s.brand}</span>}
                  {s.section && (
                    <span className="ml-auto text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md">
                      {s.section}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mic button — only shown if browser supports speech recognition */}
        {isSpeechSupported && (
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              backgroundColor: isListening ? "#FF6B6B" : "#f3f4f6",
              color: isListening ? "white" : "#6b7280",
              animation: isListening ? "pulse 1.5s ease-in-out infinite" : "none",
            }}
            aria-label={isListening ? "Stop listening" : "Add item by voice"}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}

        {/* Add button */}
        <button
          type="submit"
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
          style={{ backgroundColor: "#FF6B6B" }}
          aria-label="Add item"
        >
          <Plus size={20} />
        </button>
      </form>

      {/* Duplicate warning */}
      {duplicate && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <span>⚠️</span>
          <span><strong>{duplicate.name}</strong> is already on your list</span>
        </div>
      )}
    </div>
  );
}
