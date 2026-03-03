"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, UserPlus, Copy, Check, Trash2, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getHouseholdMembers,
  getHouseholdInvites,
  createInvite,
  removeMember,
} from "@/lib/firebase/firestore";
import type { MemberProfile, Invite, UserRole } from "@/types";

export default function HouseholdSettingsPage() {
  const { user, householdId, memberProfile } = useAuth();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [invites, setInvites] = useState<Array<Invite & { token: string }>>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("member");
  const [inviting, setInviting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const isAdmin = memberProfile?.role === "admin";

  useEffect(() => {
    if (!householdId) return;
    loadData();
  }, [householdId]);

  async function loadData() {
    if (!householdId) return;
    const [m, i] = await Promise.all([
      getHouseholdMembers(householdId),
      getHouseholdInvites(householdId),
    ]);
    setMembers(m);
    setInvites(i.filter((inv) => !inv.used && inv.expiry.toDate() > new Date()));
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!householdId || !user) return;
    setInviting(true);
    try {
      const token = await createInvite(householdId, inviteEmail, inviteRole, user.uid);
      setInviteEmail("");
      await loadData();
      // Auto-copy the link
      const link = `${window.location.origin}/invite/${token}`;
      await navigator.clipboard.writeText(link);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 3000);
    } finally {
      setInviting(false);
    }
  }

  async function copyInviteLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
  }

  async function handleRemoveMember(uid: string) {
    if (!householdId) return;
    if (!confirm("Remove this member from the household?")) return;
    await removeMember(householdId, uid);
    setMembers((prev) => prev.filter((m) => m.uid !== uid));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link
        href="/settings"
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6"
      >
        <ChevronLeft size={16} />
        Settings
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Household</h1>

      {/* Members */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <p className="px-4 pt-4 pb-2 font-medium text-gray-700">Members</p>
        {members.map((m, i) => (
          <div
            key={m.uid}
            className={`flex items-center gap-3 px-4 py-3 ${
              i < members.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: m.colour }}
            >
              {m.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-gray-900">{m.name}</p>
                {m.role === "admin" && (
                  <Crown size={12} style={{ color: "#FFD93D" }} />
                )}
              </div>
              <p className="text-xs text-gray-400">{m.email}</p>
            </div>
            {isAdmin && m.uid !== user?.uid && (
              <button
                onClick={() => handleRemoveMember(m.uid)}
                className="p-2 text-gray-300 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Invite */}
      {isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <p className="font-medium text-gray-700 mb-3">Invite someone</p>
          <form onSubmit={handleInvite} className="space-y-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              placeholder="their@email.com"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ "--tw-ring-color": "#FF6B6B33" } as React.CSSProperties}
            />
            <div className="flex gap-2">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="child">Child</option>
              </select>
              <button
                type="submit"
                disabled={inviting}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60"
                style={{ backgroundColor: "#FF6B6B" }}
              >
                <UserPlus size={14} />
                {inviting ? "Sending…" : "Invite"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <p className="px-4 pt-4 pb-2 font-medium text-gray-700">Pending invites</p>
          {invites.map((inv, i) => (
            <div
              key={inv.token}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < invites.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{inv.email}</p>
                <p className="text-xs text-gray-400 capitalize">{inv.role}</p>
              </div>
              <button
                onClick={() => copyInviteLink(inv.token)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  color: copiedToken === inv.token ? "#22c55e" : "#6b7280",
                  backgroundColor: copiedToken === inv.token ? "#f0fdf4" : "#f9fafb",
                }}
              >
                {copiedToken === inv.token ? <Check size={12} /> : <Copy size={12} />}
                {copiedToken === inv.token ? "Copied!" : "Copy link"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
