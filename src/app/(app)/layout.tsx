"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, memberProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

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
