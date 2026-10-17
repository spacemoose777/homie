"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Bell, BellOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updateMemberNotificationPrefs } from "@/lib/firebase/firestore";
import { registerFCMToken, unregisterFCMToken } from "@/lib/notifications/fcm-token";
import type { NotificationPrefs } from "@/types";

const CHILD_PREFS: Array<{ key: keyof NotificationPrefs; label: string }> = [
  { key: "choreWeekStarted", label: "A new week has started" },
  { key: "choreReminder", label: "Reminder if your week isn't submitted yet" },
  { key: "choreApproved", label: "A week or job gets approved" },
  { key: "choreRedo", label: "Something's sent back to redo" },
  { key: "choreJobAdded", label: "A new paid job is added for you" },
];

const PARENT_PREFS: Array<{ key: keyof NotificationPrefs; label: string }> = [
  { key: "choreSubmitted", label: "Someone submits their week" },
  { key: "choreJobDone", label: "Someone marks a paid job done" },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className="relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0"
      style={{ backgroundColor: enabled ? "#FF6B6B" : "#d1d5db" }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
        style={{ transform: enabled ? "translateX(1.25rem)" : "translateX(0.125rem)" }}
      />
    </div>
  );
}

export default function NotificationSettingsPage() {
  const { user, householdId, memberProfile } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>({});
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [enabling, setEnabling] = useState(false);

  const isAdmin = memberProfile?.role === "admin";
  const prefItems = isAdmin ? PARENT_PREFS : CHILD_PREFS;

  useEffect(() => {
    if (memberProfile?.notificationPrefs) setPrefs(memberProfile.notificationPrefs);
  }, [memberProfile]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
  }, []);

  async function handleEnable() {
    if (!user) return;
    setEnabling(true);
    try {
      const ok = await registerFCMToken(user.uid);
      setPermission(typeof Notification !== "undefined" ? Notification.permission : "denied");
      if (!ok && Notification.permission === "denied") {
        alert("Notifications are blocked for Homie in your browser settings — enable them there to turn this on.");
      }
    } finally {
      setEnabling(false);
    }
  }

  async function handleDisable() {
    if (!user) return;
    await unregisterFCMToken(user.uid);
  }

  async function handleTogglePref(key: keyof NotificationPrefs) {
    if (!householdId || !user) return;
    const next = { ...prefs, [key]: prefs[key] === false ? true : false };
    setPrefs(next);
    await updateMemberNotificationPrefs(householdId, user.uid, next);
  }

  const pushEnabled = permission === "granted";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link
        href="/settings"
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6"
      >
        <ChevronLeft size={16} />
        Settings
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h1>

      {permission === "unsupported" ? (
        <p className="text-sm text-gray-400">
          Push notifications aren't supported in this browser.
        </p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {pushEnabled ? (
                <Bell size={16} style={{ color: "#FF6B6B" }} />
              ) : (
                <BellOff size={16} className="text-gray-400" />
              )}
              <p className="text-sm font-medium text-gray-900">Push notifications</p>
            </div>
            <Toggle
              enabled={pushEnabled}
              onToggle={() => (pushEnabled ? handleDisable() : handleEnable())}
            />
          </div>
          {permission === "denied" && (
            <p className="text-xs text-amber-600 mt-2">
              Blocked in your browser — enable notifications for Homie in your device/browser settings.
            </p>
          )}
          {enabling && <p className="text-xs text-gray-400 mt-2">Requesting permission…</p>}
        </div>
      )}

      {pushEnabled && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <p className="px-4 pt-4 pb-2 font-medium text-gray-700">Chores</p>
          {prefItems.map(({ key, label }, i) => (
            <div
              key={key}
              className={`flex items-center justify-between px-4 py-3 ${
                i < prefItems.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <p className="text-sm text-gray-700 pr-3">{label}</p>
              <Toggle enabled={prefs[key] !== false} onToggle={() => handleTogglePref(key)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
