"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { enableNetwork, disableNetwork } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";

// Main tabs — warmed into the service worker's cache whenever we're online so
// the whole app stays reachable offline, not just whichever tabs happen to
// have been opened before. Kept in sync manually with BottomNav/Sidebar.
const OFFLINE_ROUTES = [
  "/shopping",
  "/meals",
  "/calendar",
  "/lists",
  "/whanau-tasks",
  "/hui-whanau",
  "/settings",
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, memberProfile } = useAuth();
  const router = useRouter();

  // Precache every main tab's HTML (for a full offline reload/relaunch) and
  // RSC payload (for client-side nav while offline) so the app "just works"
  // offline even on tabs the person hasn't personally opened yet. Safe to
  // call repeatedly — it's a no-op once something's already cached and fresh.
  function warmOfflineRoutes() {
    if (!navigator.onLine) return;
    OFFLINE_ROUTES.forEach((route) => {
      router.prefetch(route);
      fetch(route, { credentials: "same-origin" }).catch(() => {});
    });
  }

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Recycle Firestore's WebSocket when the app returns from background or
  // when network connectivity is restored. Without this, a stale connection
  // causes Firestore to hang waiting for network responses even though the
  // socket is dead — the symptom is the app freezing until wifi is toggled.
  useEffect(() => {
    async function refreshConnection() {
      try {
        await disableNetwork(db);
        await enableNetwork(db);
      } catch {
        // best-effort — Firestore will retry automatically
      }
      warmOfflineRoutes();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") refreshConnection();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", refreshConnection);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", refreshConnection);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also warm the cache right away on sign-in, rather than waiting for the
  // first visibility/online event.
  useEffect(() => {
    if (user) warmOfflineRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Apply theme and text-size to the root <html> element
  useEffect(() => {
    const theme = memberProfile?.theme ?? "petal";
    const textSize = memberProfile?.textSize ?? "md";

    if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.dataset.theme = isDark ? "midnight" : "petal";
    } else {
      document.documentElement.dataset.theme = theme;
    }
    document.documentElement.dataset.textsize = textSize;
  }, [memberProfile?.theme, memberProfile?.textSize]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "#FF6B6B", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* Main content area — offset by sidebar on desktop */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen min-w-0">
        {/* pb accounts for fixed bottom nav (4rem) + device safe area (home indicator).
            On desktop the nav is hidden so we reset to pb-0. */}
        <main
          className="flex-1 md:pb-0"
          style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
