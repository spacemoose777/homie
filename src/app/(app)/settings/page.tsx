"use client";

import Link from "next/link";
import { User, Home, Store, Calendar, ChevronRight, LogOut, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePWAInstall } from "@/contexts/PWAInstallContext";

const SETTINGS_ITEMS = [
  {
    href: "/settings/profile",
    Icon: User,
    label: "Profile",
    description: "Name, colour, theme",
  },
  {
    href: "/settings/household",
    Icon: Home,
    label: "Household",
    description: "Members, invites, child accounts",
  },
  {
    href: "/settings/stores",
    Icon: Store,
    label: "Stores",
    description: "Manage stores & department order",
  },
  {
    href: "/settings/calendar",
    Icon: Calendar,
    label: "Calendar sync",
    description: "Shared Gmail address",
  },
];

export default function SettingsPage() {
  const { user, memberProfile, signOut } = useAuth();
  const { canInstall, install } = usePWAInstall();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
            style={{ backgroundColor: memberProfile?.colour ?? "#FF6B6B" }}
          >
            {(memberProfile?.name ?? user?.email ?? "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {memberProfile?.name ?? user?.displayName ?? "You"}
            </p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <p className="text-xs text-gray-300 capitalize mt-0.5">
              {memberProfile?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Settings nav */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {SETTINGS_ITEMS.map(({ href, Icon, label, description }, i) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-4 px-4 py-4 hover:bg-rose-50 transition-colors ${
              i < SETTINGS_ITEMS.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#FFF0F0" }}
            >
              <Icon size={18} style={{ color: "#FF6B6B" }} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-400">{description}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
        ))}
      </div>

      {/* Install app */}
      {canInstall && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <p className="text-sm font-semibold text-gray-900 mb-1">Install app</p>
          <p className="text-xs text-gray-400 mb-3">Add Homie to your home screen for the best experience.</p>
          <button
            onClick={install}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            <Download size={15} />
            Add to Home Screen
          </button>
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 text-sm font-medium text-gray-500 hover:text-red-400 hover:border-red-200 transition-colors"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );
}
