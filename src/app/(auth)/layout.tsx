"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, householdId, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for both user AND householdId before redirecting.
    // This prevents the layout from firing a redirect mid-signUp, before
    // joinHousehold/createHousehold has finished writing to Firestore.
    if (!loading && user && householdId) {
      router.replace("/shopping");
    }
  }, [user, householdId, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-coral border-t-transparent animate-spin" style={{ borderColor: "#FF6B6B", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (user && householdId) return null;

  return <>{children}</>;
}
