"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { findInviteByToken, joinHousehold, markInviteUsed } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import HomieLogo from "@/components/HomieLogo";
import type { UserRole } from "@/types";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const token = params.token as string;

  const [status, setStatus] = useState<"loading" | "valid" | "invalid">("loading");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    async function checkInvite() {
      try {
        const result = await findInviteByToken(token);
        if (!result) {
          setStatus("invalid");
          return;
        }
        if (result.invite.used || result.invite.expiry.toDate() < new Date()) {
          setStatus("invalid");
          return;
        }
        setStatus("valid");
      } catch (err) {
        console.error("[InvitePage] Error validating invite:", err);
        setStatus("invalid");
      }
    }
    checkInvite();
  }, [token]);

  async function handleJoinAsLoggedInUser() {
    if (!user) return;
    setJoining(true);
    setJoinError("");
    try {
      const result = await findInviteByToken(token);
      if (!result) {
        setJoinError("Invite not found or expired.");
        return;
      }
      if (result.invite.used) {
        setJoinError("This invite has already been used.");
        return;
      }
      if (result.invite.expiry.toDate() < new Date()) {
        setJoinError("This invite has expired.");
        return;
      }
      await joinHousehold(
        result.householdId,
        user.uid,
        user.email ?? "",
        user.displayName ?? user.email ?? "",
        result.invite.role as UserRole
      );
      await markInviteUsed(result.householdId, token);
      await refreshProfile();
      router.replace("/shopping");
    } catch (err) {
      console.error("[InvitePage] Error joining household:", err);
      setJoinError("Something went wrong. Please try again.");
    } finally {
      setJoining(false);
    }
  }

  if (status === "loading" || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "#FF6B6B", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <HomieLogo size={48} showWordmark className="mb-8" />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-sm w-full text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">Invite not found</p>
          <p className="text-sm text-gray-500 mb-6">
            This invite link is invalid, expired, or has already been used.
          </p>
          <Link
            href="/login"
            className="block w-full py-2.5 rounded-xl text-white font-medium text-center"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <HomieLogo size={48} showWordmark className="mb-8" />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-sm w-full text-center">
        <p className="text-2xl mb-2">🏠</p>
        <p className="text-lg font-semibold text-gray-900 mb-2">You&apos;re invited!</p>
        <p className="text-sm text-gray-500 mb-6">
          Join your household on Homie to share shopping lists, meals, and calendar events.
        </p>

        {joinError && (
          <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-4">{joinError}</p>
        )}

        {user ? (
          // Already logged in — join directly
          <button
            onClick={handleJoinAsLoggedInUser}
            disabled={joining}
            className="block w-full py-2.5 rounded-xl text-white font-medium text-center disabled:opacity-60"
            style={{ backgroundColor: "#FF6B6B" }}
          >
            {joining ? "Joining…" : "Join household"}
          </button>
        ) : (
          // Not logged in — send to register or login with token preserved
          <div className="space-y-3">
            <Link
              href={`/register?invite=${token}`}
              className="block w-full py-2.5 rounded-xl text-white font-medium text-center"
              style={{ backgroundColor: "#FF6B6B" }}
            >
              Create account &amp; join
            </Link>
            <Link
              href={`/login?invite=${token}`}
              className="block w-full py-2.5 rounded-xl font-medium text-center border border-gray-200 text-gray-700"
            >
              Sign in &amp; join
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
