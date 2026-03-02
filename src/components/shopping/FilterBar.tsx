"use client";

import { AlertCircle, SlidersHorizontal } from "lucide-react";

interface FilterBarProps {
  sections: string[];
  selectedSection: string | null;
  urgentOnly: boolean;
  onSectionChange: (section: string | null) => void;
  onUrgentToggle: () => void;
}

export default function FilterBar({
  sections,
  selectedSection,
  urgentOnly,
  onSectionChange,
  onUrgentToggle,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <SlidersHorizontal size={14} className="text-gray-400 flex-shrink-0" />

      {/* Urgent toggle */}
      <button
        onClick={onUrgentToggle}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-colors ${
          urgentOnly
            ? "bg-red-100 text-red-600"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        <AlertCircle size={12} />
        Urgent
      </button>

      {/* All sections */}
      <button
        onClick={() => onSectionChange(null)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-colors ${
          !selectedSection
            ? "text-white"
            : "bg-gray-100 text-gray-500"
        }`}
        style={!selectedSection ? { backgroundColor: "#FF6B6B" } : {}}
      >
        All
      </button>

      {/* Section filters */}
      {sections.map((section) => (
        <button
          key={section}
          onClick={() => onSectionChange(section === selectedSection ? null : section)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 whitespace-nowrap transition-colors ${
            selectedSection === section
              ? "text-white"
              : "bg-gray-100 text-gray-500"
          }`}
          style={selectedSection === section ? { backgroundColor: "#FF6B6B" } : {}}
        >
          {section}
        </button>
      ))}
    </div>
  );
}
