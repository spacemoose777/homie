"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    function handleOffline() {
      setIsOffline(true);
      setJustReconnected(false);
    }

    let reconnectTimer: ReturnType<typeof setTimeout>;
    function handleOnline() {
      setIsOffline(false);
      setJustReconnected(true);
      reconnectTimer = setTimeout(() => setJustReconnected(false), 2500);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      clearTimeout(reconnectTimer);
    };
  }, []);

  if (justReconnected) {
    return (
      <div className="fixed top-4 left-4 right-4 z-[9999] flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 shadow-lg">
        <Wifi size={14} className="text-green-500" />
        <span className="text-sm font-medium text-green-600">Back online — syncing…</span>
      </div>
    );
  }

  if (!isOffline) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[9999] flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-3 shadow-lg">
      <WifiOff size={14} className="text-amber-500" />
      <span className="text-sm font-medium text-amber-600">
        You&apos;re offline — changes will sync when you&apos;re back online
      </span>
    </div>
  );
}
