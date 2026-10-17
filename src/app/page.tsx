"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function RootPage() {
  const { loading, memberProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    // Sam (child role) lands straight on Chores; everyone else on Shopping,
    // same as before.
    router.replace(memberProfile?.role === "child" ? "/chores" : "/shopping");
  }, [loading, memberProfile, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: "#FF6B6B", borderTopColor: "transparent" }}
      />
    </div>
  );
}
